# Requirements: HVAC Daily Report Generator

**Defined:** 2026-02-23
**Core Value:** Field technicians can quickly submit complete daily reports (with photos, equipment details, materials, and diagnostics) from their phone on-site — no WhatsApp, no paper, no back-and-forth.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Users

- [x] **AUTH-01**: Admin can log in with email and password
- [x] **AUTH-02**: Technician can log in with email and password from mobile
- [x] **AUTH-03**: Admin can create technician/helper accounts (no self-signup)
- [ ] **AUTH-04**: Role-based access controls (admin sees admin UI, tecnico sees tech UI)

### Client Management

- [x] **CLNT-01**: Admin can create and edit clients (nombre, logo)

### Branch Management

- [x] **SUCR-01**: Admin can create, edit, and delete branches (nombre, numero, direccion)

### Equipment Management

- [x] **EQUP-01**: Admin can create, edit, and delete equipment per branch (etiqueta, marca, modelo, serie, tipo)
- [x] **EQUP-02**: Technician can add new equipment from the field (flagged for admin review)

### Folio / Work Order Management

- [x] **FOLI-01**: Admin can create folios assigned to branch, client, and description of problem
- [x] **FOLI-02**: Admin can assign multiple users (cuadrilla) to a folio

### Technician Reporting

- [x] **REPT-01**: Technician can view list of assigned folios
- [x] **REPT-02**: Per-equipment entries: work type (preventivo/correctivo), diagnostico, trabajo realizado, observaciones
- [x] **REPT-03**: Materials used log: cantidad, unidad, descripcion with add-row
- [x] **REPT-04**: Report status: En Progreso / En Espera / Completado
- [x] **REPT-05**: Multiple cuadrilla members contribute to one shared daily report per folio
- [x] **REPT-06**: Technician can submit completed report
- [x] **REPT-07**: Auto-draft from previous day (same folio pre-populates equipment list)

### Photos

- [x] **FOTO-01**: In-app camera capture with visible metadata overlay (GPS, time, date)
- [x] **FOTO-02**: Upload photos from gallery
- [x] **FOTO-03**: Photo labels (antes, despues, dano, placa, progreso)
- [x] **FOTO-04**: Before/after photo pairing per equipment

### Signature

- [x] **FIRM-01**: Digital signature capture from client's on-site branch manager
- [x] **FIRM-02**: Signature required only when report status is Completado

### Admin Review

- [x] **ADMN-01**: Admin can view all submitted reports (list with status, date, folio, branch)
- [x] **ADMN-02**: Admin can edit/overwrite any field in any report
- [x] **ADMN-03**: Admin can finalize and approve reports

### PDF Export

- [x] **PDF-01**: Generate professional PDF with company logo + client logo/name
- [x] **PDF-02**: PDF includes all report data, embedded photos with metadata, materials, signature

### PWA & Mobile

- [ ] **PWA-01**: Installable PWA (manifest + icons, Add to Home Screen)
- [ ] **PWA-02**: Mobile-first responsive design (large buttons, clear flows, works on cheap Android)
- [ ] **PWA-03**: App shell caching (loads fast on weak signal)

### Technician Evidence UI

- [x] **UIEV-01**: Preventive workflow step card shows deduplicated stage sections (one per etapa) with guidance bullets and single photo button per stage
- [x] **UIEV-02**: Corrective workflow issues use same stage-section evidence pattern
- [x] **UIEV-03**: Shared EvidenceStageSection component extracted for reuse across both workflows

### PDF Report Redesign

- [x] **PDFD-01**: PDF restructured with step-organized layout — each step as a distinct block with inline readings, notes, and photos
- [x] **PDFD-02**: Readings displayed in structured table with Parameter / Value / Range / Status columns and out-of-range warning indicators
- [x] **PDFD-03**: Summary bar on page 1 shows at-a-glance counts (equipos atendidos, pasos completados, fotos capturadas)
- [x] **PDFD-04**: Photos grouped by stage (ANTES / DURANTE / DESPUES) within each step block
- [x] **PDFD-05**: Page numbers on all pages (Pagina N de M)
- [x] **PDFD-06**: Equipment header card shows work type badge and step completion progress

### Data Pipeline

- [x] **PIPE-01**: Photo data pipeline carries reporte_paso_id through to PDF generation
- [x] **PIPE-02**: lecturas_requeridas metadata (range min/max/unit) fetched and available in PDF data
- [x] **PIPE-03**: Orphan photos (no reporte_paso_id) rendered in fallback section per equipment

### Admin View

- [x] **ADVW-01**: Admin report detail shows photos inline with their steps for consistency with PDF

## v1.0 Launch Prep Requirements

Requirements for getting V1 deployed and testable on real infrastructure.

### Deployment

- [ ] **DEPL-01**: Step-by-step deployment guide covering: create Supabase project, run all SQL migrations in correct order, configure env vars, deploy to Vercel, create first admin account
- [ ] **DEPL-02**: All SQL migration files documented with execution order and dependencies

### QA Support

