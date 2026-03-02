# Phase 9: Admin Full Control

## SETUP INSTRUCTIONS (Run Before Executing Plans)

Before executing any plans below, update the following project files:

### 1. Update `.planning/STATE.md`

Replace the "Current focus" and "Current Position" block:
```
**Current focus:** Phase 9 planned. All V1 code phases + Phase 8 done.

## Current Position

Phase: 9 (Admin Full Control) — planned, ready to execute
Plan: 0 of 6 in current phase
Status: Plan written, ready for execution
Last activity: 2026-03-02 -- Phase 9 plan created
```

Replace the "Session Continuity" block at the bottom:
```
Last session: 2026-03-02
Stopped at: Phase 9 PLAN WRITTEN. Ready to execute 09-01.
Resume file: .planning/phases/09-admin-full-control/09-PLAN.md
```

### 2. Update `.planning/ROADMAP.md`

In the phase list (after Phase 8 bullet), add:
```
- [ ] **Phase 9: Admin Full Control** - INSERTED - Cascade delete for all entities, photo management (delete/flag/upload), edit workflow steps and equipment info from report detail, admin comments system, technician feedback visibility
- [ ] **Phase 10: Photo Export & Device Save** - PLANNED - ZIP photo package download organized by report structure, save-to-device for individual photos, PDF photo optimization (thumbnails in PDF, full-res in ZIP)
```

In the Phase Details section (after Phase 8 details), add the full Phase 9 and Phase 10 detail blocks:

**Phase 9: Admin Full Control (INSERTED)**
- Goal: Give admins complete CRUD control over every entity — cascade deletes, photo management, step/equipment editing, commenting, and feedback loop with technicians
- Depends on: Phase 5.5 (admin report detail view, photo infrastructure). Compatible with Phase 8 additions.
- 13 success criteria (see plan below)
- 6 plans: 09-01 through 09-06

**Phase 10: Photo Export & Device Save (PLANNED)**
- Goal: Enable photo package downloads as organized ZIP files and individual photo save-to-device, with PDF optimization for thumbnails vs full-res
- Depends on: Phase 9 (photo management infrastructure)
- 6 success criteria
- Plans: TBD

In the progress table, add:
```
| 9. Admin Full Control | 0/6 | Pending | - |
| 10. Photo Export & Device Save | 0/TBD | Planned | - |
```

### 3. Commit
```bash
git add .planning/
git commit -m "docs(phase-9): add admin full control planning artifacts"
git push origin main
```

---

## Problem Statement

Admins are locked out of basic management operations. The current system has cascading FK constraints that block deletion (sucursales → folios → reportes → equipos), no delete UI for folios or reportes, read-only workflow steps, no photo management, and no flagging or commenting capabilities. An admin should have full CRUD control over every entity in the system.

## Current State Audit

### What Admins CAN Do Now
- Edit reporte_equipo fields: tipo_trabajo, diagnostico, trabajo_realizado, observaciones
- Edit materials (add/remove/modify rows)
- Change report status (en_progreso / en_espera / completado)
- Approve reports (finalizado_por_admin)
- Delete sucursales (blocked by FK if folios/equipos exist)
- Delete equipos (blocked by FK if reporte_equipos exist)
- Edit sucursales, folios, equipos, clientes via dedicated edit forms
- Generate PDFs

### What Admins CANNOT Do Now
1. **Delete folios** — no UI, no action
2. **Delete reportes** — no UI, no action
3. **Delete equipos with reports** — FK RESTRICT blocks it (reporte_equipos, folio_equipos)
4. **Delete sucursales with folios** — FK RESTRICT blocks it
5. **Delete individual photos/videos** from report detail view
6. **Add photos** to existing reports from admin side
7. **Flag photos** as accepted/rejected/needs-retake
8. **Edit workflow step data** — readings and notes are read-only
9. **Edit equipment fields** (marca, modelo, serie, tipo, capacidad, refrigerante, voltaje, fase, ubicacion) from report detail
10. **Add admin comments/notes** to reports or equipment entries
11. **Force-complete or reset** individual workflow steps

