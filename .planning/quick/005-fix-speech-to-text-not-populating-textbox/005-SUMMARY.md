---
phase: quick
plan: 005
subsystem: technician-voice-input
tags: [web-speech-api, safari, ios, voice-input, cross-browser]
dependency-graph:
  requires: []
  provides: [safari-ios-voice-dictation]
  affects: []
tech-stack:
  added: []
  patterns: [pseudo-continuous-recognition, auto-restart-onend]
file-tracking:
  key-files:
    created: []
    modified:
      - src/components/shared/voice-input.tsx
decisions:
  - id: continuous-false-auto-restart
    description: "Use continuous=false with auto-restart in onend instead of continuous=true, because Safari/iOS silently fails with continuous=true"
metrics:
  duration: ~1 min
  completed: 2026-03-05
---

# Quick Task 005: Fix Speech-to-Text Not Populating Textbox

**One-liner:** Safari/iOS fix for Web Speech API using continuous=false with auto-restart in onend to simulate continuous listening.

## What Was Done

Fixed the VoiceInput component (`src/components/shared/voice-input.tsx`) so that speech-to-text works on Safari/iOS. The root cause was that Safari does not support `continuous: true` on the Web Speech API -- the recognition session starts (microphone activates, browser shows the mic indicator) but `onresult` never fires, so no text appears in the text field.

### Changes Made

1. **`continuous = true` changed to `continuous = false`** -- Safari/iOS silently fails when continuous mode is enabled. Setting it to false means each recognition session captures one utterance then fires `onend`.

2. **`onend` handler auto-restarts** -- When `continuous = false`, the recognition ends after each utterance. The `onend` handler now checks `isListeningRef.current` and if the user hasn't pressed stop, it calls `recognition.start()` again. This creates pseudo-continuous behavior that works on both Safari and Chrome.

3. **`currentValueRef.current = newValue` added to `onresult`** -- After calling `onTranscriptRef.current(newValue)`, the ref is immediately updated so rapid restarts don't lose text due to stale ref values (React may not have re-rendered yet when the next recognition session fires).

4. **`onerror` returns early on "no-speech"/"aborted"** -- Instead of killing the session on these non-fatal errors, the handler returns early and lets `onend` handle restart. On Safari with `continuous = false`, "no-speech" fires if the user pauses between sentences.

### Files Modified

| File | Change |
|------|--------|
| `src/components/shared/voice-input.tsx` | Four targeted changes to recognition lifecycle handlers |

No consumer components were modified -- the VoiceInput API remains identical.

## Commits

| Hash | Message |
|------|---------|
| 686694c | fix(quick-005): speech-to-text not populating textbox on Safari/iOS |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx next build` passes with no errors
- VoiceInput component uses `continuous = false`
- `onend` handler auto-restarts recognition when `isListeningRef.current` is true
- `onresult` handler immediately updates `currentValueRef.current` to prevent stale accumulation
- No changes in any consumer component files
