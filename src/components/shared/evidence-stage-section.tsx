"use client";

import { PhotoGalleryRow } from "@/components/shared/photo-gallery-row";
import type { ReporteFoto } from "@/types";

interface EvidenceStageSectionProps {
  evidencia: { etapa: string; descripcion: string }[];
  photos: ReporteFoto[];
  onTakePhoto: (stage: string) => void;
  onDeletePhoto?: (fotoId: string) => void;
  isUploading?: boolean;
  activeStage?: string | null;
  disabled?: boolean;
}

const stageOrder = ["antes", "durante", "despues"];

const stageStyles: Record<
  string,
  { bg: string; border: string; text: string; headerBg: string; label: string }
> = {
  antes: {
    bg: "bg-blue-50/50",
    border: "border-blue-200",
    text: "text-blue-700",
    headerBg: "bg-blue-100",
    label: "ANTES",
  },
  durante: {
    bg: "bg-amber-50/50",
    border: "border-amber-200",
    text: "text-amber-700",
    headerBg: "bg-amber-100",
    label: "DURANTE",
  },
  despues: {
    bg: "bg-green-50/50",
    border: "border-green-200",
    text: "text-green-700",
    headerBg: "bg-green-100",
    label: "DESPUES",
  },
};

export function EvidenceStageSection({
  evidencia,
  photos,
  onTakePhoto,
  onDeletePhoto,
  isUploading,
  activeStage,
  disabled,
}: EvidenceStageSectionProps) {
  if (evidencia.length === 0) return null;

  // Deduplicate by unique stage
  const uniqueStages = Array.from(new Set(evidencia.map((ev) => ev.etapa)));
  // Sort by canonical order
  const sortedStages = stageOrder.filter((s) => uniqueStages.includes(s));
  // Append any non-standard stages at the end
  for (const s of uniqueStages) {
    if (!sortedStages.includes(s)) sortedStages.push(s);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500">
        Evidencia
      </p>
      {sortedStages.map((stage) => {
        const style = stageStyles[stage] ?? stageStyles.antes;
        // Collect all descriptions for this stage
        const descriptions = evidencia
          .filter((ev) => ev.etapa === stage)
          .map((ev) => ev.descripcion);
        // Filter photos for this stage
        const stagePhotos = photos.filter(
          (p) => p.etiqueta === stage.toLowerCase()
        );
        const mediaCount = stagePhotos.length;
        const retakeCount = stagePhotos.filter(
          (p) => p.estatus_revision === "retomar"
        ).length;
        const rejectedCount = stagePhotos.filter(
          (p) => p.estatus_revision === "rechazada"
        ).length;

        return (
          <div
            key={stage}
            className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden`}
          >
            {/* Color header bar */}
            <div
              className={`flex items-center gap-2 px-3 py-2 ${style.headerBg}`}
            >
              <svg
                className={`h-4 w-4 ${style.text}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className={`text-xs font-bold ${style.text}`}>
                {style.label}
              </span>
              {/* Flagged photo indicators */}
              {retakeCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {retakeCount} retomar
                </span>
              )}
              {rejectedCount > 0 && (
                <span className={`${retakeCount > 0 ? "" : "ml-auto"} rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white`}>
                  {rejectedCount} rechazada{rejectedCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="p-3 space-y-2">
              {/* Guidance bullets */}
              {descriptions.map((desc, i) => (
                <p key={i} className="text-xs text-gray-500 leading-relaxed">
                  &bull; {desc}
                </p>
              ))}

              {/* Take photo button + count */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onTakePhoto(stage)}
                  disabled={disabled}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${style.text} bg-white border ${style.border} transition-colors active:opacity-80 disabled:opacity-50`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Agregar evidencia
                </button>
                {mediaCount > 0 && (
                  <span className="text-xs font-medium text-gray-500">
                    {mediaCount} archivo{mediaCount !== 1 ? "s" : ""}
                  </span>
                )}
                {isUploading && activeStage === stage && (
                  <span className="text-xs font-medium text-brand-600">
                    Subiendo...
                  </span>
                )}
              </div>

              {/* Photo/video thumbnails for this stage */}
              <PhotoGalleryRow
                photos={stagePhotos}
                onDelete={onDeletePhoto}
                disabled={disabled}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
