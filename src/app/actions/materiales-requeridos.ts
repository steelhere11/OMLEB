"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";
import type { MaterialRequeridoPrioridad, MaterialRequeridoEstatus } from "@/types/inventory";

// ── Get Required Materials for a Report ─────────────────────────────────

export async function getMaterialesRequeridos(reporteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("materiales_requeridos")
    .select("*, materiales_catalogo(nombre, unidad_default)")
    .eq("reporte_id", reporteId)
    .order("created_at");

  if (error) return [];
  return data ?? [];
}

// ── Add Required Material ───────────────────────────────────────────────

export async function addMaterialRequerido(data: {
  reporte_id: string;
  catalogo_id?: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  prioridad?: MaterialRequeridoPrioridad;
  notas?: string;
}): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  if (!data.descripcion.trim()) return { error: "La descripcion es requerida" };
  if (!data.cantidad || data.cantidad <= 0) return { error: "La cantidad debe ser mayor a 0" };
  if (!data.unidad.trim()) return { error: "La unidad es requerida" };

  const { error } = await supabase.from("materiales_requeridos").insert({
    reporte_id: data.reporte_id,
    catalogo_id: data.catalogo_id || null,
    descripcion: data.descripcion.trim(),
    cantidad: data.cantidad,
    unidad: data.unidad.trim(),
    prioridad: data.prioridad ?? "normal",
    notas: data.notas?.trim() || null,
  });

  if (error) {
    return { error: "Error al agregar material requerido: " + error.message };
  }

  revalidatePath("/admin/reportes");
  revalidatePath("/admin/inventario");
  return { success: true, message: "Material requerido agregado" };
}

// ── Update Required Material Status ─────────────────────────────────────

export async function updateEstatusMaterial(
  id: string,
  estatus: MaterialRequeridoEstatus,
  notas?: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const validStatuses = ["pendiente", "en_camino", "recibido"];
  if (!validStatuses.includes(estatus)) {
    return { error: "Estatus invalido" };
  }

  const updatePayload: Record<string, unknown> = {
    estatus,
    updated_at: new Date().toISOString(),
  };

  if (notas !== undefined) {
    updatePayload.notas = notas?.trim() || null;
  }

  const { error } = await supabase
    .from("materiales_requeridos")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    return { error: "Error al actualizar estatus: " + error.message };
  }

  revalidatePath("/admin/reportes");
  revalidatePath("/admin/inventario");
  return { success: true, message: "Estatus actualizado" };
}

// ── Delete Required Material ────────────────────────────────────────────

export async function deleteMaterialRequerido(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("materiales_requeridos")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "Error al eliminar material requerido: " + error.message };
  }

  revalidatePath("/admin/reportes");
  revalidatePath("/admin/inventario");
  return { success: true, message: "Material requerido eliminado" };
}

// ── Get All Pending Materials (admin dashboard) ─────────────────────────

export async function getAllPendientes() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") return [];

  const { data, error } = await supabase
    .from("materiales_requeridos")
    .select(
      "*, materiales_catalogo(nombre, unidad_default), reportes(id, fecha, orden_servicio_id, ordenes_servicio(numero_orden))"
    )
    .neq("estatus", "recibido")
    .order("prioridad", { ascending: true }) // urgente first
    .order("created_at");

  if (error) return [];
  return data ?? [];
}
