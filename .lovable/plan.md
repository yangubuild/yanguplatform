# Speak to Build → Real-time Conversational Voice Interface (FINAL LOCKED)

## Vision
This is YANGU's "talk to build your business" moment. A farmer can launch a store by speaking. A trader can build without typing. A creator can generate a site in seconds. Speak to Build is a phone-call experience with ADA — no forms, no buttons, just voice.

## UI Layout
```
┌─────────────────────────────────────────┐
│  ⚡ Live Voice · ADA          EN    ✕   │
├─────────────────────────────────────────┤
│              00:14                      │
│           ╭─────────────╮               │
│          (    ◉ orb     )               │  idle | speaking | listening | thinking
│           ╰─────────────╯               │
│         ADA is speaking                 │
│  "What would you like to build today?"  │
│  You: a coffee shop in Kampala          │
│            Tap to interrupt             │
├─────────────────────────────────────────┤
│   [ 📞 End Call ]   [ 💬 Open Chat ]    │
└─────────────────────────────────────────┘
```

## Behavior Flow
1. **ADA speaks first** — no mic permission on mount. Orb in `speaking`, intro line via TTS, call timer starts.
2. **Mic permission timing** — request `getUserMedia` on whichever happens first: user's first tap on the call surface, OR ADA finishes the first prompt. Satisfies Safari/iOS user-gesture rule.
3. **Auto-listen via VAD** — `AnalyserNode` RMS sampled every 100 ms. Speech start ~0.04, end-of-speech silence window 1.2 s. Caps: 0.5 s min, 15 s max.
4. **Manual override always available** — tapping orb force-toggles recording at any time (start if idle, stop+submit if listening, cancel if speaking).
5. **VAD stall fallback** — no speech after 4 s active listening → "Tap to speak" hint.
6. **Hidden text fallback** — after 2 consecutive STT failures → reveal slim text strip; auto-hide on next successful voice turn.
7. **Barge-in** — voice detected during ADA speech → `voiceInterrupt()` then switch to listening.
8. **Step advance** — transcript flows into existing `handleTextAnswer(text)`. Step machine advances. Next prompt spoken via locked session voice.
9. **Voice consistency lock** — one `voice_id` per session (per detected language), stored on `sessionVoiceRef`, passed on every TTS call. Never changes mid-session.
10. **Build completion magic moment**:
    - Step machine `building` → orb `thinking`, status "Building your site…"
    - On success ADA says: *"Your website is ready. You can continue editing by voice or chat."*
    - **1.5 s pause** after TTS ends → fade out call UI (300 ms) → route to editor with fade-in (300 ms) → sonner toast: *"Built with Speak to Build"* (3 s, bottom-center).
11. **End Call** → full cleanup → `onBack()`.
12. **Open Chat** → cleanup + hand `answers` to parent → switch entry mode `speak` → `chat` with answers prefilled.

## 🔒 Final Engineering Locks (MANDATORY)

### 1. Hard interrupt priority (race-condition guard)
`voiceInterrupt()` must SYNCHRONOUSLY cancel audio output BEFORE any recorder state change. TTS and recording must never overlap. Implementation: `voiceController.interrupt()` calls `stopSpeaking()` synchronously, returns only after `activeAudio = null`. Hook awaits this before calling `recorder.start()`.

### 2. Single active recorder rule
`useVoiceCall.ts` guards every entry point with `isRecordingRef`:
```ts
if (isRecordingRef.current) return;
isRecordingRef.current = true;
```
Prevents double-triggers from VAD + tap collision, rapid taps, mobile glitches. Released only in recorder `onstop` and error paths.

### 3. Transcript debounce (ghost submission guard)
After STT returns, drop the transcript if:
- length < 2 characters after trim, OR
- identical (case-insensitive, trimmed) to last accepted transcript within 2000 ms.
Tracked via `lastTranscriptRef = { text, ts }`.

### 4. Silence auto-recovery
After 2 consecutive VAD stalls (no speech detected within 4 s window), ADA speaks (in current language): *"You can speak anytime, or tap the screen to start."* Counter resets on any successful transcript. Prevents dead sessions.

