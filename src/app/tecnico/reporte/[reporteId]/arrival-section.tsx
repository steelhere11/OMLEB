"use client";

import { useState, useRef, useCallback } from "react";
import { PhotoSourcePicker } from "@/components/shared/photo-source-picker";
import { CameraCapture } from "@/components/shared/camera-capture";
import { VideoCapture } from "@/components/shared/video-capture";
import { compressAndUpload } from "@/lib/photo-uploader";
import { completeArrival } from "@/app/actions/registration";

interface ArrivalSectionProps {
  reporteId: string;
  isComplete: boolean;
  existingPhoto: {
    url: string;
    metadata_fecha: string | null;
    metadata_gps: string | null;
  } | null;
  onComplete: () => void;
}

export function ArrivalSection({
  reporteId,
  isComplete,
  existingPhoto,
  onComplete,
}: ArrivalSectionProps) {
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
      : null
  );
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
      setPhoto({ url: result.url, fecha: result.fecha, gps: result.gps });
      setShowCamera(false);
      setShowVideoCapture(false);

      // Mark arrival as complete
      await completeArrival(reporteId);
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
        etiqueta: "llegada",
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
        await completeArrival(reporteId);
        onComplete();
      } else {
        setUploadError(result.error);
        setTimeout(() => setUploadError(null), 4000);
      }
    },
    [reporteId, onComplete]
  );

  // Already complete with photo
  if (isComplete && photo) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Captura una foto mostrando tu equipo de proteccion personal (casco,
          botas, chaleco) al llegar a la sucursal.
        </p>
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
          <img
            src={photo.url}
            alt="Foto de llegada"
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
            {photo.gps && (
              <p className="text-xs text-green-600 truncate">
                GPS: {photo.gps}
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
        Captura una foto mostrando tu equipo de proteccion personal (casco,
        botas, chaleco) al llegar a la sucursal.
      </p>

      {/* Error toast */}
      {uploadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {/* Photo captured but not yet complete (shouldn't normally happen) */}
      {photo ? (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
          <img
            src={photo.url}
            alt="Foto de llegada"
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
        /* Camera button */
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
              Tomar foto de llegada
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
          label="llegada"
          onSelectCamera={handleSelectCamera}
          onSelectVideoCamera={handleSelectVideoCamera}
          onSelectGallery={handleSelectGallery}
          onClose={() => setShowSourcePicker(false)}
        />
      )}

      {/* Camera capture fullscreen */}
      {showCamera && (
        <CameraCapture
          label="llegada"
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
          label="llegada"
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
