"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { plantillaPasoSchema } from "@/lib/validations/mantenimientos-preventivos";
import { z } from "zod";
import type { ActionState } from "@/types/actions";

// ── Helpers ─────────────────────────────────────────────────────

function parseFormData(formData: FormData) {
  // Parse evidencia_requerida from repeated form fields
  const evidencia: { etapa: string; descripcion: string }[] = [];
  let i = 0;
  while (formData.has(`evidencia_etapa_${i}`)) {
    const etapa = formData.get(`evidencia_etapa_${i}`) as string;
    const desc = formData.get(`evidencia_desc_${i}`) as string;
    if (etapa && desc) {
      evidencia.push({ etapa, descripcion: desc });
    }
    i++;
  }

  // Parse lecturas_requeridas from repeated form fields
  const lecturas: { nombre: string; unidad: string; rango_min: number | null; rango_max: number | null }[] = [];
  let j = 0;
  while (formData.has(`lectura_nombre_${j}`)) {
    const nombre = formData.get(`lectura_nombre_${j}`) as string;
    const unidad = formData.get(`lectura_unidad_${j}`) as string;
    const minRaw = formData.get(`lectura_min_${j}`) as string;
    const maxRaw = formData.get(`lectura_max_${j}`) as string;
    if (nombre && unidad) {
      lecturas.push({
        nombre,
        unidad,
        rango_min: minRaw ? parseFloat(minRaw) : null,
        rango_max: maxRaw ? parseFloat(maxRaw) : null,
      });
    }
    j++;
  }

  const ordenRaw = formData.get("orden") as string;
  const esObligatorioRaw = formData.get("es_obligatorio") as string;

  return {
    tipo_equipo_slug: formData.get("tipo_equipo_slug"),
    orden: ordenRaw ? parseInt(ordenRaw, 10) : undefined,
    nombre: formData.get("nombre"),
    procedimiento: formData.get("procedimiento"),
    evidencia_requerida: evidencia,
    lecturas_requeridas: lecturas,
    es_obligatorio: esObligatorioRaw === "true",
  };
}

// ── Create ──────────────────────────────────────────────────────

export async function createPlantillaPaso(
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

  const rawData = parseFormData(formData);
  const result = plantillaPasoSchema.safeParse(rawData);

  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin.from("plantillas_pasos").insert({
    tipo_equipo_slug: result.data.tipo_equipo_slug,
    tipo_mantenimiento: "preventivo",
    orden: result.data.orden,
    nombre: result.data.nombre,
    procedimiento: result.data.procedimiento,
    evidencia_requerida: result.data.evidencia_requerida,
    lecturas_requeridas: result.data.lecturas_requeridas,
    es_obligatorio: result.data.es_obligatorio,
  });

  if (dbError) {
    if (dbError.code === "23505") {
      return { error: "Ya existe un paso con ese orden para este tipo de equipo y mantenimiento preventivo." };
    }
    return { error: "Error al crear el paso: " + dbError.message };
  }

  revalidatePath("/admin/mantenimientos-preventivos");
  redirect("/admin/mantenimientos-preventivos");
}

// ── Update ──────────────────────────────────────────────────────

export async function updatePlantillaPaso(
  id: string,
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

  const rawData = parseFormData(formData);
  const result = plantillaPasoSchema.safeParse(rawData);

  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("plantillas_pasos")
    .update({
      tipo_equipo_slug: result.data.tipo_equipo_slug,
      orden: result.data.orden,
      nombre: result.data.nombre,
      procedimiento: result.data.procedimiento,
      evidencia_requerida: result.data.evidencia_requerida,
      lecturas_requeridas: result.data.lecturas_requeridas,
      es_obligatorio: result.data.es_obligatorio,
    })
    .eq("id", id);

  if (dbError) {
    if (dbError.code === "23505") {
      return { error: "Ya existe un paso con ese orden para este tipo de equipo y mantenimiento preventivo." };
    }
    return { error: "Error al actualizar el paso: " + dbError.message };
  }

  revalidatePath("/admin/mantenimientos-preventivos");
  redirect("/admin/mantenimientos-preventivos");
}

// ── Reorder ─────────────────────────────────────────────────────

export async function reorderPlantillaPasos(
  steps: { id: string; orden: number }[]
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  // Two-pass update to avoid unique constraint violations on (tipo_equipo_slug, tipo_mantenimiento, orden).
  // Pass 1: set all to negative temporary values so no conflicts exist.
  // Pass 2: set to the real target values.
  const admin = createAdminClient();
  for (const step of steps) {
    const { error } = await admin
      .from("plantillas_pasos")
      .update({ orden: -step.orden })
      .eq("id", step.id);

    if (error) {
      return { error: "Error al reordenar pasos: " + error.message };
    }
  }
  for (const step of steps) {
    const { error } = await admin
      .from("plantillas_pasos")
      .update({ orden: step.orden })
      .eq("id", step.id);

    if (error) {
      return { error: "Error al reordenar pasos: " + error.message };
    }
  }

  revalidatePath("/admin/mantenimientos-preventivos");
  return { success: true, message: "Orden actualizado" };
}

// ── Delete ──────────────────────────────────────────────────────

export async function deletePlantillaPaso(
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

  const id = formData.get("id") as string;
  if (!id) return { error: "ID requerido" };

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("plantillas_pasos")
    .delete()
    .eq("id", id);

  if (dbError) {
    return { error: "Error al eliminar: " + dbError.message };
  }

  revalidatePath("/admin/mantenimientos-preventivos");
  return { success: true, message: "Paso eliminado" };
}
