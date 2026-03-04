"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import { ReportDocument } from "@/components/pdf/report-document";
import type { PdfReportData, PdfRegistrationEntry } from "@/components/pdf/report-document";
import {
  fetchImageAsBase64,
  fetchAllPhotosAsBase64,
  fetchImageAsBlob,
  downloadBlob,
} from "@/components/pdf/pdf-utils";
import type { PhotoBase64 } from "@/components/pdf/pdf-utils";

// ---------- Props ----------

interface ReportPdfButtonProps {
  reporte: {
    fecha: string;
    estatus: string;
    firma_encargado: string | null;
    nombre_encargado: string | null;
    numero_revision: number;
    revision_actual: number;
    updated_at: string;
  };
  lastRevision?: {
    fecha: string;
    autor: string;
  };
  orden: {
    numero_orden: string;
    descripcion_problema: string;
    created_at: string;
  };
  sucursal: {
    nombre: string;
    numero: string;
    direccion: string;
  };
  cliente: {
    nombre: string;
    logo_url: string | null;
  };
  teamMembers: { nombre: string; rol: string }[];
  /** Registration-phase photos (etiqueta=llegada, sitio, equipo_general, placa) */
  registrationPhotos: Array<{
    url: string;
    etiqueta: string | null;
    equipo_id: string | null;
    metadata_gps: string | null;
    metadata_fecha: string | null;
    tipo_media?: string;
  }>;
  /** Registration-phase equipment data (nameplate fields) */
  registrationEquipment: Array<{
    equipo_id: string;
    numero_etiqueta: string;
    tipo_equipo: string | null;
    ubicacion: string | null;
    marca: string | null;
    modelo: string | null;
    numero_serie: string | null;
    capacidad: string | null;
    refrigerante: string | null;
    voltaje: string | null;
    fase: string | null;
  }>;
  comments: Array<{
    contenido: string;
    autor_nombre: string;
    equipo_id: string | null;
    created_at: string;
  }>;
  equipmentEntries: Array<{
    equipo: {
      id: string;
      numero_etiqueta: string;
      marca: string | null;
      modelo: string | null;
    };
    tipo_trabajo: string;
    diagnostico: string | null;
    trabajo_realizado: string | null;
    observaciones: string | null;
    steps: Array<{
      id: string;
      nombre: string;
      completado: boolean;
      notas: string | null;
      lecturas: Record<string, number | string> | null;
      lecturas_meta: Array<{
        nombre: string;
        unidad: string;
        rango_min: number | null;
        rango_max: number | null;
      }> | null;
      isCustom?: boolean;
      orden?: number;
      isDiagnosis?: boolean;
      diagnosticoDescripcion?: string | null;
    }>;
    photos: Array<{
      url: string;
      etiqueta: string | null;
      metadata_gps: string | null;
      metadata_fecha: string | null;
      reporte_paso_id?: string | null;
      tipo_media?: string;
    }>;
  }>;
  materials: Array<{ cantidad: number; unidad: string; descripcion: string }>;
  papeletaPhotos?: Array<{
    url: string;
    metadata_gps: string | null;
    metadata_fecha: string | null;
    tipo_media?: string;
  }>;
}

// ---------- Helpers ----------

