# Progress

## Status
Complete

## Tasks
1. Research Svelte 5 $state reactivity timing with setInterval
   - Batching behavior for synchronous mutations
   - setInterval + $effect tick interaction
   - Best practices for double-trigger prevention
2. Deep inspect `src/lib/display/audio.svelte.ts`
   - playAdzanBeep/playIqamahBeep: intentional 2-beep (immediate + 500ms timeout)
   - Possible 3rd beep edge case: buffer load via `replayAfter` on first trigger
   - No runaway loops/retries; fetch guarded by `beepFetchInflight` + 60s cooldown
   - Race condition risk minimal (JS single-thread)
   - AudioContext unlock: 30-attempt auto-resume + manual handleUnlockAudio
3. Timing bug inspection — `prayer.svelte.ts` + `page.svelte`
   - **Bug 1 (diff<=1):** NO double trigger. `diff=1` occurs exactly once at second :59 of the minute before prayer. `diff=0` mathematically impossible (requires seconds=60). Guard `lastTriggeredPrayer` is safe backup.
   - **Bug 2 (setInterval + $effect):** YES double trigger possible. Both call `updatePrayerState` every 1s. `$effect` tracks `now` ($state) so re-runs every second — redundant with `prayerInterval`. Normally guard blocks re-trigger, BUT `resetBeepTriggers()` in `fetchData()` can clear guard mid-second.
   - **Bug 3 (resetBeepTriggers race):** YES confirmed. At second :59, `prayer.mood` is "normal" (adzan mood starts at prayer minute). `resetBeepTriggers()` clears `lastTriggeredPrayer` to "". If fetchData completes during trigger window, $effect re-triggers beep/flash. ~1/15 probability per prayer time.
   - **Bug 4 (flash overlap):** Timer resets correctly (`clearTimeout` + new timeout). CSS animation (`0.6s ease-out forwards`) does NOT restart — plays once on DOM insert. Double trigger within 0.6s looks fine; after 0.6s overlay invisible (opacity 0 from `forwards`). No visual re-flash on second trigger.
   - **Note:** Trigger fires at :59 not :00 (1 second early). Countdown shows "00:00:01".

## Files Changed
- `research.md` — full research brief with findings, sources, gaps
- `context.md` — deep analysis of audio.svelte.ts with line-number references
- `context.md` — timing bug analysis with exact line numbers, math proofs, and recommended fixes

## Recommended Fixes
1. **Remove `updatePrayerState` from `$effect`** — setInterval already handles 1s updates. $effect should only handle hijriyah/weather on payload change.
2. **Or guard resetBeepTriggers** — skip reset if diff <= 5, or move reset to a safe point outside trigger window.
3. **Flash restart** — toggle `flash=false` then `true` next frame, or use CSS `animation: none; reflow; animation: ...` pattern.