## Architecture: Cascade Delete Strategy

### Current FK Constraints (blocking)
```
sucursales ← folios (ON DELETE RESTRICT) ← reportes (ON DELETE RESTRICT)
equipos ← reporte_equipos (ON DELETE RESTRICT)
equipos ← folio_equipos (ON DELETE RESTRICT)
```

### Tables with CASCADE (auto-clean on parent delete)
```
reportes → reporte_equipos (CASCADE)
reportes → reporte_fotos (CASCADE)
reportes → reporte_materiales (CASCADE)
reportes → reporte_pasos (CASCADE via workflow migration)
folios → folio_asignados (CASCADE)
folios → folio_equipos (CASCADE)
sucursales → equipos (CASCADE)
```

### Strategy: Soft Cascade via Server Actions (NOT database CASCADE change)

We do NOT change FK constraints to CASCADE. That's dangerous — an accidental sucursal delete would wipe all history. Instead, we keep RESTRICT and implement **explicit admin cascade actions** that delete children first in a controlled, logged sequence:

**Delete Report Flow:**
1. Fetch all reporte_fotos URLs for storage cleanup
2. Delete storage files (photos + videos)
3. Delete the reporte itself (CASCADE auto-deletes: reporte_equipos, reporte_fotos rows, reporte_materiales, reporte_pasos)
4. Revalidate paths

**Delete Folio Flow:**
1. For each report in folio → run Delete Report Flow (storage cleanup + delete)
2. Delete the folio itself (CASCADE auto-deletes: folio_asignados, folio_equipos)

**Delete Equipo Flow:**
1. Detach from reporte_equipos (delete rows where equipo_id matches — unlinks from reports)
2. Delete folio_equipos references (delete rows where equipo_id matches — unlinks from folios)
3. Update reporte_fotos SET equipo_id = NULL where equipo_id matches (ON DELETE SET NULL handles this but be explicit)
4. Delete the equipo itself

**Delete Sucursal Flow:**
1. For each folio referencing sucursal → run Delete Folio Flow
2. For each report directly referencing sucursal → run Delete Report Flow
3. Delete the sucursal itself (CASCADE auto-deletes all equipos in the sucursal)

All flows require double confirmation: first confirm dialog, then type entity name.

## Database Changes (migration-09-admin-control.sql)

Note: Runs AFTER migration-08-registration.sql. Current reporte_fotos table already has:
- reporte_paso_id (from workflow migration)
- tipo_media column: 'foto' | 'video' (from migration-07)
- etiqueta values: antes, durante, despues, dano, placa, progreso, llegada, sitio, equipo_general (from migration-08)
- Phase 8 columns on equipos: capacidad, refrigerante, voltaje, fase, ubicacion
- Phase 8 columns on reportes: llegada_completada, sitio_completado
- Phase 8 column on reporte_equipos: registro_completado

### 1. Photo review status column
```sql
ALTER TABLE public.reporte_fotos
  ADD COLUMN IF NOT EXISTS estatus_revision text NOT NULL DEFAULT 'pendiente'
  CHECK (estatus_revision IN ('pendiente', 'aceptada', 'rechazada', 'retomar'));

COMMENT ON COLUMN public.reporte_fotos.estatus_revision IS
  'Admin review status: pendiente, aceptada, rechazada, retomar (needs retake).';
```

### 2. Admin notes on photos
```sql
ALTER TABLE public.reporte_fotos
  ADD COLUMN IF NOT EXISTS nota_admin text;

COMMENT ON COLUMN public.reporte_fotos.nota_admin IS
  'Admin note/feedback on photo. Shown to technician if retake needed.';
```

