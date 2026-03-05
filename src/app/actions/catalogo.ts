"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";
import type { MaterialCategoria } from "@/types/inventory";

// ── Get Catalog ─────────────────────────────────────────────────────────

export async function getCatalogo(search?: string, includeInactive?: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("materiales_catalogo")
    .select("*")
    .order("categoria")
    .order("nombre");

  if (!includeInactive) {
    query = query.eq("activo", true);
  }

  if (search && search.trim()) {
    query = query.ilike("nombre", `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

// ── Create Material ─────────────────────────────────────────────────────

export async function createMaterial(
  nombre: string,
  categoria: MaterialCategoria,
  unidad_default: string,
  stock_minimo: number,
  notas?: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  if (!nombre.trim()) return { error: "El nombre es requerido" };
  if (!unidad_default.trim()) return { error: "La unidad es requerida" };
  if (!["consumible", "componente"].includes(categoria)) {
    return { error: "Categoria invalida" };
  }

  const { error } = await supabase.from("materiales_catalogo").insert({
    nombre: nombre.trim(),
    categoria,
    unidad_default: unidad_default.trim(),
    stock_minimo: Math.max(0, stock_minimo),
    notas: notas?.trim() || null,
  });

  if (error) {
    return { error: "Error al crear material: " + error.message };
  }

  revalidatePath("/admin/inventario");
  return { success: true, message: "Material creado" };
}

// ── Update Material ─────────────────────────────────────────────────────

export async function updateMaterial(
  id: string,
  data: {
    nombre?: string;
    categoria?: MaterialCategoria;
    unidad_default?: string;
    stock_minimo?: number;
    notas?: string | null;
  }
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
  if (data.categoria !== undefined) {
    if (!["consumible", "componente"].includes(data.categoria)) {
      return { error: "Categoria invalida" };
    }
    updatePayload.categoria = data.categoria;
  }
  if (data.unidad_default !== undefined) {
    if (!data.unidad_default.trim()) return { error: "La unidad es requerida" };
    updatePayload.unidad_default = data.unidad_default.trim();
  }
  if (data.stock_minimo !== undefined) {
    updatePayload.stock_minimo = Math.max(0, data.stock_minimo);
  }
  if (data.notas !== undefined) {
    updatePayload.notas = data.notas?.trim() || null;
  }

  const { error } = await supabase
    .from("materiales_catalogo")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    return { error: "Error al actualizar material: " + error.message };
  }

  revalidatePath("/admin/inventario");
  return { success: true, message: "Material actualizado" };
}

// ── Toggle Active ───────────────────────────────────────────────────────

export async function toggleActivoMaterial(
  id: string,
  activo: boolean
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("materiales_catalogo")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: "Error al actualizar material: " + error.message };
  }

  revalidatePath("/admin/inventario");
  return { success: true, message: activo ? "Material activado" : "Material desactivado" };
}
