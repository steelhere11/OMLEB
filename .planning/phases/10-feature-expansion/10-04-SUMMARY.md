---
phase: 10
plan: 04
subsystem: media-annotation
tags: [canvas, photo-annotation, pointer-events, mobile, supabase-storage]
depends_on:
  requires: [10-01]
  provides: [photo-annotation-tool, annotate-overwrite-workflow]
  affects: [pdf-export]
tech-stack:
  added: []
  patterns: [canvas-2d-drawing, pointer-capture, image-coord-mapping, storage-overwrite]
key-files:
  created:
    - src/components/shared/photo-annotator.tsx
  modified:
    - src/app/actions/fotos.ts
    - src/components/admin/admin-photo-card.tsx
    - src/components/shared/photo-thumbnail.tsx
decisions:
  - id: overwrite-not-duplicate
    summary: Annotated photo overwrites original in Supabase Storage at same path -- no duplicate rows or extra storage
  - id: native-resolution-export
    summary: Annotations rendered at native image resolution on offscreen canvas for export quality
  - id: annotate-photos-only
    summary: Annotation only available for photos (tipo_media=foto), not videos
  - id: body-scroll-lock
    summary: Body scroll locked and pinch-zoom prevented while annotator is open for smooth mobile drawing
metrics:
  duration: ~7 min
  completed: 2026-03-02
---

# Phase 10 Plan 04: Photo Annotation Component Summary

**Canvas-based photo annotation tool with freehand, arrow, and text modes that overwrites originals in Supabase Storage**

## What Was Built

A full-screen canvas annotation editor (`PhotoAnnotator`) that allows technicians and admins to draw on photos with freehand lines, arrows, and text labels. The annotated image overwrites the original in Supabase Storage -- no duplicate rows, no extra storage cost.

## Task Completion

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Create PhotoAnnotator component | 9bece83 | Done |
| 2 | Create overwriteAnnotatedPhoto server action | 01ffccb | Done |
| 3 | Integrate Anotar button into AdminPhotoCard | 3e0226a | Done |
| 4 | Integrate Anotar button into technician photo views | 41e6577 | Done |
| 5 | Mobile viewport testing and polish | 7d6cbe9 | Done |

## Key Implementation Details

### PhotoAnnotator Component (~350 LOC)
- Full-screen modal with dark background and canvas overlay
- Three drawing modes: freehand (continuous path), arrow (drag start-to-end with arrowhead), text (tap to place, modal input)
- Four color presets: red (#FF0000), blue (#0066FF), white (#FFFFFF), yellow (#FFD600)
- Two stroke widths: thin (2px) and thick (5px), toggled with a button
- Undo stack: each action stored as typed union, undo pops last
- Image loaded with crossOrigin="anonymous" for canvas export
- All coordinates stored in image-space; mapped to display-space for rendering
- Save flattens to JPEG at native image resolution on offscreen canvas
- Active mode label shown above toolbar for clarity

### Server Action: overwriteAnnotatedPhoto
- Fetches photo record to get storage URL path
- Uses `upsert: true` to overwrite file at same storage path
- No DB changes needed -- same URL, same row
- Revalidates both `/admin/reportes` and `/tecnico` paths

### Admin Integration
- Pencil icon button added to AdminPhotoCard overlay (photos only)
- Opens PhotoAnnotator modal, saves via overwriteAnnotatedPhoto
- Feedback message confirms success or shows error

### Technician Integration
- "Anotar" button added to PhotoThumbnail lightbox (photos only)
- Blue button alongside existing red delete button
- Closes lightbox, opens annotator; saves overwrites original
- Toast feedback message for result

### Mobile Polish
- Body scroll locked while annotator is open
- Pinch-zoom prevention via touch event handler
- Safe area bottom padding using `env(safe-area-inset-bottom)`
- Color picker dismisses when interacting with canvas
- Pointer capture for smooth drawing across element boundaries
- Touch-none on canvas prevents scroll interference
- Toolbar buttons are 40px square (acceptable for thumb taps)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Overwrite original, no duplicates | Plan requirement; saves storage cost and avoids schema complexity |
| Native resolution export | Annotations at full image resolution ensure PDF quality |
| Photos only, not videos | Canvas annotation on video frames not meaningful; videos skip |
| Body scroll lock + pinch prevention | Essential for smooth touch drawing on mobile |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

1. Technician can open photo annotator from PhotoThumbnail lightbox -- DONE
2. Admin can open photo annotator from AdminPhotoCard overlay -- DONE
3. Annotator supports freehand drawing, text labels, arrows, color selection -- DONE
4. Annotated photo overwrites original in storage (upsert:true, same path) -- DONE
5. Undo removes last drawn element -- DONE
6. Mobile touch drawing optimized (scroll lock, pinch prevention, pointer capture) -- DONE
7. Build passes with no type errors -- DONE

## Next Phase Readiness

- Photo annotation tool is fully functional for both admin and technician views
- Annotated photos will appear correctly in PDF export since URLs don't change
- No blockers for remaining 10-05, 10-06, 10-07 plans
