# Roadmap: HVAC Daily Report Generator

## Overview

This roadmap delivers a PWA that replaces WhatsApp-based HVAC field reporting with structured daily reports. The build order follows the data dependency chain: auth and infrastructure first, then admin data entry (clients, branches, equipment, folios), then the technician reporting form, then the high-risk photo capture and signature pipeline, and finally admin review with PDF export. The v1.0 Launch Prep milestone adds foundation completion, PWA installability, deployment documentation, and seed data for QA. The entire user-facing system is in Spanish.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, database schema, PWA shell, role-based routing
- [x] **Phase 2: Admin Data Management** - CRUD for clients, branches, equipment, folios
- [x] **Phase 3: Technician Reporting** - Daily report form with equipment entries, materials, status, shared cuadrilla reports
- [x] **Phase 3.5: Guided Maintenance Workflows** - INSERTED - Structured step-by-step preventive workflows and corrective issue picker replacing free-text reporting
- [x] **Phase 4: Photo Capture & Signatures** - Camera with GPS overlay, gallery upload, photo labels, digital signature
- [x] **Phase 5: Admin Review & PDF Export** - Report list, edit/approve workflow, branded PDF generation
- [x] **Phase 5.5: Step-Centric Evidence Redesign** - INSERTED - Technician evidence UI deduplication + PDF restructure with step-organized layout
- [ ] **Phase 6: Foundation Completion & PWA** - Middleware fix, PWA manifest, service worker, offline fallback, install prompt, tech debt cleanup
- [ ] **Phase 7: Deployment Guide & Seed Data** - Step-by-step deployment playbook and realistic seed data for QA testing
- [x] **Phase 8: Arrival, Site Overview & Equipment Registration** - Pre-maintenance gated phases: arrival photo (PPE evidence), site panoramic, equipment nameplate registration with photos and data fields
- [x] **Phase 9: Admin Full Control** - INSERTED - Cascade delete for all entities, photo management (delete/flag/upload), edit workflow steps and equipment info from report detail, admin comments system, technician feedback visibility
- [ ] **Phase 10: Feature Expansion** - Report revisions with audit trail, PDF comment-photo pairing, photo annotation/drawing, fan coil workflow templates, custom "Otro" steps for all equipment types
- [ ] **Phase 11: Photo Export & Device Save** - PLANNED - ZIP photo package download, save-to-device, PDF photo optimization

## Phase Details

### Phase 1: Foundation
**Goal**: Admin and technician can log in, see role-appropriate UI, and install the app on their phone
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, PWA-01, PWA-02, PWA-03
**Success Criteria** (what must be TRUE):
  1. Admin can log in with email/password and land on an admin dashboard shell (Spanish UI)
  2. Admin can create a technician account, and that technician can log in from a mobile browser and see a technician-specific view
  3. Unauthorized users cannot access admin routes; technicians cannot see admin pages and vice versa
  4. The app can be installed to a phone's home screen via "Add to Home Screen" and loads quickly on weak signal
  5. Database schema is deployed with all tables and RLS policies using SECURITY DEFINER helper functions
**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Next.js 16 scaffold, Tailwind v4, Supabase clients, database schema SQL with RLS
- [ ] 01-02-PLAN.md — Auth system (proxy, server actions, login pages, user management)
- [ ] 01-03-PLAN.md — App shells (admin sidebar, technician tabs) and PWA (manifest, service worker, offline)

### Phase 2: Admin Data Management
**Goal**: Admin can create and manage all reference data that technician reporting depends on
**Depends on**: Phase 1
**Requirements**: CLNT-01, SUCR-01, EQUP-01, FOLI-01, FOLI-02
**Success Criteria** (what must be TRUE):
  1. Admin can create, edit, and view clients with name and logo upload
  2. Admin can create, edit, and delete branches (nombre, numero, direccion) and see a list of all branches
  3. Admin can create, edit, and delete equipment per branch (etiqueta, marca, modelo, serie, tipo)
  4. Admin can create folios assigned to a branch and client, and assign multiple users (cuadrilla) to that folio
  5. All admin forms validate input with Spanish error messages
