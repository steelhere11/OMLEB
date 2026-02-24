---
phase: 01-foundation
plan: 01
subsystem: infra, database
tags: [nextjs, tailwind-v4, supabase, ssr, rls, postgresql, typescript]

# Dependency graph
requires: []
provides:
  - "Next.js 16 project scaffold with Tailwind CSS v4 (CSS-first config)"
  - "Three Supabase client factories (browser, server, admin)"
  - "updateSession proxy helper for auth token refresh"
  - "TypeScript types for all 10 database tables"
  - "Complete database schema SQL (10 tables, triggers, indexes)"
  - "RLS policies with SECURITY DEFINER helpers in private schema"
  - "Environment variable template with PUBLISHABLE_KEY naming"
affects: [01-02 auth, 01-03 pwa, 02-admin-crud, 03-tech-reporting]

# Tech tracking
tech-stack:
  added: [next@16.1.6, react@19.2.3, tailwindcss@4, @supabase/supabase-js@2.97, @supabase/ssr@0.8, server-only]
  patterns: [supabase-ssr-three-clients, tailwind-v4-css-first-theme, rls-security-definer-helpers]

key-files:
  created:
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/globals.css
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - src/lib/supabase/proxy.ts
    - src/types/index.ts
    - supabase/schema.sql
    - supabase/rls.sql
    - supabase/seed.sql
    - .env.example
  modified: []

key-decisions:
  - "Used NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (not ANON_KEY) per Supabase key naming transition"
  - "Inter font instead of Geist for professional mobile readability"
  - "ON DELETE CASCADE on child tables, ON DELETE RESTRICT on folios/reportes to prevent accidental data loss"
  - "Folio numbering via Postgres sequence + trigger (F-0001 format)"
  - "42 RLS policies covering admin full CRUD and tech folio-scoped access"

patterns-established:
  - "Supabase SSR: browser client (client.ts), server client (server.ts), admin client (admin.ts)"
  - "Tailwind v4 CSS-first: all theme config in globals.css @theme block, no JS config file"
  - "RLS: SECURITY DEFINER helpers in private schema to avoid circular dependencies"
  - "All auth.uid()/auth.jwt() wrapped in (SELECT ...) for RLS performance"
  - "Environment variables: PUBLISHABLE_KEY naming convention"

# Metrics
duration: 12min
completed: 2026-02-24
---

# Phase 1 Plan 1: Project Scaffold & Database Schema Summary

**Next.js 16 with Tailwind v4 CSS-first theme, three Supabase SSR client factories, and 10-table PostgreSQL schema with 42 RLS policies using SECURITY DEFINER helpers**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-24T15:51:03Z
- **Completed:** 2026-02-24T16:03:44Z
- **Tasks:** 2
- **Files created:** 17

## Accomplishments
- Scaffolded Next.js 16.1.6 project with TypeScript, Tailwind CSS v4, and App Router
- Created three Supabase client factories (browser, server, admin) plus updateSession proxy helper
- Defined TypeScript types for all 10 database tables matching CLAUDE.md schema
- Built complete SQL schema with triggers (updated_at, folio numbering, auth user sync), indexes, and constraints
- Wrote 42 RLS policies across all tables with SECURITY DEFINER helpers to prevent circular dependencies

## Task Commits

Each task was committed atomically:

1. **Task 1: Next.js 16 project scaffold with Tailwind v4 and Supabase clients** - `ca21f6e` (feat)
2. **Task 2: Database schema SQL with RLS policies and SECURITY DEFINER helpers** - `5cdb608` (feat)

## Files Created/Modified
- `package.json` - Project dependencies (Next.js 16, React 19, Supabase, Tailwind v4)
- `next.config.ts` - Basic Next.js config with reactStrictMode
- `tsconfig.json` - TypeScript config with bundler module resolution
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss plugin
- `src/app/globals.css` - Tailwind v4 CSS-first config with steel blue brand palette
- `src/app/layout.tsx` - Root layout (lang="es", Inter font, PWA metadata)
- `src/app/page.tsx` - Root page (redirects to /login)
- `src/lib/supabase/client.ts` - Browser Supabase client factory
- `src/lib/supabase/server.ts` - Server Supabase client factory (async cookies)
- `src/lib/supabase/admin.ts` - Admin Supabase client (service role, server-only)
- `src/lib/supabase/proxy.ts` - updateSession helper for auth token refresh
- `src/types/index.ts` - TypeScript types for all 10 database tables
- `.env.example` - Environment variable template
- `.env.local` - Local env vars (gitignored)
- `.gitignore` - Added .env.example exclusion from .env* pattern
- `supabase/schema.sql` - 10 tables, 5 updated_at triggers, folio numbering, user sync trigger, 11 indexes
- `supabase/rls.sql` - Private schema, 3 SECURITY DEFINER helpers, 42 RLS policies
- `supabase/seed.sql` - Setup instructions and verification queries

## Decisions Made
- **PUBLISHABLE_KEY naming**: Used `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` instead of the legacy `ANON_KEY` per Supabase's November 2025 key naming transition (from RESEARCH.md findings)
- **Inter font**: Replaced Geist with Inter for better readability on mobile devices (technician-facing app)
- **Delete policy**: Used ON DELETE RESTRICT for folios and reportes foreign keys to prevent accidental cascading data loss on critical business data
- **Folio numbering**: Postgres sequence + BEFORE INSERT trigger generates "F-0001" format numbers automatically, with override capability if manual number provided
- **Tech equipment insert**: Technicians can only insert equipment with their own `agregado_por` ID, ensuring audit trail

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed server-only package**
- **Found during:** Task 1 (Supabase admin client creation)
- **Issue:** `admin.ts` imports `server-only` which wasn't installed by create-next-app
- **Fix:** Ran `npm install server-only`
- **Files modified:** package.json, package-lock.json
- **Verification:** Build succeeds, import resolves
- **Committed in:** ca21f6e (Task 1 commit)

**2. [Rule 3 - Blocking] Project name conflict with folder name**
- **Found during:** Task 1 (create-next-app initialization)
- **Issue:** Folder "OMLEB - HVAC" contains spaces and uppercase -- npm rejects as project name
- **Fix:** Initialized in temp directory, moved files to project root, set package name to "omleb-hvac"
- **Files modified:** package.json
- **Verification:** npm commands work correctly
- **Committed in:** ca21f6e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were mechanical blockers. No scope creep.

## Issues Encountered
- None beyond the two blocking issues documented above.

## User Setup Required

Before Plan 01-02 (auth), the following external service configuration is needed:

1. **Create Supabase Project** - Dashboard -> New Project (use us-east-1 region for Mexico latency)
2. **Run SQL files** in Supabase SQL Editor in order: schema.sql, rls.sql, seed.sql
3. **Add environment variables** to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` (Dashboard -> Project Settings -> API -> Project URL)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Dashboard -> API -> publishable/anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` (Dashboard -> API -> secret/service_role key)
4. **Create first admin account** (Dashboard -> Authentication -> Users -> Add User, then set app_metadata to `{"rol": "admin"}`)

## Next Phase Readiness
- Project builds and runs with `npm run dev`
- Supabase clients ready for auth integration in Plan 01-02
- SQL files ready for manual execution in Supabase Dashboard
- TypeScript types cover full database schema
- No blockers for Plan 01-02 (auth) or Plan 01-03 (PWA)

---
*Phase: 01-foundation*
*Completed: 2026-02-24*
