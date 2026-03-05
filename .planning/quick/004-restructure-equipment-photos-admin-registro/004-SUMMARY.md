---
phase: quick-004
plan: 01
subsystem: ui
tags: [admin, technician, photos, equipment, registration]
completed: 2026-03-05
duration: ~5 min
tech-stack:
  added: []
  patterns: [per-equipment-photo-sections, two-column-registration-layout]
key-files:
  created: []
  modified:
    - src/app/tecnico/reporte/[reporteId]/equipment-entry-form.tsx
    - src/app/admin/reportes/[reporteId]/report-detail.tsx
decisions:
  - id: remove-tech-general-photos
    description: "Removed redundant general photos section from technician equipment entry form since workflow steps already handle all evidence"
  - id: registro-equipos-replaces-fotos-generales
    description: "Replaced admin Fotos Generales (orphan photos) with structured Registro de Equipos section showing per-equipment placa + equipo_general photos"
---

# Quick Task 004: Restructure Equipment Photos + Admin Registro Section

**One-liner:** Remove redundant tech general photos section; replace admin Fotos Generales with structured per-equipment Registro de Equipos section.

## What Was Done

### Task 1: Remove general photos from technician equipment entry form
- Removed the entire "Fotos generales del equipo" section from `equipment-entry-form.tsx`
- Removed all associated state variables (generalPhotos, activeLabel, showSourcePicker, showCamera, showVideoCapture, isUploading, fileInputRef)
- Removed all handler functions (handleLabelClick, handleSelectCamera, handleSelectVideoCamera, handleSelectGallery, handleCameraCapture, handleVideoCapture, handleGalleryFiles, handleDeletePhoto, getPhotoCount)
- Removed constants (generalLabelColors, generalLabels)
- Removed JSX sections (label buttons, PhotoGalleryRow, hidden file input, PhotoSourcePicker, CameraCapture, VideoCapture)
- Removed unused imports (getPhotosForEquipment, deletePhotoAction, compressAndUpload, PhotoSourcePicker, CameraCapture, VideoCapture, PhotoGalleryRow, useRef, useCallback, ReporteFoto)
- Net result: -276 lines removed. Clean form with workflow + observaciones only.

### Task 2: Replace admin Fotos Generales with Registro de Equipos
- Removed the "Fotos Generales" section from admin report detail (orphan photos display + generic upload)
- Removed the `generalPhotos` variable computation (`photosByEquipo.get("__general__")`)
- Created `RegistroEquiposSection` inline component with:
  - Per-equipment cards showing equipment header (numero_etiqueta, marca, modelo)
  - Two-column layout: "Equipo General" column + "Placa" column
  - AdminPhotoCard with full management (flag, delete, update etiqueta) for each photo
  - AdminPhotoUpload per equipment (pre-fills equipoId)
  - De-duplication of equipment entries (same equipo_id from preventivo + correctivo)
  - Empty state placeholders (dashed border) when no photo exists
- Reordered layout: Registro de Equipos now appears before Llegadas section

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | adce99a | feat(quick-004): remove redundant general photos from technician equipment entry form |
| 2 | baa557e | feat(quick-004): replace admin Fotos Generales with Registro de Equipos section |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compilation: zero errors
- Build: successful
- "Fotos Generales" grep in report-detail.tsx: zero matches
- "Registro de Equipos" grep in report-detail.tsx: found in 3 locations (comment, section header, component)
- generalPhotos in report-detail.tsx: only exists as local variable inside RegistroEquiposSection (correct)
- PDF pipeline unaffected (reads directly from reporte_fotos data, not UI components)
