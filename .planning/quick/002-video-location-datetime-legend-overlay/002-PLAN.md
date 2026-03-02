---
phase: quick-002
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/shared/video-capture.tsx
autonomous: true

must_haves:
  truths:
    - "Video recording screen displays GPS address, date, and time as a visible overlay matching photo capture style"
    - "Overlay updates in real-time (time ticks, GPS refreshes)"
    - "Overlay is positioned bottom-right, white bold text with dark outline, same as photo capture"
    - "Overlay works even if GPS is unavailable (shows date/time only)"
  artifacts:
    - path: "src/components/shared/video-capture.tsx"
      provides: "Live metadata overlay during video recording"
      contains: "addressRef"
  key_links:
    - from: "src/components/shared/video-capture.tsx"
      to: "src/lib/gps.ts"
      via: "reverseGeocode call to get address lines"
      pattern: "reverseGeocode"
---

<objective>
Add a live GPS/date/time legend overlay to the video recording screen, matching the visual style that photo capture already shows.

Purpose: Videos currently show no location or timestamp info on screen during recording. Technicians need the same visual confirmation they get with photos — seeing GPS coordinates, address, date, and time overlaid on the viewfinder. This is critical for field documentation compliance.

Output: Updated video-capture.tsx with a live HTML overlay that mirrors the photo capture's bottom-right metadata badge.
</objective>

<execution_context>
@C:\Users\Leo\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\Leo\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/shared/video-capture.tsx
@src/components/shared/camera-capture.tsx
@src/lib/photo-stamper.ts
@src/lib/gps.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add live metadata overlay to video recording screen</name>
  <files>src/components/shared/video-capture.tsx</files>
  <action>
Modify VideoCapture to display a live GPS/date/time overlay during the camera preview and recording, matching the visual style of the photo capture's canvas-drawn overlay.

**What to add:**

1. **Import `reverseGeocode`** — it is already imported from `@/lib/gps` but the result is currently discarded (line 84-86 has a comment "Address not needed for video"). Change this: store the reverse-geocoded address lines in a ref (`addressRef = useRef<string[]>([])`) just like CameraCapture does.

2. **Update the `handleGpsResult` callback** to actually populate `addressRef.current` with the reverse geocode results, and to do the same in the GPS refresh interval (every 10s). Mirror exactly what CameraCapture does in its handleGpsResult (lines 58-89 of camera-capture.tsx).

3. **Add a time tick state** — add a `useState` for `currentTime` (Date) and a `useEffect` that runs `setInterval(() => setCurrentTime(new Date()), 1000)` to tick the displayed time every second. Clean up the interval on unmount.

4. **Render the HTML overlay** — add a `<div>` positioned absolutely over the video element, bottom-right, that renders the same information as `drawOverlayBadge` from photo-stamper.ts but as HTML/CSS instead of canvas:

```
Positioning: absolute, bottom-right, with margin (~16px from edges)
Text: right-aligned
Font: bold, white, text-shadow for dark outline (matching the canvas strokeText look)
Lines (bottom to top, same as photo):
  - Line 1: formatted date + time (e.g., "01 mar 2026 2:35:12 p.m.")
  - Lines 2+: addressRef.current lines (street, neighbourhood, city, state)
```

Use CSS text-shadow to replicate the dark outline effect:
```
textShadow: `-1px -1px 0 rgba(0,0,0,0.85), 1px -1px 0 rgba(0,0,0,0.85), -1px 1px 0 rgba(0,0,0,0.85), 1px 1px 0 rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.5)`
```

Format the date using `toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })` and time using `toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", second: "2-digit" })` — exactly matching photo-stamper.ts lines 27-38.

5. **Show overlay always** — the overlay should be visible both before and during recording (just like the photo capture shows the overlay at all times in the viewfinder). It should NOT be hidden during recording. It does NOT need to be hidden when GPS is not yet acquired — just show date/time without address lines.

6. **Do NOT change the video recording mechanism** — MediaRecorder still records the raw stream. The overlay is cosmetic on the screen only. The GPS/date metadata is already saved to the database via the upload flow. The overlay gives technicians visual confirmation that metadata is being captured — matching the photo experience.

**What to avoid and why:**
- Do NOT use canvas.captureStream() to burn the overlay into the video file — this adds complexity, potential audio sync issues, and mobile performance problems. The HTML overlay achieves the user's goal.
- Do NOT change the existing GPS acquisition logic — it already works. Just use the address results instead of discarding them.
- Do NOT move the overlay position — keep it bottom-right to match the photo capture convention.
- Do NOT hide the GPS status pill at the top when the overlay is shown — they serve different purposes (status pill = acquisition feedback, overlay = metadata display for documentation).
  </action>
  <verify>
Run `npx next build` to confirm no TypeScript or build errors. Then manually open the video recording screen on a phone/browser and confirm:
1. Date and time appear bottom-right in bold white text with dark outline
2. Time updates every second
3. When GPS is acquired, address lines appear below the date/time line
4. Overlay remains visible during recording
5. Visual style matches the photo capture overlay
  </verify>
  <done>
Video recording screen shows a live GPS/date/time overlay in the bottom-right corner matching the photo capture's visual style. Overlay updates in real-time. Works with or without GPS (date/time always shown, address lines added when GPS available).
  </done>
</task>

</tasks>

<verification>
- `npx next build` passes with no errors
- Video recording screen displays date/time overlay at all times
- Overlay visually matches photo capture's bottom-right badge (white bold text, dark outline, right-aligned)
- Time ticks every second
- Address lines appear after GPS acquisition
- Existing video recording, upload, and metadata storage work unchanged
</verification>

<success_criteria>
- Video recording screen shows the same location/date/time legend that photo capture shows
- Overlay style (position, font weight, color, outline) matches photo capture
- No regressions to video recording or upload functionality
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/002-video-location-datetime-legend-overlay/002-SUMMARY.md`
</output>
