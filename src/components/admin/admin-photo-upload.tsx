"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { adminUploadPhoto } from "@/app/actions/fotos";
import type { FotoEtiqueta } from "@/types";

// ── Constants ──────────────────────────────────────────────────────────────

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

interface AdminPhotoUploadProps {
  reporteId: string;
  equipoId?: string | null;
  equipos?: Array<{ id: string; etiqueta: string }>;
  pasos?: Array<{ id: string; nombre: string }>;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface SelectedFile {
  file: File;
  previewUrl: string | null;
  isVideo: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export function AdminPhotoUpload({
  reporteId,
  equipoId: fixedEquipoId,
  equipos,
  pasos,
}: AdminPhotoUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [selectedEquipoId, setSelectedEquipoId] = useState(fixedEquipoId ?? "");
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<string>("");
  const [selectedPasoId, setSelectedPasoId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const cleanupPreviews = useCallback((files: SelectedFile[]) => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFeedback(null);

    const newFiles: SelectedFile[] = Array.from(files).map((file) => {
      const isVid = file.type.startsWith("video/");
      return {
        file,
        previewUrl: isVid ? null : URL.createObjectURL(file),
        isVideo: isVid,
      };
    });

    setSelectedFiles((prev) => {
      // Don't clean up old previews — they're still displayed
      return [...prev, ...newFiles];
    });

    // Reset input so the same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => {
      const removed = prev[index];
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setFeedback(null);

    const total = selectedFiles.length;
    let successCount = 0;
    const failed: string[] = [];

    for (let i = 0; i < total; i++) {
      setUploadProgress(`Subiendo ${i + 1} de ${total}...`);

      const { file } = selectedFiles[i];
      const formData = new FormData();
      formData.set("reporteId", reporteId);
      formData.set("file", file);

      const eqId = fixedEquipoId ?? selectedEquipoId;
      if (eqId) formData.set("equipoId", eqId);
      if (selectedEtiqueta) formData.set("etiqueta", selectedEtiqueta);
      if (selectedPasoId) formData.set("reportePasoId", selectedPasoId);

      try {
        const result = await adminUploadPhoto(formData);
        if (result.error) {
          failed.push(file.name);
        } else {
          successCount++;
        }
      } catch {
        failed.push(file.name);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (failed.length > 0 && successCount > 0) {
      setFeedback({
        type: "error",
        text: `${successCount} subida${successCount !== 1 ? "s" : ""}, ${failed.length} fallida${failed.length !== 1 ? "s" : ""}: ${failed.join(", ")}`,
      });
    } else if (failed.length > 0) {
      setFeedback({
        type: "error",
        text: `Error al subir: ${failed.join(", ")}`,
      });
    } else {
      setFeedback({
        type: "success",
        text: `${successCount} foto${successCount !== 1 ? "s" : ""} subida${successCount !== 1 ? "s" : ""} exitosamente`,
      });
    }

    // Reset form and refresh
    cleanupPreviews(selectedFiles);
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setTimeout(() => {
      setOpen(false);
      setFeedback(null);
      router.refresh();
    }, 1500);
  }

  function handleClose() {
    cleanupPreviews(selectedFiles);
    setOpen(false);
    setSelectedFiles([]);
    setFeedback(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-[6px] border border-dashed border-admin-border px-3 py-2 text-[12px] font-medium text-text-2 transition-colors hover:border-accent hover:text-accent"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Agregar foto
      </button>
    );
  }

  return (
    <div className="rounded-[8px] border border-admin-border bg-admin-surface p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[12px] font-semibold uppercase tracking-[0.04em] text-text-2">
          Subir Archivos
        </h4>
        <button
          type="button"
          onClick={handleClose}
          disabled={isUploading}
          className="text-[12px] text-text-2 transition-colors hover:text-text-0 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      {/* File input — multiple */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileChange}
        disabled={isUploading}
        className="w-full text-[12px] text-text-2 file:mr-2 file:rounded-[6px] file:border-0 file:bg-admin-surface-elevated file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-text-1"
      />

      {/* Preview grid */}
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {selectedFiles.map((sf, idx) => (
            <div
              key={`${sf.file.name}-${idx}`}
              className="group relative overflow-hidden rounded-[6px] border border-admin-border-subtle bg-admin-bg"
            >
              {sf.previewUrl ? (
                <div className="relative aspect-square">
                  <Image
                    src={sf.previewUrl}
                    alt={sf.file.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-text-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
              )}
              {/* Remove button */}
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  &times;
                </button>
              )}
              <p className="truncate px-1 py-0.5 text-[9px] text-text-3">
                {sf.file.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Equipo dropdown (only if not fixed and equipos provided) */}
      {!fixedEquipoId && equipos && equipos.length > 0 && (
        <div>
          <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-[0.04em] text-text-2">
            Equipo (opcional)
          </label>
          <select
            value={selectedEquipoId}
            onChange={(e) => setSelectedEquipoId(e.target.value)}
            disabled={isUploading}
            className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1 text-[12px] text-text-1"
          >
            <option value="">General</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.etiqueta}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Etiqueta dropdown */}
      <div>
        <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-[0.04em] text-text-2">
          Etiqueta
        </label>
        <select
          value={selectedEtiqueta}
          onChange={(e) => setSelectedEtiqueta(e.target.value)}
          disabled={isUploading}
          className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1 text-[12px] text-text-1"
        >
          <option value="">Sin etiqueta</option>
          {ETIQUETA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Paso dropdown (optional) */}
      {pasos && pasos.length > 0 && (
        <div>
          <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-[0.04em] text-text-2">
            Paso (opcional)
          </label>
          <select
            value={selectedPasoId}
            onChange={(e) => setSelectedPasoId(e.target.value)}
            disabled={isUploading}
            className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1 text-[12px] text-text-1"
          >
            <option value="">Sin paso especifico</option>
            {pasos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Upload button + progress + feedback */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          className="rounded-[6px] bg-accent px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {isUploading
            ? uploadProgress
            : selectedFiles.length > 1
              ? `Subir ${selectedFiles.length} archivos`
              : "Subir"}
        </button>
        {feedback && (
          <span
            className={`text-[11px] ${
              feedback.type === "success"
                ? "text-status-success"
                : "text-red-600"
            }`}
          >
            {feedback.text}
          </span>
        )}
      </div>
    </div>
  );
}
