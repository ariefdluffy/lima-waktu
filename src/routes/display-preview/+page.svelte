<script lang="ts">
    import type { DisplayPayload } from "$lib/types/display";
    import LeftPanel from "$lib/components/display/LeftPanel.svelte";
    import CenterPanel from "$lib/components/display/CenterPanel.svelte";
    import RightPanel from "$lib/components/display/RightPanel.svelte";
    import RunningBar from "$lib/components/display/RunningBar.svelte";
    import MoodOverlay from "$lib/components/display/MoodOverlay.svelte";
    import { themeCssVars } from "$lib/display/helpers";
    import { DEFAULT_SLIDES } from "$lib/utils/prayer";
    import {
        audio,
        handleUnlockAudio,
        initAudio,
    } from "$lib/display/audio.svelte";
    import {
        prayer,
        updatePrayerState,
        resetBeepTriggers,
    } from "$lib/display/prayer.svelte";

    let { data }: { data: { displayPayload: DisplayPayload } } = $props();

    let payload = $derived(data.displayPayload);
    let now = $state(new Date());
    let liveClock = $state("");
    let liveDate = $state("");
    let currentSlide = $state(0);
    let slideFading = $state(false);
    let hijriyahDate = $state("");
    let currentJumbotron = $state(0);

    let tz = $derived(payload.masjid.timezone ?? "Asia/Makassar");

    function updateClock() {
        now = new Date();
        liveClock = now.toLocaleTimeString("id-ID", {
            hour12: false,
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        liveDate = now.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: tz,
        });
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Init AudioContext sedini mungkin — autoplay
    initAudio();
    resetBeepTriggers();

    // Prayer update tiap detik — trigger beep otomatis
    setInterval(() => {
        if (payload) updatePrayerState(payload, new Date());
    }, 1000);

    function rotateSlide() {
        slideFading = true;
        setTimeout(() => {
            const slides = payload?.slides ?? [];
            const total = Math.max(slides.length, DEFAULT_SLIDES.length);
            currentSlide = (currentSlide + 1) % total;
            slideFading = false;
        }, 500);
    }
    setInterval(rotateSlide, 7000);

    function rotateJumbotron() {
        if (!payload?.jumbotrons?.length) return;
        currentJumbotron = (currentJumbotron + 1) % payload.jumbotrons.length;
    }
    setInterval(rotateJumbotron, 10000);

    function getRunningText() {
        if (!payload?.runningTexts?.length) {
            return "Selamat datang di Masjid. Mohon menonaktifkan nada dering ponsel.";
        }
        return payload.runningTexts.map((rt) => rt.content).join("  |  ");
    }
</script>

<svelte:head>
    <title>Preview Display TV - Lima Waktu</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&family=Exo+2:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap"
        rel="stylesheet"
    />
    <link rel="icon" href="/favicon.svg" />
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #0a0f1e;
        }
    </style>
</svelte:head>

