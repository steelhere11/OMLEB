# Phase 4: Photo Capture & Signatures - Research

**Researched:** 2026-02-27
**Domain:** Mobile camera capture (getUserMedia), canvas image processing, GPS geolocation, Supabase Storage uploads, digital signature capture
**Confidence:** HIGH

## Summary

Phase 4 replaces the external photo-stamping app with an in-app camera that burns GPS/date/time overlays directly onto captured photos, plus adds digital signature capture for report completion. The core technical challenge is the getUserMedia + canvas + GPS overlay pipeline running on budget Android phones inside a PWA.

The standard approach uses `navigator.mediaDevices.getUserMedia()` to open the rear camera, renders the live feed plus overlay text onto a `<canvas>` element via `requestAnimationFrame`, captures the frame with `canvas.toBlob()`, compresses it with `browser-image-compression`, and uploads to a dedicated Supabase Storage bucket. Gallery uploads bypass the overlay but go through the same compression and upload pipeline. Signature capture uses `signature_pad` (the vanilla library, not the React wrapper) to avoid React 19 peer dependency friction.

**Primary recommendation:** Build the camera as a fullscreen modal component that takes over the screen, renders video + overlay to canvas in real-time, captures via `canvas.toBlob()`, compresses to ~800KB JPEG, and uploads directly from the browser client to Supabase Storage with RLS-scoped policies. Use the vanilla `signature_pad` library with a manual React ref wrapper for the signature pad.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `browser-image-compression` | 2.x | Client-side image compression before upload | Web Worker support, non-blocking, `maxSizeMB`/`maxWidthOrHeight` options, 800+ weekly downloads, built for exactly this use case |
| `signature_pad` | 5.x | Smooth canvas-based signature drawing | Vanilla JS, no framework dependency, Bezier curve interpolation, touch-optimized, works on all mobile browsers, no React peer dep issues |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `exifr` | 7.x | EXIF metadata extraction from gallery uploads | Only for gallery photos - extract GPS/date from EXIF if available, fastest EXIF parser (handles HEIC too) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `signature_pad` (vanilla) | `react-signature-canvas` | React wrapper around same library, but v1.1.0-alpha.2 is alpha; v1.0.7 claims React 19 support but adds unnecessary abstraction layer. Vanilla + ref is simpler and avoids peer dep issues |
| `browser-image-compression` | `compressorjs` | compressorjs uses canvas.toBlob directly (lossy), browser-image-compression adds Web Worker offloading which is critical for budget phones |
| `exifr` | `exifreader` | ExifReader is also good but exifr is 30x faster for HEIC files and has smaller bundle for the specific GPS/date extraction use case |
| Canvas overlay approach | ImageCapture API `takePhoto()` | ImageCapture gives higher resolution but has no overlay capability - you still need canvas for the stamp. Also Firefox support is limited |

### Installation
```bash
npm install browser-image-compression signature_pad exifr
```

No `@types/` packages needed - `browser-image-compression` and `exifr` ship their own types. For `signature_pad`, types are included in v5.x.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    shared/
      camera-capture.tsx       # Full-screen camera modal with overlay
      photo-thumbnail.tsx      # Thumbnail display + expand/lightbox
      photo-gallery-row.tsx    # Horizontal scroll row of thumbnails
      signature-pad.tsx        # Landscape signature capture component
  lib/
    photo-stamper.ts           # Canvas overlay rendering (GPS/date/time badge)
    photo-uploader.ts          # Compress + upload to Supabase Storage
    gps.ts                     # Geolocation wrapper with fallback
  app/
    tecnico/
      reporte/[reporteId]/
        workflow-step-card.tsx  # MODIFIED: wire photo buttons to camera
        equipment-entry-form.tsx # MODIFIED: add photo section
        status-section.tsx      # MODIFIED: signature gate before submit
```

### Pattern 1: Camera Capture Modal (fullscreen overlay)
**What:** A React component that opens as a fullscreen modal, streams the rear camera to a `<video>` element, renders a canvas overlay in real-time, and captures frames on tap.
**When to use:** Every time the technician taps a photo label button (ANTES, DURANTE, DESPUES, etc.)
**Example:**
```typescript
// Source: MDN getUserMedia + canvas drawing pattern
// Step 1: Open camera stream
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: { ideal: "environment" }, // rear camera, non-strict
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
});

