"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  reporteEquipoSchema,
  reporteMaterialSchema,
  reporteStatusSchema,
} from "@/lib/validations/reportes";
import { z } from "zod";
import type { ActionState } from "@/types/actions";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Get or Create Today's Report ────────────────────────────────────────

export async function getOrCreateTodayReport(
  folioId: string
): Promise<{ reporteId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const today = new Date().toISOString().split("T")[0];

  // Check for existing report for this folio today
  const { data: existing, error: selectError } = await supabase
    .from("reportes")
    .select("id")
    .eq("folio_id", folioId)
    .eq("fecha", today)
    .maybeSingle();

  if (selectError) {
    return { error: "Error al buscar reporte: " + selectError.message };
  }

  if (existing) {
    return { reporteId: existing.id };
  }

  // Get folio's sucursal_id for the new report
  const { data: folio, error: folioError } = await supabase
    .from("folios")
    .select("sucursal_id")
    .eq("id", folioId)
    .single();

  if (folioError || !folio) {
    return { error: "Folio no encontrado" };
  }

  // Insert new report
  const { data: newReport, error: insertError } = await supabase
    .from("reportes")
    .insert({
      folio_id: folioId,
      creado_por: user.id,
      sucursal_id: folio.sucursal_id,
      fecha: today,
      estatus: "en_progreso",
    })
    .select("id")
    .single();

  if (insertError) {
    // Handle race condition: another team member created the report simultaneously
    if (insertError.code === "23505") {
      const { data: raceReport, error: raceError } = await supabase
        .from("reportes")
        .select("id")
        .eq("folio_id", folioId)
        .eq("fecha", today)
        .maybeSingle();

      if (raceError || !raceReport) {
        return { error: "Error al crear reporte (conflicto)" };
      }

      return { reporteId: raceReport.id };
    }

    return { error: "Error al crear reporte: " + insertError.message };
  }

  // Pre-fill equipment entries from previous report
  await preFillFromPreviousReport(supabase, folioId, newReport.id, today);

  return { reporteId: newReport.id };
}

// ── Pre-fill from Previous Report (private) ─────────────────────────────

async function preFillFromPreviousReport(
  supabase: SupabaseClient,
  folioId: string,
  newReporteId: string,
  today: string
): Promise<void> {
  // Find the most recent previous report for this folio
  const { data: previousReport } = await supabase
    .from("reportes")
    .select("id")
    .eq("folio_id", folioId)
    .lt("fecha", today)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!previousReport) {
    return;
  }

  // Copy equipment entries (equipo_id + tipo_trabajo only, text fields start fresh)
  const { data: previousEntries } = await supabase
    .from("reporte_equipos")
    .select("equipo_id, tipo_trabajo")
    .eq("reporte_id", previousReport.id);

  if (!previousEntries || previousEntries.length === 0) {
    return;
  }

  const newEntries = previousEntries.map((entry) => ({
    reporte_id: newReporteId,
    equipo_id: entry.equipo_id,
    tipo_trabajo: entry.tipo_trabajo,
  }));

  await supabase.from("reporte_equipos").insert(newEntries);
}

// ── Save Equipment Entry ────────────────────────────────────────────────

export async function saveEquipmentEntry(
  reporteId: string,
  entryId: string | null,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  // Validate with Zod
  const rawData = {
    equipo_id: formData.get("equipo_id"),
    tipo_trabajo: formData.get("tipo_trabajo"),
    diagnostico: formData.get("diagnostico"),
    trabajo_realizado: formData.get("trabajo_realizado"),
    observaciones: formData.get("observaciones"),
  };

  const result = reporteEquipoSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // Prepare data — empty strings become null
  const data = {
    equipo_id: result.data.equipo_id,
    tipo_trabajo: result.data.tipo_trabajo,
    diagnostico: result.data.diagnostico || null,
    trabajo_realizado: result.data.trabajo_realizado || null,
    observaciones: result.data.observaciones || null,
  };

  if (entryId) {
    // Update existing entry
    const { error } = await supabase
      .from("reporte_equipos")
      .update(data)
      .eq("id", entryId);

    if (error) {
      return { error: "Error al actualizar entrada: " + error.message };
    }
  } else {
    // Insert new entry
    const { error } = await supabase.from("reporte_equipos").insert({
      reporte_id: reporteId,
      ...data,
    });

    if (error) {
      return { error: "Error al guardar entrada: " + error.message };
    }
  }

  revalidatePath("/tecnico");
  return { success: true, message: "Guardado" };
}

