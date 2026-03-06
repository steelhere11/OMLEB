"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { ReporteFoto, FotoEstatusRevision, FotoEtiqueta } from "@/types";
import { PhotoAnnotator } from "@/components/shared/photo-annotator";
import { overwriteAnnotatedPhoto } from "@/app/actions/fotos";
import { downloadFromUrl } from "@/lib/save-to-device";

// ── Status config ──────────────────────────────────────────────────────────

const statusConfig: Record<
  FotoEstatusRevision,
  { label: string; badge: string; border: string }
> = {
  pendiente: {
    label: "Pendiente",
    badge: "bg-gray-100 text-gray-600",
    border: "border-gray-300",
  },
  aceptada: {
    label: "Aceptada",
    badge: "bg-green-100 text-green-700",
    border: "border-green-400",
  },
  rechazada: {
    label: "Rechazada",
    badge: "bg-red-100 text-red-700",
    border: "border-red-400",
  },
  retomar: {
    label: "Retomar",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-400",
  },
};

const etiquetaLabels: Record<string, string> = {
  antes: "Antes",
  durante: "Durante",
  despues: "Despues",
  dano: "Dano",
  placa: "Placa",
  progreso: "Progreso",
  llegada: "Llegada",
  sitio: "Sitio",
  equipo_general: "Equipo General",
  papeleta: "Papeleta",
};

const STATUS_OPTIONS: FotoEstatusRevision[] = [
  "pendiente",
  "aceptada",
  "rechazada",
  "retomar",
];

const ETIQUETA_OPTIONS: { value: FotoEtiqueta; label: string }[] = [
  { value: "antes", label: "Antes" },
  { value: "durante", label: "Durante" },
  { value: "despues", label: "Despues" },
  { value: "dano", label: "Dano" },
  { value: "placa", label: "Placa" },
  { value: "progreso", label: "Progreso" },
  { value: "llegada", label: "Llegada" },
  { value: "sitio", label: "Sitio" },
  { value: "equipo_general", label: "Equipo General" },
  { value: "papeleta", label: "Papeleta" },
];

// ── Props ──────────────────────────────────────────────────────────────────

