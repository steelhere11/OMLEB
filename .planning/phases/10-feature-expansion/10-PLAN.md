# Phase 10: Feature Expansion — Revisions, PDF Notes, Photo Annotation, Fan Coil Workflows, Custom Steps

## Overview

This phase addresses five distinct feature requests that organize into seven implementation plans. Some are interconnected (revision system touches admin editing + PDF), others are independent (fan coil workflows, photo annotation). The implementation order is designed to minimize conflicts and build on dependencies logically.

### Feature Map

| # | Feature | Dependencies |
|---|---------|--------------|
| A | Report revision system (edit approved reports with audit trail) | Phase 9 admin editing |
| B | PDF comment-photo pairing (notes appear below step photos) | Existing PDF pipeline |
| C | Photo annotation/drawing (label equipment on site photos) | Canvas API, new component |
| D | Fan coil preventive maintenance workflows | Existing seed pattern |
| E | Custom "Otro" step for all equipment types | reporte_pasos schema |

---

## Feature A: Report Revision System

### Problem
Currently, approved reports show a warning "esta acción no puede ser revertida." But admins need to edit approved reports to fix errors, add missing info, or update based on client feedback — while maintaining integrity and transparency.

### Design: Revision Tracking

**Approach: Lightweight revision log, not full versioning.**

Full document versioning (storing complete snapshots of every edit) is overkill for this system. Instead, we track individual field changes in a revision log table. Each edit to an approved report creates a revision entry recording what changed, who changed it, and when.

**Database: `reporte_revisiones` table**
```sql
CREATE TABLE public.reporte_revisiones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id    uuid NOT NULL REFERENCES public.reportes (id) ON DELETE CASCADE,
  autor_id      uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  numero        integer NOT NULL DEFAULT 1,  -- revision number: 1, 2, 3...
  resumen       text NOT NULL,               -- "Se corrigió lectura de amperaje en paso 5"
  cambios       jsonb NOT NULL DEFAULT '[]', -- array of {campo, valor_anterior, valor_nuevo, entidad, entidad_id}
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

**Revision number column on reportes:**
```sql
ALTER TABLE public.reportes
  ADD COLUMN revision_actual integer NOT NULL DEFAULT 0;
```

**How it works:**
1. Admin opens an approved/completed report
2. Instead of "no editable" — admin sees an "Editar (creará revisión)" button
3. Admin makes edits (same inline editors from Phase 9)
4. On save, system captures what changed, increments revision_actual, inserts a revision row
5. Admin is prompted for a summary ("¿Qué se cambió?")
6. Report header shows "Revisión 2" badge if revision_actual > 0
7. Revision history panel shows timeline of all edits

**PDF impact:**
- Header shows "Revisión X" next to report date when revision_actual > 0
- Footer shows "Última revisión: [fecha] por [admin]"

**Approved report unlock:**
- Remove the "cannot be reverted" finality from approval
- Approval still means "reviewed and accepted" but admin retains edit capability
- Each post-approval edit automatically creates a revision entry

---

## Feature B: PDF Comment-Photo Pairing

### Problem
When a tech adds a comment/note on a workflow step (e.g., "unusual noise noticed while checking compressor, we took the time to..."), that text should appear below the photos for that step in the PDF.

### Current State
- `reporte_pasos.notas` holds free-text notes per step
- PDF already shows step blocks with photos grouped by stage (antes/durante/despues)
- Notes are rendered but may appear separate from photos

### Solution
This is primarily a **PDF layout adjustment**, not a data model change. The `notas` field already exists on `reporte_pasos`. We just need to ensure in `report-document.tsx` that:

1. Each step block renders photos first
2. Then the notes text appears directly below the photos (not in a separate metadata section)
3. If there are no photos for a step, notes still appear in the step block
4. Visual treatment: notes text in italic with a subtle left border (callout style) directly under the photo grid

This also applies to the admin comments from Phase 9 (`reporte_comentarios`) — equipment-scoped comments should appear in the relevant equipment section of the PDF.

---

## Feature C: Photo Annotation / Drawing

### Problem
Technicians need to label HVAC equipment on the "site" panoramic photo, marking which system is Equipo 1, Equipo 2, etc. This requires a basic drawing/annotation tool.

### Design: Simple Canvas Drawing Editor

**Not a full image editor.** The use case is specifically:
- Open an existing photo (especially site panoramic)
- Draw freehand lines, arrows, or circles
- Add text labels ("Equipo 1", "Equipo 2", "ATM", "BÓVEDA")
- Save the annotated version as a new image (preserving the original)

**Tech approach: HTML5 Canvas with touch support**

No external library needed for this scope. A custom component using native `<canvas>`:
- Load the photo as canvas background
- Touch/mouse drawing with configurable color and stroke width
- Text placement: tap a spot, type label text, it renders on canvas
- Undo last action (stack-based)
- "Guardar" flattens canvas to JPEG and uploads as a new photo with etiqueta='anotado'
- Original photo remains untouched in storage

**Component: `PhotoAnnotator`**
- Full-screen modal (like camera capture)
- Bottom toolbar: Draw (freehand), Text (tap to place), Arrow, Color picker (3-4 preset colors), Undo, Save
- Touch-optimized for mobile use
- Accessible from both technician and admin views via a "Anotar" button on any photo

**Data flow:**
- When tech/admin taps "Guardar", the annotated image **overwrites the original** in Supabase Storage (same file path)
- The `reporte_fotos` row stays the same — no new row, no duplicate
- The URL doesn't change since it's the same storage path
- No `foto_original_id` column needed — there is no copy

**Database addition:**
```sql
-- Update etiqueta constraint to include 'anotado'
ALTER TABLE public.reporte_fotos DROP CONSTRAINT IF EXISTS reporte_fotos_etiqueta_check;
ALTER TABLE public.reporte_fotos ADD CONSTRAINT reporte_fotos_etiqueta_check
  CHECK (etiqueta IN (
    'antes', 'durante', 'despues', 'dano', 'placa', 'progreso',
    'llegada', 'sitio', 'equipo_general', 'anotado'
  ));
