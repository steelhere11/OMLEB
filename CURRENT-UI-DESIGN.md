# Current UI Design — HVAC Daily Report Generator

Use this document as context when writing prompts to redesign the UI. It describes every visual element currently in the app.

---

## 1. Global Theme & Color System

**Font:** Inter (Google Fonts)

**Color palette** defined in `src/app/globals.css` using OKLCH color space via Tailwind v4 `@theme`:

| Token | Value | Usage |
|-------|-------|-------|
| `brand-500` | Steel blue (oklch 0.55 0.15 250) | Primary action color |
| `brand-50–900` | Full blue scale | Buttons, links, accents |
| `admin-bg` | Very dark blue-gray (15% lightness) | Admin page background |
| `admin-surface` | Dark blue-gray (20% lightness) | Admin cards/tables |
| `admin-border` | Medium blue-gray (30% lightness) | Admin borders/dividers |
| `tech-bg` | Near-white (98% lightness) | Technician page background |
| `tech-surface` | Pure white | Technician cards |
| `status-completado` | Green (oklch 145°) | Completed status |
| `status-en-espera` | Yellow (oklch 85°) | Waiting status |
| `status-en-progreso` | Blue (oklch 250°) | In-progress status |

**No dark mode toggle exists.** Admin = always dark, Technician = always light. Role determines theme.

---

## 2. Admin Layout

**File:** `src/app/admin/layout.tsx`

- Background: `bg-admin-bg` (very dark)
- Desktop: fixed left sidebar `w-64` + content area offset with `md:pl-64`
- Mobile: fixed top bar `h-14` + sidebar as slide-out drawer with dark backdrop (`bg-black/60`)
- Content padding: `p-4 md:p-8`

### Sidebar (`src/components/admin/sidebar.tsx`)

- Background: inherits `bg-admin-bg`
- Border: `border-r border-admin-border`
- **Logo area** (top, `h-16`): Blue square badge (`h-9 w-9 rounded-lg bg-brand-500`) + "OMLEB" in `text-lg font-bold text-white`
- **Nav items** (`px-3 py-2.5 rounded-lg text-sm font-medium`):
  - Active: `bg-brand-500/20 text-brand-300`
  - Inactive: `text-gray-400 hover:bg-admin-surface hover:text-white`
  - Icons: `h-5 w-5` inline SVGs (outlined, strokeWidth 2)
- **Nav links:** Clientes, Sucursales, Equipos, Folios, Usuarios, Reportes
- **User section** (bottom, `border-t border-admin-border p-4`):
  - Name: `text-sm font-medium text-white`
  - Email: `text-xs text-gray-400`
  - Logout button: `text-gray-400 hover:bg-red-500/10 hover:text-red-400`
- **Mobile hamburger:** `rounded-lg p-2 text-gray-400` opens drawer `w-64 bg-admin-bg shadow-xl`

---

## 3. Admin Pages

### 3a. Dashboard (`src/app/admin/page.tsx`)

- Heading: `text-2xl font-bold text-white md:text-3xl`
- Subtitle: `text-gray-400`
- **Quick action cards** in `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`:
  - Card: `rounded-xl border border-admin-border bg-admin-surface p-6`
  - Hover: `hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/5`
  - Icon badge: `rounded-lg bg-brand-500/10 p-3 text-brand-400`
  - Title: `text-base font-semibold text-white`
  - Description: `text-sm text-gray-400`

### 3b. List Pages (Clientes, Sucursales, Equipos, Folios, Usuarios)

All list pages follow the same pattern:

**Header row:**
- Title: `text-2xl font-bold text-white`
- Create button: `rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600` with plus icon

**Table:**
```
rounded-xl border border-admin-border bg-admin-surface
├── thead: border-b border-admin-border text-left text-sm text-gray-400
│   └── th: px-6 py-4 font-medium
└── tbody: divide-y divide-admin-border
    └── tr: hover:bg-admin-bg/50
        ├── Primary column: font-medium text-white
        ├── Secondary columns: text-gray-300
        └── Action links: text-brand-400 hover:text-brand-300
```

**Empty state:**
- Container: `rounded-xl border border-admin-border bg-admin-surface p-12 text-center`
- Icon: `h-16 w-16 rounded-full border bg-admin-bg` centered
- Title: `text-lg font-medium text-gray-300`
- Subtitle: `text-sm text-gray-500`
- CTA button: `rounded-lg bg-brand-500 px-6 py-3 font-medium text-white`

**Status badges** (`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium`):
- Completado: `bg-green-900/30 text-green-400`
- En Progreso: `bg-yellow-900/30 text-yellow-400`
- En Espera: `bg-orange-900/30 text-orange-400`
- Abierto: `bg-blue-900/30 text-blue-400`
- Admin role: `bg-brand-900/50 text-brand-300`
- Tecnico role: `bg-green-900/50 text-green-300`
- Ayudante role: `bg-yellow-900/50 text-yellow-300`
- Equipment reviewed: `bg-green-900/30 text-green-400`
- Equipment pending: `bg-yellow-900/30 text-yellow-400`

