---
phase: 04-photo-capture-signatures
plan: 01
subsystem: photo-capture
tags: [camera, gps, canvas, supabase-storage, compression, pwa]
depends_on:
  requires: [01-foundation, 03.5-guided-workflows]
  provides: [camera-capture-component, photo-upload-pipeline, gps-utility, storage-bucket-migration]
  affects: [04-02-gallery-wiring, 04-03-signature-capture, 05-pdf-export]
tech_stack:
  added: [browser-image-compression@2.0.2, signature_pad@5.1.3, exifr@7.1.3]
  patterns: [getUserMedia-canvas-overlay, blob-compress-upload, gps-fallback-cache]
key_files:
  created:
    - supabase/migration-04-photos.sql
    - src/lib/gps.ts
    - src/lib/photo-stamper.ts
    - src/lib/photo-uploader.ts
    - src/components/shared/camera-capture.tsx
    - src/components/shared/photo-source-picker.tsx
  modified:
    - package.json
    - package-lock.json
    - src/types/index.ts
    - src/app/globals.css
decisions:
  - "Photo uploads use browser Supabase client (authenticated user session + RLS), not admin/service role key"
  - "Canvas drawing buffer dimensions match video stream resolution; CSS handles display scaling"
  - "GPS has 5-second timeout with 30-second maximumAge cache; never blocks camera"
  - "Auto-accept flow: capture -> compress -> upload -> callback (no preview screen)"
  - "animate-slide-up CSS utility added to globals.css for bottom sheet transitions"
metrics:
  duration: "6 min"
  completed: "2026-02-28"
---

# Phase 04 Plan 01: Photo Capture Infrastructure Summary

**Camera capture with live GPS/date/time overlay, compression pipeline, Supabase Storage upload, and source picker modal.**

## What Was Built

### Task 1: Dependencies, Migration, Types
- Installed `browser-image-compression` (client-side JPEG compression with Web Worker), `signature_pad` (canvas-based signature drawing), and `exifr` (EXIF metadata extraction for gallery photos)
- Created `supabase/migration-04-photos.sql`: Storage bucket `reportes` (public read, 5MB limit, JPEG/PNG/WebP), 3 RLS policies (insert/select/delete for authenticated), and `nombre_encargado` text column on `reportes` table
- Updated `src/types/index.ts`: Added `reporte_paso_id: string | null` to `ReporteFoto`, added `nombre_encargado: string | null` to `Reporte`, confirmed `FotoEtiqueta` already includes 'durante'

### Task 2: Library Code (GPS, Stamper, Uploader)
- **`src/lib/gps.ts`**: Wraps `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`, 5s timeout, 30s maximumAge. Caches last-known position at module level. Returns `{ lat, lng, approximate }` or null. Never throws.
- **`src/lib/photo-stamper.ts`**: Draws a semi-transparent black rounded-rect badge in bottom-right corner of canvas. Two lines of white 14px bold monospace text: date+time (es-MX locale, DD/MM/YYYY HH:MM:SS) and GPS coords (6 decimals) or "GPS no disponible". Marks approximate positions with " ~" suffix.
- **`src/lib/photo-uploader.ts`**: Full pipeline: Blob -> File conversion -> `browser-image-compression` (maxSizeMB 0.8, 1920px, Web Worker) -> Supabase Storage upload -> public URL -> `reporte_fotos` insert. Progress callback at 10/50/80/100%. On DB insert failure, cleans up uploaded file. Also exports `deletePhoto(fotoId, filePath)`.

### Task 3: Camera Component and Source Picker
- **`CameraCapture`**: Fullscreen fixed overlay (z-50, bg-black). Opens rear camera via getUserMedia with ideal environment facingMode. Renders video + overlay to canvas via requestAnimationFrame loop. Canvas buffer matches video resolution (not CSS size). GPS refreshes every 10s. Capture button draws final frame + overlay, calls toBlob(jpeg, 0.85), compresses, uploads. Shows progress bar during upload, red toast on error. Close button stops all tracks. Label badge in top-right shows current photo label (e.g., "ANTES").
- **`PhotoSourcePicker`**: Bottom sheet modal with Camera and Gallery options. Large touch targets (48px+ icons). Slide-up animation. Backdrop click and Escape key to close. Shows label name at top (e.g., "Foto: ANTES").
- Added `animate-slide-up` keyframes and utility to `globals.css`.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | cd2ba02 | feat(04-01): install photo deps, create storage migration, update types |
| 2 | fa6770e | feat(04-01): create GPS utility, photo stamper, and photo uploader libraries |
| 3 | 30d69f7 | feat(04-01): build fullscreen camera component and photo source picker |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Browser client for uploads** -- Photo uploads use the authenticated browser Supabase client (`@/lib/supabase/client`) with RLS policies, not the admin/service role key. This matches the research recommendation since uploads happen client-side.
2. **Auto-accept capture flow** -- No preview/confirmation screen after capture. Photo is immediately compressed and uploaded, then `onCapture` callback fires. This keeps the flow fast for technicians taking multiple photos in sequence.
3. **Canvas buffer = video resolution** -- Canvas drawing buffer dimensions are set to match `video.videoWidth`/`video.videoHeight` (not CSS size), ensuring full-resolution capture with sharp overlay text.
4. **animate-slide-up utility** -- Added reusable CSS animation to globals.css for bottom sheet modals. Used by PhotoSourcePicker, available for future modals.

## User Setup Required

Before photo capture features work with a real Supabase project:
1. Run `supabase/migration-04-photos.sql` in Supabase SQL Editor (after schema.sql, rls.sql, and migration-workflows.sql)

## Next Phase Readiness

Phase 04 Plan 02 can proceed immediately. It wires the camera and gallery to workflow step cards and the equipment entry form -- the components and libraries from this plan are the building blocks.

Key integration points for Plan 02:
- `CameraCapture` component accepts `label`, `reporteId`, `equipoId`, `reportePasoId` as props
- `PhotoSourcePicker` provides Camera/Gallery choice before opening camera or file input
- `compressAndUpload` handles the full pipeline including DB insert
- `deletePhoto` handles cleanup when tech removes a photo
