"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { saveEquipmentEntry } from "@/app/actions/reportes";
import { getPhotosForEquipment } from "@/app/actions/fotos";
import { deletePhotoAction } from "@/app/actions/fotos";
import { compressAndUpload } from "@/lib/photo-uploader";
import { WorkTypeToggle } from "@/components/tecnico/work-type-toggle";
import { WorkflowPreventive } from "./workflow-preventive";
import { WorkflowCorrective } from "./workflow-corrective";
import { PhotoSourcePicker } from "@/components/shared/photo-source-picker";
import { CameraCapture } from "@/components/shared/camera-capture";
import { VideoCapture } from "@/components/shared/video-capture";
import { PhotoGalleryRow } from "@/components/shared/photo-gallery-row";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ReporteEquipo, Equipo, TipoTrabajo, ReporteFoto } from "@/types";

interface EquipmentEntryFormProps {
  entry: ReporteEquipo & {
    equipos: Equipo & {
      tipos_equipo?: { slug: string; nombre: string } | null;
    };
  };
  reporteId: string;
  onRemove: () => void;
  isCompleted: boolean;
  isRemoving: boolean;
  onUnsavedChange?: (hasChanges: boolean) => void;
}

const generalLabelColors: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  antes: { bg: "bg-blue-50", text: "text-blue-600", label: "ANTES" },
  despues: { bg: "bg-green-50", text: "text-green-600", label: "DESPUES" },
  dano: { bg: "bg-red-50", text: "text-red-600", label: "DANO" },
  placa: { bg: "bg-gray-100", text: "text-gray-600", label: "PLACA" },
  progreso: { bg: "bg-purple-50", text: "text-purple-600", label: "PROGRESO" },
};

const generalLabels = ["antes", "despues", "dano", "placa", "progreso"];

