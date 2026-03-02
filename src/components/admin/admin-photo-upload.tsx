"use client";

import { useState, useTransition, useRef } from "react";
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
];

// ── Props ──────────────────────────────────────────────────────────────────

interface AdminPhotoUploadProps {
  reporteId: string;
  equipoId?: string | null;
  equipos?: Array<{ id: string; etiqueta: string }>;
  pasos?: Array<{ id: string; nombre: string }>;
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
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [selectedEquipoId, setSelectedEquipoId] = useState(fixedEquipoId ?? "");
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<FotoEtiqueta>("progreso");
  const [selectedPasoId, setSelectedPasoId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFeedback(null);

    const isVid = file.type.startsWith("video/");
    setIsVideo(isVid);

    if (!isVid) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleUpload() {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.set("reporteId", reporteId);
    formData.set("file", selectedFile);

    const eqId = fixedEquipoId ?? selectedEquipoId;
    if (eqId) formData.set("equipoId", eqId);
    if (selectedEtiqueta) formData.set("etiqueta", selectedEtiqueta);
    if (selectedPasoId) formData.set("reportePasoId", selectedPasoId);

    startTransition(async () => {
      const result = await adminUploadPhoto(formData);
      if (result.error) {
        setFeedback({ type: "error", text: result.error });
      } else {
        setFeedback({ type: "success", text: "Foto subida exitosamente" });
        // Reset form
        setSelectedFile(null);
        setPreview(null);
        setIsVideo(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => {
          setOpen(false);
          setFeedback(null);
          router.refresh();
        }, 1200);
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setSelectedFile(null);
    setPreview(null);
    setIsVideo(false);
    setFeedback(null);
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
          Subir Archivo
        </h4>
        <button
          type="button"
          onClick={handleClose}
          className="text-[12px] text-text-2 transition-colors hover:text-text-0"
        >
          Cancelar
        </button>
      </div>

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="w-full text-[12px] text-text-2 file:mr-2 file:rounded-[6px] file:border-0 file:bg-admin-surface-elevated file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-text-1"
      />

      {/* Preview */}
      {preview && !isVideo && (
        <div className="relative h-32 w-32 overflow-hidden rounded-[6px] border border-admin-border-subtle bg-admin-bg">
          <Image
            src={preview}
            alt="Vista previa"
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
      )}
      {isVideo && selectedFile && (
        <div className="rounded-[6px] border border-admin-border-subtle bg-admin-bg px-3 py-2">
          <span className="text-[12px] text-text-2">
            Video: {selectedFile.name}
          </span>
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
          onChange={(e) => setSelectedEtiqueta(e.target.value as FotoEtiqueta)}
          className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1 text-[12px] text-text-1"
        >
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

      {/* Upload button + feedback */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || isPending}
          className="rounded-[6px] bg-accent px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? "Subiendo..." : "Subir"}
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
