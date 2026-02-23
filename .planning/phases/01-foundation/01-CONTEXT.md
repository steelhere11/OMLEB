# Phase 1: Foundation - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Auth system (login, account creation, role-based routing), full database schema with RLS policies, PWA shell (manifest, service worker, installable), and the app shell layouts for both admin and technician. No data management, no reporting — just the infrastructure and empty shells that everything else plugs into.

</domain>

<decisions>
## Implementation Decisions

### Login experience
- Separate login pages: admin at /admin/login, technicians at /login — visually distinct entry points
- Technician login page: branded with color — background color/gradient, logo, styled fields. Polished first impression on mobile
- Admin login page: styled to match admin dashboard tone (dark mode)
- Login errors shown inline under the relevant field (e.g., "Contrasena incorrecta" under password field)
- All error messages in Spanish

### Admin dashboard shell
- Sidebar navigation — fixed left sidebar with sections: Clientes, Sucursales, Equipos, Folios, Usuarios, Reportes
- Sidebar collapses to hamburger/drawer on mobile (fully responsive — admin can work from phone too)
- Landing page: welcome message + prominent quick-action buttons (Crear Cliente, Crear Sucursal, Crear Tecnico)
- Visual tone: dark mode — dark backgrounds, lighter text, modern SaaS feel

### Technician landing view
- Bottom tab bar navigation — fixed bottom bar, thumb-friendly (Folios tab + Perfil tab at minimum)
- Visual tone: light mode — white/light backgrounds for outdoor readability on phone screens
- Profile tab shows technician name/role/account info; main screen stays focused on work
- Phase 1 shell: empty state ready for Phase 2-3 to populate with folio data

### PWA install & branding
- App name: "OMLEB" (placeholder until final name decided)
- Brand colors: will come from company logo once provided — use neutral professional palette as placeholder
- Install prompt: show when browser detects app is ready to install (beforeinstallprompt event), not forced
- App icon: placeholder until logo provided

### Claude's Discretion
- Session persistence strategy for technicians (stay logged in vs timeout — optimize for field workers who reopen the app daily)
- Offline fallback approach for V1 (full offline is V4 — just need a graceful degradation now)
- Technician Phase 1 shell content (empty folio list vs welcome screen — whatever makes sense before data exists)
- Placeholder color palette until company logo/brand colors are provided
- Admin sidebar section ordering and icons
- Loading states and transition animations

</decisions>

<specifics>
## Specific Ideas

- Admin and technician have distinctly different visual identities: dark mode admin (desk/office), light mode technician (field/outdoor)
- Technician login should feel polished — it's the first thing field workers see, branded with color gives a professional impression
- Admin dashboard should feel like a modern SaaS tool — sidebar nav, dark theme, quick actions on landing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-23*
