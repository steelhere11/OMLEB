# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** Field technicians can quickly submit complete daily reports (with photos, equipment details, materials, and diagnostics) from their phone on-site -- no WhatsApp, no paper, no back-and-forth.
**Current focus:** Phase 10 complete. All feature phases (2-5.5, 8, 9, 10) done.

## Current Position

Phase: 10 (Feature Expansion) -- COMPLETE
Plan: 7 of 7 in current phase (all complete)
Status: Phase 10 complete. All feature phases done.
Last activity: 2026-03-05 -- Completed quick-004 (Restructure Equipment Photos + Admin Registro)

Progress: [███████████████████████████] 100% (31/31 feature plans complete)

Note: All 31 feature plans complete across phases 2-5.5, 8, 9, 10. Phase 1 has 2/3 done. Phase 6 (deployment) and Phase 7 (deployment guide) pending.

## Performance Metrics

**Velocity (from V1 build + Phase 5.5 + Phase 8 + Phase 9 + Phase 10):**
- Total plans completed: 31
- Average duration: ~6 min
- Total execution time: ~3.1 hours

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Decisions from V1 build carried forward -- see PROJECT.md for full list.

| ID | Decision | Phase |
|----|----------|-------|
| stage-dedup-pattern | Deduplicate evidence items by stage; combine descriptions as guidance bullets | 5.5 |
| orphan-photo-fallback | Photos without reporte_paso_id rendered in fallback section per equipment | 5.5 |
| pdf-fixed-header | PDF header fixed on all pages for multi-page reports | 5.5 |
| video-no-overlay | Videos skip GPS/date canvas burn; metadata stored in DB row | quick-001 |
| tipo-media-discriminator | tipo_media column (foto/video) on reporte_fotos with CHECK constraint | quick-001 |
| media-neutral-labels | UI labels changed to media-neutral Spanish: Evidencia, archivo(s), Agregar evidencia | quick-001 |
| html-overlay-not-canvas | Used HTML/CSS overlay on video instead of canvas.captureStream() to avoid audio sync and perf issues | quick-002 |
| as-const-dropdowns | Constants use 'as const' with value/label objects for typed dropdowns | 08-01 |
| nullable-nameplate-fields | Nameplate fields (capacidad, refrigerante, voltaje, fase, ubicacion) are nullable strings, not required | 08-01 |
| two-step-photo-query | Used two-step query (get report IDs, then IN query) for cross-folio photo lookups instead of Supabase inner join | 08-02 |
| shared-completeness-evaluator | Extracted evaluateRegistrationCompleteness as private helper shared between save and update actions | 08-02 |
| children-not-rendered-when-locked | PhaseGate does not render children when locked -- prevents unnecessary mounting and data fetching | 08-03 |
| debounced-text-immediate-select | Text inputs save on 800ms debounce, dropdowns/toggles save immediately for responsive UX | 08-03 |
| yellow-highlight-progressive | Empty fields get yellow highlight instead of red errors -- registration is progressive not form-submit | 08-03 |
| auto-complete-existing-folio-photo | SiteOverviewSection auto-completes on mount when folio-level site photo exists from previous visit | 08-03 |
| show-all-phases-completed | Completed reports bypass all gating and show all phases expanded | 08-04 |
| registration-entries-export-type | RegistrationEntry type exported from page.tsx and imported by report-form.tsx for cross-file type sharing | 08-04 |
| filter-reg-photos-by-etiqueta | Registration photos filtered by etiqueta in report-detail rather than separate query | 08-05 |
| reg-entries-from-reporte-equipos | Registration entries built from existing reporte_equipos join, not separate query | 08-05 |
| soft-cascade-via-actions | Keep RESTRICT FK constraints; implement explicit admin cascade deletes via server actions | 09-01 |
| admin-upload-auto-accepted | Photos uploaded by admin are auto-set to estatus_revision=aceptada | 09-01 |
| estatus-revision-default-pendiente | New photo review column defaults to pendiente for all tech-uploaded photos | 09-01 |
| entity-specific-wrappers | Thin client wrapper components per entity type to bridge server components with cascade delete actions | 09-02 |
| typed-confirmation-threshold | Typed confirmation required when entity has child data (reports, photos, references) | 09-02 |
| status-border-color-coding | Photo cards use color-coded borders matching review status for instant visual identification | 09-03 |
| immediate-flag-save | Aceptada/pendiente status changes save immediately; rechazada/retomar require note before saving | 09-03 |
| remove-photogrid | Removed legacy read-only PhotoGrid; all photo displays now use AdminPhotoCard with management controls | 09-03 |
| step-editor-inline-toggle | Step editor replaces read-only StepRow content when editing, not a modal | 09-04 |
| equipo-editor-below-header | Equipment info editor appears inline below the equipment card header | 09-04 |
| out-of-range-warning-only | Out-of-range reading values show yellow warning but do not block save | 09-04 |
| general-comments-primary | General comment section at bottom of report detail as primary area; scope selector for equipment targeting | 09-05 |
| feedback-banner-amber | Used amber/yellow banner for admin feedback to match warning pattern without being alarming | 09-06 |
| status-ring-on-thumbnail | Used colored ring borders (ring-2) on photo thumbnails for review status instead of overlays to keep photo content visible | 09-06 |
| reuse-comment-section-readonly | Reused CommentSection from admin with readOnly=true for technician view instead of creating a separate component | 09-06 |
| notes-below-photos | Step notes moved after photos in PDF for better visual pairing | 10-03 |
| callout-style-notes | Notes styled as italic callout blocks with blue left border and light background | 10-03 |
| equipo-id-in-pdf-data | Added equipo id to PdfReportData equipment entries for comment-to-equipment matching | 10-03 |
| amber-border-comments | Admin comments use amber left border to distinguish from blue note callouts | 10-03 |
| dynamic-dropdown-no-changes | Equipment type dropdowns already load dynamically from tipos_equipo table; no code changes needed for fan_coil | 10-05 |
| overwrite-not-duplicate | Annotated photo overwrites original in Supabase Storage at same path -- no duplicate rows or extra storage | 10-04 |
| native-resolution-export | Annotations rendered at native image resolution on offscreen canvas for export quality | 10-04 |
| annotate-photos-only | Annotation only available for photos (tipo_media=foto), not videos | 10-04 |
| body-scroll-lock | Body scroll locked and pinch-zoom prevented while annotator is open for smooth mobile drawing | 10-04 |
| custom-step-card-component | Created dedicated CustomStepCard component rather than modifying WorkflowStepCard to handle null plantilla | 10-06 |
| default-evidence-stages | Custom steps get default antes/durante/despues evidence stages since there is no plantilla to define them | 10-06 |
| purple-custom-badge | Custom steps visually distinguished with purple badge and purple-tinted styling | 10-06 |
| annotation-no-auto-revision | Photo annotation does not auto-create a revision entry; admin manually summarizes changes via revision modal | 10-07 |
| isCustom-type-propagation | Added isCustom to ReportPdfButtonProps step type for explicit type tracking through PDF data pipeline | 10-07 |
| remove-tech-general-photos | Removed redundant general photos section from tech equipment entry form; workflow steps handle all evidence | quick-004 |
| registro-equipos-replaces-fotos-generales | Replaced admin Fotos Generales with structured per-equipment Registro de Equipos section | quick-004 |

