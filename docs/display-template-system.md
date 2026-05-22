# Template Display System — Lima Waktu

## 1. Current Architecture

### `+page.svelte` Monolith

All display logic lives in a single file:
```
src/routes/(tv)/display/[deviceCode]/+page.svelte
```

This file handles:
- Data fetching (polling every 15s)
- Prayer state calculation (every 1s)
- Clock/date updates
- Hijriyah calculation
- Weather fetching
- Slide rotation (every 7s)
- Jumbotron rotation (every 10s)
- **Full layout rendering (header, panels, running bar, mood overlay)**

The layout section (lines ~230–430) contains hardcoded component composition:
```
screensaver → tahajudMode → main layout (header + 3 panels + running bar + mood overlay)
```

### Problem

Every template must use the same 3-panel structure (LeftPanel + CenterPanel + RightPanel). Can't create radically different layouts per theme (e.g., full-screen prayer times, centered-only, video-focused).

---

## 2. Target Architecture

```
src/routes/(tv)/display/[deviceCode]/
├── +page.svelte            ← Shell: data logic, state management, template router
├── +layout.svelte          ← (optional) per-theme layout wrapper
└── templates/
    ├── _TemplateProps.ts    ← Shared prop types
    ├── Default.svelte       ← Current 3-panel layout
    ├── Fullscreen.svelte    ← Alternative: full-screen prayer times
    ├── Minimal.svelte       ← Alternative: center-only with clock
    └── ...                  ← Add any new template here
```

### Responsibilities

| Layer | Owns |
|---|---|
| `+page.svelte` (Shell) | Data fetching, intervals, `$state`/`$derived`, `$effect`, screensaver/tahajud mood switching |
| `templates/` | Pure render. Receives reactive data as props. No data logic. |

---

## 3. Template Props Contract

Every template receives this same interface:

```ts
// _TemplateProps.ts
import type { DisplayPayload } from "$lib/types/display";

export type TemplateProps = {
  // ── Payload ──
  payload: DisplayPayload;

  // ── Theme ──
  theme: DisplayPayload["theme"];

  // ── Clock & Date ──
  liveClock: string;
  liveDate: string;
  hijriyahDate: string;
  tz: string;
  tzLabel: string;
  now: Date;

  // ── Prayer State ──
  nextPrayerName: string;
  nextPrayerTime: string;
  countdown: string;
  countdownProgress: number;
  iqamahTime: string;
  activePrayerIndex: number;

  // ── Mood Overlay (handled at shell level) ──
  // MoodOverlay is rendered by +page.svelte, NOT by templates
  // Templates just render the "quiet" layout

  // ── Slides ──
  currentSlide: number;
  slideFading: boolean;

  // ── Jumbotron ──
  currentJumbotron: number;

  // ── Weather ──
  weatherTemp: number | null;
  weatherCode: number | null;
  weatherLoading: boolean;

  // ── Audio ──
  audioBlocked: boolean;
  onUnlockAudio: () => void;

  // ── Running Text ──
  runningTextContent: string;
};
```

---

## 4. Shell Integration (`+page.svelte`)

The shell's template section becomes a simple switch:

```svelte
<!-- src/routes/(tv)/display/[deviceCode]/+page.svelte (partial) -->

<script lang="ts">
  import DefaultTemplate from "./templates/Default.svelte";
  import FullscreenTemplate from "./templates/Fullscreen.svelte";
  import MinimalTemplate from "./templates/Minimal.svelte";

  // ── Template selection ──
  const templateMap: Record<string, typeof DefaultTemplate> = {
    "modern-minimalis": DefaultTemplate,
    "classic-islamic":  DefaultTemplate,
    "dark-premium":     DefaultTemplate,
    "green-mosque":     DefaultTemplate,
    "ramadan":          DefaultTemplate,
    "jumat":            DefaultTemplate,
    "eid":              DefaultTemplate,
    "fullscreen":       FullscreenTemplate,
    "minimal":          MinimalTemplate,
  };

  let ActiveTemplate = $derived(
    templateMap[payload?.theme?.themeKey ?? "modern-minimalis"] ?? DefaultTemplate
  );

  // ── Running text content ──
  let runningTextContent = $derived(getRunningTextContent(payload?.runningTexts ?? []));
</script>

<!-- Screensaver & Tahajud handled by shell (same as now) -->
{#if prayer.screensaver}
  <Screensaver ... />
{:else if prayer.tahajudMode}
  <Tahajud ... />
{:else}
  <div class="tv-wrap" style={themeCssVars(payload?.theme?.palette ?? null)}>
    <ActiveTemplate
      {payload}
      {liveClock}
      {liveDate}
      {hijriyahDate}
      {tz}
      {now}
      nextPrayerName={prayer.nextPrayerName}
      nextPrayerTime={prayer.nextPrayerTime}
      countdown={prayer.countdown}
      countdownProgress={prayer.countdownProgress}
      iqamahTime={prayer.iqamahTime}
      activePrayerIndex={prayer.activePrayerIndex}
      {currentSlide}
      {slideFading}
      {currentJumbotron}
      weatherTemp={weather.temp}
      weatherCode={weather.code}
      weatherLoading={weather.loading}
      audioBlocked={audio.blocked}
      onUnlockAudio={handleUnlockAudio}
      {runningTextContent}
    />
  </div>
{/if}

<!-- MoodOverlay stays at shell level, renders ABOVE any template -->
<MoodOverlay
  mood={prayer.mood}
  moodPrayerName={prayer.moodPrayerName}
  moodPrayerKey={prayer.moodPrayerKey}
  countdown={prayer.moodCountdown}
  countdownLabel={prayer.moodCountdownLabel}
  isJumat={getWIBParts(now, tz).day === 5}
/>
```

