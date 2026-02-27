# Requirements: HVAC Daily Report Generator

**Defined:** 2026-02-23
**Core Value:** Field technicians can quickly submit complete daily reports (with photos, equipment details, materials, and diagnostics) from their phone on-site — no WhatsApp, no paper, no back-and-forth.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Users

- [ ] **AUTH-01**: Admin can log in with email and password
- [ ] **AUTH-02**: Technician can log in with email and password from mobile
- [ ] **AUTH-03**: Admin can create technician/helper accounts (no self-signup)
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

- [ ] **FOTO-01**: In-app camera capture with visible metadata overlay (GPS, time, date)
- [ ] **FOTO-02**: Upload photos from gallery
- [ ] **FOTO-03**: Photo labels (antes, despues, dano, placa, progreso)
- [ ] **FOTO-04**: Before/after photo pairing per equipment

### Signature

- [ ] **FIRM-01**: Digital signature capture from client's on-site branch manager
- [ ] **FIRM-02**: Signature required only when report status is Completado

### Admin Review

- [ ] **ADMN-01**: Admin can view all submitted reports (list with status, date, folio, branch)
- [ ] **ADMN-02**: Admin can edit/overwrite any field in any report
- [ ] **ADMN-03**: Admin can finalize and approve reports

### PDF Export

- [ ] **PDF-01**: Generate professional PDF with company logo + client logo/name
- [ ] **PDF-02**: PDF includes all report data, embedded photos with metadata, materials, signature

### PWA & Mobile

- [ ] **PWA-01**: Installable PWA (manifest + icons, Add to Home Screen)
- [ ] **PWA-02**: Mobile-first responsive design (large buttons, clear flows, works on cheap Android)
- [ ] **PWA-03**: App shell caching (loads fast on weak signal)

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
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| CLNT-01 | Phase 2 | Pending |
| SUCR-01 | Phase 2 | Pending |
| EQUP-01 | Phase 2 | Pending |
| EQUP-02 | Phase 3 | Complete |
| FOLI-01 | Phase 2 | Pending |
| FOLI-02 | Phase 2 | Pending |
| REPT-01 | Phase 3 | Complete |
| REPT-02 | Phase 3 | Complete |
| REPT-03 | Phase 3 | Complete |
| REPT-04 | Phase 3 | Complete |
| REPT-05 | Phase 3 | Complete |
| REPT-06 | Phase 3 | Complete |
| REPT-07 | Phase 3 | Complete |
| FOTO-01 | Phase 4 | Pending |
| FOTO-02 | Phase 4 | Pending |
| FOTO-03 | Phase 4 | Pending |
| FOTO-04 | Phase 4 | Pending |
| FIRM-01 | Phase 4 | Pending |
| FIRM-02 | Phase 4 | Pending |
| ADMN-01 | Phase 5 | Pending |
| ADMN-02 | Phase 5 | Pending |
| ADMN-03 | Phase 5 | Pending |
| PDF-01 | Phase 5 | Pending |
| PDF-02 | Phase 5 | Pending |
| PWA-01 | Phase 1 | Pending |
| PWA-02 | Phase 1 | Pending |
| PWA-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-27 after Phase 3 completion*