- [ ] **SEED-01**: Seed data SQL script with realistic test data (clients with logos, branches, equipment, folios with crew assignments, users across all roles)
- [ ] **SEED-02**: Seed data includes complete report examples (equipment entries, materials, photo references, signatures) covering all statuses

### Cleanup

- [ ] **CLEN-01**: Remove unused `exifr` dependency from package.json

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: Admin receives in-app notification when report is submitted
- **NOTF-02**: Admin receives email notification when report is submitted

### Multi-day Job Linking

- **LINK-01**: Multi-day jobs connected with shared context across daily reports
- **LINK-02**: Combined multi-day report export option

### Cuadrilla Management

- **CREW-01**: Reusable cuadrilla entity (saved groups assigned with one click)

### Offline Mode

- **OFFL-01**: Full offline capability for technicians (local storage on device)
- **OFFL-02**: Auto-sync when connection returns
- **OFFL-03**: Conflict resolution for shared cuadrilla reports edited offline

### Enhanced Admin

- **DASH-01**: Admin dashboard with report status overview (branches x dates)
- **DASH-02**: Admin creates custom checklists per equipment type

### Additional Differentiators

- **DIFF-01**: Photo annotation/markup (draw on photos to highlight issues)
- **DIFF-02**: Voice-to-text for service notes (Spanish)
- **DIFF-03**: QR code equipment identification (scan to auto-fill)
- **DIFF-04**: Equipment report history (last 3 reports per unit)
- **DIFF-05**: Push notification reminders for missing reports

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Scheduling and dispatching | Separate product; admin assigns folios manually |
| Invoicing and payments | Billing is subcontractor-to-contractor, handled in separate accounting software |
| Full inventory management | V1 only tracks materials used per report, no stock levels |
| Customer portal / client self-service | Clients receive PDF reports, not a portal |
| GPS live technician tracking | Photo metadata stamps provide location proof without live tracking |
| Quoting and estimating | Pricing is pre-agreed in contracts, not generated in the field |
| CRM / sales pipeline | Small known client base; simple client registry is sufficient |
| AI-powered diagnostics | Value is in capture and reporting, not AI diagnosis |
| Multi-language support | All users are Spanish-speaking; hard-code Spanish UI |
| Time tracking / payroll | Separate HR/payroll concern; report has time fields for client benefit only |
| OAuth / social login | Email/password sufficient for admin-managed accounts |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 6 | Pending |
| CLNT-01 | Phase 2 | Complete |
| SUCR-01 | Phase 2 | Complete |
| EQUP-01 | Phase 2 | Complete |
| EQUP-02 | Phase 3 | Complete |
| FOLI-01 | Phase 2 | Complete |
| FOLI-02 | Phase 2 | Complete |
| REPT-01 | Phase 3 | Complete |
| REPT-02 | Phase 3 | Complete |
| REPT-03 | Phase 3 | Complete |
| REPT-04 | Phase 3 | Complete |
| REPT-05 | Phase 3 | Complete |
| REPT-06 | Phase 3 | Complete |
| REPT-07 | Phase 3 | Complete |
| FOTO-01 | Phase 4 | Complete |
| FOTO-02 | Phase 4 | Complete |
| FOTO-03 | Phase 4 | Complete |
| FOTO-04 | Phase 4 | Complete |
| FIRM-01 | Phase 4 | Complete |
| FIRM-02 | Phase 4 | Complete |
| ADMN-01 | Phase 5 | Complete |
| ADMN-02 | Phase 5 | Complete |
| ADMN-03 | Phase 5 | Complete |
| PDF-01 | Phase 5 | Complete |
| PDF-02 | Phase 5 | Complete |
| PWA-01 | Phase 6 | Pending |
| PWA-02 | Phase 6 | Pending |
| PWA-03 | Phase 6 | Pending |
| DEPL-01 | Phase 7 | Pending |
| DEPL-02 | Phase 7 | Pending |
| SEED-01 | Phase 7 | Pending |
| SEED-02 | Phase 7 | Pending |
| CLEN-01 | Phase 6 | Pending |
| UIEV-01 | Phase 5.5 | Complete |
| UIEV-02 | Phase 5.5 | Complete |
| UIEV-03 | Phase 5.5 | Complete |
| PDFD-01 | Phase 5.5 | Complete |
| PDFD-02 | Phase 5.5 | Complete |
| PDFD-03 | Phase 5.5 | Complete |
| PDFD-04 | Phase 5.5 | Complete |
| PDFD-05 | Phase 5.5 | Complete |
| PDFD-06 | Phase 5.5 | Complete |
| PIPE-01 | Phase 5.5 | Complete |
| PIPE-02 | Phase 5.5 | Complete |
| PIPE-03 | Phase 5.5 | Complete |
| ADVW-01 | Phase 5.5 | Complete |

**Coverage:**
- v1 requirements: 44 total (41 complete, 3 pending)
- v1.0 Launch Prep requirements: 5 total
- Total mapped to phases: 49
- Unmapped: 0

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-03-01 after Phase 5.5 completion*