### 3. Admin comments on reports
```sql
CREATE TABLE public.reporte_comentarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id  uuid NOT NULL REFERENCES public.reportes (id) ON DELETE CASCADE,
  equipo_id   uuid REFERENCES public.equipos (id) ON DELETE SET NULL,
  autor_id    uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  contenido   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reporte_comentarios_reporte ON public.reporte_comentarios (reporte_id);

COMMENT ON TABLE public.reporte_comentarios IS
  'Admin comments on reports. Can be general (equipo_id=NULL) or per-equipment.';
```

### 4. RLS for new table
```sql
ALTER TABLE public.reporte_comentarios ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "Admins full access comentarios"
  ON public.reporte_comentarios FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'admin')
  );

-- Technicians: read-only (see admin feedback)
CREATE POLICY "Tecnicos read comentarios"
  ON public.reporte_comentarios FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol IN ('tecnico', 'ayudante'))
  );
```

## TypeScript Type Changes

### src/types/index.ts additions
```typescript
// Photo review status
export type FotoEstatusRevision = 'pendiente' | 'aceptada' | 'rechazada' | 'retomar';

// Update ReporteFoto — add to existing interface
//   estatus_revision: FotoEstatusRevision;
//   nota_admin: string | null;

// New: Report comments
export interface ReporteComentario {
  id: string;
  reporte_id: string;
  equipo_id: string | null;
  autor_id: string;
  contenido: string;
  created_at: string;
}
```

Note: ReporteFoto already has tipo_media (TipoMedia) from migration-07 and existing fields. We only ADD estatus_revision and nota_admin. Equipo already has Phase 8 fields (capacidad, refrigerante, voltaje, fase, ubicacion). Reporte already has llegada_completada, sitio_completado. ReporteEquipo already has registro_completado.

## Implementation Plans

---

### Plan 09-01: Database Migration + Types + Cascade Delete Actions (~35 min)

**Files:**
- NEW: `supabase/migration-09-admin-control.sql`
- MODIFY: `src/types/index.ts` — add FotoEstatusRevision, ReporteComentario, update ReporteFoto
- NEW: `src/app/actions/admin-delete.ts` — cascade delete server actions
- MODIFY: `src/app/actions/reportes.ts` — add adminUpdateStep, adminUpdateEquipmentInfo
- MODIFY: `src/app/actions/fotos.ts` — add adminFlagPhoto, adminDeletePhoto, adminAddPhotoNote

**Server Actions in admin-delete.ts:**

1. `adminDeleteReport(reporteId: string)` — cascade deletes report + all children + storage cleanup
2. `adminDeleteFolio(folioId: string)` — cascade deletes folio + all reports within
3. `adminDeleteEquipo(equipoId: string)` — detach from reports + delete equipo
4. `adminDeleteSucursal(sucursalId: string)` — cascade: folios → reports → then sucursal

Each action:
- Verifies admin role
- Fetches all photo URLs for storage cleanup
- Deletes in correct order (leaves → root)
- Uses a transaction-like pattern (delete children first)
- Revalidates affected paths

**Server Actions added to reportes.ts:**

5. `adminUpdateStep(reportePasoId: string, formData)` — update lecturas, notas, completado on any step
6. `adminUpdateEquipmentInfo(equipoId: string, formData)` — update marca, modelo, numero_serie, tipo_equipo directly on equipos table

**Server Actions added to fotos.ts:**

7. `adminFlagPhoto(fotoId: string, estatus: FotoEstatusRevision, nota?: string)` — set review status + optional note
8. `adminUploadPhoto(formData)` — admin can upload a photo to a report (no camera overlay, just file upload)

---

### Plan 09-02: Delete UI — Folios, Reportes, Equipos, Sucursales (~30 min)

