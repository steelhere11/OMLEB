"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CambioRevision } from "@/types";

interface ActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

// ── Create a revision entry for an approved report ──────────────────────

export async function createRevision(
  reporteId: string,
  resumen: string,
  cambios: CambioRevision[]
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  if (!resumen.trim()) {
    return { error: "El resumen de la revision es requerido" };
  }

  // Get current revision number
  const { data: reporte, error: fetchErr } = await supabase
    .from("reportes")
    .select("revision_actual")
    .eq("id", reporteId)
    .single();

  if (fetchErr || !reporte) {
    return { error: "Reporte no encontrado" };
  }

  const nextRevision = (reporte.revision_actual ?? 0) + 1;

  // Insert revision entry
  const { error: insertErr } = await supabase
    .from("reporte_revisiones")
    .insert({
      reporte_id: reporteId,
      autor_id: user.id,
      numero: nextRevision,
      resumen: resumen.trim(),
      cambios,
    });

  if (insertErr) {
    return { error: "Error al crear revision: " + insertErr.message };
  }

  // Increment revision_actual on the report
  const { error: updateErr } = await supabase
    .from("reportes")
    .update({ revision_actual: nextRevision })
    .eq("id", reporteId);

  if (updateErr) {
    return { error: "Error al actualizar numero de revision: " + updateErr.message };
  }

  revalidatePath("/admin/reportes");
  return { success: true, message: `Revision ${nextRevision} creada` };
}

// ── Fetch revision history for a report ─────────────────────────────────

export interface RevisionWithAuthor {
  id: string;
  reporte_id: string;
  autor_id: string;
  numero: number;
  resumen: string;
  cambios: CambioRevision[];
  created_at: string;
  autor_nombre: string;
}

export async function getRevisionHistory(
  reporteId: string
): Promise<RevisionWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reporte_revisiones")
    .select("*, users:autor_id(nombre)")
    .eq("reporte_id", reporteId)
    .order("numero", { ascending: false });

  if (error || !data) return [];

  return (data as (typeof data)[number][]).map((r) => ({
    id: r.id,
    reporte_id: r.reporte_id,
    autor_id: r.autor_id,
    numero: r.numero,
    resumen: r.resumen,
    cambios: (r.cambios ?? []) as CambioRevision[],
    created_at: r.created_at,
    autor_nombre:
      (r.users as { nombre: string } | null)?.nombre ?? "Desconocido",
  }));
}
