"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PhotoSourcePicker } from "@/components/shared/photo-source-picker";
import { CameraCapture } from "@/components/shared/camera-capture";
import { VideoCapture } from "@/components/shared/video-capture";
import { compressAndUpload } from "@/lib/photo-uploader";
import {
  saveEquipmentRegistration,
  updateRegistrationStatus,
} from "@/app/actions/registration";
import { REFRIGERANTES } from "@/lib/constants/nameplate-options";
import { VOLTAJES, FASES } from "@/lib/constants/nameplate-options";
import { UBICACIONES_BBVA } from "@/lib/constants/ubicaciones";
import type { Equipo, ReporteFoto } from "@/types";

interface EquipmentRegistrationCardProps {
  reporteId: string;
  reporteEquipoId: string;
  equipo: Equipo;
  tipoEquipoNombre: string | null;
  existingPhotos: {
    equipo_general: ReporteFoto | null;
    placa: ReporteFoto | null;
  };
  isComplete: boolean;
  onRegistrationChange: (reporteEquipoId: string, complete: boolean) => void;
}

type PhotoSlot = "equipo_general" | "placa";

const PHOTO_SLOT_LABELS: Record<PhotoSlot, { label: string; guidance: string }> = {
  equipo_general: {
    label: "Foto del equipo",
    guidance: "Vista general del equipo instalado",
  },
  placa: {
    label: "Placa de datos",
    guidance: "Placa con modelo, serie y datos tecnicos",
  },
};

