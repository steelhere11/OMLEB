"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { getGpsPosition, reverseGeocode, type GpsPosition, type GpsErrorReason } from "@/lib/gps";
import { compressAndUpload } from "@/lib/photo-uploader";

const MAX_RECORDING_SECONDS = 60;
const WARNING_SECONDS = 50;

interface VideoCaptureProps {
  label: string;
  reporteId: string;
  equipoId: string | null;
  reportePasoId: string | null;
  onCapture: (result: { url: string; fotoId: string; gps: string | null; fecha: string; queued?: boolean }) => void;
  onClose: () => void;
}

/** Pick the best supported MIME type for MediaRecorder */
function getPreferredMimeType(): string {
  if (typeof MediaRecorder !== "undefined") {
    if (MediaRecorder.isTypeSupported("video/mp4")) return "video/mp4";
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) return "video/webm;codecs=vp9";
    if (MediaRecorder.isTypeSupported("video/webm")) return "video/webm";
  }
  return "video/webm";
}

export function VideoCapture({
  label,
  reporteId,
  equipoId,
  reportePasoId,
  onCapture,
  onClose,
}: VideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const gpsRef = useRef<GpsPosition | null>(null);
  const addressRef = useRef<string[]>([]);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"pending" | "acquired" | "failed" | "hidden">("pending");
  const [gpsError, setGpsError] = useState<GpsErrorReason | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Clean up all resources
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (clockRef.current) {
      clearInterval(clockRef.current);
      clockRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try { recorderRef.current.stop(); } catch { /* ignore */ }
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

  // Handle GPS result
  const handleGpsResult = useCallback(
    (gpsResult: { position: GpsPosition | null; error?: string }, mounted: { current: boolean }) => {
      if (!mounted.current) return;
      if (gpsResult.position) {
        gpsRef.current = gpsResult.position;
        setGpsStatus("acquired");
        setGpsError(null);
        // Auto-hide GPS toast after 2 seconds
        setTimeout(() => setGpsStatus("hidden"), 2000);
        reverseGeocode(gpsResult.position.lat, gpsResult.position.lng).then((lines) => {
          if (mounted.current) addressRef.current = lines;
        });
        if (!gpsIntervalRef.current) {
          gpsIntervalRef.current = setInterval(() => {
            getGpsPosition().then((result) => {
              if (mounted.current && result.position) {
                gpsRef.current = result.position;
                setGpsStatus("acquired");
                setGpsError(null);
                reverseGeocode(result.position.lat, result.position.lng).then((lines) => {
                  if (mounted.current) addressRef.current = lines;
                });
              }
            });
          }, 10000);
        }
      } else {
        setGpsStatus("failed");
        setGpsError((gpsResult.error as GpsErrorReason) ?? null);
      }
    },
    []
  );

  // Initialize camera and GPS
  useEffect(() => {
    const mounted = { current: true };

    // GPS: fire and forget
    getGpsPosition({ timeout: 10000 }).then((gpsResult) => {
      handleGpsResult(gpsResult, mounted);
    });

    // Camera
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: true,
        });

        if (!mounted.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setIsReady(true);
        }
      } catch (err) {
        if (!mounted.current) return;
        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
            setCameraError("Permiso de camara denegado. Activa el permiso en la configuracion del navegador.");
          } else if (err.name === "NotFoundError") {
            setCameraError("No se encontro una camara en este dispositivo.");
          } else {
            setCameraError(`Error al abrir la camara: ${err.message}`);
          }
        } else {
          setCameraError("Error desconocido al abrir la camara.");
        }
      }
    })();

    return () => {
      mounted.current = false;
      cleanup();
    };
  }, [cleanup, handleGpsResult]);

  // Tick the overlay clock every second
  useEffect(() => {
    clockRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (clockRef.current) {
        clearInterval(clockRef.current);
        clockRef.current = null;
      }
    };
  }, []);

  // Upload the recorded video blob
  const uploadVideo = useCallback(
    async (blob: Blob) => {
      setUploadProgress(10);
      setUploadError(null);

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

      setUploadProgress(null);

      if (result.success) {
        if ("queued" in result && result.queued) {
          onCapture({ url: "", fotoId: "", gps: gpsString, fecha: new Date().toISOString(), queued: true });
        } else {
          onCapture({ url: result.url, fotoId: result.fotoId, gps: gpsString, fecha: new Date().toISOString() });
        }
      } else {
        setUploadError(result.error);
        setTimeout(() => setUploadError(null), 4000);
      }
    },
    [reporteId, equipoId, reportePasoId, label, onCapture]
  );

  // Start recording
  const handleStartRecording = useCallback(() => {
    if (!streamRef.current || isRecording) return;

    chunksRef.current = [];
    const mimeType = getPreferredMimeType();

    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsRecording(false);

        const chunks = chunksRef.current;
        if (chunks.length === 0) return;

        // Determine the base MIME type (strip codecs)
        const baseMime = mimeType.split(";")[0];
        const videoBlob = new Blob(chunks, { type: baseMime });
        uploadVideo(videoBlob);
      };

      recorder.start(1000); // collect data every second
      setIsRecording(true);
      setElapsed(0);
      setShowWarning(false);

      // Timer for elapsed counter and auto-stop
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= WARNING_SECONDS && next < MAX_RECORDING_SECONDS) {
            setShowWarning(true);
          }
          if (next >= MAX_RECORDING_SECONDS) {
            // Auto-stop
            if (recorderRef.current && recorderRef.current.state === "recording") {
              recorderRef.current.stop();
            }
          }
          return next;
        });
      }, 1000);
    } catch {
      setCameraError("Este navegador no soporta la grabacion de video.");
    }
  }, [isRecording, uploadVideo]);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  // Retry GPS
  const retryGps = useCallback(async () => {
    setGpsStatus("pending");
    setGpsError(null);
    const result = await getGpsPosition({ timeout: 10000 });
    handleGpsResult(result, { current: true });
  }, [handleGpsResult]);

  // Handle close
  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // Format date/time for overlay (matches photo-stamper.ts style)
  const overlayDateStr = currentTime.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const overlayTimeStr = currentTime.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  // Format seconds as mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Camera error state
  if (cameraError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6">
        <div className="max-w-sm text-center">
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
              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
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
      {/* Live camera preview */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="h-full w-full object-cover"
      />

      {/* Live metadata overlay - bottom right (matches photo capture style) */}
      <div
        className="pointer-events-none absolute bottom-24 right-4 z-10 text-right"
        style={{
          textShadow:
            "-1px -1px 0 rgba(0,0,0,0.85), 1px -1px 0 rgba(0,0,0,0.85), -1px 1px 0 rgba(0,0,0,0.85), 1px 1px 0 rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.5)",
        }}
      >
        <p className="text-sm font-bold leading-snug text-white">
          {overlayDateStr} {overlayTimeStr}
        </p>
        {addressRef.current.map((line, i) => (
          <p key={i} className="text-sm font-bold leading-snug text-white">
            {line}
          </p>
        ))}
      </div>

      {/* Close button - top left */}
      {!isRecording && (
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* GPS status indicator - top center (hidden after acquisition) */}
      {gpsStatus === "hidden" ? null : gpsStatus === "failed" && gpsError === "denied" ? (
        <div className="absolute left-4 right-4 top-4 z-10 flex flex-col items-center gap-2 rounded-xl bg-red-700/90 px-4 py-3 text-center">
          <p className="text-xs font-bold leading-tight text-white">Ubicacion bloqueada</p>
          <button
            type="button"
            onClick={retryGps}
            className="rounded-lg bg-white/20 px-4 py-1.5 text-xs font-semibold text-white active:bg-white/30"
          >
            Reintentar
          </button>
        </div>
      ) : (
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
              ? "GPS no disponible"
              : "Obteniendo GPS..."}
        </button>
      )}

      {/* Label badge - top right */}
      <div className="absolute right-4 top-4 z-10 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
        {label}
      </div>

      {/* Recording indicator + timer (centered) */}
      {isRecording && (
        <div className="absolute left-1/2 top-16 z-10 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-black/60 px-4 py-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-bold tabular-nums text-white">
            {formatTime(elapsed)} / {formatTime(MAX_RECORDING_SECONDS)}
          </span>
        </div>
      )}

      {/* Warning toast at 50s */}
      {showWarning && isRecording && (
        <div className="absolute left-4 right-4 top-28 z-20 rounded-lg bg-amber-600 px-4 py-2 text-center text-xs font-medium text-white shadow-lg">
          La grabacion se detendra automaticamente en {MAX_RECORDING_SECONDS - elapsed}s
        </div>
      )}

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
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 pb-8 pt-4">
        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="w-full px-8">
            <div className="h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-brand-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-white/70">
              Subiendo video... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        {/* Record / Stop button */}
        {uploadProgress === null && (
          <>
            {!isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleStartRecording}
                  disabled={!isReady}
                  className="relative flex h-18 w-18 items-center justify-center rounded-full border-4 border-red-500 bg-red-500/20 transition-transform active:scale-95 disabled:opacity-50"
                  aria-label="Grabar video"
                >
                  <div className="h-8 w-8 rounded-md bg-red-500" />
                </button>
                <p className="text-xs text-white/70">Toca para grabar</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleStopRecording}
                  className="relative flex h-18 w-18 items-center justify-center rounded-full border-4 border-red-500 bg-red-500/20 transition-transform active:scale-95"
                  aria-label="Detener grabacion"
                >
                  <div className="h-8 w-8 rounded-sm bg-red-500" />
                </button>
                <p className="text-xs text-white/70">Toca para detener</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