```

Note: The etiqueta of the photo does NOT change to 'anotado' — it keeps its original etiqueta (e.g., 'sitio'). The 'anotado' value is reserved for future use if needed. The overwrite-in-place approach means zero storage overhead and zero duplicate management.

---

## Feature D: Fan Coil Preventive Maintenance Workflows

### Problem
The current system has preventive maintenance templates for mini split interior (13 steps), mini split exterior (10 steps), and mini chiller (14 steps). Fan coils need to be added since they are part of the mini chiller system used in BBVA branches.

### Research Summary

Fan coil units (FCUs) are the indoor air distribution components of chiller-based systems. They use chilled water from the chiller to cool air and a fan/blower to distribute it. Commercial FCU preventive maintenance covers these key areas:

**Core maintenance areas (from industry standards and manufacturer guidelines):**
1. **Safety lockout** — de-energize unit, lockout/tagout
2. **Visual inspection** — overall condition, corrosion, damage, leaks
3. **Filter inspection/replacement** — check, clean or replace air filters
4. **Blower/fan motor inspection** — check for noise, vibration, dirt; clean fan blades
5. **Motor electrical readings** — amperage draw, voltage verification
6. **Cooling coil inspection and cleaning** — vacuum or brush coil fins, check for dirt buildup
7. **Drain pan inspection and cleaning** — check for rust, standing water, sediment; clean and treat with biocide
8. **Drain line inspection** — check for clogs, flush with hot water or compressed air
9. **Thermostat/controls verification** — check setpoints, calibration, operation modes
10. **3-way valve / actuator check** — verify proper chilled water flow control, actuator operation
11. **Chilled water piping and isolation valves** — check for leaks at connections, test isolation valves
12. **Airflow and temperature verification** — measure supply/return air temps, confirm adequate airflow
13. **Re-energize and operational test** — restore power, run full cycle, confirm normal operation
14. **Final documentation** — log all findings, note any required follow-up

**Readings for FCU:**
- Amperaje del motor del ventilador (A) — range varies by unit size, typically 0.5-5A
- Voltaje de alimentación (V) — typically 127V or 220V
- Temperatura de aire de suministro (°C) — typically 12-18°C for cooling
- Temperatura de aire de retorno (°C) — typically 22-26°C
- Temperatura de agua de entrada (°C) — typically 6-8°C chilled water
- Temperatura de agua de salida (°C) — typically 12-14°C
- Diferencial de temperatura del agua (°C/ΔT) — typically 4-8°C

**Corrective issues for FCU (common faults):**
- Motor de ventilador no arranca
- Exceso de vibración o ruido en ventilador
- Unidad no enfría adecuadamente
- Fuga de agua en charola de condensado
- Filtro obstruido o dañado
- Serpentín congelado
- Válvula de 3 vías no opera correctamente
- Actuador defectuoso
- Fuga en tubería de agua helada
- Termostato no responde
- Drenaje obstruido / desbordamiento

### Implementation
Add a new equipment type `fan_coil` to `tipos_equipo` and create corresponding `plantillas_pasos` and `fallas_correctivas` in a new seed migration file. Same pattern as existing mini_split and mini_chiller seeds.

The step count should reflect what's actually necessary for a thorough FCU preventive maintenance — not padded to match other equipment types. FCU maintenance is simpler than a full chiller since it has no compressor, no refrigerant circuit, and no condenser. Based on the research, the core steps that truly matter are:

1. **Seguridad: Desenergizar equipo y Lock-Out/Tag-Out**
2. **Inspección visual general** — condition, corrosion, leaks, damage
3. **Inspección y reemplazo de filtros de aire**
4. **Inspección y limpieza del ventilador y motor** — fan blades, noise, vibration, amperage reading
5. **Inspección y limpieza del serpentín de enfriamiento** — vacuum/brush coil fins
6. **Inspección y limpieza de charola de condensado y línea de drenaje** — rust, clogs, biocide treatment
7. **Verificación de termostato, válvula de 3 vías y actuador** — controls, chilled water flow regulation
8. **Inspección de tubería de agua helada y válvulas de aislamiento** — leaks, valve operation
9. **Verificación de flujo de aire y temperaturas** — supply/return air temps, chilled water temps, airflow adequacy
10. **Re-energización, prueba operacional y documentación** — restore power, full cycle test, log findings

10 steps — thorough without being redundant. Steps 6 and 7 each combine closely related items that a tech handles in the same physical action.

**Readings for relevant steps:**
- Step 4: Amperaje del motor (A), Voltaje de alimentación (V)
- Step 9: Temperatura aire suministro (°C), Temperatura aire retorno (°C), Temperatura agua entrada (°C), Temperatura agua salida (°C)

---

## Feature E: Custom "Otro" Step for All Equipment Types

### Problem
Technicians may need to perform and document maintenance actions not covered by the predefined steps. They need an "Other" option that behaves like a regular step (add description, take photos, record notes) but is free-form.

### Design

**Two parts:**

1. **UI: "Agregar paso personalizado" button** at the bottom of the preventive workflow step list
   - Tapping opens a mini form: step name (required), description/procedure (optional)
   - Creates a `reporte_pasos` row with BOTH plantilla_paso_id AND falla_correctiva_id as NULL
   - Uses the notas field for the custom description
   - A new `nombre_custom` column on `reporte_pasos` stores the step name

2. **Database: Add `nombre_custom` to `reporte_pasos`**
```sql
ALTER TABLE public.reporte_pasos
  ADD COLUMN nombre_custom text;