### Key rules

1. **Screensaver + Tahajud + MoodOverlay** tetap di shell — template tidak perlu handle ini
2. **Template hanya render layout "tenang"** (saat mood === "normal")
3. **Palette CSS Variables** tetap di `tv-wrap` dari shell — semua CSS var tersedia di template mana pun
4. **Running bar** bisa di-render oleh template (flexible length/position) atau bisa tetap di shell

---

## 5. Template Implementation Guide

### 5.1 Default Template (Existing Layout)

```svelte
<!-- src/routes/(tv)/display/[deviceCode]/templates/Default.svelte -->
<script lang="ts">
  import type { TemplateProps } from "./_TemplateProps";
  import LeftPanel from "$lib/components/display/LeftPanel.svelte";
  import CenterPanel from "$lib/components/display/CenterPanel.svelte";
  import RightPanel from "$lib/components/display/RightPanel.svelte";
  import RunningBar from "$lib/components/display/RunningBar.svelte";
  import YoutubeLayout from "$lib/components/display/YoutubeLayout.svelte";
  import { getWIBParts, getLocationText } from "$lib/display/helpers";

  let {
    payload, liveClock, liveDate, hijriyahDate,
    tz, now,
    nextPrayerName, nextPrayerTime, countdown, countdownProgress,
    iqamahTime, activePrayerIndex,
    currentSlide, slideFading, currentJumbotron,
    weatherTemp, weatherCode, weatherLoading,
    audioBlocked, onUnlockAudio,
    runningTextContent,
  }: TemplateProps = $props();
</script>

<!-- Sound unlock button -->
<button
  class="sound-unlock-btn"
  class:sound-unlock-btn--blocked={audioBlocked}
  onclick={onUnlockAudio}
  title="Aktifkan suara adzan"
>
  {#if audioBlocked}🔕{:else}🔔{/if}
</button>

<div class="bg-stars"></div>
<div class="bg-grid"></div>
<div class="top-bar"></div>

<!-- HEADER -->
<header class="header">
  <div class="masjid-logo-area">
    <div class="masjid-logo">
      {#if payload.masjid.logoUrl}
        <img src={payload.masjid.logoUrl} alt="" class="masjid-logo-img" />
      {:else}🕌{/if}
    </div>
    <div class="masjid-name-block">
      <div class="masjid-name">{payload.masjid.name}</div>
      <div class="masjid-loc">{getLocationText(payload.masjid)}</div>
    </div>
  </div>
  <div class="header-right">
    <div class="header-time">{liveClock}</div>
  </div>
</header>

<!-- MAIN BODY -->
{#if payload.device.layoutMode === "youtube" && payload.youtubeItems.length > 0}
  <YoutubeLayout {payload} {nextPrayerName} {nextPrayerTime} {countdown}
    {countdownProgress} {iqamahTime} {activePrayerIndex} />
{:else}
  <main class="main-body">
    <LeftPanel {nextPrayerName} {nextPrayerTime} {countdown}
      {countdownProgress} {iqamahTime} {liveDate} />
    <CenterPanel {payload} {activePrayerIndex} {currentSlide} {slideFading}
      isJumat={getWIBParts(now, tz).day === 5} />
    <RightPanel {payload} {hijriyahDate} {weatherTemp} {weatherCode}
      {weatherLoading} {currentJumbotron}
      isJumat={getWIBParts(now, tz).day === 5}
      isJumatCardVisible={getWIBParts(now, tz).day === 5 && getWIBParts(now, tz).hours < 12}
      mood="normal" moodPrayerKey="" />
  </main>
{/if}

<!-- RUNNING TEXT -->
<RunningBar content={runningTextContent} />

<style>
  /* Same as current +page.svelte local styles */
</style>
```

