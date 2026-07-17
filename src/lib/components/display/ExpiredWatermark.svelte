<script lang="ts">
    /**
     * Animated watermark overlay untuk TV display.
     * Ditampilkan periodik (default 8 detik tampil, 52 detik hilang)
     * dengan animasi slide-across + pulse opacity.
     */
    let {
        text,
        visibleDurationMs = 10000,
        hiddenDurationMs = 290000,
    }: {
        text: string;
        visibleDurationMs?: number;
        hiddenDurationMs?: number;
    } = $props();

    let visible = $state(false);
    let key = $state(0); // increment untuk retrigger animasi CSS

    $effect(() => {
        // Skip kalau text kosong
        if (!text) {
            visible = false;
            return;
        }

        let cancelled = false;
        let visibleTimer: ReturnType<typeof setTimeout> | null = null;
        let hiddenTimer: ReturnType<typeof setTimeout> | null = null;

        function showCycle() {
            if (cancelled) return;
            key++;
            visible = true;
            visibleTimer = setTimeout(() => {
                if (cancelled) return;
                visible = false;
                hiddenTimer = setTimeout(showCycle, hiddenDurationMs);
            }, visibleDurationMs);
        }

        // Tunda awal sedikit supaya tidak ganggu first paint
        const initialDelay = setTimeout(showCycle, 1500);

        return () => {
            cancelled = true;
            clearTimeout(initialDelay);
            if (visibleTimer) clearTimeout(visibleTimer);
            if (hiddenTimer) clearTimeout(hiddenTimer);
        };
    });
</script>

{#if text && visible}
    <div
        class="expired-watermark"
        class:enter={visible}
        data-key={key}
        role="status"
        aria-live="polite"
    >
        <span class="expired-watermark__text">{text}</span>
    </div>
{/if}

<style>
    .expired-watermark {
        position: fixed;
        top: 50%;
        left: 0;
        right: 0;
        transform: translateY(-50%);
        z-index: 9999;
        pointer-events: none;
        text-align: center;
        will-change: transform, opacity;
    }

    .expired-watermark__text {
        display: inline-block;
        font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
        /* font-size diformula supaya 50 char pas dalam 96vw di SEMUA TV.
           monospace 700 + letter-spacing 0.16em ≈ 0.76em per char.
           50 char × 0.76 = 38em + padding 1.6em = 39.6em total.
           Supaya ≤ 0.92 × viewport: font-size ≤ 2.32vw.
           Pakai 2.3vw (aman, margin ~5%). min 14px, max 38px. */
        font-size: clamp(14px, 2.3vw, 38px);
        font-weight: 700;
        letter-spacing: 0.16em;
        color: rgba(255, 255, 255, 0.72);
        text-shadow:
            0 0 18px rgba(0, 0, 0, 0.85),
            0 2px 4px rgba(0, 0, 0, 0.6);
        padding: 0.4em 0.8em;
        max-width: 96vw;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: clip;
        /* Tidak ada fade/slide: text langsung muncul penuh dan diam.
           Hanya pulse halus supaya tidak terlalu statis. */
        animation: watermarkPulse 4s ease-in-out infinite;
    }

    /* Pulse opacity: samar, halus, hampir tak terasa */
    @keyframes watermarkPulse {
        0%,
        100% {
            opacity: 0.68;
        }
        50% {
            opacity: 0.82;
        }
    }

    /* Reduce motion: hormati preferensi user */
    @media (prefers-reduced-motion: reduce) {
        .expired-watermark__text {
            animation: none;
            opacity: 0.75;
        }
    }
</style>