**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md — Shared infrastructure (Zod, UI components, storage SQL), client CRUD with logo upload, branch CRUD with delete
- [x] 02-02-PLAN.md — Equipment CRUD (per-branch with global view) and folio management with cuadrilla assignment

### Phase 3: Technician Reporting
**Goal**: Technicians can create and submit complete daily reports from their phone (text content, equipment entries, materials -- no photos or signatures yet)
**Depends on**: Phase 2
**Requirements**: REPT-01, REPT-02, REPT-03, REPT-04, REPT-05, REPT-06, REPT-07, EQUP-02
**Success Criteria** (what must be TRUE):
  1. Technician sees a list of folios assigned to them and can tap into one to create or continue a daily report
  2. Technician can add per-equipment entries with work type (preventivo/correctivo), diagnostico, trabajo realizado, and observaciones
  3. Technician can add new equipment from the field (flagged for admin review) without leaving the report flow
  4. Technician can log materials used (cantidad, unidad, descripcion) with add/remove rows
  5. Technician can set report status (En Progreso / En Espera / Completado) and submit
  6. Multiple cuadrilla members see and contribute to the same shared daily report for a given folio
  7. When returning to a multi-day folio, equipment list pre-populates from the previous day's report
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — DB migration (unique constraint, RLS fix, Realtime), Zod validation schemas, all report server actions
- [x] 03-02-PLAN.md — Folio list, folio detail, report page, report form shell with Realtime, equipment section with add-from-field
- [x] 03-03-PLAN.md — Materials log section, status/submit section, report form integration

### Phase 3.5: Guided Maintenance Workflows (INSERTED)
**Goal**: Replace free-text diagnostico/trabajo_realizado with structured workflow steps that guide technicians through preventive and corrective maintenance
**Depends on**: Phase 3
**Success Criteria** (what must be TRUE):
  1. Preventive workflow loads step templates from plantillas_pasos matching equipment type and displays expandable step cards with procedure, photo placeholders, reading inputs, and completion toggle
  2. Corrective workflow loads issues from fallas_correctivas matching equipment type and displays multi-select picker with detail cards
  3. Reading inputs handle text, Si/No toggle, and numeric modes with real-time yellow range validation (non-blocking)
  4. Equipment with tipo "otro" or no matching templates falls back to free-text textareas
  5. Add-equipment modal uses tipos_equipo dropdown instead of free-text tipo_equipo input
  6. Step progress auto-saves on completion toggle
**Plans:** 1 plan

Plans:
- [x] 03.5-01-PLAN.md — Types, validations, server actions, reading input, step card, preventive/corrective workflows, integration

### Phase 4: Photo Capture & Signatures
**Goal**: Technicians can capture GPS/time-stamped photos and collect client signatures directly in the report -- replacing the external stamping app entirely
**Depends on**: Phase 3
**Requirements**: FOTO-01, FOTO-02, FOTO-03, FOTO-04, FIRM-01, FIRM-02
**Success Criteria** (what must be TRUE):
  1. Technician can open the in-app camera, take a photo, and see GPS coordinates + date + time burned into the image as a visible overlay
  2. Technician can upload photos from their gallery (with metadata overlay applied if GPS/time available)
  3. Technician can label photos (antes, despues, dano, placa, progreso) and pair before/after photos per equipment
  4. Client's on-site branch manager can draw a signature on the phone screen, and it saves to the report
  5. Signature is required only when setting report status to Completado; other statuses allow submission without signature
**Plans:** 3 plans

Plans:
- [x] 04-01-PLAN.md — Camera capture infrastructure: npm deps, Storage migration, GPS/stamper/uploader libs, fullscreen camera component, source picker
- [x] 04-02-PLAN.md — Photo integration: wire label buttons in workflow steps and corrective issues, gallery upload, thumbnails, photo management
- [x] 04-03-PLAN.md — Digital signature capture (signature_pad) with landscape lock and Completado enforcement gate

