"use client";

import { useState, useRef, useCallback } from "react";
import { PhotoSourcePicker } from "@/components/shared/photo-source-picker";
import { CameraCapture } from "@/components/shared/camera-capture";
import { VideoCapture } from "@/components/shared/video-capture";
import { compressAndUpload } from "@/lib/photo-uploader";
import type { ReporteFoto } from "@/types";

interface PapeletaSectionProps {
  reporteId: string;
  existingPhotos: ReporteFoto[];
  isCompleted: boolean;
}

export function PapeletaSection({
  reporteId,
  existingPhotos,
  isCompleted,
}: PapeletaSectionProps) {
  const [photos, setPhotos] = useState<
    Array<{ id: string; url: string; fecha: string | null }>
  >(
    existingPhotos.map((p) => ({
      id: p.id,
      url: p.url,
      fecha: p.metadata_fecha,
    }))
  );
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVideoCapture, setShowVideoCapture] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPhotos((prev) => [
        ...prev,
        { id: result.fotoId, url: result.url, fecha: result.fecha },
      ]);
      setShowCamera(false);
      setShowVideoCapture(false);
    },
    []
  );

  const handleGalleryFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setUploadError(null);

      // Upload all selected files
      for (const file of Array.from(files)) {
        const result = await compressAndUpload(file, {
          reporteId,
          equipoId: null,
          reportePasoId: null,
          etiqueta: "papeleta",
          gps: null,
          fecha: new Date(),
        });

        if (result.success) {
          setPhotos((prev) => [
            ...prev,
            {
              id: result.fotoId,
              url: result.url,
              fecha: new Date().toISOString(),
            },
          ]);
        } else {
          setUploadError(result.error);
          setTimeout(() => setUploadError(null), 4000);
          break;
        }
      }

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [reporteId]
  );

  return (
    <div className="rounded-card border border-tech-border bg-tech-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-tech-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <h3 className="text-base font-semibold text-tech-text-primary">Papeleta</h3>
      </div>

      <p className="text-body text-tech-text-muted">
        Toma fotos de la papeleta (formato de mantenimiento) del contratista.
      </p>

      {/* Error toast */}
      {uploadError && (
        <div className="rounded-input bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {/* Photo thumbnails */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-[3/4] rounded-input overflow-hidden bg-gray-100">
              <img
                src={photo.url}
                alt="Papeleta"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Add photo button */}
      {!isCompleted && (
        <button
          type="button"
          onClick={() => setShowSourcePicker(true)}
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-tech-text-secondary transition-colors active:bg-gray-50 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              Subiendo...
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5"
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
              {photos.length > 0
                ? "Agregar otra foto"
                : "Tomar foto de papeleta"}
            </>
          )}
        </button>
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
      {showSourcePicker && (
        <PhotoSourcePicker
          label="papeleta"
          onSelectCamera={handleSelectCamera}
          onSelectVideoCamera={handleSelectVideoCamera}
          onSelectGallery={handleSelectGallery}
          onClose={() => setShowSourcePicker(false)}
        />
      )}

      {/* Camera capture fullscreen */}
      {showCamera && (
        <CameraCapture
          label="papeleta"
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
          label="papeleta"
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
