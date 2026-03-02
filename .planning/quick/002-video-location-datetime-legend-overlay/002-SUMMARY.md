---
phase: quick-002
plan: 01
subsystem: technician-video
tags: [video, gps, overlay, metadata, mobile]
dependency-graph:
  requires: [quick-001]
  provides: [video-live-overlay]
  affects: []
tech-stack:
  added: []
  patterns: [html-overlay-over-video, ref-driven-address-cache, clock-tick-state]
key-files:
  created: []
  modified:
    - src/components/shared/video-capture.tsx
decisions:
  - id: html-overlay-not-canvas
    description: "Used HTML/CSS overlay on video instead of canvas.captureStream() to avoid audio sync issues and mobile performance problems"
metrics:
  duration: "~2 min"
  completed: "2026-03-02"
---

# Quick Task 002: Video Location/DateTime Legend Overlay Summary

**One-liner:** Live GPS address + date/time HTML overlay on video recording screen, matching photo capture's bottom-right bold white text style.

## What Was Done

### Task 1: Add live metadata overlay to video recording screen
**Commit:** `045ee4f`

Modified `video-capture.tsx` to display a real-time GPS/date/time legend overlay during the camera preview and recording:

1. **Added `addressRef`** to store reverse-geocoded address lines (previously the geocode result was discarded with a comment "Address not needed for video")
2. **Updated `handleGpsResult`** to populate `addressRef.current` with address lines from `reverseGeocode()`, both on initial GPS acquisition and in the 10-second refresh interval -- mirroring exactly what `camera-capture.tsx` does
3. **Added clock tick** via `currentTime` state + `setInterval` every 1 second, with proper cleanup through `clockRef`
4. **Rendered HTML overlay** positioned `absolute bottom-24 right-4` with:
   - `pointer-events-none` so it doesn't block touch interactions
   - CSS `text-shadow` replicating the dark outline effect from `drawOverlayBadge` in photo-stamper.ts
   - Date formatted via `toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })`
   - Time formatted via `toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", second: "2-digit" })`
   - Address lines rendered below the date/time line
5. **Overlay always visible** -- date/time shows immediately, address lines appear after GPS + reverse geocode completes (within 1 second of acquisition due to clock tick re-renders)
6. **No changes to recording mechanism** -- MediaRecorder still records the raw stream; overlay is cosmetic screen-only

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx next build` passes with no errors
- Video recording screen displays date/time overlay at all times (bottom-right)
- Overlay visually matches photo capture's style (white bold text, dark outline via text-shadow, right-aligned)
- Time ticks every second via `currentTime` state
- Address lines appear after GPS acquisition via `addressRef` populated by `reverseGeocode`
- Existing video recording, upload, and metadata storage unchanged
- All cleanup handlers properly clear the clock interval on unmount

## Key Technical Details

- The overlay uses `bottom-24` (6rem / 96px from bottom) to sit above the bottom controls area without overlap
- `addressRef` is a ref (not state) to avoid unnecessary re-renders from GPS refreshes -- the 1-second clock tick already triggers re-renders that pick up address changes
- The `clockRef` interval is cleaned up both in the dedicated useEffect cleanup AND in the main `cleanup()` function (which runs on close/unmount)