// Step 2: Render to canvas with overlay in animation loop
function renderFrame() {
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  drawOverlayBadge(ctx, gpsCoords, new Date()); // bottom-right corner
  requestAnimationFrame(renderFrame);
}

// Step 3: Capture frame
function capturePhoto() {
  // Draw one final frame to ensure overlay is current
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  drawOverlayBadge(ctx, gpsCoords, new Date());
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const compressed = await imageCompression(blob, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
    // Upload compressed blob
    await uploadPhoto(compressed, label, reporteId, equipoId, pasoId);
  }, "image/jpeg", 0.85);
}
```

### Pattern 2: GPS with Last-Known Fallback
**What:** Wrapper around `navigator.geolocation.getCurrentPosition` that caches the last successful position and uses it as fallback when GPS is unavailable (indoor, weak signal).
**When to use:** On camera open and periodically during capture session.
**Example:**
```typescript
// Source: MDN Geolocation API + project decision (GPS fallback)
let lastKnownPosition: { lat: number; lng: number; approximate: boolean } | null = null;

async function getGpsPosition(): Promise<typeof lastKnownPosition> {
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,       // 5s timeout - don't block the tech
        maximumAge: 30000,   // Accept 30s old cached position
      });
    });
    lastKnownPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      approximate: false,
    };
    return lastKnownPosition;
  } catch {
    // Return last known if available, marked as approximate
    if (lastKnownPosition) {
      return { ...lastKnownPosition, approximate: true };
    }
    return null; // No GPS at all - overlay will show "GPS no disponible"
  }
}
```

### Pattern 3: Label-First Photo Flow (integration with Phase 3.5)
**What:** Tech taps a label button (ANTES/DURANTE/DESPUES) in the workflow step card, a source picker appears (Camera/Gallery), then the camera or gallery picker opens with the label pre-assigned.
**When to use:** This is the primary photo capture flow, replacing the disabled placeholder buttons from Phase 3.5.
**Example:**
```typescript
// In workflow-step-card.tsx, replace disabled buttons:
<button
  type="button"
  onClick={() => onPhotoCapture({
    etiqueta: ev.etapa, // "antes" | "durante" | "despues"
    reporteId,
    equipoId,
    reportePasoId: savedProgress?.id,
  })}
  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${colors.bg} ${colors.text}`}
>
  <CameraIcon /> {colors.label}
  {photoCount > 0 && <span className="ml-1">({photoCount})</span>}
</button>
```

### Pattern 4: Client-Side Upload to Supabase Storage
**What:** Upload compressed photos directly from the browser to a dedicated `reportes` Storage bucket using the authenticated user's session (anon key + RLS), not the service role key.
**When to use:** After every photo capture or gallery selection.
**Example:**
```typescript
// Source: Supabase Storage docs
import { createClient } from "@/lib/supabase/client";

async function uploadPhoto(
  blob: Blob,
  label: string,
  reporteId: string,
  equipoId: string | null,
  reportePasoId: string | null
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient();
  const fileName = `${crypto.randomUUID()}.jpg`;
  // Path structure: reportes/{reporteId}/{equipoId|general}/{fileName}
  const folder = equipoId ?? "general";
  const filePath = `${reporteId}/${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("reportes")
    .upload(filePath, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: urlData } = supabase.storage
    .from("reportes")
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl };
}
```

### Pattern 5: Signature Capture with Landscape Lock
**What:** Fullscreen modal that attempts landscape orientation lock, renders a signature canvas, captures typed name + drawn signature, converts to data URL for storage.
**When to use:** Only when report status is set to "Completado" -- appears as a dedicated screen before final submit.
**Example:**
```typescript
// Source: signature_pad docs + Screen Orientation API (MDN)
import SignaturePad from "signature_pad";

// In a React component with ref:
const canvasRef = useRef<HTMLCanvasElement>(null);
const padRef = useRef<SignaturePad | null>(null);

useEffect(() => {
  if (!canvasRef.current) return;
  padRef.current = new SignaturePad(canvasRef.current, {
    penColor: "rgb(0, 0, 0)",
    backgroundColor: "rgb(255, 255, 255)",
  });
  // Attempt landscape lock (requires fullscreen on most browsers)
  tryLandscapeLock();
  return () => {
    padRef.current?.off();
    unlockOrientation();
  };
}, []);

