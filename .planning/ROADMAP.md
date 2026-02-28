# Roadmap: HVAC Daily Report Generator

## Overview

This roadmap delivers a PWA that replaces WhatsApp-based HVAC field reporting with structured daily reports. The build order follows the data dependency chain: auth and infrastructure first, then admin data entry (clients, branches, equipment, folios), then the technician reporting form, then the high-risk photo capture and signature pipeline, and finally admin review with PDF export. The entire user-facing system is in Spanish.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, database schema, PWA shell, role-based routing
- [x] **Phase 2: Admin Data Management** - CRUD for clients, branches, equipment, folios
- [x] **Phase 3: Technician Reporting** - Daily report form with equipment entries, materials, status, shared cuadrilla reports
- [x] **Phase 3.5: Guided Maintenance Workflows** - INSERTED - Structured step-by-step preventive workflows and corrective issue picker replacing free-text reporting
- [ ] **Phase 4: Photo Capture & Signatures** - Camera with GPS overlay, gallery upload, photo labels, digital signature
- [ ] **Phase 5: Admin Review & PDF Export** - Report list, edit/approve workflow, branded PDF generation

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
  3. Reading inputs handle text, Sí/No toggle, and numeric modes with real-time yellow range validation (non-blocking)
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
- [ ] 04-01-PLAN.md — Camera capture infrastructure: npm deps, Storage migration, GPS/stamper/uploader libs, fullscreen camera component, source picker
- [ ] 04-02-PLAN.md — Photo integration: wire label buttons in workflow steps and corrective issues, gallery upload, thumbnails, photo management
- [ ] 04-03-PLAN.md — Digital signature capture (signature_pad) with landscape lock and Completado enforcement gate

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
**Plans**: TBD

Plans:
- [ ] 05-01: Admin report list with filters and report detail view
- [ ] 05-02: Admin edit/overwrite and approve workflow
- [ ] 05-03: Client-side PDF generation with @react-pdf/renderer (branded, photos, signature)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/3 | In progress | - |
| 2. Admin Data Management | 2/2 | Complete | 2026-02-27 |
| 3. Technician Reporting | 3/3 | Complete | 2026-02-27 |
| 3.5. Guided Maintenance Workflows | 1/1 | Complete | 2026-02-27 |
| 4. Photo Capture & Signatures | 0/3 | Not started | - |
| 5. Admin Review & PDF Export | 0/3 | Not started | - |

---
*Roadmap created: 2026-02-23*
*Last updated: 2026-02-27*
