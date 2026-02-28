---
phase: 05-admin-review-pdf-export
plan: 01
subsystem: admin-reporting
tags: [admin, reports, filters, read-only, supabase-query]

dependency-graph:
  requires: [03-01, 03-02, 03.5-01, 04-01, 04-02, 04-03]
  provides: [admin-report-list, admin-report-detail, report-filters]
  affects: [05-02, 05-03]

tech-stack:
  added: []
  patterns: [url-search-params-filtering, nested-supabase-joins, photo-grid-display]

key-files:
  created:
    - src/app/admin/reportes/page.tsx
    - src/app/admin/reportes/[reporteId]/page.tsx
    - src/app/admin/reportes/[reporteId]/report-detail.tsx
    - src/components/admin/report-filters.tsx
  modified: []

decisions:
  - "URL search params for report filtering (status, branch, date range) -- same pattern as standard admin pages"
  - "Photos grouped by equipo_id for display in equipment cards; general photos shown in separate section"
  - "Signature rendered as inline <img> with base64 data URL (not next/image -- base64 not supported by optimizer)"
  - "Placeholder #admin-actions div at footer for Plan 02 edit/approve and Plan 03 PDF export buttons"

metrics:
  duration: 5 min
  completed: 2026-02-28
---

# Phase 05 Plan 01: Admin Report List & Detail (Read-Only) Summary

Admin can view all submitted reports in a filterable list and drill into any report to see complete data including equipment entries with workflow steps, photos, materials, and signature.

## What Was Built

### Report List Page (`/admin/reportes`)
- Server component with URL-based search params for filtering
- Supabase query with nested joins (folios -> clientes, sucursales, users)
- Conditional filters: status, branch, date from, date to
- Table columns: Fecha, Folio, Sucursal, Creado por, Estatus, Aprobado, Acciones
- Status badges reuse same color pattern as folios page
- Aprobado column shows green checkmark for admin-finalized reports
- Empty state when no reports match

### Report Filters Component
- Client component with `useRouter`/`useSearchParams` for URL param updates
- 4 filter controls: status dropdown, branch dropdown, date from, date to
- "Limpiar filtros" button appears when any filter is active
- Styled consistently with admin theme

### Report Detail Page (`/admin/reportes/[reporteId]`)
- Server component fetches complete report data in single Supabase query with nested joins
- Also fetches team members from `folio_asignados`
- Not-found state with back link

### Report Detail Client Component
- Header: report title with folio number, date, status badge, approved badge
- Info section: sucursal, direccion, cliente, problema reportado, equipo de trabajo, creado por
- Equipment cards: equipment name/brand/model, work type badge (preventivo/correctivo), diagnostico/trabajo_realizado/observaciones text blocks, workflow step summaries with completion indicators and readings, photo grid per equipment
- General photos section for photos not tied to equipment
- Materials table with cantidad/unidad/descripcion
- Signature section with base64 image display
- Footer placeholder for future edit/approve/PDF buttons

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| URL search params for filtering | Standard pattern -- bookmarkable, shareable, works with browser back |
| Group photos by equipo_id | Natural grouping -- admin sees photos in context of each equipment entry |
| base64 `<img>` for signature | next/image doesn't support data URLs; base64 is stored directly in DB |
| Placeholder #admin-actions div | Clean extension point for Plan 02 and Plan 03 |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx next build --webpack` passes with zero errors
- `/admin/reportes` route registered as dynamic server-rendered page
- `/admin/reportes/[reporteId]` route registered as dynamic server-rendered page
- Sidebar "Reportes" link already existed from Phase 2 setup
- All user-facing text in Spanish

## Next Phase Readiness

Plan 05-02 (edit/approve) builds directly on this:
- `ReportDetail` component renders all data read-only; Plan 02 adds inline editing
- `#admin-actions` div is the insertion point for edit/approve buttons
- Data types and query patterns established here are reused

Plan 05-03 (PDF export) builds on this:
- All report data shapes (equipment, steps, photos, materials, signature) are defined
- Photo grid component pattern can inform PDF layout
