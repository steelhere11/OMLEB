---
phase: 9
plan: 1
subsystem: admin-control
tags: [migration, types, server-actions, cascade-delete, photo-review]
dependency-graph:
  requires: [phase-8, phase-5.5, phase-4]
  provides: [admin-delete-actions, photo-management-actions, step-edit-actions, equipment-edit-actions, reporte-comentarios-table]
  affects: [09-02, 09-03, 09-04, 09-05, 09-06]
tech-stack:
  added: []
  patterns: [soft-cascade-delete, admin-service-role-bypass, storage-cleanup-before-delete]
key-files:
  created:
    - supabase/migration-09-admin-control.sql
    - src/app/actions/admin-delete.ts
  modified:
    - src/types/index.ts
    - src/app/actions/fotos.ts
    - src/app/actions/reportes.ts
    - src/app/tecnico/reporte/[reporteId]/equipment-entry-form.tsx
    - src/app/tecnico/reporte/[reporteId]/equipment-registration-card.tsx
    - src/app/tecnico/reporte/[reporteId]/workflow-corrective.tsx
    - src/app/tecnico/reporte/[reporteId]/workflow-step-card.tsx
decisions:
  - id: soft-cascade-via-actions
    description: Keep RESTRICT FK constraints; implement explicit admin cascade deletes via server actions
  - id: admin-upload-auto-accepted
    description: Photos uploaded by admin are auto-set to estatus_revision=aceptada
  - id: estatus-revision-default-pendiente
    description: New photo review column defaults to pendiente for all tech-uploaded photos
metrics:
  duration: ~5 min
  completed: 2026-03-02
---

# Phase 9 Plan 1: Database Migration + Types + Cascade Delete Actions Summary

Server actions foundation for admin full control over reports, photos, steps, and equipment, plus SQL migration for photo review status and admin comments.

## What Was Done

### Task 1: SQL Migration (migration-09-admin-control.sql)
- Added `estatus_revision` column to `reporte_fotos` with CHECK constraint (pendiente/aceptada/rechazada/retomar)
- Added `nota_admin` column to `reporte_fotos` for admin feedback text
- Created `reporte_comentarios` table for admin comments scoped to reports or specific equipment
- Added RLS policies: admin full access, technicians read-only for feedback visibility

### Task 2: TypeScript Types
- Added `FotoEstatusRevision` union type
- Added `estatus_revision` and `nota_admin` fields to `ReporteFoto` interface
- Added `ReporteComentario` interface

### Task 3: Cascade Delete Server Actions (admin-delete.ts)
- `adminDeleteReport`: fetches photo URLs, cleans storage, deletes report (CASCADE handles children)
- `adminDeleteFolio`: iterates reports for storage cleanup, deletes reports, then folio
- `adminDeleteEquipo`: detaches from reporte_equipos and folio_equipos, then deletes equipment
- `adminDeleteSucursal`: full cascade through folios, reports, storage, then branch (CASCADE deletes equipos)
- All actions verify admin role, use service role client for RLS bypass
- Fixed 4 technician components that construct ReporteFoto objects to include new fields

### Task 4: Photo Management Actions (fotos.ts)
- `adminFlagPhoto`: set review status + optional admin note
- `adminDeletePhoto`: delete from storage and database with admin auth
- `adminUploadPhoto`: upload file, insert DB row, auto-accept admin uploads

### Task 5: Step and Equipment Edit Actions (reportes.ts)
- `adminUpdateStep`: edit readings (lecturas), notes, completion status on reporte_pasos
- `adminUpdateEquipmentInfo`: edit nameplate fields (marca, modelo, capacidad, refrigerante, voltaje, fase, ubicacion, tipo_equipo_id)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ReporteFoto type compatibility in 4 technician components**
- **Found during:** Task 3 (after type update from Task 2)
- **Issue:** Adding `estatus_revision` and `nota_admin` to ReporteFoto interface caused TypeScript errors in 4 files that construct ReporteFoto objects inline
- **Fix:** Added `estatus_revision: "pendiente"` and `nota_admin: null` to all ReporteFoto object literals
- **Files modified:** equipment-entry-form.tsx, equipment-registration-card.tsx, workflow-corrective.tsx, workflow-step-card.tsx
- **Commit:** f636536 (bundled with Task 3)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Soft cascade via server actions | Keep RESTRICT FK constraints for safety; explicit delete sequence prevents accidental data loss |
| Admin uploads auto-accepted | Photos uploaded by admin don't need review; set estatus_revision=aceptada directly |
| Default pendiente for tech photos | New column defaults to pendiente so all existing and new tech photos await admin review |

## Next Phase Readiness

All server actions needed by plans 09-02 through 09-06 are now in place:
- 09-02 (Photo Review Panel): uses `adminFlagPhoto`, `adminDeletePhoto`, `adminUploadPhoto`
- 09-03 (Step & Reading Editor): uses `adminUpdateStep`
- 09-04 (Equipment Info Editor): uses `adminUpdateEquipmentInfo`
- 09-05 (Cascade Delete UI): uses `adminDeleteReport`, `adminDeleteFolio`, `adminDeleteEquipo`, `adminDeleteSucursal`
- 09-06 (Comments & Notifications): uses `reporte_comentarios` table and types

User must run `supabase/migration-09-admin-control.sql` in Supabase SQL Editor after migration-08-registration.sql.
