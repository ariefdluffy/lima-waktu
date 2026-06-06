<script lang="ts">
    interface Props {
        remaining: number;
        prayerName: string;
        orientation?: "horizontal" | "vertical";
    }

    let {
        remaining,
        prayerName,
        orientation = "horizontal",
    }: Props = $props();

    // Progress 0..1 (60→0 → 0→1)
    const progress = $derived(1 - (remaining - 1) / 59);
    const circumference = 2 * Math.PI * 140;
    const dashOffset = $derived(circumference * (1 - progress));

    // Arabic teks — berubah gradual
    const arabicText = $derived(
        remaining > 45
            ? "ٱللَّٰهُ أَكْبَر"
            : remaining > 30
              ? "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ"
              : remaining > 15
                ? "أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ ٱللَّٰهِ"
                : "حَيَّ عَلَى ٱلصَّلَاةِ • حَيَّ عَلَى ٱلْفَلَاحِ",
    );

    // Class vertikal
    const vClass = $derived(
        orientation === "vertical" ? "pre-adzan--vertical" : "",
    );
</script>

<div class="pre-adzan-overlay {vClass}">
    <!-- Background animated gradient -->
    <div class="pre-adzan-bg"></div>

    <!-- Decorative light beams -->
    <div class="pre-adzan-beams">
        <div class="beam beam-1"></div>
        <div class="beam beam-2"></div>
        <div class="beam beam-3"></div>
    </div>

    <div class="pre-adzan-inner">
        <!-- Header -->
        <div class="pre-adzan-header">
            <span class="pre-adzan-label">MENUJU WAKTU ADZAN</span>
            <span class="pre-adzan-prayer">{prayerName}</span>
        </div>

        <!-- Circular countdown -->
        <div class="pre-adzan-circle-wrap">
            <svg class="pre-adzan-ring" viewBox="0 0 320 320">
                <circle
                    class="pre-adzan-ring-bg"
                    cx="160"
                    cy="160"
                    r="140"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    stroke-width="6"
                />
                <circle
                    class="pre-adzan-ring-fg"
                    cx="160"
                    cy="160"
                    r="140"
                    fill="none"
                    stroke="url(#ringGrad)"
                    stroke-width="6"
                    stroke-linecap="round"
                    stroke-dasharray={circumference}
                    stroke-dashoffset={dashOffset}
                    transform="rotate(-90 160 160)"
                    style="transition: stroke-dashoffset 1s linear;"
                />
                <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fbbf24" />
                        <stop offset="50%" stop-color="#f59e0b" />
                        <stop offset="100%" stop-color="#d97706" />
                    </linearGradient>
                </defs>
            </svg>
            <div class="pre-adzan-number">
                {#key remaining}
                    <span class="pre-adzan-digits">
                        {String(remaining).padStart(2, "0")}
                    </span>
                {/key}
                <span class="pre-adzan-unit">DETIK</span>
            </div>
        </div>

        <!-- Arabic teks running -->
        {#key arabicText}
            <div class="pre-adzan-arabic">
                {arabicText}
            </div>
        {/key}

        <!-- Dot progress -->
        <div class="pre-adzan-dots">
            {#each Array(60) as _, i}
                <span
                    class="pre-adzan-dot"
                    class:pre-adzan-dot--active={i >= 60 - remaining}
                ></span>
            {/each}
        </div>
    </div>
</div>

<style>
    .pre-adzan-overlay {
        position: absolute;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-family: var(--font-body);
        animation: preAdzanFadeIn 0.8s ease-out;
    }

    .pre-adzan-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            ellipse at 50% 40%,
            rgba(255, 200, 50, 0.25) 0%,
            rgba(20, 15, 5, 1) 50%,
            rgba(5, 3, 1, 1) 100%
        );
        animation: preAdzanBgPulse 3s ease-in-out infinite;
    }

    /* ── Light beams ── */
    .pre-adzan-beams {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
    }

    .beam {
        position: absolute;
        top: -30%;
        width: 8px;
        height: 160%;
        background: linear-gradient(
            180deg,
            rgba(251, 191, 36, 0) 0%,
            rgba(251, 191, 36, 0.5) 40%,
            rgba(251, 191, 36, 0) 100%
        );
        transform: rotate(20deg);
        animation: beamSweep 4s ease-in-out infinite;
    }

    .beam-1 { left: 20%; animation-delay: 0s; }
    .beam-2 { left: 50%; animation-delay: 1.3s; }
    .beam-3 { left: 75%; animation-delay: 2.6s; }

    /* ── Inner content ── */
    .pre-adzan-inner {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: clamp(8px, 1.5vh, 24px);
        animation: preAdzanContentRise 1s ease-out;
    }

    .pre-adzan-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .pre-adzan-label {
        font-size: clamp(14px, 2vw, 36px);
        font-weight: 600;
        color: rgba(251, 191, 36, 0.8);
        letter-spacing: 0.25em;
        text-transform: uppercase;
    }

    .pre-adzan-prayer {
        font-size: clamp(20px, 3vw, 56px);
        font-weight: 700;
        color: #fbbf24;
        letter-spacing: 0.15em;
        text-shadow: 0 0 30px rgba(251, 191, 36, 0.4);
    }

    /* ── Circular ring + number ── */
    .pre-adzan-circle-wrap {
        position: relative;
        width: clamp(180px, 28vw, 320px);
        height: clamp(180px, 28vw, 320px);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .pre-adzan-ring {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.3));
    }

    .pre-adzan-ring-bg {
        transition: none;
    }

    .pre-adzan-ring-fg {
        filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
    }

    .pre-adzan-number {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }

    .pre-adzan-digits {
        font-size: clamp(56px, 10vw, 140px);
        font-weight: 900;
        color: #fff;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
        text-shadow: 0 0 40px rgba(251, 191, 36, 0.6);
        animation: digitPulse 1s ease-in-out;
        transition: all 0.3s ease;
    }

    .pre-adzan-unit {
        font-size: clamp(11px, 1.4vw, 24px);
        font-weight: 600;
        color: rgba(251, 191, 36, 0.6);
        letter-spacing: 0.3em;
    }

    /* ── Arabic text ── */
    .pre-adzan-arabic {
        font-family: var(--font-arabic, "Scheherazade New", serif);
        font-size: clamp(18px, 2.5vw, 48px);
        color: rgba(251, 191, 36, 0.7);
        text-align: center;
        direction: rtl;
        min-height: 1.4em;
        animation: arabicFadeIn 0.5s ease-out;
    }

    /* ── Dot progress bar ── */
    .pre-adzan-dots {
        display: flex;
        gap: 3px;
        max-width: min(80vw, 400px);
        flex-wrap: wrap;
        justify-content: center;
    }

    .pre-adzan-dot {
        width: clamp(4px, 0.5vw, 8px);
        height: clamp(4px, 0.5vw, 8px);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        transition: background 0.3s ease, transform 0.3s ease;
    }

    .pre-adzan-dot--active {
        background: #fbbf24;
        box-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
        transform: scale(1.3);
    }

    /* ── Vertical mode ── */
    .pre-adzan--vertical .pre-adzan-inner {
        gap: clamp(12px, 2.5vh, 20px);
    }

    .pre-adzan--vertical .pre-adzan-circle-wrap {
        width: clamp(140px, 40vw, 240px);
        height: clamp(140px, 40vw, 240px);
    }

    .pre-adzan--vertical .pre-adzan-digits {
        font-size: clamp(40px, 12vw, 80px);
    }

    .pre-adzan--vertical .pre-adzan-dots {
        max-width: 90vw;
    }

    /* ── Animations ── */
    @keyframes preAdzanFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes preAdzanBgPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.02); }
    }

    @keyframes preAdzanContentRise {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes beamSweep {
        0% { transform: rotate(15deg) translateX(-40vw); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: rotate(25deg) translateX(40vw); opacity: 0; }
    }

    @keyframes digitPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.04); }
        100% { transform: scale(1); }
    }

    @keyframes arabicFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>
