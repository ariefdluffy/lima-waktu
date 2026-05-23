<script lang="ts">
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import type { DisplayPayload } from "$lib/types/display";
    import LeftPanel from "$lib/components/display/LeftPanel.svelte";
    import CenterPanel from "$lib/components/display/CenterPanel.svelte";
    import RightPanel from "$lib/components/display/RightPanel.svelte";
    import RunningBar from "$lib/components/display/RunningBar.svelte";
    import YoutubeLayout from "$lib/components/display/YoutubeLayout.svelte";
    import MoodOverlay from "$lib/components/display/MoodOverlay.svelte";
    import "$lib/styles/display-fullhd.css";
    import { DEFAULT_SLIDES } from "$lib/utils/prayer";

    // Extracted modules
    import { prayer, updatePrayerState } from "$lib/display/prayer.svelte";
    import {
        audio,
        handleUnlockAudio,
        initAudio,
    } from "$lib/display/audio.svelte";
    import {
        weather,
        fetchWeather,
        skipWeather,
    } from "$lib/display/weather.svelte";
    import {
        themeCssVars,
        getWIBParts,
        formatTime,
        formatDate,
        computeHijriyah,
        getTZLabelText,
        getLocationText,
        getYoutubeEmbedUrl,
        getRunningTextContent,
        getCurrentSlideContent,
    } from "$lib/display/helpers";

    let { data }: { data: PageData } = $props();

    let payload: DisplayPayload | null = $state(null);
    let theme = $derived.by(() => payload?.theme ?? null);
    let loading = $state(true);
    let error: string | null = $state(null);
    let errorCountdown = $state(15);

    // Time state
    let now = $state(new Date());
    let liveClock = $state("");
    let liveDate = $state("");

    // Slide state
    let currentSlide = $state(0);
    let slideFading = $state(false);

    // Hijriyah
    let hijriyahDate = $state("");

    // Jumbotron rotate
    let currentJumbotron = $state(0);

    // Timezone derived (reused in template & functions)
    let tz = $derived.by(() => payload?.masjid?.timezone ?? "Asia/Makassar");

    // TZ label
    let tzLabel = $derived.by(() => getTZLabelText(tz, payload?.masjid?.city));

    // ── Named Handlers ──────────────────────────────────────────────
    function handleRefresh() {
        window.location.reload();
    }
    function handleCardClick(e: MouseEvent) {
        e.stopPropagation();
    }

    // ── Clock ───────────────────────────────────────────────────
    function updateClock() {
        now = new Date();
        liveClock = formatTime(now, tz);
        liveDate = formatDate(now, tz);
    }

    // ── Hijriyah ──────────────────────────────────────────────────
    function updateHijriyah() {
        const offset = payload?.masjid?.hijriOffset ?? 0;
        hijriyahDate = computeHijriyah(new Date(), tz, offset);
    }

    // ── Slide ─────────────────────────────────────────────────────
    function rotateSlide() {
        slideFading = true;
        setTimeout(() => {
            const slides = payload?.slides ?? [];
            const total = Math.max(slides.length, DEFAULT_SLIDES.length);
            currentSlide = (currentSlide + 1) % total;
            slideFading = false;
        }, 500);
    }

    // ── Jumbotron ────────────────────────────────────────────────
    function rotateJumbotron() {
        if (!payload?.jumbotrons?.length) return;
        currentJumbotron = (currentJumbotron + 1) % payload.jumbotrons.length;
    }

    // ── Data Fetch ────────────────────────────────────────────────
    async function fetchData() {
        try {
            const res = await fetch(
                `/api/v1/display/${data.device.deviceCode}`,
            );
            const json = await res.json();
            if (json.ok) {
                payload = json.data;
            } else {
                error = json.message;
            }
        } catch (e) {
            error = "Gagal mengambil data";
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        initAudio();
        fetchData();

        const clockInterval = setInterval(updateClock, 1000);
        updateClock();

        updateHijriyah();
        const hijriInterval = setInterval(updateHijriyah, 3600000);

        const prayerInterval = setInterval(() => {
            if (payload) updatePrayerState(payload, now);
        }, 1000);

        const slideInterval = setInterval(rotateSlide, 7000);

        const jumbotronInterval = setInterval(rotateJumbotron, 10000);

        const dataInterval = setInterval(fetchData, 15000);

        const onVisible = () => {
            if (document.visibilityState === "visible") {
                fetchData();
            }
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            clearInterval(clockInterval);
            clearInterval(hijriInterval);
            clearInterval(prayerInterval);
            clearInterval(slideInterval);
            clearInterval(jumbotronInterval);
            clearInterval(dataInterval);
            document.removeEventListener("visibilitychange", onVisible);
        };
    });

    // Auto-reload countdown saat error
    $effect(() => {
        if (error) {
            errorCountdown = 15;
            const timer = setInterval(() => {
                errorCountdown -= 1;
                if (errorCountdown <= 0) {
                    clearInterval(timer);
                    window.location.reload();
                }
            }, 1000);
            return () => clearInterval(timer);
        }
    });

    $effect(() => {
        if (payload) {
            // Initial prayer state sync (interval handles subsequent updates)
            updatePrayerState(payload, now);
            updateHijriyah();
            if (payload.masjid?.latitude && payload.masjid?.longitude) {
                fetchWeather(payload.masjid.latitude, payload.masjid.longitude);
            } else {
                skipWeather();
            }
        }
    });
