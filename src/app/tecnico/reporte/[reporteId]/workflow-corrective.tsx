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
import { PhotoGalleryRow } from "@/components/shared/photo-gallery-row";
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

const etapaColors: Record<string, { bg: string; text: string; label: string }> =
  {
    antes: { bg: "bg-blue-50", text: "text-blue-600", label: "ANTES" },
    durante: { bg: "bg-amber-50", text: "text-amber-600", label: "DURANTE" },
    despues: { bg: "bg-green-50", text: "text-green-600", label: "DESPUES" },
  };

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

  const getPhotoCountForIssue = (issueId: string, etapa: string) =>
    (photosByIssue[issueId] ?? []).filter(
      (p) => p.etiqueta === etapa.toLowerCase()
    ).length;

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

                {/* Evidence photo buttons */}
                {issue.evidencia_requerida.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">
                      Evidencia fotografica
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {issue.evidencia_requerida.map((ev, i) => {
                        const colors =
                          etapaColors[ev.etapa] ?? etapaColors.antes;
                        const count = getPhotoCountForIssue(
                          issue.id,
                          ev.etapa
                        );
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              handleLabelClick(issue.id, ev.etapa)
                            }
                            disabled={isCompleted}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${colors.bg} ${colors.text} border-current transition-colors active:opacity-80 disabled:opacity-50`}
                            title={ev.descripcion}
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
                            {colors.label}
                            {count > 0 && ` (${count})`}
                          </button>
                        );
                      })}
                    </div>
                    {isUploading && activeIssueId === issue.id && (
                      <p className="text-xs text-brand-600 font-medium">
                        Subiendo fotos...
                      </p>
                    )}
                    {/* Photo gallery for this issue */}
                    <PhotoGalleryRow
                      photos={issuePhotos}
                      onDelete={
                        !isCompleted
                          ? (fotoId) => handleDeletePhoto(issue.id, fotoId)
                          : undefined
                      }
                      disabled={isCompleted}
                    />
                  </div>
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
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleGalleryFiles}
      />

      {/* Photo source picker bottom sheet */}
      {showSourcePicker && activeLabel && (
        <PhotoSourcePicker
          label={activeLabel}
          onSelectCamera={handleSelectCamera}
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
    </div>
  );
}