export function EquipmentRegistrationCard({
  reporteId,
  reporteEquipoId,
  equipo,
  tipoEquipoNombre,
  existingPhotos,
  isComplete,
  onRegistrationChange,
}: EquipmentRegistrationCardProps) {
  // Form state pre-filled from equipment data
  const [marca, setMarca] = useState(equipo.marca ?? "");
  const [modelo, setModelo] = useState(equipo.modelo ?? "");
  const [numeroSerie, setNumeroSerie] = useState(equipo.numero_serie ?? "");
  const [capacidad, setCapacidad] = useState(equipo.capacidad ?? "");
  const [refrigerante, setRefrigerante] = useState(equipo.refrigerante ?? "");
  const [voltaje, setVoltaje] = useState(equipo.voltaje ?? "");
  const [fase, setFase] = useState(equipo.fase ?? "");
  const [ubicacion, setUbicacion] = useState(equipo.ubicacion ?? "");

  // Photo state
  const [photos, setPhotos] = useState<Record<PhotoSlot, ReporteFoto | null>>({
    equipo_general: existingPhotos.equipo_general,
    placa: existingPhotos.placa,
  });
  const [activeSlot, setActiveSlot] = useState<PhotoSlot | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideoCapture, setShowVideoCapture] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [complete, setComplete] = useState(isComplete);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced save on field change
  const saveFields = useCallback(
    async (fieldData: Record<string, string>) => {
      setIsSaving(true);
      const result = await saveEquipmentRegistration(
        equipo.id,
        reporteEquipoId,
        fieldData
      );
      setIsSaving(false);

      if (result.success && result.data) {
        const isNowComplete = (result.data as { complete: boolean }).complete;
        setComplete(isNowComplete);
        onRegistrationChange(reporteEquipoId, isNowComplete);
      }
    },
    [equipo.id, reporteEquipoId, onRegistrationChange]
  );

  const scheduleFieldSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveFields({
        marca,
        modelo,
        numero_serie: numeroSerie,
        capacidad,
        refrigerante,
        voltaje,
        fase,
        ubicacion,
      });
    }, 800);
  }, [marca, modelo, numeroSerie, capacidad, refrigerante, voltaje, fase, ubicacion, saveFields]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Immediate save on select/toggle change
  const handleSelectChange = useCallback(
    (field: string, value: string) => {
      switch (field) {
        case "refrigerante":
          setRefrigerante(value);
          break;
        case "voltaje":
          setVoltaje(value);
          break;
        case "fase":
          setFase(value);
          break;
        case "ubicacion":
          setUbicacion(value);
          break;
      }
      // Save immediately for dropdowns/toggles
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const currentFields = {
          marca,
          modelo,
          numero_serie: numeroSerie,
          capacidad,
          refrigerante: field === "refrigerante" ? value : refrigerante,
          voltaje: field === "voltaje" ? value : voltaje,
          fase: field === "fase" ? value : fase,
          ubicacion: field === "ubicacion" ? value : ubicacion,
        };
        saveFields(currentFields);
      }, 300);
    },
    [marca, modelo, numeroSerie, capacidad, refrigerante, voltaje, fase, ubicacion, saveFields]
  );

  // Photo handlers
  const handlePhotoSlotClick = (slot: PhotoSlot) => {
    setActiveSlot(slot);
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

  const handleCaptureComplete = useCallback(
    async (result: {
      url: string;
      fotoId: string;
      gps: string | null;
      fecha: string;
    }) => {
      if (!activeSlot) return;

      const newPhoto: ReporteFoto = {
        id: result.fotoId,
        reporte_id: reporteId,
        equipo_id: equipo.id,
        reporte_paso_id: null,
        url: result.url,
        etiqueta: activeSlot,
        tipo_media: "foto",
        estatus_revision: "pendiente",
        nota_admin: null,
        metadata_gps: result.gps,
        metadata_fecha: result.fecha,
        created_at: new Date().toISOString(),
      };

      setPhotos((prev) => ({ ...prev, [activeSlot]: newPhoto }));
      setShowCamera(false);
      setShowVideoCapture(false);
      setActiveSlot(null);

      // Re-evaluate registration completeness after photo upload
      const statusResult = await updateRegistrationStatus(
        reporteEquipoId,
        equipo.id
      );
      if (statusResult.success && statusResult.data !== undefined) {
        const isNowComplete = statusResult.data as boolean;
        setComplete(isNowComplete);
        onRegistrationChange(reporteEquipoId, isNowComplete);
      }
    },
    [activeSlot, reporteId, equipo.id, reporteEquipoId, onRegistrationChange]
  );

  const handleGalleryFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !activeSlot) return;

      setIsUploading(true);

      const file = files[0];
      const result = await compressAndUpload(file, {
        reporteId,
        equipoId: equipo.id,
        reportePasoId: null,
        etiqueta: activeSlot,
        gps: null,
        fecha: new Date(),
      });

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (result.success) {
        const newPhoto: ReporteFoto = {
          id: result.fotoId,
          reporte_id: reporteId,
          equipo_id: equipo.id,
          reporte_paso_id: null,
          url: result.url,
          etiqueta: activeSlot,
          tipo_media: file.type.startsWith("video/") ? "video" : "foto",
          estatus_revision: "pendiente",
          nota_admin: null,
          metadata_gps: null,
          metadata_fecha: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        setPhotos((prev) => ({ ...prev, [activeSlot]: newPhoto }));
        setActiveSlot(null);

        // Re-evaluate completeness
        const statusResult = await updateRegistrationStatus(
          reporteEquipoId,
          equipo.id
        );
        if (statusResult.success && statusResult.data !== undefined) {
          const isNowComplete = statusResult.data as boolean;
          setComplete(isNowComplete);
          onRegistrationChange(reporteEquipoId, isNowComplete);
        }
      }
    },
    [activeSlot, reporteId, equipo.id, reporteEquipoId, onRegistrationChange]
  );

  const inputClass = (value: string) =>
    `w-full rounded-input border px-3 py-2.5 text-body ${
      !value.trim()
        ? "border-yellow-300 bg-yellow-50 focus:border-yellow-400 focus:ring-yellow-200"
        : "border-tech-border bg-tech-surface focus:border-blue-400 focus:ring-blue-200"
    } focus:outline-none focus:ring-2`;

  const selectClass = (value: string) =>
    `w-full rounded-input border px-3 py-2.5 text-body appearance-none ${
      !value
        ? "border-yellow-300 bg-yellow-50 text-tech-text-muted"
        : "border-tech-border bg-tech-surface text-tech-text-primary"
    } focus:outline-none focus:ring-2 focus:border-blue-400 focus:ring-blue-200`;

  return (
    <div
      className={`rounded-card border overflow-hidden ${
        complete
          ? "border-green-200 bg-tech-surface"
          : "border-tech-border bg-tech-surface"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-tech-border-subtle">
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-tech-text-primary truncate">
            {equipo.numero_etiqueta}
          </p>
          {tipoEquipoNombre && (
            <p className="text-label text-tech-text-muted">{tipoEquipoNombre}</p>
          )}
        </div>
        {complete ? (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Completo
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
            Pendiente
          </span>
        )}
        {isSaving && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Photo row: two side-by-side slots */}
        <div className="grid grid-cols-2 gap-3">
          {(["equipo_general", "placa"] as const).map((slot) => {
            const photo = photos[slot];
            const meta = PHOTO_SLOT_LABELS[slot];

            return (
              <div key={slot}>
                <p className="text-label font-medium text-tech-text-muted mb-1.5">
                  {meta.label}
                </p>
                {photo ? (
                  <div className="relative">
                    <img
                      src={photo.url}
                      alt={meta.label}
                      className="h-28 w-full rounded-input object-cover border border-tech-border"
                    />
                    <div className="absolute bottom-1 right-1 rounded-full bg-green-500 p-0.5">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePhotoSlotClick(slot)}
                    disabled={isUploading}
                    className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-input border-2 border-dashed border-yellow-300 bg-yellow-50 text-yellow-600 transition-colors active:bg-yellow-100 disabled:opacity-50"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                      />
                    </svg>
                    <span className="text-[10px] font-medium leading-tight text-center px-1">
                      {meta.guidance}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Nameplate form fields */}
        <div className="grid grid-cols-2 gap-3">
          {/* Marca */}
          <div>
            <label className="block text-label font-medium text-tech-text-muted mb-1">
              Marca
            </label>
            <input
              type="text"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              onBlur={scheduleFieldSave}
              placeholder="Ej: Carrier"
              className={inputClass(marca)}
            />
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-label font-medium text-tech-text-muted mb-1">
              Modelo
            </label>
            <input
              type="text"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              onBlur={scheduleFieldSave}
              placeholder="Ej: 40MHHQ"
              className={inputClass(modelo)}
            />
          </div>

          {/* Numero de Serie */}
          <div>
            <label className="block text-label font-medium text-tech-text-muted mb-1">
              No. Serie
            </label>
            <input
              type="text"
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
              onBlur={scheduleFieldSave}
              placeholder="Ej: 1234567890"
              className={inputClass(numeroSerie)}
            />
          </div>

          {/* Capacidad */}
          <div>
            <label className="block text-label font-medium text-tech-text-muted mb-1">
              Capacidad
            </label>
            <input
              type="text"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              onBlur={scheduleFieldSave}
              placeholder="Ej: 5 Ton, 60000 BTU"
              className={inputClass(capacidad)}
            />
          </div>

          {/* Refrigerante dropdown */}
          <div>
            <label className="block text-label font-medium text-tech-text-muted mb-1">
              Refrigerante
            </label>
            <select
              value={refrigerante}
              onChange={(e) =>
                handleSelectChange("refrigerante", e.target.value)
              }
              className={selectClass(refrigerante)}
            >
              <option value="">Seleccionar...</option>
              {REFRIGERANTES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Voltaje dropdown */}
          <div>
            <label className="block text-label font-medium text-tech-text-muted mb-1">
              Voltaje
            </label>
            <select
              value={voltaje}
              onChange={(e) => handleSelectChange("voltaje", e.target.value)}
              className={selectClass(voltaje)}
            >
              <option value="">Seleccionar...</option>
              {VOLTAJES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fase toggle (two-option) */}
          <div>
            <label className="block text-label font-medium text-tech-text-muted mb-1">
              Fase
            </label>
            <div className="flex rounded-input border border-tech-border overflow-hidden">
              {FASES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => handleSelectChange("fase", f.value)}
                  className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
                    fase === f.value
                      ? "bg-blue-500 text-white"
                      : !fase
                        ? "bg-yellow-50 text-tech-text-muted active:bg-gray-100"
                        : "bg-white text-tech-text-muted active:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ubicacion dropdown */}
          <div>
            <label className="block text-label font-medium text-tech-text-muted mb-1">
              Ubicacion
            </label>
            <select
              value={ubicacion}
              onChange={(e) => handleSelectChange("ubicacion", e.target.value)}
              className={selectClass(ubicacion)}
            >
              <option value="">Seleccionar...</option>
              {UBICACIONES_BBVA.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hidden file input for gallery uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleGalleryFiles}
      />

      {/* Photo source picker bottom sheet */}
      {showSourcePicker && activeSlot && (
        <PhotoSourcePicker
          label={PHOTO_SLOT_LABELS[activeSlot].label}
          onSelectCamera={handleSelectCamera}
          onSelectVideoCamera={handleSelectVideoCamera}
          onSelectGallery={handleSelectGallery}
          onClose={() => {
            setShowSourcePicker(false);
            setActiveSlot(null);
          }}
        />
      )}

      {/* Camera capture fullscreen */}
      {showCamera && activeSlot && (
        <CameraCapture
          label={activeSlot}
          reporteId={reporteId}
          equipoId={equipo.id}
          reportePasoId={null}
          onCapture={handleCaptureComplete}
          onClose={() => {
            setShowCamera(false);
            setActiveSlot(null);
          }}
        />
      )}

      {/* Video capture fullscreen */}
      {showVideoCapture && activeSlot && (
        <VideoCapture
          label={activeSlot}
          reporteId={reporteId}
          equipoId={equipo.id}
          reportePasoId={null}
          onCapture={handleCaptureComplete}
          onClose={() => {
            setShowVideoCapture(false);
            setActiveSlot(null);
          }}
        />
      )}
    </div>
  );
}
