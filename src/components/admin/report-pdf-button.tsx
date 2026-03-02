"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/report-document";
import type { PdfReportData, PdfRegistrationEntry } from "@/components/pdf/report-document";
import {
  fetchImageAsBase64,
  fetchAllPhotosAsBase64,
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
    revision_actual: number;
  };
  lastRevision?: {
    fecha: string;
    autor: string;
  };
  folio: {
    numero_folio: string;
    descripcion_problema: string;
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
    }>;
    photos: Array<{
      url: string;
      etiqueta: string | null;
      metadata_gps: string | null;
      metadata_fecha: string | null;
      reporte_paso_id?: string | null;
    }>;
  }>;
  materials: Array<{ cantidad: number; unidad: string; descripcion: string }>;
}

// ---------- Component ----------

export default function ReportPdfButton({
  reporte,
  lastRevision,
  folio,
  sucursal,
  cliente,
  teamMembers,
  registrationPhotos,
  registrationEquipment,
  comments,
  equipmentEntries,
  materials,
}: ReportPdfButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setGenerating(true);
    setError(null);

    try {
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
      let arrivalPhotoData: { data: string; gps: string | null; fecha: string | null } | null = null;
      let sitePhotoData: { data: string; gps: string | null; fecha: string | null } | null = null;
      const regPhotoMap = new Map<string, { general: string | null; placa: string | null }>();

      if (registrationPhotos && registrationPhotos.length > 0) {
        const regFetched = await Promise.allSettled(
          registrationPhotos.map(async (p) => {
            const data = await fetchImageAsBase64(p.url);
            return { ...p, data };
          })
        );

        for (const result of regFetched) {
          if (result.status !== "fulfilled" || !result.value.data) continue;
          const p = result.value;
          const imgData = p.data as string; // guaranteed non-null by check above
          if (p.etiqueta === "llegada" && !arrivalPhotoData) {
            arrivalPhotoData = { data: imgData, gps: p.metadata_gps, fecha: p.metadata_fecha };
          } else if (p.etiqueta === "sitio" && !sitePhotoData) {
            sitePhotoData = { data: imgData, gps: p.metadata_gps, fecha: p.metadata_fecha };
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

      // 4. Transform data into PdfReportData shape — distribute photos into steps
      const pdfData: PdfReportData = {
        folio,
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
              orphanPhotos.push(photo);
            }
          }

          return {
            equipo: entry.equipo,
            tipo_trabajo: entry.tipo_trabajo,
            diagnostico: entry.diagnostico,
            trabajo_realizado: entry.trabajo_realizado,
            observaciones: entry.observaciones,
            steps: (entry.steps ?? []).map((step) => ({
              ...step,
              photosBase64: stepPhotosMap.get(step.id) ?? [],
            })),
            orphanPhotosBase64: orphanPhotos,
            photosBase64: allPhotos, // backward compat
          };
        }),
        materials,
        firmaBase64: reporte.firma_encargado,
        nombreEncargado: reporte.nombre_encargado,
        revisionActual: reporte.revision_actual,
        lastRevision: lastRevision ?? null,
      };

      // 5. Generate PDF blob
      const blob = await pdf(<ReportDocument data={pdfData} />).toBlob();

      // 6. Trigger download
      downloadBlob(
        blob,
        `Reporte_${folio.numero_folio}_${reporte.fecha}.pdf`
      );
    } catch (err) {
      console.error("PDF generation error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Error PDF: ${msg.slice(0, 150)}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[12px] text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleExport}
        disabled={generating}
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
    </div>
  );
}
