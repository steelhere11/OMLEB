---
phase: quick-001
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migration-07-video-support.sql
  - src/types/index.ts
  - src/lib/photo-uploader.ts
  - src/components/shared/camera-capture.tsx
  - src/components/shared/video-capture.tsx
  - src/components/shared/photo-source-picker.tsx
  - src/components/shared/photo-thumbnail.tsx
  - src/components/shared/photo-gallery-row.tsx
  - src/components/shared/evidence-stage-section.tsx
  - src/app/tecnico/reporte/[reporteId]/workflow-step-card.tsx
  - src/app/tecnico/reporte/[reporteId]/workflow-corrective.tsx
autonomous: true

must_haves:
  truths:
    - "Technician can record a video from the in-app camera with the same stage label (antes/durante/despues)"
    - "Technician can select a video from their phone gallery"
    - "Videos display inline with a play button overlay and the same caption/legend layout as photos (etiqueta badge, timestamp, GPS)"
    - "Videos can be deleted the same way photos can (lightbox with delete button)"
    - "Existing photo functionality is not broken"
  artifacts:
    - path: "supabase/migration-07-video-support.sql"
      provides: "Storage bucket update for video MIME types and reporte_fotos.tipo_media column"
    - path: "src/components/shared/video-capture.tsx"
      provides: "Full-screen video recording component using MediaRecorder API"
    - path: "src/components/shared/photo-thumbnail.tsx"
      provides: "Updated thumbnail that renders video poster or photo, with play icon overlay for videos"
    - path: "src/lib/photo-uploader.ts"
      provides: "Updated upload pipeline that handles video files without image compression"
  key_links:
    - from: "src/components/shared/photo-source-picker.tsx"
      to: "video-capture.tsx or file input with video/*"
      via: "onSelectVideoCamera and accept attribute"
      pattern: "onSelectVideoCamera|video/\\*"
    - from: "src/lib/photo-uploader.ts"
      to: "supabase storage"
      via: "direct upload bypassing browser-image-compression for video"
      pattern: "video|isVideo"
    - from: "src/components/shared/photo-thumbnail.tsx"
      to: "video element"
      via: "conditional rendering based on tipo_media or URL extension"
      pattern: "video|tipo_media"
---

<objective>
Add video capture and gallery upload support to the technician evidence flow, matching the existing photo caption/legend layout (etiqueta badge, stage colors, lightbox).

Purpose: Technicians need to document HVAC work with video evidence (e.g., showing equipment operation, airflow, sounds) alongside photos. Videos should feel like a natural extension of the existing photo evidence system.

Output: Technicians can record video or pick from gallery in the same evidence stage sections. Videos display as thumbnails with play overlay and same caption layout. Videos play in the lightbox on tap.
</objective>

<execution_context>
@C:\Users\Leo\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Leo\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md