**Files:**
- NEW: `src/components/admin/cascade-delete-button.tsx` (~80 LOC) — enhanced delete button with impact summary + type-to-confirm
- MODIFY: `src/app/admin/folios/page.tsx` — add delete button per folio row
- MODIFY: `src/app/admin/folios/[id]/page.tsx` — add delete button in folio detail
- MODIFY: `src/app/admin/reportes/page.tsx` — add delete button per report row
- MODIFY: `src/app/admin/reportes/[reporteId]/report-detail.tsx` — add delete button in header
- MODIFY: `src/app/admin/equipos/[sucursalId]/page.tsx` — update delete to use cascade action
- MODIFY: `src/app/admin/sucursales/page.tsx` — update delete to use cascade action

**CascadeDeleteButton component:**
- Shows impact summary before confirm ("Este folio tiene 3 reportes con 47 fotos. Se eliminarán todos.")
- Requires typing entity name/number for high-impact deletes (folios with reports, sucursales with data)
- Uses the cascade delete actions from Plan 09-01
- Shows progress indicator during multi-step cascade delete

**Implementation pattern:**
```tsx
<CascadeDeleteButton
  entityType="folio"
  entityId={folio.id}
  entityLabel={folio.numero_folio}
  action={adminDeleteFolio}
  impactSummary={`${reportCount} reportes, ${photoCount} fotos`}
  requireTypedConfirmation={reportCount > 0}
/>
```

---

### Plan 09-03: Photo Management — Delete, Flag, Upload from Admin (~45 min)

**Files:**
- NEW: `src/components/admin/admin-photo-card.tsx` (~150 LOC) — photo with flag/delete/note actions
- NEW: `src/components/admin/admin-photo-upload.tsx` (~120 LOC) — file input upload for admin (no camera overlay)
- MODIFY: `src/app/admin/reportes/[reporteId]/report-detail.tsx` — replace PhotoGrid with AdminPhotoGrid, add upload button

**AdminPhotoCard component:**
- Displays photo with current review status badge (pendiente/aceptada/rechazada/retomar)
- Status dropdown to change flag
- Note input field (shown on flag change, especially for "retomar")
- Delete button with confirmation
- Lightbox on click (full-size view)
- Color-coded border: green=aceptada, red=rechazada, yellow=retomar, gray=pendiente

**AdminPhotoUpload component:**
- Standard file input (accept="image/*")
- Allows selecting equipo_id and etiqueta from dropdowns
- Optionally link to a reporte_paso_id
- Compresses using same browser-image-compression pipeline
- Uploads to Supabase storage with same path convention

**Changes to report-detail.tsx PhotoGrid:**
- Each photo now shows flag status badge
- Hover/tap reveals action buttons (flag, delete, add note)
- "Agregar foto" button appears at end of each photo section

---

### Plan 09-04: Edit Workflow Steps + Equipment Info from Report Detail (~40 min)

**Files:**
- NEW: `src/components/admin/admin-step-editor.tsx` (~180 LOC) — inline editor for step readings/notes
- NEW: `src/components/admin/admin-equipment-info-editor.tsx` (~130 LOC) — quick-edit for marca/modelo/serie/tipo
- MODIFY: `src/app/admin/reportes/[reporteId]/report-detail.tsx` — integrate step editor and equipment info editor

**AdminStepEditor component:**
- Expands from StepRow when admin clicks "Editar" on any step
- Shows all lecturas as editable inputs (pre-filled with current values)
- Shows notas as editable textarea
- Toggle completado status
- Save button calls adminUpdateStep
- Cancel returns to read-only view

**AdminEquipmentInfoEditor component:**
- Triggered from equipment card header area (new "Editar equipo" link)
- Inline form with: marca, modelo, numero_serie, tipo_equipo, capacidad, refrigerante, voltaje, fase, ubicacion (all current Equipo fields)
- Uses existing constants from Phase 8: nameplate-options.ts (refrigerantes, voltajes) and ubicaciones.ts
- Saves directly to equipos table via adminUpdateEquipmentInfo
- Changes reflect immediately in the card header

**Integration in report-detail.tsx:**
- StepRow gets an "Editar" button (only visible to admin)
- EquipmentCard header gets "Editar equipo" link next to existing "Editar" (which edits report-level fields)
- Both use the same visual pattern as existing EquipmentEditForm

