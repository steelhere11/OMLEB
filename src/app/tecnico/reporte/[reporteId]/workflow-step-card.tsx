"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ReadingInput } from "./reading-input";
import { PhotoSourcePicker } from "@/components/shared/photo-source-picker";
import { CameraCapture } from "@/components/shared/camera-capture";
import { VideoCapture } from "@/components/shared/video-capture";
import { EvidenceStageSection } from "@/components/shared/evidence-stage-section";
import { VoiceInput } from "@/components/shared/voice-input";
import { getPhotosForStep } from "@/app/actions/fotos";
import { deletePhotoAction } from "@/app/actions/fotos";
import { compressAndUpload } from "@/lib/photo-uploader";
import type { PlantillaPaso, ReportePaso, ReporteFoto } from "@/types";

interface WorkflowStepCardProps {
  paso: PlantillaPaso;
  stepNumber: number;
  totalSteps: number;
  savedProgress: ReportePaso | null;
  onProgressChange: (
    pasoId: string,
    data: {
      completado: boolean;
      notas: string;
      lecturas: Record<string, number | string>;
    }
  ) => void;
  onEnsureStep: (plantillaPasoId: string) => Promise<string | null>;
  isCompleted: boolean;
  autoExpand: boolean;
  reporteId: string;
  equipoId: string;
}

