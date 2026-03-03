"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fallaCorrectivaSchema } from "@/lib/validations/fallas-correctivas";
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

  // Parse materiales_tipicos from comma-separated or repeated fields
  const materialesRaw = formData.get("materiales_tipicos") as string;
  const materiales = materialesRaw
    ? materialesRaw
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
    : [];

  return {
    tipo_equipo_slug: formData.get("tipo_equipo_slug"),
    nombre: formData.get("nombre"),
    diagnostico: formData.get("diagnostico"),
    evidencia_requerida: evidencia,
    materiales_tipicos: materiales,
  };
}

// ── Create ──────────────────────────────────────────────────────

export async function createFallaCorrectiva(
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
  const result = fallaCorrectivaSchema.safeParse(rawData);

  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin.from("fallas_correctivas").insert({
    tipo_equipo_slug: result.data.tipo_equipo_slug,
    nombre: result.data.nombre,
    diagnostico: result.data.diagnostico,
    evidencia_requerida: result.data.evidencia_requerida,
    materiales_tipicos: result.data.materiales_tipicos,
  });

  if (dbError) {
    return { error: "Error al crear la falla: " + dbError.message };
  }

  revalidatePath("/admin/fallas-correctivas");
  redirect("/admin/fallas-correctivas");
}

// ── Update ──────────────────────────────────────────────────────

export async function updateFallaCorrectiva(
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
  const result = fallaCorrectivaSchema.safeParse(rawData);

  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return { fieldErrors: flattened.fieldErrors };
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("fallas_correctivas")
    .update({
      tipo_equipo_slug: result.data.tipo_equipo_slug,
      nombre: result.data.nombre,
      diagnostico: result.data.diagnostico,
      evidencia_requerida: result.data.evidencia_requerida,
      materiales_tipicos: result.data.materiales_tipicos,
    })
    .eq("id", id);

  if (dbError) {
    return { error: "Error al actualizar la falla: " + dbError.message };
  }

  revalidatePath("/admin/fallas-correctivas");
  redirect("/admin/fallas-correctivas");
}

// ── Delete ──────────────────────────────────────────────────────

export async function deleteFallaCorrectiva(
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
    .from("fallas_correctivas")
    .delete()
    .eq("id", id);

  if (dbError) {
    return { error: "Error al eliminar: " + dbError.message };
  }

  revalidatePath("/admin/fallas-correctivas");
  return { success: true, message: "Falla eliminada" };
}
