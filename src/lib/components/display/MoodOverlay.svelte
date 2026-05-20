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
        background: radial-gradient(
            ellipse at center,
            rgba(0, 70, 35, 0.96) 0%,
            rgba(0, 20, 8, 0.99) 100%
        );
    }

    .mood-overlay--khusuk {
        background: radial-gradient(
            ellipse at center,
            rgba(10, 5, 30, 0.97) 0%,
            rgba(0, 0, 0, 0.99) 100%
        );
    }

    .mood-icon {
        font-size: clamp(48px, 10vw, 140px);
        margin-bottom: 2%;
        animation: moodPulse 2s ease-in-out infinite;
    }

    .mood-title {
        font-family: "Cinzel", serif;
        font-size: clamp(36px, 7vw, 110px);
        font-weight: 700;
        color: #f0d080;
        text-align: center;
        letter-spacing: 0.08em;
        text-shadow: 0 0 40px rgba(240, 208, 128, 0.3);
    }

    .mood-subtitle {
        font-size: clamp(20px, 2.8vw, 48px);
        color: rgba(255, 255, 255, 0.7);
        margin-top: 1.5%;
        text-align: center;
        letter-spacing: 0.15em;
    }

    .mood-prayer {
        font-size: clamp(24px, 3.5vw, 60px);
        font-weight: 600;
        color: #c8a84b;
        margin-top: 2%;
        text-align: center;
    }

    .mood-ayat {
        font-family: "Noto Naskh Arabic", serif;
        font-size: clamp(16px, 2.2vw, 40px);
        color: rgba(255, 255, 255, 0.5);
        margin-top: 3%;
        text-align: center;
        max-width: 60%;
        line-height: 1.6;
        font-style: italic;
    }

    .mood-ayat-src {
        font-size: clamp(10px, 1.2vw, 20px);
        color: rgba(200, 168, 75, 0.5);
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
