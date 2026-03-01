"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { getGpsPosition, reverseGeocode, type GpsPosition, type GpsErrorReason } from "@/lib/gps";
import { drawOverlayBadge } from "@/lib/photo-stamper";
import { compressAndUpload } from "@/lib/photo-uploader";

interface CameraCaptureProps {
  label: string;
  reporteId: string;
  equipoId: string | null;
  reportePasoId: string | null;
  onCapture: (result: { url: string; fotoId: string }) => void;
  onClose: () => void;
}

export function CameraCapture({
  label,
  reporteId,
  equipoId,
  reportePasoId,
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const gpsRef = useRef<GpsPosition | null>(null);
  const addressRef = useRef<string[]>([]);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"pending" | "acquired" | "failed">("pending");
  const [gpsError, setGpsError] = useState<GpsErrorReason | null>(null);

  // Clean up stream + animation frame
  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }
  }, []);

  // Initialize camera and GPS
  useEffect(() => {
    let mounted = true;

    async function init() {
      // Request GPS FIRST so iOS Safari shows location prompt before camera prompt.
      // Concurrent prompts cause the GPS timeout to fire before the user can respond.
      const gpsResult = await getGpsPosition({ timeout: 15000 });
      if (!mounted) return;
      if (gpsResult.position) {
        gpsRef.current = gpsResult.position;
        setGpsStatus("acquired");
        setGpsError(null);
        // Reverse-geocode in background (non-blocking)
        reverseGeocode(gpsResult.position.lat, gpsResult.position.lng).then((lines) => {
          if (mounted) addressRef.current = lines;
        });
      } else {
        setGpsStatus("failed");
        setGpsError(gpsResult.error ?? null);
      }

      // Refresh GPS every 10 seconds (only if not denied — retrying denied is pointless without user gesture)
      if (gpsResult.error !== "denied") {
        gpsIntervalRef.current = setInterval(() => {
          getGpsPosition().then((result) => {
            if (mounted && result.position) {
              gpsRef.current = result.position;
              setGpsStatus("acquired");
              setGpsError(null);
              // Re-geocode if position changed significantly
              reverseGeocode(result.position.lat, result.position.lng).then((lines) => {
                if (mounted) addressRef.current = lines;
              });
            }
          });
        }, 10000);
      }

      // Open camera (after GPS prompt is resolved)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (!mounted) return;
        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
            setCameraError(
              "Permiso de camara denegado. Activa el permiso en la configuracion del navegador."
            );
          } else if (err.name === "NotFoundError") {
            setCameraError(
              "No se encontro una camara en este dispositivo."
            );
          } else if (err.name === "OverconstrainedError") {
            setCameraError(
              "La camara no soporta la configuracion solicitada."
            );
          } else {
            setCameraError(`Error al abrir la camara: ${err.message}`);
          }
        } else {
          setCameraError("Error desconocido al abrir la camara.");
        }
      }
    }

    init();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [cleanup]);

  // Render loop: draw video + overlay to canvas
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    function renderFrame() {
      if (!video || !canvas) return;

      // Wait until video has dimensions
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        // Set canvas drawing buffer to match video resolution
        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          setIsReady(true);
        }

        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Draw overlay badge with address lines
          drawOverlayBadge(
            ctx,
            {
              addressLines: addressRef.current,
              timestamp: new Date(),
            },
            canvas.width,
            canvas.height
          );
        }
      }

      rafRef.current = requestAnimationFrame(renderFrame);
    }

    rafRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, []);

  // Capture photo
  const handleCapture = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || isCapturing) return;

    setIsCapturing(true);
    setUploadError(null);
    setUploadProgress(0);

    // Draw one final frame with current overlay
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      drawOverlayBadge(
        ctx,
        {
          addressLines: addressRef.current,
          timestamp: new Date(),
        },
        canvas.width,
        canvas.height
      );
    }

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setIsCapturing(false);
          setUploadError("Error al capturar la imagen.");
          return;
        }

        const gps = gpsRef.current;
        const gpsString =
          gps && gps.lat !== null && gps.lng !== null
            ? `${gps.lat.toFixed(6)},${gps.lng.toFixed(6)}`
            : null;

        const result = await compressAndUpload(
          blob,
          {
            reporteId,
            equipoId,
            reportePasoId,
            etiqueta: label.toLowerCase(),
            gps: gpsString,
            fecha: new Date(),
          },
          (pct) => setUploadProgress(pct)
        );

        setIsCapturing(false);
        setUploadProgress(null);

        if (result.success) {
          onCapture({ url: result.url, fotoId: result.fotoId });
        } else {
          setUploadError(result.error);
          // Clear error after 4 seconds
          setTimeout(() => setUploadError(null), 4000);
        }
      },
      "image/jpeg",
      0.85
    );
  }, [isCapturing, reporteId, equipoId, reportePasoId, label, onCapture]);

  // Retry GPS — called from user tap (user gesture context lets iOS Safari show the prompt)
  const retryGps = useCallback(async () => {
    setGpsStatus("pending");
    setGpsError(null);
    const result = await getGpsPosition({ timeout: 15000 });
    if (result.position) {
      gpsRef.current = result.position;
      setGpsStatus("acquired");
      setGpsError(null);
      // Reverse-geocode the new position
      reverseGeocode(result.position.lat, result.position.lng).then((lines) => {
        addressRef.current = lines;
      });
      // Start interval refresh if not already running
      if (!gpsIntervalRef.current) {
        gpsIntervalRef.current = setInterval(() => {
          getGpsPosition().then((r) => {
            if (r.position) {
              gpsRef.current = r.position;
              setGpsStatus("acquired");
              reverseGeocode(r.position.lat, r.position.lng).then((lines) => {
                addressRef.current = lines;
              });
            }
          });
        }, 10000);
      }
    } else {
      setGpsStatus("failed");
      setGpsError(result.error ?? null);
    }
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // Camera error state
  if (cameraError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6">
        <div className="max-w-sm text-center">
          {/* Camera error icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-4 h-16 w-16 text-red-400"
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
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
            />
            <line
              x1="3"
              y1="3"
              x2="21"
              y2="21"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </svg>
          <p className="mb-6 text-base text-white">{cameraError}</p>
          <button
            onClick={handleClose}
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 active:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Hidden video element (source for canvas) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute h-0 w-0 opacity-0"
      />

      {/* Close button - top left */}
      <button
        onClick={handleClose}
        className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white active:bg-black/70"
        aria-label="Cerrar camara"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* GPS status indicator - top center */}
      {gpsStatus === "failed" && gpsError === "denied" ? (
        /* Denied: show instructions + reload button (retry won't work — iOS caches denial) */
        <div className="absolute left-4 right-4 top-4 z-10 flex flex-col items-center gap-2 rounded-xl bg-red-700/90 px-4 py-3 text-center">
          <p className="text-xs font-medium leading-tight text-white">
            Ubicacion bloqueada por el navegador.
          </p>
          <p className="text-[11px] leading-tight text-white/80">
            iOS: Ajustes &gt; Safari &gt; Ubicacion &gt; Permitir.{"\n"}
            Android: Toca el candado en la barra de direccion &gt; Permisos &gt; Ubicacion.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-1 rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-red-700 active:bg-gray-100"
          >
            Recargar pagina
          </button>
        </div>
      ) : (
        /* Acquired / pending / other failures: show compact pill */
        <button
          type="button"
          onClick={gpsStatus === "failed" ? retryGps : undefined}
          className={`absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
            gpsStatus === "acquired"
              ? "bg-green-600/80 text-white"
              : gpsStatus === "failed"
                ? "bg-yellow-600/80 text-white active:bg-yellow-700/80"
                : "bg-white/20 text-white/70"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {gpsStatus === "acquired"
            ? "GPS activo"
            : gpsStatus === "failed"
              ? "GPS no disponible — toca para reintentar"
              : "Obteniendo GPS..."}
        </button>
      )}

      {/* Label badge - top right */}
      <div className="absolute right-4 top-4 z-10 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
        {label}
      </div>

      {/* Canvas (fills the screen, shows video + overlay) */}
      <canvas
        ref={canvasRef}
        className="flex-1 object-contain"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Loading state before video is ready */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      {/* Upload error toast */}
      {uploadError && (
        <div className="absolute left-4 right-4 top-16 z-20 rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
          {uploadError}
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-8 pt-4">
        {/* Capture button */}
        <button
          onClick={handleCapture}
          disabled={isCapturing || !isReady}
          className="relative flex h-18 w-18 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-95 disabled:opacity-50"
          aria-label="Tomar foto"
        >
          {isCapturing ? (
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-white" />
          )}
        </button>

        {/* Upload progress bar */}
        {uploadProgress !== null && (
          <div className="absolute bottom-2 left-8 right-8">
            <div className="h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-brand-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-white/70">
              Subiendo... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
