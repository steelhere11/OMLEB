---
phase: 01-foundation
plan: 02
subsystem: auth, ui
tags: [supabase-auth, proxy, role-based-routing, server-actions, react-19, useActionState, dark-mode, mobile-first]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Supabase client factories (server, admin, browser), updateSession proxy helper, TypeScript types, globals.css theme"
provides:
  - "Proxy with auth token refresh and role-based route protection"
  - "Server actions for login, logout, and admin-only user creation"
  - "PKCE auth callback route"
  - "Technician login page (branded, mobile-first, brand gradient)"
  - "Admin login page (dark mode styled)"
  - "Admin user list page with role badges"
  - "Admin create-user form with success/error handling"
  - "Shared UI components: Button, Input, Label"
affects: [01-03 pwa, 02-admin-crud, 03-tech-reporting, 04-photos-signatures, 05-admin-review-pdf]

# Tech tracking
tech-stack:
  added: []
  patterns: [proxy-role-routing, server-actions-auth, useActionState-forms, admin-dark-theme, tech-branded-theme]

key-files:
  created:
    - src/proxy.ts
    - src/app/actions/auth.ts
    - src/app/auth/callback/route.ts
    - src/components/ui/button.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/app/login/page.tsx
    - src/app/login/layout.tsx
    - src/app/admin/login/page.tsx
    - src/app/admin/login/layout.tsx
    - src/app/admin/usuarios/page.tsx
    - src/app/admin/usuarios/nuevo/page.tsx
  modified: []

key-decisions:
  - "Proxy creates a separate read-only Supabase client for role checking (no cookie mutation after updateSession)"
  - "Login error is generic Spanish message for security (no email enumeration)"
  - "createTechnicianAccount inserts into both auth.users (via admin API) and public.users table"
  - "Login pages use minimal layouts to prevent parent navigation from wrapping them"
  - "Gear icon for technician login, shield icon for admin login as visual differentiators"

patterns-established:
  - "Proxy pattern: src/proxy.ts exports proxy() + config; calls updateSession then getUser() for role routing"
  - "Server action pattern: 'use server' + AuthState return type + useActionState on client"
  - "Form pattern: useActionState<AuthState | null, FormData> with formAction prop"
  - "Admin dark styling: bg-admin-bg, border-admin-border, bg-admin-surface, text-white/gray-300/gray-400"
  - "Tech branded styling: bg-gradient-to-br from-brand-500 to-brand-700, white card"
  - "UI components: Button (variant/size/loading/fullWidth), Input (error/password toggle), Label (required asterisk)"

# Metrics
duration: 4min
completed: 2026-02-24
---

# Phase 1 Plan 2: Authentication System Summary

**Proxy-based role routing with two visually distinct login pages (admin dark mode, technician brand gradient), server actions for login/logout/user-creation, and shared UI components (Button, Input, Label)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-24T16:07:06Z
- **Completed:** 2026-02-24T16:11:30Z
- **Tasks:** 2
- **Files created:** 13

## Accomplishments
- Built proxy with auth token refresh and role-based routing (admin/tecnico/ayudante redirect logic)
- Created three server actions: login (generic Spanish error), logout, createTechnicianAccount (admin-only with public.users insert)
- Delivered two visually distinct login pages: technician with brand gradient mobile-first design, admin with dark mode
- Built admin user management: user list with role badges and create-user form with success/error states
- Created reusable UI components: Button (3 variants, 3 sizes, loading state), Input (error display, password toggle), Label (required asterisk)

## Task Commits

Each task was committed atomically:

1. **Task 1: Proxy, auth server actions, callback route, and UI components** - `fd6b31b` (feat)
2. **Task 2: Login pages and user management UI** - `636a1a5` (feat)

## Files Created/Modified
- `src/proxy.ts` - Proxy with role-based routing and auth token refresh
- `src/app/actions/auth.ts` - Server actions: login, logout, createTechnicianAccount
- `src/app/auth/callback/route.ts` - PKCE auth callback handler
- `src/components/ui/button.tsx` - Button component (primary/secondary/danger, sm/md/lg, loading, fullWidth)
- `src/components/ui/input.tsx` - Input component (error display, password show/hide toggle, 48px min height)
- `src/components/ui/label.tsx` - Label component (required asterisk indicator)
- `src/app/login/page.tsx` - Technician login (brand gradient, gear icon, mobile-first)
- `src/app/login/layout.tsx` - Minimal layout (prevents parent nav wrapping)
- `src/app/admin/login/page.tsx` - Admin login (dark mode, shield icon)
- `src/app/admin/login/layout.tsx` - Minimal layout (prevents admin nav wrapping)
- `src/app/admin/usuarios/page.tsx` - User list with role badges, empty state
- `src/app/admin/usuarios/nuevo/page.tsx` - Create user form with success/error handling
- `src/app/favicon.ico` - Default favicon

## Decisions Made
- **Separate read-only client in proxy:** After updateSession refreshes cookies, a second Supabase client (with no-op setAll) reads the user role. This avoids double cookie mutation and keeps concerns separated.
- **Generic login error:** Returns "Correo o contrasena incorrectos" regardless of whether email exists -- prevents email enumeration attacks.
- **Dual insert on user creation:** createTechnicianAccount writes to both Supabase Auth (via admin.createUser) and public.users table, keeping them in sync.
- **Minimal layouts for login routes:** Both /login and /admin/login have their own layout.tsx that just renders children, preventing any future parent navigation from wrapping the login pages.
- **Visual differentiation:** Technician login uses a gear/settings icon in a brand-colored circle; admin login uses a shield/security icon in a dark-bordered circle.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

Before testing auth flows, the following external configuration from Plan 01-01 must be completed:

1. **Create Supabase project** and run SQL files (schema.sql, rls.sql)
2. **Set environment variables** in `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY)
3. **Create first admin account** in Supabase Dashboard (Authentication -> Users -> Add User, set app_metadata to `{"rol": "admin"}`)

## Next Phase Readiness
- Auth system ready: proxy routing, login/logout, user creation
- UI components (Button, Input, Label) available for all future forms
- Admin dark theme and technician branded theme patterns established
- Ready for Plan 01-03 (PWA configuration)
- Ready for Phase 2 (Admin CRUD) -- all auth guards in place

---
*Phase: 01-foundation*
*Completed: 2026-02-24*