COMMENT ON COLUMN public.reporte_pasos.nombre_custom IS
  'Custom step name for ad-hoc steps not in plantillas. When set, plantilla_paso_id and falla_correctiva_id are both NULL.';
```

**Behavior:**
- Custom steps support the same evidence stages (antes/durante/despues), notes, and readings (optional)
- They appear at the end of the step list in both the report form and PDF
- Admin can edit custom steps like any other step
- PDF renders them under a "Pasos adicionales" subsection within the equipment block

This applies to ALL equipment types (mini split interior/exterior, mini chiller, fan coil) — the button always appears at the bottom of the step list regardless of equipment type.

---

## Implementation Plans

### Plan 10-01: Database Migration + Types

**Migration file: `supabase/migration-10-feature-expansion.sql`**

New tables and columns:
1. `reporte_revisiones` table (revision audit trail)
2. `reportes.revision_actual` column (integer, default 0)
3. `reporte_pasos.nombre_custom` column (custom step name)
4. Updated etiqueta CHECK constraint (add 'anotado')
5. RLS policies for reporte_revisiones

**Types updates (`src/types/index.ts`):**
- Add `ReporteRevision` interface
- Add `nombre_custom` to related types
- Update `Reporte` with `revision_actual`

---

### Plan 10-02: Report Revision System

**Server actions (`src/app/actions/admin-revisions.ts`):**
1. `createRevision(reporteId, resumen, cambios)` — insert revision, increment revision_actual
2. `getRevisionHistory(reporteId)` — fetch all revisions with author names
3. Wrap existing admin edit actions to auto-create revision entries when editing approved reports

**UI changes:**
- Modify `report-detail.tsx`: approved reports show "Editar (creará revisión)" instead of being locked
- New `RevisionHistoryPanel` component (~120 LOC) — collapsible timeline showing all revisions
- Revision badge in report header: "Revisión 2" etc.
- On save of approved report edit, modal prompts for revision summary

**PDF changes:**
- "Revisión X" shown in header area next to date
- "Última revisión: [fecha] por [nombre]" in footer

---

### Plan 10-03: PDF Comment-Photo Pairing

**Changes to `src/components/pdf/report-document.tsx`:**
- In each step block, ensure notes render directly below the photo grid (not in a separate metadata area)
- Style: italic text with left border accent
- Include equipment-scoped admin comments below the relevant equipment block
- Include general admin comments at the end of the report before signature

This is a layout-only change — no database or types changes needed.

---

### Plan 10-04: Photo Annotation Component

**New files:**
- `src/components/shared/photo-annotator.tsx` (~300 LOC) — full-screen canvas editor
  - Load image as canvas background
  - Tools: freehand draw, text placement, arrow, color selection (red/blue/white/yellow)
  - Stroke width toggle (thin/thick)
  - Undo stack
  - Touch-optimized with pointer events
  - "Guardar" flattens canvas → compresses → **overwrites the original file in Supabase Storage** (same path, same DB row)

**Server action additions:**
- `overwriteAnnotatedPhoto(fotoId, imageBlob)` — replaces the file in storage at the existing path, no new DB row

**Integration:**
- "Anotar" button appears on photo cards in both admin (AdminPhotoCard) and technician (PhotoThumbnail) views
- No duplicates — the annotated image replaces the original in place
- PDF shows whatever is currently stored (annotated or not)

---

### Plan 10-05: Fan Coil Equipment Type + Workflow Seeds

**New file: `supabase/seed-fan-coil-workflows.sql`**

Contents:
1. Insert `fan_coil` into `tipos_equipo`
2. Insert 10 `plantillas_pasos` rows for `fan_coil` preventive maintenance (see Feature D step list above)
3. Insert ~11 `fallas_correctivas` rows for `fan_coil` corrective issues
4. Include appropriate `lecturas_requeridas` for steps 4 and 9 (motor amperage, voltages, temperatures)
5. Include `evidencia_requerida` following the same antes/durante/despues pattern

---

### Plan 10-06: Custom "Otro" Step for All Equipment Types

**UI: `src/components/tecnico/custom-step-form.tsx` (~100 LOC)**
- "Agregar paso personalizado" button at bottom of preventive workflow
- Inline form: nombre (required text input), procedimiento (optional textarea)
- Creates reporte_pasos row with plantilla_paso_id=NULL, falla_correctiva_id=NULL, nombre_custom=entered name
- After creation, step appears as a regular workflow card with evidence stages

**Server action:** `addCustomStep(reporteEquipoId, nombre, procedimiento?)`
- Creates the reporte_pasos row
- Returns the new step for optimistic UI update

**Integration in workflows:**
- `workflow-preventive.tsx`: add button after last step card
- `workflow-corrective.tsx`: add button after corrective issue list (for additional non-listed work)
- `workflow-step-card.tsx`: handle rendering when plantilla_paso_id is null (use nombre_custom)
- `report-document.tsx` (PDF): render custom steps under "Pasos adicionales" section

**Admin side:**
- Custom steps show in admin report detail like any other step
- Admin can edit nombre_custom via the step editor from Phase 9

---

### Plan 10-07: Integration, Testing & Cleanup

- Verify all features work together
- Ensure PDF renders revision info, paired comments, annotated photos, fan coil steps, and custom steps
- Update admin equipment forms to include `fan_coil` in tipo_equipo dropdown
- Verify revision history panel renders correctly
- Test annotation tool on mobile viewport
- Update STATE.md and ROADMAP.md

---

## Verification Criteria

1. Admin can edit an approved report; each edit creates a revision entry with summary
2. Report header shows "Revisión X" when revision_actual > 0
3. Revision history panel shows timeline of all changes with author, date, and summary
4. PDF includes revision number in header and last revision info in footer
5. Step notes appear directly below step photos in PDF (not separated)
6. Admin comments appear in relevant equipment sections of PDF
7. Technician can open photo annotator from any photo
8. Annotator supports freehand drawing, text labels, arrows, and color selection
9. Annotated photo overwrites the original in storage — no duplicates, no extra rows
10. Fan coil appears as equipment type option with 10 preventive steps
11. Fan coil corrective issues work like existing equipment types
12. "Agregar paso personalizado" button appears on all equipment preventive workflows
13. Custom steps support full evidence capture (photos, notes)
14. Custom steps render in PDF under "Pasos adicionales"
15. All features work on mobile viewport

## Implementation Order

```
Plan 10-01 → DB migration + types
Plan 10-02 → Report revision system
Plan 10-03 → PDF comment-photo pairing
Plan 10-04 → Photo annotation component
Plan 10-05 → Fan coil workflow seeds
Plan 10-06 → Custom "Otro" step
Plan 10-07 → Integration & cleanup
```
