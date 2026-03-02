"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { ReporteFoto } from "@/types";
import { reverseGeocode } from "@/lib/gps";

interface PhotoThumbnailProps {
  foto: ReporteFoto;
  onDelete?: (fotoId: string) => void;
  disabled?: boolean;
}

const etapaColors: Record<string, { bg: string; text: string }> = {
  antes: { bg: "bg-blue-500", text: "text-white" },
  durante: { bg: "bg-amber-500", text: "text-white" },
  despues: { bg: "bg-green-500", text: "text-white" },
  dano: { bg: "bg-red-500", text: "text-white" },
  placa: { bg: "bg-gray-500", text: "text-white" },
  progreso: { bg: "bg-purple-500", text: "text-white" },
};

/** Detect whether a ReporteFoto is a video */
function isVideoMedia(foto: ReporteFoto): boolean {
  return foto.tipo_media === "video" || /\.(mp4|mov|webm)$/i.test(foto.url);
}

export function PhotoThumbnail({
  foto,
  onDelete,
  disabled,
}: PhotoThumbnailProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addressLines, setAddressLines] = useState<string[]>([]);

  const colors = etapaColors[foto.etiqueta ?? ""] ?? etapaColors.antes;
  const isVideo = isVideoMedia(foto);

  // Reverse-geocode GPS coordinates when lightbox opens for a video
  useEffect(() => {
    if (!showLightbox || !isVideo || !foto.metadata_gps) return;
    const parts = foto.metadata_gps.split(",").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      reverseGeocode(parts[0], parts[1]).then(setAddressLines);
    }
  }, [showLightbox, isVideo, foto.metadata_gps]);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    onDelete(foto.id);
    setShowConfirm(false);
    setShowLightbox(false);
  };

  // Review status styling
  const statusBorder =
    foto.estatus_revision === "retomar"
      ? "ring-2 ring-amber-400"
      : foto.estatus_revision === "rechazada"
        ? "ring-2 ring-red-400 opacity-60"
        : foto.estatus_revision === "aceptada"
          ? "ring-2 ring-green-400"
          : "";

  return (
    <>
      {/* Thumbnail */}
      <div className="flex-shrink-0" style={{ scrollSnapAlign: "start" }}>
        <button
          type="button"
          onClick={() => setShowLightbox(true)}
          className={`relative h-16 w-16 overflow-hidden rounded-lg ${statusBorder}`}
        >
          {isVideo ? (
            <>
              {/* Video thumbnail: show first frame via <video> */}
              <video
                src={foto.url}
                preload="metadata"
                muted
                playsInline
                className="h-16 w-16 object-cover rounded-lg"
              />
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50">
                  <svg
                    className="h-3 w-3 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <Image
              src={foto.url}
              alt={foto.etiqueta ?? "Foto"}
              fill
              className="object-cover"
              sizes="64px"
            />
          )}
          {/* Label badge */}
          {foto.etiqueta && (
            <span
              className={`absolute bottom-0.5 left-0.5 rounded px-1 py-0.5 text-[8px] font-bold uppercase leading-none ${colors.bg} ${colors.text}`}
            >
              {foto.etiqueta === "despues" ? "DESP" : foto.etiqueta.slice(0, 4).toUpperCase()}
            </span>
          )}

          {/* Review status badge */}
          {foto.estatus_revision === "aceptada" && (
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
          {foto.estatus_revision === "rechazada" && (
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          {foto.estatus_revision === "retomar" && (
            <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </span>
          )}
        </button>

        {/* Admin note below thumbnail for flagged photos */}
        {(foto.estatus_revision === "retomar" || foto.estatus_revision === "rechazada") &&
          foto.nota_admin && (
            <p
              className={`mt-1 max-w-[64px] truncate text-[9px] leading-tight ${
                foto.estatus_revision === "retomar"
                  ? "text-amber-600"
                  : "text-red-500"
              }`}
              title={foto.nota_admin}
            >
              {foto.nota_admin}
            </p>
          )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLightbox(false);
              setShowConfirm(false);
            }
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              setShowLightbox(false);
              setShowConfirm(false);
            }}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Label badge in lightbox */}
          {foto.etiqueta && (
            <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
              <span
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}
              >
                {foto.etiqueta}
              </span>
              {foto.estatus_revision === "retomar" && (
                <span className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white">
                  RETOMAR
                </span>
              )}
              {foto.estatus_revision === "rechazada" && (
                <span className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white">
                  RECHAZADA
                </span>
              )}
              {foto.estatus_revision === "aceptada" && (
                <span className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white">
                  ACEPTADA
                </span>
              )}
            </div>
          )}

          {/* Admin note banner in lightbox */}
          {foto.nota_admin && (foto.estatus_revision === "retomar" || foto.estatus_revision === "rechazada") && (
            <div
              className={`absolute left-4 right-4 top-14 z-10 rounded-lg px-3 py-2 ${
                foto.estatus_revision === "retomar"
                  ? "bg-amber-500/90"
                  : "bg-red-500/90"
              }`}
            >
              <p className="text-xs font-medium text-white">
                Nota del admin: {foto.nota_admin}
              </p>
            </div>
          )}

          {/* Full media */}
          <div className="relative h-full w-full flex items-center justify-center">
            {isVideo ? (
              <video
                src={foto.url}
                controls
                autoPlay
                playsInline
                preload="auto"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <Image
                src={foto.url}
                alt={foto.etiqueta ?? "Foto"}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            )}
          </div>

          {/* Metadata overlay for videos (photos have it burned into the image) */}
          {isVideo && (foto.metadata_fecha || foto.metadata_gps) && (
            <div
              className="pointer-events-none absolute bottom-20 right-4 z-10 text-right"
              style={{
                textShadow:
                  "-1px -1px 0 rgba(0,0,0,0.85), 1px -1px 0 rgba(0,0,0,0.85), -1px 1px 0 rgba(0,0,0,0.85), 1px 1px 0 rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.5)",
              }}
            >
              {foto.metadata_fecha && (
                <p className="text-sm font-bold leading-snug text-white">
                  {new Date(foto.metadata_fecha).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  {new Date(foto.metadata_fecha).toLocaleTimeString("es-MX", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              )}
              {addressLines.length > 0
                ? addressLines.map((line, i) => (
                    <p key={i} className="text-sm font-bold leading-snug text-white">
                      {line}
                    </p>
                  ))
                : foto.metadata_gps && (
                    <p className="text-sm font-bold leading-snug text-white">
                      GPS: {foto.metadata_gps}
                    </p>
                  )}
            </div>
          )}

          {/* Delete button */}
          {onDelete && !disabled && !showConfirm && (
            <div className="absolute bottom-8 inset-x-0 flex justify-center">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg active:bg-red-700"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Eliminar
              </button>
            </div>
          )}

          {/* Confirm dialog */}
          {showConfirm && (
            <div className="absolute bottom-8 inset-x-4 flex flex-col items-center gap-3">
              <div className="rounded-xl bg-gray-900 px-5 py-4 text-center shadow-lg">
                <p className="mb-3 text-sm font-medium text-white">
                  {isVideo ? "Eliminar este video?" : "Eliminar esta foto?"}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white active:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white active:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
