<script lang="ts">
    interface Props {
        mood: "normal" | "adzan" | "iqamah" | "khusuk";
        moodPrayerName: string;
        moodPrayerKey: string;
        countdown: string;
        countdownLabel: string;
        isJumat: boolean;
        orientation?: "horizontal" | "vertical";
    }

    let {
        mood,
        moodPrayerName,
        moodPrayerKey = "",
        countdown = "",
        countdownLabel = "",
        isJumat = false,
        orientation = "horizontal",
    }: Props = $props();

    // Layar Jumat: hari Jumat + adzan Dzuhur
    const isJumatAdzan = $derived(
        isJumat && mood === "adzan" && moodPrayerKey === "dzuhur",
    );
</script>

{#if mood === "adzan"}
    {#if isJumatAdzan}
        <!-- LAYAR JUMAT -->
        <div class="mood-overlay mood-overlay--jumat" class:mood-overlay--vertical={orientation === "vertical"}>
            <!-- <div class="mood-icon">🕌</div> -->
            <div class="mood-jumat-badge">HARI JUM'AT</div>
            <div class="mood-title">أَذَانُ الْجُمُعَة</div>
            <div class="mood-subtitle">ADZAN JUM'AT</div>
            <div class="mood-prayer">SHOLAT JUM'AT</div>
            <div class="mood-ayat">
                يَا أَيُّهَا الَّذِينَ آمَنُوا إِإذَا نُودِيَ لِلصَّلَاةِ مِن
                يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ
            </div>
            <div class="mood-ayat-src">QS. Al-Jumu'ah: 9</div>
            <div class="mood-adzan-call">
                حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ
            </div>
            {#if countdown}
                <div class="mood-countdown">
                    <div class="mood-countdown-label">{countdownLabel}</div>
                    <div class="mood-countdown-val">{countdown}</div>
                </div>
            {/if}
        </div>
    {:else}
        <!-- LAYAR ADZAN BIASA -->
        <div class="mood-overlay mood-overlay--adzan" class:mood-overlay--vertical={orientation === "vertical"}>
            <!-- <div class="mood-icon">🕌</div> -->
            <div class="mood-title">وَقْتُ الْأَذَان</div>
            <div class="mood-subtitle">WAKTU ADZAN</div>
            <div class="mood-prayer">SHOLAT {moodPrayerName}</div>
            <div class="mood-ayat">
                "Allahu Akbar, Allahu Akbar. Asyhadu alla ilaha illallah,
                Asyhadu anna Muhammadar Rasulullah."
            </div>
            <div class="mood-adzan-call">
                حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ
            </div>
            {#if countdown}
                <div class="mood-countdown">
                    <div class="mood-countdown-label">{countdownLabel}</div>
                    <div class="mood-countdown-val">{countdown}</div>
                </div>
            {/if}
        </div>
    {/if}
{/if}

{#if mood === "iqamah"}
    <div class="mood-overlay mood-overlay--iqamah" class:mood-overlay--vertical={orientation === "vertical"}>
        <!-- <div class="mood-icon">🕌</div> -->
        <div class="mood-title">WAKTU MENUNGGU IQAMAH</div>
        <div class="mood-subtitle">BERSEGERA WUDHU DAN SHOLAT SUNNAH</div>
        <div class="mood-prayer">SHOLAT {moodPrayerName}</div>
        {#if countdown}
            <div class="mood-countdown">
                <div class="mood-countdown-label">{countdownLabel}</div>
                <div class="mood-countdown-val">{countdown}</div>
            </div>
        {/if}
    </div>
{/if}

{#if mood === "khusuk"}
    <div class="mood-overlay mood-overlay--khusuk" class:mood-overlay--vertical={orientation === "vertical"}>
        <div class="mood-icon">☪️</div>
        <div class="mood-title">SHOLAT {moodPrayerName}</div>
        <div class="mood-subtitle">MOHON KHUSYUK</div>
        <div class="mood-ayat">
            "Sesungguhnya shalat itu mencegah dari perbuatan keji dan mungkar"
        </div>
        <div class="mood-ayat-src">QS. Al-Ankabut: 45</div>
        {#if countdown}
            <div class="mood-countdown">
                <div class="mood-countdown-label">{countdownLabel}</div>
                <div class="mood-countdown-val">{countdown}</div>
            </div>
        {/if}
    </div>
{/if}

<style>
    .mood-overlay {
        position: absolute;
        inset: 0;
        z-index: 50;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: clamp(2px, 0.6vh, 10px);
        overflow: hidden;
        padding: 2vh 0;
        animation: moodFadeIn 0.6s ease-out;
    }

    .mood-overlay--jumat {
        background: var(
            --mood-jumat-bg,
            radial-gradient(
                ellipse at center,
                rgba(10, 50, 20, 1) 0%,
                rgba(2, 20, 8, 1) 100%
            )
        );
    }

    .mood-jumat-badge {
        font-size: clamp(12px, 1.4vw, 24px);
        font-weight: 700;
        letter-spacing: 0.25em;
        color: var(--accent-secondary);
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--accent-muted, rgba(255, 255, 255, 0.2));
        border-radius: 999px;
        padding: 4px 20px;
        text-transform: uppercase;
    }

    .mood-overlay--adzan {
        background: var(
            --mood-adzan-bg,
            radial-gradient(
                ellipse at center,
                rgba(60, 40, 5, 1) 0%,
                rgba(20, 10, 2, 1) 100%
            )
        );
    }

    .mood-overlay--iqamah {
        background: var(
            --mood-iqamah-bg,
            radial-gradient(
                ellipse at center,
                rgba(0, 70, 35, 1) 0%,
                rgba(0, 20, 8, 1) 100%
            )
        );
    }

    .mood-overlay--khusuk {
        background: var(
            --mood-khusuk-bg,
            radial-gradient(
                ellipse at center,
                rgba(10, 5, 30, 1) 0%,
                rgba(0, 0, 0, 1) 100%
            )
        );
    }

    .mood-icon {
        font-size: clamp(36px, 7vw, 100px);
        animation: moodPulse 2s ease-in-out infinite;
    }

    .mood-title {
        font-family: var(--font-heading), serif;
        font-size: clamp(36px, 7vw, 90px);
        font-weight: 700;
        color: var(--accent-primary);
        text-align: center;
        letter-spacing: 0.08em;
        text-shadow: 0 0 40px var(--accent-muted);
    }

    .mood-subtitle {
        font-size: clamp(16px, 3vw, 64px);
        color: var(--text-secondary);
        text-align: center;
        letter-spacing: 0.15em;
    }

    .mood-prayer {
        font-size: clamp(18px, 3.5vw, 120px);
        font-weight: 600;
        color: var(--accent-secondary);
        text-align: center;
    }

    .mood-adzan-call {
        font-family: var(--font-arabic), "Scheherazade New", serif;
        font-size: clamp(16px, 2.5vw, 42px);
        color: var(--accent-primary);
        text-align: center;
        direction: rtl;
        opacity: 0.9;
    }

    .mood-ayat {
        font-family: var(--font-arabic), serif;
        font-size: clamp(14px, 1.8vw, 40px);
        color: var(--text-secondary);
        text-align: center;
        max-width: 60%;
        line-height: 1.4;
        font-style: italic;
    }

    /* ── Penyesuaian Vertikal untuk MoodOverlay ── */
    .mood-overlay--vertical {
        gap: clamp(8px, 2.5vh, 24px);
        padding: 3vh 4vw;
    }

    .mood-overlay--vertical .mood-ayat {
        max-width: 90%;
        line-height: 1.6;
        font-size: clamp(12px, 2.8vw, 22px);
    }

    .mood-overlay--vertical .mood-title {
        font-size: clamp(24px, 5.5vw, 56px);
    }

    .mood-overlay--vertical .mood-subtitle {
        font-size: clamp(11px, 2.4vw, 22px);
    }

    .mood-overlay--vertical .mood-prayer {
        font-size: clamp(16px, 3.5vw, 32px);
    }

    .mood-overlay--vertical .mood-adzan-call {
        font-size: clamp(12px, 2.6vw, 22px);
        line-height: 1.6;
    }

    .mood-overlay--vertical .mood-countdown {
        padding: 1.5vh 4vw;
        max-width: 80vw;
    }

    .mood-overlay--vertical .mood-countdown-label {
        font-size: clamp(9px, 1.8vw, 16px);
    }

    .mood-overlay--vertical .mood-countdown-val {
        font-size: clamp(22px, 5vw, 56px);
    }

    .mood-ayat-src {
        font-size: clamp(10px, 1.2vw, 24px);
        color: var(--accent-muted);
        text-align: center;
    }

    .mood-countdown {
        background: var(--card-bg, rgba(255, 255, 255, 0.06));
        border: 1px solid var(--card-border, rgba(255, 255, 255, 0.12));
        border-radius: var(--border-radius, 12px);
        padding: clamp(12px, 1.5vw, 24px) clamp(24px, 3vw, 48px);
        text-align: center;
    }

    .mood-countdown-label {
        font-size: clamp(10px, 2vw, 48px);
        color: var(--text-muted);
        letter-spacing: 0.15em;
        font-weight: 600;
        margin-bottom: 4px;
    }

    .mood-countdown-val {
        font-size: clamp(28px, 5vw, 120px);
        font-weight: 700;
        color: var(--accent-primary);
        font-variant-numeric: tabular-nums;
        text-shadow: 0 0 20px var(--accent-muted);
        letter-spacing: 0.05em;
    }

    @keyframes moodFadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes moodPulse {
        0%,
        100% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.08);
            opacity: 0.85;
        }
    }
</style>
