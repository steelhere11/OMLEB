---
phase: 08-arrival-registration
plan: 01
subsystem: data-layer
tags: [migration, typescript, constants, schema, equipment-nameplate]
dependency-graph:
  requires: [migration-07-video-support]
  provides: [registration-schema, equipment-nameplate-types, photo-etiqueta-expansion, gating-booleans]
  affects: [08-02, 08-03, 08-04, 08-05]
tech-stack:
  added: []
  patterns: [constants-as-const, typed-dropdown-options]
file-tracking:
  key-files:
    created:
      - supabase/migration-08-registration.sql
      - src/lib/constants/ubicaciones.ts
      - src/lib/constants/nameplate-options.ts
    modified:
      - src/types/index.ts
      - src/app/tecnico/reporte/[reporteId]/equipment-section.tsx
decisions:
  - id: as-const-dropdowns
    description: "Constants use 'as const' with value/label objects for typed dropdowns"
  - id: nullable-nameplate-fields
    description: "Nameplate fields (capacidad, refrigerante, voltaje, fase, ubicacion) are nullable strings, not required"
metrics:
  duration: ~3 min
  completed: 2026-03-02
---

# Phase 08 Plan 01: Schema & Types Foundation Summary

Database migration and TypeScript type foundation for the arrival/site/equipment registration flow.

## One-liner

SQL migration adding 8 new columns across 3 tables + etiqueta constraint expansion, with matching TypeScript types and typed constant files for equipment nameplate dropdowns.

## What Was Done

### Task 1: Create migration-08-registration.sql (f4273ff)
Created `supabase/migration-08-registration.sql` with four sections:
1. **equipos table** -- 5 new nullable text columns: capacidad, refrigerante, voltaje, fase, ubicacion
2. **reporte_fotos constraint** -- Expanded etiqueta CHECK to include llegada, sitio, equipo_general (drop + re-add pattern)
3. **reportes table** -- 2 gating booleans: llegada_completada, sitio_completado (default false)
4. **reporte_equipos table** -- 1 registration tracking boolean: registro_completado (default false)

### Task 2: Update TypeScript types and create constants (6c80070)
- **src/types/index.ts** -- Updated Equipo (5 fields), FotoEtiqueta (3 values), ReporteEquipo (registro_completado), Reporte (2 gating booleans)
- **src/lib/constants/ubicaciones.ts** -- UBICACIONES_BBVA with 5 entries (ATM, PATIO, BOVEDA, TREN_DE_CAJA, OTRO) + UbicacionValue type
- **src/lib/constants/nameplate-options.ts** -- REFRIGERANTES (6 options), VOLTAJES (6 options), FASES (2 options) with exported value types

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed optimistic ReporteEquipo missing registro_completado**
- **Found during:** Task 2 (build verification)
- **Issue:** Adding `registro_completado: boolean` to the `ReporteEquipo` interface caused a TypeScript error in `equipment-section.tsx` where an optimistic entry object was constructed without the new field
- **Fix:** Added `registro_completado: false` to the optimistic entry object literal
- **Files modified:** `src/app/tecnico/reporte/[reporteId]/equipment-section.tsx`
- **Commit:** 6c80070

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `as const` assertion on all constant arrays | Enables TypeScript to infer literal union types from the value fields, making dropdown components type-safe |
| Nameplate fields as nullable strings | Equipment may already exist without nameplate data; technicians fill it in during registration step |
| Separate constants files (ubicaciones vs nameplate-options) | ubicaciones.ts is BBVA-specific and may change per client; nameplate-options are HVAC-industry standard |

## Verification

- [x] `supabase/migration-08-registration.sql` exists with 4 ALTER TABLE sections
- [x] `src/types/index.ts` has updated Equipo (5 new fields), FotoEtiqueta (3 new values), ReporteEquipo (registro_completado), Reporte (2 gating booleans)
- [x] `src/lib/constants/ubicaciones.ts` exports UBICACIONES_BBVA with 5 entries including OTRO
- [x] `src/lib/constants/nameplate-options.ts` exports REFRIGERANTES, VOLTAJES, FASES
- [x] `npx next build` passes with no errors

## Next Phase Readiness

Plans 02-05 can proceed. They depend on:
- **Types:** Equipo, FotoEtiqueta, ReporteEquipo, Reporte interfaces are updated
- **Constants:** UBICACIONES_BBVA, REFRIGERANTES, VOLTAJES, FASES available for import
- **Migration:** Must be run in Supabase SQL Editor before testing with real data
