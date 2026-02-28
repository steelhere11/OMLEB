# Phase 4: Photo Capture & Signatures - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Technicians can capture GPS/time-stamped photos and collect client signatures directly in the report — replacing the external stamping app entirely. Camera capture with live overlay, gallery upload with EXIF extraction, photo labeling per equipment/step, and digital signature from the branch manager on Completado.

</domain>

<decisions>
## Implementation Decisions

### Camera & overlay experience
- Live overlay on viewfinder — WYSIWYG, technician sees GPS/date/time stamp as they frame the shot
- Overlay position: semi-transparent bottom strip (matches their current stamping app)
- Review screen after capture with "Retake" and "Accept" buttons — catches bad shots before upload
- GPS fallback: use last known location when GPS fix unavailable (indoor, weak signal), mark as approximate on the overlay

### Photo organization & labeling
- Label-first flow: tech taps a label button (e.g., "ANTES"), then camera opens with label pre-assigned — consistent with Phase 3.5 workflow step buttons
- Antes/despues pairing is automatic by label + equipment — any "antes" photo on Equipment X pairs with any "despues" photo on the same equipment
- Thumbnails display as horizontal scroll row per equipment/step — tap to expand full-size
- No photo count limit — trust technicians to be reasonable

### Gallery upload handling
- Same label-first flow as camera: tap label → choose "Camera" or "Gallery" source
- Auto-apply overlay from EXIF data when GPS/timestamp available — same look as camera photos
- Gallery photos without EXIF metadata: allow upload without overlay, show "no metadata" indicator on thumbnail
- Multi-select from gallery: tech picks several photos at once, all assigned the same label

### Signature capture flow
- Force landscape orientation when signature pad opens — natural signing space
- Capture both typed name (branch manager) and drawn signature — more complete for PDF
- Signature appears as separate final step: after setting status to "Completado", dedicated "Collect Signature" screen before submit
- Single "Borrar" (clear) button to reset — no undo, just wipe and re-sign

### Claude's Discretion
- Photo compression settings and quality level
- Canvas overlay rendering implementation (font size, opacity, exact formatting)
- Signature pad library choice and canvas sizing
- Upload progress indicators and error retry behavior
- Image storage path structure in Supabase Storage
- Exact review screen layout and transitions

</decisions>

<specifics>
## Specific Ideas

- Bottom overlay strip should look similar to the existing third-party stamping app they currently use — familiar to the techs
- Label buttons (ANTES, DURANTE, DESPUES, etc.) already exist as placeholders from Phase 3.5 workflow step cards — Phase 4 wires them to the actual camera
- Landscape signature feels like signing a real document
- Branch manager typed name + signature together gives the PDF professional credibility

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-photo-capture-signatures*
*Context gathered: 2026-02-27*