### 5.2 Fullscreen Prayer Template

```svelte
<!-- src/routes/(tv)/display/[deviceCode]/templates/Fullscreen.svelte -->
<script lang="ts">
  import type { TemplateProps } from "./_TemplateProps";
  import { PRAYER_ORDER, PRAYER_LABELS, PRAYER_ICONS } from "$lib/utils/prayer";
  import { getLocationText } from "$lib/display/helpers";

  let { payload, liveClock, nextPrayerName, nextPrayerTime,
    countdown, countdownProgress, iqamahTime, activePrayerIndex,
    liveDate, hijriyahDate, runningTextContent,
  }: TemplateProps = $props();
</script>

<div class="fullscreen">
  <!-- Clock header -->
  <header class="fs-header">
    <div class="fs-logo">
      {#if payload.masjid.logoUrl}
        <img src={payload.masjid.logoUrl} alt="" class="fs-logo-img" />
      {/if}
      <div class="fs-masjid-name">{payload.masjid.name}</div>
    </div>
    <div class="fs-clock">
      <span class="fs-time">{liveClock}</span>
      <span class="fs-date">{liveDate}</span>
    </div>
  </header>

  <!-- Big next prayer -->
  <div class="fs-hero">
    <div class="fs-hero-label">WAKTU BERIKUTNYA</div>
    <div class="fs-hero-name">{nextPrayerName}</div>
    <div class="fs-hero-time">{nextPrayerTime}</div>
    {#if iqamahTime}
      <div class="fs-hero-iqamah">Iqamah {iqamahTime}</div>
    {/if}
    <div class="fs-hero-countdown">{countdown}</div>
    <div class="fs-progress-track">
      <div class="fs-progress-fill" style="width: {countdownProgress}%"></div>
    </div>
  </div>

  <!-- All prayer times row -->
  <div class="fs-prayers">
    {#each PRAYER_ORDER as prayer, idx}
      <div class="fs-prayer-card" class:active={idx === activePrayerIndex}>
        <div class="fs-prayer-icon">{PRAYER_ICONS[prayer]}</div>
        <div class="fs-prayer-name">{PRAYER_LABELS[prayer]}</div>
        <div class="fs-prayer-time">
          {payload.schedule.resolved?.[prayer] ?? "--:--"}
        </div>
      </div>
    {/each}
  </div>

  <!-- Footer bar -->
  <footer class="fs-footer">
    <span class="fs-footer-item">{hijriyahDate}</span>
    <span class="fs-footer-sep">•</span>
    <span class="fs-footer-item">{getLocationText(payload.masjid)}</span>
    {#if runningTextContent}
      <span class="fs-footer-sep">•</span>
      <span class="fs-footer-text">{runningTextContent}</span>
    {/if}
  </footer>
</div>

<style>
  .fullscreen {
    width: 100vw; height: 100vh;
    display: flex; flex-direction: column;
    padding: 2% 4%;
    background: var(--bg-primary);
    color: var(--text-primary);
    position: relative;
    overflow: hidden;
  }

  .fs-header {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 1%; border-bottom: 1px solid var(--border-accent);
  }
  .fs-logo { display: flex; align-items: center; gap: 12px; }
  .fs-logo-img { height: clamp(32px, 3vw, 72px); }
  .fs-masjid-name { font-family: var(--font-heading), serif;
    font-size: clamp(16px, 1.8vw, 42px); color: var(--accent-primary); }
  .fs-clock { text-align: right; }
  .fs-time { font-size: clamp(32px, 4vw, 96px); font-weight: 700;
    display: block; line-height: 1; }
  .fs-date { font-size: clamp(10px, 1.2vw, 28px); color: var(--text-muted); }

  .fs-hero {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; gap: 0.5%;
  }
  .fs-hero-label { font-size: clamp(10px, 1.2vw, 28px);
    color: var(--text-muted); letter-spacing: 0.2em; }
  .fs-hero-name { font-size: clamp(36px, 5vw, 120px);
    font-family: var(--font-heading), serif;
    color: var(--accent-primary); font-weight: 700; }
  .fs-hero-time { font-size: clamp(64px, 9vw, 200px);
    font-weight: 700; letter-spacing: 0.05em;
    font-variant-numeric: tabular-nums; }
  .fs-hero-iqamah { font-size: clamp(18px, 2.2vw, 52px);
    color: var(--accent-secondary); }
  .fs-hero-countdown { font-size: clamp(28px, 3.5vw, 80px);
    color: var(--accent-secondary);
    font-variant-numeric: tabular-nums; margin-top: 1%; }
  .fs-progress-track { width: 60%; height: 6px;
    background: var(--border-color); border-radius: 3px;
    margin-top: 1%; overflow: hidden; }
  .fs-progress-fill { height: 100%; background: var(--progress-fill);
    border-radius: 3px; transition: width 1s linear; }

  .fs-prayers {
    display: flex; gap: 1%; padding: 1% 0;
  }
  .fs-prayer-card {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; gap: 2%; padding: 1%;
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: var(--border-radius);
  }
  .fs-prayer-card.active {
    background: var(--prayer-active-bg);
    border-color: var(--prayer-active-border);
  }
  .fs-prayer-icon { font-size: clamp(14px, 1.5vw, 36px); }
  .fs-prayer-name { font-size: clamp(10px, 1.2vw, 28px);
    color: var(--text-secondary); }
  .fs-prayer-card.active .fs-prayer-name { color: var(--accent-primary); }
  .fs-prayer-time { font-size: clamp(14px, 1.8vw, 40px);
    font-weight: 700; font-variant-numeric: tabular-nums; }

  .fs-footer {
    display: flex; align-items: center; gap: 1%; padding: 1% 0;
    border-top: 1px solid var(--border-accent);
    font-size: clamp(10px, 1vw, 24px); color: var(--text-muted);
  }
  .fs-footer-sep { opacity: 0.4; }
  .fs-footer-text { flex: 1; overflow: hidden; white-space: nowrap;
    text-overflow: ellipsis; }
</style>
```

