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
  ordenServicioId: string
): Promise<
  | {
      reporteId: string;
      llegada_completada: boolean;
      sitio_completado: boolean;
    }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const today = new Date().toISOString().split("T")[0];

  // Check for existing report for this orden today
  const { data: existing, error: selectError } = await supabase
    .from("reportes")
    .select("id, llegada_completada, sitio_completado")
    .eq("orden_servicio_id", ordenServicioId)
    .eq("fecha", today)
    .maybeSingle();

  if (selectError) {
    return { error: "Error al buscar reporte: " + selectError.message };
  }

  if (existing) {
    return {
      reporteId: existing.id,
      llegada_completada: existing.llegada_completada ?? false,
      sitio_completado: existing.sitio_completado ?? false,
    };
  }

  // Get orden's sucursal_id for the new report
  const { data: orden, error: ordenError } = await supabase
    .from("ordenes_servicio")
    .select("sucursal_id")
    .eq("id", ordenServicioId)
    .single();

  if (ordenError || !orden) {
    return { error: "Orden de servicio no encontrada" };
  }

  // Check if any previous report on this orden already completed site overview
  const { data: prevSiteCheck } = await supabase
    .from("reportes")
    .select("sitio_completado")
    .eq("orden_servicio_id", ordenServicioId)
    .eq("sitio_completado", true)
    .limit(1)
    .maybeSingle();

  const carryForwardSite = !!prevSiteCheck;

  // Insert new report
  const { data: newReport, error: insertError } = await supabase
    .from("reportes")
    .insert({
      orden_servicio_id: ordenServicioId,
      creado_por: user.id,
      sucursal_id: orden.sucursal_id,
      fecha: today,
      estatus: "en_progreso",
      sitio_completado: carryForwardSite,
    })
    .select("id")
    .single();

  if (insertError) {
    // Handle race condition: another team member created the report simultaneously
    if (insertError.code === "23505") {
      const { data: raceReport, error: raceError } = await supabase
        .from("reportes")
        .select("id, llegada_completada, sitio_completado")
        .eq("orden_servicio_id", ordenServicioId)
        .eq("fecha", today)
        .maybeSingle();

      if (raceError || !raceReport) {
        return { error: "Error al crear reporte (conflicto)" };
      }

      return {
        reporteId: raceReport.id,
        llegada_completada: raceReport.llegada_completada ?? false,
        sitio_completado: raceReport.sitio_completado ?? false,
      };
    }

    return { error: "Error al crear reporte: " + insertError.message };
  }

  // Pre-fill equipment entries from previous report
  await preFillFromPreviousReport(supabase, ordenServicioId, newReport.id, today);

  return {
    reporteId: newReport.id,
    llegada_completada: false,
    sitio_completado: carryForwardSite,
  };
}

// ── Pre-fill from Previous Report (private) ─────────────────────────────

