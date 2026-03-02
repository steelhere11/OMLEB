"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Add Admin Comment ──────────────────────────────────────────────────

export async function addAdminComment(
  reporteId: string,
  contenido: string,
  equipoId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  if (!contenido.trim()) {
    return { success: false, error: "El comentario no puede estar vacio" };
  }

  const insertData: Record<string, unknown> = {
    reporte_id: reporteId,
    autor_id: user.id,
    contenido: contenido.trim(),
  };

  if (equipoId) {
    insertData.equipo_id = equipoId;
  }

  const { error } = await supabase
    .from("reporte_comentarios")
    .insert(insertData);

  if (error) {
    return { success: false, error: "Error al agregar comentario: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true };
}

// ── Delete Admin Comment ───────────────────────────────────────────────

export async function deleteAdminComment(
  comentarioId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { success: false, error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reporte_comentarios")
    .delete()
    .eq("id", comentarioId);

  if (error) {
    return { success: false, error: "Error al eliminar comentario: " + error.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true };
}
