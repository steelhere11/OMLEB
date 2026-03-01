// Canvas overlay rendering for GPS/date/time stamp
// Renders bold yellow right-aligned text in the bottom-right corner with dark outline

export interface OverlayData {
  lat: number | null;
  lng: number | null;
  approximate: boolean;
  timestamp: Date;
}

/**
 * Draw a visible date/time + GPS overlay directly on a canvas.
 * Style: bold yellow text, right-aligned, bottom-right corner, dark outline for contrast.
 * Matches the style of GPS-stamping apps (e.g., GPS Map Camera).
 */
export function drawOverlayBadge(
  ctx: CanvasRenderingContext2D,
  data: OverlayData,
  canvasWidth: number,
  canvasHeight: number
) {
  // Scale font to ~3.5% of canvas width (large and readable)
  const fontSize = Math.max(28, Math.round(canvasWidth * 0.035));
  const lineHeight = Math.round(fontSize * 1.25);
  const margin = Math.round(fontSize * 0.6);
  const strokeWidth = Math.max(2, Math.round(fontSize * 0.12));

  // Format date: "26 feb 2026"
  const dateStr = data.timestamp.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Format time: "1:25:12 p.m."
  const timeStr = data.timestamp.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  // Format GPS coordinates
  const lines: string[] = [`${dateStr} ${timeStr}`];

  if (data.lat !== null && data.lng !== null) {
    let gpsStr = `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
    if (data.approximate) gpsStr += " ~";
    lines.push(gpsStr);
  }

  // Configure text style
  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  // Position: bottom-right
  const x = canvasWidth - margin;
  let y = canvasHeight - margin;

  // Draw lines bottom-to-top (last line at the bottom)
  for (let i = lines.length - 1; i >= 0; i--) {
    // Dark outline for contrast against any background
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = "round";
    ctx.strokeText(lines[i], x, y);

    // Yellow fill
    ctx.fillStyle = "#FFD600";
    ctx.fillText(lines[i], x, y);

    y -= lineHeight;
  }

  ctx.restore();
}
