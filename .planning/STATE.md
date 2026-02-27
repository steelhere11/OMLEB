# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Field technicians can quickly submit complete daily reports (with photos, equipment details, materials, and diagnostics) from their phone on-site -- no WhatsApp, no paper, no back-and-forth.
**Current focus:** Phase 2: Admin Data Management

## Current Position

Phase: 2 of 5 (Admin Data Management)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-27 -- Completed 02-01-PLAN.md

Progress: [###.......] 21% (3/14 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 8 min
- Total execution time: 0.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/3 | 16 min | 8 min |
| 02-admin-data-management | 1/2 | 7 min | 7 min |

**Recent Trend:**
- Last 5 plans: 12 min, 4 min, 7 min
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

### Pending Todos

- User must create Supabase project and run SQL files before auth can be tested with real credentials
- User must set env vars in .env.local with real Supabase credentials
- User must create first admin account in Supabase Dashboard
- User must run supabase/storage.sql in Supabase SQL Editor to create client logos bucket

### Blockers/Concerns

- [Phase 4]: Photo capture is highest-risk component -- getUserMedia + canvas + GPS overlay + compression on budget Android phones. Prototype early.
- [Phase 5]: PDF with 20+ embedded photos needs validation at scale. Run a spike during Phase 5 planning.
- [Phase 3]: Cuadrilla concurrent-edit conflict resolution needs UX decision (silent overwrite vs refresh toast). Decide during Phase 3 planning.

## Session Continuity

Last session: 2026-02-27
Stopped at: Completed 02-01-PLAN.md (clients and branches CRUD)
Resume file: None
