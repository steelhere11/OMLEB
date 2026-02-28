"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReporteFoto } from "@/types";

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
