"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import SignaturePadLib from "signature_pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SignaturePadProps {
  onSave: (data: { nombre: string; firma: string }) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  const [nombre, setNombre] = useState("");
  const [isLandscape, setIsLandscape] = useState(false);
  const [lockFailed, setLockFailed] = useState(false);
  const [errors, setErrors] = useState<{
    nombre?: string;
    firma?: string;
  }>({});

  // Resize canvas to match container, preserving existing drawing data
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const pad = padRef.current;
    if (!canvas || !pad) return;

    // Save existing drawing data before resize
    const data = pad.toData();

    const parent = canvas.parentElement;
    if (!parent) return;

    const ratio = window.devicePixelRatio || 1;
    const width = parent.offsetWidth;
    const height = parent.offsetHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    // Clear and restore data
    pad.clear();
    if (data.length > 0) {
      pad.fromData(data);
    }
  }, []);

  // Track landscape orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // Initialize fullscreen, orientation lock, and signature pad
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Attempt fullscreen
    (async () => {
      try {
        await container.requestFullscreen();
      } catch {
        // Fullscreen not supported or denied -- fall back gracefully
      }

      // Attempt landscape lock (experimental API -- cast to any for TS compat)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orientation = screen.orientation as any;
        if (orientation && typeof orientation.lock === "function") {
          await orientation.lock("landscape");
        } else {
          setLockFailed(true);
        }
      } catch {
        setLockFailed(true);
      }
    })();

    // Initialize signature pad
    const pad = new SignaturePadLib(canvas, {
      penColor: "rgb(0, 0, 0)",
      backgroundColor: "rgb(255, 255, 255)",
    });
    padRef.current = pad;

    // Initial resize
    const ratio = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.offsetWidth * ratio;
      canvas.height = parent.offsetHeight * ratio;
      canvas.style.width = `${parent.offsetWidth}px`;
      canvas.style.height = `${parent.offsetHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      pad.clear();
    }

    // Resize listener
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);

    return () => {
      // Cleanup
      window.removeEventListener("resize", handleResize);
      pad.off();

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Unlock orientation
      try {
        const orientation = screen.orientation;
        if (orientation && typeof orientation.unlock === "function") {
          orientation.unlock();
        }
      } catch {
        // Orientation unlock not supported
      }
    };
  }, [resizeCanvas]);

  const handleClear = () => {
    padRef.current?.clear();
    setErrors((prev) => ({ ...prev, firma: undefined }));
  };

  const handleCancel = () => {
    // Exit fullscreen before calling onCancel
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orientation = screen.orientation as any;
      if (orientation && typeof orientation.unlock === "function") {
        orientation.unlock();
      }
    } catch {
      // Orientation unlock not supported
    }
    onCancel();
  };

  const handleSave = () => {
    const newErrors: { nombre?: string; firma?: string } = {};

    if (!nombre.trim()) {
      newErrors.nombre = "Ingresa el nombre del encargado";
    }

    if (padRef.current?.isEmpty()) {
      newErrors.firma = "Se requiere la firma";
    }

    if (newErrors.nombre || newErrors.firma) {
      setErrors(newErrors);
      return;
    }

    const firmaDataUrl = padRef.current!.toDataURL("image/png");

    // Exit fullscreen before calling onSave
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orientation = screen.orientation as any;
      if (orientation && typeof orientation.unlock === "function") {
        orientation.unlock();
      }
    } catch {
      // Orientation unlock not supported
    }

    onSave({
      nombre: nombre.trim(),
      firma: firmaDataUrl,
    });
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 shrink-0">
        <h2 className="text-base font-bold text-gray-900 whitespace-nowrap">
          Firma del Encargado
        </h2>
        <div className="flex-1 min-w-0">
          <Input
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errors.nombre) {
                setErrors((prev) => ({ ...prev, nombre: undefined }));
              }
            }}
            placeholder="Nombre del encargado de sucursal"
            error={errors.nombre}
          />
        </div>
      </div>

      {/* Landscape hint */}
      {lockFailed && !isLandscape && (
        <div className="flex items-center justify-center gap-2 bg-blue-50 px-4 py-2 shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-500 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-sm text-blue-700">
            Gira tu telefono para firmar
          </span>
        </div>
      )}

      {/* Canvas area */}
      <div className="flex-1 relative min-h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
        />
        {/* Signature line hint */}
        <div className="absolute bottom-12 left-8 right-8 border-b border-gray-300 pointer-events-none" />

        {/* Firma validation error */}
        {errors.firma && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
            <p className="text-sm text-red-600">{errors.firma}</p>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 shrink-0">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleClear}>
            Borrar
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
        <Button type="button" variant="primary" onClick={handleSave}>
          Guardar Firma
        </Button>
      </div>
    </div>
  );
}
