# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Field technicians can quickly submit complete daily reports (with photos, equipment details, materials, and diagnostics) from their phone on-site -- no WhatsApp, no paper, no back-and-forth.
**Current focus:** V1 COMPLETE -- All 5 phases delivered.

## Current Position

Phase: 5 of 5 (Admin Review & PDF Export)
Plan: 3 of 3 in current phase
Status: COMPLETE
Last activity: 2026-02-28 -- Completed 05-03-PLAN.md

Progress: [##############] 100% (14/14 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: 6 min
- Total execution time: 1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/3 | 16 min | 8 min |
| 02-admin-data-management | 2/2 | 13 min | 7 min |
| 03-technician-reporting | 3/3 | 15 min | 5 min |
| 03.5-guided-workflows | 1/1 | 8 min | 8 min |
| 04-photo-capture-signatures | 3/3 | 19 min | 6 min |
| 05-admin-review-pdf-export | 3/3 | 17 min | 6 min |

**Recent Trend:**
- Last 5 plans: 7 min, 6 min, 5 min, 5 min, 7 min
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
- [03.5-01]: Replace free-text diagnostico/trabajo_realizado with structured workflow steps from plantillas_pasos
- [03.5-01]: Auto-save step progress on completion toggle (no explicit save button per step)
- [03.5-01]: Yellow warning for out-of-range readings (non-blocking -- techs know their equipment)
- [03.5-01]: Fallback to free-text textareas for equipment with tipo "otro" or no matching templates
- [03.5-01]: Photo evidence buttons as visual placeholders (Phase 4 wires camera)
- [03.5-01]: Si/No readings as tappable toggle buttons, not text fields
- [03.5-01]: tipos_equipo dropdown replaces free-text tipo_equipo in add-equipment modal
- [04-01]: Photo uploads use browser Supabase client (authenticated session + RLS), not admin/service role
- [04-01]: Auto-accept capture flow -- no preview screen, immediate compress+upload
- [04-01]: Canvas drawing buffer = video resolution; CSS handles display scaling
- [04-01]: animate-slide-up CSS utility added for bottom sheet transitions
- [04-02]: Gallery uploads skip GPS overlay (no location data for pre-existing photos)
- [04-02]: Sequential gallery upload (not parallel) to avoid bandwidth saturation on mobile
- [04-02]: Photos per corrective issue keyed by falla_correctiva_id in local state map
- [04-02]: 5 general photo labels for equipment (ANTES, DESPUES, DANO, PLACA, PROGRESO)
- [04-03]: Base64 data URL stored directly in firma_encargado text column (no separate Storage upload)
- [04-03]: Signature gate is client-side intercept before form action, not server-side redirect
- [04-03]: screen.orientation.lock() cast to any for TypeScript compat (experimental API)
- [05-01]: URL search params for report filtering (status, branch, date range)
- [05-01]: Photos grouped by equipo_id for equipment card display; general photos in separate section
- [05-01]: Signature rendered as inline <img> with base64 data URL (not next/image)
- [05-01]: Placeholder #admin-actions div for Plan 02 edit/approve and Plan 03 PDF export
- [05-02]: Equipment edit uses useActionState with bound entryId; materials edit uses useTransition (array payload)
- [05-02]: window.confirm for approve confirmation (lightweight, no custom modal needed)
- [05-02]: Equipment edit does not change equipo_id -- admin edits content fields only
- [05-03]: Dynamic import with ssr: false for @react-pdf/renderer (browser-only APIs)
- [05-03]: Promise.allSettled for photo pre-fetch -- individual failures silently skipped
- [05-03]: Base64 data URLs for all PDF images -- avoids CORS during rendering
- [05-03]: LETTER page size for US printing compatibility
- [05-03]: No placeholder logo -- "OMLEB" text fallback when /logo.png not found
- [05-verify]: Added adminUpdateReportStatus action + status dropdown on detail page (verifier gap closure)

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

### Blockers/Concerns

- [Phase 4]: COMPLETE -- camera capture, gallery wiring, photo workflow integration, and digital signature all done.
- [Phase 5]: COMPLETE -- report list, detail view, inline edit, approval, and PDF export all done.
- [Phase 3]: COMPLETE -- full technician reporting flow functional end-to-end.
- [Phase 3.5]: COMPLETE -- structured workflow steps replace free-text reporting.
- [V1]: ALL PHASES COMPLETE. Ready for Supabase setup, data seeding, and deployment testing.

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 05-03-PLAN.md (PDF export). ALL V1 PLANS COMPLETE.
Resume file: None
