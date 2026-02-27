# UI Redesign — Status & Continuation Guide

Use this file to resume the admin UI redesign after a context reset. It contains everything needed to pick up where we left off.

---

## Progress

| Phase | Status | Commit |
|-------|--------|--------|
| **Phase 0 — Foundation (tokens + fonts)** | DONE | `design: phase 0 — color tokens and typography setup` |
| **Phase 1 — Sidebar** | DONE | `design: phase 1 — sidebar redesign` |
| **Phase 2 — Tables & List Pages** | DONE | `design: phase 2 — list pages and table pattern` |
| **Phase 3 — Forms** | DONE | `design: phase 3 — form pages` |
| **Phase 4 — Dashboard & Login** | DONE | `design: phase 4 — dashboard and login` |
| **Phase 5 — Polish** | TODO | |

---

## What Was Done

### Phase 0 — Foundation
- Replaced admin OKLCH color tokens in `src/app/globals.css` with hex values
- Added new tokens: `admin-surface-hover`, `admin-surface-elevated`, `admin-border-subtle`, `sidebar-bg`, `sidebar-border`, `accent`, `text-0` through `text-4`, `status-success/warning/progress/error`
- Added JetBrains Mono font via `next/font/google` in `src/app/layout.tsx` — available as `font-mono` in Tailwind
- Updated viewport themeColor to `#111113`

### Phase 1 — Sidebar
- Rewrote `src/components/admin/sidebar.tsx`: 228px width, `sidebar-bg`/`sidebar-border` colors, compact nav items with accent active bar (3px left), 16px icons with opacity, account popover (animated, 0.12s)
- Updated `src/app/admin/layout.tsx`: offset `md:pl-[228px]`, mobile topbar `h-11`/`pt-11`, content padding `md:p-6`
- Added `@keyframes popover-in` + `animate-popover-in` utility in `globals.css`

### Phase 2 — Tables & List Pages
- Rewrote all 6 admin list pages replacing `<table>` with div-based connected containers + flex rows
- Pages: `clientes`, `sucursales`, `equipos` (overview), `equipos/[sucursalId]` (branch), `folios`, `usuarios`
- Connected container pattern: `rounded-[10px] border border-admin-border bg-admin-surface`
- Header rows: `text-[11px] font-medium uppercase tracking-[0.04em] text-text-2`
- Data rows: `text-[13px]`, `hover:bg-admin-surface-hover`, `duration-[80ms]`, `row-inset-divider` for sibling dividers
- Page headers: `text-[22px] font-bold tracking-[-0.025em] text-text-0`
- Create buttons: outline style (`border border-admin-border text-text-1`)
- Action links: `text-accent` with "→" suffix
- Empty states: `py-28 text-text-3` + accent CTA link
- Status badges: `bg-color/10 text-color` pattern
- Mono font on folio numbers, dates, equipment IDs, serial numbers, branch numbers
- Added `row-inset-divider` CSS utility to `globals.css`
- Rewrote `src/components/admin/delete-button.tsx` as ghost destructive (`text-text-3 hover:text-status-error`)

### Phase 3 — Forms
- Added `.admin-input`, `.admin-textarea`, `.admin-select` CSS classes in `globals.css` (unlayered — wins over Tailwind utilities)
- Focus ring override: `box-shadow: 0 0 0 2px rgba(148,163,184,0.25)` replacing Tailwind ring
- Error message override: `font-size: 12px` + `color: status-error` via sibling selector
- Added `outline` variant to `src/components/ui/button.tsx` (`border-admin-border`, `text-text-1`, `hover:bg-admin-surface-hover`)
- Restyled all 9 form pages/components:
  - `clientes/nuevo/page.tsx`, `clientes/[id]/editar/edit-form.tsx`
  - `sucursales/nuevo/page.tsx`, `sucursales/[id]/editar/edit-form.tsx`
  - `equipos/[sucursalId]/nuevo/page.tsx`, `equipos/[sucursalId]/[id]/editar/edit-form.tsx`
  - `folios/nuevo/create-form.tsx`, `folios/[id]/editar/edit-form.tsx`
  - `usuarios/nuevo/page.tsx`
