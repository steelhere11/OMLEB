# Roadmap: HVAC Daily Report Generator

## Overview

This roadmap delivers a PWA that replaces WhatsApp-based HVAC field reporting with structured daily reports. The build order follows the data dependency chain: auth and infrastructure first, then admin data entry (clients, branches, equipment, folios), then the technician reporting form, then the high-risk photo capture and signature pipeline, and finally admin review with PDF export. The entire user-facing system is in Spanish.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Auth, database schema, PWA shell, role-based routing
- [ ] **Phase 2: Admin Data Management** - CRUD for clients, branches, equipment, folios
- [ ] **Phase 3: Technician Reporting** - Daily report form with equipment entries, materials, status, shared cuadrilla reports
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
**Plans**: TBD

Plans:
- [ ] 02-01: Client and branch CRUD pages with Server Components + Server Actions
- [ ] 02-02: Equipment CRUD (per-branch) and folio management with cuadrilla assignment

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
**Plans**: TBD

Plans:
- [ ] 03-01: Technician folio list, daily report creation, and report data model
- [ ] 03-02: Equipment entry form (select existing + add new from field) and materials log
- [ ] 03-03: Report status workflow, submission, shared cuadrilla access, and auto-draft

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
**Plans**: TBD

Plans:
- [ ] 04-01: Camera capture module (getUserMedia + canvas overlay + compression + Supabase Storage upload)
- [ ] 04-02: Gallery upload, photo labels, before/after pairing per equipment
- [ ] 04-03: Digital signature capture (react-signature-canvas) with Completado enforcement

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
| 1. Foundation | 0/3 | Planned | - |
| 2. Admin Data Management | 0/2 | Not started | - |
| 3. Technician Reporting | 0/3 | Not started | - |
| 4. Photo Capture & Signatures | 0/3 | Not started | - |
| 5. Admin Review & PDF Export | 0/3 | Not started | - |

---
*Roadmap created: 2026-02-23*
*Last updated: 2026-02-23*