export function EquipmentEntryForm({
  entry,
  reporteId,
  onRemove,
  isCompleted,
  isRemoving,
  onUnsavedChange,
}: EquipmentEntryFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tipoTrabajo, setTipoTrabajo] = useState<TipoTrabajo>(
    entry.tipo_trabajo
  );
  const [observaciones, setObservaciones] = useState(
    entry.observaciones ?? ""
  );
  const [isSaving, startSaveTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // General photos state
  const [generalPhotos, setGeneralPhotos] = useState<ReporteFoto[]>([]);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideoCapture, setShowVideoCapture] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const equipo = entry.equipos;
  const tipoEquipoSlug = equipo.tipos_equipo?.slug ?? "otro";

  // Load general equipment photos on mount
  useEffect(() => {
    let cancelled = false;

    getPhotosForEquipment(reporteId, entry.equipo_id).then((fetched) => {
      if (!cancelled) setGeneralPhotos(fetched);
    });

    return () => {
      cancelled = true;
    };
  }, [reporteId, entry.equipo_id]);

  const handleSave = () => {
    startSaveTransition(async () => {
      const formData = new FormData();
      formData.set("equipo_id", entry.equipo_id);
      formData.set("tipo_trabajo", tipoTrabajo);
      formData.set("diagnostico", "");
      formData.set("trabajo_realizado", "");
      formData.set("observaciones", observaciones);

      const result = await saveEquipmentEntry(
        reporteId,
        entry.id,
        null,
        formData
      );

      if (result.success) {
        setSavedMessage("Guardado");
        setErrorMessage(null);
        onUnsavedChange?.(false);
        setTimeout(() => setSavedMessage(null), 2000);
      } else {
        setErrorMessage(result.error ?? "Error al guardar");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    });
  };

  const handleFieldChange = () => {
    onUnsavedChange?.(true);
  };

  // Scroll input into view on focus (mobile keyboard handling)
  const handleInputFocus = (
    e: React.FocusEvent<HTMLTextAreaElement>
  ) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  // General photo handlers
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
    (result: { url: string; fotoId: string; gps: string | null; fecha: string }) => {
      setGeneralPhotos((prev) => [
        ...prev,
        {
          id: result.fotoId,
          reporte_id: reporteId,
          equipo_id: entry.equipo_id,
          reporte_paso_id: null,
          url: result.url,
          etiqueta: (activeLabel?.toLowerCase() ?? "antes") as ReporteFoto["etiqueta"],
          tipo_media: "foto" as const,
          metadata_gps: result.gps,
          metadata_fecha: result.fecha,
          created_at: new Date().toISOString(),
        },
      ]);
      setShowCamera(false);
    },
    [reporteId, entry.equipo_id, activeLabel]
  );

  const handleVideoCapture = useCallback(
    (result: { url: string; fotoId: string; gps: string | null; fecha: string }) => {
      setGeneralPhotos((prev) => [
        ...prev,
        {
          id: result.fotoId,
          reporte_id: reporteId,
          equipo_id: entry.equipo_id,
          reporte_paso_id: null,
          url: result.url,
          etiqueta: (activeLabel?.toLowerCase() ?? "antes") as ReporteFoto["etiqueta"],
          tipo_media: "video" as const,
          metadata_gps: result.gps,
          metadata_fecha: result.fecha,
          created_at: new Date().toISOString(),
        },
      ]);
      setShowVideoCapture(false);
    },
    [reporteId, entry.equipo_id, activeLabel]
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
        const result = await compressAndUpload(file, {
          reporteId,
          equipoId: entry.equipo_id,
          reportePasoId: null,
          etiqueta: label,
          gps: null,
          fecha: new Date(),
        });

        if (result.success) {
          setGeneralPhotos((prev) => [
            ...prev,
            {
              id: result.fotoId,
              reporte_id: reporteId,
              equipo_id: entry.equipo_id,
              reporte_paso_id: null,
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [reporteId, entry.equipo_id, activeLabel]
  );

  const handleDeletePhoto = useCallback(async (fotoId: string) => {
    setGeneralPhotos((prev) => prev.filter((p) => p.id !== fotoId));
    await deletePhotoAction(fotoId);
  }, []);

  const getPhotoCount = (etapa: string) =>
    generalPhotos.filter((p) => p.etiqueta === etapa).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors active:bg-gray-50"
      >
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">
            {equipo.numero_etiqueta}
          </p>
          <div className="flex items-center gap-2">
            {(equipo.marca || equipo.modelo) && (
              <p className="text-xs text-gray-500">
                {[equipo.marca, equipo.modelo].filter(Boolean).join(" ")}
              </p>
            )}
            {equipo.tipos_equipo && (
              <span className="text-xs text-gray-400">
                · {equipo.tipos_equipo.nombre}
              </span>
            )}
          </div>
        </div>

        {/* Work type indicator */}
        <span
          className={`mr-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            tipoTrabajo === "preventivo"
              ? "bg-blue-50 text-blue-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {tipoTrabajo === "preventivo" ? "Prev." : "Corr."}
        </span>

        {/* Expand/collapse chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded form */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Work type toggle */}
          <div>
            <Label className="mb-2">Tipo de trabajo</Label>
            <WorkTypeToggle
              name="tipo_trabajo"
              value={tipoTrabajo}
              onChange={(val) => {
                setTipoTrabajo(val);
                handleFieldChange();
              }}
              disabled={isCompleted}
            />
          </div>

          {/* Workflow section -- conditionally renders based on tipo_trabajo */}
          {tipoTrabajo === "preventivo" ? (
            <WorkflowPreventive
              reporteEquipoId={entry.id}
              tipoEquipoSlug={tipoEquipoSlug}
              isCompleted={isCompleted}
              reporteId={reporteId}
              equipoId={entry.equipo_id}
            />
          ) : (
            <WorkflowCorrective
              reporteEquipoId={entry.id}
              tipoEquipoSlug={tipoEquipoSlug}
              isCompleted={isCompleted}
              reporteId={reporteId}
              equipoId={entry.equipo_id}
            />
          )}

          {/* General photos section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">
              Fotos generales del equipo
            </p>
            <div className="flex flex-wrap gap-2">
              {generalLabels.map((etapa) => {
                const colors = generalLabelColors[etapa];
                const count = getPhotoCount(etapa);
                return (
                  <button
                    key={etapa}
                    type="button"
                    onClick={() => handleLabelClick(etapa)}
                    disabled={isCompleted}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${colors.bg} ${colors.text} border-current transition-colors active:opacity-80 disabled:opacity-50`}
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
            {isUploading && (
              <p className="text-xs text-brand-600 font-medium">
                Subiendo fotos...
              </p>
            )}
            <PhotoGalleryRow
              photos={generalPhotos}
              onDelete={!isCompleted ? handleDeletePhoto : undefined}
              disabled={isCompleted}
            />
          </div>

          {/* General observations textarea */}
          <div>
            <Label htmlFor={`observaciones-${entry.id}`} className="mb-2">
              Observaciones generales
            </Label>
            <Textarea
              id={`observaciones-${entry.id}`}
              value={observaciones}
              onChange={(e) => {
                setObservaciones(e.target.value);
                handleFieldChange();
              }}
              onFocus={handleInputFocus}
              placeholder="Observaciones adicionales sobre este equipo..."
              disabled={isCompleted}
              className="min-h-[80px]"
            />
          </div>

          {/* Save/remove buttons and status */}
          {!isCompleted && (
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={onRemove}
                disabled={isRemoving}
              >
                Eliminar
              </Button>

              <div className="flex items-center gap-3">
                {/* Saved indicator */}
                {savedMessage && (
                  <span className="text-sm font-medium text-green-600">
                    {savedMessage}
                  </span>
                )}
                {errorMessage && (
                  <span className="text-sm font-medium text-red-600">
                    {errorMessage}
                  </span>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={isSaving}
                >
                  Guardar
                </Button>
              </div>
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
          equipoId={entry.equipo_id}
          reportePasoId={null}
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
          equipoId={entry.equipo_id}
          reportePasoId={null}
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
