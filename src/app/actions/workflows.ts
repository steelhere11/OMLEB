"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";
import type {
  PlantillaPaso,
  FallaCorrectiva,
  TipoEquipo,
  ReportePaso,
  ValorReferencia,
} from "@/types";

// ── Get Workflow Templates ──────────────────────────────────────────────

export async function getWorkflowTemplates(
  tipoEquipoSlug: string,
  tipoMantenimiento: string
): Promise<PlantillaPaso[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("plantillas_pasos")
    .select("*")
    .eq("tipo_equipo_slug", tipoEquipoSlug)
    .eq("tipo_mantenimiento", tipoMantenimiento)
    .order("orden", { ascending: true });

  if (error) return [];

  return (data as PlantillaPaso[]) ?? [];
}

// ── Get Corrective Issues ───────────────────────────────────────────────

export async function getCorrectiveIssues(
  tipoEquipoSlug: string
): Promise<FallaCorrectiva[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("fallas_correctivas")
    .select("*")
    .eq("tipo_equipo_slug", tipoEquipoSlug);

  if (error) return [];

  return (data as FallaCorrectiva[]) ?? [];
}

// ── Get Tipos Equipo ────────────────────────────────────────────────────

export async function getTiposEquipo(): Promise<TipoEquipo[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("tipos_equipo")
    .select("*")
    .order("is_system", { ascending: false })
    .order("nombre", { ascending: true });

  if (error) return [];

  return (data as TipoEquipo[]) ?? [];
}

// ── Get Step Progress ───────────────────────────────────────────────────

export async function getStepProgress(
  reporteEquipoId: string
): Promise<ReportePaso[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("reporte_pasos")
    .select("*")
    .eq("reporte_equipo_id", reporteEquipoId);

  if (error) return [];

  return (data as ReportePaso[]) ?? [];
}

// ── Save Step Progress ──────────────────────────────────────────────────

export async function saveStepProgress(
  reporteEquipoId: string,
  plantillaPasoId: string,
  data: {
    completado: boolean;
    notas?: string;
    lecturas?: Record<string, number | string>;
  }
): Promise<ActionState & { stepId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  // Find existing row
  const { data: existing } = await supabase
    .from("reporte_pasos")
    .select("id")
    .eq("reporte_equipo_id", reporteEquipoId)
    .eq("plantilla_paso_id", plantillaPasoId)
    .maybeSingle();

  const row = {
    reporte_equipo_id: reporteEquipoId,
    plantilla_paso_id: plantillaPasoId,
    completado: data.completado,
    notas: data.notas || null,
    lecturas: data.lecturas ?? {},
    completed_at: data.completado ? new Date().toISOString() : null,
  };

  if (existing) {
    const { error } = await supabase
      .from("reporte_pasos")
      .update(row)
      .eq("id", existing.id);

    if (error) {
      return { error: "Error al guardar progreso: " + error.message };
    }

    revalidatePath("/tecnico");
    return { success: true, message: "Progreso guardado", stepId: existing.id };
  } else {
    const { data: newRow, error } = await supabase
      .from("reporte_pasos")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      return { error: "Error al guardar progreso: " + error.message };
    }

    revalidatePath("/tecnico");
    return { success: true, message: "Progreso guardado", stepId: newRow.id };
  }
}

// ── Ensure Step Progress Row Exists (for photo uploads) ─────────────────

export async function ensureStepProgress(
  reporteEquipoId: string,
  plantillaPasoId: string
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if already exists
  const { data: existing } = await supabase
    .from("reporte_pasos")
    .select("id")
    .eq("reporte_equipo_id", reporteEquipoId)
    .eq("plantilla_paso_id", plantillaPasoId)
    .maybeSingle();

  if (existing) return existing.id;

  // Create minimal row
  const { data: newRow, error } = await supabase
    .from("reporte_pasos")
    .insert({
      reporte_equipo_id: reporteEquipoId,
      plantilla_paso_id: plantillaPasoId,
      completado: false,
      notas: null,
      lecturas: {},
      completed_at: null,
    })
    .select("id")
    .single();

  if (error) return null;
  return newRow.id;
}

// ── Ensure Corrective Step Exists (for photo uploads) ────────────────────

