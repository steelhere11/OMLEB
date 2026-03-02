"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/types/actions";

// ── Helper: Extract storage path from public URL ─────────────────────────
// URL format: .../storage/v1/object/public/reportes/<path>

function extractStoragePath(url: string): string | null {
  const marker = "/storage/v1/object/public/reportes/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;
  return decodeURIComponent(url.substring(markerIndex + marker.length));
}

// ── Helper: Verify caller is admin ───────────────────────────────────────

async function verifyAdmin(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  return {};
}

// ── Helper: Delete storage files for a list of photo URLs ────────────────

async function deleteStorageFiles(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const admin = createAdminClient();
  const paths = urls
    .map(extractStoragePath)
    .filter((p): p is string => p !== null);

  if (paths.length > 0) {
    // Supabase storage remove accepts batches
    await admin.storage.from("reportes").remove(paths);
  }
}

// ── Helper: Fetch photo URLs for a report ────────────────────────────────

async function fetchPhotoUrls(reporteId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("reporte_fotos")
    .select("url")
    .eq("reporte_id", reporteId);

  return (data ?? []).map((row) => row.url);
}

// ══════════════════════════════════════════════════════════════════════════
// 1. Admin Delete Report
// ══════════════════════════════════════════════════════════════════════════
// Deletes a single report and all its children (CASCADE handles:
// reporte_equipos, reporte_fotos, reporte_materiales, reporte_pasos,
// reporte_comentarios). Storage files are cleaned up first.

export async function adminDeleteReport(
  reporteId: string
): Promise<ActionState> {
  const auth = await verifyAdmin();
  if (auth.error) return { error: auth.error };

  const admin = createAdminClient();

  // 1. Fetch all photo/video URLs for storage cleanup
  const urls = await fetchPhotoUrls(reporteId);

  // 2. Delete storage files (best effort)
  await deleteStorageFiles(urls);

  // 3. Delete the report row — CASCADE handles all children
  const { error } = await admin
    .from("reportes")
    .delete()
    .eq("id", reporteId);

  if (error) {
    return { error: "Error al eliminar reporte: " + error.message };
  }

  revalidatePath("/admin/reportes");
  revalidatePath("/admin/folios");
  return { success: true, message: "Reporte eliminado exitosamente" };
}

// ══════════════════════════════════════════════════════════════════════════
// 2. Admin Delete Folio
// ══════════════════════════════════════════════════════════════════════════
// Deletes a folio and all its reports. Storage files cleaned up for every
// report. CASCADE on folios handles: folio_asignados, folio_equipos.
// Reports use ON DELETE RESTRICT on folio_id, so we delete them explicitly.

export async function adminDeleteFolio(
  folioId: string
): Promise<ActionState> {
  const auth = await verifyAdmin();
  if (auth.error) return { error: auth.error };

  const admin = createAdminClient();

  // 1. Fetch all reports for this folio
  const { data: reportes } = await admin
    .from("reportes")
    .select("id")
    .eq("folio_id", folioId);

  // 2. For each report, fetch photo URLs and delete storage files
  if (reportes && reportes.length > 0) {
    for (const reporte of reportes) {
      const urls = await fetchPhotoUrls(reporte.id);
      await deleteStorageFiles(urls);
    }

    // 3. Delete all reports (CASCADE cleans children)
    const reporteIds = reportes.map((r) => r.id);
    const { error: reporteError } = await admin
      .from("reportes")
      .delete()
      .in("id", reporteIds);

    if (reporteError) {
      return {
        error:
          "Error al eliminar reportes del folio: " + reporteError.message,
      };
    }
  }

  // 4. Delete the folio itself (CASCADE: folio_asignados, folio_equipos)
  const { error } = await admin
    .from("folios")
    .delete()
    .eq("id", folioId);

  if (error) {
    return { error: "Error al eliminar folio: " + error.message };
  }

  revalidatePath("/admin/folios");
  revalidatePath("/admin/reportes");
  return { success: true, message: "Folio eliminado exitosamente" };
}

