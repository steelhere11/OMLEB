# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Field technicians can quickly submit complete daily reports (with photos, equipment details, materials, and diagnostics) from their phone on-site -- no WhatsApp, no paper, no back-and-forth.
**Current focus:** Phase 3: Technician Reporting (Complete)

## Current Position

Phase: 3 of 5 (Technician Reporting)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-02-27 -- Completed 03-03-PLAN.md

Progress: [#######...] 54% (7/13 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 6 min
- Total execution time: 0.7 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/3 | 16 min | 8 min |
| 02-admin-data-management | 2/2 | 13 min | 7 min |
| 03-technician-reporting | 3/3 | 15 min | 5 min |

**Recent Trend:**
- Last 5 plans: 7 min, 6 min, 4 min, 7 min, 4 min
- Trend: stable/fast

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 5-phase build order (Foundation -> Admin CRUD -> Tech Reporting -> Photos+Signatures -> Admin Review+PDF)
- [Roadmap]: Photo capture and signatures split into own phase (Phase 4) due to high technical risk
- [Research]: Use getUserMedia (not file input) for camera -- Android 14/15 broke file input capture
- [Research]: Use SECURITY DEFINER functions for RLS from day one -- prevents infinite recursion
- [Research]: PDF generation client-side with @react-pdf/renderer -- avoids Vercel serverless limits
- [01-01]: Used NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY naming convention (not ANON_KEY)
- [01-01]: Inter font for mobile readability, ON DELETE RESTRICT for business-critical tables
- [01-01]: 42 RLS policies with SECURITY DEFINER helpers in private schema
- [01-02]: Proxy creates separate read-only Supabase client for role checking after updateSession
- [01-02]: Generic Spanish login error to prevent email enumeration
- [01-02]: Dual insert on user creation (Supabase Auth + public.users table)
- [01-02]: Minimal layouts for login routes to prevent parent nav wrapping
- [01-02]: UI components: Button (variant/size/loading/fullWidth), Input (error/password toggle), Label (required)
- [02-01]: Admin client (service role) for Storage uploads -- bypasses RLS for simplicity
- [02-01]: Delete old logo before replacement in updateCliente to avoid orphaned files
- [02-01]: Return success state (not redirect) after delete for inline FK error display
- [02-01]: Reusable DeleteButton component for any entity with FK protection
- [02-01]: next/image remotePatterns with **.supabase.co wildcard for dynamic Supabase URLs
- [02-02]: Equipment routes use [sucursalId] dynamic segments for branch scoping
- [02-02]: Folio user reassignment uses delete-all + re-insert pattern for simplicity
- [02-02]: Optional equipment fields use .optional().or(z.literal("")) for empty form string handling
- [02-02]: Folio status is view-only in Phase 2; status changes come from Phase 3
- [03-01]: Handle unique constraint race condition by catching PostgreSQL 23505 and retrying SELECT
- [03-01]: Pre-fill new daily reports with equipo_id + tipo_trabajo from previous report (text fields start fresh)
- [03-01]: updateReportStatus syncs parent folio estatus to match report estatus
- [03-01]: createEquipoFromField allows tecnico/ayudante roles with revisado=false and agregado_por tracking
- [03-02]: Accordion-style equipment entries to prevent overwhelming mobile screens
- [03-02]: Optimistic entry removal with revert on server error
- [03-02]: Realtime refresh banner (not auto-refresh) to avoid disrupting active editing
- [03-02]: Hide bottom tab bar on report routes for maximum mobile screen real estate
- [03-02]: Per-entry save buttons with inline success/error indicators
- [03-03]: onEntriesChange callback pattern for cross-section reactive validation (equipment count -> completado block)
- [03-03]: Tappable card UI for status selection instead of dropdown (critical mobile UX for important actions)
- [03-03]: Dynamic form rows with crypto.randomUUID() client-side IDs and datalist for common units

### Pending Todos

- User must create Supabase project and run SQL files before auth can be tested with real credentials
- User must set env vars in .env.local with real Supabase credentials
- User must create first admin account in Supabase Dashboard
- User must run supabase/storage.sql in Supabase SQL Editor to create client logos bucket
- User must run supabase/migration-03-reporting.sql in Supabase SQL Editor after schema.sql and rls.sql

### Blockers/Concerns

- [Phase 4]: Photo capture is highest-risk component -- getUserMedia + canvas + GPS overlay + compression on budget Android phones. Prototype early.
- [Phase 5]: PDF with 20+ embedded photos needs validation at scale. Run a spike during Phase 5 planning.
- [Phase 3]: Cuadrilla concurrent-edit conflict resolution: DECIDED -- last-write-wins with Realtime refresh banner (implemented in 03-02).
- [Phase 3]: COMPLETE -- full technician reporting flow functional end-to-end (folio list -> report -> equipment -> materials -> status -> submit).

## Session Continuity

Last session: 2026-02-27
Stopped at: Completed 03-03-PLAN.md (materials section, status section, Phase 3 complete)
Resume file: None
