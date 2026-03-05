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

// ── Sync Stock Deductions (auto-deduction helper) ───────────────────────

async function syncStockDeductions(
  supabase: SupabaseClient,
  reporteId: string,
  userId: string,
  materials: { cantidad: number; catalogo_id?: string | null }[]
): Promise<void> {
  // Delete existing 'uso' movimientos for this report
  await supabase
    .from("stock_movimientos")
    .delete()
    .eq("reporte_id", reporteId)
    .eq("tipo", "uso");

  // Filter to catalog materials only
  const catalogMaterials = materials.filter((m) => m.catalogo_id);
  if (catalogMaterials.length === 0) return;

  // Resolve cuadrilla for the user who created the report
  // First try: find who created the report
  const { data: reporte } = await supabase
    .from("reportes")
    .select("creado_por")
    .eq("id", reporteId)
    .single();

  const techUserId = reporte?.creado_por ?? userId;

  const { data: memberships } = await supabase
    .from("cuadrilla_miembros")
    .select("cuadrilla_id")
    .eq("usuario_id", techUserId);

  const cuadrillaId = memberships && memberships.length > 0 ? memberships[0].cuadrilla_id : null;

  // Insert 'uso' movimientos for each catalog material
  const usoRows = catalogMaterials.map((m) => ({
    catalogo_id: m.catalogo_id!,
    tipo: "uso" as const,
    cantidad: m.cantidad,
    cuadrilla_id: cuadrillaId,
    reporte_id: reporteId,
    registrado_por: userId,
  }));

  await supabase.from("stock_movimientos").insert(usoRows);
}

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

  // Compute next revision number
  const { count: existingCount } = await supabase
    .from("reportes")
    .select("*", { count: "exact", head: true })
    .eq("orden_servicio_id", ordenServicioId);
  const nextRevision = (existingCount ?? 0) + 1;

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
      numero_revision: nextRevision,
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

  // Deep-copy all data from previous report (or fallback to orden_equipos)
  await deepCopyFromPreviousReport(supabase, ordenServicioId, newReport.id, today);

  return {
    reporteId: newReport.id,
    llegada_completada: false,
    sitio_completado: carryForwardSite,
  };
}

// ── Auto-load Preventive Template Steps ───────────────────────────────

async function autoLoadPreventiveSteps(
  supabase: SupabaseClient,
  reporteEquipoEntries: { id: string; equipo_id: string; tipo_trabajo: string }[]
): Promise<void> {
  // Filter to preventivo entries only
  const prevEntries = reporteEquipoEntries.filter((e) => e.tipo_trabajo === "preventivo");
  if (prevEntries.length === 0) return;

  // Get tipo_equipo slugs for each equipment
  const equipoIds = [...new Set(prevEntries.map((e) => e.equipo_id))];
  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, tipo_equipo_id, tipos_equipo:tipo_equipo_id(slug)")
    .in("id", equipoIds);

  if (!equipos) return;

  // Build equipo_id → slug map
  const slugMap = new Map<string, string>();
  for (const eq of equipos) {
    // Supabase FK join returns object or null for many-to-one
    const te = eq.tipos_equipo as unknown as { slug: string } | null;
    if (te?.slug && te.slug !== "otro") {
      slugMap.set(eq.id, te.slug);
    }
  }

  // For each preventivo entry with a valid slug, load template steps
  for (const entry of prevEntries) {
    const slug = slugMap.get(entry.equipo_id);
    if (!slug) continue;

    // Check if steps already exist for this entry
    const { count } = await supabase
      .from("reporte_pasos")
      .select("id", { count: "exact", head: true })
      .eq("reporte_equipo_id", entry.id);

    if (count && count > 0) continue;

    // Fetch templates
    const { data: templates } = await supabase
      .from("plantillas_pasos")
      .select("id, orden")
      .eq("tipo_equipo_slug", slug)
      .eq("tipo_mantenimiento", "preventivo")
      .order("orden", { ascending: true });

    if (!templates || templates.length === 0) continue;

    // Insert reporte_pasos rows
    const pasoRows = templates.map((t) => ({
      reporte_equipo_id: entry.id,
      plantilla_paso_id: t.id,
      completado: false,
      lecturas: {},
      orden: t.orden,
    }));

    await supabase.from("reporte_pasos").insert(pasoRows);
  }
}