/** Sanitize a string for use as a folder/file name */
function sanitize(name: string): string {
  return name.replace(/[<>:"/\\|?*]+/g, "_").replace(/\s+/g, " ").trim();
}

/** Create a short, descriptive filename prefix from a step name.
 *  e.g. "Inspección y limpieza de ventiladores del condensador" → "Inspeccion_Limpieza_Ventiladores"
 */
function stepNamePrefix(stepName: string): string {
  // Remove accents
  const normalized = stepName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Split into words, drop filler words, capitalize each
  const filler = new Set(["de", "del", "la", "el", "los", "las", "y", "en", "a", "con", "por", "al", "e"]);
  const words = normalized
    .split(/\s+/)
    .filter((w) => !filler.has(w.toLowerCase()))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  // Take up to 3 meaningful words to keep it short but descriptive
  const selected = words.slice(0, 3);
  return selected.join("_").replace(/[<>:"/\\|?*]+/g, "") || "Paso";
}

/** Determine file extension from blob MIME type, with optional fallbacks */
function extFromBlob(blob: Blob, tipoMedia?: string, url?: string): string {
  const mime = blob.type;
  // Video MIME types
  if (mime.includes("video/mp4") || mime.includes("video/quicktime")) return ".mp4";
  if (mime.includes("video/webm")) return ".webm";
  if (mime.includes("video/")) return ".mp4";
  // Image MIME types
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  // Fallback: check tipo_media field from DB
  if (tipoMedia === "video") {
    if (url) {
      const lower = url.toLowerCase();
      if (lower.includes(".webm")) return ".webm";
      if (lower.includes(".mov")) return ".mp4";
    }
    return ".mp4";
  }
  // Fallback: check URL extension
  if (url) {
    const lower = url.toLowerCase();
    if (lower.includes(".mp4")) return ".mp4";
    if (lower.includes(".webm")) return ".webm";
    if (lower.includes(".mov")) return ".mp4";
    if (lower.includes(".png")) return ".png";
    if (lower.includes(".webp")) return ".webp";
  }
  return ".jpg";
}

// ---------- Component ----------

export default function ReportPdfButton({
  reporte,
  lastRevision,
  orden,
  sucursal,
  cliente,
  teamMembers,
  registrationPhotos,
  registrationEquipment,
  comments,
  equipmentEntries,
  materials,
  papeletaPhotos,
}: ReportPdfButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [generatingZip, setGeneratingZip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Build PdfReportData (shared between PDF and ZIP) ----------

  async function buildPdfData(): Promise<PdfReportData> {
    // 1. Pre-fetch company logo from public/
    let companyLogoBase64: string | null = null;
    try {
      companyLogoBase64 = await fetchImageAsBase64("/logo.png");
    } catch {
      console.warn("Company logo fetch failed");
    }

    // 2. Pre-fetch client logo if it exists
    let clientLogoBase64: string | null = null;
    if (cliente.logo_url) {
      try {
        clientLogoBase64 = await fetchImageAsBase64(cliente.logo_url);
      } catch {
        console.warn("Client logo fetch failed");
      }
    }

    // 3. Pre-fetch ALL equipment photos in parallel
    const photosPerEntry = await Promise.all(
      equipmentEntries.map((entry) =>
        fetchAllPhotosAsBase64(entry.photos ?? [])
      )
    );

    // 3b. Pre-fetch registration photos (arrival, site, equipo_general, placa)
    let arrivalPhotoData: { data: string; gps: string | null; fecha: string | null; isVideo: boolean } | null = null;
    let sitePhotoData: { data: string; gps: string | null; fecha: string | null; isVideo: boolean } | null = null;
    const regPhotoMap = new Map<string, { general: string | null; placa: string | null }>();

    if (registrationPhotos && registrationPhotos.length > 0) {
      const regFetched = await Promise.allSettled(
        registrationPhotos.map(async (p) => {
          const data = await fetchImageAsBase64(p.url);
          return { ...p, data };
        })
      );

      for (const result of regFetched) {
        if (result.status !== "fulfilled") continue;
        const p = result.value;
        const isVideo = p.tipo_media === "video";
        // Videos won't have base64 data — skip non-video entries that failed to fetch
        if (!isVideo && !p.data) continue;
        const imgData = (p.data ?? "") as string;
        if (p.etiqueta === "llegada" && !arrivalPhotoData) {
          arrivalPhotoData = { data: imgData, gps: p.metadata_gps, fecha: p.metadata_fecha, isVideo };
        } else if (p.etiqueta === "sitio" && !sitePhotoData) {
          sitePhotoData = { data: imgData, gps: p.metadata_gps, fecha: p.metadata_fecha, isVideo };
        } else if (p.etiqueta === "equipo_general" && p.equipo_id) {
          const existing = regPhotoMap.get(p.equipo_id) ?? { general: null, placa: null };
          if (!existing.general) existing.general = imgData;
          regPhotoMap.set(p.equipo_id, existing);
        } else if (p.etiqueta === "placa" && p.equipo_id) {
          const existing = regPhotoMap.get(p.equipo_id) ?? { general: null, placa: null };
          if (!existing.placa) existing.placa = imgData;
          regPhotoMap.set(p.equipo_id, existing);
        }
      }
    }

    // 3c. Build registration entries
    const pdfRegistrationEntries: PdfRegistrationEntry[] = (registrationEquipment ?? []).map((eq) => {
      const photos = regPhotoMap.get(eq.equipo_id);
      return {
        equipoTag: eq.numero_etiqueta,
        tipoEquipo: eq.tipo_equipo,
        ubicacion: eq.ubicacion,
        marca: eq.marca,
        modelo: eq.modelo,
        numero_serie: eq.numero_serie,
        capacidad: eq.capacidad,
        refrigerante: eq.refrigerante,
        voltaje: eq.voltaje,
        fase: eq.fase,
        photoGeneral: photos?.general ?? null,
        photoPlaca: photos?.placa ?? null,
      };
    });

    // 3d. Pre-fetch papeleta photos
    let papeletaPhotosBase64: PhotoBase64[] = [];
    if (papeletaPhotos && papeletaPhotos.length > 0) {
      const fetched = await Promise.allSettled(
        papeletaPhotos.map(async (p) => {
          const data = await fetchImageAsBase64(p.url);
          return {
            data: data as string,
            etiqueta: "papeleta",
            gps: p.metadata_gps,
            fecha: p.metadata_fecha,
            reportePasoId: null,
            isVideo: p.tipo_media === "video",
          } satisfies PhotoBase64;
        })
      );
      for (const r of fetched) {
        if (r.status === "fulfilled" && r.value.data) {
          papeletaPhotosBase64.push(r.value);
        }
      }
    }

    // 4. Transform data into PdfReportData shape — distribute photos into steps
    return {
      orden,
      sucursal,
      cliente: {
        nombre: cliente.nombre,
        logoBase64: clientLogoBase64,
      },
      companyLogoBase64,
      fecha: reporte.fecha,
      estatus: reporte.estatus,
      teamMembers,
      arrivalPhoto: arrivalPhotoData,
      sitePhoto: sitePhotoData,
      registrationEntries: pdfRegistrationEntries,
      comments: (comments ?? []).map((c) => ({
        contenido: c.contenido,
        autorNombre: c.autor_nombre,
        equipo_id: c.equipo_id,
        created_at: c.created_at,
      })),
      equipmentEntries: equipmentEntries.map((entry, idx) => {
        const allPhotos = photosPerEntry[idx];

        // Distribute photos into per-step maps
        const stepPhotosMap = new Map<string, PhotoBase64[]>();
        const orphanPhotos: PhotoBase64[] = [];

        for (const photo of allPhotos) {
          if (photo.reportePasoId) {
            const arr = stepPhotosMap.get(photo.reportePasoId) ?? [];
            arr.push(photo);
            stepPhotosMap.set(photo.reportePasoId, arr);
          } else {
            const regLabels = ["placa", "equipo_general"];
            if (!regLabels.includes(photo.etiqueta ?? "")) {
              orphanPhotos.push(photo);
            }
          }
        }

        // Build step list with photos assigned
        const stepsWithPhotos = (entry.steps ?? []).map((step) => ({
          ...step,
          photosBase64: stepPhotosMap.get(step.id) ?? [],
        }));

        // Safety net: photos linked to step IDs not in the step list → orphan
        const knownStepIds = new Set((entry.steps ?? []).map((s) => s.id));
        for (const [pasoId, photos] of stepPhotosMap.entries()) {
          if (!knownStepIds.has(pasoId)) {
            orphanPhotos.push(...photos);
          }
        }

        return {
          equipo: entry.equipo,
          tipo_trabajo: entry.tipo_trabajo,
          diagnostico: entry.diagnostico,
          trabajo_realizado: entry.trabajo_realizado,
          observaciones: entry.observaciones,
          steps: stepsWithPhotos,
          orphanPhotosBase64: orphanPhotos,
          photosBase64: allPhotos, // backward compat
        };
      }),
      materials,
      papeletaPhotos: papeletaPhotosBase64,
      firmaBase64: reporte.firma_encargado,
      nombreEncargado: reporte.nombre_encargado,
      numeroRevision: reporte.numero_revision,
      revisionActual: reporte.revision_actual,
      lastRevision: lastRevision ?? null,
      ordenCreatedAt: orden.created_at,
      reporteUpdatedAt: reporte.updated_at,
    };
  }

  // ---------- Generate PDF Blob ----------

  async function generatePdfBlob(): Promise<Blob> {
    const pdfData = await buildPdfData();
    return pdf(<ReportDocument data={pdfData} />).toBlob();
  }

  // ---------- Export PDF ----------

  async function handleExport() {
    setGenerating(true);
    setError(null);

    try {
      const blob = await generatePdfBlob();
      downloadBlob(
        blob,
        `Reporte_${orden.numero_orden}_${reporte.fecha}.pdf`
      );
    } catch (err) {
      console.error("PDF generation error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Error PDF: ${msg.slice(0, 150)}`);
    } finally {
      setGenerating(false);
    }
  }

  // ---------- Export ZIP ----------

  async function handleExportZip() {
    setGeneratingZip(true);
    setError(null);

    try {
      // 1. Generate PDF blob
      const pdfBlob = await generatePdfBlob();

      // 2. Create ZIP
      const zip = new JSZip();
      const baseName = `Reporte_${orden.numero_orden}_${reporte.fecha}`;

      // Add PDF to root
      zip.file(`${baseName}.pdf`, pdfBlob);

      // 3. Collect all photo fetch promises
      const photoFetchTasks: Array<{
        folder: string;
        name: string;
        url: string;
        tipoMedia?: string;
      }> = [];

      // General folder: arrival + site photos
      for (const rp of registrationPhotos ?? []) {
        if (rp.etiqueta === "llegada") {
          photoFetchTasks.push({
            folder: "General",
            name: `llegada${photoFetchTasks.filter((t) => t.folder === "General" && t.name.startsWith("llegada")).length + 1}`,
            url: rp.url,
            tipoMedia: rp.tipo_media,
          });
        } else if (rp.etiqueta === "sitio") {
          photoFetchTasks.push({
            folder: "General",
            name: `sitio${photoFetchTasks.filter((t) => t.folder === "General" && t.name.startsWith("sitio")).length + 1}`,
            url: rp.url,
            tipoMedia: rp.tipo_media,
          });
        }
      }

      // Equipment folders
      for (const entry of equipmentEntries) {
        const tag = sanitize(entry.equipo.numero_etiqueta);
        const tipo = entry.tipo_trabajo === "correctivo" ? "Correctivo" : "Preventivo";
        const folderName = `${tag}_${tipo}`;

        // Build step ID → step name map for this entry
        const stepNameMap = new Map<string, string>();
        for (const step of entry.steps ?? []) {
          stepNameMap.set(step.id, step.nombre);
        }

        // Count per composite key (stepPrefix+etiqueta) to number files
        const nameCounts: Record<string, number> = {};

        for (const photo of entry.photos ?? []) {
          const etiqueta = sanitize(photo.etiqueta || "foto");
          let fileName: string;

          if (photo.reporte_paso_id && stepNameMap.has(photo.reporte_paso_id)) {
            // Photo linked to a step — use step name prefix + etiqueta
            const prefix = stepNamePrefix(stepNameMap.get(photo.reporte_paso_id)!);
            const key = `${prefix}_${etiqueta}`;
            nameCounts[key] = (nameCounts[key] ?? 0) + 1;
            fileName = `${key}_${nameCounts[key]}`;
          } else if (entry.steps.length === 1) {
            // Orphan photo but only 1 step — infer step ownership
            const prefix = stepNamePrefix(entry.steps[0].nombre);
            const key = `${prefix}_${etiqueta}`;
            nameCounts[key] = (nameCounts[key] ?? 0) + 1;
            fileName = `${key}_${nameCounts[key]}`;
          } else {
            // Orphan photo with multiple/no steps — keep simple etiqueta naming
            nameCounts[etiqueta] = (nameCounts[etiqueta] ?? 0) + 1;
            fileName = `${etiqueta}_${nameCounts[etiqueta]}`;
          }

          photoFetchTasks.push({
            folder: folderName,
            name: fileName,
            url: photo.url,
            tipoMedia: photo.tipo_media,
          });
        }
      }

      // Also add registration equipo_general and placa photos
      for (const rp of registrationPhotos ?? []) {
        if (rp.etiqueta === "equipo_general" || rp.etiqueta === "placa") {
          // Find matching equipment tag
          const regEquip = (registrationEquipment ?? []).find((e) => e.equipo_id === rp.equipo_id);
          const tag = regEquip ? sanitize(regEquip.numero_etiqueta) : "equipo";
          const folderName = `${tag}_Registro`;

          photoFetchTasks.push({
            folder: folderName,
            name: sanitize(rp.etiqueta),
            url: rp.url,
            tipoMedia: rp.tipo_media,
          });
        }
      }

      // Papeleta photos
      for (let i = 0; i < (papeletaPhotos ?? []).length; i++) {
        const pp = papeletaPhotos![i];
        photoFetchTasks.push({
          folder: "Papeleta",
          name: `papeleta_${i + 1}`,
          url: pp.url,
          tipoMedia: pp.tipo_media,
        });
      }

      // 4. Fetch all photos in parallel
      const fetchResults = await Promise.allSettled(
        photoFetchTasks.map(async (task) => {
          const blob = await fetchImageAsBlob(task.url);
          return { ...task, blob };
        })
      );

      // 5. Add to ZIP
      for (const result of fetchResults) {
        if (result.status !== "fulfilled" || !result.value.blob) continue;
        const { folder, name, blob, tipoMedia, url } = result.value;
        const ext = extFromBlob(blob, tipoMedia, url);
        zip.file(`${folder}/${name}${ext}`, blob);
      }

      // 6. Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `${baseName}.zip`);
    } catch (err) {
      console.error("ZIP generation error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Error ZIP: ${msg.slice(0, 150)}`);
    } finally {
      setGeneratingZip(false);
    }
  }

  // ---------- Render ----------

  const isDisabled = generating || generatingZip;

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[12px] text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleExport}
        disabled={isDisabled}
        className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border bg-admin-surface px-4 py-2 text-[13px] font-medium text-text-1 transition-colors hover:bg-admin-surface-hover disabled:opacity-50"
      >
        {generating ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generando PDF...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Exportar PDF
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleExportZip}
        disabled={isDisabled}
        className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border bg-admin-surface px-4 py-2 text-[13px] font-medium text-text-1 transition-colors hover:bg-admin-surface-hover disabled:opacity-50"
      >
        {generatingZip ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generando ZIP...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Exportar ZIP
          </>
        )}
      </button>
    </div>
  );
}
