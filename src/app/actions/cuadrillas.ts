"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";

// ── Get All Cuadrillas ──────────────────────────────────────────────────

export async function getCuadrillas() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("cuadrillas")
    .select("*, cuadrilla_miembros(id, usuario_id)")
    .order("nombre");

  if (error) return [];
  return data ?? [];
}

// ── Create Cuadrilla ────────────────────────────────────────────────────

export async function createCuadrilla(
  nombre: string,
  lider_id: string | null
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  if (!nombre.trim()) {
    return { error: "El nombre es requerido" };
  }

  const { error } = await supabase.from("cuadrillas").insert({
    nombre: nombre.trim(),
    lider_id: lider_id || null,
  });

  if (error) {
    return { error: "Error al crear cuadrilla: " + error.message };
  }

  revalidatePath("/admin/cuadrillas");
  return { success: true, message: "Cuadrilla creada" };
}

// ── Update Cuadrilla ────────────────────────────────────────────────────

export async function updateCuadrilla(
  id: string,
  data: { nombre?: string; lider_id?: string | null; activa?: boolean }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.nombre !== undefined) {
    if (!data.nombre.trim()) return { error: "El nombre es requerido" };
    updatePayload.nombre = data.nombre.trim();
  }
  if (data.lider_id !== undefined) {
    updatePayload.lider_id = data.lider_id || null;
  }
  if (data.activa !== undefined) {
    updatePayload.activa = data.activa;
  }

  const { error } = await supabase
    .from("cuadrillas")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    return { error: "Error al actualizar cuadrilla: " + error.message };
  }

  revalidatePath("/admin/cuadrillas");
  return { success: true, message: "Cuadrilla actualizada" };
}

// ── Delete Cuadrilla ────────────────────────────────────────────────────

export async function deleteCuadrilla(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase.from("cuadrillas").delete().eq("id", id);

  if (error) {
    return { error: "Error al eliminar cuadrilla: " + error.message };
  }

  revalidatePath("/admin/cuadrillas");
  return { success: true, message: "Cuadrilla eliminada" };
}

// ── Add Member to Cuadrilla ─────────────────────────────────────────────

export async function addMiembro(
  cuadrillaId: string,
  usuarioId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase.from("cuadrilla_miembros").insert({
    cuadrilla_id: cuadrillaId,
    usuario_id: usuarioId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Este usuario ya es miembro de la cuadrilla" };
    }
    return { error: "Error al agregar miembro: " + error.message };
  }

  revalidatePath("/admin/cuadrillas");
  return { success: true, message: "Miembro agregado" };
}

// ── Remove Member from Cuadrilla ────────────────────────────────────────

export async function removeMiembro(
  cuadrillaId: string,
  usuarioId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("cuadrilla_miembros")
    .delete()
    .eq("cuadrilla_id", cuadrillaId)
    .eq("usuario_id", usuarioId);

  if (error) {
    return { error: "Error al remover miembro: " + error.message };
  }

  revalidatePath("/admin/cuadrillas");
  return { success: true, message: "Miembro removido" };
}

// ── Get Cuadrilla by User ───────────────────────────────────────────────

export async function getCuadrillaByUsuario(usuarioId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cuadrilla_miembros")
    .select("cuadrilla_id, cuadrillas(id, nombre)")
    .eq("usuario_id", usuarioId);

  if (!data || data.length === 0) return null;

  // Return first active cuadrilla
  const membership = data[0];
  const cuadrilla = membership.cuadrillas as unknown as { id: string; nombre: string } | null;
  return cuadrilla ? { id: cuadrilla.id, nombre: cuadrilla.nombre } : null;
}