// ══════════════════════════════════════════════════════════════════════════
// 3. Admin Delete Equipo
// ══════════════════════════════════════════════════════════════════════════
// Detaches equipment from reports and folios, then deletes the equipment.
// reporte_fotos.equipo_id is ON DELETE SET NULL (auto-nullified).
// reporte_equipos.equipo_id is ON DELETE RESTRICT, so we delete those rows.
// folio_equipos.equipo_id is ON DELETE RESTRICT, so we delete those rows.

export async function adminDeleteEquipo(
  equipoId: string
): Promise<ActionState> {
  const auth = await verifyAdmin();
  if (auth.error) return { error: auth.error };

  const admin = createAdminClient();

  // 1. Delete reporte_equipos rows referencing this equipment
  const { error: reError } = await admin
    .from("reporte_equipos")
    .delete()
    .eq("equipo_id", equipoId);

  if (reError) {
    return {
      error: "Error al desvincular equipo de reportes: " + reError.message,
    };
  }

  // 2. Delete folio_equipos rows referencing this equipment
  const { error: feError } = await admin
    .from("folio_equipos")
    .delete()
    .eq("equipo_id", equipoId);

  if (feError) {
    return {
      error: "Error al desvincular equipo de folios: " + feError.message,
    };
  }

  // 3. reporte_fotos.equipo_id is ON DELETE SET NULL — handled automatically

  // 4. Delete the equipment itself
  const { error } = await admin
    .from("equipos")
    .delete()
    .eq("id", equipoId);

  if (error) {
    return { error: "Error al eliminar equipo: " + error.message };
  }

  revalidatePath("/admin/equipos");
  revalidatePath("/admin/reportes");
  return { success: true, message: "Equipo eliminado exitosamente" };
}

// ══════════════════════════════════════════════════════════════════════════
// 4. Admin Delete Sucursal
// ══════════════════════════════════════════════════════════════════════════
// Deletes a branch and everything connected to it:
// - All folios for this sucursal (with their reports + storage files)
// - Any orphan reports directly referencing sucursal_id
// - The sucursal itself (CASCADE deletes all equipos under it)

export async function adminDeleteSucursal(
  sucursalId: string
): Promise<ActionState> {
  const auth = await verifyAdmin();
  if (auth.error) return { error: auth.error };

  const admin = createAdminClient();

  // 1. Fetch all folios for this sucursal
  const { data: folios } = await admin
    .from("folios")
    .select("id")
    .eq("sucursal_id", sucursalId);

  // 2. For each folio, delete all reports (with storage cleanup) and then the folio
  if (folios && folios.length > 0) {
    for (const folio of folios) {
      // Fetch reports for this folio
      const { data: reportes } = await admin
        .from("reportes")
        .select("id")
        .eq("folio_id", folio.id);

      if (reportes && reportes.length > 0) {
        // Clean up storage for each report
        for (const reporte of reportes) {
          const urls = await fetchPhotoUrls(reporte.id);
          await deleteStorageFiles(urls);
        }

        // Delete all reports for this folio
        const reporteIds = reportes.map((r) => r.id);
        await admin.from("reportes").delete().in("id", reporteIds);
      }

      // Delete the folio (CASCADE: folio_asignados, folio_equipos)
      await admin.from("folios").delete().eq("id", folio.id);
    }
  }

  // 3. Handle orphan reports directly referencing sucursal_id
  //    (reports whose folio was already deleted but still reference this sucursal)
  const { data: orphanReportes } = await admin
    .from("reportes")
    .select("id")
    .eq("sucursal_id", sucursalId);

  if (orphanReportes && orphanReportes.length > 0) {
    for (const reporte of orphanReportes) {
      const urls = await fetchPhotoUrls(reporte.id);
      await deleteStorageFiles(urls);
    }

    const orphanIds = orphanReportes.map((r) => r.id);
    await admin.from("reportes").delete().in("id", orphanIds);
  }

  // 4. Delete the sucursal itself (CASCADE deletes all equipos under it)
  const { error } = await admin
    .from("sucursales")
    .delete()
    .eq("id", sucursalId);

  if (error) {
    return { error: "Error al eliminar sucursal: " + error.message };
  }

  revalidatePath("/admin/sucursales");
  revalidatePath("/admin/folios");
  revalidatePath("/admin/reportes");
  revalidatePath("/admin/equipos");
  return { success: true, message: "Sucursal eliminada exitosamente" };
}
