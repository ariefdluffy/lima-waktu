# Fix: Watermark dari API Tidak Dirender di Display Page

## Problem
API `/api/v1/display/[deviceCode]` returns `{ ok: true, watermark: '...', data: {...} }` but the display page only extracts `payload = json.data` — watermark field ignored.

## Root Cause
`src/routes/(tv)/display/[deviceCode]/+page.svelte` line ~242: `fetchData()` assigns `payload = json.data` without capturing `json.watermark`.

## Fix Applied

### File: `src/routes/(tv)/display/[deviceCode]/+page.svelte`

**1. State variable (line 52):**
```ts
let watermarkText = $state<string | null>(null);
```

**2. Save watermark in fetchData() (line 244):**
```ts
watermarkText = json.watermark ?? null;
```

**3. Render watermark in template (lines 809-813):**
Placed inside `{#else if payload}` block but outside inner `{#if screensaver/tahajud/normal}` conditional — visible in ALL display modes.
```svelte
{#if watermarkText}
    <div class="watermark-overlay">
        {watermarkText}
    </div>
{/if}
```

**4. CSS styling (lines 1806-1825):**
```css
.watermark-overlay {
    position: fixed;
    bottom: 12px;
    right: 12px;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: clamp(10px, 1.2vw, 14px);
    font-weight: 600;
    letter-spacing: 0.05em;
    pointer-events: none;
    animation: watermarkFadeIn 0.5s ease-out;
}

@keyframes watermarkFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
```

## Validation
- `npx svelte-check --threshold error`: 0 new errors (2 pre-existing in vite.config.ts and csp-report, unrelated)
- Watermark positioned fixed bottom-right with z-index 9999
- Watermark visible across all display modes (normal, screensaver, tahajud)
- Watermark hidden when `json.watermark` is null/undefined
