"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ───────────────────────────────────────────────────────────────

type DrawMode = "freehand" | "text" | "arrow";

interface Point {
  x: number;
  y: number;
}

interface FreehandAction {
  type: "freehand";
  points: Point[];
  color: string;
  width: number;
}

interface TextAction {
  type: "text";
  text: string;
  position: Point;
  color: string;
  fontSize: number;
}

interface ArrowAction {
  type: "arrow";
  start: Point;
  end: Point;
  color: string;
  width: number;
}

type DrawAction = FreehandAction | TextAction | ArrowAction;

const COLOR_PRESETS = [
  { value: "#FF0000", label: "Rojo" },
  { value: "#0066FF", label: "Azul" },
  { value: "#FFFFFF", label: "Blanco" },
  { value: "#FFD600", label: "Amarillo" },
];

// ── Props ───────────────────────────────────────────────────────────────

interface PhotoAnnotatorProps {
  imageUrl: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

// ── Component ───────────────────────────────────────────────────────────

export function PhotoAnnotator({
  imageUrl,
  onSave,
  onCancel,
}: PhotoAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [mode, setMode] = useState<DrawMode>("freehand");
  const [color, setColor] = useState("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [arrowStart, setArrowStart] = useState<Point | null>(null);
  const [arrowPreview, setArrowPreview] = useState<Point | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [textValue, setTextValue] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Scale factors for translating pointer coords to canvas coords
  const scaleRef = useRef({ x: 1, y: 1, offsetX: 0, offsetY: 0 });

  // ── Lock body scroll and prevent pinch-zoom while annotator is open ─

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Prevent pinch zoom and pull-to-refresh on the canvas area
    const preventGestures = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", preventGestures, { passive: false });

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("touchmove", preventGestures);
    };
  }, []);

  // ── Load image ──────────────────────────────────────────────────────

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      // If crossOrigin fails, try without it (won't be able to export though)
      const img2 = new window.Image();
      img2.onload = () => {
        imageRef.current = img2;
        setImageLoaded(true);
      };
      img2.src = imageUrl;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // ── Render canvas ───────────────────────────────────────────────────

  const renderCanvas = useCallback(
    (
      extraFreehand?: Point[],
      extraArrowPreview?: { start: Point; end: Point }
    ) => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const container = canvas.parentElement;
      if (!container) return;

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      // Fit image within container
      const imgAspect = img.width / img.height;
      const containerAspect = cw / ch;

      let drawW: number, drawH: number, offsetX: number, offsetY: number;

      if (imgAspect > containerAspect) {
        drawW = cw;
        drawH = cw / imgAspect;
        offsetX = 0;
        offsetY = (ch - drawH) / 2;
      } else {
        drawH = ch;
        drawW = ch * imgAspect;
        offsetX = (cw - drawW) / 2;
        offsetY = 0;
      }

      // Set canvas to container pixel size
      const dpr = window.devicePixelRatio || 1;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      ctx.scale(dpr, dpr);

      // Store scale for pointer translation
      scaleRef.current = {
        x: img.width / drawW,
        y: img.height / drawH,
        offsetX,
        offsetY,
      };

      // Clear
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, cw, ch);

      // Draw image
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // Helper: image coords to display coords
      const toDisplay = (p: Point) => ({
        x: p.x / scaleRef.current.x + offsetX,
        y: p.y / scaleRef.current.y + offsetY,
      });

      // Draw committed actions
      for (const action of actions) {
        drawActionOnCtx(ctx, action, toDisplay);
      }

      // Draw current freehand stroke
      if (extraFreehand && extraFreehand.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const p0 = toDisplay(extraFreehand[0]);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < extraFreehand.length; i++) {
          const p = toDisplay(extraFreehand[i]);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Draw arrow preview
      if (extraArrowPreview) {
        drawArrow(
          ctx,
          toDisplay(extraArrowPreview.start),
          toDisplay(extraArrowPreview.end),
          color,
          strokeWidth
        );
      }
    },
    [actions, color, strokeWidth]
  );

  // ── Resize handler ──────────────────────────────────────────────────

  useEffect(() => {
    if (!imageLoaded) return;
    renderCanvas();

    const handleResize = () => renderCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageLoaded, renderCanvas]);

  // ── Pointer helpers ─────────────────────────────────────────────────

  const getImageCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { x: sx, y: sy, offsetX, offsetY } = scaleRef.current;

    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    return {
      x: (displayX - offsetX) * sx,
      y: (displayY - offsetY) * sy,
    };
  };

  // ── Pointer events ──────────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Dismiss color picker when interacting with canvas
    if (showColorPicker) setShowColorPicker(false);
    const p = getImageCoords(e);

    if (mode === "freehand") {
      setIsDrawing(true);
      setCurrentPoints([p]);
      // Capture pointer for smooth drawing
      canvasRef.current?.setPointerCapture(e.pointerId);
    } else if (mode === "arrow") {
      setArrowStart(p);
      setArrowPreview(null);
      setIsDrawing(true);
      canvasRef.current?.setPointerCapture(e.pointerId);
    } else if (mode === "text") {
      setTextPosition(p);
      setTextValue("");
      setShowTextInput(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const p = getImageCoords(e);

    if (mode === "freehand") {
      const newPoints = [...currentPoints, p];
      setCurrentPoints(newPoints);
      renderCanvas(newPoints);
    } else if (mode === "arrow" && arrowStart) {
      setArrowPreview(p);
      renderCanvas(undefined, { start: arrowStart, end: p });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const p = getImageCoords(e);

    if (mode === "freehand" && currentPoints.length > 0) {
      const finalPoints = [...currentPoints, p];
      setActions((prev) => [
        ...prev,
        {
          type: "freehand",
          points: finalPoints,
          color,
          width: strokeWidth,
        },
      ]);
      setCurrentPoints([]);
    } else if (mode === "arrow" && arrowStart) {
      // Only commit if the arrow has a meaningful length
      const dx = p.x - arrowStart.x;
      const dy = p.y - arrowStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        setActions((prev) => [
          ...prev,
          {
            type: "arrow",
            start: arrowStart,
            end: p,
            color,
            width: strokeWidth,
          },
        ]);
      }
      setArrowStart(null);
      setArrowPreview(null);
    }

    setIsDrawing(false);
    renderCanvas();
  };

  // ── Text submit ─────────────────────────────────────────────────────

  const handleTextSubmit = () => {
    if (textValue.trim() && textPosition) {
      setActions((prev) => [
        ...prev,
        {
          type: "text",
          text: textValue.trim(),
          position: textPosition,
          color,
          fontSize: strokeWidth === 2 ? 16 : 28,
        },
      ]);
    }
    setShowTextInput(false);
    setTextValue("");
    setTextPosition(null);
  };

  // ── Undo ────────────────────────────────────────────────────────────

  const handleUndo = () => {
    setActions((prev) => {
      const next = prev.slice(0, -1);
      return next;
    });
  };

  // Trigger re-render after undo
  useEffect(() => {
    if (imageLoaded) renderCanvas();
  }, [actions, imageLoaded, renderCanvas]);

  // ── Save ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const img = imageRef.current;
    if (!img) return;

    setSaving(true);

    try {
      // Create an offscreen canvas at the image's native resolution
      const offscreen = document.createElement("canvas");
      offscreen.width = img.width;
      offscreen.height = img.height;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Identity transform for offscreen (image coords = display coords)
      const identity = (p: Point) => p;

      // Draw all actions at native resolution
      for (const action of actions) {
        drawActionOnCtx(ctx, action, identity, true);
      }

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) =>
        offscreen.toBlob(resolve, "image/jpeg", 0.92)
      );

      if (blob) {
        onSave(blob);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      style={{ touchAction: "none" }}
    >
      {/* Canvas area */}
      <div className="flex-1 relative min-h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Text input overlay */}
        {showTextInput && textPosition && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTextInput(false);
              }
            }}
          >
            <div className="mx-4 w-full max-w-sm rounded-xl bg-gray-900 p-4 shadow-2xl">
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Texto de anotacion
              </label>
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTextSubmit();
                }}
                placeholder="Escribe aqui..."
                autoFocus
                className="mb-3 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTextInput(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleTextSubmit}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color picker popup */}
      {showColorPicker && (
        <div className="absolute bottom-[68px] left-0 right-0 z-20 flex justify-center">
          <div className="mx-4 flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 shadow-2xl">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setColor(c.value);
                  setShowColorPicker(false);
                }}
                className={`h-9 w-9 rounded-full border-2 transition-transform ${
                  color === c.value
                    ? "scale-110 border-white"
                    : "border-gray-600 hover:border-gray-400"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="shrink-0 border-t border-gray-800 bg-gray-950 px-2 pt-1 pb-2 pb-[env(safe-area-inset-bottom)]">
        {/* Active mode label */}
        <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wider text-gray-500">
          {mode === "freehand" && "Dibujo libre"}
          {mode === "arrow" && "Flecha"}
          {mode === "text" && "Texto -- toca la imagen"}
        </p>
        <div className="flex items-center justify-between gap-1">
          {/* Left: Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-800 active:bg-gray-700"
          >
            Cancelar
          </button>

          {/* Center: Tools */}
          <div className="flex items-center gap-1">
            {/* Freehand */}
            <button
              type="button"
              onClick={() => setMode("freehand")}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                mode === "freehand"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
              title="Dibujo libre"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            {/* Arrow */}
            <button
              type="button"
              onClick={() => setMode("arrow")}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                mode === "arrow"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
              title="Flecha"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

            {/* Text */}
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                mode === "text"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
              title="Texto"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 4v3h5.5v12h3V7H19V4H5z" />
              </svg>
            </button>

            {/* Separator */}
            <div className="mx-1 h-6 w-px bg-gray-700" />

            {/* Color */}
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800"
              title="Color"
            >
              <div
                className="h-5 w-5 rounded-full border-2 border-gray-500"
                style={{ backgroundColor: color }}
              />
            </button>

            {/* Stroke width toggle */}
            <button
              type="button"
              onClick={() =>
                setStrokeWidth((prev) => (prev === 2 ? 5 : 2))
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800"
              title={strokeWidth === 2 ? "Fino" : "Grueso"}
            >
              <div
                className="rounded-full bg-gray-300"
                style={{
                  width: strokeWidth === 2 ? 8 : 16,
                  height: strokeWidth === 2 ? 8 : 16,
                }}
              />
            </button>

            {/* Separator */}
            <div className="mx-1 h-6 w-px bg-gray-700" />

            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={actions.length === 0}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800 disabled:opacity-30"
              title="Deshacer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a4 4 0 010 8H9m-6-8l4-4m-4 4l4 4" />
              </svg>
            </button>
          </div>

          {/* Right: Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || actions.length === 0}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Drawing helpers
// ══════════════════════════════════════════════════════════════════════════

function drawActionOnCtx(
  ctx: CanvasRenderingContext2D,
  action: DrawAction,
  toDisplay: (p: Point) => Point,
  isNative?: boolean
) {
  // When rendering at native resolution, scale stroke widths proportionally
  const scaleFactor = isNative ? 3 : 1;

  switch (action.type) {
    case "freehand": {
      if (action.points.length < 2) break;
      ctx.beginPath();
      ctx.strokeStyle = action.color;
      ctx.lineWidth = action.width * scaleFactor;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const p0 = toDisplay(action.points[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < action.points.length; i++) {
        const p = toDisplay(action.points[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      break;
    }
    case "text": {
      const dp = toDisplay(action.position);
      const fontSize = action.fontSize * scaleFactor;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = action.color;
      // Add text outline/shadow for readability
      ctx.strokeStyle = action.color === "#FFFFFF" ? "#000000" : "#000000";
      ctx.lineWidth = Math.max(1, fontSize / 8);
      ctx.lineJoin = "round";
      ctx.strokeText(action.text, dp.x, dp.y);
      ctx.fillText(action.text, dp.x, dp.y);
      break;
    }
    case "arrow": {
      const s = toDisplay(action.start);
      const e = toDisplay(action.end);
      drawArrow(ctx, s, e, action.color, action.width * scaleFactor);
      break;
    }
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  width: number
) {
  const headLen = Math.max(12, width * 4);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  // Line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLen * Math.cos(angle - Math.PI / 6),
    to.y - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    to.x - headLen * Math.cos(angle + Math.PI / 6),
    to.y - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}