- Removed redundant `min-h-dvh bg-admin-bg px-4 py-8 text-white` page wrappers (admin layout provides bg + padding)
- Container: `max-w-[480px]` centered
- Card: `rounded-[10px]`, `admin-surface` bg, `admin-border` border
- Labels: `text-[13px] text-text-1`
- Inputs/Selects/Textareas: `admin-input`/`admin-select`/`admin-textarea` class (elevated bg, 6px radius, 13px font)
- Error banners: `border-status-error/30 bg-admin-surface` with `text-status-error`
- Warning banners: same pattern with `status-warning`
- Success state (usuarios): `border-status-success/30 bg-admin-surface` with success icon
- Submit buttons: `variant="outline"` with `fullWidth`
- Back links: `text-[13px] text-text-2 hover:text-text-1` with `h-3.5 w-3.5` icon
- Page titles: `text-[22px] font-bold tracking-[-0.025em] text-text-0`
- File inputs (clientes): outline-style file button (`border-admin-border`, no fill)
- Folio edit: read-only info bar restyled (`admin-surface-elevated`, `font-mono` on folio number)
- Cuadrilla checkbox lists: `admin-surface-elevated` bg, `accent` checkbox color, status-based role badges
- Tech pages completely untouched — shared UI components only received additive `outline` variant

---

## What Remains

### ~~Phase 3 — Forms~~ (DONE)

~~Restyle all admin form pages (create/edit for all entities).~~ Files modified:

- `src/app/admin/clientes/nuevo/page.tsx`
- `src/app/admin/clientes/[id]/editar/page.tsx`
- `src/app/admin/sucursales/nuevo/page.tsx`
- `src/app/admin/sucursales/[id]/editar/page.tsx`
- `src/app/admin/equipos/[sucursalId]/nuevo/page.tsx`
- `src/app/admin/equipos/[sucursalId]/[id]/editar/page.tsx`
- `src/app/admin/folios/nuevo/page.tsx`
- `src/app/admin/folios/[id]/editar/page.tsx`
- `src/app/admin/usuarios/nuevo/page.tsx`
- `src/components/ui/button.tsx` (may need variant updates)
- `src/components/ui/input.tsx` (may need admin-theme overrides)
- `src/components/ui/select.tsx` (same)
- `src/components/ui/textarea.tsx` (same)
- `src/components/ui/label.tsx` (same)

**Form spec:**
- Container: `max-w-[480px]` centered
- Card: `admin-surface` bg, `admin-border` border, `rounded-[10px]`, `p-6`
- Labels: `text-text-1`, `text-[13px]`, `font-medium` (keep `font-weight: 500`)
- Inputs: `bg-admin-surface-elevated`, `border-admin-border`, `rounded-[6px]`, `text-[13px]`, `text-text-0`, `placeholder:text-text-3`
- Focus ring: `box-shadow: 0 0 0 2px rgba(148,163,184,0.25)` (accent at 25% opacity)
- Select/Textarea: same styling as inputs
- Error messages: `text-status-error`, `text-[12px]`, `mt-1.5`
- Error banner: `admin-surface` bg, `1px border-status-error/30`, `text-status-error`
- Success state: `admin-surface` bg, `1px border-status-success/30`, `text-status-success`
- Submit button: outline style (same as create buttons from Phase 2)
- Cancel/back link: `text-text-2 hover:text-text-1` ghost style
- Back link: `text-[13px] text-text-2 hover:text-text-1` with arrow icon
- Remove redundant `min-h-dvh bg-admin-bg px-4 py-8 text-white` page wrappers

**Important:** The UI components in `src/components/ui/` are shared between admin and tech sides. The tech side uses a light theme. Either:
- Add admin-specific class overrides in the form pages (preferred — less risk)
- Or add a `theme` prop to UI components

Keep all form logic, validation, action handlers, and Zod schemas intact. Only change the visual layer.

**Commit message:** `design: phase 3 — form pages`

---

### Phase 4 — Dashboard & Login

**Dashboard** (`src/app/admin/page.tsx`):
- Convert quick-action cards from separate floating cards to connected container pattern (single container with rows, or metric strip)
- Page title: `text-[22px] font-bold tracking-[-0.025em] text-text-0`
- Subtitle: `text-text-2`
- Remove brand-500 colored icon backgrounds, glows, and hover shadows
- Activity placeholder: connected container, text-3

