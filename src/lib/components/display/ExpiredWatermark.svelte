<script lang="ts">
    /**
     * Animated watermark overlay untuk TV display.
     * Ditampilkan periodik (default 8 detik tampil, 52 detik hilang)
     * dengan animasi slide-across + pulse opacity.
     */
    let {
        text,
        visibleDurationMs = 14000,
        hiddenDurationMs = 46000,
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
        font-size: clamp(28px, 5.5vw, 72px);
        font-weight: 700;
        letter-spacing: 0.22em;
        color: rgba(255, 255, 255, 0.7);
        text-shadow:
            0 0 18px rgba(0, 0, 0, 0.85),
            0 2px 4px rgba(0, 0, 0, 0.6);
        padding: 0.5em 1.2em;
        white-space: nowrap;
        /* Slide horizontal: masuk pelan, diam di tengah, keluar pelan (total 14s)
           Pulse opacity terpisah, loop 3s untuk efek samar berdenyut. */
        animation:
            watermarkSlide 14s linear forwards,
            watermarkPulse 3s ease-in-out infinite;
    }

    /* Slide horizontal:
       - 0–18%: masuk dari kiri (pelan)
       - 18–82%: diam di tengah, drift pelan ke kanan
       - 82–100%: keluar ke kanan (pelan) */
    @keyframes watermarkSlide {
        0% {
            transform: translateX(-60vw);
            opacity: 0;
        }
        18% {
            transform: translateX(0);
            opacity: 0.7;
        }
        82% {
            transform: translateX(0);
            opacity: 0.7;
        }
        100% {
            transform: translateX(60vw);
            opacity: 0;
        }
    }

    /* Pulse opacity: samar, tidak ganggu konten */
    @keyframes watermarkPulse {
        0%,
        100% {
            opacity: 0.55;
        }
        50% {
            opacity: 0.85;
        }
    }

    /* Reduce motion: hormati preferensi user */
    @media (prefers-reduced-motion: reduce) {
        .expired-watermark__text {
            animation: watermarkPulse 3s ease-in-out infinite;
        }
    }
</style>