async function preFillFromPreviousReport(
  supabase: SupabaseClient,
  ordenServicioId: string,
  newReporteId: string,
  today: string
): Promise<void> {
  // Find the most recent previous report for this orden
  const { data: previousReport } = await supabase
    .from("reportes")
    .select("id")
    .eq("orden_servicio_id", ordenServicioId)
    .lt("fecha", today)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousReport) {
    // Copy equipment entries from previous report (equipo_id + tipo_trabajo only, text fields start fresh)
    const { data: previousEntries } = await supabase
      .from("reporte_equipos")
      .select("equipo_id, tipo_trabajo")
      .eq("reporte_id", previousReport.id);

    if (previousEntries && previousEntries.length > 0) {
      const newEntries = previousEntries.map((entry) => ({
        reporte_id: newReporteId,
        equipo_id: entry.equipo_id,
        tipo_trabajo: entry.tipo_trabajo,
      }));

      await supabase.from("reporte_equipos").insert(newEntries);
      return;
    }
  }

  // No previous report (or it had no equipment) — auto-populate from orden_equipos
  const { data: ordenEquipos } = await supabase
    .from("orden_equipos")
    .select("equipo_id")
    .eq("orden_servicio_id", ordenServicioId);

  if (ordenEquipos && ordenEquipos.length > 0) {
    const newEntries = ordenEquipos.map((oe) => ({
      reporte_id: newReporteId,
      equipo_id: oe.equipo_id,
      tipo_trabajo: "preventivo",
    }));

    await supabase.from("reporte_equipos").insert(newEntries);
  }
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

  // Validate status (includes firma/nombre cross-field validation for completado)
  const rawData = {
    estatus: formData.get("estatus"),
    firma_encargado: formData.get("firma_encargado") || "",
    nombre_encargado: formData.get("nombre_encargado") || "",
  };

  const result = reporteStatusSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  const newStatus = result.data.estatus;
  const firmaEncargado = result.data.firma_encargado || null;
  const nombreEncargado = result.data.nombre_encargado || null;

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

  // Build update payload -- include firma + nombre only for completado
  const updatePayload: Record<string, string | null> = {
    estatus: newStatus,
  };

  if (newStatus === "completado") {
    updatePayload.firma_encargado = firmaEncargado;
    updatePayload.nombre_encargado = nombreEncargado;
  }

  // Update report status (and firma/nombre if completado)
  const { data: report, error: updateError } = await supabase
    .from("reportes")
    .update(updatePayload)
    .eq("id", reporteId)
    .select("orden_servicio_id")
    .single();

  if (updateError) {
    return {
      error: "Error al actualizar estatus: " + updateError.message,
    };
  }

  // Sync orden status to match report status
  if (report?.orden_servicio_id) {
    await supabase
      .from("ordenes_servicio")
      .update({ estatus: newStatus })
      .eq("id", report.orden_servicio_id);
  }

  revalidatePath("/tecnico");
  revalidatePath("/admin/ordenes-servicio");
  return { success: true, message: "Estatus actualizado" };
}

// ── Admin: Update Equipment Entry ───────────────────────────────────────

export async function adminUpdateEquipmentEntry(
  entryId: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
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
    tipo_trabajo: result.data.tipo_trabajo,
    diagnostico: result.data.diagnostico || null,
    trabajo_realizado: result.data.trabajo_realizado || null,
    observaciones: result.data.observaciones || null,
  };

  const { error } = await supabase
    .from("reporte_equipos")
    .update(data)
    .eq("id", entryId);

  if (error) {
    return { error: "Error al actualizar entrada: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Guardado" };
}

// ── Admin: Save Materials ───────────────────────────────────────────────

export async function adminSaveMaterials(
  reporteId: string,
  materials: { cantidad: number; unidad: string; descripcion: string }[]
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
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

  // Delete all existing materials for this report
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

  revalidatePath("/admin/reportes");
  return { success: true, message: "Materiales guardados" };
}

// ── Admin: Approve Report ───────────────────────────────────────────────

