---
phase: 08-arrival-registration
plan: 04
subsystem: technician-report-flow
tags: [registration, phased-gating, data-fetching, report-form]
depends_on:
  requires: ["08-02", "08-03"]
  provides: ["phased-report-form", "registration-data-fetching"]
  affects: ["08-05"]
tech-stack:
  added: []
  patterns: ["phased-gating-ui", "server-side-data-prefetch", "cross-folio-photo-lookup"]
key-files:
  created: []
  modified:
    - src/app/tecnico/reporte/[reporteId]/page.tsx
    - src/app/tecnico/reporte/[reporteId]/report-form.tsx
decisions:
  - id: "show-all-phases-completed"
    description: "Completed reports bypass all gating and show all phases expanded"
  - id: "registration-entries-export-type"
    description: "RegistrationEntry type exported from page.tsx and imported by report-form.tsx for cross-file type sharing"
metrics:
  duration: "~3 min"
  completed: "2026-03-02"
---

# Phase 08 Plan 04: Integration & Page Wiring Summary

Extended data fetching and restructured report form from flat layout to phased, gated workflow.

## One-liner

Server component fetches registration state (arrival/site/equipment photos + gating booleans); form renders 4 sequential PhaseGate sections that unlock progressively.

## What Was Done

### Task 1: Extend page.tsx data fetching
- Added `llegada_completada` and `sitio_completado` to main report SELECT
- Added `registro_completado` to reporte_equipos SELECT
- Added `capacidad, refrigerante, voltaje, fase, ubicacion` to equipos join
- Fetches arrival photo (`etiqueta = 'llegada'`) for current report
- Fetches site photo (`etiqueta = 'sitio'`) for current report
- Fetches folio-level site photo from ANY report for this folio (two-step query: get report IDs, then IN query)
- Fetches equipment registration photos (`equipo_general` + `placa`) across all folio reports
- Builds `RegistrationEntry[]` data structure mapping photos to equipment entries
- Passes 6 new props to ReportForm: `llegadaCompletada`, `sitioCompletado`, `arrivalPhoto`, `sitePhoto`, `existingFolioSitePhoto`, `registrationEntries`
- Commit: `328a876`

### Task 2: Restructure report-form.tsx with phased gating
- Added new props to `ReportFormProps` interface for registration flow
- Added phase completion state: `arrivalDone`, `siteDone`, `registrationDone`
- Imported and renders `PhaseGate`, `ArrivalSection`, `SiteOverviewSection`, `EquipmentRegistrationSection`
- Phase 1 (Llegada): Always unlocked, renders ArrivalSection
- Phase 2 (Panoramica del Sitio): Locked until arrival complete
- Phase 3 (Registro de Equipos): Locked until site complete
- Phase 4 (Mantenimiento): Locked until all equipment registered; wraps existing EquipmentSection + MaterialsSection + StatusSection
- Completed reports (`isCompleted`) bypass all gating with `showAllPhases` flag
- Phase completion callbacks update local state to unlock next phase in sequence
- Commit: `82b3e3d`

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| show-all-phases-completed | Completed reports show all phases expanded without gating | Allows reviewing all sections of historical reports without needing to "unlock" each phase |
| registration-entries-export-type | RegistrationEntry type exported from page.tsx, imported by report-form.tsx | Cleanest approach for sharing the type between server component (which builds the data) and client component (which consumes it) |

## Verification

- TypeScript compilation: PASS (zero errors)
- Next.js build: PASS (all routes compile successfully)
- All 4 phases render in correct order with proper gating logic

## Next Phase Readiness

Plan 08-05 (Testing & Polish) can proceed. The full registration flow is wired:
- Server actions (08-02) handle data mutations
- UI components (08-03) provide the visual interface
- Integration (08-04) connects everything in the report page

The flow is: Open report -> Take arrival photo -> Take site photo -> Register each equipment -> Maintenance section unlocks.
