"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sucursalSchema } from "@/lib/validations/sucursales";
import { z } from "zod";
import type { ActionState } from "@/types/actions";

// ── Create Branch ──────────────────────────────────────────────

export async function createSucursal(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // 1. Verify admin role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // 2. Validate with Zod
  const clienteIdRaw = formData.get("cliente_id") as string | null;
  const rawData = {
    nombre: formData.get("nombre"),
    numero: formData.get("numero"),
    direccion: formData.get("direccion"),
    cliente_id: clienteIdRaw && clienteIdRaw !== "" ? clienteIdRaw : null,
  };

  const result = sucursalSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // 3. Insert into database
  const { error: dbError } = await supabase
    .from("sucursales")
    .insert(result.data);

  if (dbError) {
    return { error: "Error al crear la sucursal: " + dbError.message };
  }

  // 4. Revalidate and redirect
  revalidatePath("/admin/sucursales");
  redirect("/admin/sucursales");
}

// ── Update Branch ──────────────────────────────────────────────

export async function updateSucursal(
  id: string,
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // 1. Verify admin role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // 2. Validate with Zod
  const clienteIdRaw = formData.get("cliente_id") as string | null;
  const rawData = {
    nombre: formData.get("nombre"),
    numero: formData.get("numero"),
    direccion: formData.get("direccion"),
    cliente_id: clienteIdRaw && clienteIdRaw !== "" ? clienteIdRaw : null,
  };

  const result = sucursalSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // 3. Update in database
  const { error: dbError } = await supabase
    .from("sucursales")
    .update(result.data)
    .eq("id", id);

  if (dbError) {
    return { error: "Error al actualizar la sucursal: " + dbError.message };
  }

  // 4. Revalidate and redirect
  revalidatePath("/admin/sucursales");
  redirect("/admin/sucursales");
}

// ── Delete Branch ──────────────────────────────────────────────

export async function deleteSucursal(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // 1. Verify admin role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // 2. Get id from formData
  const id = formData.get("id") as string;
  if (!id) {
    return { error: "ID de sucursal no proporcionado" };
  }

  // 3. Attempt delete
  const { error } = await supabase
    .from("sucursales")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "No se puede eliminar esta sucursal porque tiene ordenes de servicio o equipos asociados. Elimine primero los registros relacionados.",
      };
    }
    return { error: "Error al eliminar: " + error.message };
  }

  // 4. Revalidate and return success (no redirect on delete)
  revalidatePath("/admin/sucursales");
  return { success: true, message: "Sucursal eliminada exitosamente" };
}