interface AdminPhotoCardProps {
  foto: ReporteFoto;
  onFlag: (
    fotoId: string,
    estatus: FotoEstatusRevision,
    nota?: string
  ) => Promise<void>;
  onDelete: (fotoId: string) => Promise<void>;
  onUpdateEtiqueta: (fotoId: string, etiqueta: string | null) => Promise<void>;
  /** Compact mode: smaller thumbnail */
  compact?: boolean;
  /** Override etiqueta options (e.g. step photos only show antes/durante/despues) */
  etiquetaOptions?: { value: FotoEtiqueta; label: string }[];
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminPhotoCard({ foto, onFlag, onDelete, onUpdateEtiqueta, compact, etiquetaOptions }: AdminPhotoCardProps) {
  const [selectedStatus, setSelectedStatus] = useState<FotoEstatusRevision>(
    foto.estatus_revision
  );
  const config = statusConfig[selectedStatus] ?? statusConfig.pendiente;
  const [nota, setNota] = useState(foto.nota_admin ?? "");
  const [showNota, setShowNota] = useState(
    foto.estatus_revision === "rechazada" || foto.estatus_revision === "retomar"
  );
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<string>(foto.etiqueta ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const [showAnnotator, setShowAnnotator] = useState(false);

  const [flagPending, startFlagTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [annotatePending, startAnnotateTransition] = useTransition();
  const [etiquetaPending, startEtiquetaTransition] = useTransition();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const isVideo = foto.tipo_media === "video" || /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(foto.url);

  function handleStatusChange(newStatus: FotoEstatusRevision) {
    setSelectedStatus(newStatus);
    const needsNota = newStatus === "rechazada" || newStatus === "retomar";
    setShowNota(needsNota);

    // If no note is needed, flag immediately
    if (!needsNota) {
      startFlagTransition(async () => {
        await onFlag(foto.id, newStatus);
        setNota("");
        setFeedbackMsg("Guardado");
        setTimeout(() => setFeedbackMsg(null), 2000);
      });
    }
  }

  function handleFlagWithNote() {
    startFlagTransition(async () => {
      await onFlag(foto.id, selectedStatus, nota || undefined);
      setFeedbackMsg("Guardado");
      setTimeout(() => setFeedbackMsg(null), 2000);
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await onDelete(foto.id);
    });
  }

  function handleAnnotateSave(blob: Blob) {
    startAnnotateTransition(async () => {
      const formData = new FormData();
      formData.append("file", blob, "annotated.jpg");
      const result = await overwriteAnnotatedPhoto(foto.id, formData);
      setShowAnnotator(false);
      if (result.success) {
        setFeedbackMsg("Anotacion guardada");
        setTimeout(() => setFeedbackMsg(null), 2000);
      } else {
        setFeedbackMsg(result.error ?? "Error al guardar");
        setTimeout(() => setFeedbackMsg(null), 3000);
      }
    });
  }

  function handleEtiquetaChange(value: string) {
    setSelectedEtiqueta(value);
    startEtiquetaTransition(async () => {
      await onUpdateEtiqueta(foto.id, value || null);
      setFeedbackMsg("Etiqueta actualizada");
      setTimeout(() => setFeedbackMsg(null), 2000);
    });
  }

  return (
    <>
      <div
        className={`rounded-[8px] border-2 ${config.border} overflow-hidden bg-admin-surface`}
      >
        {/* Photo thumbnail with status badge */}
        <div className="relative">
          <div
            className={`relative cursor-pointer overflow-hidden bg-admin-bg ${compact ? "h-28" : "aspect-[4/3]"}`}
            onClick={() => setLightbox(true)}
          >
            {isVideo ? (
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                src={`${foto.url}#t=0.5`}
                className="h-full w-full object-cover"
                preload="metadata"
                muted
                playsInline
              />
            ) : (
              <Image
                src={foto.url}
                alt={foto.etiqueta ?? "Foto del reporte"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            )}
          </div>

          {/* Status badge overlay */}
          <span
            className={`absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${config.badge}`}
          >
            {config.label}
          </span>

          {/* Action buttons overlay */}
          <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
            {/* Delete button */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deletePending}
              className="rounded bg-black/50 p-1 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              title="Eliminar foto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
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
            </button>

            {/* Annotate button (photos only) */}
            {!isVideo && (
              <button
                type="button"
                onClick={() => setShowAnnotator(true)}
                disabled={annotatePending}
                className="rounded bg-black/50 p-1 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                title="Anotar foto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}

            {/* Download button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const ext = isVideo ? "mp4" : "jpg";
                const name = `OMLEB_${foto.etiqueta ?? "foto"}_${(foto.metadata_fecha ?? new Date().toISOString()).slice(0, 10)}.${ext}`;
                downloadFromUrl(foto.url, name);
              }}
              className="rounded bg-black/50 p-1 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
              title="Descargar foto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info & controls */}
        <div className="space-y-2 p-2.5">
          {/* Etiqueta selector */}
          <div>
            <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-[0.04em] text-text-2">
              Etiqueta
            </label>
            <select
              value={selectedEtiqueta}
              onChange={(e) => handleEtiquetaChange(e.target.value)}
              disabled={etiquetaPending}
              className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1 text-[12px] text-text-1"
            >
              <option value="">Sin etiqueta</option>
              {(etiquetaOptions ?? ETIQUETA_OPTIONS).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metadata */}
          {foto.metadata_fecha && (
            <span className="text-[10px] text-text-3">
              {new Date(foto.metadata_fecha).toLocaleString("es-MX", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          {foto.metadata_gps && (
            <span className="block text-[10px] text-text-3">
              GPS: {foto.metadata_gps}
            </span>
          )}

          {/* Admin note (existing) */}
          {foto.nota_admin && selectedStatus === foto.estatus_revision && (
            <div className="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
              <span className="font-medium">Nota admin:</span> {foto.nota_admin}
            </div>
          )}

          {/* Status selector */}
          <div>
            <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-[0.04em] text-text-2">
              Estado de revision
            </label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                handleStatusChange(e.target.value as FotoEstatusRevision)
              }
              disabled={flagPending}
              className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1 text-[12px] text-text-1"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {statusConfig[s].label}
                </option>
              ))}
            </select>
          </div>

          {/* Note textarea (for rechazada/retomar) */}
          {showNota && (
            <div>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Razon o instruccion para el tecnico..."
                rows={2}
                className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1 text-[12px] text-text-1"
              />
              <button
                type="button"
                onClick={handleFlagWithNote}
                disabled={flagPending}
                className="mt-1 rounded-[6px] bg-accent px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {flagPending ? "Guardando..." : "Guardar estado"}
              </button>
            </div>
          )}

          {/* Feedback message */}
          {feedbackMsg && (
            <span className="text-[11px] text-status-success">{feedbackMsg}</span>
          )}
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="border-t border-admin-border bg-red-50 px-2.5 py-2">
            <p className="mb-2 text-[12px] font-medium text-red-800">
              Eliminar esta foto permanentemente?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletePending}
                className="rounded-[6px] bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deletePending ? "Eliminando..." : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-[11px] font-medium text-text-2 transition-colors hover:text-text-0"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Annotator */}
      {showAnnotator && !isVideo && (
        <PhotoAnnotator
          imageUrl={foto.url}
          onSave={handleAnnotateSave}
          onCancel={() => setShowAnnotator(false)}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
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
          <div
            className="max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo ? (
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                src={foto.url}
                controls
                autoPlay
                className="max-h-[90vh] max-w-[90vw] rounded"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={foto.url}
                alt={foto.etiqueta ?? "Foto del reporte"}
                className="max-h-[90vh] max-w-[90vw] rounded object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
