---
phase: 10
plan: 05
title: Fan Coil Equipment Type + Workflow Seeds
status: complete
completed: 2026-03-02
duration: 3m 27s
subsystem: workflows
tags: [fan-coil, seed-data, equipment-types, preventive-maintenance, corrective-issues]
dependency-graph:
  requires: [phase-3.5-workflows, phase-5.5-workflow-ui]
  provides: [fan-coil-workflow-templates, fan-coil-corrective-library]
  affects: [10-06, 10-07]
tech-stack:
  added: []
  patterns: [sql-seed-files, on-conflict-idempotent]
file-tracking:
  key-files:
    created:
      - supabase/seed-fan-coil-workflows.sql
    modified:
      - src/types/workflows.ts
decisions:
  - id: dynamic-dropdown-no-changes
    description: Equipment type dropdowns already load dynamically from tipos_equipo table; no code changes needed
metrics:
  tasks: 2/2
  commits: 2
  files-created: 1
  files-modified: 1
---

# Phase 10 Plan 05: Fan Coil Equipment Type + Workflow Seeds Summary

**One-liner:** Fan coil equipment type with 10 preventive PM steps and 11 corrective issues seeded in SQL, following exact same pattern as existing mini_split/mini_chiller seeds.

## What Was Done

### Task 1: Create fan coil seed SQL
Created `supabase/seed-fan-coil-workflows.sql` with:

- **1 equipment type**: `fan_coil` / "Fan Coil" (is_system=true) with ON CONFLICT DO NOTHING for idempotency
- **10 preventive maintenance steps** (all es_obligatorio=true):
  1. Seguridad: Desenergizar equipo y Lock-Out/Tag-Out (with voltage reading)
  2. Inspeccion visual general
  3. Inspeccion y reemplazo de filtros de aire
  4. Inspeccion y limpieza del ventilador y motor (with amperaje/voltaje readings)
  5. Inspeccion y limpieza del serpentin de enfriamiento
  6. Inspeccion y limpieza de charola de condensado y linea de drenaje
  7. Verificacion de termostato, valvula de 3 vias y actuador
  8. Inspeccion de tuberia de agua helada y valvulas de aislamiento
  9. Verificacion de flujo de aire y temperaturas (with 4 temperature readings)
  10. Re-energizacion, prueba operacional y documentacion

- **11 corrective issues**:
  1. Motor de ventilador no arranca
  2. Exceso de vibracion o ruido en ventilador
  3. Unidad no enfria adecuadamente
  4. Fuga de agua en charola de condensado
  5. Filtro obstruido o danado
  6. Serpentin congelado
  7. Valvula de 3 vias no opera correctamente
  8. Actuador defectuoso
  9. Fuga en tuberia de agua helada
  10. Termostato no responde
  11. Drenaje obstruido / desbordamiento

All entries follow the exact JSON format from seed-workflows.sql for evidencia_requerida, lecturas_requeridas, and materiales_tipicos.

### Task 2: Verify fan_coil appears in equipment type dropdowns
Confirmed all dropdowns dynamically load from `tipos_equipo` table:
- Admin create form (`create-form.tsx`) -- dynamic
- Admin edit form (`edit-form.tsx`) -- dynamic
- Technician add-equipment modal (`add-equipment-modal.tsx`) -- dynamic
- Workflow loading (`actions/workflows.ts`) -- queries by slug, no hardcoding

Added `"fan_coil"` to `TipoEquipoSlug` type union in `src/types/workflows.ts` for type system documentation. Build passes cleanly.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 26a7a2f | feat(10-05): create fan coil seed SQL with 10 preventive steps and 11 corrective issues |
| 2 | 9cfeb85 | feat(10-05): add fan_coil to TipoEquipoSlug type union |

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| dynamic-dropdown-no-changes | No dropdown code changes needed | All equipment type dropdowns already load dynamically from the tipos_equipo database table |

## Verification

- [x] SQL file is syntactically correct (169 lines)
- [x] Fan coil type, 10 preventive steps, and 11 corrective issues all present
- [x] JSON format matches existing seed-workflows.sql exactly
- [x] No hardcoded tipo_equipo lists need updating (all dynamic)
- [x] Build passes cleanly

## Deployment Note

User must run `supabase/seed-fan-coil-workflows.sql` in Supabase SQL Editor after `seed-workflows.sql` to populate fan coil workflow data.
