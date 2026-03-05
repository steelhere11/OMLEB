# Tech UI/UX Redesign — Progress Tracker

**Source doc:** `c:\Users\Leo\Downloads\tech-ux-redesign.md`
**Last updated:** 2026-03-05
**Latest commit:** pending

---

## Progress Overview

| # | Feature | Status | Commit |
|---|---------|--------|--------|
| 0 | Visual redesign (shared tokens, logo, collapsible phases, density) | **DONE** | `6e51435` |
| 1 | Equipment status summary on home page | **DONE** | `6e51435` |
| 2 | Quick-complete gesture (long-press) | **DONE** | `c00be7f` |
| 3 | Photo counter per equipment | **DONE** | `c00be7f` |
| 4 | Admin feedback inline (per-step + per-equipment) | **DONE** | `c00be7f` |
| 5 | Recent/frequent materials autocomplete | **DONE** | pending |
| 6 | Offline indicator + upload queue | **DONE** | pending |
| 7 | Voice notes with speech-to-text | **DONE** | pending |

**8 of 8 features complete (100%)**

---

## Completed Features

### #0 — Visual Redesign

**Design tokens added to `src/app/globals.css`:**
- Shape tokens: `--radius-card: 10px`, `--radius-input: 6px`, `--radius-badge: 4px`
- Tech semantic colors: `--color-tech-border`, `--color-tech-border-subtle`, `--color-tech-text-primary`, `--color-tech-text-secondary`, `--color-tech-text-muted`
- Utility classes: `rounded-card`, `rounded-input`, `rounded-badge`, `text-label` (11px), `text-body` (13px), `text-section` (15px 600)
- Collapsible animation: `.phase-collapsible` CSS grid transition

**Logo in header:**
- `src/app/tecnico/layout.tsx` — replaced `<span>OMLEB</span>` with `<img src="/logo.png">`, migrated to token classes

**Collapsible PhaseGate:**
- `src/components/shared/phase-gate.tsx` — added `defaultOpen` prop, internal toggle state, chevron icon, CSS grid collapsible animation with `data-open` attribute
- `src/app/tecnico/reporte/[reporteId]/report-form.tsx` — each PhaseGate gets `defaultOpen` based on active-phase logic (only current phase expanded, auto-advances when phase completes)

**Step card density:**
- `workflow-step-card.tsx` — body `p-4 space-y-4` → `p-3 space-y-3`, procedure `p-3` → `p-2.5`, notes `min-h-[60px]` → `min-h-[48px]`

**Token migration (24 files total):**
All tech-side components migrated from raw Tailwind defaults to shared tokens:
- `rounded-xl` → `rounded-card`, `rounded-lg` → `rounded-input`
- `border-gray-200` → `border-tech-border`, `border-gray-100` → `border-tech-border-subtle`
- `bg-white` (cards) → `bg-tech-surface`
- `text-gray-900` → `text-tech-text-primary`
- `text-gray-600/700` → `text-tech-text-secondary`
- `text-gray-400/500` → `text-tech-text-muted`
- `text-sm` (body) → `text-body`, `text-xs` (labels) → `text-label`

Status colors (yellow, green, orange, blue for badges) were intentionally kept as-is.

**Files migrated:**
- `report-form.tsx`, `workflow-step-card.tsx`, `arrival-section.tsx`, `site-overview-section.tsx`
- `equipment-registration-section.tsx`, `equipment-registration-card.tsx`
- `equipment-section.tsx`, `equipment-entry-form.tsx`
- `workflow-preventive.tsx`, `workflow-corrective.tsx`
- `custom-step-card.tsx`, `corrective-issue-picker.tsx`
- `materials-section.tsx`, `status-section.tsx`, `papeleta-section.tsx`
- `reading-input.tsx`, `add-equipment-modal.tsx`
- `bottom-tab-bar.tsx`, `admin-feedback-banner.tsx`
- `evidence-stage-section.tsx`, `phase-gate.tsx`
- `tecnico/layout.tsx`, `tecnico/page.tsx`

### #1 — Equipment Status Summary

- `src/app/tecnico/page.tsx` — batch queries `reporte_equipos`, `reporte_pasos`, `reporte_fotos` per report
- Displays "3 equipos · 8/13 pasos · 12 fotos" under each ODS card on the home page
- Only shows when `equipCount > 0`

### #2 — Quick-Complete Gesture (Long-Press)

- `workflow-step-card.tsx` — 600ms long-press on collapsed header for simple steps (no required evidence AND no required readings)
- On long-press: marks step complete, triggers haptic vibration (`navigator.vibrate(50)`), green flash animation on the card
- Hint text "Mantener para completar" shown in collapsed subtitle for eligible steps
- `onContextMenu` prevented to avoid browser context menu on mobile long-press

### #3 — Photo Counter Per Equipment

