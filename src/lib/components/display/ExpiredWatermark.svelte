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
        /* font-size di-batasi supaya text ~53 char pas 1 layar
           di TV HD (1280px) sampai FHD (1920px).
           3vw di 1920px = 57.6 → capped 44. Di 1280px = 38.4. */
        font-size: clamp(18px, 3vw, 44px);
        font-weight: 700;
        letter-spacing: 0.16em;
        color: rgba(255, 255, 255, 0.72);
        text-shadow:
            0 0 18px rgba(0, 0, 0, 0.85),
            0 2px 4px rgba(0, 0, 0, 0.6);
        padding: 0.4em 1em;
        max-width: 96vw;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: clip;
        /* Fade in/out di tengah + pulse opacity. Tidak ada slide horizontal
           supaya text tidak terpotong ke kanan. */
        animation:
            watermarkFade 10s ease-in-out forwards,
            watermarkPulse 3s ease-in-out infinite;
    }

    /* Fade in/out: muncul pelan, diam 8s, hilang pelan.
       Diam di tengah (translateX 0), tidak melintas. */
    @keyframes watermarkFade {
        0% {
            opacity: 0;
        }
        15% {
            opacity: 0.75;
        }
        85% {
            opacity: 0.75;
        }
        100% {
            opacity: 0;
        }
    }

    /* Pulse opacity: samar, tidak ganggu konten */
    @keyframes watermarkPulse {
        0%,
        100% {
            opacity: 0.6;
        }
        50% {
            opacity: 0.9;
        }
    }

    /* Reduce motion: hormati preferensi user */
    @media (prefers-reduced-motion: reduce) {
        .expired-watermark__text {
            animation: watermarkPulse 3s ease-in-out infinite;
        }
    }
</style>