Key files to understand the current system:
@src/components/shared/camera-capture.tsx — Current photo capture (canvas + overlay)
@src/components/shared/photo-source-picker.tsx — Bottom sheet: Camera vs Gallery
@src/components/shared/photo-thumbnail.tsx — Thumbnail + lightbox display
@src/components/shared/photo-gallery-row.tsx — Horizontal scroll row of thumbnails
@src/components/shared/evidence-stage-section.tsx — Stage-grouped evidence UI (antes/durante/despues)
@src/lib/photo-uploader.ts — Compress + upload + DB insert pipeline
@src/lib/photo-stamper.ts — Canvas overlay for GPS/date/time
@src/types/index.ts — ReporteFoto type
@src/app/tecnico/reporte/[reporteId]/workflow-step-card.tsx — Preventive workflow (uses all photo components)
@src/app/tecnico/reporte/[reporteId]/workflow-corrective.tsx — Corrective workflow (uses all photo components)
@supabase/migration-04-photos.sql — Storage bucket definition (image-only MIME types)
@supabase/schema.sql — reporte_fotos table (lines 218-227)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Database migration + upload pipeline + types for video support</name>
  <files>
    supabase/migration-07-video-support.sql
    src/types/index.ts
    src/lib/photo-uploader.ts
  </files>
  <action>
  **1. Create `supabase/migration-07-video-support.sql`:**

  Add video MIME types to the `reportes` storage bucket:
  ```sql
  UPDATE storage.buckets
  SET allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm'
  ],
  file_size_limit = 52428800  -- 50MB for videos
  WHERE id = 'reportes';
  ```

  Add `tipo_media` column to `reporte_fotos`:
  ```sql
  ALTER TABLE public.reporte_fotos
    ADD COLUMN IF NOT EXISTS tipo_media text NOT NULL DEFAULT 'foto'
    CHECK (tipo_media IN ('foto', 'video'));

  COMMENT ON COLUMN public.reporte_fotos.tipo_media IS 'Media type: foto or video';
  ```

  **2. Update `src/types/index.ts`:**

  Add `tipo_media` to the `ReporteFoto` interface:
  ```typescript
  export type TipoMedia = 'foto' | 'video';
  ```
  Add to `ReporteFoto`:
  ```typescript
  tipo_media: TipoMedia;
  ```

  **3. Update `src/lib/photo-uploader.ts`:**

  Rename nothing — keep the file name as-is (too many imports to change). But update the logic:

  - Add a `tipo_media` field to `PhotoMetadata` interface (default `'foto'`).
  - In `compressAndUpload`, detect if the blob is a video by checking `blob.type.startsWith('video/')`.
  - If video: skip the `browser-image-compression` step entirely. Generate a filename with the correct extension (`.mp4` for `video/mp4`, `.mov` for `video/quicktime`, `.webm` for `video/webm`). Upload the raw blob directly to Supabase Storage with the correct `contentType`.
  - If image: keep existing compression flow unchanged.
  - In the DB insert, include `tipo_media: isVideo ? 'video' : 'foto'`.
  - Update the progress callbacks to still work for video (skip compression step, so progress goes 10% -> 50% upload -> 80% DB -> 100%).
  </action>
  <verify>
  - `supabase/migration-07-video-support.sql` exists and has valid SQL
  - `npm run build` passes (type-check the tipo_media additions)
  - Grep for `tipo_media` in types/index.ts and photo-uploader.ts confirms the field is present
  </verify>
  <done>
  - Migration file ready to run in Supabase SQL Editor
  - ReporteFoto type includes tipo_media field
  - Upload pipeline handles both image (compressed) and video (raw) uploads, storing tipo_media in the DB row
  </done>
</task>

