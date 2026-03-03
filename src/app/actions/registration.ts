"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  equipmentRegistrationSchema,
  type EquipmentRegistrationInput,
} from "@/lib/validations/equipos";
import type { ActionState } from "@/types/actions";

// ── Complete Arrival Phase ─────────────────────────────────────────────

export async function completeArrival(
  reporteId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reportes")
    .update({ llegada_completada: true })
    .eq("id", reporteId);

  if (error) {
    return { error: "Error al completar llegada: " + error.message };
  }

  revalidatePath("/tecnico");
  return { success: true };
}

// ── Complete Site Overview Phase ────────────────────────────────────────

export async function completeSiteOverview(
  reporteId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reportes")
    .update({ sitio_completado: true })
    .eq("id", reporteId);

  if (error) {
    return { error: "Error al completar vista del sitio: " + error.message };
  }

  revalidatePath("/tecnico");
  return { success: true };
}

// ── Check if Orden Has Site Photo ──────────────────────────────────────

export async function checkOrdenSitePhoto(
  ordenServicioId: string
): Promise<{ exists: boolean; photoUrl?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { exists: false };
  }

  // Step 1: Get all report IDs for this orden
  const { data: reportes, error: reportesError } = await supabase
    .from("reportes")
    .select("id")
    .eq("orden_servicio_id", ordenServicioId);

  if (reportesError || !reportes || reportes.length === 0) {
    return { exists: false };
  }

  const reporteIds = reportes.map((r) => r.id);

  // Step 2: Find a site photo across all reports for this orden
  const { data: foto, error: fotoError } = await supabase
    .from("reporte_fotos")
    .select("url")
    .in("reporte_id", reporteIds)
    .eq("etiqueta", "sitio")
    .limit(1)
    .maybeSingle();

  if (fotoError || !foto) {
    return { exists: false };
  }

  return { exists: true, photoUrl: foto.url };
}

// ── Save Equipment Registration (Nameplate Data) ──────────────────────

export async function saveEquipmentRegistration(
  equipoId: string,
  reporteEquipoId: string,
  data: EquipmentRegistrationInput
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  // Validate input with Zod
  const result = equipmentRegistrationSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "Datos invalidos";
    return { error: firstError };
  }

  // Build update object from non-null/non-empty fields only
  const updateData: Record<string, string> = {};
  const validated = result.data;

  for (const [key, value] of Object.entries(validated)) {
    if (value !== undefined && value !== null && value !== "") {
      updateData[key] = value;
    }
  }

  // Update equipos table (even if updateData is empty, we still check completeness)
  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabase
      .from("equipos")
      .update(updateData)
      .eq("id", equipoId);

    if (updateError) {
      return {
        error: "Error al guardar datos del equipo: " + updateError.message,
      };
    }
  }

  // Evaluate registration completeness
  const isComplete = await evaluateRegistrationCompleteness(
    supabase,
    equipoId,
    reporteEquipoId
  );

  // Update registro_completado on reporte_equipos
  const { error: statusError } = await supabase
    .from("reporte_equipos")
    .update({ registro_completado: isComplete })
    .eq("id", reporteEquipoId);

  if (statusError) {
    return {
      error: "Error al actualizar estado de registro: " + statusError.message,
    };
  }

  revalidatePath("/tecnico");
  return { success: true, data: { complete: isComplete } };
}

// ── Check if ALL Equipment Registration is Complete for Report ─────────

export async function checkRegistrationComplete(
  reporteId: string
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: entries, error } = await supabase
    .from("reporte_equipos")
    .select("registro_completado")
    .eq("reporte_id", reporteId);

  if (error || !entries || entries.length === 0) {
    return false;
  }

  return entries.every((entry) => entry.registro_completado === true);
}

// ── Update Registration Status After Photo Upload ─────────────────────

export async function updateRegistrationStatus(
  reporteEquipoId: string,
  equipoId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  // Re-evaluate registration completeness
  const isComplete = await evaluateRegistrationCompleteness(
    supabase,
    equipoId,
    reporteEquipoId
  );

  // Update registro_completado
  const { error } = await supabase
    .from("reporte_equipos")
    .update({ registro_completado: isComplete })
    .eq("id", reporteEquipoId);

  if (error) {
    return {
      error: "Error al actualizar estado de registro: " + error.message,
    };
  }

  revalidatePath("/tecnico");
  return { success: true, data: { complete: isComplete } };
}

// ── Private: Evaluate Registration Completeness ───────────────────────

const REQUIRED_FIELDS = [
  "marca",
  "modelo",
  "numero_serie",
  "capacidad",
  "refrigerante",
  "voltaje",
  "fase",
  "ubicacion",
] as const;

const REQUIRED_PHOTO_ETIQUETAS = ["equipo_general", "placa"] as const;

async function evaluateRegistrationCompleteness(
  supabase: Awaited<ReturnType<typeof createClient>>,
  equipoId: string,
  reporteEquipoId: string
): Promise<boolean> {
  // Check 1: All required fields are filled on the equipment
  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .select(REQUIRED_FIELDS.join(", "))
    .eq("id", equipoId)
    .single();

  if (equipoError || !equipo) {
    return false;
  }

  const equipoRecord = equipo as unknown as Record<string, string | null>;
  const allFieldsFilled = REQUIRED_FIELDS.every((field) => {
    const value = equipoRecord[field];
    return value !== null && value !== undefined && value.trim() !== "";
  });

  if (!allFieldsFilled) {
    return false;
  }

  // Check 2: Required photos exist (equipo_general + placa)
  // Look across all reports for the same orden to find these photos
  // First get the orden_servicio_id through reporte_equipos -> reportes
  const { data: reporteEquipo, error: reError } = await supabase
    .from("reporte_equipos")
    .select("reporte_id")
    .eq("id", reporteEquipoId)
    .single();

  if (reError || !reporteEquipo) {
    return false;
  }

  const { data: reporte, error: repError } = await supabase
    .from("reportes")
    .select("orden_servicio_id")
    .eq("id", reporteEquipo.reporte_id)
    .single();

  if (repError || !reporte) {
    return false;
  }

  // Get all report IDs for this orden
  const { data: allReportes, error: allRepError } = await supabase
    .from("reportes")
    .select("id")
    .eq("orden_servicio_id", reporte.orden_servicio_id);

  if (allRepError || !allReportes || allReportes.length === 0) {
    return false;
  }

  const allReporteIds = allReportes.map((r) => r.id);

  // Check for both required photo types for this equipment
  const { data: photos, error: photoError } = await supabase
    .from("reporte_fotos")
    .select("etiqueta")
    .in("reporte_id", allReporteIds)
    .eq("equipo_id", equipoId)
    .in("etiqueta", [...REQUIRED_PHOTO_ETIQUETAS]);

  if (photoError || !photos) {
    return false;
  }

  const foundEtiquetas = new Set(photos.map((p) => p.etiqueta));
  const allPhotosExist = REQUIRED_PHOTO_ETIQUETAS.every((etiqueta) =>
    foundEtiquetas.has(etiqueta)
  );

  return allPhotosExist;
}
