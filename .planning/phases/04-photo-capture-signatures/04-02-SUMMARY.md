---
phase: 04-photo-capture-signatures
plan: 02
subsystem: photo-gallery-wiring
tags: [photo-upload, gallery, thumbnails, lightbox, workflow-integration, mobile-ux]
depends_on:
  requires: [04-01-photo-capture-infrastructure]
  provides: [photo-server-actions, photo-thumbnail-component, photo-gallery-row, wired-photo-buttons]
  affects: [04-03-signature-capture, 05-pdf-export]
tech_stack:
  added: []
  patterns: [label-first-photo-flow, horizontal-scroll-gallery, lightbox-overlay, gallery-multi-select]
key_files:
  created:
    - src/app/actions/fotos.ts
    - src/components/shared/photo-thumbnail.tsx
    - src/components/shared/photo-gallery-row.tsx
  modified:
    - src/app/tecnico/reporte/[reporteId]/workflow-step-card.tsx
    - src/app/tecnico/reporte/[reporteId]/workflow-corrective.tsx
    - src/app/tecnico/reporte/[reporteId]/workflow-preventive.tsx
    - src/app/tecnico/reporte/[reporteId]/equipment-entry-form.tsx
decisions:
  - Gallery uploads skip GPS overlay (no location data for pre-existing photos)
  - Photo thumbnails show abbreviated etiqueta badge (4 chars) to fit 64x64 size
  - Lightbox uses fixed z-50 overlay with object-contain for full-size viewing
  - General equipment photos section uses 5 label buttons (ANTES, DESPUES, DANO, PLACA, PROGRESO)
  - Photos per corrective issue keyed by falla_correctiva_id in local state map
  - Gallery file input uses sequential upload (one at a time) to avoid overwhelming bandwidth
metrics:
  duration: 7 min
  completed: 2026-02-28
---

# Phase 04 Plan 02: Photo Gallery Wiring Summary

**One-liner:** Label-first photo capture flow wired into workflow step cards, corrective issues, and equipment forms with gallery multi-select, thumbnail display, lightbox preview, and server-side photo actions.

## What Was Done

### Task 1: Photo Server Actions, Thumbnail, and Gallery Row
- Created `src/app/actions/fotos.ts` with 4 server actions:
  - `getPhotosForReport`: Fetches all photos for a report
  - `getPhotosForStep`: Fetches photos linked to a specific workflow step
  - `getPhotosForEquipment`: Fetches general equipment photos (not step-specific)
  - `deletePhotoAction`: Deletes photo from Storage + DB row, with URL path parsing
- Created `PhotoThumbnail` component: 64x64 rounded preview with colored etiqueta badge, tap-to-expand fullscreen lightbox, delete button with confirmation dialog
- Created `PhotoGalleryRow` component: Horizontal scrollable row with snap scrolling, renders PhotoThumbnail for each photo

### Task 2: Wire Photo Capture into All Workflow Components
- **workflow-step-card.tsx**: Replaced disabled "Fotos se habilitaran en la siguiente fase" placeholders with working evidence buttons. Each button opens PhotoSourcePicker (Camera/Gallery choice). Camera opens fullscreen CameraCapture with GPS overlay. Gallery opens file picker with multi-select. Photos appear as thumbnails in PhotoGalleryRow below buttons. Photo count shown on each label button (e.g., "ANTES (3)"). Existing photos load from DB on mount.
- **workflow-corrective.tsx**: Same photo integration for corrective issue evidence sections. Photos keyed by falla_correctiva_id. Step progress reloaded after save to get fresh reporte_paso IDs for photo linking.
- **workflow-preventive.tsx**: Now accepts and passes `reporteId` and `equipoId` props down to WorkflowStepCard.
- **equipment-entry-form.tsx**: Added "Fotos generales del equipo" section with 5 label buttons (ANTES, DESPUES, DANO, PLACA, PROGRESO) for non-step-specific equipment photos. Passes `reporteId` and `equipoId` to both WorkflowPreventive and WorkflowCorrective.

## Decisions Made

| Decision | Rationale |
|---|---|
| Gallery uploads skip GPS overlay | Gallery photos are pre-existing; no GPS data available at upload time |
| Sequential gallery upload (not parallel) | Prevents bandwidth saturation on mobile; more reliable on slow connections |
| Photos per corrective issue keyed by falla_correctiva_id | Each corrective issue has its own step progress row, photos link to the right one |
| 5 general photo labels (antes/despues/dano/placa/progreso) | Covers all common equipment documentation needs outside workflow steps |
| Thumbnail badge shows abbreviated etiqueta | "DESP" for despues, first 4 chars for others -- fits within 64x64 thumbnail |

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

- Photo capture and gallery wiring complete for all technician workflow surfaces
- Plan 04-03 (signature pad) can proceed independently -- no blockers
- Phase 5 (PDF export) will need to embed photos from `reporte_fotos` table -- the server actions from this plan provide the data access patterns
