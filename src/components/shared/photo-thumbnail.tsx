"use client";

import { useState } from "react";
import Image from "next/image";
import type { ReporteFoto } from "@/types";

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

export function PhotoThumbnail({
  foto,
  onDelete,
  disabled,
}: PhotoThumbnailProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const colors = etapaColors[foto.etiqueta ?? ""] ?? etapaColors.antes;

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    onDelete(foto.id);
    setShowConfirm(false);
    setShowLightbox(false);
  };

  return (
    <>
      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => setShowLightbox(true)}
        className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg scroll-snap-align-start"
        style={{ scrollSnapAlign: "start" }}
      >
        <Image
          src={foto.url}
          alt={foto.etiqueta ?? "Foto"}
          fill
          className="object-cover"
          sizes="64px"
        />
        {/* Label badge */}
        {foto.etiqueta && (
          <span
            className={`absolute bottom-0.5 left-0.5 rounded px-1 py-0.5 text-[8px] font-bold uppercase leading-none ${colors.bg} ${colors.text}`}
          >
            {foto.etiqueta === "despues" ? "DESP" : foto.etiqueta.slice(0, 4).toUpperCase()}
          </span>
        )}
      </button>

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
            <div className="absolute left-4 top-4 z-10">
              <span
                className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}
              >
                {foto.etiqueta}
              </span>
            </div>
          )}

          {/* Full image */}
          <div className="relative h-full w-full">
            <Image
              src={foto.url}
              alt={foto.etiqueta ?? "Foto"}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

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
                Eliminar foto
              </button>
            </div>
          )}

          {/* Confirm dialog */}
          {showConfirm && (
            <div className="absolute bottom-8 inset-x-4 flex flex-col items-center gap-3">
              <div className="rounded-xl bg-gray-900 px-5 py-4 text-center shadow-lg">
                <p className="mb-3 text-sm font-medium text-white">
                  Eliminar esta foto?
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