function getSignatureData(): string | null {
  if (!padRef.current || padRef.current.isEmpty()) return null;
  return padRef.current.toDataURL("image/png");
}
```

### Anti-Patterns to Avoid
- **Using `<input type="file" capture="environment">`:** Android 14/15 broke this -- getUserMedia is the only reliable path. This was already decided in prior research.
- **Using `{ exact: "environment" }` for facingMode:** If the device only has one camera or Chrome can't find the rear camera, the promise rejects with OverconstrainedError. Always use `{ ideal: "environment" }` which gracefully falls back.
- **Uploading uncompressed photos:** A 12MP phone camera produces 4-8MB JPEG files. With 20+ photos per report, this would be 100MB+ of storage and slow uploads on mobile data. Always compress first.
- **Using service role key for client-side uploads:** The existing codebase uses admin client (service role) for logo uploads, but that pattern runs server-side in Server Actions. Photo uploads happen client-side from the browser -- must use authenticated browser client with RLS policies.
- **Blocking on GPS accuracy:** Budget phones indoors can take 30+ seconds for a GPS fix. Use a 5-second timeout with last-known fallback. Never block the camera on GPS.
- **Rendering overlay with DOM elements over video:** Use canvas-only rendering. DOM overlays cause visual misalignment between what the tech sees and what gets captured. The canvas approach ensures WYSIWYG.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Custom canvas resize + toBlob loop | `browser-image-compression` | Handles Web Worker offloading, quality iteration, EXIF orientation correction, edge cases with different image formats |
| Signature drawing | Custom touch event tracking on canvas | `signature_pad` | Bezier curve interpolation for smooth lines, pressure sensitivity, proper touch event handling across browsers, battle-tested |
| EXIF parsing | Manual ArrayBuffer parsing | `exifr` | EXIF format is complex (TIFF IFDs, maker notes, HEIC containers), edge cases everywhere, GPS coordinate conversion (DMS to decimal) |
| GPS coordinate formatting | String concatenation | Utility function with proper DMS/decimal handling | GPS coordinates come as decimal degrees, overlay needs formatted string like "19.4326, -99.1332" |

**Key insight:** The camera + overlay pipeline looks simple ("just drawImage + fillText") but the devil is in: canvas sizing vs video resolution, device pixel ratio, orientation changes, memory management (revoking object URLs), GPS timeout handling, and compression quality tuning. The libraries handle the hard parts; the custom code is the glue.

## Common Pitfalls

### Pitfall 1: Canvas Resolution vs Display Size
**What goes wrong:** Canvas displays at CSS size but captures at its internal resolution. If you set canvas width/height to match CSS pixels, photos come out blurry on high-DPI phones (2x, 3x).
**Why it happens:** Canvas has two sizes: the element size (CSS) and the drawing buffer size (width/height attributes). They're independent.
**How to avoid:** Set canvas drawing buffer to match video stream resolution, use CSS to scale the display. Never set canvas width/height in CSS; use the attributes and let CSS handle layout with `object-fit`.
**Warning signs:** Photos look blurry or pixelated despite camera being high-resolution.

### Pitfall 2: Memory Leaks from Camera Streams
**What goes wrong:** Camera stream stays active after component unmounts, draining battery and keeping the camera indicator on.
**Why it happens:** `getUserMedia` streams must be explicitly stopped -- they don't stop when the video element is removed from DOM.
**How to avoid:** Always call `stream.getTracks().forEach(track => track.stop())` in the cleanup function. In React, this goes in the `useEffect` cleanup.
**Warning signs:** Camera indicator stays lit after closing the camera modal, phone gets warm.

### Pitfall 3: Orientation Changes During Capture
**What goes wrong:** User rotates phone while camera is open, canvas dimensions don't match video dimensions, overlay appears in wrong position or photo is distorted.
**Why it happens:** Video stream dimensions can change on orientation change, or the canvas needs to be re-sized.
**How to avoid:** Lock the camera modal to portrait mode via CSS (`touch-action`, fixed positioning) or handle orientation changes by re-reading video dimensions and resizing canvas. Simplest approach: force portrait for camera, force landscape for signature.
**Warning signs:** Distorted or stretched photos, overlay text in wrong position.

### Pitfall 4: GPS Permission Denied or Unavailable
**What goes wrong:** App crashes or shows no overlay when GPS is denied or unavailable (indoor, airplane mode).
**Why it happens:** `getCurrentPosition` can reject with PermissionDeniedError, TimeoutError, or PositionUnavailableError.
**How to avoid:** Always wrap in try/catch, use last-known fallback, show "GPS no disponible" or "Ubicacion aproximada" on overlay when no GPS. Never block photo capture on GPS availability.
**Warning signs:** Error in console about "User denied Geolocation", blank overlay.

### Pitfall 5: Supabase Storage Upload Fails Silently
**What goes wrong:** Photo appears captured but never reaches the server. Tech doesn't notice until admin reviews the report.
**Why it happens:** Mobile data can be spotty, upload fails, error isn't surfaced to user.
**How to avoid:** Show upload progress indicator per photo. On failure, show red error state with retry button. Keep the blob in memory or IndexedDB until upload succeeds. Show total upload count vs uploaded count.
**Warning signs:** Photos show "uploading..." indefinitely, reporte_fotos table has no rows.

### Pitfall 6: Screen Orientation Lock Requires Fullscreen
**What goes wrong:** `screen.orientation.lock("landscape")` throws SecurityError or does nothing.
**Why it happens:** The Screen Orientation API requires the document to be in fullscreen mode (via Fullscreen API) on most browsers. Installed PWAs in standalone mode may have more lenient requirements but it's not guaranteed.
**How to avoid:** For the signature pad: enter fullscreen first via `element.requestFullscreen()`, then lock orientation. Provide fallback: if lock fails, simply render the signature pad in a wide aspect ratio container with a "Gira tu telefono" (rotate your phone) prompt.
**Warning signs:** Signature pad appears in portrait, making signing uncomfortable.

### Pitfall 7: browser-image-compression Blob vs File
**What goes wrong:** `browser-image-compression` expects a `File` object but `canvas.toBlob()` returns a `Blob`.
**Why it happens:** The library's TypeScript signature expects `File`, not `Blob`.
**How to avoid:** Convert blob to File: `new File([blob], "photo.jpg", { type: "image/jpeg" })` before passing to the compression function.
**Warning signs:** TypeScript error, or runtime crash when passing Blob directly.

## Code Examples

### Camera Overlay Badge Rendering
```typescript
// src/lib/photo-stamper.ts
// Renders compact corner badge with GPS + date + time

