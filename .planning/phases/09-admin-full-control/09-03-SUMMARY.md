---
phase: "09"
plan: "03"
subsystem: admin-photo-management
tags: [photo-review, admin-controls, flag, delete, upload, report-detail]
depends_on:
  requires: ["09-01"]
  provides: ["admin-photo-card", "admin-photo-upload", "photo-review-ui"]
  affects: ["09-04", "09-05"]
tech_stack:
  added: []
  patterns: ["inline-status-badge", "lightbox-overlay", "expandable-upload-form"]
key_files:
  created:
    - src/components/admin/admin-photo-card.tsx
    - src/components/admin/admin-photo-upload.tsx
  modified:
    - src/app/admin/reportes/[reporteId]/report-detail.tsx
decisions:
  - id: status-border-color-coding
    description: "Photo cards use color-coded borders matching review status for instant visual identification"
  - id: immediate-flag-save
    description: "Aceptada/pendiente status changes save immediately; rechazada/retomar require note before saving"
  - id: remove-photogrid
    description: "Removed legacy read-only PhotoGrid component; all photo displays now use AdminPhotoCard with management controls"
metrics:
  duration: "~7 min"
  completed: "2026-03-02"
---

# Phase 9 Plan 3: Photo Management -- Delete, Flag, Upload from Admin

Admin photo management UI with review flagging, deletion, and upload capabilities integrated into the report detail page.

## One-liner

AdminPhotoCard with status flagging (pendiente/aceptada/rechazada/retomar), inline delete with confirmation, lightbox preview, and AdminPhotoUpload for admin file uploads -- all wired into report-detail.tsx with photo status summary bar.

## Completed Tasks

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create AdminPhotoCard component | aa9b12a | src/components/admin/admin-photo-card.tsx |
| 2 | Create AdminPhotoUpload component | ed487c5 | src/components/admin/admin-photo-upload.tsx |
| 3 | Integrate photo management into report-detail.tsx | bcb6625 | src/app/admin/reportes/[reporteId]/report-detail.tsx |

## What Was Built

### AdminPhotoCard (338 LOC)
- Photo/video thumbnail with lightbox for full-size viewing
- Color-coded border per review status (green=aceptada, red=rechazada, amber=retomar, gray=pendiente)
- Status badge overlay in top-right corner
- Status dropdown selector with 4 options
- Note textarea that appears for rechazada/retomar (admin explains why)
- Delete button with inline confirmation dialog
- Shows etiqueta label, GPS coordinates, timestamp metadata
- Displays existing admin notes

### AdminPhotoUpload (266 LOC)
- Expandable "Agregar foto" button that opens upload form
- File input accepting images and videos with preview
- Optional equipo dropdown (or fixed when placed in equipment section)
- Etiqueta dropdown (antes, durante, despues, dano, placa, progreso)
- Optional paso dropdown for step-linked uploads
- Loading state, success feedback, auto-close with router.refresh()

### Report Detail Integration
- All photo displays replaced with AdminPhotoCard (workflow steps, equipment, orphan, general)
- AdminPhotoUpload added per equipment section and in general photos section
- Photo status summary bar showing counts by review status
- Flag/delete handlers wired to server actions with router.refresh() for revalidation
- Updated ReporteFotoData interface with tipo_media, estatus_revision, nota_admin
- Removed unused PhotoGrid component

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Color-coded borders on photo cards | Instant visual identification of review status across photo grids |
| Immediate save for aceptada/pendiente | No friction for quick approval; only rechazada/retomar need admin explanation |
| Removed PhotoGrid component | All photo displays now have admin controls; no read-only display needed |
| Lightbox for full-size viewing | Admin needs to inspect photos at full resolution before flagging |

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

Plan 09-03 complete. The photo management UI is fully functional. Ready for:
- 09-04: Admin inline editing enhancements
- 09-05: Admin notifications
- 09-06: Final polish