### Phase 5: Admin Review & PDF Export
**Goal**: Admin can review, edit, approve reports and export professional branded PDFs -- completing the documentation chain
**Depends on**: Phase 4
**Requirements**: ADMN-01, ADMN-02, ADMN-03, PDF-01, PDF-02
**Success Criteria** (what must be TRUE):
  1. Admin can view a list of all submitted reports filterable by status, date, folio, and branch
  2. Admin can open any report and edit/overwrite any field (equipment entries, materials, notes, status)
  3. Admin can finalize and approve a report, changing its status to a terminal approved state
  4. Admin can export a report as a professional PDF containing company logo, client logo/name, all equipment entries, embedded photos with metadata, materials table, and signature
  5. PDF renders correctly with Spanish characters (accents, tildes) and looks professional when printed
**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md — Report list with URL-based filters, report detail page with complete read-only view (equipment, photos, materials, signature)
- [x] 05-02-PLAN.md — Admin inline edit for equipment entries and materials, report approval action with finalizado_por_admin
- [x] 05-03-PLAN.md — @react-pdf/renderer PDF generation: Inter fonts, photo pre-fetch as base64, professional document layout, export button

### Phase 5.5: Step-Centric Evidence Redesign (INSERTED)
**Goal**: Redesign technician evidence capture UI and PDF report to be step-centric — each maintenance step becomes a self-contained card with inline evidence, structured readings tables, and guidance text
**Depends on**: Phase 5
**Requirements**: UIEV-01, UIEV-02, UIEV-03, PDFD-01, PDFD-02, PDFD-03, PDFD-04, PDFD-05, PDFD-06, PIPE-01, PIPE-02, PIPE-03, ADVW-01
**Success Criteria** (what must be TRUE):
  1. Each preventive workflow step shows deduplicated stage sections with guidance text and single photo button per stage (no more duplicate buttons)
  2. Corrective issues use the same stage-section evidence pattern
  3. PDF shows each step as a distinct block with inline readings table, notes, and photos grouped by stage
  4. Readings table displays parameter/value/range/status with out-of-range indicators
  5. Summary bar on page 1 shows at-a-glance overview counts
  6. Photos carry reporte_paso_id through data pipeline to PDF; orphan photos have fallback section
  7. Admin report detail shows photos inline with steps for consistency
**Plans:** 1 plan

Plans:
- [x] 05.5-01-PLAN.md — Shared EvidenceStageSection component, workflow card redesign, PDF data pipeline restructure, full PDF rewrite, admin detail update

### Phase 6: Foundation Completion & PWA
**Goal**: Close all remaining v1 gaps — fix middleware auth guard, add PWA installability, service worker caching, and offline fallback
**Depends on**: Phase 5 (all feature code exists; this phase adds infrastructure)
**Requirements**: AUTH-04, PWA-01, PWA-02, PWA-03, CLEN-01
**Gap Closure**: Closes all gaps from v1-MILESTONE-AUDIT.md
**Success Criteria** (what must be TRUE):
  1. `src/middleware.ts` exists and re-exports proxy as default — `next build` produces working middleware with auth guards
  2. The app can be installed to a phone's home screen via "Add to Home Screen" (manifest + icons)
  3. The app shows a Spanish offline fallback page when network is unavailable
  4. The app loads quickly on weak signal thanks to service worker precaching
  5. An install prompt banner appears when the browser detects installability
  6. The `exifr` unused dependency is removed from package.json
**Plans:** 1 plan

Plans:
- [ ] 06-01-PLAN.md — Middleware fix, Serwist PWA setup (manifest, service worker, offline fallback, icons, install prompt), cleanup

