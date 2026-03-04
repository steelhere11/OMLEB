"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReporteFoto, FotoEstatusRevision } from "@/types";
import type { ActionState } from "@/types/actions";

// ── Get Photos for Report ──────────────────────────────────────────────

export async function getPhotosForReport(
  reporteId: string
): Promise<ReporteFoto[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("reporte_fotos")
    .select("*")
    .eq("reporte_id", reporteId)
    .order("created_at", { ascending: true });

  if (error) return [];

  return (data as ReporteFoto[]) ?? [];
}

// ── Get Photos for Step ────────────────────────────────────────────────

export async function getPhotosForStep(
  reportePasoId: string
): Promise<ReporteFoto[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("reporte_fotos")
    .select("*")
    .eq("reporte_paso_id", reportePasoId)
    .order("created_at", { ascending: true });

  if (error) return [];

  return (data as ReporteFoto[]) ?? [];
}

// ── Get Photos for Equipment (general, not step-specific) ─────────────

export async function getPhotosForEquipment(
  reporteId: string,
  equipoId: string
): Promise<ReporteFoto[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("reporte_fotos")
    .select("*")
    .eq("reporte_id", reporteId)
    .eq("equipo_id", equipoId)
    .is("reporte_paso_id", null)
    .order("created_at", { ascending: true });

  if (error) return [];

  return (data as ReporteFoto[]) ?? [];
}

// ── Delete Photo ───────────────────────────────────────────────────────

export async function deletePhotoAction(
  fotoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  // Fetch the photo row to get the URL
  const { data: foto, error: fetchError } = await supabase
    .from("reporte_fotos")
    .select("id, url")
    .eq("id", fotoId)
    .single();

  if (fetchError || !foto) {
    return { success: false, error: "Foto no encontrada" };
  }

  // Extract storage path from the public URL
  // URL format: .../storage/v1/object/public/reportes/<path>
  const marker = "/storage/v1/object/public/reportes/";
  const markerIndex = foto.url.indexOf(marker);
  if (markerIndex !== -1) {
    const filePath = decodeURIComponent(
      foto.url.substring(markerIndex + marker.length)
    );
    // Delete from storage (best effort -- don't fail if storage delete fails)
    await supabase.storage.from("reportes").remove([filePath]);
  }

  // Delete the database row
  const { error: dbError } = await supabase
    .from("reporte_fotos")
    .delete()
    .eq("id", fotoId);

  if (dbError) {
    return { success: false, error: "Error al eliminar foto: " + dbError.message };
  }

  revalidatePath("/tecnico");
  return { success: true };
}

// ── Helper: Extract storage path from public URL ─────────────────────────

function extractStoragePath(url: string): string | null {
  const marker = "/storage/v1/object/public/reportes/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;
  return decodeURIComponent(url.substring(markerIndex + marker.length));
}

// ══════════════════════════════════════════════════════════════════════════
// Admin Photo Management Actions
// ══════════════════════════════════════════════════════════════════════════

// ── Admin: Flag Photo (review status + note) ─────────────────────────────