export async function adminUpdateReportStatus(
  reporteId: string,
  estatus: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const validStatuses = ["en_progreso", "en_espera", "completado"];
  if (!validStatuses.includes(estatus)) {
    return { error: "Estatus invalido" };
  }

  const { error } = await supabase
    .from("reportes")
    .update({ estatus })
    .eq("id", reporteId);

  if (error) {
    return { error: "Error al actualizar estatus: " + error.message };
  }

  // Sync orden status
  const { data: reporte } = await supabase
    .from("reportes")
    .select("orden_servicio_id")
    .eq("id", reporteId)
    .single();

  if (reporte?.orden_servicio_id) {
    await supabase
      .from("ordenes_servicio")
      .update({ estatus })
      .eq("id", reporte.orden_servicio_id);
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Estatus actualizado" };
}

export async function approveReport(
  reporteId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reportes")
    .update({ finalizado_por_admin: true })
    .eq("id", reporteId);

  if (error) {
    return { error: "Error al aprobar reporte: " + error.message };
  }

  // Bulk-approve all photos still marked as "pendiente"
  await supabase
    .from("reporte_fotos")
    .update({ estatus_revision: "aceptada" })
    .eq("reporte_id", reporteId)
    .eq("estatus_revision", "pendiente");

  revalidatePath("/admin/reportes");
  return { success: true, message: "Reporte aprobado" };
}

// ── Admin: Update Step (readings, notes, completion) ────────────────────

export async function adminUpdateStep(
  reportePasoId: string,
  data: {
    lecturas?: Record<string, unknown>;
    notas?: string;
    completado?: boolean;
    nombre_custom?: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const updatePayload: Record<string, unknown> = {};

  if (data.lecturas !== undefined) {
    updatePayload.lecturas = data.lecturas;
  }
  if (data.notas !== undefined) {
    updatePayload.notas = data.notas || null;
  }
  if (data.completado !== undefined) {
    updatePayload.completado = data.completado;
    // Set completed_at when marking as complete, clear when unmarking
    updatePayload.completed_at = data.completado
      ? new Date().toISOString()
      : null;
  }
  if (data.nombre_custom !== undefined) {
    updatePayload.nombre_custom = data.nombre_custom || null;
  }

  if (Object.keys(updatePayload).length === 0) {
    return { error: "No se proporcionaron campos para actualizar" };
  }

  const { error } = await supabase
    .from("reporte_pasos")
    .update(updatePayload)
    .eq("id", reportePasoId);

  if (error) {
    return { error: "Error al actualizar paso: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Paso actualizado" };
}

// ── Admin: Update Equipment Info (nameplate and catalog fields) ─────────

export async function adminUpdateEquipmentInfo(
  equipoId: string,
  data: {
    marca?: string;
    modelo?: string;
    numero_serie?: string;
    tipo_equipo_id?: string;
    capacidad?: string;
    refrigerante?: string;
    voltaje?: string;
    fase?: string;
    ubicacion?: string;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // Build update payload — convert empty strings to null
  const updatePayload: Record<string, unknown> = {};

  const stringFields = [
    "marca",
    "modelo",
    "numero_serie",
    "capacidad",
    "refrigerante",
    "voltaje",
    "fase",
    "ubicacion",
  ] as const;

  for (const field of stringFields) {
    if (data[field] !== undefined) {
      updatePayload[field] = data[field] === "" ? null : data[field];
    }
  }

  // Handle tipo_equipo_id separately (UUID FK)
  if (data.tipo_equipo_id !== undefined) {
    updatePayload.tipo_equipo_id =
      data.tipo_equipo_id === "" ? null : data.tipo_equipo_id;
  }

  if (Object.keys(updatePayload).length === 0) {
    return { error: "No se proporcionaron campos para actualizar" };
  }

  const { error } = await supabase
    .from("equipos")
    .update(updatePayload)
    .eq("id", equipoId);

  if (error) {
    return { error: "Error al actualizar equipo: " + error.message };
  }

  revalidatePath("/admin/equipos");
  revalidatePath("/admin/reportes");
  return { success: true, message: "Equipo actualizado" };
}

// ── Admin: Remove Equipment Entry from Report ────────────────────────────

export async function adminRemoveEquipmentEntry(
  entryId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // Get the entry to find equipo_id and reporte_id for photo cleanup
  const { data: entry, error: fetchError } = await supabase
    .from("reporte_equipos")
    .select("equipo_id, reporte_id")
    .eq("id", entryId)
    .single();

  if (fetchError || !entry) {
    return { error: "Entrada de equipo no encontrada" };
  }

  // Delete equipment-specific photos for this report
  // (reporte_fotos.equipo_id references equipos directly, not reporte_equipos)
  const { error: photoDeleteError } = await supabase
    .from("reporte_fotos")
    .delete()
    .eq("reporte_id", entry.reporte_id)
    .eq("equipo_id", entry.equipo_id);

  if (photoDeleteError) {
    return { error: "Error al eliminar fotos del equipo: " + photoDeleteError.message };
  }

  // Delete the reporte_equipos row (CASCADE handles reporte_pasos,
  // and reporte_fotos.reporte_paso_id gets SET NULL for any remaining photos)
  const { error: deleteError } = await supabase
    .from("reporte_equipos")
    .delete()
    .eq("id", entryId);

  if (deleteError) {
    return { error: "Error al eliminar entrada de equipo: " + deleteError.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Equipo eliminado del reporte" };
}

// ── Admin: Update Signature (add or remove) ──────────────────────────────

export async function adminUpdateSignature(
  reporteId: string,
  firma_encargado: string | null,
  nombre_encargado: string | null
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reportes")
    .update({ firma_encargado, nombre_encargado })
    .eq("id", reporteId);

  if (error) {
    return { error: "Error al actualizar firma: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: firma_encargado ? "Firma guardada" : "Firma eliminada" };
}
