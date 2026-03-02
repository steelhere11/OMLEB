---
phase: 9
plan: 4
subsystem: admin-report-editing
tags: [inline-editor, workflow-steps, equipment-info, admin-ui]
depends_on:
  requires: [09-01, 08-01]
  provides: [inline-step-editing, inline-equipment-info-editing]
  affects: [09-05, 09-06]
tech_stack:
  added: []
  patterns: [inline-editor-toggle, server-action-bridge, parallel-data-fetch]
key_files:
  created:
    - src/components/admin/admin-step-editor.tsx
    - src/components/admin/admin-equipment-info-editor.tsx
  modified:
    - src/app/admin/reportes/[reporteId]/report-detail.tsx
    - src/app/admin/reportes/[reporteId]/page.tsx
decisions:
  - id: step-editor-inline-toggle
    description: Step editor replaces read-only StepRow content when editing, not a modal
  - id: equipo-editor-below-header
    description: Equipment info editor appears inline below the equipment card header
  - id: out-of-range-warning-only
    description: Out-of-range reading values show yellow warning but do not block save
metrics:
  duration: ~5 min
  completed: 2026-03-02
---

# Phase 9 Plan 4: Edit Workflow Steps + Equipment Info from Report Detail - Summary

Inline editing of workflow step data (readings, notes, completion status) and equipment master data (marca, modelo, serie, nameplate fields) directly from the admin report detail page.

## What Was Built

### AdminStepEditor (admin-step-editor.tsx)
- Renders inline when admin clicks "Editar" on any workflow step row
- Lecturas: type-aware inputs -- numeric with step="any" for readings, Si/No toggle button, free text for texto-type fields
- Range validation: yellow highlight + warning text for out-of-range numeric values (non-blocking)
- Notas: pre-filled textarea
- Completado: toggle switch with visual on/off state
- Guardar/Cancelar buttons with loading state and error display
- Calls parent onSave which bridges to adminUpdateStep server action

### AdminEquipmentInfoEditor (admin-equipment-info-editor.tsx)
- Renders inline below equipment card header when admin clicks "Editar equipo"
- 9 editable fields in 2-column grid: marca, modelo, numero_serie, tipo_equipo_id (dropdown from tipos_equipo table), capacidad, refrigerante (dropdown from REFRIGERANTES), voltaje (dropdown from VOLTAJES), fase (dropdown from FASES), ubicacion (dropdown from UBICACIONES_BBVA)
- All fields pre-filled with current values
- Calls parent onSave which bridges to adminUpdateEquipmentInfo server action

### Report Detail Integration
- page.tsx: added parallel fetch of tipos_equipo data alongside team members
- page.tsx: expanded equipos select to include id and tipo_equipo_id fields
- report-detail.tsx: new state variables editingStepId and editingEquipoId
- StepRow: "Editar" button next to step name toggles inline AdminStepEditor
- EquipmentCard: "Editar equipo" link in header toggles inline AdminEquipmentInfoEditor
- On save: editor closes, router.refresh() revalidates server data

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | a70be93 | feat(09-04): create AdminStepEditor component for inline step editing |
| 2 | a4ec69d | feat(09-04): create AdminEquipmentInfoEditor for inline equipment editing |
| 3 | ae3a2cd | feat(09-04): integrate step and equipment editors into report detail page |

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

Plan 09-04 complete. Ready for 09-05 (admin notification system) or 09-06 depending on wave ordering.
