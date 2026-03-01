"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { equipoSchema, equipoForFolioSchema } from "@/lib/validations/equipos";
import { z } from "zod";
import type { ActionState } from "@/types/actions";

// ── Create Equipment ──────────────────────────────────────────────

export async function createEquipo(
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
  const rawData = {
    sucursal_id: formData.get("sucursal_id"),
    numero_etiqueta: formData.get("numero_etiqueta"),
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    numero_serie: formData.get("numero_serie"),
    tipo_equipo: formData.get("tipo_equipo"),
  };

  const result = equipoSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // 3. Prepare insert data (filter out empty strings for optional fields)
  const insertData: Record<string, unknown> = {
    sucursal_id: result.data.sucursal_id,
    numero_etiqueta: result.data.numero_etiqueta,
    revisado: true, // Admin-created equipment is already reviewed
  };

  if (result.data.marca && result.data.marca !== "") {
    insertData.marca = result.data.marca;
  }
  if (result.data.modelo && result.data.modelo !== "") {
    insertData.modelo = result.data.modelo;
  }
  if (result.data.numero_serie && result.data.numero_serie !== "") {
    insertData.numero_serie = result.data.numero_serie;
  }
  if (result.data.tipo_equipo && result.data.tipo_equipo !== "") {
    insertData.tipo_equipo = result.data.tipo_equipo;
  }

  // Handle tipo_equipo_id from dropdown
  const tipoEquipoId = formData.get("tipo_equipo_id") as string;
  if (tipoEquipoId && tipoEquipoId !== "") {
    insertData.tipo_equipo_id = tipoEquipoId;
  }

  // 4. Insert into database
  const { data: equipo, error: dbError } = await supabase
    .from("equipos")
    .insert(insertData)
    .select("id")
    .single();

  if (dbError) {
    return { error: "Error al crear el equipo: " + dbError.message };
  }

  // 5. Revalidate and return
  revalidatePath(`/admin/equipos/${result.data.sucursal_id}`);
  revalidatePath("/admin/equipos");
  return { success: true, data: { id: equipo.id } };
}

// ── Update Equipment ──────────────────────────────────────────────

export async function updateEquipo(
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

  // 2. Validate with Zod (include sucursal_id for schema but don't update it)
  const sucursalId = formData.get("sucursal_id") as string;
  const rawData = {
    sucursal_id: sucursalId,
    numero_etiqueta: formData.get("numero_etiqueta"),
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    numero_serie: formData.get("numero_serie"),
    tipo_equipo: formData.get("tipo_equipo"),
  };

  const result = equipoSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // 3. Update database (exclude sucursal_id — equipment stays in same branch)
  const updateData: Record<string, unknown> = {
    numero_etiqueta: result.data.numero_etiqueta,
    marca: result.data.marca === "" ? null : (result.data.marca ?? null),
    modelo: result.data.modelo === "" ? null : (result.data.modelo ?? null),
    numero_serie:
      result.data.numero_serie === ""
        ? null
        : (result.data.numero_serie ?? null),
    tipo_equipo:
      result.data.tipo_equipo === ""
        ? null
        : (result.data.tipo_equipo ?? null),
    revisado: true, // Admin has reviewed it
  };

  // Handle tipo_equipo_id from dropdown
  const tipoEquipoId = formData.get("tipo_equipo_id") as string;
  updateData.tipo_equipo_id = tipoEquipoId && tipoEquipoId !== "" ? tipoEquipoId : null;

  const { error: dbError } = await supabase
    .from("equipos")
    .update(updateData)
    .eq("id", id);

  if (dbError) {
    return { error: "Error al actualizar el equipo: " + dbError.message };
  }

  // 4. Revalidate and redirect
  revalidatePath(`/admin/equipos/${sucursalId}`);
  revalidatePath("/admin/equipos");
  redirect(`/admin/equipos/${sucursalId}`);
}

// ── Delete Equipment ──────────────────────────────────────────────

export async function deleteEquipo(
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
    return { error: "ID de equipo no proporcionado" };
  }

  // 3. Get the sucursal_id before deleting (for revalidation)
  const { data: equipo } = await supabase
    .from("equipos")
    .select("sucursal_id")
    .eq("id", id)
    .single();

  // 4. Attempt delete
  const { error } = await supabase.from("equipos").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "No se puede eliminar este equipo porque tiene reportes asociados.",
      };
    }
    return { error: "Error al eliminar: " + error.message };
  }

  // 5. Revalidate and return success (no redirect on delete)
  if (equipo?.sucursal_id) {
    revalidatePath(`/admin/equipos/${equipo.sucursal_id}`);
  }
  revalidatePath("/admin/equipos");
  return { success: true, message: "Equipo eliminado exitosamente" };
}

// ── Create Equipment for Folio ──────────────────────────────────────────
// Creates equipment and links it to a folio in one step.
// Derives sucursal_id from the folio. Used by both admin and technician.