// ── Deep Copy from Previous Report ────────────────────────────────────

export async function deepCopyFromPreviousReport(
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

  if (!previousReport) {
    // No previous report — auto-populate from orden_equipos (first-day behavior)
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
      const { data: inserted } = await supabase
        .from("reporte_equipos")
        .insert(newEntries)
        .select("id, equipo_id, tipo_trabajo");

      // Auto-load preventive template steps for first-day entries
      if (inserted && inserted.length > 0) {
        await autoLoadPreventiveSteps(supabase, inserted);
      }
    }
    return;
  }

  // ── a. Copy reporte_equipos (ALL fields) ──────────────────────────────
  const { data: prevEquipEntries } = await supabase
    .from("reporte_equipos")
    .select("id, equipo_id, tipo_trabajo, diagnostico, trabajo_realizado, observaciones, registro_completado")
    .eq("reporte_id", previousReport.id);

  if (!prevEquipEntries || prevEquipEntries.length === 0) {
    // Previous report had no equipment — fallback to orden_equipos
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
      const { data: inserted } = await supabase
        .from("reporte_equipos")
        .insert(newEntries)
        .select("id, equipo_id, tipo_trabajo");

      // Auto-load preventive template steps for first-day entries
      if (inserted && inserted.length > 0) {
        await autoLoadPreventiveSteps(supabase, inserted);
      }
    }
    return;
  }

  // Insert new equipment entries with all text fields carried forward
  const newEquipRows = prevEquipEntries.map((e) => ({
    reporte_id: newReporteId,
    equipo_id: e.equipo_id,
    tipo_trabajo: e.tipo_trabajo,
    diagnostico: e.diagnostico,
    trabajo_realizado: e.trabajo_realizado,
    observaciones: e.observaciones,
    registro_completado: e.registro_completado ?? false,
  }));

  const { data: insertedEquip } = await supabase
    .from("reporte_equipos")
    .insert(newEquipRows)
    .select("id, equipo_id");

  if (!insertedEquip) return;

  // Build old→new equipment entry ID mapping (match by equipo_id)
  const equipIdMap = new Map<string, string>(); // old reporte_equipo id → new id
  for (const oldEntry of prevEquipEntries) {
    const newEntry = insertedEquip.find((n) => n.equipo_id === oldEntry.equipo_id);
    if (newEntry) {
      equipIdMap.set(oldEntry.id, newEntry.id);
    }
  }

  // ── b. Copy reporte_pasos (ALL fields) ────────────────────────────────
  const { data: prevPasos } = await supabase
    .from("reporte_pasos")
    .select("id, reporte_equipo_id, plantilla_paso_id, falla_correctiva_id, nombre_custom, completado, notas, lecturas, completed_at, orden")
    .in("reporte_equipo_id", prevEquipEntries.map((e) => e.id));

  const pasoIdMap = new Map<string, string>(); // old paso id → new paso id

  if (prevPasos && prevPasos.length > 0) {
    const newPasoRows = prevPasos
      .filter((p) => equipIdMap.has(p.reporte_equipo_id))
      .map((p) => ({
        reporte_equipo_id: equipIdMap.get(p.reporte_equipo_id)!,
        plantilla_paso_id: p.plantilla_paso_id,
        falla_correctiva_id: p.falla_correctiva_id,
        nombre_custom: p.nombre_custom,
        completado: p.completado,
        notas: p.notas,
        lecturas: p.lecturas,
        completed_at: p.completed_at,
        orden: p.orden,
      }));

    if (newPasoRows.length > 0) {
      const { data: insertedPasos } = await supabase
        .from("reporte_pasos")
        .insert(newPasoRows)
        .select("id, reporte_equipo_id, plantilla_paso_id, falla_correctiva_id, nombre_custom");

      if (insertedPasos) {
        // Match old→new by composite key within each equipment entry
        for (const oldPaso of prevPasos) {
          const newEquipId = equipIdMap.get(oldPaso.reporte_equipo_id);
          if (!newEquipId) continue;

          const newPaso = insertedPasos.find(
            (n) =>
              n.reporte_equipo_id === newEquipId &&
              n.plantilla_paso_id === oldPaso.plantilla_paso_id &&
              n.falla_correctiva_id === oldPaso.falla_correctiva_id &&
              n.nombre_custom === oldPaso.nombre_custom
          );
          if (newPaso) {
            pasoIdMap.set(oldPaso.id, newPaso.id);
          }
        }
      }
    }
  }

  // ── c. Copy reporte_fotos (metadata rows only, same URLs) ─────────────
  const { data: prevPhotos } = await supabase
    .from("reporte_fotos")
    .select("reporte_paso_id, equipo_id, url, etiqueta, tipo_media, metadata_gps, metadata_fecha, estatus_revision")
    .eq("reporte_id", previousReport.id);

  if (prevPhotos && prevPhotos.length > 0) {
    const newPhotoRows = prevPhotos.map((p) => ({
      reporte_id: newReporteId,
      equipo_id: p.equipo_id,
      url: p.url,
      etiqueta: p.etiqueta,
      tipo_media: p.tipo_media ?? "foto",
      metadata_gps: p.metadata_gps,
      metadata_fecha: p.metadata_fecha,
      estatus_revision: p.estatus_revision ?? "pendiente",
      // Map reporte_paso_id to new paso IDs
      reporte_paso_id: p.reporte_paso_id ? (pasoIdMap.get(p.reporte_paso_id) ?? null) : null,
    }));

    await supabase.from("reporte_fotos").insert(newPhotoRows);
  }

  // ── d. Copy reporte_materiales (including catalogo_id) ────────────────
  const { data: prevMaterials } = await supabase
    .from("reporte_materiales")
    .select("cantidad, unidad, descripcion, catalogo_id")
    .eq("reporte_id", previousReport.id);

  if (prevMaterials && prevMaterials.length > 0) {
    const newMaterialRows = prevMaterials.map((m) => ({
      reporte_id: newReporteId,
      cantidad: m.cantidad,
      unidad: m.unidad,
      descripcion: m.descripcion,
      catalogo_id: m.catalogo_id ?? null,
    }));

    await supabase.from("reporte_materiales").insert(newMaterialRows);
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
  materials: { cantidad: number; unidad: string; descripcion: string; catalogo_id?: string | null }[]
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
      catalogo_id: m.catalogo_id || null,
    }));

    const { error: insertError } = await supabase
      .from("reporte_materiales")
      .insert(rows);

    if (insertError) {
      return { error: "Error al guardar materiales: " + insertError.message };
    }
  }

  // ── Auto-deduction: sync stock_movimientos for catalog materials ──
  await syncStockDeductions(supabase, reporteId, user.id, materials);

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

    // Set fecha_cierre if not already set
    const { data: existing } = await supabase
      .from("reportes")
      .select("fecha_cierre")
      .eq("id", reporteId)
      .single();

    if (!existing?.fecha_cierre) {
      updatePayload.fecha_cierre = new Date().toISOString();
    }
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

  // Fetch old tipo_trabajo before updating
  const { data: oldEntry } = await supabase
    .from("reporte_equipos")
    .select("tipo_trabajo, equipo_id")
    .eq("id", entryId)
    .single();

  const { error } = await supabase
    .from("reporte_equipos")
    .update(data)
    .eq("id", entryId);

  if (error) {
    return { error: "Error al actualizar entrada: " + error.message };
  }

  // Handle tipo_trabajo change — reload workflow steps
  if (oldEntry && oldEntry.tipo_trabajo !== data.tipo_trabajo) {
    // Delete template-based steps (preserve custom steps)
    await supabase
      .from("reporte_pasos")
      .delete()
      .eq("reporte_equipo_id", entryId)
      .not("plantilla_paso_id", "is", null);

    // Delete corrective steps (preserve custom steps)
    await supabase
      .from("reporte_pasos")
      .delete()
      .eq("reporte_equipo_id", entryId)
      .not("falla_correctiva_id", "is", null);

    // If switching to preventivo, auto-load template steps
    if (data.tipo_trabajo === "preventivo") {
      await autoLoadPreventiveSteps(supabase, [
        { id: entryId, equipo_id: oldEntry.equipo_id, tipo_trabajo: "preventivo" },
      ]);
    }
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Guardado" };
}

