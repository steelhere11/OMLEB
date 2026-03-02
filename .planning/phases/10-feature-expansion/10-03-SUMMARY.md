---
phase: 10-feature-expansion
plan: 03
subsystem: pdf
tags: [react-pdf, comments, layout, pdf-generation]

# Dependency graph
requires:
  - phase: 09-admin-full-control
    provides: admin comments system (reporte_comentarios)
  - phase: 05-pdf-workflow-integration
    provides: PDF report generation with StepBlock rendering
provides:
  - PDF step notes rendered below photos with callout styling
  - Admin comments included in PDF output (equipment-scoped and general)
  - Comments data pipeline from report-detail through PDF button to PDF renderer
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Comment-photo pairing: notes below photos, comments near relevant equipment"
    - "Data pipeline extension: adding props through dynamic import chain"

key-files:
  created: []
  modified:
    - src/components/pdf/report-document.tsx
    - src/components/admin/report-pdf-button.tsx
    - src/app/admin/reportes/[reporteId]/report-detail.tsx

key-decisions:
  - "notes-below-photos: Step notes moved after photos in PDF for better visual pairing"
  - "callout-style-notes: Notes styled as italic callout blocks with blue left border and light background"
  - "equipo-id-in-pdf-data: Added equipo id to PdfReportData equipment entries for comment-to-equipment matching"
  - "amber-border-comments: Admin comments use amber left border to distinguish from blue note callouts"

patterns-established:
  - "Comment rendering: amber-bordered blocks with author name and date"
  - "Callout notes: italic text with colored left border and tinted background"

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 10 Plan 03: PDF Comment-Photo Pairing Summary

**PDF step notes repositioned below photos with callout styling, plus admin comments rendered in equipment sections and general section before signature**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-02T07:21:56Z
- **Completed:** 2026-03-02T07:25:40Z
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments
- Step notes now appear directly below step photos (not before them) with an italic callout style featuring a blue left border
- Admin comments flow through the data pipeline from report-detail to PDF renderer
- Equipment-scoped admin comments render inside their relevant equipment cards
- General admin comments render as a dedicated section before the signature

## Task Commits

Each task was committed atomically:

1. **Task 1: Reorder StepBlock notes below photos** - `00acb64` (feat)
2. **Task 2: Add comments data pipeline** - `d4be600` (feat)
3. **Task 3: Render equipment-scoped comments** - `2b32b84` (feat)
4. **Task 4: Render general comments before signature** - `b5f17c8` (feat)

## Files Created/Modified
- `src/components/pdf/report-document.tsx` - Reordered notes/photos in StepBlock, added stepNoteCallout style, added comment styles and rendering for both equipment-scoped and general comments, added equipo id and comments to PdfReportData interface
- `src/components/admin/report-pdf-button.tsx` - Added comments prop, equipo id to equipment entries, mapped comments into pdfData
- `src/app/admin/reportes/[reporteId]/report-detail.tsx` - Passed comments and equipo_id through to ReportPdfButton

## Decisions Made
- Notes positioned below photos (not before) to create visual pairing between evidence and observations
- Used blue left border for step note callouts vs amber left border for admin comments to visually distinguish the two
- Added equipo.id to PdfReportData interface to enable comment-to-equipment matching without schema changes
- General comments (without equipo_id) rendered as separate section before signature

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PDF now includes all admin feedback (comments) alongside relevant equipment
- Step notes visually paired with their photo evidence
- Ready for next plan in phase 10

---
*Phase: 10-feature-expansion*
*Completed: 2026-03-02*