<div class="tv-wrap" style={themeCssVars(payload?.theme?.palette ?? null)}>
    <div class="preview-bar">
        <span class="preview-badge">🔍 PREVIEW LAYAR</span>
        <span class="preview-info"
            >{payload.masjid.name} &middot; {liveDate}</span
        >
        <span class="preview-time">{liveClock}</span>
    </div>

    <button
        class="sound-unlock-btn"
        class:sound-unlock-btn--blocked={audio.blocked}
        onclick={handleUnlockAudio}
        title="Aktifkan suara adzan"
    >
        {#if audio.blocked}🔕{:else}🔔{/if}
    </button>

    <div class="bg-stars"></div>
    <div class="bg-grid"></div>
    <div class="top-bar"></div>

    <header class="header">
        <div class="masjid-logo-area">
            <div class="masjid-logo">🕌</div>
            <div>
                <div class="masjid-name">{payload.masjid.name}</div>
                <div class="masjid-loc">
                    {payload.masjid.city}, {payload.masjid.province}
                </div>
            </div>
        </div>
        <div class="header-right">
            <div class="header-time">{liveClock}</div>
        </div>
    </header>

    <main class="main-body">
        <LeftPanel
            nextPrayerName={prayer.nextPrayerName}
            nextPrayerTime={prayer.nextPrayerTime}
            countdown={prayer.countdown}
            countdownProgress={prayer.countdownProgress}
            iqamahTime={prayer.iqamahTime}
            {liveDate}
        />
        <CenterPanel
            {payload}
            activePrayerIndex={prayer.activePrayerIndex}
            {currentSlide}
            {slideFading}
            isJumat={false}
        />
        <RightPanel
            {payload}
            {hijriyahDate}
            weatherTemp={null}
            weatherCode={null}
            weatherLoading={false}
            {currentJumbotron}
            isJumat={false}
            isJumatCardVisible={false}
            mood={prayer.mood}
            moodPrayerKey={prayer.moodPrayerKey}
        />
    </main>

    <RunningBar content={getRunningText()} />
    <MoodOverlay
        mood={prayer.mood}
        moodPrayerName={prayer.moodPrayerName}
        moodPrayerKey={prayer.moodPrayerKey}
        countdown={prayer.moodCountdown}
        countdownLabel={prayer.moodCountdownLabel}
        isJumat={false}
    />
</div>

<style>
    .tv-wrap {
        width: 100vw;
        height: 100vh;
        background: var(--bg-primary);
        font-family: var(--font-body, "Exo 2", sans-serif);
        position: relative;
        overflow: hidden;
        color: var(--text-primary);
    }

    .preview-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        height: 28px;
        background: linear-gradient(90deg, #065f46, #047857, #065f46);
        color: white;
        font-family: "Inter", system-ui, sans-serif;
        font-size: 11px;
        letter-spacing: 0.03em;
    }
    .preview-badge {
        background: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 4px;
        padding: 1px 8px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
    }
    .preview-info {
        opacity: 0.8;
    }
    .preview-time {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        opacity: 0.7;
    }

    .bg-stars {
        position: absolute;
        inset: 0;
        background:
            radial-gradient(
                ellipse at 20% 50%,
                var(--bg-secondary),
                transparent 60%
            ),
            radial-gradient(
                ellipse at 80% 20%,
                var(--bg-secondary),
                transparent 60%
            ),
            radial-gradient(
                ellipse at 50% 100%,
                var(--bg-secondary),
                transparent 60%
            );
    }
    .bg-grid {
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(var(--bg-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--bg-grid) 1px, transparent 1px);
        background-size: 40px 40px;
    }

    .sound-unlock-btn {
        position: absolute;
        top: 32px;
        right: 10px;
        z-index: 100;
        background: var(--border-accent);
        border: 1px solid var(--accent-muted);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent-primary);
        transition:
            background 0.2s,
            transform 0.2s,
            box-shadow 0.2s;
    }
    .sound-unlock-btn:hover {
        background: var(--prayer-active-bg);
    }
    .sound-unlock-btn--blocked {
        animation: bell-pulse 1.5s ease-in-out infinite;
        border-color: #f59e0b;
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.15);
    }
    @keyframes bell-pulse {
        0%,
        100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
        }
        50% {
            transform: scale(1.15);
            box-shadow: 0 0 12px 4px rgba(245, 158, 11, 0.3);
        }
    }

    .top-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(
            90deg,
            transparent,
            var(--accent-secondary),
            var(--accent-primary),
            var(--accent-secondary),
            transparent
        );
    }

    .header {
        position: absolute;
        top: 28px;
        left: 0;
        right: 0;
        height: 10%;
        display: flex;
        align-items: center;
        padding: 0.8% 2.5% 0 2%;
        background: var(--header-bg);
    }
    .masjid-logo-area {
        display: flex;
        align-items: center;
        gap: 1.2%;
        flex: 1;
    }
    .masjid-logo {
        width: 7%;
        aspect-ratio: 1;
        background: var(--border-accent);
        border: 1.5px solid var(--prayer-active-border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(16px, 3vw, 60px);
    }
    .masjid-name {
        font-family: var(--font-heading, "Cinzel"), serif;
        font-size: clamp(13px, 2.5vw, 44px);
        font-weight: 700;
        color: var(--accent-primary);
        letter-spacing: 0.05em;
    }
    .masjid-loc {
        font-size: clamp(8px, 1.1vw, 22px);
        color: var(--text-secondary);
        margin-top: 2px;
        letter-spacing: 0.08em;
    }
    .header-right {
        text-align: right;
    }
    .header-time {
        font-size: clamp(20px, 5vw, 100px);
        font-weight: 700;
        color: var(--accent-primary);
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
    }

    .main-body {
        position: absolute;
        top: calc(10% + 28px + 3px);
        bottom: 8%;
        left: 0;
        right: 0;
        display: flex;
        align-items: stretch;
    }
</style>
