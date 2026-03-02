---
phase: quick-001
plan: 01
subsystem: technician-evidence
tags: [video, mediarecorder, supabase-storage, pwa, mobile]
dependency-graph:
  requires: [migration-04-photos, photo-uploader, camera-capture, evidence-stage-section]
  provides: [video-capture-component, video-upload-pipeline, video-playback-lightbox]
  affects: [admin-report-viewer, pdf-export]
tech-stack:
  added: []
  patterns: [mediarecorder-api, blob-upload-bypass-compression, tipo-media-discriminator]
key-files:
  created:
    - supabase/migration-07-video-support.sql
    - src/components/shared/video-capture.tsx
  modified:
    - src/types/index.ts
    - src/lib/photo-uploader.ts
    - src/components/shared/photo-source-picker.tsx
    - src/components/shared/photo-thumbnail.tsx
    - src/components/shared/evidence-stage-section.tsx
    - src/app/tecnico/reporte/[reporteId]/workflow-step-card.tsx
    - src/app/tecnico/reporte/[reporteId]/workflow-corrective.tsx
    - src/app/tecnico/reporte/[reporteId]/equipment-entry-form.tsx
decisions:
  - id: video-no-overlay
    description: "Videos do not burn GPS/date overlay onto frames (too expensive). Metadata stored in DB row alongside the video, same as gallery-uploaded photos."
  - id: tipo-media-discriminator
    description: "Added tipo_media column (foto|video) to reporte_fotos with DB-level CHECK constraint and default 'foto' for backward compatibility."
  - id: media-neutral-labels
    description: "Changed UI labels to media-neutral Spanish terms: 'Evidencia' instead of 'Evidencia fotografica', 'archivo(s)' instead of 'foto(s)', 'Agregar evidencia' instead of 'Tomar foto'."
  - id: video-mime-preference
    description: "VideoCapture prefers video/mp4 MIME type for MediaRecorder if supported, falls back to video/webm. Max 60 seconds recording with auto-stop."
metrics:
  duration: ~10 min
  completed: 2026-03-02
---

# Quick Task 001: Video Support + Technician Evidence Layout

**One-liner:** Full video recording/playback support in technician evidence flow using MediaRecorder API with 60s limit, GPS metadata, and media-neutral UI labels.

## What Was Done

### Task 1: Database migration + upload pipeline + types
- Created `supabase/migration-07-video-support.sql` adding video MIME types (`video/mp4`, `video/quicktime`, `video/webm`) to the `reportes` storage bucket, increasing file size limit to 50MB, and adding `tipo_media` column to `reporte_fotos` table.
- Added `TipoMedia` type and `tipo_media` field to `ReporteFoto` interface in `src/types/index.ts`.
- Updated `compressAndUpload` in `src/lib/photo-uploader.ts` to detect video blobs via `blob.type.startsWith('video/')`, skip image compression for videos, generate correct file extensions, and store `tipo_media` in the DB insert.

### Task 2: Video recording component + source picker + workflow wiring
- Created `src/components/shared/video-capture.tsx` -- full-screen video recording component using MediaRecorder API with rear camera, GPS acquisition, 60-second max duration with auto-stop, elapsed time counter, warning toast at 50s, and upload progress bar.
- Updated `PhotoSourcePicker` to show three options: Camera (photo with GPS overlay), Video (record video with GPS), Gallery (pick photo or video).
- Wired `VideoCapture` into all three consumer components: `workflow-step-card.tsx`, `workflow-corrective.tsx`, and `equipment-entry-form.tsx`.
- Updated all file inputs from `accept="image/*"` to `accept="image/*,video/*"`.

### Task 3: Video-aware thumbnails, lightbox playback, evidence labels
- Updated `PhotoThumbnail` to detect videos via `tipo_media` or URL extension fallback. Video thumbnails render a `<video>` element with `preload="metadata"` for first-frame poster, with a centered play icon overlay.
- Lightbox now renders `<video controls autoPlay playsInline>` for videos with native browser playback controls (play, pause, seek, fullscreen).
- Delete flow uses context-aware text: "Eliminar este video?" vs "Eliminar esta foto?". Delete button simplified to "Eliminar".
- Updated `EvidenceStageSection` labels: "Evidencia" (was "Evidencia fotografica"), "Agregar evidencia" (was "Tomar foto"), count shows "archivo(s)" (media-neutral).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added tipo_media to all inline ReporteFoto constructions**
- **Found during:** Task 1 verification
- **Issue:** Adding `tipo_media` to the `ReporteFoto` interface caused TypeScript errors in 3 files (workflow-step-card, workflow-corrective, equipment-entry-form) where `ReporteFoto` objects are constructed inline without the new field.
- **Fix:** Added `tipo_media: 'foto' as const` (for camera captures) and `tipo_media: isVideo ? 'video' as const : 'foto' as const` (for gallery uploads) to all inline constructions.
- **Files modified:** workflow-step-card.tsx, workflow-corrective.tsx, equipment-entry-form.tsx

**2. [Rule 3 - Blocking] Updated equipment-entry-form.tsx for new PhotoSourcePicker prop**
- **Found during:** Task 2
- **Issue:** `equipment-entry-form.tsx` also uses `PhotoSourcePicker` but was not listed in the plan's Task 2 files. Adding `onSelectVideoCamera` as a required prop caused a type error.
- **Fix:** Added `VideoCapture` import, `showVideoCapture` state, `handleSelectVideoCamera` handler, `handleVideoCapture` callback, and wired everything into the template. Also updated file input accept attribute.
- **Files modified:** equipment-entry-form.tsx

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 8c39acf | feat(quick-001): add video support migration, types, and upload pipeline |
| 2 | 96daf97 | feat(quick-001): add video recording component and wire up source picker |
| 3 | 8bfce2e | feat(quick-001): video-aware thumbnails, lightbox playback, and evidence labels |

## Next Steps / Notes

- **Admin side:** The admin report detail (`report-detail.tsx`) and PDF generator (`pdf-utils.ts`) use their own local interfaces (not the shared `ReporteFoto`). They will need updates to handle video display in admin report view and PDF export (videos cannot be embedded in PDF -- consider showing a thumbnail with a link, or a QR code).
- **Migration must be run:** User must execute `supabase/migration-07-video-support.sql` in Supabase SQL Editor after `migration-04-photos.sql`.
- **Storage bucket:** The 50MB file size limit is sufficient for 60-second mobile recordings. If longer recordings are needed in the future, increase both the limit and the MAX_RECORDING_SECONDS constant.