// ── Admin: Save Materials ───────────────────────────────────────────────

export async function adminSaveMaterials(
  reporteId: string,
  materials: { cantidad: number; unidad: string; descripcion: string; catalogo_id?: string | null }[]
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
      catalogo_id: m.catalogo_id || null,
    }));

    const { error: insertError } = await supabase
      .from("reporte_materiales")
      .insert(rows);

    if (insertError) {
      return { error: "Error al guardar materiales: " + insertError.message };
    }
  }

  // ── Auto-deduction: sync stock_movimientos for catalog materials ──
  await syncStockDeductions(supabase, reporteId, user.id, materials);

  revalidatePath("/admin/reportes");
  return { success: true, message: "Materiales guardados" };
}

// ── Admin: Update Report Date ────────────────────────────────────────────

export async function adminUpdateReportDate(
  reporteId: string,
  fecha: string,
  field: "fecha" | "fecha_cierre" = "fecha"
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // Validate date string (YYYY-MM-DD) — allow empty string for fecha_cierre to clear it
  if (fecha === "" && field === "fecha_cierre") {
    const { error } = await supabase
      .from("reportes")
      .update({ fecha_cierre: null })
      .eq("id", reporteId);

    if (error) {
      return { error: "Error al actualizar fecha: " + error.message };
    }
    revalidatePath("/admin/reportes");
    return { success: true, message: "Fecha de cierre eliminada" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { error: "Formato de fecha invalido" };
  }

  const updatePayload = field === "fecha_cierre"
    ? { fecha_cierre: new Date(fecha + "T12:00:00").toISOString() }
    : { fecha };

  const { error } = await supabase
    .from("reportes")
    .update(updatePayload)
    .eq("id", reporteId);

  if (error) {
    return { error: "Error al actualizar fecha: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Fecha actualizada" };
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

  // Set fecha_cierre when completing (if not already set)
  const updatePayload: Record<string, string> = { estatus };
  if (estatus === "completado") {
    const { data: existing } = await supabase
      .from("reportes")
      .select("fecha_cierre")
      .eq("id", reporteId)
      .single();

    if (!existing?.fecha_cierre) {
      updatePayload.fecha_cierre = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from("reportes")
    .update(updatePayload)
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

// ── Admin: Reorder Steps ─────────────────────────────────────────────────

export async function adminReorderSteps(
  steps: { id: string; orden: number }[]
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  for (const step of steps) {
    const { error } = await supabase
      .from("reporte_pasos")
      .update({ orden: step.orden })
      .eq("id", step.id);

    if (error) {
      return { error: "Error al reordenar pasos: " + error.message };
    }
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Orden actualizado" };
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

// ── Admin: Load Template Steps for Equipment Entry ───────────────────

export async function adminLoadTemplateSteps(
  reporteEquipoId: string,
  tipoEquipoSlug: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  if (!tipoEquipoSlug || tipoEquipoSlug === "otro") {
    return { error: "No hay plantillas disponibles para este tipo de equipo" };
  }

  // Check no template steps already exist
  const { count } = await supabase
    .from("reporte_pasos")
    .select("id", { count: "exact", head: true })
    .eq("reporte_equipo_id", reporteEquipoId)
    .not("plantilla_paso_id", "is", null);

  if (count && count > 0) {
    return { error: "Ya existen pasos de plantilla para esta entrada" };
  }

  // Fetch templates
  const { data: templates } = await supabase
    .from("plantillas_pasos")
    .select("id, orden")
    .eq("tipo_equipo_slug", tipoEquipoSlug)
    .eq("tipo_mantenimiento", "preventivo")
    .order("orden", { ascending: true });

  if (!templates || templates.length === 0) {
    return { error: "No hay plantillas disponibles para este tipo de equipo" };
  }

  // Insert reporte_pasos rows
  const pasoRows = templates.map((t) => ({
    reporte_equipo_id: reporteEquipoId,
    plantilla_paso_id: t.id,
    completado: false,
    lecturas: {},
    orden: t.orden,
  }));

  const { error } = await supabase.from("reporte_pasos").insert(pasoRows);

  if (error) {
    return { error: "Error al cargar plantillas: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: `${templates.length} pasos cargados` };
}