</script>

<svelte:head>
    <title>Display TV - {payload?.masjid?.name ?? "Lima Waktu"}</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Exo+2:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap"
        rel="stylesheet"
    />
</svelte:head>

{#if loading}
    <div class="loading-screen">
        <p>Memuat display...</p>
    </div>
{:else if error}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="display-error-screen" onclick={handleRefresh}>
        <div class="display-error-card" onclick={handleCardClick}>
            <div class="display-error-icon">⚠️</div>
            <div class="display-error-title">Gangguan Data</div>
            <p class="display-error-msg">{error}</p>
            <div class="display-error-hint">
                <p>
                    📋 Coba refresh halaman. Jika masih muncul, hubungi pengurus
                    masjid.
                </p>
            </div>
            <div class="display-error-timer">
                <svg class="display-error-ring" viewBox="0 0 40 40">
                    <circle
                        class="display-error-ring-bg"
                        cx="20"
                        cy="20"
                        r="17"
                    />
                    <circle
                        class="display-error-ring-fg"
                        cx="20"
                        cy="20"
                        r="17"
                        style="--pct: {((15 - errorCountdown) / 15) * 100}%"
                    />
                </svg>
                <span class="display-error-timer-text">{errorCountdown}s</span>
            </div>
            <button
                class="display-error-btn"
                onclick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                }}
            >
                🔄 Refresh Sekarang
            </button>
        </div>
    </div>
{:else if payload}
    {#if prayer.screensaver}
        <div
            class="screensaver"
            style={themeCssVars(payload?.theme?.palette ?? null)}
        >
            <div class="screensaver-bg"></div>
            <div class="screensaver-body">
                <div class="screensaver-logo">
                    {#if payload.masjid.logoUrl}
                        <img
                            src={payload.masjid.logoUrl}
                            alt="Logo"
                            class="screensaver-logo-img"
                        />
                    {:else}
                        🕌
                    {/if}
                </div>
                <div class="screensaver-masjid-name">
                    {payload.masjid.name}
                </div>
                <div class="screensaver-time">{liveClock}</div>
                <div class="screensaver-date">{liveDate}</div>
                <div class="screensaver-hijri">
                    {hijriyahDate || "—"}
                </div>
                <div class="screensaver-sub">
                    Display dalam mode hemat • Akan aktif kembali 1 Jam sebelum
                    waktu sholat
                </div>
            </div>
        </div>
    {:else if prayer.tahajudMode}
        <div
            class="tahajud"
            style={themeCssVars(payload?.theme?.palette ?? null)}
        >
            <div class="tahajud-bg"></div>
            <div class="tahajud-body">
                <div class="tahajud-badge">★ QIYAMUL LAIL ★</div>
                <div class="tahajud-ayat">
                    "Sesungguhnya orang-orang yang bertakwa berada di dalam
                    taman-taman (surga) dan mata air, mereka mengambil apa yang
                    diberikan Tuhan kepada mereka. Sesungguhnya mereka sebelum
                    itu di dunia adalah orang-orang yang berbuat baik; mereka
                    sedikit sekali tidur di waktu malam."
                </div>
                <div class="tahajud-ayat-src">QS. Adz-Dzariyat: 15-17</div>
                <div class="tahajud-time-wrap">
                    <div class="tahajud-time">{liveClock}</div>
                    <div class="tahajud-sub">
                        {liveDate} • {hijriyahDate || "—"}
                    </div>
                </div>
                <div class="tahajud-countdown">
                    <div class="tahajud-countdown-label">
                        MENUJU SHOLAT SUBUH
                    </div>
                    <div class="tahajud-countdown-val">{prayer.countdown}</div>
                </div>
                <div class="tahajud-masjid">{payload.masjid.name}</div>
            </div>
        </div>
    {:else}
        <div
            class="tv-wrap"
            style={themeCssVars(payload?.theme?.palette ?? null)}
            class:tv-wrap--mood={prayer.mood !== "normal"}
        >
            <div class="bg-stars"></div>
            <div class="bg-grid"></div>
            <button
                class="sound-unlock-btn"
                class:sound-unlock-btn--blocked={audio.blocked}
                onclick={handleUnlockAudio}
                title="Aktifkan suara adzan"
            >
                {#if audio.blocked}
                    🔕
                {:else}
                    🔔
                {/if}
            </button>
            <div class="top-bar"></div>

            <!-- HEADER -->
            <header class="header">
                <div class="masjid-logo-area">
                    <div class="masjid-logo">
                        {#if payload.masjid.logoUrl}
                            <img
                                src={payload.masjid.logoUrl}
                                alt="Logo {payload.masjid.name}"
                                class="masjid-logo-img"
                            />
                        {:else}
                            🕌
                        {/if}
                    </div>
                    <div class="masjid-name-block">
                        <div class="masjid-name">{payload.masjid.name}</div>
                        <div class="masjid-loc">
                            {getLocationText(payload.masjid)}
                        </div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="header-time">
                        {liveClock}
                        <!-- <span class="header-tz">{tzLabel}</span> -->
                    </div>
                </div>
            </header>

            <!-- MAIN BODY -->
            {#if payload.device.layoutMode === "youtube" && payload.youtubeItems.length > 0}
                <!-- YOUTUBE LAYOUT -->
                <YoutubeLayout
                    {payload}
                    nextPrayerName={prayer.nextPrayerName}
                    nextPrayerTime={prayer.nextPrayerTime}
                    countdown={prayer.countdown}
                    countdownProgress={prayer.countdownProgress}
                    iqamahTime={prayer.iqamahTime}
                    activePrayerIndex={prayer.activePrayerIndex}
                />
            {:else}
                <!-- DEFAULT LAYOUT -->
                <main class="main-body">
                    <!-- LEFT PANEL -->
                    <LeftPanel
                        nextPrayerName={prayer.nextPrayerName}
                        nextPrayerTime={prayer.nextPrayerTime}
                        countdown={prayer.countdown}
                        countdownProgress={prayer.countdownProgress}
                        iqamahTime={prayer.iqamahTime}
                        {liveDate}
                    />

                    <!-- CENTER PANEL -->
                    <CenterPanel
                        {payload}
                        activePrayerIndex={prayer.activePrayerIndex}
                        {currentSlide}
                        {slideFading}
                        isJumat={getWIBParts(now, tz).day === 5}
                    />

                    <!-- RIGHT PANEL -->
                    <RightPanel
                        {payload}
                        {hijriyahDate}
                        weatherTemp={weather.temp}
                        weatherCode={weather.code}
                        weatherLoading={weather.loading}
                        {currentJumbotron}
                        isJumat={getWIBParts(now, tz).day === 5}
                        isJumatCardVisible={getWIBParts(now, tz).day === 5 &&
                            getWIBParts(now, tz).hours < 12}
                        mood={prayer.mood}
                        moodPrayerKey={prayer.moodPrayerKey}
                    />
                </main>
            {/if}

            <!-- RUNNING TEXT -->
            <RunningBar content={getRunningTextContent(payload.runningTexts)} />

            <!-- MOOD OVERLAY -->
            <MoodOverlay
                mood={prayer.mood}
                moodPrayerName={prayer.moodPrayerName}
                moodPrayerKey={prayer.moodPrayerKey}
                countdown={prayer.moodCountdown}
                countdownLabel={prayer.moodCountdownLabel}
                isJumat={getWIBParts(now, tz).day === 5}
            />
        </div>
    {/if}
{/if}

<style>
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .loading-screen {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-family: var(--font-body);
    }

    /* ============= ERROR SCREEN ============= */
    .display-error-screen {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
            135deg,
            #0a0f1e 0%,
            #1a1f2e 50%,
            #0f1525 100%
        );
        font-family: var(--font-body, "Segoe UI", system-ui, sans-serif);
        position: relative;
        overflow: hidden;
    }

    .display-error-screen::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
            radial-gradient(
                ellipse at 20% 50%,
                rgba(239, 68, 68, 0.08) 0%,
                transparent 50%
            ),
            radial-gradient(
                ellipse at 80% 50%,
                rgba(245, 158, 11, 0.06) 0%,
                transparent 50%
            );
        pointer-events: none;
    }

    .display-error-card {
        position: relative;
        z-index: 1;
        max-width: 420px;
        width: 100%;
        background: rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 48px 32px 36px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .display-error-icon {
        font-size: 56px;
        margin-bottom: 12px;
        line-height: 1;
        filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.25));
    }

    .display-error-title {
        font-size: 22px;
        font-weight: 700;
        color: #f1f5f9;
        margin-bottom: 8px;
        letter-spacing: -0.3px;
    }

    .display-error-msg {
        font-size: 14px;
        color: #94a3b8;
        margin: 0 0 24px;
        line-height: 1.5;
    }

    .display-error-hint {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 14px;
        padding: 16px 20px;
        margin-bottom: 24px;
        text-align: left;
    }

    .display-error-hint p {
        font-size: 13px;
        color: #94a3b8;
        line-height: 1.6;
        margin: 0;
    }

    .display-error-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #059669, #10b981);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 14px 32px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
    }

    .display-error-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(5, 150, 105, 0.4);
    }

    .display-error-btn:active {
        transform: translateY(0);
    }

    .display-error-timer {
        position: relative;
        width: 48px;
        height: 48px;
        margin: 0 auto 20px;
    }

    .display-error-ring {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
    }

    .display-error-ring-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.06);
        stroke-width: 3;
    }

    .display-error-ring-fg {
        fill: none;
        stroke: #10b981;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 106.8;
        stroke-dashoffset: calc(106.8 - (var(--pct, 0%) * 106.8 / 100));
        transition: stroke-dashoffset 1s linear;
    }

    .display-error-timer-text {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 600;
        color: #94a3b8;
        font-variant-numeric: tabular-nums;
    }

    /* SCREENSAVER (MODE HEMAT) */
    .screensaver {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
            135deg,
            var(--bg-primary) 0%,
            var(--bg-primary) 30%,
            var(--bg-overlay) 60%,
            var(--bg-primary) 100%
        );
        font-family: var(--font-body);
        color: var(--text-primary);
        position: relative;
        overflow: hidden;
    }

    .screensaver-bg {
        position: absolute;
        inset: 0;
        background: var(--screensaver-bg);
        pointer-events: none;
    }

    .screensaver-body {
        position: relative;
        z-index: 1;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        animation: screensaverFade 2s ease-out;
    }

    @keyframes screensaverFade {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .screensaver-logo {
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 64px;
        margin-bottom: 8px;
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 50%;
        overflow: hidden;
    }

    .screensaver-logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    }

    .screensaver-masjid-name {
        font-family: var(--font-heading), serif;
        font-size: clamp(18px, 3.5vw, 106px);
        font-weight: 600;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
    }

    .screensaver-time {
        font-size: clamp(48px, 16vw, 320px);
        font-weight: 700;
        line-height: 1;
        letter-spacing: 0.02em;
        background: linear-gradient(
            135deg,
            var(--text-primary) 0%,
            var(--text-muted) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-top: 8px;
    }

    .screensaver-date {
        font-size: clamp(14px, 16vw, 104px);
        color: var(--text-muted);
    }

    .screensaver-hijri {
        font-size: clamp(12px, 13vw, 84px);
        color: var(--accent-muted);
        margin-top: 4px;
    }

    .screensaver-sub {
        font-size: clamp(10px, 0.9vw, 38px);
        color: var(--text-muted);
        text-align: center;
        width: 100%;
        padding: 0 24px;
    }

    /* TAHAJUD MODE */
    .tahajud {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
            135deg,
            var(--bg-primary) 0%,
            var(--bg-primary) 40%,
            var(--bg-overlay) 70%,
            var(--bg-primary) 100%
        );
        font-family: var(--font-body);
        color: var(--text-primary);
        position: relative;
        overflow: hidden;
    }

    .tahajud-bg {
        position: absolute;
        inset: 0;
        background: var(--tahajud-bg);
        pointer-events: none;
    }

    .tahajud-body {
        position: relative;
        z-index: 1;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        max-width: 700px;
        padding: 0 24px;
        animation: screensaverFade 2s ease-out;
    }

    .tahajud-badge {
        font-family: var(--font-heading), serif;
        font-size: clamp(14px, 1.6vw, 24px);
        font-weight: 700;
        color: var(--accent-secondary);
        letter-spacing: 0.3em;
        text-shadow: 0 0 20px var(--accent-muted);
    }

    .tahajud-ayat {
        font-size: clamp(13px, 1.3vw, 20px);
        color: var(--text-secondary);
        line-height: 1.8;
        font-style: italic;
        max-width: 600px;
    }

    .tahajud-ayat-src {
        font-size: clamp(10px, 0.9vw, 14px);
        color: var(--accent-muted);
        margin-top: -8px;
    }

    .tahajud-time-wrap {
        margin-top: 16px;
        text-align: center;
    }

    .tahajud-time {
        font-size: clamp(56px, 9vw, 130px);
        font-weight: 700;
        line-height: 1;
        letter-spacing: 0.03em;
        background: linear-gradient(
            135deg,
            var(--text-primary) 0%,
            var(--text-muted) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .tahajud-sub {
        font-size: clamp(11px, 1vw, 16px);
        color: var(--text-muted);
        margin-top: 6px;
    }

    .tahajud-countdown {
        margin-top: 12px;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 16px 32px;
    }

    .tahajud-countdown-label {
        font-size: clamp(9px, 0.8vw, 12px);
        color: var(--text-muted);
        letter-spacing: 0.15em;
        font-weight: 600;
    }

    .tahajud-countdown-val {
        font-size: clamp(28px, 3.5vw, 52px);
        font-weight: 700;
        color: var(--accent-primary);
        text-shadow: 0 0 20px var(--prayer-active-glow);
    }

    .tahajud-masjid {
        font-size: clamp(12px, 1.1vw, 17px);
        color: var(--text-muted);
        margin-top: 8px;
    }

    .tv-wrap {
        width: 100vw;
        height: 100vh;
        background: var(--bg-primary);
        font-family: var(--font-body);
        position: relative;
        overflow: hidden;
        color: var(--text-primary);
    }

    .tv-wrap--mood .main-body {
        bottom: 0;
    }
    /* .running-bar disembunyikan via :global di RunningBar.svelte */
    .tv-wrap--mood .sound-unlock-btn {
        display: none;
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

    /* HEADER */
    .header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 10%;
        display: flex;
        align-items: center;
        padding: 1.2% 2.5% 0 2%;
        background: var(--header-bg);
    }

    .masjid-logo-area {
        display: flex;
        align-items: center;
        gap: 1.2%;
        flex: 1;
    }

    .masjid-logo {
        width: 8%;
        aspect-ratio: 1;
        background: var(--border-accent);
        border: 1.5px solid var(--prayer-active-border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(24px, 4.5vw, 86px);
        margin-top: 3%;
    }

    .masjid-logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
    }

    .masjid-name-block {
        margin-top: 2%;
    }

    .masjid-name {
        font-family: var(--font-heading), serif;
        font-size: clamp(18px, 4.2vw, 56px);
        font-weight: 700;
        color: var(--accent-primary);
        letter-spacing: 0.05em;
    }

    .masjid-loc {
        font-size: clamp(11px, 2.5vw, 32px);
        color: var(--text-secondary);
        margin-top: 2px;
        letter-spacing: 0.08em;
    }

    .header-right {
        text-align: right;
    }

    .header-time {
        font-size: clamp(28px, 8.6vw, 144px);
        font-weight: 700;
        color: var(--accent-primary);
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
    }

    .header-tz {
        font-size: 0.35em;
        font-weight: 600;
        color: var(--text-muted);
        vertical-align: super;
        margin-left: 3px;
    }

    /* MAIN BODY */
    .main-body {
        position: absolute;
        top: calc(13% + 2px);
        bottom: 8%;
        left: 0;
        right: 0;
        display: flex;
        align-items: stretch;
    }

    .sound-unlock-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 100;
        background: var(--border-accent);
        border: 1px solid var(--accent-muted);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        font-size: 16px;
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

    /* Responsive */
    @media (max-width: 900px) {
        .main-body {
            flex-direction: column;
        }
    }
</style>