### Phase 7: Deployment Guide & Seed Data
**Goal**: The project can be deployed from scratch to production by following a single guide, and QA can test the full reporting flow with realistic seed data
**Depends on**: Phase 6 (all code and infrastructure complete; this phase documents deployment and provides test data)
**Requirements**: DEPL-01, DEPL-02, SEED-01, SEED-02
**Success Criteria** (what must be TRUE):
  1. A developer can follow the deployment guide to create a Supabase project, run all SQL migrations in the documented order, and see the full schema deployed with no errors
  2. A developer can configure env vars, deploy to Vercel, and access the running application at a public URL
  3. A developer can create the first admin account following the guide instructions and log in successfully
  4. Running the seed data script populates the database with realistic test data covering all entity types (clients with logos, branches, equipment across types, users in all roles, folios with crew assignments)
  5. Seed data includes complete report examples across all three statuses (en_progreso, en_espera, completado) with equipment entries, materials, photo references, and a signature on the completed report
**Plans:** 2 plans

Plans:
- [ ] 07-01-PLAN.md — Deployment guide: Supabase project creation, SQL migration execution order with dependencies, env var configuration, Vercel deployment, first admin account creation
- [ ] 07-02-PLAN.md — Seed data SQL script: realistic test data for clients, branches, equipment, users, folios, and complete reports across all statuses

### Phase 8: Arrival, Site Overview & Equipment Registration
**Goal**: Add a three-layer evidence chain BEFORE maintenance work begins — arrival photo (tech in PPE), site panoramic, and equipment nameplate registration with photos and data
**Depends on**: Phase 5.5 (requires existing report form, photo capture, and workflow infrastructure)
**Requirements**: ARRV-01, ARRV-02, SITE-01, EREG-01, EREG-02, EREG-03, EREG-04, EREG-05
**Success Criteria** (what must be TRUE):
  1. Tech opens a report and sees the arrival phase first — cannot access anything below until arrival photo is taken
  2. After arrival photo, site overview phase unlocks — if this folio already has a site photo from a previous report, it auto-completes
  3. After site overview, equipment registration phase shows all equipment in the folio with photo slots and nameplate fields
  4. Empty fields from equipos table are highlighted; pre-filled fields show existing data
  5. Tech can take overall and placa photos per equipment using existing camera infrastructure
  6. When tech fills nameplate data, it writes back to equipos table immediately (so future reports see the data)
  7. After ALL equipment registered (photos + data), maintenance phase unlocks with existing workflow
  8. Step 2 of preventive workflows no longer duplicates nameplate data capture
  9. PDF includes arrival photo, site photo, and equipment registration block before maintenance steps
  10. Admin can see and edit new equipment fields (capacidad, refrigerante, voltaje, fase, ubicacion)
  11. Ubicacion dropdown shows ATM, PATIO, BOVEDA, TREN DE CAJA, OTRO options
**Plans:** 5 plans

Plans:
- [x] 08-01-PLAN.md — Database migration + types + constants
- [x] 08-02-PLAN.md — Server actions for registration flow
- [x] 08-03-PLAN.md — Registration UI components (arrival, site, equipment cards)
- [x] 08-04-PLAN.md — Report form integration with gating logic
- [x] 08-05-PLAN.md — Workflow seed update + PDF + admin updates

### Phase 9: Admin Full Control (INSERTED)
**Goal**: Give admins complete CRUD control over every entity — cascade deletes, photo management, step/equipment editing, commenting, and feedback loop with technicians
**Depends on**: Phase 5.5 (admin report detail view, photo infrastructure). Compatible with Phase 8 additions.
**Success Criteria** (what must be TRUE):
  1. Admin can delete a folio with reports — all reports, photos (storage + DB), materials, steps cascade-deleted
  2. Admin can delete a report — all children cleaned up including storage
  3. Admin can delete an equipo that has report references — equipo detached and deleted
  4. Admin can delete a sucursal with folios — full cascade works
  5. High-impact deletes require typed confirmation
  6. Admin can flag any photo as accepted/rejected/retomar with a note
  7. Admin can delete any individual photo (storage + DB)
  8. Admin can upload a photo to any report from admin side
  9. Admin can edit any workflow step's readings and notes
  10. Admin can edit equipment info (marca, modelo, serie, tipo) directly from report detail
  11. Admin can add comments to reports (general or per-equipment)
  12. Technician sees flagged photos and admin comments in their view
  13. Technician sees "retomar" items with admin notes explaining why
