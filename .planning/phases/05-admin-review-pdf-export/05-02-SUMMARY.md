---
phase: 05-admin-review-pdf-export
plan: 02
subsystem: admin-reporting
tags: [admin, inline-edit, approval, server-actions, react-19]
depends_on:
  requires: ["05-01"]
  provides: ["admin-equipment-edit", "admin-materials-edit", "report-approval"]
  affects: ["05-03"]
tech-stack:
  added: []
  patterns: ["useActionState for inline form saves", "useTransition for non-form async actions", "window.confirm for destructive action gates"]
key-files:
  created: []
  modified:
    - src/app/actions/reportes.ts
    - src/app/admin/reportes/[reporteId]/report-detail.tsx
decisions:
  - id: "05-02-01"
    summary: "Equipment edit uses useActionState with bound entryId; materials edit uses useTransition since payload is an array"
  - id: "05-02-02"
    summary: "Approve button uses window.confirm as lightweight confirmation gate (no modal component needed)"
  - id: "05-02-03"
    summary: "Equipment edit does not change equipo_id -- admin edits content fields only (tipo_trabajo, diagnostico, trabajo_realizado, observaciones)"
metrics:
  duration: "5 min"
  completed: "2026-02-28"
---

# Phase 5 Plan 2: Admin Inline Edit & Approval Summary

Admin can overwrite any equipment entry field and materials list inline, plus approve reports with one click.

## What Was Done

### Task 1: Admin server actions for edit and approve (5bfbad3)
Added three new server actions to `src/app/actions/reportes.ts`:

- **adminUpdateEquipmentEntry**: Takes entryId + FormData, validates with existing `reporteEquipoSchema`, updates `reporte_equipos` row. Only updates content fields (tipo_trabajo, diagnostico, trabajo_realizado, observaciones), not equipo_id.
- **adminSaveMaterials**: Takes reporteId + materials array, validates each with `reporteMaterialSchema`, uses delete-all + re-insert pattern (same as technician `saveMaterials`).
- **approveReport**: Takes reporteId, sets `finalizado_por_admin = true` on `reportes`. Does not change estatus -- approval is independent.

All three verify `user.app_metadata?.rol === "admin"` before executing.

### Task 2: Inline edit UI on report detail page (67cc3f4)
Modified `src/app/admin/reportes/[reporteId]/report-detail.tsx` to add:

- **Equipment inline edit**: "Editar" button on each equipment card toggles form with tipo_trabajo toggle (Preventivo/Correctivo buttons), three textareas (diagnostico, trabajo_realizado, observaciones), Guardar/Cancelar. Uses `useActionState` with `adminUpdateEquipmentEntry.bind(null, entryId)`. Auto-exits edit mode on success after 600ms.
- **Materials inline edit**: "Editar" button on materials section header toggles editable rows. Each row has cantidad (number), unidad (text with datalist for common units), descripcion (text). Add/remove rows. Save via `useTransition` + `adminSaveMaterials`. Cancel reverts to original data.
- **Approve button**: Green "Aprobar Reporte" button in footer. `window.confirm` gate. Calls `approveReport`. Disabled "Aprobado" state with checkmark after approval. Error display inline.

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 05-02-01 | Equipment edit uses useActionState; materials uses useTransition | Equipment is a standard form (FormData). Materials is an array payload -- not suitable for native form action. |
| 05-02-02 | window.confirm for approve confirmation | Lightweight, no custom modal needed. Approval is a one-time action. |
| 05-02-03 | Equipment edit does not change equipo_id | Admin edits content/notes, not which equipment the entry belongs to. Changing equipment would require cascading photo/step reassignment. |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx next build --webpack` passes with no errors
- All three server actions exported and verify admin role
- Equipment inline edit with tipo_trabajo toggle, textareas, save/cancel
- Materials inline edit with add/remove rows, datalist units, save/cancel
- Approve button with confirmation dialog, disabled after approval

## Next Phase Readiness

Plan 05-03 (PDF export) can proceed. The approve button and #admin-actions footer area are in place. PDF export button will be added alongside the approve button in the footer.
