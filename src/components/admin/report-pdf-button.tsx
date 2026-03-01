"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/pdf/report-document";
import type { PdfReportData } from "@/components/pdf/report-document";
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
  equipmentEntries: Array<{
    equipo: {
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
  folio,
  sucursal,
  cliente,
  teamMembers,
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
      const companyLogoBase64 = await fetchImageAsBase64("/logo.png");

      // 2. Pre-fetch client logo if it exists
      const clientLogoBase64 = cliente.logo_url
        ? await fetchImageAsBase64(cliente.logo_url)
        : null;

      // 3. Pre-fetch ALL equipment photos in parallel
      const photosPerEntry = await Promise.all(
        equipmentEntries.map((entry) => fetchAllPhotosAsBase64(entry.photos))
      );

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
            steps: entry.steps.map((step) => ({
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
      setError("Error al generar PDF");
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