interface OverlayData {
  lat: number | null;
  lng: number | null;
  approximate: boolean;
  timestamp: Date;
}

export function drawOverlayBadge(
  ctx: CanvasRenderingContext2D,
  data: OverlayData,
  canvasWidth: number,
  canvasHeight: number
) {
  const padding = 12;
  const lineHeight = 18;
  const fontSize = 14;

  // Format timestamp
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

  // Format GPS
  let gpsStr = "GPS no disponible";
  if (data.lat !== null && data.lng !== null) {
    gpsStr = `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
    if (data.approximate) gpsStr += " ~";
  }

  const lines = [
    `${dateStr} ${timeStr}`,
    gpsStr,
  ];

  // Measure text for badge background
  ctx.font = `bold ${fontSize}px monospace`;
  const maxWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const badgeWidth = maxWidth + padding * 2;
  const badgeHeight = lines.length * lineHeight + padding * 2;

  // Position: bottom-right corner
  const x = canvasWidth - badgeWidth - 10;
  const y = canvasHeight - badgeHeight - 10;

  // Semi-transparent background
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.roundRect(x, y, badgeWidth, badgeHeight, 6);
  ctx.fill();

  // White text
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx.fillText(line, x + padding, y + padding + i * lineHeight);
  });
}
```

### Supabase Storage Bucket SQL (new migration)
```sql
-- supabase/migration-04-photos.sql
-- Storage bucket for report photos
-- Run AFTER schema.sql, rls.sql, and previous migrations

-- Create bucket for report photos (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reportes',
  'reportes',
  true,           -- Public read (photos displayed in reports and PDFs)
  5242880,        -- 5MB limit per file (compressed photos ~800KB)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload photos (scoped by RLS on reporte_fotos table)
CREATE POLICY "authenticated_upload_photos"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reportes');

-- RLS: Anyone authenticated can view photos
CREATE POLICY "authenticated_view_photos"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'reportes');

-- RLS: Authenticated users can delete their photos
CREATE POLICY "authenticated_delete_photos"
ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'reportes');
```

### Signature Pad Component Pattern
```typescript
// src/components/shared/signature-pad.tsx
"use client";
import { useRef, useEffect, useState } from "react";
import SignaturePadLib from "signature_pad";

interface SignaturePadProps {
  onSave: (data: { nombre: string; firma: string }) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nombre, setNombre] = useState("");
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Try fullscreen + landscape lock
    const tryLandscape = async () => {
      try {
        await containerRef.current?.requestFullscreen();
        await screen.orientation.lock("landscape");
        setIsLandscape(true);
      } catch {
        // Fallback: show "rotate phone" hint if portrait
        setIsLandscape(window.innerWidth > window.innerHeight);
      }
    };
    tryLandscape();

    // Init signature pad
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")!.scale(ratio, ratio);

    padRef.current = new SignaturePadLib(canvas, {
      penColor: "rgb(0, 0, 0)",
      backgroundColor: "rgb(255, 255, 255)",
    });

    return () => {
      padRef.current?.off();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      screen.orientation.unlock?.();
    };
  }, []);

  const handleClear = () => padRef.current?.clear();

  const handleSave = () => {
    if (!padRef.current || padRef.current.isEmpty() || !nombre.trim()) return;
    onSave({
      nombre: nombre.trim(),
      firma: padRef.current.toDataURL("image/png"),
    });
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header with name input */}
      {/* Canvas area */}
      {/* Footer with Borrar / Guardar buttons */}
    </div>
  );
}
```

### Photo Upload with Compression
```typescript
// src/lib/photo-uploader.ts
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

interface UploadResult {
  success: true;
  url: string;
  fotoId: string;
} | {
  success: false;
  error: string;
}

export async function compressAndUpload(
  imageBlob: Blob,
  metadata: {
    reporteId: string;
    equipoId: string | null;
    reportePasoId: string | null;
    etiqueta: string;
    gps: string | null;
    fecha: Date;
  },
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const supabase = createClient();

  // 1. Compress
  onProgress?.(10);
  const file = new File([imageBlob], "photo.jpg", { type: "image/jpeg" });
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    onProgress: (pct) => onProgress?.(10 + pct * 0.4), // 10-50%
  });

  // 2. Upload to Storage
  onProgress?.(50);
  const fileName = `${crypto.randomUUID()}.jpg`;
  const folder = metadata.equipoId ?? "general";
  const filePath = `${metadata.reporteId}/${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("reportes")
    .upload(filePath, compressed, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // 3. Get public URL
  const { data: urlData } = supabase.storage
    .from("reportes")
    .getPublicUrl(filePath);

  onProgress?.(80);

  // 4. Insert DB record
  const { data: fotoRow, error: dbError } = await supabase
    .from("reporte_fotos")
    .insert({
      reporte_id: metadata.reporteId,
      equipo_id: metadata.equipoId,
      reporte_paso_id: metadata.reportePasoId,
      url: urlData.publicUrl,
      etiqueta: metadata.etiqueta,
      metadata_gps: metadata.gps,
      metadata_fecha: metadata.fecha.toISOString(),
    })
    .select("id")
    .single();

  if (dbError) {
    // Try to clean up uploaded file
    await supabase.storage.from("reportes").remove([filePath]);
    return { success: false, error: dbError.message };
  }

  onProgress?.(100);
  return { success: true, url: urlData.publicUrl, fotoId: fotoRow.id };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `navigator.getUserMedia()` | `navigator.mediaDevices.getUserMedia()` | Chrome 47+ (2015) | Old API is deprecated, new is promise-based |
| `<input type="file" capture>` | `getUserMedia` for camera | Android 14 (2023) broke file input | File input is unreliable on modern Android; getUserMedia is the only reliable path |
| `canvas.toDataURL()` | `canvas.toBlob()` | All modern browsers | toBlob is async, returns Blob (not base64 string), more memory-efficient, directly uploadable |
| No compression | `browser-image-compression` with Web Worker | 2020+ | Web Worker prevents UI thread blocking on budget phones |
| `react-signature-canvas` | Vanilla `signature_pad` + React ref | Ongoing | Avoids React version peer dependency churn; vanilla lib is the actual engine anyway |

**Deprecated/outdated:**
- `navigator.getUserMedia()`: Removed from modern browsers, use `navigator.mediaDevices.getUserMedia()`
- `exif-js` (npm): Dead package, not maintained. Use `exifr` instead.
- `canvas.toDataURL()` for uploads: Returns base64 string (33% larger than binary), wastes memory. Use `canvas.toBlob()`.

## Open Questions

1. **HEIC gallery upload handling**
   - What we know: iPhone photos are often HEIC format. Android Chrome generally converts to JPEG when selecting from gallery via `<input type="file" accept="image/*">`.
   - What's unclear: Whether all budget Android phones handle HEIC, or if we need conversion.
   - Recommendation: Accept `image/*` in the file input. `browser-image-compression` handles HEIC if the browser can decode it (Chrome can). If not decodable, show error message. Don't add a HEIC converter library in V1.

2. **Exact compression quality sweet spot**
   - What we know: 0.8 maxSizeMB with 1920px max dimension should produce ~500-800KB files from typical phone cameras. Quality 0.85 JPEG is visually indistinguishable from original for documentation photos.
   - What's unclear: How budget Android phones perform with Web Worker compression (memory constraints?).
   - Recommendation: Start with `maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true`. Test on budget device. If Web Worker fails, fallback to main thread (`useWebWorker: false`).

3. **Signature data storage format**
   - What we know: Current schema has `firma_encargado` as `text` column in `reportes` table. `signature_pad.toDataURL("image/png")` produces a base64 data URL.
   - What's unclear: Whether to store as data URL in the DB column or upload as a file to Storage and store the URL.
   - Recommendation: Store as base64 data URL directly in `firma_encargado` column. Signatures are tiny (~20-50KB as PNG data URLs). This avoids an extra Storage upload and simplifies the PDF generation in Phase 5 (embed directly). Add a `nombre_encargado` column to `reportes` table for the typed name.

4. **Concurrent upload behavior**
   - What we know: Tech may take 5-10 photos in quick succession. Each triggers compress + upload.
   - What's unclear: Whether parallel uploads will overwhelm budget phone memory.
   - Recommendation: Queue uploads sequentially (one at a time) rather than parallel. Show pending/uploading/done states per photo. This is safer on budget hardware and prevents multiple failed uploads on weak connections.

## Sources

### Primary (HIGH confidence)
- [MDN: getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) - Camera constraints, facingMode, promise API
- [MDN: Taking still photos](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos) - Canvas capture pattern
- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) - Position options, error handling
- [MDN: Screen Orientation lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock) - Fullscreen requirement, browser support
- [MDN: canvas.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) - Quality parameter, MIME type
- [Supabase: Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads) - Upload API, content type, upsert
- [Supabase: Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - RLS policies for storage.objects
- [signature_pad GitHub](https://github.com/szimek/signature_pad) - API, touch support, mobile considerations
- [react-signature-canvas GitHub](https://github.com/agilgur5/react-signature-canvas) - v1.0.7 React 19 support, API methods

### Secondary (MEDIUM confidence)
- [browser-image-compression GitHub](https://github.com/Donaldcwl/browser-image-compression) - Options API, Web Worker support, maxSizeMB
- [exifr GitHub](https://github.com/MikeKovarik/exifr) - Performance benchmarks, HEIC support
- [Addpipe: getUserMedia constraints](https://blog.addpipe.com/getusermedia-video-constraints/) - Resolution constraints, ideal vs exact
- [WebRTC samples: getUserMedia to canvas](https://webrtc.github.io/samples/src/content/getusermedia/canvas/) - Canvas rendering pattern
- Existing codebase: `supabase/storage.sql` - Pattern for bucket creation and RLS policies
- Existing codebase: `src/app/actions/clientes.ts` - Upload pattern using admin client

### Tertiary (LOW confidence)
- [WebSearch] getUserMedia Android 14/15 file input issues - Decision already locked, confirms getUserMedia is correct choice
- [WebSearch] Screen orientation lock in PWAs - Requirements vary by browser and install state

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are well-established, APIs are Web standards documented by MDN
- Architecture: HIGH - Patterns are standard canvas + getUserMedia patterns used widely, verified against existing codebase structure
- Pitfalls: HIGH - Known issues documented in MDN, confirmed by community reports and multiple sources
- Signature pad: MEDIUM - `signature_pad` vanilla is well-tested but landscape lock via Screen Orientation API has browser-specific requirements that need runtime testing
- Compression settings: MEDIUM - Settings are reasonable defaults but optimal values need testing on actual target devices

**Research date:** 2026-02-27
**Valid until:** 2026-04-27 (60 days - stable Web APIs, unlikely to change)