export async function ensureCorrectiveStep(
  reporteEquipoId: string,
  fallaCorrectivaId: string
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if already exists
  const { data: existing } = await supabase
    .from("reporte_pasos")
    .select("id")
    .eq("reporte_equipo_id", reporteEquipoId)
    .eq("falla_correctiva_id", fallaCorrectivaId)
    .maybeSingle();

  if (existing) return existing.id;

  // Create minimal row
  const { data: newRow, error } = await supabase
    .from("reporte_pasos")
    .insert({
      reporte_equipo_id: reporteEquipoId,
      falla_correctiva_id: fallaCorrectivaId,
      completado: false,
      notas: null,
      lecturas: {},
      completed_at: null,
    })
    .select("id")
    .single();

  if (error) return null;
  return newRow.id;
}

// ── Save Corrective Selection ───────────────────────────────────────────

export async function saveCorrectiveSelection(
  reporteEquipoId: string,
  fallaCorrectivaIds: string[]
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  // Delete existing corrective selections for this entry
  const { error: deleteError } = await supabase
    .from("reporte_pasos")
    .delete()
    .eq("reporte_equipo_id", reporteEquipoId)
    .not("falla_correctiva_id", "is", null);

  if (deleteError) {
    return { error: "Error al actualizar seleccion: " + deleteError.message };
  }

  // Insert new selections
  if (fallaCorrectivaIds.length > 0) {
    const rows = fallaCorrectivaIds.map((id) => ({
      reporte_equipo_id: reporteEquipoId,
      falla_correctiva_id: id,
      completado: true,
      lecturas: {},
    }));

    const { error: insertError } = await supabase
      .from("reporte_pasos")
      .insert(rows);

    if (insertError) {
      return { error: "Error al guardar seleccion: " + insertError.message };
    }
  }

  revalidatePath("/tecnico");
  return { success: true, message: "Seleccion guardada" };
}

// ── Add Custom Step ─────────────────────────────────────────────────────

export async function addCustomStep(
  reporteEquipoId: string,
  nombre: string,
  procedimiento?: string
): Promise<{ data: ReportePaso | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "No autorizado" };
  }

  if (!nombre.trim()) {
    return { data: null, error: "El nombre del paso es requerido" };
  }

  // Insert custom step (plantilla_paso_id and falla_correctiva_id both NULL)
  const { data, error } = await supabase
    .from("reporte_pasos")
    .insert({
      reporte_equipo_id: reporteEquipoId,
      plantilla_paso_id: null,
      falla_correctiva_id: null,
      nombre_custom: nombre.trim(),
      notas: procedimiento?.trim() || null,
      completado: false,
      lecturas: {},
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: "Error al agregar paso: " + error.message };
  }

  revalidatePath("/tecnico");
  revalidatePath("/admin");
  return { data: data as ReportePaso, error: null };
}

// ── Save Custom Step Progress ───────────────────────────────────────────

export async function saveCustomStepProgress(
  reportePasoId: string,
  data: {
    completado: boolean;
    notas?: string;
    lecturas?: Record<string, number | string>;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reporte_pasos")
    .update({
      completado: data.completado,
      notas: data.notas || null,
      lecturas: data.lecturas ?? {},
      completed_at: data.completado ? new Date().toISOString() : null,
    })
    .eq("id", reportePasoId);

  if (error) {
    return { error: "Error al guardar progreso: " + error.message };
  }

  revalidatePath("/tecnico");
  return { success: true, message: "Progreso guardado" };
}

// ── Delete Custom Step ──────────────────────────────────────────────────

export async function deleteCustomStep(
  reportePasoId: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase
    .from("reporte_pasos")
    .delete()
    .eq("id", reportePasoId);

  if (error) {
    return { error: "Error al eliminar paso: " + error.message };
  }

  revalidatePath("/tecnico");
  revalidatePath("/admin/reportes");
  return { success: true, message: "Paso eliminado" };
}

// ── Get Valores Referencia ──────────────────────────────────────────────

export async function getValoresReferencia(): Promise<ValorReferencia[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("valores_referencia")
    .select("*");

  if (error) return [];

  return (data as ValorReferencia[]) ?? [];
}