### 3c. Form Pages (Create/Edit for all entities)

**Structure:**
```
max-w-lg mx-auto
├── Back link: text-sm text-gray-400 hover:text-white (arrow icon h-4 w-4)
├── Title: mb-8 text-2xl font-bold text-white
└── Card: rounded-xl border border-admin-border bg-admin-surface p-6
    └── form.space-y-5
```

**Form fields:**
- Label: `text-gray-300` (required fields get red `*`)
- Inputs: `mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500 rounded-lg focus:ring-2 focus:ring-brand-400`
- Error messages: `text-xs text-red-400`

**Error banner:** `rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-sm text-red-400`

**Success state (user creation):** `rounded-xl border border-green-800 bg-green-900/30 p-8 text-center` with green icon and `text-green-300`

**Special form elements:**
- File upload (logo): styled `file:` pseudo-element with `file:bg-brand-500 file:text-white file:rounded-lg`
- Multi-checkbox user assignment: scrollable `max-h-60 overflow-y-auto rounded-lg border border-admin-border bg-admin-bg p-3` with checkboxes styled `h-4 w-4 text-brand-500`
- Read-only info row (folio number/status): `rounded-lg border border-admin-border bg-admin-bg px-4 py-3`

### 3d. Admin Login (`src/app/admin/login/page.tsx`)

- Full page: `bg-admin-bg` centered
- Card: `max-w-sm rounded-2xl border border-admin-border bg-admin-surface p-8 shadow-2xl`
- Logo: `h-16 w-16 rounded-full border border-admin-border bg-admin-bg` centered
- Title: `text-2xl font-bold text-white`
- Subtitle: `text-sm text-gray-400`
- Form: `space-y-5` with standard dark-themed fields

---

## 4. Technician Layout

**File:** `src/app/tecnico/layout.tsx`

- Background: `bg-tech-bg` (near-white)
- Fixed header: `h-14 border-b border-gray-200 bg-white` with "OMLEB" in `text-lg font-bold text-gray-900`
- Content: `pt-14 pb-20 p-4` (offset for header + bottom tab bar)
- Fixed bottom tab bar

### Bottom Tab Bar (`src/components/tecnico/bottom-tab-bar.tsx`)

- Container: `fixed bottom-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]`
- Tabs: `h-16 flex` with equal-width items
- Active tab: `text-brand-500` with filled icon
- Inactive tab: `text-gray-400 active:text-gray-600` with stroked icon
- Label: `text-xs font-medium`
- Icons: `h-6 w-6` (strokeWidth 1.5 for tech pages)
- Tab items: **Folios**, **Perfil**

---

## 5. Technician Pages

### 5a. Home / Empty State (`src/app/tecnico/page.tsx`)

- Container: `flex flex-col items-center justify-center px-4 py-16 text-center`
- Icon: `h-20 w-20 rounded-full bg-gray-100` centered
- Title: `text-xl font-bold text-gray-900`
- Subtitle: `text-base font-medium text-gray-600`
- Description: `max-w-xs text-sm text-gray-400`

### 5b. Profile Page (`src/app/tecnico/perfil/page.tsx`)

- Container: `max-w-md mx-auto`
- Title: `text-xl font-bold text-gray-900`
- Card: `rounded-xl border border-gray-200 bg-white p-6 shadow-sm`
  - Avatar: `h-20 w-20 rounded-full bg-brand-100 text-brand-600` with user icon
  - Info rows separated by `border-t border-gray-100 pt-4`:
    - Label: `text-xs font-medium text-gray-400 uppercase tracking-wide`
    - Value: `text-base font-medium text-gray-900`
  - Role badge: `rounded-full bg-brand-100 px-3 py-0.5 text-sm font-medium text-brand-700`
- Logout button: `w-full rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50`

### 5c. Technician Login (`src/app/login/page.tsx`)

- Full page: `bg-gradient-to-br from-brand-500 to-brand-700` centered
- Card: `max-w-sm rounded-2xl bg-white p-8 shadow-2xl`
- Logo: `h-16 w-16 rounded-full bg-brand-100 text-brand-600` centered
- Title: `text-2xl font-bold text-gray-900`
- Subtitle: `text-sm text-gray-500`
- Form: `space-y-5` with light-themed fields

---

## 6. Shared UI Components

### Button (`src/components/ui/button.tsx`)

| Variant | Styling |
|---------|---------|
| `primary` | `bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-400` |
| `secondary` | `border border-brand-300 text-brand-700 hover:bg-brand-50` |
| `danger` | `bg-red-600 text-white hover:bg-red-700` |