**Admin Login** (`src/app/admin/login/page.tsx`):
- Card: `admin-surface` bg, `admin-border` border, `rounded-[10px]` (remove `shadow-2xl`)
- Logo: keep centered, use `admin-surface-elevated` bg
- Inputs: match form styling from Phase 3
- Submit button: outline style with accent border
- Keep all auth logic

**Commit message:** `design: phase 4 — dashboard and login`

---

### Phase 5 — Polish

Final consistency pass across all admin pages:

1. Ensure ALL buttons follow ghost/outline hierarchy — remove any remaining `bg-brand-500` filled buttons
2. Add `font-mono` to all folio numbers, dates, equipment IDs, and numeric counts across all pages (including forms, detail views)
3. Verify all status badges use `bg-color/10 text-color` pattern everywhere
4. Check all hover states have `bg-admin-surface-hover` with `duration-[80ms]` transition
5. Verify inset dividers are 14px from edges on all containers
6. Remove any remaining shadows on admin cards
7. Ensure mobile sidebar drawer matches new styling (already done in Phase 1 but double-check)
8. Verify tech pages are COMPLETELY UNTOUCHED — the light theme must be identical to before

**Commit message:** `design: phase 5 — polish and consistency pass`

---

## Design System Reference (Quick)

### Color Tokens (defined in `src/app/globals.css`)

| Token | Hex | Usage |
|-------|-----|-------|
| `admin-bg` | `#111113` | Page background |
| `admin-surface` | `#18181b` | Cards, containers |
| `admin-surface-hover` | `#1c1c1f` | Hover states |
| `admin-surface-elevated` | `#1e1e22` | Active items, inputs, popovers |
| `admin-border` | `#27272a` | Container borders |
| `admin-border-subtle` | `#222225` | Inset dividers |
| `sidebar-bg` | `#141416` | Sidebar bg |
| `sidebar-border` | `#1e1e21` | Sidebar border |
| `accent` | `#94a3b8` | Links, active indicators, focus rings |
| `text-0` | `#fafafa` | Headings, emphasis |
| `text-1` | `#a1a1aa` | Body text |
| `text-2` | `#71717a` | Labels, metadata |
| `text-3` | `#52525b` | Ghost text, disabled |
| `text-4` | `#3f3f46` | Section headers |
| `status-success` | `#22c55e` | Completado, reviewed |
| `status-warning` | `#eab308` | En Espera, pending |
| `status-progress` | `#3b82f6` | En Progreso |
| `status-error` | `#ef4444` | Errors, destructive |

### Established Patterns

**Connected container:** `rounded-[10px] border border-admin-border bg-admin-surface overflow-hidden`

**Header row (table):** `flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2`

**Data row:** `flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover` + `row-inset-divider` on non-first siblings

**Page title:** `text-[22px] font-bold tracking-[-0.025em] text-text-0`

**Outline button:** `inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover`

**Action link:** `text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0` (with " →" suffix)

**Back link:** `text-[13px] text-text-2 transition-colors duration-[80ms] hover:text-text-1` with `h-3.5 w-3.5` back arrow icon

**Empty state:** `py-28 text-center` inside connected container, `text-[13px] text-text-3` message + accent CTA link

**Status badge:** `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[status-color]/10 text-[status-color]`

**Mono text:** `font-mono` on folio numbers, dates, equipment IDs, serial numbers, branch numbers, numeric counts

### CSS Utilities (in `globals.css`)
- `animate-popover-in` — popover entrance (opacity + translateY + scale, 0.12s)
- `row-inset-divider` — ::before pseudo divider, 14px inset from edges, `admin-border-subtle` color

---

## Important Rules

1. **One phase per prompt.** Finish one, review, commit, then next.
2. **Keep all business logic.** Only change the visual layer — CSS classes, markup. Never modify data fetching, routing, auth, or state management.
3. **Spanish text stays.** All labels, placeholders, and UI copy remain in Spanish.
4. **Technician pages untouched.** This redesign is admin-side only.
5. **Commit after each phase** with the specified commit message.
6. **Font:** Inter for all text, JetBrains Mono (`font-mono`) for data values (numbers, dates, IDs).
7. **No gradients, glows, colored backgrounds, or decorative shadows.** Color is information, not decoration.
