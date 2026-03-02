"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PhotoSourcePicker } from "@/components/shared/photo-source-picker";
import { CameraCapture } from "@/components/shared/camera-capture";
import { VideoCapture } from "@/components/shared/video-capture";
import { compressAndUpload } from "@/lib/photo-uploader";
import { completeSiteOverview } from "@/app/actions/registration";

interface SiteOverviewSectionProps {
  reporteId: string;
  folioId: string;
  isComplete: boolean;
  existingFolioPhoto: { url: string } | null;
  existingPhoto: {
    url: string;
    metadata_fecha: string | null;
    metadata_gps: string | null;
  } | null;
  onComplete: () => void;
}

export function SiteOverviewSection({
  reporteId,
  folioId,
  isComplete,
  existingFolioPhoto,
  existingPhoto,
  onComplete,
}: SiteOverviewSectionProps) {
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideoCapture, setShowVideoCapture] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{
    url: string;
    fecha: string | null;
    gps: string | null;
  } | null>(
    existingPhoto
      ? {
          url: existingPhoto.url,
          fecha: existingPhoto.metadata_fecha,
          gps: existingPhoto.metadata_gps,
        }
      : existingFolioPhoto
        ? { url: existingFolioPhoto.url, fecha: null, gps: null }
        : null
  );
  const [autoCompleted, setAutoCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-complete if a folio-level site photo already exists from a previous visit
  useEffect(() => {
    if (existingFolioPhoto && !isComplete && !autoCompleted) {
      setAutoCompleted(true);
      completeSiteOverview(reporteId).then(() => {
        onComplete();
      });
    }
  }, [existingFolioPhoto, isComplete, autoCompleted, reporteId, onComplete]);

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

  const finishCapture = useCallback(
    async (result: {
      url: string;
      fotoId: string;
      gps: string | null;
      fecha: string;
    }) => {
      setPhoto({ url: result.url, fecha: result.fecha, gps: result.gps });
      setShowCamera(false);
      setShowVideoCapture(false);

      // Mark site overview as complete
      await completeSiteOverview(reporteId);
      onComplete();
    },
    [reporteId, onComplete]
  );

  const handleGalleryFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setUploadError(null);

      const file = files[0];
      const result = await compressAndUpload(file, {
        reporteId,
        equipoId: null,
        reportePasoId: null,
        etiqueta: "sitio",
        gps: null,
        fecha: new Date(),
      });

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (result.success) {
        setPhoto({
          url: result.url,
          fecha: new Date().toISOString(),
          gps: null,
        });
        await completeSiteOverview(reporteId);
        onComplete();
      } else {
        setUploadError(result.error);
        setTimeout(() => setUploadError(null), 4000);
      }
    },
    [reporteId, onComplete]
  );

  // Already complete with existing folio photo from previous visit
  if (existingFolioPhoto && (isComplete || autoCompleted)) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Toma una foto panoramica del frente de la sucursal.
        </p>
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
          <img
            src={existingFolioPhoto.url}
            alt="Foto panoramica"
            className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700">
              Ya capturada en visita anterior
            </p>
            <p className="text-xs text-green-600">
              Se reutiliza la foto existente
            </p>
          </div>
          <svg
            className="h-5 w-5 text-green-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
    );
  }

  // Already complete with photo from this visit
  if (isComplete && photo) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Toma una foto panoramica del frente de la sucursal.
        </p>
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
          <img
            src={photo.url}
            alt="Foto panoramica"
            className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700">
              Foto capturada
            </p>
            {photo.fecha && (
              <p className="text-xs text-green-600 truncate">
                {new Date(photo.fecha).toLocaleString("es-MX")}
              </p>
            )}
          </div>
          <svg
            className="h-5 w-5 text-green-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Toma una foto panoramica del frente de la sucursal.
      </p>

      {/* Error toast */}
      {uploadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {/* Photo preview or camera button */}
      {photo ? (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
          <img
            src={photo.url}
            alt="Foto panoramica"
            className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700">
              Foto capturada
            </p>
            {photo.fecha && (
              <p className="text-xs text-green-600 truncate">
                {new Date(photo.fecha).toLocaleString("es-MX")}
              </p>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSourcePicker(true)}
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-500 px-4 py-4 text-white font-medium transition-colors active:bg-blue-600 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Subiendo...
            </>
          ) : (
            <>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
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
              Tomar foto panoramica
            </>
          )}
        </button>
      )}

      {/* Hidden file input for gallery uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleGalleryFiles}
      />

      {/* Photo source picker bottom sheet */}
      {showSourcePicker && (
        <PhotoSourcePicker
          label="sitio"
          onSelectCamera={handleSelectCamera}
          onSelectVideoCamera={handleSelectVideoCamera}
          onSelectGallery={handleSelectGallery}
          onClose={() => setShowSourcePicker(false)}
        />
      )}

      {/* Camera capture fullscreen */}
      {showCamera && (
        <CameraCapture
          label="sitio"
          reporteId={reporteId}
          equipoId={null}
          reportePasoId={null}
          onCapture={finishCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Video capture fullscreen */}
      {showVideoCapture && (
        <VideoCapture
          label="sitio"
          reporteId={reporteId}
          equipoId={null}
          reportePasoId={null}
          onCapture={finishCapture}
          onClose={() => setShowVideoCapture(false)}
        />
      )}
    </div>
  );
}
