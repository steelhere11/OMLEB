"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getCorrectiveIssues,
  getStepProgress,
  saveCorrectiveSelection,
} from "@/app/actions/workflows";
import { getPhotosForStep } from "@/app/actions/fotos";
import { deletePhotoAction } from "@/app/actions/fotos";
import { compressAndUpload } from "@/lib/photo-uploader";
import { CorrectiveIssuePicker } from "./corrective-issue-picker";
import { PhotoSourcePicker } from "@/components/shared/photo-source-picker";
import { CameraCapture } from "@/components/shared/camera-capture";
import { VideoCapture } from "@/components/shared/video-capture";
import { EvidenceStageSection } from "@/components/shared/evidence-stage-section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { FallaCorrectiva, ReportePaso, ReporteFoto } from "@/types";

interface WorkflowCorrectiveProps {
  reporteEquipoId: string;
  tipoEquipoSlug: string;
  isCompleted: boolean;
  reporteId: string;
  equipoId: string;
}

export function WorkflowCorrective({
  reporteEquipoId,
  tipoEquipoSlug,
  isCompleted,
  reporteId,
  equipoId,
}: WorkflowCorrectiveProps) {
  const [issues, setIssues] = useState<FallaCorrectiva[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Step progress for getting reporte_paso IDs
  const [stepProgress, setStepProgress] = useState<ReportePaso[]>([]);

  // Photo state per issue (keyed by falla_correctiva_id)
  const [photosByIssue, setPhotosByIssue] = useState<
    Record<string, ReporteFoto[]>
  >({});
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideoCapture, setShowVideoCapture] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [allIssues, savedProgress] = await Promise.all([
        getCorrectiveIssues(tipoEquipoSlug),
        getStepProgress(reporteEquipoId),
      ]);

      if (cancelled) return;

      setIssues(allIssues);
      setStepProgress(savedProgress);

      // Pre-select issues from saved progress
      const savedIds = new Set<string>();
      for (const p of savedProgress) {
        if (p.falla_correctiva_id) {
          savedIds.add(p.falla_correctiva_id);
        }
      }
      setSelectedIds(savedIds);

      // Load photos for each saved corrective step
      const photosMap: Record<string, ReporteFoto[]> = {};
      for (const p of savedProgress) {
        if (p.falla_correctiva_id && p.id) {
          const stepPhotos = await getPhotosForStep(p.id);
          photosMap[p.falla_correctiva_id] = stepPhotos;
        }
      }
      if (!cancelled) setPhotosByIssue(photosMap);

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reporteEquipoId, tipoEquipoSlug]);

  const handleToggle = useCallback((issueId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveCorrectiveSelection(reporteEquipoId, [
      ...selectedIds,
    ]);
    setSaving(false);
    if (result.success) {
      setSavedMessage("Seleccion guardada");
      setTimeout(() => setSavedMessage(null), 2000);
      // Reload step progress to get new reporte_paso IDs
      const updatedProgress = await getStepProgress(reporteEquipoId);
      setStepProgress(updatedProgress);
    }
  };

  // Get the reporte_paso_id for a given falla_correctiva_id
  const getStepId = (fallaId: string): string | null => {
    const step = stepProgress.find((s) => s.falla_correctiva_id === fallaId);
    return step?.id ?? null;
  };

  // Photo handlers
  const handleLabelClick = (issueId: string, etapa: string) => {
    if (isCompleted) return;
    setActiveIssueId(issueId);
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
      if (!activeIssueId) return;
      const newPhoto: ReporteFoto = {
        id: result.fotoId,
        reporte_id: reporteId,
        equipo_id: equipoId,
        reporte_paso_id: getStepId(activeIssueId),
        url: result.url,
        etiqueta: (activeLabel?.toLowerCase() ?? "antes") as ReporteFoto["etiqueta"],
        tipo_media: "foto",
        metadata_gps: null,
        metadata_fecha: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setPhotosByIssue((prev) => ({
        ...prev,
        [activeIssueId]: [...(prev[activeIssueId] ?? []), newPhoto],
      }));
      setShowCamera(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIssueId, activeLabel, reporteId, equipoId, stepProgress]
  );

  const handleVideoCapture = useCallback(
    (result: { url: string; fotoId: string }) => {
      if (!activeIssueId) return;
      const newPhoto: ReporteFoto = {
        id: result.fotoId,
        reporte_id: reporteId,
        equipo_id: equipoId,
        reporte_paso_id: getStepId(activeIssueId),
        url: result.url,
        etiqueta: (activeLabel?.toLowerCase() ?? "antes") as ReporteFoto["etiqueta"],
        tipo_media: "video",
        metadata_gps: null,
        metadata_fecha: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setPhotosByIssue((prev) => ({
        ...prev,
        [activeIssueId]: [...(prev[activeIssueId] ?? []), newPhoto],
      }));
      setShowVideoCapture(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIssueId, activeLabel, reporteId, equipoId, stepProgress]
  );

  const handleGalleryFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !activeIssueId) return;

      setIsUploading(true);
      const label = activeLabel?.toLowerCase() ?? "antes";
      const stepId = getStepId(activeIssueId);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await compressAndUpload(file, {
          reporteId,
          equipoId,
          reportePasoId: stepId,
          etiqueta: label,
          gps: null,
          fecha: new Date(),
        });

        if (result.success) {
          const issueId = activeIssueId;
          const isVideo = file.type.startsWith("video/");
          setPhotosByIssue((prev) => ({
            ...prev,
            [issueId]: [
              ...(prev[issueId] ?? []),
              {
                id: result.fotoId,
                reporte_id: reporteId,
                equipo_id: equipoId,
                reporte_paso_id: stepId,
                url: result.url,
                etiqueta: label as ReporteFoto["etiqueta"],
                tipo_media: isVideo ? "video" as const : "foto" as const,
                metadata_gps: null,
                metadata_fecha: new Date().toISOString(),
                created_at: new Date().toISOString(),
              },
            ],
          }));
        }
      }

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIssueId, activeLabel, reporteId, equipoId, stepProgress]
  );

  const handleDeletePhoto = useCallback(
    async (issueId: string, fotoId: string) => {
      setPhotosByIssue((prev) => ({
        ...prev,
        [issueId]: (prev[issueId] ?? []).filter((p) => p.id !== fotoId),
      }));
      await deletePhotoAction(fotoId);
    },
    []
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
    );
  }

  // No issues found -- fallback to free-text
  if (issues.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            No hay fallas registradas para este tipo de equipo. Usa los campos
            de texto.
          </p>
        </div>
        <div>
          <Label className="mb-2">Diagnostico</Label>
          <Textarea
            placeholder="Describe el diagnostico del equipo..."
            disabled={isCompleted}
            className="min-h-[80px]"
          />
        </div>
        <div>
          <Label className="mb-2">Trabajo Realizado</Label>
          <Textarea
            placeholder="Describe el trabajo realizado..."
            disabled={isCompleted}
            className="min-h-[80px]"
          />
        </div>
      </div>
    );
  }

  const selectedIssues = issues.filter((i) => selectedIds.has(i.id));

  return (
    <div className="space-y-4">
      {/* Issue picker section */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Selecciona las fallas encontradas
        </p>
        <p className="text-xs text-gray-400">
          {selectedIds.size} {selectedIds.size === 1 ? "falla seleccionada" : "fallas seleccionadas"}
        </p>
        <CorrectiveIssuePicker
          issues={issues}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          disabled={isCompleted}
        />
      </div>

      {/* Selected issues detail */}
      {selectedIssues.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Detalle de fallas seleccionadas
          </p>
          {selectedIssues.map((issue) => {
            const issuePhotos = photosByIssue[issue.id] ?? [];
            return (
              <div
                key={issue.id}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3"
              >
                {/* Issue name */}
                <p className="text-sm font-bold text-gray-900">{issue.nombre}</p>

                {/* Full diagnostic */}
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Diagnostico
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {issue.diagnostico}
                  </p>
                </div>

                {/* Evidence stage sections */}
                {issue.evidencia_requerida.length > 0 && (
                  <EvidenceStageSection
                    evidencia={issue.evidencia_requerida}
                    photos={issuePhotos}
                    onTakePhoto={(stage) => handleLabelClick(issue.id, stage)}
                    onDeletePhoto={
                      !isCompleted
                        ? (fotoId) => handleDeletePhoto(issue.id, fotoId)
                        : undefined
                    }
                    isUploading={isUploading && activeIssueId === issue.id}
                    activeStage={activeIssueId === issue.id ? activeLabel : null}
                    disabled={isCompleted}
                  />
                )}

                {/* Typical materials */}
                {issue.materiales_tipicos.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-500">
                      Materiales tipicos
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {issue.materiales_tipicos.map((mat, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      {!isCompleted && (
        <div className="flex items-center justify-end gap-3">
          {savedMessage && (
            <span className="text-sm font-medium text-green-600">
              {savedMessage}
            </span>
          )}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            Guardar seleccion
          </Button>
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
            setActiveIssueId(null);
          }}
        />
      )}

      {/* Camera capture fullscreen */}
      {showCamera && activeLabel && activeIssueId && (
        <CameraCapture
          label={activeLabel}
          reporteId={reporteId}
          equipoId={equipoId}
          reportePasoId={getStepId(activeIssueId)}
          onCapture={handleCameraCapture}
          onClose={() => {
            setShowCamera(false);
            setActiveLabel(null);
            setActiveIssueId(null);
          }}
        />
      )}

      {/* Video capture fullscreen */}
      {showVideoCapture && activeLabel && activeIssueId && (
        <VideoCapture
          label={activeLabel}
          reporteId={reporteId}
          equipoId={equipoId}
          reportePasoId={getStepId(activeIssueId)}
          onCapture={handleVideoCapture}
          onClose={() => {
            setShowVideoCapture(false);
            setActiveLabel(null);
            setActiveIssueId(null);
          }}
        />
      )}
    </div>
  );
}