### Pending Todos

- User must add company logo to public/logo.png for PDF branding

### Blockers/Concerns

- [V1 Code]: ALL FEATURE PHASES COMPLETE (2-5.5, 8, 9, 10). Phase 1 has 2/3 plans done. Phase 6 pending.
- [Infrastructure]: Supabase and Vercel deployed and connected. Production URL: https://omleb-hvac.vercel.app
- [Phase 7]: Deployment guide will consolidate all pending todos above into a single playbook.
- [Phase 8 Complete]: Arrival & Registration flow fully implemented end-to-end.
- [Phase 9 Complete]: All 6 plans done -- migration, cascade deletes, photo management, inline editors, comments, technician feedback visibility.
- [Phase 10 Complete]: All 7 plans done -- revisions migration, admin revisions, PDF enhancements, photo annotation, fan coil equipment, custom steps, integration testing.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Video support on technician side with same legend layout as photos | 2026-03-01 | bd71c83 | [001-video-support-technician-photo-layout](./quick/001-video-support-technician-photo-layout/) |
| 002 | Live GPS/date/time overlay on video recording screen | 2026-03-02 | 045ee4f | [002-video-location-datetime-legend-overlay](./quick/002-video-location-datetime-legend-overlay/) |
| 003 | Admin full control: equipment removal + signature management on reports | 2026-03-03 | b6c7f91 | [003-admin-full-control-reports-equipment-signature](./quick/003-admin-full-control-reports-equipment-signature/) |
| 004 | Restructure equipment photos: remove tech general photos, add admin Registro de Equipos section | 2026-03-05 | baa557e | [004-restructure-equipment-photos-admin-registro](./quick/004-restructure-equipment-photos-admin-registro/) |

## Session Continuity

Last session: 2026-03-05
Stopped at: Completed quick-004. Restructured equipment photos -- removed tech general photos, added admin Registro de Equipos section.
Resume file: None