**Plans:** 6 plans

Plans:
- [x] 09-01-PLAN.md — Database migration + types + cascade delete actions
- [x] 09-02-PLAN.md — Delete UI for folios, reportes, equipos, sucursales
- [x] 09-03-PLAN.md — Photo management: delete, flag, upload from admin
- [x] 09-04-PLAN.md — Edit workflow steps + equipment info from report detail
- [x] 09-05-PLAN.md — Admin comments system
- [x] 09-06-PLAN.md — Technician-side feedback visibility

### Phase 10: Feature Expansion
**Goal**: Add report revisions with audit trail, PDF comment-photo pairing, photo annotation/drawing tool, fan coil preventive maintenance workflows, and custom "Otro" steps for all equipment types
**Depends on**: Phase 9 (admin editing, photo management, comments system)
**Success Criteria** (what must be TRUE):
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
**Plans:** 7 plans

Plans:
- [ ] 10-01-PLAN.md — Database migration + types (reporte_revisiones, revision_actual, nombre_custom, etiqueta constraint)
- [ ] 10-02-PLAN.md — Report revision system (server actions, UI, revision history panel)
- [ ] 10-03-PLAN.md — PDF comment-photo pairing (notes below photos, admin comments in PDF)
- [ ] 10-04-PLAN.md — Photo annotation component (canvas drawing, text labels, arrows, overwrite-in-place)
- [ ] 10-05-PLAN.md — Fan coil equipment type + workflow seeds (10 preventive steps, 11 corrective issues)
- [ ] 10-06-PLAN.md — Custom "Otro" step for all equipment types (nombre_custom, UI, PDF rendering)
- [ ] 10-07-PLAN.md — Integration, testing & cleanup

### Phase 11: Photo Export & Device Save (PLANNED)
**Goal**: Enable photo package downloads as organized ZIP files and individual photo save-to-device, with PDF optimization for thumbnails vs full-res
**Depends on**: Phase 10 (photo management infrastructure)
**Success Criteria** (what must be TRUE):
  1. Admin can download all photos for a report as an organized ZIP file
  2. Individual photos can be saved to device
  3. PDF uses optimized thumbnails; full-res available in ZIP
  4. ZIP structure mirrors report organization (by equipment/step)
  5. Download progress indicator for large photo sets
  6. Works on both desktop and mobile browsers
**Plans:** TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 3.5 -> 4 -> 5 -> 5.5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/3 | In progress | - |
| 2. Admin Data Management | 2/2 | Complete | 2026-02-27 |
| 3. Technician Reporting | 3/3 | Complete | 2026-02-27 |
| 3.5. Guided Maintenance Workflows | 1/1 | Complete | 2026-02-27 |
| 4. Photo Capture & Signatures | 3/3 | Complete | 2026-02-28 |
| 5. Admin Review & PDF Export | 3/3 | Complete | 2026-02-28 |
| 5.5. Step-Centric Evidence Redesign | 1/1 | Complete | 2026-03-01 |
| 6. Foundation Completion & PWA | 0/1 | Pending | - |
| 7. Deployment Guide & Seed Data | 0/2 | Pending | - |
| 8. Arrival, Site Overview & Equipment Registration | 5/5 | Complete | 2026-03-02 |
| 9. Admin Full Control | 6/6 | Complete | 2026-03-02 |
| 10. Feature Expansion | 0/7 | Pending | - |
| 11. Photo Export & Device Save | 0/TBD | Planned | - |

---
*Roadmap created: 2026-02-23*
*Last updated: 2026-03-02 after Phase 9 execution*