- `src/app/actions/fotos.ts` — new `getPhotoCountsByEquipment(reporteId)` server action returns `Record<string, number>` (equipo_id → count)
- `equipment-section.tsx` — fetches counts on mount, passes `photoCount` to each `EquipmentEntryForm`
- `equipment-entry-form.tsx` — shows camera icon + count badge on collapsed card header (hidden when flagged count > 0 to avoid badge clutter)

### #4 — Admin Feedback Inline

Per-photo inline feedback was already implemented in `PhotoThumbnail` (ring colors, status icons, admin note below thumbnail, lightbox status labels). What was added:

- `FlaggedPhotoSummary` type in `page.tsx` extended with `equipoId` field
- `report-form.tsx` → passes `flaggedPhotos` to `EquipmentSection`
- `equipment-section.tsx` → filters flagged photos per `equipo_id`, passes `flaggedCount` to each `EquipmentEntryForm`
- `equipment-entry-form.tsx` → shows amber warning badge with count on collapsed header when equipment has flagged photos
- `workflow-step-card.tsx` → shows amber "N !" badge on collapsed header when any of the step's photos are flagged (retomar/rechazada)
- Top-level `AdminFeedbackBanner` kept as summary

---

## Remaining Cleanup (Optional)

6 tech files were NOT in the migration plan and still use raw gray classes:
- `src/app/tecnico/ordenes-servicio/[ordenId]/page.tsx`
- `src/app/tecnico/reporte/[reporteId]/page.tsx` (server component wrapper)
- `src/app/tecnico/perfil/page.tsx`
- `src/components/tecnico/custom-step-form.tsx`
- `src/components/tecnico/work-type-toggle.tsx`
- `src/components/tecnico/logout-button.tsx`

These are minor and can be migrated in a quick pass.

---

## Completed Features (Session 2)

### #5 — Recent/Frequent Materials Autocomplete

- `page.tsx` — queries `reporte_materiales` grouped by `catalogo_id` to build frequency map
- `materials-section.tsx` — `CatalogAutocomplete` sorts dropdown by usage frequency (most used first)
- On empty query focus: shows top 8 frequent items with "Frecuentes" header
- When typing: filtered results sorted by frequency, then alphabetical
- Usage count badge (`3x`) shown next to each catalog item in dropdown

### #6 — Offline Indicator + Upload Queue

- `src/lib/offline-queue.ts` — IndexedDB-backed queue (`omleb-offline-queue` database, `pending-uploads` store)
  - Stores pending photo/video uploads with blob data as ArrayBuffer
  - Tracks retry attempts, errors, timestamps
  - API: `enqueueUpload()`, `getPendingUploads()`, `getPendingCount()`, `removeUpload()`, `markAttempt()`, `clearQueue()`
- `src/lib/use-online-status.ts` — React hook for online/offline detection + queue drain
  - Listens to `navigator.onLine` + `online`/`offline` events
  - Auto-drains queue when connection returns (2s delay for stability)
  - Processes uploads sequentially, max 5 retry attempts per item
  - Returns: `isOnline`, `pendingCount`, `isDraining`, `drainQueue()`, `refreshCount()`
- `src/components/shared/offline-banner.tsx` — Banner UI
  - Offline: dark gray bar with "Sin conexion" + pending count
  - Online + pending: blue bar with spinner when draining, "Reintentar" button when idle
  - Hidden when online with no pending uploads
- `src/components/shared/offline-status-wrapper.tsx` — `OfflineBannerController` client component
- `src/app/tecnico/layout.tsx` — banner mounted below header (`fixed top-14 z-30`)
- `src/lib/photo-uploader.ts` — `compressAndUpload()` enhanced:
  - Checks `navigator.onLine` before upload attempt
  - Falls back to `queueForLater()` when offline or network error
  - Returns `{ success: true, queued: true, url: "", fotoId: "" }` for queued items
- All 6 photo capture handlers updated to handle queued results:
  - `workflow-step-card.tsx`, `custom-step-card.tsx` — yellow "N fotos en cola" indicator
  - `arrival-section.tsx`, `site-overview-section.tsx`, `equipment-registration-card.tsx`, `papeleta-section.tsx` — graceful skip

### #7 — Voice Notes with Speech-to-Text

- `src/components/shared/voice-input.tsx` — Reusable voice input component
  - Uses Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with `es-MX` locale
  - Continuous mode with interim results shown as italic preview text
  - Appends final transcripts to current textarea value
  - Feature detection: auto-hides on unsupported browsers
  - Visual feedback: mic button (gray) → recording (red pulse + stop square icon)
  - Refs used for callbacks to prevent stale closure issues
- Integrated in 3 locations:
  - `workflow-step-card.tsx` — "Notas del paso" textarea
  - `custom-step-card.tsx` — "Notas del paso" textarea
  - `equipment-entry-form.tsx` — "Observaciones generales" textarea
