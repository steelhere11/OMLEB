# Phase 08 Plan 03: Registration UI Components Summary

Registration UI components for the pre-maintenance arrival and equipment registration flow: PhaseGate wrapper, ArrivalSection photo capture, SiteOverviewSection with auto-complete, and EquipmentRegistrationCard with nameplate data entry and dual photo slots.

## Execution Details

| Field | Value |
|-------|-------|
| Phase | 08-arrival-registration |
| Plan | 03 |
| Duration | ~6 min |
| Completed | 2026-03-02 |
| Tasks | 2/2 |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 21bc25a | feat | PhaseGate and ArrivalSection components |
| 80d0601 | feat | SiteOverview and EquipmentRegistration components |

## What Was Built

### PhaseGate (src/components/shared/phase-gate.tsx)
Reusable phase gating wrapper component with three visual states:
- **Locked**: dimmed overlay with lock icon and message, children NOT rendered
- **Unlocked**: blue "in progress" indicator, children rendered in padded container
- **Complete**: green checkmark with "Completado" text

### ArrivalSection (src/app/tecnico/reporte/[reporteId]/arrival-section.tsx)
Arrival photo capture section that:
- Shows guidance text about PPE (casco, botas, chaleco)
- Full-width blue camera button "Tomar foto de llegada"
- Uses PhotoSourcePicker for camera/video/gallery choice
- CameraCapture with GPS/date overlay via photo-stamper
- Uploads with etiqueta "llegada" via compressAndUpload
- Calls completeArrival server action on success
- Shows thumbnail preview with timestamp and GPS info after capture

### SiteOverviewSection (src/app/tecnico/reporte/[reporteId]/site-overview-section.tsx)
Site overview photo section that:
- Auto-completes on mount if existingFolioPhoto is present (from previous visit)
- Shows "Ya capturada en visita anterior" with reused thumbnail
- Otherwise shows camera button "Tomar foto panoramica"
- Uploads with etiqueta "sitio" via compressAndUpload
- Calls completeSiteOverview server action on success

### EquipmentRegistrationCard (src/app/tecnico/reporte/[reporteId]/equipment-registration-card.tsx)
Per-equipment card with:
- Two side-by-side photo slots (equipo_general + placa) with dashed yellow borders when empty
- Eight nameplate form fields in two-column grid:
  - Marca (text), Modelo (text), No. Serie (text), Capacidad (text)
  - Refrigerante (select from REFRIGERANTES constants)
  - Voltaje (select from VOLTAJES constants)
  - Fase (two-option toggle: Monofasico / Trifasico)
  - Ubicacion (select: ATM, PATIO, BOVEDA, TREN_DE_CAJA, OTRO)
- Pre-fills from existing equipo data
- Yellow highlight on empty required fields
- Debounced auto-save (800ms) on text input blur
- Immediate save on select/toggle change
- Calls saveEquipmentRegistration to write back to equipos table
- Calls updateRegistrationStatus after photo uploads
- Tracks per-card completion state

### EquipmentRegistrationSection (src/app/tecnico/reporte/[reporteId]/equipment-registration-section.tsx)
Container that:
- Lists all equipment cards with "Registro de Equipos" header
- Shows progress badge (e.g., "2/5") and animated progress bar
- Tracks per-equipment completion state
- Calls onAllComplete when all equipment cards are registered

## Key Files

### Created
- `src/components/shared/phase-gate.tsx` - Reusable phase gating wrapper
- `src/app/tecnico/reporte/[reporteId]/arrival-section.tsx` - Arrival photo capture
- `src/app/tecnico/reporte/[reporteId]/site-overview-section.tsx` - Site overview photo
- `src/app/tecnico/reporte/[reporteId]/equipment-registration-card.tsx` - Per-equipment card
- `src/app/tecnico/reporte/[reporteId]/equipment-registration-section.tsx` - Equipment list container

### Modified
None

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Children not rendered when locked (not just hidden) | Prevents unnecessary component mounting and data fetching for gated phases |
| Debounced save at 800ms for text inputs, immediate for dropdowns/toggles | Balance between responsiveness and API call volume; dropdowns are single-action |
| Yellow highlight for empty fields instead of red validation errors | Non-blocking UX -- registration is progressive, not form submission |
| Auto-complete site overview on mount for existing folio photos | Eliminates redundant photo capture across multi-day visits |

## Deviations from Plan

None -- plan executed exactly as written.

## Dependencies

- **Requires**: Plan 08-01 (types, constants, schema), Plan 08-02 (server actions)
- **Provides**: UI components for Plan 08-04 (report form integration)
- **Affects**: Plan 08-04 will import these components into the report form page
