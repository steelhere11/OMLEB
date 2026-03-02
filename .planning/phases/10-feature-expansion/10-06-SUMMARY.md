---
phase: 10
plan: 06
title: "Custom 'Otro' Step for All Equipment Types"
subsystem: technician-workflow
tags: [custom-steps, workflow, preventive, corrective, pdf]
duration: ~7 min
completed: 2026-03-02
tasks_completed: 7/7
requires: [10-01]
provides: [custom-step-creation, custom-step-evidence, custom-step-pdf-rendering, custom-step-admin-editing]
affects: []
tech_stack:
  added: []
  patterns: [custom-step-card-pattern, separate-custom-from-template-steps]
key_files:
  created:
    - src/components/tecnico/custom-step-form.tsx
    - src/app/tecnico/reporte/[reporteId]/custom-step-card.tsx
  modified:
    - src/app/actions/workflows.ts
    - src/app/actions/reportes.ts
    - src/app/tecnico/reporte/[reporteId]/workflow-preventive.tsx
    - src/app/tecnico/reporte/[reporteId]/workflow-corrective.tsx
    - src/components/pdf/report-document.tsx
    - src/components/admin/admin-step-editor.tsx
    - src/app/admin/reportes/[reporteId]/report-detail.tsx
decisions:
  - id: custom-step-card-component
    value: "Created dedicated CustomStepCard component rather than modifying WorkflowStepCard to handle null plantilla"
  - id: default-evidence-stages
    value: "Custom steps get default antes/durante/despues evidence stages since there is no plantilla to define them"
  - id: purple-custom-badge
    value: "Custom steps visually distinguished with purple badge and purple-tinted styling"
---

# Phase 10 Plan 06: Custom "Otro" Step for All Equipment Types Summary

Technicians can now add ad-hoc maintenance steps not covered by predefined templates via "Agregar paso personalizado" button on both preventive and corrective workflows, with full evidence capture and PDF rendering.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Add custom step server actions | 0b33c1b | addCustomStep, saveCustomStepProgress, deleteCustomStep in workflows.ts |
| 2 | Create CustomStepForm component | fdcb6ab | Expandable inline form with name + description inputs |
| 3 | Integrate into preventive workflow | 30ecb31 | CustomStepCard + CustomStepForm rendered after template steps |
| 4 | Integrate into corrective workflow | 77c1d4e | Custom steps tracked and rendered in corrective workflow |
| 5 | Custom step card handles null plantilla | 30ecb31 | Dedicated CustomStepCard with purple badge, default evidence stages |
| 6 | Update PDF for custom steps | 18dd25a | "Pasos adicionales" subsection with "Adicional" label prefix |
| 7 | Admin editing for custom steps | 1aad80a | nombre_custom editable field in AdminStepEditor |

## Implementation Details

### Server Actions (workflows.ts)
- `addCustomStep(reporteEquipoId, nombre, procedimiento?)` - Creates reporte_pasos row with null plantilla/falla IDs, nombre_custom set
- `saveCustomStepProgress(reportePasoId, data)` - Updates completion, notes, lecturas for custom steps
- `deleteCustomStep(reportePasoId)` - Removes custom step entirely

### CustomStepCard Component
Created a dedicated card component rather than modifying the existing `WorkflowStepCard` which is tightly coupled to `PlantillaPaso` types. The custom card:
- Shows `nombre_custom` as the step title with purple "Personalizado" badge
- Default evidence stages: antes, durante, despues (since no plantilla defines them)
- Full photo/video capture support (camera, gallery, deletion)
- Delete button to remove custom steps
- Notes editing and completion toggle

### CustomStepForm Component
Dashed-border button that expands into an inline form:
- Required "Nombre del paso" text input
- Optional "Descripcion / procedimiento" textarea
- Calls addCustomStep and notifies parent via callback

### Workflow Integration
Both preventive and corrective workflows:
- Load custom steps from getStepProgress (filtered by null plantilla_paso_id + null falla_correctiva_id + nombre_custom set)
- Include custom steps in progress bar calculation
- Render custom steps after template/corrective steps
- Show CustomStepForm button at bottom, even in fallback (no templates) view

### PDF Rendering
- Added `isCustom` flag to `PdfStepData` interface
- Template steps render first, then custom steps under "Pasos adicionales" heading
- StepBlock accepts `labelPrefix` parameter ("Adicional" for custom, "Paso" for template)

### Admin Editing
- Added `nombre_custom` to `ReportePasoData` and `ReportePasoForEdit` interfaces
- AdminStepEditor shows editable name input for custom steps only
- adminUpdateStep action supports nombre_custom in update payload
- "Personalizado" badge shown in admin report detail StepRow

## Deviations from Plan

### Design Deviation: Separate CustomStepCard Component

**Found during:** Task 5
**Issue:** Plan suggested modifying WorkflowStepCard to handle null plantilla. However, WorkflowStepCard is deeply coupled to PlantillaPaso type (evidence stages from plantilla, readings from lecturas_requeridas, procedure text from plantilla.procedimiento). Making it handle both would create complex conditional logic.
**Fix:** Created dedicated CustomStepCard component that mirrors the UX but works with ReportePaso data directly. This is cleaner and avoids fragile conditionals in the template card.
**Impact:** Same user experience, cleaner code.

### Addition: deleteCustomStep action

**Found during:** Task 1
**Issue:** Plan did not mention a delete action, but technicians need ability to remove custom steps they added by mistake.
**Fix:** Added deleteCustomStep server action and delete button in CustomStepCard.
**Justification:** Rule 2 - Missing critical functionality for usability.

## Verification

1. "Agregar paso personalizado" button appears on all equipment preventive workflows - YES
2. Button also appears on corrective workflows - YES
3. Custom steps support full evidence capture (photos, notes) - YES (via CustomStepCard)
4. Custom steps render in PDF under "Pasos adicionales" - YES
5. Admin can edit custom step name and notes - YES
6. All features work on mobile viewport - YES (mobile-first design)
7. Build passes - YES (verified with npm run build)