### 5.3 Minimal Template (Clock + One Panel)

```svelte
<!-- src/routes/(tv)/display/[deviceCode]/templates/Minimal.svelte -->
<script lang="ts">
  import type { TemplateProps } from "./_TemplateProps";
  import { getLocationText } from "$lib/display/helpers";

  let { payload, liveClock, liveDate, hijriyahDate,
    nextPrayerName, nextPrayerTime, countdown,
    runningTextContent,
  }: TemplateProps = $props();
</script>

<div class="minimal">
  <div class="min-top">
    <div class="min-clock">{liveClock}</div>
    <div class="min-date">{liveDate}</div>
    <div class="min-hijri">{hijriyahDate}</div>
  </div>

  <div class="min-next">
    <div class="min-next-label">BERIKUTNYA</div>
    <div class="min-next-name">{nextPrayerName}</div>
    <div class="min-next-time">{nextPrayerTime}</div>
    <div class="min-countdown">{countdown}</div>
  </div>

  <div class="min-footer">
    <span>{payload.masjid.name}</span>
    <span>•</span>
    <span>{getLocationText(payload.masjid)}</span>
    {#if runningTextContent}
      <span>•</span>
      <span>{runningTextContent}</span>
    {/if}
  </div>
</div>

<style>
  .minimal {
    width: 100vw; height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: space-between;
    padding: 4%;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .min-top { text-align: center; }
  .min-clock { font-size: clamp(48px, 8vw, 160px); font-weight: 700;
    letter-spacing: 0.05em; line-height: 1; }
  .min-date { font-size: clamp(14px, 1.8vw, 40px);
    color: var(--text-secondary); }
  .min-hijri { font-size: clamp(12px, 1.4vw, 32px);
    color: var(--accent-muted); }

  .min-next { text-align: center; }
  .min-next-label { font-size: clamp(10px, 1.2vw, 28px);
    color: var(--text-muted); letter-spacing: 0.3em;
    margin-bottom: 2%; }
  .min-next-name { font-size: clamp(36px, 5vw, 100px);
    font-family: var(--font-heading), serif;
    color: var(--accent-primary); font-weight: 700; }
  .min-next-time { font-size: clamp(56px, 8vw, 180px); font-weight: 700;
    font-variant-numeric: tabular-nums; }
  .min-countdown { font-size: clamp(24px, 3.2vw, 72px);
    color: var(--accent-secondary);
    font-variant-numeric: tabular-nums; margin-top: 1%; }

  .min-footer { font-size: clamp(10px, 1vw, 24px);
    color: var(--text-muted); display: flex; gap: 1%;
    border-top: 1px solid var(--border-accent);
    padding-top: 2%; width: 100%; justify-content: center; }
</style>
```

