<script lang="ts">
    interface Props {
        mood: "normal" | "adzan" | "iqamah" | "khusuk";
        moodPrayerName: string;
        countdown: string;
        countdownLabel: string;
    }

    let {
        mood,
        moodPrayerName,
        countdown = "",
        countdownLabel = "",
    }: Props = $props();
</script>

{#if mood === "adzan"}
    <div class="mood-overlay mood-overlay--adzan">
        <div class="mood-icon">🔔</div>
        <div class="mood-title">وَقْتُ الْأَذَان</div>
        <div class="mood-subtitle">WAKTU ADZAN</div>
        <div class="mood-prayer">SHOLAT {moodPrayerName}</div>
        <div class="mood-ayat">
            "Allahu Akbar, Allahu Akbar. Asyhadu alla ilaha illallah, Asyhadu
            anna Muhammadar Rasulullah."
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

{#if mood === "iqamah"}
    <div class="mood-overlay mood-overlay--iqamah">
        <div class="mood-icon">🕌</div>
        <div class="mood-title">IQAMAH</div>
        <div class="mood-subtitle">SILAKAN LURUSKAN SHAF</div>
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
    <div class="mood-overlay mood-overlay--khusuk">
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
        animation: moodFadeIn 0.6s ease-out;
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
        font-size: clamp(48px, 10vw, 140px);
        margin-bottom: 2%;
        animation: moodPulse 2s ease-in-out infinite;
    }

    .mood-title {
        font-family: var(--font-heading), serif;
        font-size: clamp(36px, 7vw, 110px);
        font-weight: 700;
        color: var(--accent-primary);
        text-align: center;
        letter-spacing: 0.08em;
        text-shadow: 0 0 40px var(--accent-muted);
    }

    .mood-subtitle {
        font-size: clamp(20px, 2.8vw, 48px);
        color: var(--text-secondary);
        margin-top: 1.5%;
        text-align: center;
        letter-spacing: 0.15em;
    }

    .mood-prayer {
        font-size: clamp(24px, 3.5vw, 60px);
        font-weight: 600;
        color: var(--accent-secondary);
        margin-top: 2%;
        text-align: center;
    }

    .mood-adzan-call {
        font-family: var(--font-arabic), "Scheherazade New", serif;
        font-size: clamp(20px, 3vw, 52px);
        color: var(--accent-primary);
        margin-top: 2%;
        text-align: center;
        direction: rtl;
        opacity: 0.9;
    }

    .mood-ayat {
        font-family: var(--font-arabic), serif;
        font-size: clamp(16px, 2.2vw, 52px);
        color: var(--text-secondary);
        margin-top: 3%;
        text-align: center;
        max-width: 60%;
        line-height: 1.6;
        font-style: italic;
    }

    .mood-ayat-src {
        font-size: clamp(10px, 1.2vw, 32px);
        color: var(--accent-muted);
        margin-top: 1%;
        text-align: center;
    }

    .mood-countdown {
        margin-top: 3%;
        background: var(--card-bg, rgba(255, 255, 255, 0.06));
        border: 1px solid var(--card-border, rgba(255, 255, 255, 0.12));
        border-radius: var(--border-radius, 12px);
        padding: clamp(12px, 1.5vw, 24px) clamp(24px, 3vw, 48px);
        text-align: center;
    }

    .mood-countdown-label {
        font-size: clamp(10px, 1vw, 46px);
        color: var(--text-muted);
        letter-spacing: 0.15em;
        font-weight: 600;
        margin-bottom: 4px;
    }

    .mood-countdown-val {
        font-size: clamp(36px, 5vw, 90px);
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