### 5. Timeout safety (30 s per-turn fail-safe)
Every voice turn starts a 30 s watchdog timer. If STT does not return a result within 30 s of recorder stop → cancel pending request, reset to listening state, increment failure counter. Prevents stuck sessions on network failure.

### 6. Mobile audio routing fix (iOS earpiece bug)
Force speaker output by:
- Setting `audio.setAttribute('playsinline', 'true')` on every TTS Audio element.
- Setting `audio.setAttribute('webkit-playsinline', 'true')`.
- Using `AudioContext` with `latencyHint: 'interactive'`.
- On iOS, calling `audio.play()` only inside the user gesture chain (first tap unlocks).
Without this, iOS routes to earpiece and feels broken.

### 7. Session cleanup (memory leak prevention)
On End Call / Open Chat / Completion / unmount, `useVoiceCall.cleanup()` runs:
- `mediaStream.getTracks().forEach(t => t.stop())`
- `analyser.disconnect()` + `audioContext.close()`
- `clearTimeout` on all timers (VAD stall, 30 s watchdog, completion delay)
- `mediaRecorder.stop()` if active
- `voiceController.interrupt()` to cancel TTS
- Null all refs

## Files to change
- `src/components/builder/speak-to-build/SpeakToBuild.tsx` — rewrite render layer; keep step machine, parsers; append completion magic-moment sequence.
- `src/components/builder/speak-to-build/VoiceCallUI.tsx` *(new)* — header, timer, orb mount, status, subtitles, footer, hint, hidden text strip. Owns fade-out class.
- `src/components/builder/speak-to-build/VoiceOrb.tsx` *(new)* — `state`, `level`, `onTap`. Speaking = bars; listening = rings driven by `level`; thinking = shimmer; idle = breathe. Whole orb is tap target.
- `src/components/builder/speak-to-build/useVoiceCall.ts` *(new)* — encapsulates lazy mic acquisition, VAD loop, auto-record/stop, barge-in, 4 s stall, 30 s watchdog, transcript debounce, single-recorder guard, manual `toggle()`, full `cleanup()`. Exposes `{ uiState, level, hint, toggle, stop, cleanup }`.
- `src/components/builder/speak-to-build/copy.ts` — add localized strings: `live_voice`, `ada_speaking`, `listening`, `thinking`, `building_status`, `tap_to_interrupt`, `tap_to_speak`, `silence_recovery`, `end_call`, `open_chat`, `mic_required`, `site_ready`, `built_with_speak_to_build`.
- `src/lib/voice/voiceController.ts` — `speak()` accepts optional `voiceId`; add `speakAsync()` returning a promise that resolves on playback end (used for completion line + 1.5 s wait); `interrupt()` made synchronous; iOS playsinline attrs.
- `supabase/functions/ada-tts/index.ts` — accept optional `voice_id` body param, override per-language default when present.
- Entry pages (`SellerSurfacePage`, `InfluencerPage`, `DashboardCommunityPage`) — add `onOpenChat(prefill)` callback to switch mode `speak` → `chat` with answers prefilled as initial user message.

## Untouched
`voiceController` core, `ada-transcribe-audio`, language detection, sticky language, Build with Chat, step machine, parsers, completion payload (`_speak_to_build: true`).

## Removed from UI
Category buttons, yes/no buttons, style grid, persistent text input, send button, persistent mic toggle, mute button, back arrow card, prompt card, subtitle bar.

## Edge cases
- Mic denied → "Microphone required" + Open Chat shortcut.
- 2× STT failure → ADA "Sorry, I didn't catch that — could you repeat?" + reveal text strip.
- VAD silent 4 s → "Tap to speak" hint (orb tap already works).
- 2× consecutive VAD stalls → silence-recovery line (lock #4).
- 30 s no STT → reset to listening (lock #5).
- No `MediaRecorder` → text strip immediately.
- Mobile: safe-area padding; orb scales to viewport; tap target ≥ 96 px; iOS playsinline (lock #6).

## Strategic outcome
Speak to Build becomes YANGU's core differentiator — voice-first business creation for users who don't want to (or can't) type. Build with Chat remains the structured power-user path. Both coexist, both share backend templates, neither interferes with the other.

**Status: LOCKED. Ready to implement on go-ahead.**
