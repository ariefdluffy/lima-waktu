<script lang="ts">
    interface Props {
        mood: "normal" | "iqamah" | "khusuk";
        moodPrayerName: string;
    }

    let { mood, moodPrayerName }: Props = $props();
</script>

{#if mood === "iqamah"}
    <div class="mood-overlay mood-overlay--iqamah">
        <div class="mood-icon">🕌</div>
        <div class="mood-title">IQAMAH</div>
        <div class="mood-subtitle">SILAKAN TEGAKKAN SHAF</div>
        <div class="mood-prayer">SHOLAT {moodPrayerName}</div>
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

    .mood-overlay--iqamah {
        background: var(--mood-iqamah-bg);
    }

    .mood-overlay--khusuk {
        background: var(--mood-khusuk-bg);
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

    .mood-ayat {
        font-family: var(--font-arabic), serif;
        font-size: clamp(16px, 2.2vw, 40px);
        color: var(--text-secondary);
        margin-top: 3%;
        text-align: center;
        max-width: 60%;
        line-height: 1.6;
        font-style: italic;
    }

    .mood-ayat-src {
        font-size: clamp(10px, 1.2vw, 20px);
        color: var(--accent-muted);
        margin-top: 1%;
        text-align: center;
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
