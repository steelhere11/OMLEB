---
phase: "03-technician-reporting"
plan: "01"
subsystem: "reporting-server-layer"
tags: ["server-actions", "zod-validation", "database-migration", "rls", "realtime"]

dependency-graph:
  requires: ["01-01", "02-02"]
  provides: ["report-crud-actions", "report-validation-schemas", "migration-03-sql"]
  affects: ["03-02", "03-03", "04-01", "05-01"]

tech-stack:
  added: []
  patterns: ["getOrCreate-with-race-condition-handling", "pre-fill-from-previous-report", "delete-all-re-insert-materials", "folio-status-sync-from-report"]

file-tracking:
  key-files:
    created:
      - "supabase/migration-03-reporting.sql"
      - "src/lib/validations/reportes.ts"
      - "src/app/actions/reportes.ts"
    modified:
      - "src/types/actions.ts"
      - "src/app/actions/equipos.ts"

decisions:
  - id: "03-01-race"
    summary: "Handle unique constraint race condition by catching PostgreSQL 23505 and retrying SELECT"
  - id: "03-01-prefill"
    summary: "Pre-fill new daily reports with equipo_id + tipo_trabajo from previous report (text fields start fresh)"
  - id: "03-01-folio-sync"
    summary: "updateReportStatus syncs parent folio estatus to match report estatus"
  - id: "03-01-field-equip"
    summary: "createEquipoFromField allows tecnico/ayudante roles with revisado=false and agregado_por tracking"

metrics:
  duration: "4 min"
  completed: "2026-02-27"
---

# Phase 03 Plan 01: Reporting Server Layer Summary

**Server-side foundation for technician reporting: migration SQL, Zod schemas, and all CRUD server actions for reports, equipment entries, materials, and status management.**

## What Was Built

### Database Migration (migration-03-reporting.sql)
Three targeted fixes for the reporting system:
1. **Unique constraint** `unique_folio_fecha` on `reportes(folio_id, fecha)` -- prevents duplicate daily reports per folio
2. **RLS policy fix** for `folio_asignados` -- replaced restrictive `usuario_id = auth.uid()` with team-aware policy using `private.get_my_folio_ids()` so technicians can see all team members assigned to their folios
3. **Supabase Realtime** enabled for `reportes`, `reporte_equipos`, and `reporte_materiales` tables

### Validation Schemas (validations/reportes.ts)
Three Zod 4 schemas with Spanish error messages:
- `reporteEquipoSchema`: equipo_id (uuid), tipo_trabajo (preventivo/correctivo enum), diagnostico/trabajo_realizado/observaciones (optional, max 2000 chars)
- `reporteMaterialSchema`: cantidad (coerced positive number), unidad (1-50 chars), descripcion (1-500 chars)
- `reporteStatusSchema`: estatus (en_progreso/en_espera/completado enum)

### Report Server Actions (actions/reportes.ts)
Five exported server actions:
1. **getOrCreateTodayReport(folioId)** -- Returns existing report or creates new one. Handles race condition (23505 unique_violation) by retrying SELECT. Auto-calls preFillFromPreviousReport on creation.
2. **saveEquipmentEntry(reporteId, entryId, prevState, formData)** -- Creates or updates reporte_equipos row. Empty strings become null.
3. **removeEquipmentEntry(entryId)** -- Deletes a reporte_equipos row.
4. **saveMaterials(reporteId, materials[])** -- Delete-all + re-insert pattern for materials list. Validates each item individually with indexed error messages.
5. **updateReportStatus(reporteId, prevState, formData)** -- Updates report estatus. Blocks "completado" if no equipment entries exist. Syncs parent folio estatus to match.

Plus one private helper:
- **preFillFromPreviousReport** -- Copies equipo_id + tipo_trabajo from most recent previous report for the same folio (text fields start fresh each day).

### Technician Equipment Creation (actions/equipos.ts)
- **createEquipoFromField** -- New action allowing tecnico/ayudante to add equipment on-site. Sets `revisado: false` and `agregado_por: user.id` for admin review. Returns `data: { id }` via extended ActionState.

### ActionState Extension (types/actions.ts)
- Added optional `data?: unknown` field -- allows server actions to return created record IDs (backward compatible).

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Catch 23505 unique_violation in getOrCreateTodayReport | Race condition: two cuadrilla members could both hit "start report" simultaneously |
| Pre-fill equipo_id + tipo_trabajo only (not text fields) | Text fields (diagnostico, trabajo_realizado, observaciones) should start fresh each day; only equipment selection carries over |
| Sync folio estatus from report status | Folio status was view-only in Phase 2; now driven by technician report status changes |
| Allow admin role in createEquipoFromField too | No reason to block admins from using the field-add flow; keeps authorization flexible |
| Cast flattenError fieldErrors for material validation | Zod 4 flattenError returns typed object that doesn't accept string indexing; cast to Record<string, string[] | undefined> |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error in saveMaterials validation**
- **Found during:** Task 2
- **Issue:** `z.flattenError()` in Zod 4 returns a typed object; using `Object.keys()` with string indexing caused TS7053 error
- **Fix:** Cast `flattened.fieldErrors` to `Record<string, string[] | undefined>` before string-key access
- **Files modified:** `src/app/actions/reportes.ts`
- **Commit:** 4e29fe4

## Commits

| Hash | Type | Description |
|------|------|-------------|
| d34460f | feat | Database migration, Zod validation schemas, ActionState extension |
| 4e29fe4 | feat | Report server actions and technician equipment creation |

## Next Phase Readiness

Plans 03-02 and 03-03 can now consume:
- `getOrCreateTodayReport` for folio page navigation
- `saveEquipmentEntry` / `removeEquipmentEntry` for the equipment entry form
- `saveMaterials` for the materials table
- `updateReportStatus` for the status selector
- `createEquipoFromField` for the "add equipment on-site" modal
- All Zod schemas for client-side form validation hints

**User action required before testing:** Run `supabase/migration-03-reporting.sql` in Supabase SQL Editor after schema.sql and rls.sql.
