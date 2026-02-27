---
phase: 02-admin-data-management
plan: 01
subsystem: ui, api, database
tags: [zod4, supabase-storage, server-actions, crud, file-upload, next-image]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Supabase client, auth system, admin layout, UI components (Button, Input, Label), TypeScript types, RLS policies"
provides:
  - "ActionState shared interface for server actions"
  - "Select and Textarea UI components"
  - "Zod 4 validation schemas for clientes and sucursales"
  - "Client CRUD (create, edit, list) with logo upload"
  - "Branch CRUD (create, edit, delete, list)"
  - "Reusable DeleteButton component with FK error handling"
  - "Supabase Storage SQL for clientes bucket"
  - "next.config.ts bodySizeLimit and image remotePatterns"
affects:
  - 02-admin-data-management (Plan 02-02 depends on branches for equipment, and clients for folios)
  - 03-tech-reporting (technician views reference branches and clients)
  - 05-admin-review-pdf (PDF export includes client logo)

# Tech tracking
tech-stack:
  added: [zod ^4.3.6]
  patterns: [server-action-with-zod-validation, file-upload-via-admin-client, delete-with-fk-error-handling, edit-form-bind-pattern]

key-files:
  created:
    - src/types/actions.ts
    - src/components/ui/select.tsx
    - src/components/ui/textarea.tsx
    - src/lib/validations/clientes.ts
    - src/lib/validations/sucursales.ts
    - src/app/actions/clientes.ts
    - src/app/actions/sucursales.ts
    - src/app/admin/clientes/page.tsx
    - src/app/admin/clientes/nuevo/page.tsx
    - src/app/admin/clientes/[id]/editar/page.tsx
    - src/app/admin/clientes/[id]/editar/edit-form.tsx
    - src/app/admin/sucursales/page.tsx
    - src/app/admin/sucursales/nuevo/page.tsx
    - src/app/admin/sucursales/[id]/editar/page.tsx
    - src/app/admin/sucursales/[id]/editar/edit-form.tsx
    - src/components/admin/delete-button.tsx
    - supabase/storage.sql
  modified:
    - next.config.ts

key-decisions:
  - "Use admin client (service role) for logo upload to bypass Storage RLS"
  - "Delete old logo from storage before uploading replacement in updateCliente"
  - "Return success state (not redirect) after delete to allow inline error display"
  - "Reusable DeleteButton client component for any entity with FK protection"
  - "next/image remotePatterns for **.supabase.co to support dynamic Supabase URLs"

patterns-established:
  - "Server action CRUD: admin role check -> Zod validate -> DB operation -> revalidatePath -> redirect"
  - "Edit form bind pattern: updateAction.bind(null, id) with useActionState"
  - "Delete with FK handling: catch Postgres 23503 code, return Spanish error"
  - "File upload in server action: validate size/type -> admin.storage.upload -> getPublicUrl"

# Metrics
duration: 7min
completed: 2026-02-27
---

# Phase 2 Plan 1: Clients & Branches CRUD Summary

**Zod 4 validated CRUD for clients (with Supabase Storage logo upload) and branches (with FK-protected delete), plus shared ActionState type and Select/Textarea UI components**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-27T17:33:04Z
- **Completed:** 2026-02-27T17:39:35Z
- **Tasks:** 3
- **Files modified:** 18

## Accomplishments
- Full client management: create with name and optional logo upload, edit with logo replacement, list with thumbnails
- Full branch management: create, edit, delete with FK constraint handling, list with "Ver equipos" navigation link
- Shared infrastructure: ActionState interface, Select/Textarea UI components, Zod 4 validation schemas with Spanish error messages
- Supabase Storage SQL for client logos bucket with RLS policies

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared infrastructure** - `ec80e22` (feat)
2. **Task 2: Client CRUD** - `c07e168` (feat)
3. **Task 3: Branch CRUD** - `159e789` (feat)

## Files Created/Modified
- `src/types/actions.ts` - Shared ActionState interface for all server actions
- `src/components/ui/select.tsx` - Select dropdown component with error display
- `src/components/ui/textarea.tsx` - Textarea component with error display
- `src/lib/validations/clientes.ts` - Zod 4 schema for client validation
- `src/lib/validations/sucursales.ts` - Zod 4 schema for branch validation
- `supabase/storage.sql` - Storage bucket SQL for client logos
- `next.config.ts` - Added bodySizeLimit (5mb) and image remotePatterns for Supabase
- `src/app/actions/clientes.ts` - Server actions for createCliente, updateCliente
- `src/app/admin/clientes/page.tsx` - Client list page (Server Component)
- `src/app/admin/clientes/nuevo/page.tsx` - Create client form
- `src/app/admin/clientes/[id]/editar/page.tsx` - Edit client page (Server Component)
- `src/app/admin/clientes/[id]/editar/edit-form.tsx` - Edit client form component
- `src/app/actions/sucursales.ts` - Server actions for createSucursal, updateSucursal, deleteSucursal
- `src/app/admin/sucursales/page.tsx` - Branch list page with delete buttons
- `src/app/admin/sucursales/nuevo/page.tsx` - Create branch form
- `src/app/admin/sucursales/[id]/editar/page.tsx` - Edit branch page (Server Component)
- `src/app/admin/sucursales/[id]/editar/edit-form.tsx` - Edit branch form component
- `src/components/admin/delete-button.tsx` - Reusable delete button with confirmation and FK error display

## Decisions Made
- Used admin client (service role) for all Storage uploads -- bypasses RLS, simpler than signed URLs for small files
- Delete old logo from storage before uploading replacement to avoid orphaned files
- After delete, return success state instead of redirect -- allows inline FK error display on the list page
- Created reusable DeleteButton component that can be used for any entity, not just branches
- Added `images.remotePatterns` with `**.supabase.co` wildcard to support any Supabase project URL

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added next/image remotePatterns for Supabase URLs**
- **Found during:** Task 2 (Client CRUD)
- **Issue:** Using `<Image>` from next/image for logo thumbnails requires configuring allowed remote hostnames; without it, logos would fail to render
- **Fix:** Added `images.remotePatterns` with `**.supabase.co` pattern to next.config.ts
- **Files modified:** next.config.ts
- **Verification:** Build passes, no image domain errors
- **Committed in:** c07e168 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added admin delete logo RLS policy in storage.sql**
- **Found during:** Task 1 (Storage SQL)
- **Issue:** Plan specified insert and select policies but not delete policy; updateCliente needs to delete old logos from storage
- **Fix:** Added `admin_delete_logos` policy for DELETE operations on storage.objects
- **Files modified:** supabase/storage.sql
- **Verification:** SQL is syntactically valid
- **Committed in:** ec80e22 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both auto-fixes necessary for correct logo management. No scope creep.

## Issues Encountered
None

## User Setup Required

After deployment, run `supabase/storage.sql` in the Supabase SQL Editor to create the client logos storage bucket. This file must be run after `schema.sql` and `rls.sql`.

## Next Phase Readiness
- Client and branch data foundation complete for Plan 02-02 (equipment + folios)
- Equipment pages will use branch IDs for scoping (branch list already has "Ver equipos" link)
- Folio creation will use both client and branch selects (Select UI component ready)
- ActionState type and Zod validation patterns established for reuse in equipment/folio actions

---
*Phase: 02-admin-data-management*
*Completed: 2026-02-27*