<task type="auto">
  <name>Task 2: Video recording component + updated source picker with video option</name>
  <files>
    src/components/shared/video-capture.tsx
    src/components/shared/photo-source-picker.tsx
    src/app/tecnico/reporte/[reporteId]/workflow-step-card.tsx
    src/app/tecnico/reporte/[reporteId]/workflow-corrective.tsx
  </files>
  <action>
  **1. Create `src/components/shared/video-capture.tsx`:**

  Build a full-screen video recording component modeled after `camera-capture.tsx` but for video. Key differences:
  - Uses `MediaRecorder` API instead of canvas snapshot.
  - Shows a live camera preview via `<video>` element (same as camera-capture uses internally).
  - GPS acquisition works identically to camera-capture (fire-and-forget, show status pill).
  - Recording UI: Red record button (pulsing when recording). Show elapsed time counter during recording. Stop button to finish.
  - Max recording duration: 60 seconds (auto-stop with warning toast at 50s). Show the countdown.
  - On stop: create a Blob from recorded chunks. Call `compressAndUpload` (which now handles video blobs — skips compression). Pass GPS, label, fecha metadata.
  - Show upload progress bar (same style as camera-capture).
  - Props should match `CameraCaptureProps` exactly: `label`, `reporteId`, `equipoId`, `reportePasoId`, `onCapture`, `onClose`.
  - Prefer `video/mp4` MIME type for MediaRecorder if supported, fall back to `video/webm`. Check `MediaRecorder.isTypeSupported('video/mp4')`.
  - Use rear camera (`facingMode: { ideal: "environment" }`).
  - All UI text in Spanish: "Grabando...", "Toca para grabar", "Subiendo video...", etc.
  - Do NOT burn overlay onto video frames (too expensive). The metadata (GPS, date) is stored in the DB row alongside the video, same as gallery-uploaded photos.

  **2. Update `src/components/shared/photo-source-picker.tsx`:**

  Add a third option between Camera and Gallery: "Grabar Video". Props changes:
  - Add `onSelectVideoCamera: () => void` to `PhotoSourcePickerProps`.
  - Add a third button with a video camera icon (use a camcorder SVG icon), purple/indigo background (`bg-indigo-500`).
  - Label: "Video" with subtitle "Grabar video con GPS y fecha".
  - Update the header from "Foto: {label}" to "Evidencia: {label}" since it now covers both.
  - Update the Gallery button subtitle to "Seleccionar foto o video" and change the hidden file input `accept` to `"image/*,video/*"` (this is done in the parent components, but update the subtitle text here).

  **3. Update `src/app/tecnico/reporte/[reporteId]/workflow-step-card.tsx`:**

  Wire up the new video capture:
  - Import `VideoCapture` from `@/components/shared/video-capture`.
  - Add `showVideoCapture` state (boolean, default false).
  - Add `handleSelectVideoCamera` handler: sets `showSourcePicker = false`, `showVideoCapture = true`.
  - Pass `onSelectVideoCamera={handleSelectVideoCamera}` to `PhotoSourcePicker`.
  - Render `<VideoCapture>` when `showVideoCapture && activeLabel` is true, with same props pattern as `<CameraCapture>`.
  - The `onCapture` callback is the same as `handleCameraCapture` (it produces `{ url, fotoId }` — the tipo_media is stored server-side).
  - Update the file input `accept` attribute from `"image/*"` to `"image/*,video/*"`.
  - In `handleGalleryFiles`, detect video files by checking `file.type.startsWith('video/')`. The upload pipeline already handles this.
  - Update the photo count badge in the header to say "archivo(s)" instead of "foto(s)" when there are mixed media, or keep "foto(s)" if all photos and "video(s)" if all videos. Simplest approach: just use "archivo(s)" universally since the Spanish word is neutral.

  **4. Update `src/app/tecnico/reporte/[reporteId]/workflow-corrective.tsx`:**

  Apply the exact same wiring changes as workflow-step-card.tsx:
  - Import `VideoCapture`.
  - Add `showVideoCapture` state.
  - Add `handleSelectVideoCamera` handler.
  - Pass `onSelectVideoCamera` to `PhotoSourcePicker`.
  - Render `<VideoCapture>` conditionally.
  - Update file input `accept` to `"image/*,video/*"`.
  </action>
  <verify>
  - `npm run build` passes with no type errors
  - `video-capture.tsx` exists and exports `VideoCapture`
  - `photo-source-picker.tsx` has three options (camera, video, gallery)
  - Both workflow components import and wire VideoCapture
  - File inputs accept video/* alongside image/*
  </verify>
  <done>
  - Video recording component exists with MediaRecorder, GPS, upload progress, 60s max
  - Source picker shows Camera / Video / Gallery options
  - Both preventive and corrective workflows wire up video capture and gallery video selection
  </done>
</task>

<task type="auto">
  <name>Task 3: Video-aware thumbnails, lightbox playback, and evidence display</name>
  <files>
    src/components/shared/photo-thumbnail.tsx
    src/components/shared/photo-gallery-row.tsx
    src/components/shared/evidence-stage-section.tsx
  </files>
  <action>
  **1. Update `src/components/shared/photo-thumbnail.tsx`:**

  Make the thumbnail and lightbox handle both photos and videos:

  - Detect video: check `foto.tipo_media === 'video'` (primary) OR fall back to URL extension check (`.mp4`, `.mov`, `.webm`) for backward compatibility.
  - Create a helper: `const isVideo = foto.tipo_media === 'video' || /\.(mp4|mov|webm)$/i.test(foto.url);`

  **Thumbnail (the 16x16 grid item):**
  - For photos: keep existing `<Image>` rendering unchanged.
  - For videos: render a `<video>` element with `preload="metadata"` to show the first frame as poster. Add `muted`, `playsInline` attributes. Style with same `object-cover`, `h-16 w-16`, `rounded-lg` classes.
  - Overlay a small play icon (white triangle in a semi-transparent circle) centered on video thumbnails so the user knows it's a video, not a photo.
  - Keep the etiqueta badge in the bottom-left corner for both.

  **Lightbox (full-screen overlay):**
  - For photos: keep existing `<Image>` with `object-contain` unchanged.
  - For videos: render a `<video>` element with `controls`, `autoPlay`, `playsInline`, `className="max-h-full max-w-full object-contain"`. The native video controls handle play/pause/seek/fullscreen. Add `preload="auto"`.
  - Keep the etiqueta badge in top-left, close button in top-right, delete button at bottom — all unchanged.
  - Update the delete confirmation text: "Eliminar este archivo?" instead of "Eliminar esta foto?" (or detect: if video say "video", if photo say "foto").
  - Update the delete button label: "Eliminar foto" -> "Eliminar" (simpler, works for both).

  **2. Update `src/components/shared/evidence-stage-section.tsx`:**

  Minor text updates for mixed media:
  - Change the section header from "Evidencia fotografica" to "Evidencia" (shorter, covers both).
  - Update the count display: instead of `{photoCount} foto{photoCount !== 1 ? "s" : ""}`, calculate separate photo/video counts from the `stagePhotos` array using `tipo_media` field. Display:
    - If only photos: "{n} foto(s)"
    - If only videos: "{n} video(s)"
    - If mixed: "{n} foto(s), {m} video(s)"
    - Or simplest: just "{photoCount} archivo{photoCount !== 1 ? 's' : ''}" (archivo = file, neutral term in Spanish)
  - Use the simplest approach: just show the total count with "archivo(s)" since it's neutral and clear.
  - The "Tomar foto" button text stays as-is since the source picker now shows all three options (camera, video, gallery). However, update the button label to "Agregar evidencia" to be media-neutral. Keep the camera icon.

  **3. `photo-gallery-row.tsx`:** No changes needed — it just maps over photos and renders `PhotoThumbnail` for each, which now handles videos.
  </action>
  <verify>
  - `npm run build` passes
  - PhotoThumbnail handles `tipo_media === 'video'` with play icon overlay on thumbnail and `<video controls>` in lightbox
  - EvidenceStageSection shows media-neutral labels
  - No references to "foto" remain in user-facing strings where they should be neutral (thumbnail delete, section header)
  </verify>
  <done>
  - Video thumbnails show first frame with play icon overlay
  - Lightbox plays videos with native controls (play, pause, seek, fullscreen)
  - Evidence section labels are media-neutral ("Evidencia", "archivo(s)", "Agregar evidencia")
  - Delete flow works for both photos and videos
  - Existing photo rendering is completely unchanged (backward compatible)
  </done>
</task>

</tasks>

<verification>
After all 3 tasks:

1. **Build check**: `npm run build` passes with zero errors
2. **Type check**: `npx tsc --noEmit` passes — tipo_media is correctly threaded through all components
3. **Migration ready**: `supabase/migration-07-video-support.sql` exists and is syntactically valid SQL
4. **Component exports**: VideoCapture component exports correctly, PhotoSourcePicker accepts onSelectVideoCamera prop
5. **File input accepts**: Both workflow components have `accept="image/*,video/*"` on file inputs
6. **Backward compatibility**: Existing photos (without tipo_media column) still render correctly via fallback default
</verification>

<success_criteria>
- Technician can tap "Agregar evidencia" -> sees Camera / Video / Gallery options
- Selecting "Video" opens full-screen recording with GPS status, record button, timer, and 60s limit
- Selecting "Galeria" allows picking video files alongside photos
- Recorded/selected videos upload to Supabase Storage with tipo_media='video' in DB
- Video thumbnails show first frame with play icon overlay in the evidence row
- Tapping a video thumbnail opens lightbox with native video playback controls
- All existing photo functionality works identically to before
- All user-facing text is in Spanish
</success_criteria>

<output>
After completion, create `.planning/quick/001-video-support-technician-photo-layout/001-SUMMARY.md`
</output>
