// Canvas overlay rendering for GPS/date/time badge
// Renders a compact semi-transparent badge in the bottom-right corner of the canvas

export interface OverlayData {
  lat: number | null;
  lng: number | null;
  approximate: boolean;
  timestamp: Date;
}

/**
 * Draw a compact overlay badge on a canvas context.
 * Two lines: date+time and GPS coordinates.
 * Positioned in the bottom-right corner with a semi-transparent background.
 */
export function drawOverlayBadge(
  ctx: CanvasRenderingContext2D,
  data: OverlayData,
  canvasWidth: number,
  canvasHeight: number
) {
  const fontSize = Math.max(24, Math.round(canvasWidth * 0.022));
  const lineHeight = Math.round(fontSize * 1.3);
  const padding = Math.round(fontSize * 0.85);

  // Format timestamp in es-MX locale
  const dateStr = data.timestamp.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = data.timestamp.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Format GPS coordinates
  let gpsStr = "GPS no disponible";
  if (data.lat !== null && data.lng !== null) {
    gpsStr = `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
    if (data.approximate) gpsStr += " ~";
  }

  const lines = [`${dateStr} ${timeStr}`, gpsStr];

  // Measure text for badge background
  ctx.font = `bold ${fontSize}px monospace`;
  const maxWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const badgeWidth = maxWidth + padding * 2;
  const badgeHeight = lines.length * lineHeight + padding * 2;

  // Position: bottom-right corner with proportional offset
  const offset = Math.round(fontSize * 0.7);
  const x = canvasWidth - badgeWidth - offset;
  const y = canvasHeight - badgeHeight - offset;

  // Semi-transparent black background with rounded corners
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.beginPath();
  ctx.roundRect(x, y, badgeWidth, badgeHeight, Math.round(fontSize * 0.4));
  ctx.fill();

  // White monospace text
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx.fillText(line, x + padding, y + padding + i * lineHeight);
  });
  ctx.restore();
}