---

## 6. Template Registration

To add a new template:

### Step 1: Create the template file

```
src/routes/(tv)/display/[deviceCode]/templates/MyCustom.svelte
```

- Import `TemplateProps` from `_TemplateProps.ts`
- Use `$props()` with the `TemplateProps` type
- Write your own layout, styles, and component composition
- Use CSS custom properties (`--bg-primary`, `--accent-primary`, etc.) for theme compatibility

### Step 2: Register in `+page.svelte`

```ts
import MyCustomTemplate from "./templates/MyCustom.svelte";

const templateMap: Record<string, typeof DefaultTemplate> = {
  // ... existing mappings ...
  "my-custom-theme": MyCustomTemplate,
};
```

### Step 3: Create a theme with matching `themeKey` in the database

```sql
INSERT INTO themes (theme_key, name, palette_json, layout_json, is_global, is_active)
VALUES ('my-custom-theme', 'My Custom', '{"bgPrimary":"..."}', '{}', 1, 1);
```

### Step 4: Assign theme to a device via `/admin` → Tema & Template

---

## 7. Theme Data Enrichment (Optional)

If a theme needs custom configuration beyond palette/layout (e.g., background image URL, custom font import), the `layout_json` column can hold arbitrary data. Access it from the template:

```svelte
<script lang="ts">
  let { payload }: TemplateProps = $props();
  let themeLayout = $derived(payload.theme?.layout ?? {});
  let bgImage = $derived((themeLayout as any).backgroundImageUrl ?? "");
  let customFont = $derived((themeLayout as any).customFontUrl ?? "");
</script>

<svelte:head>
  {#if customFont}
    <link href={customFont} rel="stylesheet" />
  {/if}
</svelte:head>
```

---

## 8. Full File List After Implementation

```
src/routes/(tv)/display/[deviceCode]/
├── +page.svelte                  ← Shell (data logic + template router)
├── templates/
│   ├── _TemplateProps.ts         ← Shared type definition
│   ├── Default.svelte            ← Current 3-panel layout (extracted)
│   ├── Fullscreen.svelte         ← Full-screen prayer times
│   ├── Minimal.svelte            ← Clock + next prayer only
│   └── ...                       ← Future templates
```

---

## 9. Migration Steps for AI Agent

### Phase 1: Create TemplateProps type

1. Create `templates/_TemplateProps.ts` with the shared props type
2. Verify type covers all props used by every existing component call

### Phase 2: Extract Default Template

1. Copy current layout section from `+page.svelte` (exclude screensaver/tahajud/mood) into `templates/Default.svelte`
2. Replace all inline variable references with `TemplateProps` destructured props
3. Copy associated `<style>` block
4. Verify all CSS custom property names match (`var(--x)`)

### Phase 3: Create Alternative Templates

1. Build `Fullscreen.svelte` (full source above)
2. Build `Minimal.svelte` (full source above)
3. Style them using CSS custom properties so any theme palette applies

### Phase 4: Wire Shell

1. Import templates in `+page.svelte`
2. Create `templateMap` and `ActiveTemplate` derived component
3. Replace hardcoded layout with `<ActiveTemplate ...props />`
4. Keep `MoodOverlay`, screensaver, tahajud at shell level

### Phase 5: Test

1. Verify all existing themes still render via `Default.svelte`
2. Create a test theme with `themeKey: "fullscreen"` and verify `Fullscreen.svelte` renders
3. Verify mood overlays, screensaver, and tahajud still overlay correctly
4. Verify running bar and sound unlock work in each template

---

## 10. Notes for AI Agents

