# Speak to Build — Real Root Cause + Fix Plan

## What the logs actually prove

The latest run shows ADA **is** generating audio:

```
Realtime event: response.audio.delta        ← ADA speaking
... (many deltas) ...
Realtime event: response.audio.done
Realtime event: response.audio_transcript.done
Realtime event: response.done
Realtime event: output_audio_buffer.stopped ← ADA finished
```

So the connection works. The data channel works. ADA spoke a full greeting.
**You just didn't hear it, and the UI never left "Connecting…".**

That changes the diagnosis completely. This is not a connection problem.
It is three small client bugs.

---

## The 3 real bugs

### Bug 1 — Two sessions minted in parallel (React StrictMode)

Network log shows:
```
10:05:40Z  POST /realtime-token  (session A)
10:05:40Z  POST /realtime-token  (session B)
10:05:41Z  POST api.openai.com/v1/realtime  (session A SDP)
10:05:41Z  POST api.openai.com/v1/realtime  (session B SDP)
```

React 18 StrictMode mounts the effect twice in dev. Our `startingRef` guard
doesn't help because both invocations enter `start()` before either sets
`pcRef.current`. Result: session A is created, then immediately torn down by
session B's cleanup, but session B's `pc.ontrack` never fires reliably because
the wiring happens after `setRemoteDescription` resolves on a racing PC.

Net effect: zero `TRACK RECEIVED` log, zero remote `<audio>` playback.

### Bug 2 — No `recvonly` transceiver = unreliable inbound audio

We do:
```ts
pc.ontrack = ...
const dc = pc.createDataChannel(...)
const mic = await getUserMedia(...)
mic.getTracks().forEach(t => pc.addTrack(t, mic))
```

We never explicitly add an audio receiver. OpenAI's answer is `sendrecv`, but
without `pc.addTransceiver("audio", { direction: "recvonly" })` the `ontrack`
event can race the `setRemoteDescription` resolution — especially when a second
PC is being created in parallel (Bug 1). This is the actual reason no audio
plays even though SDP handshake succeeds.

### Bug 3 — UI is stuck on "Connecting…"

`uiState` only leaves `connecting` when:
- `dc.onopen` fires → sets `listening`, OR
- a server event arrives that hits a case that sets state.

Looking at the logs, the FIRST event seen is `response.audio_transcript.delta`
— which we currently **don't** map to a state change. We only handle
`response.audio.delta`. Result: even though the session is fully alive, the
header shows "Connecting…" and the orb stays grey.

---

## Fix Plan (small, surgical, no architecture change)

### File: `src/components/builder/speak-to-build/useRealtimeVoice.ts`

1. **Module-level lock** to defeat StrictMode double-start:
   ```ts
   // outside the hook
   let activeSessionId = 0;
   ```
   In `start()`, take a local id, abort if a newer one starts, and skip
   ALL side-effects (token mint, PC creation, SDP) when an active session
   already exists. Pair with `pcRef.current` check.

2. **Explicit recvonly audio transceiver** before `addTrack`:
   ```ts
   pc.addTransceiver("audio", { direction: "recvonly" });
   ```
   This guarantees `ontrack` fires deterministically.

3. **Move `pc.ontrack` assignment BEFORE creating the data channel and mic**
   (it already is — keep it that way) AND attach the audio element to
   `document.body` so iOS/Safari treat it as a user-visible sink:
   ```ts
   audioEl.setAttribute("playsinline", "true");
   audioEl.style.display = "none";
   document.body.appendChild(audioEl);
   ```
   Currently we create the element but never attach it to the DOM, which
   on some browsers prevents playback.

4. **Broaden state transitions** so the UI exits "Connecting…" the moment
   anything happens:
   ```ts
   case "session.created":
   case "session.updated":
   case "response.created":
   case "response.audio_transcript.delta":   // ← first event we see
     if (uiState === "connecting") setUiState("listening");
     break;
   ```

5. **Watchdog**: 8s after `start()`, if still `connecting`, log a clear error
   and call `onError`. This stops the silent-forever failure mode.

### File: `src/components/builder/speak-to-build/SpeakToBuild.tsx`

No structural changes. Just confirm:
- The cleanup ref pattern (already in place) stays.
- "Start conversation" CTA stays visible whenever `audioBlocked` is true.

---

## Verification (after applying)

After hard refresh on `/dashboard/seller/eshop/speak`, expect in console:

```
TOKEN OK { ... }                           ← only ONCE now
[useRealtimeVoice] RTCPeerConnection created
SDP SENT
SDP ANSWER RECEIVED
PC state: connecting
ICE state: checking
TRACK RECEIVED                             ← now fires
AUDIO PLAYING                              ← now fires
DATA CHANNEL OPEN
Realtime event: session.created
Realtime event: response.audio_transcript.delta
```

UI: header transitions Connecting → Listening within ~1.5s. Orb pulses green
when ADA speaks. You hear the greeting.

If autoplay is blocked, the "Start conversation" button appears — one tap
unlocks audio.

---

## Out of scope for this fix

- Migrating to GA `/v1/realtime/client_secrets` + `gpt-realtime` model.
  The current beta endpoint works (events prove it). Migration is a separate
  task once basic playback is confirmed.
- VoiceOrb color mapping to YANGU orange / green. Separate cosmetic task.
- Removing legacy `useVoiceCall.ts`. Cleanup task.
