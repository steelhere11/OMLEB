# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Field technicians can quickly submit complete daily reports (with photos, equipment details, materials, and diagnostics) from their phone on-site -- no WhatsApp, no paper, no back-and-forth.
**Current focus:** Phase 08 (Arrival & Registration Flow) -- executing plan-by-plan.

## Current Position

Phase: 8 (Arrival & Registration Flow)
Plan: 4 of 5 in current phase
Status: In progress
Last activity: 2026-03-02 -- Completed 08-04-PLAN.md (Integration & Page Wiring)

Progress: [==================░░] 90% (19/21 plans complete)

## Performance Metrics

**Velocity (from V1 build + Phase 5.5):**
- Total plans completed: 19
- Average duration: ~6 min
- Total execution time: ~2.0 hours

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Decisions from V1 build carried forward -- see PROJECT.md for full list.

| ID | Decision | Phase |
|----|----------|-------|
| stage-dedup-pattern | Deduplicate evidence items by stage; combine descriptions as guidance bullets | 5.5 |
| orphan-photo-fallback | Photos without reporte_paso_id rendered in fallback section per equipment | 5.5 |
| pdf-fixed-header | PDF header fixed on all pages for multi-page reports | 5.5 |
| video-no-overlay | Videos skip GPS/date canvas burn; metadata stored in DB row | quick-001 |
| tipo-media-discriminator | tipo_media column (foto/video) on reporte_fotos with CHECK constraint | quick-001 |
| media-neutral-labels | UI labels changed to media-neutral Spanish: Evidencia, archivo(s), Agregar evidencia | quick-001 |
| html-overlay-not-canvas | Used HTML/CSS overlay on video instead of canvas.captureStream() to avoid audio sync and perf issues | quick-002 |
| as-const-dropdowns | Constants use 'as const' with value/label objects for typed dropdowns | 08-01 |
| nullable-nameplate-fields | Nameplate fields (capacidad, refrigerante, voltaje, fase, ubicacion) are nullable strings, not required | 08-01 |
| two-step-photo-query | Used two-step query (get report IDs, then IN query) for cross-folio photo lookups instead of Supabase inner join | 08-02 |
| shared-completeness-evaluator | Extracted evaluateRegistrationCompleteness as private helper shared between save and update actions | 08-02 |
| children-not-rendered-when-locked | PhaseGate does not render children when locked -- prevents unnecessary mounting and data fetching | 08-03 |
| debounced-text-immediate-select | Text inputs save on 800ms debounce, dropdowns/toggles save immediately for responsive UX | 08-03 |
| yellow-highlight-progressive | Empty fields get yellow highlight instead of red errors -- registration is progressive not form-submit | 08-03 |
| auto-complete-existing-folio-photo | SiteOverviewSection auto-completes on mount when folio-level site photo exists from previous visit | 08-03 |
| show-all-phases-completed | Completed reports bypass all gating and show all phases expanded | 08-04 |
| registration-entries-export-type | RegistrationEntry type exported from page.tsx and imported by report-form.tsx for cross-file type sharing | 08-04 |

### Pending Todos

- User must create Supabase project and run SQL files before auth can be tested with real credentials
- User must set env vars in .env.local with real Supabase credentials
- User must create first admin account in Supabase Dashboard
- User must run supabase/storage.sql in Supabase SQL Editor to create client logos bucket
- User must run supabase/migration-03-reporting.sql in Supabase SQL Editor after schema.sql and rls.sql
- User must run supabase/migration-workflows.sql in Supabase SQL Editor after schema.sql and rls.sql
- User must run supabase/seed-workflows.sql in Supabase SQL Editor after migration-workflows.sql
- User must run supabase/migration-04-photos.sql in Supabase SQL Editor after migration-workflows.sql
- User must add company logo to public/logo.png for PDF branding
- User must run supabase/migration-07-video-support.sql in Supabase SQL Editor after migration-04-photos.sql
- User must run supabase/migration-08-registration.sql in Supabase SQL Editor after migration-07-video-support.sql

### Blockers/Concerns

- [V1 Code]: ALL PHASES (2-5.5) COMPLETE. Phase 1 has 2/3 plans done, Phase 6 pending.
- [Infrastructure]: Supabase and Vercel projects not yet created.
- [Phase 7]: Deployment guide will consolidate all pending todos above into a single playbook.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Video support on technician side with same legend layout as photos | 2026-03-01 | bd71c83 | [001-video-support-technician-photo-layout](./quick/001-video-support-technician-photo-layout/) |
| 002 | Live GPS/date/time overlay on video recording screen | 2026-03-02 | 045ee4f | [002-video-location-datetime-legend-overlay](./quick/002-video-location-datetime-legend-overlay/) |

## Session Continuity

Last session: 2026-03-02
Stopped at: Completed 08-04-PLAN.md (Integration & Page Wiring)
Resume file: .planning/phases/08-arrival-registration/08-05-PLAN.md