export async function createEquipoForFolio(
  folioId: string,
  reporteId: string | null,
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

  const rol = user.app_metadata?.rol;
  if (rol !== "tecnico" && rol !== "ayudante" && rol !== "admin") {
    return { error: "No autorizado" };
  }

  // 1. Get sucursal_id from the folio
  const { data: folio } = await supabase
    .from("folios")
    .select("sucursal_id")
    .eq("id", folioId)
    .single();

  if (!folio) {
    return { error: "Folio no encontrado" };
  }

  // 2. Validate with Zod (no sucursal_id in form)
  const rawData = {
    numero_etiqueta: formData.get("numero_etiqueta"),
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    numero_serie: formData.get("numero_serie"),
    tipo_equipo: formData.get("tipo_equipo"),
  };

  const result = equipoForFolioSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // 3. Prepare insert data
  const insertData: Record<string, unknown> = {
    sucursal_id: folio.sucursal_id,
    numero_etiqueta: result.data.numero_etiqueta,
    agregado_por: user.id,
    revisado: rol === "admin",
  };

  if (result.data.marca && result.data.marca !== "") {
    insertData.marca = result.data.marca;
  }
  if (result.data.modelo && result.data.modelo !== "") {
    insertData.modelo = result.data.modelo;
  }
  if (result.data.numero_serie && result.data.numero_serie !== "") {
    insertData.numero_serie = result.data.numero_serie;
  }
  if (result.data.tipo_equipo && result.data.tipo_equipo !== "") {
    insertData.tipo_equipo = result.data.tipo_equipo;
  }

  const tipoEquipoId = formData.get("tipo_equipo_id") as string;
  if (tipoEquipoId && tipoEquipoId !== "") {
    insertData.tipo_equipo_id = tipoEquipoId;
  }

  // 4. Insert equipment
  const { data: equipo, error: dbError } = await supabase
    .from("equipos")
    .insert(insertData)
    .select("id")
    .single();

  if (dbError) {
    return { error: "Error al agregar el equipo: " + dbError.message };
  }

  // 5. Link equipment to folio
  const { error: linkError } = await supabase
    .from("folio_equipos")
    .insert({
      folio_id: folioId,
      equipo_id: equipo.id,
      added_by: user.id,
    });

  if (linkError) {
    return {
      error:
        "El equipo fue creado pero no se pudo vincular al folio: " +
        linkError.message,
    };
  }

  // 5b. Auto-add to report if reporteId provided
  if (reporteId) {
    await supabase.from("reporte_equipos").insert({
      reporte_id: reporteId,
      equipo_id: equipo.id,
      tipo_trabajo: "preventivo",
    });
  }

  // 6. Revalidate and return
  revalidatePath("/tecnico");
  revalidatePath(`/admin/folios/${folioId}`);
  return {
    success: true,
    message: "Equipo agregado",
    data: { id: equipo.id },
  };
}

// ── Create Equipment from Field (Technician) ────────────────────────────
// Allows technicians/helpers to add equipment on-site.
// Equipment is flagged with revisado=false for admin review.

export async function createEquipoFromField(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  // 1. Verify authenticated user (tecnico or ayudante — NOT admin-only)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const rol = user.app_metadata?.rol;
  if (rol !== "tecnico" && rol !== "ayudante" && rol !== "admin") {
    return { error: "No autorizado" };
  }

  // 2. Validate with Zod
  const rawData = {
    sucursal_id: formData.get("sucursal_id"),
    numero_etiqueta: formData.get("numero_etiqueta"),
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    numero_serie: formData.get("numero_serie"),
    tipo_equipo: formData.get("tipo_equipo"),
  };

  const result = equipoSchema.safeParse(rawData);
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  // 3. Prepare insert data (empty strings become null for optional fields)
  const insertData: Record<string, unknown> = {
    sucursal_id: result.data.sucursal_id,
    numero_etiqueta: result.data.numero_etiqueta,
    agregado_por: user.id,
    revisado: false, // Tech-added equipment flagged for admin review
  };

  if (result.data.marca && result.data.marca !== "") {
    insertData.marca = result.data.marca;
  }
  if (result.data.modelo && result.data.modelo !== "") {
    insertData.modelo = result.data.modelo;
  }
  if (result.data.numero_serie && result.data.numero_serie !== "") {
    insertData.numero_serie = result.data.numero_serie;
  }
  if (result.data.tipo_equipo && result.data.tipo_equipo !== "") {
    insertData.tipo_equipo = result.data.tipo_equipo;
  }

  // Handle tipo_equipo_id from the new dropdown
  const tipoEquipoId = formData.get("tipo_equipo_id") as string;
  if (tipoEquipoId && tipoEquipoId !== "") {
    insertData.tipo_equipo_id = tipoEquipoId;
  }

  // 4. Insert into database
  const { data: equipo, error: dbError } = await supabase
    .from("equipos")
    .insert(insertData)
    .select("id")
    .single();

  if (dbError) {
    return { error: "Error al agregar el equipo: " + dbError.message };
  }

  // 5. Revalidate and return with new equipment ID
  revalidatePath("/tecnico");
  return {
    success: true,
    message: "Equipo agregado",
    data: { id: equipo.id },
  };
}
