# Code Context — Prayer Timing Bug Analysis

## Files Retrieved
1. `src/lib/display/prayer.svelte.ts` (full file, 233 lines) — core prayer state machine, adzan/iqamah trigger logic, flash, resetBeepTriggers
2. `src/routes/(tv)/display/[deviceCode]/+page.svelte` (full file, ~550 lines) — TV display page, setInterval + $effect wiring, fetchData
3. `src/lib/utils/prayer.ts` (lines 30-36) — `timeToMinutes()` returns `hh*60+mm` (whole minutes, no seconds)
4. `src/lib/utils/timezone.ts` (lines 26-38) — `getTZParts()` returns `{hours, minutes, seconds}` from UTC-adjusted Date

## Key Code

### Trigger guard — `prayer.svelte.ts` lines 128-135
```ts
// line 128: countdown calculation
const target = timeToMinutes(resolved[activePrayer]) * 60;  // always multiple of 60
let diff = target - currentTotalSeconds;                     // target - (h*3600+m*60+s)
if (diff < 0) diff += 86400;
// ...
if (diff <= 1 && lastTriggeredPrayer !== activePrayer) {     // line 130
  lastTriggeredPrayer = activePrayer;
  playAdzanBeep();
  triggerFlash("adzan");
}
```

### resetBeepTriggers — `prayer.svelte.ts` lines 225-233
```ts
export function resetBeepTriggers() {
  if (prayer.mood !== "adzan") {
    lastTriggeredPrayer = "";
  }
  if (prayer.mood !== "khusuk") {
    lastTriggeredIqamahEnd = "";
  }
}
```

### Flash trigger — `prayer.svelte.ts` lines 31-39
```ts
const FLASH_DURATION_MS = 2500;
let flashTimer: ReturnType<typeof setTimeout> | null = null;

export function triggerFlash(type: "adzan" | "iqamah" = "adzan") {
  prayer.flash = true;
  prayer.flashType = type;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { prayer.flash = false; flashTimer = null; }, FLASH_DURATION_MS);
}
```

### page.svelte — dual call sites
- **Line ~170**: `const prayerInterval = setInterval(() => { if (payload) updatePrayerState(payload, now); }, 1000);`
- **Lines ~213-220**: `$effect(() => { if (payload) { updatePrayerState(payload, now); ... } });`
- **Line ~108**: `fetchData()` → `payload = json.data; resetBeepTriggers();`

---

## Bug Analysis

### 1. `diff <= 1` — Can it double-trigger?

**Answer: NO, not on its own.**

Math proof:
- `target = timeToMinutes(prayer) * 60` → always multiple of 60
- `currentTotalSeconds = h*3600 + m*60 + s`
- Loop ensures `prayerMinutes > currentMinutes` (minimum difference = 1)
- `diff = (prayerMinutes - currentMinutes) * 60 - seconds`
- For `diff = 1`: requires `(prayerMinutes - currentMinutes) * 60 - seconds = 1`
  - Minimum prayerMinutes - currentMinutes = 1, so `60 - seconds = 1` → `seconds = 59`
  - Happens exactly once at second :59 of the minute before prayer time
- For `diff = 0`: requires `seconds = 60` → **impossible** (seconds range 0-59)

**Note:** Trigger fires 1 second early (at :59, not :00). Countdown shows "00:00:01" at trigger moment.

### 2. setInterval + $effect double trigger

**Answer: YES, both fire every 1s, but guard prevents double trigger — UNLESS resetBeepTriggers clears guard.**

The `$effect` on line ~213 tracks `payload` and `now` (both `$state`). Since `now` updates every 1s via `clockInterval`, the `$effect` re-runs every 1s — identical to the `prayerInterval`. So `updatePrayerState` executes **twice per second**.

Under normal operation this is safe: first call sets `lastTriggeredPrayer`, second call's guard blocks re-trigger.

**Dangerous sequence (the actual bug):**
1. T=:59.000 — `prayerInterval` fires → `updatePrayerState` → diff=1 → triggers beep/flash → sets `lastTriggeredPrayer = "dzuhur"`
2. T=:59.500 — `dataInterval` (15s) fires → `fetchData()` async completes
3. T=:59.600 — `payload = json.data` → schedules $effect
4. T=:59.600 — `resetBeepTriggers()` → `prayer.mood` is "normal" (not "adzan") → **clears `lastTriggeredPrayer` to ""**
5. T=:59.601 — $effect microtask runs → `updatePrayerState(payload, now)` → diff still 1 (same second :59) → `lastTriggeredPrayer` is "" → **TRIGGERS AGAIN**

Probability: fetchData runs every 15s. Prayer trigger window is 1s. ~1/15 chance per prayer time.

### 3. resetBeepTriggers() race with updatePrayerState()

**Answer: YES, confirmed in Bug 2 above.**

Root cause: `resetBeepTriggers()` unconditionally clears `lastTriggeredPrayer` when `prayer.mood !== "adzan"`. At second :59 before prayer, mood is "normal" (adzan mood starts at the prayer minute, based on minute-granularity check at line ~148). So the guard is cleared during the active trigger window.

### 4. Flash animation overlap

**Answer: Timer resets correctly, CSS animation does NOT restart.**

`triggerFlash()` line 35: `if (flashTimer) clearTimeout(flashTimer)` — timer restarts, overlay stays visible 2500ms from last trigger. But the CSS animation `flashFadeAdzan 0.6s ease-out forwards` (page.svelte style block) plays only once when element enters DOM. Second trigger keeps `prayer.flash = true` but doesn't restart animation.

- If re-triggered within 0.6s: animation still playing, looks fine
- If re-triggered after 0.6s: overlay in DOM but at `opacity 0` (animation `forwards` end state) — invisible, no visual re-flash

## Architecture

```
page.svelte
  ├── clockInterval (1s)  → now = new Date()
  ├── prayerInterval (1s) → updatePrayerState(payload, now)
  ├── dataInterval (15s)  → fetchData() → payload = data; resetBeepTriggers()
  └── $effect (reactive)  → updatePrayerState(payload, now) [fires on payload OR now change]

prayer.svelte.ts
  ├── updatePrayerState() — calculates diff, triggers beep/flash if diff<=1
  ├── resetBeepTriggers() — clears lastTriggeredPrayer (guard for trigger)
  └── triggerFlash() — sets flash=true, 2500ms timer to clear
```

## Start Here

`src/lib/display/prayer.svelte.ts` lines 128-135 — the adzan trigger guard.
Fix needs to decouple `resetBeepTriggers()` from clearing state during active trigger windows, or remove the redundant $effect call to `updatePrayerState`.

## Recommended Fixes

1. **Remove updatePrayerState from $effect** — the setInterval already handles it every 1s. The $effect should only handle non-prayer tasks (hijriyah, weather). This eliminates the double-call entirely.
2. **Or: don't call resetBeepTriggers() in fetchData** — if $effect no longer calls updatePrayerState, resetBeepTriggers becomes unnecessary. If kept, move it to a point where it can't race (e.g., skip reset if diff <= 5).
3. **Flash restart fix** — toggle `prayer.flash = false` then `true` in next frame, or use CSS `animation: none; reflow; animation: ...` pattern.