| Size | Styling |
|------|---------|
| `sm` | `px-3 py-1.5 text-sm min-h-[36px]` |
| `md` | `px-4 py-2 text-base min-h-[42px]` |
| `lg` | `px-6 py-3 text-lg min-h-[48px]` |

- Base: `inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150`
- Focus: `focus-visible:ring-2 focus-visible:ring-offset-2`
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: spinning SVG `h-4 w-4 animate-spin mr-2`
- Optional `fullWidth` prop adds `w-full`

### Input (`src/components/ui/input.tsx`)

- Base: `w-full rounded-lg border px-3 py-2.5 text-base min-h-[48px] placeholder:text-gray-400`
- Focus: `focus:ring-2 focus:ring-offset-1 focus:ring-brand-400 focus:border-brand-500`
- Error: `border-red-500 focus:ring-red-400` + message `mt-1.5 text-sm text-red-600`
- Password toggle: eye/eye-off icon at `right-3 top-1/2`

### Label (`src/components/ui/label.tsx`)

- Base: `block text-sm font-medium`
- Required: red `*` with `ml-0.5 text-red-500`

### Select (`src/components/ui/select.tsx`)

- Same dimensions and focus/error states as Input
- Base: `w-full rounded-lg border px-3 py-2.5 text-base min-h-[48px]`

### Textarea (`src/components/ui/textarea.tsx`)

- Same focus/error states as Input
- Base: `w-full rounded-lg border px-3 py-2.5 text-base min-h-[120px] resize-y`

### Delete Button (`src/components/admin/delete-button.tsx`)

- Uses `danger` variant, `sm` size
- Shows confirmation dialog before action
- Error display: `mt-1.5 max-w-xs text-xs text-red-400`

### Install Prompt (`src/components/shared/install-prompt.tsx`)

- Fixed bottom: `rounded-xl border border-gray-200 bg-white p-4 shadow-lg max-w-md`
- Icon: `h-10 w-10 rounded-lg bg-brand-500`
- Dismiss: `text-gray-500 hover:bg-gray-100`
- Install: `bg-brand-500 text-white hover:bg-brand-600`

---

## 7. Design Patterns Summary

| Pattern | Admin (Dark) | Technician (Light) |
|---------|-------------|-------------------|
| Background | `bg-admin-bg` (dark) | `bg-tech-bg` (near-white) |
| Card/Surface | `bg-admin-surface` | `bg-white` |
| Border | `border-admin-border` | `border-gray-200` |
| Primary text | `text-white` | `text-gray-900` |
| Secondary text | `text-gray-400` | `text-gray-600` |
| Tertiary text | `text-gray-500` | `text-gray-400` |
| Links | `text-brand-400` | `text-brand-600` |
| Error text | `text-red-400` | `text-red-600` |
| Input bg | `bg-admin-bg` | default (white) |
| Shadows | Minimal (hover only) | `shadow-sm` on cards |
| Corner radius | `rounded-xl` cards, `rounded-lg` inputs | Same |

---

## 8. Typography Scale

| Element | Classes |
|---------|---------|
| Page title | `text-2xl font-bold` (md: `text-3xl` on dashboard) |
| Section heading | `text-lg font-semibold` or `text-xl` |
| Card title | `text-base font-semibold` |
| Body text | `text-base` |
| Small text | `text-sm` |
| Extra small | `text-xs` |
| Labels | `text-sm font-medium` |
| Badges | `text-xs font-medium` |

---

## 9. Spacing Patterns

| Context | Value |
|---------|-------|
| Page padding | `p-4 md:p-8` |
| Form max-width | `max-w-lg` |
| Tech max-width | `max-w-md` |
| Form gap | `space-y-5` |
| Card padding | `p-6` (standard), `p-12` (empty states) |
| Table cells | `px-6 py-4` |
| Header height | `h-14` (56px) |
| Sidebar width | `w-64` (256px) |
| Bottom tab height | `h-16` (64px) |
| Heading → content | `mb-8` |
| Label → field | `mt-1.5` |

---

## 10. Icons

All icons are **inline SVGs**, Heroicons style (outlined, strokeWidth 2 for admin, 1.5 for tech).

| Context | Size |
|---------|------|
| Sidebar nav | `h-5 w-5` |
| Dashboard cards | `h-8 w-8` |
| Buttons | `h-5 w-5` |
| Back links | `h-4 w-4` |
| Tab bar | `h-6 w-6` |
| Empty states | `h-8–h-10` |
| Profile avatar | `h-10 w-10` |

---

## How to Use This Document

When writing a prompt to redesign the UI, reference this document and specify:
1. **What changes** — which colors, layouts, components to modify
2. **New values** — the exact new colors, spacing, typography you want
3. **Scope** — which pages/sections are affected (admin, tech, or both)
4. **Preserved elements** — what should stay the same

Example prompt structure:
> "Here is the current UI design: [paste this doc or reference it]. I want to change the admin side to [describe new design]. Keep [what stays]. Change [what changes]."
