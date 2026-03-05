# Tech UI/UX Redesign — Progress Tracker

**Source doc:** `c:\Users\Leo\Downloads\tech-ux-redesign.md`
**Last updated:** 2026-03-05
**Commit:** `6e51435` — `feat: tech UI redesign — shared design tokens, collapsible phases, equipment summary`

---

## Progress Overview

| # | Feature | Status | Commit |
|---|---------|--------|--------|
| 0 | Visual redesign (shared tokens, logo, collapsible phases, density) | **DONE** | `6e51435` |
| 1 | Equipment status summary on home page | **DONE** | `6e51435` |
| 2 | Quick-complete gesture (long-press) | **DONE** | — |
| 3 | Photo counter per equipment | **DONE** | — |
| 4 | Admin feedback inline (per-step) | **DONE** | — |
| 5 | Recent/frequent materials autocomplete | **PENDING** | — |
| 6 | Offline indicator + upload queue | **PENDING** | — |
| 7 | Voice notes with speech-to-text | **PENDING** | — |

---

## What Was Completed (#0 + #1)

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

- `FlaggedPhotoSummary` type extended with `equipoId` field
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

## Pending Features — Implementation Notes

### #2 — Quick-Complete Gesture (Recommended Next)
**Effort:** Low-Medium | **Impact:** High

For simple steps without required photos/readings, allow marking complete without expanding. Options:
- **Long-press** on collapsed step card header → mark complete (most reliable cross-browser)
- **Swipe-right** gesture (needs touch event handling, more complex)
- Only enable for steps where `evidencia_requerida` is empty AND `lecturas_requeridas` is empty

**Key files:** `workflow-step-card.tsx` (add long-press handler to collapsed header button)

### #3 — Photo Counter Per Equipment
**Effort:** Low | **Impact:** Medium

Show photo count badge per equipment in the report view. Query `reporte_fotos` grouped by `equipo_id`.

**Key files:** `equipment-entry-form.tsx` or `equipment-section.tsx` (add badge to equipment card header)

### #4 — Admin Feedback Inline (Recommended Next)
**Effort:** Medium | **Impact:** High

Currently admin feedback shows as a top-level banner (`admin-feedback-banner.tsx`). Need to:
1. Map `reporte_fotos.estatus_revision` and `reporte_fotos.nota_admin` back to their `reporte_paso_id`
2. Pass flagged photos data down into `workflow-step-card.tsx`
3. Render inline warnings next to the specific flagged photo within `evidence-stage-section.tsx`
4. Keep the top banner as a summary ("2 fotos necesitan atencion") but add inline markers

**Key files:** `report-form.tsx` (data plumbing), `workflow-step-card.tsx` (receive + pass down), `evidence-stage-section.tsx` (render inline flags)

### #5 — Recent/Frequent Materials Autocomplete
**Effort:** Low | **Impact:** Medium

Track material usage frequency per user. Sort catalog dropdown by frequency descending.
- Could add a `material_uso_frecuencia` table or just query `reporte_materiales` grouped by `catalogo_id` + `creado_por`
- Sort the catalog results in `materials-section.tsx` before rendering

**Key files:** `materials-section.tsx`, possibly a new server action

### #6 — Offline Indicator + Upload Queue
**Effort:** High | **Impact:** High

Major feature. Requires:
- `navigator.onLine` listener + Network Information API
- IndexedDB queue for pending uploads (photos, form saves)
- Service worker or background sync for retry logic
- Persistent banner in `tecnico/layout.tsx` when offline
- Queue drain UI with count + success toast

**Key files:** New `src/lib/offline-queue.ts`, `src/lib/photo-uploader.ts` (wrap with queue), `tecnico/layout.tsx` (banner)

### #7 — Voice Notes with Speech-to-Text
**Effort:** Medium | **Impact:** Medium-High

Use Web Speech API (`SpeechRecognition`) with `es-MX` locale:
- Mic button next to each `<Textarea>` for notes
- Real-time transcription into the textarea
- Fallback: record audio blob + store as attachment for manual transcription
- Safari/iOS partial support — need feature detection

**Key files:** New `src/components/shared/voice-input.tsx`, integrate into `workflow-step-card.tsx` notes section, `custom-step-card.tsx`, any other notes textareas

---

## Recommended Next Session Order

1. **#2 Quick-complete gesture** + **#3 Photo counter** — both are quick wins, can be done together
2. **#4 Admin feedback inline** — medium effort but high impact
3. **#5 Materials autocomplete** — quick win
4. **#7 Voice notes** — medium effort, big field UX improvement
5. **#6 Offline queue** — save for a dedicated session, most complex feature
