"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deepCopyFromPreviousReport } from "@/app/actions/reportes";

export async function adminCreateReport(
  ordenServicioId: string,
  fecha: string
): Promise<{ reporteId: string } | { error: string }> {
  // 1. Verify admin role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // 2. Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { error: "Formato de fecha invalido" };
  }

  // 3. Check no duplicate report for this ODS+date
  const { data: existing } = await supabase
    .from("reportes")
    .select("id")
    .eq("orden_servicio_id", ordenServicioId)
    .eq("fecha", fecha)
    .maybeSingle();

  if (existing) {
    return { error: "Ya existe un reporte para esta orden en la fecha seleccionada" };
  }

  // 4. Get sucursal_id from ODS
  const { data: orden, error: ordenError } = await supabase
    .from("ordenes_servicio")
    .select("sucursal_id")
    .eq("id", ordenServicioId)
    .single();

  if (ordenError || !orden) {
    return { error: "Orden de servicio no encontrada" };
  }

  // 5. Compute next revision number
  const { count: existingCount } = await supabase
    .from("reportes")
    .select("*", { count: "exact", head: true })
    .eq("orden_servicio_id", ordenServicioId);
  const nextRevision = (existingCount ?? 0) + 1;

  // 6. Check if any previous report already completed site overview
  const { data: prevSiteCheck } = await supabase
    .from("reportes")
    .select("sitio_completado")
    .eq("orden_servicio_id", ordenServicioId)
    .eq("sitio_completado", true)
    .limit(1)
    .maybeSingle();

  const carryForwardSite = !!prevSiteCheck;

  // 7. Insert report with admin as creator
  const { data: newReport, error: insertError } = await supabase
    .from("reportes")
    .insert({
      orden_servicio_id: ordenServicioId,
      creado_por: user.id,
      sucursal_id: orden.sucursal_id,
      fecha,
      estatus: "en_progreso",
      sitio_completado: carryForwardSite,
      numero_revision: nextRevision,
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: "Error al crear reporte: " + insertError.message };
  }

  // 8. Deep copy from previous report (or populate from orden_equipos)
  await deepCopyFromPreviousReport(supabase, ordenServicioId, newReport.id, fecha);

  revalidatePath("/admin/ordenes-servicio");
  revalidatePath("/admin/reportes");

  return { reporteId: newReport.id };
}
