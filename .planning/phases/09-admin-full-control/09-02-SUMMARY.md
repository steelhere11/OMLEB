---
phase: 9
plan: 2
subsystem: admin-ui
tags: [cascade-delete, modal-dialog, typed-confirmation, admin-ui]
dependency-graph:
  requires: [09-01]
  provides: [cascade-delete-ui, impact-summary-dialogs]
  affects: [09-03, 09-04, 09-05, 09-06]
tech-stack:
  added: []
  patterns: [reusable-client-wrapper-per-entity, impact-fetching-in-server-components]
key-files:
  created:
    - src/components/admin/cascade-delete-button.tsx
    - src/components/admin/folio-delete-button.tsx
    - src/components/admin/reporte-delete-button.tsx
    - src/components/admin/equipo-delete-button.tsx
    - src/components/admin/sucursal-delete-button.tsx
  modified:
    - src/app/admin/folios/page.tsx
    - src/app/admin/folios/[id]/page.tsx
    - src/app/admin/reportes/page.tsx
    - src/app/admin/reportes/[reporteId]/report-detail.tsx
    - src/app/admin/equipos/[sucursalId]/page.tsx
    - src/app/admin/sucursales/page.tsx
decisions:
  - id: entity-specific-wrappers
    description: Created thin client wrapper components per entity type (FolioDeleteButton, ReporteDeleteButton, etc.) to bridge server components with client-side cascade delete actions
  - id: typed-confirmation-threshold
    description: Typed confirmation required for folios with reports, reports with photos, equipos with report references, and always for sucursales
metrics:
  duration: ~6 min
  completed: 2026-03-02
---

# Phase 9 Plan 2: Delete UI -- Folios, Reportes, Equipos, Sucursales Summary

**Reusable CascadeDeleteButton with modal dialog, impact summary, and typed confirmation for high-impact cascade deletes across all admin entity pages**

## What Was Built

### CascadeDeleteButton (core reusable component)
- Modal dialog with backdrop overlay
- Impact summary display in styled warning box
- Optional typed confirmation (must match entity label exactly)
- Loading spinner during async delete
- Error display within dialog
- Redirect or router refresh on success
- All UI text in Spanish

### Entity-specific wrapper components
Pattern: thin client components that import both `CascadeDeleteButton` and the appropriate server action from `admin-delete.ts`, allowing server page components to render them with impact data as props.

- **FolioDeleteButton**: shows report + photo count impact
- **ReporteDeleteButton**: shows equipment, photo, material count impact
- **EquipoDeleteButton**: shows report reference count impact
- **SucursalDeleteButton**: shows folio, report, equipment, photo count impact (always requires typed confirmation)

### Page updates
- **Folios list**: delete button per row, query extended to include `reportes(id)` for count
- **Folio detail**: delete button in header, photo count fetched via cross-report query
- **Reportes list**: delete button per row, query extended to include `reporte_fotos(id)` for count
- **Report detail**: delete button in header with full impact stats
- **Equipos per sucursal**: replaced old `DeleteButton`/`deleteEquipo` with cascade version, fetches `reporte_equipos` reference counts
- **Sucursales**: replaced old `DeleteButton`/`deleteSucursal` that failed on FK RESTRICT, fetches full cascade impact data

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 9f9812f | feat(09-02): create CascadeDeleteButton component |
| 2 | 5d8c83d | feat(09-02): add cascade delete to folios list and detail pages |
| 3 | 09d37c8 | feat(09-02): add cascade delete to reportes list and detail pages |
| 4 | 9e4f441 | feat(09-02): update equipos delete to use cascade action |
| 5 | 06c2572 | feat(09-02): update sucursales delete to use cascade action |

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| entity-specific-wrappers | Created thin client wrapper components per entity type rather than a single generic component | Server components cannot pass inline closures to client components in Next.js App Router; entity wrappers import server actions directly and accept only serializable props |
| typed-confirmation-threshold | Typed confirmation required when entity has child data (reports, photos, references) | Prevents accidental deletion of data with cascading consequences while keeping zero-impact deletes quick |

## Deviations from Plan

None -- plan executed exactly as written.

## Next Phase Readiness

- Delete UI complete across all entity types
- Plans 09-03 through 09-06 can proceed (photo management, step editing, equipment editing, comments)
- The `delete-button.tsx` component is still used elsewhere (if any) -- not removed, just no longer used by sucursales/equipos pages