// ── Remove Equipment Entry ──────────────────────────────────────────────

export async function removeEquipmentEntry(
  entryId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reporte_equipos")
    .delete()
    .eq("id", entryId);

  if (error) {
    return { error: "Error al eliminar entrada: " + error.message };
  }

  revalidatePath("/tecnico");
  return { success: true, message: "Entrada eliminada" };
}

// ── Save Materials ──────────────────────────────────────────────────────

export async function saveMaterials(
  reporteId: string,
  materials: { cantidad: number; unidad: string; descripcion: string }[]
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  // Validate each material
  for (let i = 0; i < materials.length; i++) {
    const result = reporteMaterialSchema.safeParse(materials[i]);
    if (!result.success) {
      const flattened = z.flattenError(result.error);
      const fieldErrors = flattened.fieldErrors as Record<string, string[] | undefined>;
      const firstField = Object.keys(fieldErrors)[0];
      const firstError = firstField
        ? fieldErrors[firstField]?.[0]
        : "Datos invalidos";
      return {
        error: `Material ${i + 1}: ${firstError}`,
      };
    }
  }

  // Delete all existing materials for this report (delete-all + re-insert pattern)
  const { error: deleteError } = await supabase
    .from("reporte_materiales")
    .delete()
    .eq("reporte_id", reporteId);

  if (deleteError) {
    return { error: "Error al actualizar materiales: " + deleteError.message };
  }

  // Insert all materials (if any)
  if (materials.length > 0) {
    const rows = materials.map((m) => ({
      reporte_id: reporteId,
      cantidad: m.cantidad,
      unidad: m.unidad,
      descripcion: m.descripcion,
    }));

    const { error: insertError } = await supabase
      .from("reporte_materiales")
      .insert(rows);

    if (insertError) {
      return { error: "Error al guardar materiales: " + insertError.message };
    }
  }

  revalidatePath("/tecnico");
  return { success: true, message: "Materiales guardados" };
}

// ── Update Report Status ────────────────────────────────────────────────

export async function updateReportStatus(
  reporteId: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  // Validate status
  const rawData = {
    estatus: formData.get("estatus"),
  };

  const result = reporteStatusSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  const newStatus = result.data.estatus;

  // If completing, verify at least one equipment entry exists
  if (newStatus === "completado") {
    const { count, error: countError } = await supabase
      .from("reporte_equipos")
      .select("id", { count: "exact", head: true })
      .eq("reporte_id", reporteId);

    if (countError) {
      return { error: "Error al verificar entradas de equipo" };
    }

    if (!count || count === 0) {
      return {
        error:
          "No se puede completar un reporte sin entradas de equipo",
      };
    }
  }

  // Update report status
  const { data: report, error: updateError } = await supabase
    .from("reportes")
    .update({ estatus: newStatus })
    .eq("id", reporteId)
    .select("folio_id")
    .single();

  if (updateError) {
    return {
      error: "Error al actualizar estatus: " + updateError.message,
    };
  }

  // Sync folio status to match report status
  if (report?.folio_id) {
    await supabase
      .from("folios")
      .update({ estatus: newStatus })
      .eq("id", report.folio_id);
  }

  revalidatePath("/tecnico");
  revalidatePath("/admin/folios");
  return { success: true, message: "Estatus actualizado" };
}
