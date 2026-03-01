# HVAC Daily Report Generator

## What This Is

A progressive web app that lets HVAC technicians submit professional daily maintenance reports from their phone — replacing the current fragmented WhatsApp workflow of photos, voice notes, and messages. Admins manage branches, equipment, work orders (folios), and clients, then review, edit, and export reports as branded PDFs. The entire user-facing system is in Spanish.

## Core Value

Field technicians can quickly submit complete daily reports (with photos, equipment details, materials, and diagnostics) from their phone on-site — no WhatsApp, no paper, no back-and-forth.

## Requirements

### Validated

<!-- Code written and functional (Phases 2-5). Ship to production to fully validate. -->

- [x] Admin can create and manage branches (nombre, numero, direccion)
- [x] Admin can create and manage equipment per branch (etiqueta, marca, modelo, serie, tipo)
- [x] Admin can create and manage clients (nombre, logo)
- [x] Admin can create folios assigned to a branch, client, and team of users
- [x] Admin can create technician/helper accounts
- [x] Technician can log in from mobile and see assigned folios
- [x] Technician can fill daily report: select equipment, work type, structured workflows
- [x] Technician can add new equipment from the field (admin reviews later)
- [x] Technician can attach photos via in-app camera with visible metadata overlay (location, time, date)
- [x] Technician can upload photos from gallery
- [x] Technician can log materials used (cantidad, unidad, descripcion)
- [x] Technician can set report status: En Progreso / En Espera / Completado
- [x] Digital signature capture from client's on-site branch manager (required only on Completado)
- [x] Multiple team members (cuadrilla) contribute to one shared daily report per folio
- [x] Admin can view all submitted reports
- [x] Admin can edit/overwrite any field in any report
- [x] Admin can finalize and approve reports
- [x] PDF export with company logo + client logo/name, clean professional format

### Active

- [ ] Middleware auth guard working correctly (next build produces working middleware)
- [ ] PWA installable on mobile devices (manifest + icons)
- [ ] Service worker caching for fast load on weak signal
- [ ] Offline fallback page in Spanish
- [ ] Step-by-step deployment guide for Supabase + Vercel setup
- [ ] Seed data script for QA testing

### Out of Scope

- Multi-day job linking — V2 (daily reports with "En Progreso" status sufficient for V1)
- GPS arrival/departure tracking — V3
- Full offline mode — V4 (techs have connectivity at branches)
- Enhanced admin dashboard with analytics — V5
- OAuth/social login — email/password sufficient
- Photo markup/annotation — defer unless trivial
- Real-time chat — WhatsApp fills this role already
- Formal cuadrilla management entity — V2 (V1 uses multi-assign on folios directly)
- Formal equipment approval workflow — V1 flags tech-added equipment, admin cleans up manually

## Context

**Business structure:** HVAC subcontractor. Sometimes deals through a middleman company, sometimes directly with the contractor. The app must work for both — the variable is simply which client the report is directed to.

**Current workflow being replaced:** Technicians use a third-party photo stamping app to take GPS/time/date-stamped photos, then send them to a WhatsApp group. Management pieces together daily reports manually from these messages. There is no formal reporting system.

**Cuadrillas (crews):** Work is done in teams — typically one technician + one helper. Sometimes multiple technicians. The entire team contributes to one shared daily report per folio. Same crews often repeat, but can be mixed and matched.

**Equipment discovery:** Technicians sometimes arrive at a site without knowing what equipment exists. They need to register equipment on-the-fly from the field (tag, brand, model, serial, type). Admin reviews and cleans up later.

**Signature:** The digital signature comes from the client's on-site branch manager (e.g., the BBVA branch manager), not from the HVAC company's own supervisor. Only required when report status is "Completado."

**Scale:** Small team (2-5 technicians, <10 branches). Will grow over time.

**Language:** All user-facing UI, form fields, labels, messages, and PDF output in Spanish. Code, comments, and documentation in English.

## Constraints

- **Timeline**: ASAP — needs to be usable on real jobs within days
- **Tech stack**: Next.js (App Router) + Supabase (auth, DB, storage) + Tailwind CSS + Vercel
- **Mobile-first**: Technician side must work excellently on phone browsers
- **Non-technical users**: Technicians are not tech-savvy — large buttons, clear flows, minimal typing, dropdowns over free text
- **Spanish UI**: Entire user-facing system in Spanish
- **Photo metadata**: Must burn visible overlay (location, time, date) into photos — replaces external stamping app
- **Infrastructure**: Vercel and Supabase projects not yet created — must be set up first

## Current Milestone: v1.0 Launch Prep

**Goal:** Get V1 deployed to production and testable on real infrastructure — close remaining code gaps, write deployment playbook, generate seed data for QA.

**Target deliverables:**
- Phase 6 complete (middleware fix, PWA manifest, service worker, offline fallback, install prompt)
- Deployment guide (Supabase project, SQL migrations, env vars, Vercel deploy, first admin account)
- Seed data script (realistic test data for full QA flow)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-assign folios instead of cuadrilla entity | Simpler for V1 with small team; cuadrilla entity adds management overhead | ✓ Good |
| Techs can add equipment from field | Avoids bottleneck of waiting for admin; admin cleans up after | ✓ Good |
| In-app camera with metadata overlay | Replaces external stamping app + WhatsApp workflow entirely | ✓ Good |
| Build order: admin basics -> tech reporting -> admin review + PDF | Admin data needed first, but tech experience is the product | ✓ Good |
| One shared report per cuadrilla per folio per day | Team works together on same job; individual reports would duplicate info | ✓ Good |
| Client entity with name + logo | Supports flexible subcontractor/contractor relationships; shows on PDF | ✓ Good |
| Client-side PDF with @react-pdf/renderer | Avoids Vercel serverless memory/timeout limits | ✓ Good |
| getUserMedia for camera (not file input) | Android 14/15 broke file input capture | ✓ Good |
| SECURITY DEFINER for RLS role checks | Prevents infinite recursion in cross-table policies | ✓ Good |

---
*Last updated: 2026-03-01 after v1.0 Launch Prep milestone start*
