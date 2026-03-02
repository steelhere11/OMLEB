---
phase: 08-arrival-registration
plan: 02
subsystem: server-actions
tags: [registration, server-actions, zod, supabase, gating]
depends_on:
  requires: ["08-01"]
  provides: ["registration-actions", "gating-state-api", "equipment-registration-schema"]
  affects: ["08-03", "08-04", "08-05"]
tech-stack:
  added: []
  patterns: ["shared-completeness-evaluator", "cross-folio-photo-lookup", "gating-state-return"]
key-files:
  created:
    - src/app/actions/registration.ts
  modified:
    - src/lib/validations/equipos.ts
    - src/app/actions/reportes.ts
decisions:
  - id: two-step-photo-query
    description: "Used two-step query (get report IDs, then query photos) instead of Supabase inner join syntax for cross-folio photo lookups"
  - id: shared-completeness-evaluator
    description: "Extracted evaluateRegistrationCompleteness as private helper shared between saveEquipmentRegistration and updateRegistrationStatus"
metrics:
  duration: "~4 min"
  completed: "2026-03-02"
---

# Phase 08 Plan 02: Registration Server Actions Summary

**One-liner:** Six server actions for arrival/site/equipment registration flow with Zod validation and cross-folio photo completeness checks.

## What Was Built

### New File: `src/app/actions/registration.ts`

Six exported server actions following established patterns (auth -> validate -> mutate -> revalidate -> return):

1. **completeArrival(reporteId)** - Sets `llegada_completada = true` on reportes table
2. **completeSiteOverview(reporteId)** - Sets `sitio_completado = true` on reportes table
3. **checkFolioSitePhoto(folioId)** - Queries across all reports for a folio to find existing site photo (two-step: get report IDs, then query reporte_fotos)
4. **saveEquipmentRegistration(equipoId, reporteEquipoId, data)** - Validates nameplate data with Zod, writes to equipos table, evaluates registration completeness (fields + photos), sets `registro_completado` on reporte_equipos
5. **checkRegistrationComplete(reporteId)** - Returns true only when ALL reporte_equipos entries have `registro_completado = true` and at least one entry exists
6. **updateRegistrationStatus(reporteEquipoId, equipoId)** - Re-evaluates completeness after photo upload, updates `registro_completado`

Private shared helper `evaluateRegistrationCompleteness` checks:
- All 8 required fields non-null and non-empty on equipos (marca, modelo, numero_serie, capacidad, refrigerante, voltaje, fase, ubicacion)
- Both required photo types exist (equipo_general + placa) across all reports for the same folio

### Updated: `src/lib/validations/equipos.ts`

- Added `equipmentRegistrationSchema` with 8 optional string fields for nameplate data
- Added `EquipmentRegistrationInput` type export
- Extended `equipoSchema` with capacidad, refrigerante, voltaje, fase, ubicacion fields
- Extended `equipoForFolioSchema` with same 5 new fields

### Updated: `src/app/actions/reportes.ts`

- `getOrCreateTodayReport` now returns `{ reporteId, llegada_completada, sitio_completado }` on success
- Existing report fetch selects gating fields
- New report creation returns `false` defaults
- Race condition recovery also returns gating fields
- Existing callers unaffected (still destructure `reporteId`)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Two-step photo query | Supabase inner join syntax (`reportes!inner`) can be fragile; two-step approach (get IDs, then IN query) is more reliable and readable |
| Shared completeness evaluator | Both `saveEquipmentRegistration` and `updateRegistrationStatus` need identical logic; extracted to avoid drift |
| Cross-folio photo lookup | Equipment photos from any day's report count toward completeness, matching the persistent nature of nameplate data |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ZodError property name**
- **Found during:** Task 1 build verification
- **Issue:** Used `result.error.errors` but Zod v4 uses `result.error.issues`
- **Fix:** Changed to `result.error.issues[0]?.message`
- **Files modified:** src/app/actions/registration.ts
- **Commit:** cf11967

**2. [Rule 1 - Bug] TypeScript strict type cast**
- **Found during:** Task 1 build verification
- **Issue:** Direct cast `equipo as Record<string, string | null>` rejected by TypeScript strict mode
- **Fix:** Cast through `unknown` first: `equipo as unknown as Record<string, string | null>`
- **Files modified:** src/app/actions/registration.ts
- **Commit:** cf11967

**3. [Minor] updateRegistrationStatus signature simplified**
- **Plan specified:** `(reporteEquipoId, equipoId, reporteId)` with 3 params
- **Implemented:** `(reporteEquipoId, equipoId)` with 2 params -- reporteId not needed since we traverse reporte_equipos -> reportes internally
- **Rationale:** Reduces caller burden; the shared evaluator already navigates the chain

## Verification

- [x] All 6 actions exported with correct signatures
- [x] Each action verifies auth, performs DB mutations, revalidates paths
- [x] `equipmentRegistrationSchema` exports 8 optional string fields
- [x] `getOrCreateTodayReport` returns gating state in all paths
- [x] `npx next build --webpack` passes with no errors
- [x] Existing callers of getOrCreateTodayReport unaffected

## Commits

| Hash | Type | Description |
|------|------|-------------|
| d3a7852 | feat | Update equipment validation and getOrCreateTodayReport |
| cf11967 | feat | Create registration server actions |

## Next Phase Readiness

Plan 03 (Registration UI Components) can now build against these actions:
- Import `completeArrival`, `completeSiteOverview` for phase gating buttons
- Import `saveEquipmentRegistration` for nameplate form submission
- Import `checkRegistrationComplete` for overall progress evaluation
- Import `updateRegistrationStatus` to call after photo uploads
- Import `checkFolioSitePhoto` for site overview reuse check
- Use `llegada_completada`/`sitio_completado` from `getOrCreateTodayReport` for initial page state
