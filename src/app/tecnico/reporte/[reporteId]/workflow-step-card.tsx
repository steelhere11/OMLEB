"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ReadingInput } from "./reading-input";
import { PhotoSourcePicker } from "@/components/shared/photo-source-picker";
import { CameraCapture } from "@/components/shared/camera-capture";
import { VideoCapture } from "@/components/shared/video-capture";
import { EvidenceStageSection } from "@/components/shared/evidence-stage-section";
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

  // Photo handlers
  const handleLabelClick = (etapa: string) => {
    if (isCompleted) return;
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

  const handleCameraCapture = useCallback(
    (result: { url: string; fotoId: string }) => {
      setPhotos((prev) => [
        ...prev,
        {
          id: result.fotoId,
          reporte_id: reporteId,
          equipo_id: equipoId,
          reporte_paso_id: savedProgress?.id ?? null,
          url: result.url,
          etiqueta: (activeLabel?.toLowerCase() ?? "antes") as ReporteFoto["etiqueta"],
          tipo_media: "foto" as const,
          metadata_gps: null,
          metadata_fecha: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);
      setShowCamera(false);
    },
    [reporteId, equipoId, savedProgress?.id, activeLabel]
  );

  const handleVideoCapture = useCallback(
    (result: { url: string; fotoId: string }) => {
      setPhotos((prev) => [
        ...prev,
        {
          id: result.fotoId,
          reporte_id: reporteId,
          equipo_id: equipoId,
          reporte_paso_id: savedProgress?.id ?? null,
          url: result.url,
          etiqueta: (activeLabel?.toLowerCase() ?? "antes") as ReporteFoto["etiqueta"],
          tipo_media: "video" as const,
          metadata_gps: null,
          metadata_fecha: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);
      setShowVideoCapture(false);
    },
    [reporteId, equipoId, savedProgress?.id, activeLabel]
  );

  const handleGalleryFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      const label = activeLabel?.toLowerCase() ?? "antes";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith("video/");
        const result = await compressAndUpload(
          file,
          {
            reporteId,
            equipoId,
            reportePasoId: savedProgress?.id ?? null,
            etiqueta: label,
            gps: null,
            fecha: new Date(),
          }
        );

        if (result.success) {
          setPhotos((prev) => [
            ...prev,
            {
              id: result.fotoId,
              reporte_id: reporteId,
              equipo_id: equipoId,
              reporte_paso_id: savedProgress?.id ?? null,
              url: result.url,
              etiqueta: label as ReporteFoto["etiqueta"],
              tipo_media: isVideo ? "video" as const : "foto" as const,
              metadata_gps: null,
              metadata_fecha: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
          ]);
        }
      }

      setIsUploading(false);
      // Reset the input so the same file(s) can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [reporteId, equipoId, savedProgress?.id, activeLabel]
  );

  const handleDeletePhoto = useCallback(async (fotoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== fotoId));
    await deletePhotoAction(fotoId);
  }, []);

  const evidencia = paso.evidencia_requerida ?? [];
  const lecturasRequeridas = paso.lecturas_requeridas ?? [];
  const hasReadingsOrNotes = lecturasRequeridas.length > 0 || true; // always show notas

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden ${
        completado ? "border-l-4 border-l-green-500 border-gray-200" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-gray-50"
      >
        {/* Step number circle */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            completado
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-500"
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
          <p className={`text-sm font-medium ${completado ? "text-green-700" : "text-gray-900"}`}>
            {paso.nombre}
          </p>
          <p className="text-xs text-gray-400">
            Paso {stepNumber} de {totalSteps}
            {!paso.es_obligatorio && " -- Opcional"}
          </p>
        </div>

        {/* Media count indicator */}
        {photos.length > 0 && (
          <span className="flex-shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
            {photos.length} archivo{photos.length !== 1 ? "s" : ""}
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
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
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Procedure text */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Procedimiento
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
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

          {/* Reading inputs */}
          {lecturasRequeridas.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500">Lecturas</p>
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
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Notas del paso
            </p>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales sobre este paso..."
              disabled={isCompleted}
              className="min-h-[60px]"
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
          reportePasoId={savedProgress?.id ?? null}
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
          reportePasoId={savedProgress?.id ?? null}
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