export async function adminFlagPhoto(
  fotoId: string,
  estatus: FotoEstatusRevision,
  nota?: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const validStatuses: FotoEstatusRevision[] = [
    "pendiente",
    "aceptada",
    "rechazada",
    "retomar",
  ];
  if (!validStatuses.includes(estatus)) {
    return { error: "Estatus de revision invalido" };
  }

  const updateData: Record<string, unknown> = {
    estatus_revision: estatus,
  };
  // Only set nota_admin if provided; clear it if empty string
  if (nota !== undefined) {
    updateData.nota_admin = nota || null;
  }

  const { error } = await supabase
    .from("reporte_fotos")
    .update(updateData)
    .eq("id", fotoId);

  if (error) {
    return { error: "Error al actualizar foto: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Foto actualizada" };
}

// ── Admin: Update Photo Etiqueta ─────────────────────────────────────────

export async function adminUpdateEtiqueta(
  fotoId: string,
  etiqueta: string | null
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reporte_fotos")
    .update({ etiqueta: etiqueta || null })
    .eq("id", fotoId);

  if (error) {
    return { error: "Error al actualizar etiqueta: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Etiqueta actualizada" };
}

// ── Admin: Delete Photo ──────────────────────────────────────────────────

export async function adminDeletePhoto(
  fotoId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // Fetch the photo row to get the URL
  const { data: foto, error: fetchError } = await supabase
    .from("reporte_fotos")
    .select("id, url")
    .eq("id", fotoId)
    .single();

  if (fetchError || !foto) {
    return { error: "Foto no encontrada" };
  }

  // Delete from storage (best effort)
  const storagePath = extractStoragePath(foto.url);
  if (storagePath) {
    const admin = createAdminClient();
    await admin.storage.from("reportes").remove([storagePath]);
  }

  // Delete the database row
  const { error: dbError } = await supabase
    .from("reporte_fotos")
    .delete()
    .eq("id", fotoId);

  if (dbError) {
    return { error: "Error al eliminar foto: " + dbError.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: "Foto eliminada" };
}

// ── Admin: Upload Photo ──────────────────────────────────────────────────

export async function adminUploadPhoto(
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // Extract form fields
  const reporteId = formData.get("reporteId") as string;
  const equipoId = (formData.get("equipoId") as string) || null;
  const etiqueta = (formData.get("etiqueta") as string) || null;
  const reportePasoId = (formData.get("reportePasoId") as string) || null;
  const file = formData.get("file") as File;

  if (!reporteId) {
    return { error: "ID de reporte requerido" };
  }
  if (!file || !(file instanceof File)) {
    return { error: "Archivo requerido" };
  }

  // Upload to storage
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `reportes/${reporteId}/${timestamp}-${safeName}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("reportes")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: "Error al subir archivo: " + uploadError.message };
  }

  // Get public URL
  const { data: urlData } = admin.storage
    .from("reportes")
    .getPublicUrl(storagePath);

  // Determine media type
  const isVideo = file.type.startsWith("video/");
  const tipoMedia = isVideo ? "video" : "foto";

  // Insert database row — tipo_media and estatus_revision are optional
  // columns that may not exist yet if migrations haven't been run.
  const insertData: Record<string, unknown> = {
    reporte_id: reporteId,
    url: urlData.publicUrl,
  };

  insertData.tipo_media = tipoMedia;
  if (equipoId) insertData.equipo_id = equipoId;
  if (etiqueta) insertData.etiqueta = etiqueta;
  if (reportePasoId) insertData.reporte_paso_id = reportePasoId;

  const { data: newRow, error: dbError } = await supabase
    .from("reporte_fotos")
    .insert(insertData)
    .select("id")
    .single();

  if (dbError) {
    return { error: "Error al registrar foto: " + dbError.message };
  }

  revalidatePath("/admin/reportes");
  return {
    success: true,
    message: "Foto subida exitosamente",
    data: { id: newRow.id, url: urlData.publicUrl },
  };
}

// ── Overwrite Annotated Photo ─────────────────────────────────────────

export async function overwriteAnnotatedPhoto(
  fotoId: string,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  // 1. Get the current photo record
  const { data: foto, error: fetchError } = await supabase
    .from("reporte_fotos")
    .select("id, url")
    .eq("id", fotoId)
    .single();

  if (fetchError || !foto) {
    return { error: "Foto no encontrada" };
  }

  // 2. Extract storage path from the public URL
  const storagePath = extractStoragePath(foto.url);
  if (!storagePath) {
    return { error: "No se pudo determinar la ruta de almacenamiento" };
  }

  // 3. Get the annotated image from FormData
  const file = formData.get("file") as File;
  if (!file || !(file instanceof File)) {
    return { error: "Imagen anotada requerida" };
  }

  // 4. Overwrite the file at the SAME storage path using admin client
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("reportes")
    .upload(storagePath, file, {
      contentType: "image/jpeg",
      upsert: true, // Overwrite existing file
    });

  if (uploadError) {
    return { error: "Error al guardar anotacion: " + uploadError.message };
  }

  // 5. No DB row changes needed -- same URL, same row
  // Revalidate both admin and technician pages
  revalidatePath("/admin/reportes");
  revalidatePath("/tecnico");

  return { success: true, message: "Foto anotada guardada" };
}

// ── Backfill Orphan Photos ────────────────────────────────────────────
// Assigns orphan photos (reporte_paso_id IS NULL) to steps based on
// timestamp order. For each equipment entry, distributes orphan photos
// across its steps chronologically.

export async function backfillOrphanPhotos(
  reporteId: string
): Promise<ActionState & { fixed?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // 1. Get all orphan photos (not registration photos)
  const regLabels = ["placa", "equipo_general", "llegada", "sitio"];
  const { data: orphanPhotos, error: photoErr } = await supabase
    .from("reporte_fotos")
    .select("id, equipo_id, etiqueta, created_at")
    .eq("reporte_id", reporteId)
    .is("reporte_paso_id", null)
    .not("equipo_id", "is", null)
    .order("created_at", { ascending: true });

  if (photoErr || !orphanPhotos) {
    return { error: "Error al buscar fotos: " + (photoErr?.message ?? "") };
  }

  // Filter out registration photos
  const workPhotos = orphanPhotos.filter(
    (p) => !regLabels.includes(p.etiqueta ?? "")
  );

  if (workPhotos.length === 0) {
    return { success: true, message: "No hay fotos huerfanas para asignar", fixed: 0 };
  }

  // 2. Get all equipment entries with their steps for this report
  const { data: equipEntries, error: eqErr } = await supabase
    .from("reporte_equipos")
    .select("id, equipo_id, reporte_pasos(id, plantilla_paso_id, falla_correctiva_id)")
    .eq("reporte_id", reporteId);

  if (eqErr || !equipEntries) {
    return { error: "Error al buscar equipos: " + (eqErr?.message ?? "") };
  }

  // 3. Build map: equipo_id → list of step IDs (in DB order)
  const equipoStepsMap = new Map<string, string[]>();
  for (const entry of equipEntries) {
    const steps = (entry.reporte_pasos as { id: string }[]) ?? [];
    const existing = equipoStepsMap.get(entry.equipo_id) ?? [];
    existing.push(...steps.map((s) => s.id));
    equipoStepsMap.set(entry.equipo_id, existing);
  }

  // 4. Distribute orphan photos to steps
  let fixed = 0;
  const photosByEquipo = new Map<string, typeof workPhotos>();
  for (const photo of workPhotos) {
    const key = photo.equipo_id!;
    const arr = photosByEquipo.get(key) ?? [];
    arr.push(photo);
    photosByEquipo.set(key, arr);
  }

  for (const [equipoId, photos] of photosByEquipo.entries()) {
    const stepIds = equipoStepsMap.get(equipoId);
    if (!stepIds || stepIds.length === 0) continue;

    // Distribute photos round-robin across steps
    for (let i = 0; i < photos.length; i++) {
      const stepId = stepIds[Math.min(Math.floor(i / 3), stepIds.length - 1)];
      const { error: updateErr } = await supabase
        .from("reporte_fotos")
        .update({ reporte_paso_id: stepId })
        .eq("id", photos[i].id);

      if (!updateErr) fixed++;
    }
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: `${fixed} fotos asignadas a pasos`, fixed };
}