- **Templates are stateless.** All `$state`, `$derived`, `$effect` lives in `+page.svelte`. Templates receive fresh props each render cycle.
- **No onMount or $effect in templates.** Data fetching/interval logic stays in the shell.
- **Reuse existing sub-components** (`LeftPanel`, `CenterPanel`, `RightPanel`, `RunningBar`) when appropriate, or build inline for radical layouts.
- **CSS custom properties bridge palette to styles.** Every `var(--x)` reference maps to the active theme's palette automatically.
- **MoodOverlay renders ABOVE the template** (z-index). Template doesn't need to handle adzan/iqamah/khusuk overlays.
- **Theme's `layout` field** stores arbitrary JSON — use it for per-theme configuration like column widths, font sizes, feature toggles, or custom background URLs. Access via `payload.theme.layout`.
- **Adding a new template** requires: create `.svelte` file → import in `+page.svelte` → add to `templateMap` → create theme with matching `themeKey` in DB → assign to device.
- **Existing themes** (modern-minimalis, classic-islamic, etc.) map to `Default.svelte`. They keep working unchanged.

---

## 11. TypeScript Types Reference

Relevant types from the codebase:

```ts
// src/lib/types/display.ts

export type DisplayPayload = {
  generatedAt: string;
  device: {
    id: string;
    deviceCode: string;
    name: string;
    orientation: "horizontal" | "vertical";
    layoutMode: "default" | "youtube";
  };
  theme: ThemeData | null;
  masjid: {
    id: string; name: string; address: string | null;
    city: string | null; district: string | null; province: string | null;
    timezone: string; latitude: string | null; longitude: string | null;
    hijriOffset: number; adzanScreenDuration: number;
    khusukScreenDuration: number; screensaverDelayMinutes: number;
    screensaverWakeMinutes: number; logoUrl: string | null;
  };
  schedule: ScheduleData;
  runningTexts: { id: number; content: string; speed: number }[];
  slides: SlideData[];
  jumbotrons: JumbotronData[];
  youtubeItems: YoutubeItemData[];
  events: EventData[];
};

export type ThemeData = {
  id: number;
  themeKey: string;
  name: string;
  palette: ThemePalette;
  layout: ThemeLayout;
  isGlobal: boolean;
};

export type ThemePalette = {
  bgPrimary: string; bgSecondary: string; bgOverlay: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  accentPrimary: string; accentSecondary: string; accentMuted: string;
  borderColor: string; borderAccent: string;
  fontHeading: string; fontBody: string; fontArabic: string;
  borderRadius: string;
  cardBg: string; cardBorder: string;
  prayerActiveBg: string; prayerActiveBorder: string; prayerActiveGlow: string;
  headerBg: string;
  runningBarBg: string; runningBarBorder: string;
  progressFill: string;
  screensaverBg: string; tahajudBg: string;
  moodAdzanBg: string; moodIqamahBg: string; moodKhusukBg: string;
  topBarColor: string; bgStars: string; bgGrid: string;
};

export type ThemeLayout = {
  panelOrder: ("left" | "center" | "right")[];
  leftWidth: number; centerWidth: number; rightWidth: number;
  showHeader: boolean; showRunningBar: boolean;
  prayerCardStyle: "default" | "minimal" | "ornate";
  headerLayout: "logo-left" | "logo-center" | "logo-top";
  fontSizeScale: "compact" | "normal" | "large";
  borderRadiusScale: "sharp" | "normal" | "rounded";
};
```

---

## 12. Existing Sub-components (Can Be Reused)

| Component | Props |
|---|---|
| `LeftPanel` | `nextPrayerName`, `nextPrayerTime`, `countdown`, `countdownProgress`, `iqamahTime`, `liveDate` |
| `CenterPanel` | `payload`, `activePrayerIndex`, `currentSlide`, `slideFading`, `isJumat` |
| `RightPanel` | `payload`, `hijriyahDate`, `weatherTemp`, `weatherCode`, `weatherLoading`, `currentJumbotron`, `isJumat`, `isJumatCardVisible`, `mood`, `moodPrayerKey` |
| `RunningBar` | `content` |
| `YoutubeLayout` | `payload`, `nextPrayerName`, `nextPrayerTime`, `countdown`, `countdownProgress`, `iqamahTime`, `activePrayerIndex` |
| `MoodOverlay` | `mood`, `moodPrayerName`, `moodPrayerKey`, `countdown`, `countdownLabel`, `isJumat` |

Utility functions:
- `getWIBParts(date, tz)` → `{ day, hours, minutes }`
- `getLocationText(masjid)` → `"City, Province"`
- `getRunningTextContent(items)` → concatenated string
- `getCurrentSlideContent(payload, currentSlide)` → slide object
- `formatTime(date, tz)` → time string
- `formatDate(date, tz)` → date string
- `computeHijriyah(date, tz, offset)` → Hijri date string
- `themeCssVars(palette)` → CSS custom properties string