export function WorkflowStepCard({
  paso,
  stepNumber,
  totalSteps,
  savedProgress,
  onProgressChange,
  onEnsureStep,
  isCompleted,
  autoExpand,
  reporteId,
  equipoId,
}: WorkflowStepCardProps) {
  const [expanded, setExpanded] = useState(autoExpand);
  const [completado, setCompletado] = useState(
    savedProgress?.completado ?? false
  );
  const [notas, setNotas] = useState(savedProgress?.notas ?? "");
  const [lecturas, setLecturas] = useState<Record<string, number | string>>(
    savedProgress?.lecturas ?? {}
  );
  const [saving, setSaving] = useState(false);

  // Photo state
  const [photos, setPhotos] = useState<ReporteFoto[]>([]);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideoCapture, setShowVideoCapture] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track the resolved step ID (may be set before savedProgress updates)
  const resolvedStepIdRef = useRef<string | null>(savedProgress?.id ?? null);
  useEffect(() => {
    if (savedProgress?.id) {
      resolvedStepIdRef.current = savedProgress.id;
    }
  }, [savedProgress?.id]);

  // Ensure step row exists in DB before photo uploads
  const ensureStepId = useCallback(async (): Promise<string | null> => {
    if (resolvedStepIdRef.current) return resolvedStepIdRef.current;
    const stepId = await onEnsureStep(paso.id);
    if (stepId) {
      resolvedStepIdRef.current = stepId;
    }
    return stepId;
  }, [onEnsureStep, paso.id]);

  // Load existing photos for this step
  useEffect(() => {
    if (!savedProgress?.id) return;
    let cancelled = false;

    getPhotosForStep(savedProgress.id).then((fetched) => {
      if (!cancelled) setPhotos(fetched);
    });

    return () => {
      cancelled = true;
    };
  }, [savedProgress?.id]);

  // Auto-save when completado changes
  useEffect(() => {
    // Skip initial render if nothing changed
    if (
      completado === (savedProgress?.completado ?? false) &&
      notas === (savedProgress?.notas ?? "")
    ) {
      return;
    }
    const timer = setTimeout(() => {
      onProgressChange(paso.id, { completado, notas, lecturas });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completado]);

  const handleToggleComplete = () => {
    if (isCompleted) return;
    const newVal = !completado;
    setCompletado(newVal);
    setSaving(true);
    // Debounce handles the actual save
    setTimeout(() => setSaving(false), 600);
  };

  const handleSaveReadingsAndNotes = () => {
    setSaving(true);
    onProgressChange(paso.id, { completado, notas, lecturas });
    setTimeout(() => setSaving(false), 600);
  };

  const updateLectura = (nombre: string, value: string | number) => {
    setLecturas((prev) => ({ ...prev, [nombre]: value }));
  };

  // Photo handlers — ensure step exists before allowing photo uploads
  const handleLabelClick = async (etapa: string) => {
    if (isCompleted) return;
    const stepId = await ensureStepId();
    if (!stepId) return;
    setActiveLabel(etapa);
    setShowSourcePicker(true);
  };

  const handleSelectCamera = () => {
    setShowSourcePicker(false);
    setShowCamera(true);
  };

  const handleSelectVideoCamera = () => {
    setShowSourcePicker(false);
    setShowVideoCapture(true);
  };

  const handleSelectGallery = () => {
    setShowSourcePicker(false);
    fileInputRef.current?.click();
  };

  const [queuedCount, setQueuedCount] = useState(0);

  const handleCameraCapture = useCallback(
    (result: { url: string; fotoId: string; gps: string | null; fecha: string; queued?: boolean }) => {
      if (result.queued) {
        // Photo queued for later upload
        setQueuedCount((c) => c + 1);
        setShowCamera(false);
        return;
      }
      setPhotos((prev) => [
        ...prev,
        {
          id: result.fotoId,
          reporte_id: reporteId,
          equipo_id: equipoId,
          reporte_paso_id: resolvedStepIdRef.current,
          url: result.url,
          etiqueta: (activeLabel?.toLowerCase() ?? "antes") as ReporteFoto["etiqueta"],
          tipo_media: "foto" as const,
          estatus_revision: "pendiente" as const,
          nota_admin: null,
          metadata_gps: result.gps,
          metadata_fecha: result.fecha,
          created_at: new Date().toISOString(),
        },
      ]);
      setShowCamera(false);
    },
    [reporteId, equipoId, activeLabel]
  );

  const handleVideoCapture = useCallback(
    (result: { url: string; fotoId: string; gps: string | null; fecha: string; queued?: boolean }) => {
      if (result.queued) {
        setQueuedCount((c) => c + 1);
        setShowVideoCapture(false);
        return;
      }
      setPhotos((prev) => [
        ...prev,
        {
          id: result.fotoId,
          reporte_id: reporteId,
          equipo_id: equipoId,
          reporte_paso_id: resolvedStepIdRef.current,
          url: result.url,
          etiqueta: (activeLabel?.toLowerCase() ?? "antes") as ReporteFoto["etiqueta"],
          tipo_media: "video" as const,
          estatus_revision: "pendiente" as const,
          nota_admin: null,
          metadata_gps: result.gps,
          metadata_fecha: result.fecha,
          created_at: new Date().toISOString(),
        },
      ]);
      setShowVideoCapture(false);
    },
    [reporteId, equipoId, activeLabel]
  );

  const handleGalleryFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      const label = activeLabel?.toLowerCase() ?? "antes";
      const stepId = resolvedStepIdRef.current;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith("video/");
        const result = await compressAndUpload(
          file,
          {
            reporteId,
            equipoId,
            reportePasoId: stepId,
            etiqueta: label,
            gps: null,
            fecha: new Date(),
          }
        );

        if (result.success) {
          if ("queued" in result && result.queued) {
            setQueuedCount((c) => c + 1);
          } else {
            setPhotos((prev) => [
              ...prev,
              {
                id: result.fotoId,
                reporte_id: reporteId,
                equipo_id: equipoId,
                reporte_paso_id: resolvedStepIdRef.current,
                url: result.url,
                etiqueta: label as ReporteFoto["etiqueta"],
                tipo_media: isVideo ? "video" as const : "foto" as const,
                estatus_revision: "pendiente" as const,
                nota_admin: null,
                metadata_gps: null,
                metadata_fecha: new Date().toISOString(),
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }
      }

      setIsUploading(false);
      // Reset the input so the same file(s) can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [reporteId, equipoId, activeLabel]
  );

  const handleDeletePhoto = useCallback(async (fotoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== fotoId));
    await deletePhotoAction(fotoId);
  }, []);

  const evidencia = paso.evidencia_requerida ?? [];
  const lecturasRequeridas = paso.lecturas_requeridas ?? [];
  const hasReadingsOrNotes = lecturasRequeridas.length > 0 || true; // always show notas

  // Quick-complete: long-press on collapsed header for simple steps
  const canQuickComplete =
    !isCompleted &&
    !completado &&
    evidencia.length === 0 &&
    lecturasRequeridas.length === 0;

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [quickCompleteFlash, setQuickCompleteFlash] = useState(false);

  const handlePointerDown = useCallback(() => {
    if (!canQuickComplete || expanded) return;
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
      // Mark complete
      setCompletado(true);
      setSaving(true);
      onProgressChange(paso.id, { completado: true, notas, lecturas });
      setTimeout(() => setSaving(false), 600);
      // Flash animation
      setQuickCompleteFlash(true);
      setTimeout(() => setQuickCompleteFlash(false), 700);
    }, 600);
  }, [canQuickComplete, expanded, paso.id, notas, lecturas, onProgressChange]);

  const handlePointerUpOrLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  return (
    <div
      className={`rounded-card border bg-tech-surface overflow-hidden transition-colors ${
        quickCompleteFlash
          ? "border-l-4 border-l-green-500 border-green-300 bg-green-50"
          : completado
            ? "border-l-4 border-l-green-500 border-tech-border"
            : "border-tech-border"
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => {
          // If long-press just fired (completado changed), don't toggle expand
          if (!longPressTimerRef.current && !quickCompleteFlash) {
            setExpanded(!expanded);
          }
        }}
        onPointerDown={canQuickComplete ? handlePointerDown : undefined}
        onPointerUp={canQuickComplete ? handlePointerUpOrLeave : undefined}
        onPointerLeave={canQuickComplete ? handlePointerUpOrLeave : undefined}
        onContextMenu={canQuickComplete ? (e) => e.preventDefault() : undefined}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-gray-50"
      >
        {/* Step number circle */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            completado
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-tech-text-muted"
          }`}
        >
          {completado ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            stepNumber
          )}
        </div>

        {/* Step name */}
        <div className="flex-1 min-w-0">
          <p className={`text-body font-medium ${completado ? "text-green-700" : "text-tech-text-primary"}`}>
            {paso.nombre}
          </p>
          <p className="text-label text-tech-text-muted">
            Paso {stepNumber} de {totalSteps}
            {!paso.es_obligatorio && " -- Opcional"}
            {canQuickComplete && !expanded && " · Mantener para completar"}
          </p>
        </div>

        {/* Flagged photos indicator */}
        {photos.some((p) => p.estatus_revision === "retomar" || p.estatus_revision === "rechazada") && (
          <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
            {photos.filter((p) => p.estatus_revision === "retomar" || p.estatus_revision === "rechazada").length} !
          </span>
        )}

        {/* Media count indicator */}
        {photos.length > 0 && !photos.some((p) => p.estatus_revision === "retomar" || p.estatus_revision === "rechazada") && (
          <span className="flex-shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
            {photos.length} archivo{photos.length !== 1 ? "s" : ""}
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`h-5 w-5 flex-shrink-0 text-tech-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-tech-border-subtle p-3 space-y-3">
          {/* Procedure text */}
          <div className="rounded-input bg-gray-50 p-2.5">
            <p className="text-label font-medium text-tech-text-muted mb-1">
              Procedimiento
            </p>
            <p className="text-body text-tech-text-secondary leading-relaxed whitespace-pre-line">
              {paso.procedimiento}
            </p>
          </div>

          {/* Evidence stage sections */}
          {evidencia.length > 0 && (
            <EvidenceStageSection
              evidencia={evidencia}
              photos={photos}
              onTakePhoto={handleLabelClick}
              onDeletePhoto={!isCompleted ? handleDeletePhoto : undefined}
              isUploading={isUploading}
              activeStage={activeLabel}
              disabled={isCompleted}
            />
          )}

          {/* Queued uploads indicator */}
          {queuedCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-input bg-yellow-50 border border-yellow-200 px-2.5 py-1.5 text-label text-yellow-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {queuedCount} {queuedCount === 1 ? "foto en cola" : "fotos en cola"} — se subiran con conexion
            </div>
          )}

          {/* Reading inputs */}
          {lecturasRequeridas.length > 0 && (
            <div className="space-y-3">
              <p className="text-label font-medium text-tech-text-muted">Lecturas</p>
              {lecturasRequeridas.map((lec) => (
                <ReadingInput
                  key={lec.nombre}
                  lectura={lec}
                  value={lecturas[lec.nombre] ?? ""}
                  onChange={(val) => updateLectura(lec.nombre, val)}
                  disabled={isCompleted}
                />
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-label font-medium text-tech-text-muted">
                Notas del paso
              </p>
              <VoiceInput
                currentValue={notas}
                onTranscript={setNotas}
                disabled={isCompleted}
              />
            </div>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales sobre este paso..."
              disabled={isCompleted}
              className="min-h-[48px]"
            />
          </div>

          {/* Save readings/notes + Complete toggle */}
          {!isCompleted && (
            <div className="flex items-center justify-between pt-1">
              {hasReadingsOrNotes && (
                <button
                  type="button"
                  onClick={handleSaveReadingsAndNotes}
                  disabled={saving}
                  className="text-sm font-medium text-brand-600 underline disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar lecturas"}
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleComplete}
                disabled={saving}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  completado
                    ? "bg-green-100 text-green-700 active:bg-green-200"
                    : "bg-green-500 text-white active:bg-green-600"
                } disabled:opacity-50`}
              >
                {completado ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Completado
                  </>
                ) : (
                  "Marcar como completado"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for gallery uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleGalleryFiles}
      />

      {/* Photo source picker bottom sheet */}
      {showSourcePicker && activeLabel && (
        <PhotoSourcePicker
          label={activeLabel}
          onSelectCamera={handleSelectCamera}
          onSelectVideoCamera={handleSelectVideoCamera}
          onSelectGallery={handleSelectGallery}
          onClose={() => {
            setShowSourcePicker(false);
            setActiveLabel(null);
          }}
        />
      )}

      {/* Camera capture fullscreen */}
      {showCamera && activeLabel && (
        <CameraCapture
          label={activeLabel}
          reporteId={reporteId}
          equipoId={equipoId}
          reportePasoId={resolvedStepIdRef.current}
          onCapture={handleCameraCapture}
          onClose={() => {
            setShowCamera(false);
            setActiveLabel(null);
          }}
        />
      )}

      {/* Video capture fullscreen */}
      {showVideoCapture && activeLabel && (
        <VideoCapture
          label={activeLabel}
          reporteId={reporteId}
          equipoId={equipoId}
          reportePasoId={resolvedStepIdRef.current}
          onCapture={handleVideoCapture}
          onClose={() => {
            setShowVideoCapture(false);
            setActiveLabel(null);
          }}
        />
      )}
    </div>
  );
}