---

### Plan 09-05: Admin Comments System (~30 min)

**Files:**
- NEW: `src/components/admin/comment-section.tsx` (~140 LOC) — comment list + add form
- MODIFY: `src/app/actions/admin-comments.ts` — new file with addComment, deleteComment actions
- MODIFY: `src/app/admin/reportes/[reporteId]/page.tsx` — fetch comments and pass to detail
- MODIFY: `src/app/admin/reportes/[reporteId]/report-detail.tsx` — render comment section

**CommentSection component:**
- Appears at bottom of report detail and optionally per equipment card
- Shows existing comments with author name, timestamp, and content
- "Agregar comentario" textarea + submit button
- Delete button on own comments (admin can delete any)
- Scope selector: "General" or per-equipment dropdown

**Server Actions (admin-comments.ts):**
1. `addAdminComment(reporteId, contenido, equipoId?)` — insert comment
2. `deleteAdminComment(comentarioId)` — admin-only delete

**Technician visibility:**
- Comments are visible to technicians in their report view (read-only)
- Flagged photos with notes show in technician view with admin feedback
- This creates the communication loop: admin flags → tech sees → tech retakes

---

### Plan 09-06: Technician-Side Feedback Visibility (~25 min)

**Files:**
- MODIFY: `src/app/tecnico/reporte/[reporteId]/page.tsx` — fetch photo statuses and admin comments
- NEW: `src/components/tecnico/admin-feedback-banner.tsx` (~60 LOC) — shows flagged items needing attention
- MODIFY: `src/components/tecnico/evidence-stage-section.tsx` — show flag status on tech's own photos

**AdminFeedbackBanner component:**
- Appears at top of technician's report page if any items are flagged
- "X fotos necesitan ser retomadas" with list of which steps/equipment
- Links directly to the relevant evidence stage to retake
- Dismissable but returns if unresolved

**Evidence stage section changes:**
- Photos taken by tech show small status badge (✓ aceptada, ✗ rechazada, ↻ retomar)
- "Retomar" photos show the admin's note explaining why
- "Retomar" triggers the camera for that specific stage again

---

## Verification Criteria

1. Admin can delete a folio with reports → all reports, photos (storage + DB), materials, steps cascade-deleted
2. Admin can delete a report → all children cleaned up including storage
3. Admin can delete an equipo that has report references → equipo detached and deleted
4. Admin can delete a sucursal with folios → full cascade works
5. High-impact deletes require typed confirmation
6. Admin can flag any photo as accepted/rejected/retomar with a note
7. Admin can delete any individual photo (storage + DB)
8. Admin can upload a photo to any report from admin side
9. Admin can edit any workflow step's readings and notes
10. Admin can edit equipment info (marca, modelo, serie, tipo) directly from report detail
11. Admin can add comments to reports (general or per-equipment)
12. Technician sees flagged photos and admin comments in their view
13. Technician sees "retomar" items with admin notes explaining why
14. All delete actions properly clean up Supabase storage files

## File Impact Summary

Current codebase: 108 files, 19,265 LOC TypeScript/TSX, plus SQL migrations.

| Type | Files | Est. LOC |
|------|-------|----------|
| New files | 9 | ~960 |
| Modified files | 12 | ~400 changes |
| Migration | 1 | ~50 |
| **Total** | **22** | **~1,410** |

## Implementation Order

```
Plan 09-01 (DB + types + actions)     ██████████████  35 min
Plan 09-02 (Delete UI)                ████████████    30 min
Plan 09-03 (Photo management)         ██████████████████  45 min
Plan 09-04 (Step + equipment edit)    ████████████████  40 min
Plan 09-05 (Comments system)          ████████████    30 min
Plan 09-06 (Tech feedback visibility) ██████████      25 min
                                      ─────────────────────
                                      Total: ~3.5 hours
```
