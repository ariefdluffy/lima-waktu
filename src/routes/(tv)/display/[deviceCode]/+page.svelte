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
    import {
        PRAYER_ORDER,
        PRAYER_LABELS,
        PRAYER_ICONS,
        DEFAULT_SLIDES,
        timeToMinutes,
        secondsToCountdown,
        toHijriyah,
    } from "$lib/utils/prayer";
    import {
        getTZOffsetHours,
        getTZParts,
        getTZLabel,
        formatTimeTZ,
        formatDateTZ,
    } from "$lib/utils/timezone";

    let { data }: { data: PageData } = $props();

    let payload: DisplayPayload | null = $state(null);
    let theme = $derived.by(() => payload?.theme ?? null);
    let loading = $state(true);
    let error: string | null = $state(null);

    // Time state
    let now = $state(new Date());
    let liveClock = $state("");
    let liveDate = $state("");

    // Countdown state
    let nextPrayerName = $state("");
    let nextPrayerTime = $state("");
    let countdown = $state("00 : 00 : 00");
    let countdownProgress = $state(0);
    let iqamahTime = $state("");
    let activePrayerIndex = $state(-1);

    // Slide state
    let currentSlide = $state(0);
    let slideFading = $state(false);

    // Beep state
    let lastTriggeredPrayer = $state("");

    // Mood: normal | iqamah | khusuk
    let mood = $state<"normal" | "iqamah" | "khusuk">("normal");
    let moodPrayerName = $state("");

    // Hijriyah
    let hijriyahDate = $state("");

    // Cuaca
    let weatherTemp = $state<number | null>(null);
    let weatherCode = $state<number | null>(null);
    let weatherLoading = $state(true);
    let weatherFetched = false;

    // Screen saver (mode hemat)
    let screensaver = $state(false);

    // Mode Tahajud (1 jam sebelum Subuh)
    let tahajudMode = $state(false);

    // Jumbotron rotate
    let currentJumbotron = $state(0);

    // Konstanta prayer diimport dari $lib/utils/prayer

    function themeCssVars(palette: Record<string, string> | null): string {
        if (!palette) return "";
        return Object.entries(palette)
            .map(
                ([k, v]) =>
                    `--${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}: ${v}`,
            )
            .join("; ");
    }

    // Timezone offset & label dari payload masjid
    let tzLabel = $derived.by(() => {
        const tz = payload?.masjid?.timezone ?? "Asia/Makassar";
        return getTZLabel(tz);
    });
    function getTZOffset(): number {
        return getTZOffsetHours(payload?.masjid?.timezone ?? "Asia/Makassar");
    }

    function getWIBParts(date: Date) {
        return getTZParts(date, getTZOffset());
    }

    function formatTime(date: Date): string {
        return formatTimeTZ(date, getTZOffset());
    }

    function formatDate(date: Date): string {
        return formatDateTZ(date, getTZOffset());
    }

    // ── Hijriyah ──────────────────────────────────────────────────────────
    function updateHijriyah() {
        const offset = payload?.masjid?.hijriOffset ?? 0;
        const { year, month, date } = getWIBParts(new Date());
        hijriyahDate = toHijriyah(year, month + 1, date, offset);
    }

    // ── Cuaca ─────────────────────────────────────────────────────────────
    async function fetchWeather(lat: string, lon: string) {
        try {
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto&forecast_days=1`,
            );
            const json = await res.json();
            weatherTemp = Math.round(json.current.temperature_2m);
            weatherCode = json.current.weathercode;
        } catch {
            weatherTemp = null;
            weatherCode = null;
        } finally {
            weatherLoading = false;
        }
    }

    // ── Jumbotron rotate ──────────────────────────────────────────────────
    function rotateJumbotron() {
        if (!payload?.jumbotrons?.length) return;
        currentJumbotron = (currentJumbotron + 1) % payload.jumbotrons.length;
    }

    // timeToMinutes diimport dari $lib/utils/prayer

    function getCurrentTimeMinutes(): number {
        const { hours, minutes } = getWIBParts(now);
        return hours * 60 + minutes;
    }

    function updateClock() {
        now = new Date();
        liveClock = formatTime(now);
        liveDate = formatDate(now);
    }

    function playAdzanBeep() {
        try {
            const ctx = new (
                window.AudioContext || (window as any).webkitAudioContext
            )();
            const sequence = [
                { freq: 880, duration: 0.15, start: 0.0 },
                { freq: 880, duration: 0.15, start: 0.25 },
                { freq: 1100, duration: 0.15, start: 0.5 },
                { freq: 1100, duration: 0.6, start: 0.8 },
            ];
            sequence.forEach(({ freq, duration, start }) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, ctx.currentTime + start);
                gain.gain.linearRampToValueAtTime(
                    0.4,
                    ctx.currentTime + start + 0.01,
                );
                gain.gain.linearRampToValueAtTime(
                    0,
                    ctx.currentTime + start + duration,
                );
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + duration + 0.05);
            });
            setTimeout(() => ctx.close(), 3000);
        } catch (e) {
            console.warn("Web Audio API tidak tersedia:", e);
        }
    }

    function updatePrayerState() {
        if (!payload?.schedule?.resolved) return;

        const resolved = payload.schedule.resolved;
        const currentMinutes = getCurrentTimeMinutes();

        // Find next prayer
        let found = false;
        let nextIdx = -1;

        for (let i = 0; i < PRAYER_ORDER.length; i++) {
            const prayer = PRAYER_ORDER[i];
            const prayerMinutes = timeToMinutes(resolved[prayer]);

            if (prayerMinutes > currentMinutes) {
                nextIdx = i;
                found = true;
                break;
            }
        }

        // If no prayer found today, next is tomorrow's Subuh
        if (!found) {
            nextIdx = 0;
        }

        activePrayerIndex = nextIdx;
        const nextPrayer = PRAYER_ORDER[nextIdx];
        nextPrayerName = PRAYER_LABELS[nextPrayer];
        nextPrayerTime = resolved[nextPrayer];

        // Iqamah time
        const iqamahData = payload.schedule.iqamah[nextPrayer];
        iqamahTime = iqamahData?.enabled ? iqamahData.time : "";

        // Countdown — hitung detik secara akurat dari waktu sekarang (WIB)
        const { hours: nowH, minutes: nowM, seconds: nowS } = getWIBParts(now);
        const currentTotalSeconds = nowH * 3600 + nowM * 60 + nowS;

        if (found) {
            const targetTotalSeconds = timeToMinutes(resolved[nextPrayer]) * 60;
            let diffSeconds = targetTotalSeconds - currentTotalSeconds;
            if (diffSeconds < 0) diffSeconds += 86400;

            const hh = Math.floor(diffSeconds / 3600);
            const mm = Math.floor((diffSeconds % 3600) / 60);
            const ss = diffSeconds % 60;
            countdown = `${String(hh).padStart(2, "0")} : ${String(mm).padStart(2, "0")} : ${String(ss).padStart(2, "0")}`;

            // Trigger beep saat adzan tiba
            if (diffSeconds === 0 && lastTriggeredPrayer !== nextPrayer) {
                lastTriggeredPrayer = nextPrayer;
                playAdzanBeep();
            }

            // Countdown progress: hitung persentase waktu berlalu sejak sholat sebelumnya
            countdownProgress = calcCountdownProgress(
                currentMinutes,
                resolved,
                nextIdx,
            );
        } else {
            // After Isya, countdown to tomorrow's Subuh
            const subuhTotalSeconds = timeToMinutes(resolved.subuh) * 60;
            let diffSeconds = 86400 - currentTotalSeconds + subuhTotalSeconds;
            const hh = Math.floor(diffSeconds / 3600);
            const mm = Math.floor((diffSeconds % 3600) / 60);
            const ss = diffSeconds % 60;
            countdown = `${String(hh).padStart(2, "0")} : ${String(mm).padStart(2, "0")} : ${String(ss).padStart(2, "0")}`;
            countdownProgress = calcCountdownProgressAfterIsya(
                currentMinutes,
                resolved,
            );
        }

        // --- Mode Iqamah & Khusuk Detection ---
        let newMood: "normal" | "iqamah" | "khusuk" = "normal";
        let newMoodPrayerName = "";

        // Cari sholat yg adzan-nya sudah lewat (current/active prayer)
        let currentPrayerIdx = -1;
        for (let i = PRAYER_ORDER.length - 1; i >= 0; i--) {
            const p = PRAYER_ORDER[i];
            const pMin = timeToMinutes(resolved[p]);
            if (pMin <= currentMinutes) {
                currentPrayerIdx = i;
                break;
            }
        }

        if (currentPrayerIdx >= 0) {
            const cp = PRAYER_ORDER[currentPrayerIdx];
            const adzanMin = timeToMinutes(resolved[cp]);
            const iqData = payload.schedule.iqamah[cp];
            const KHUSUK_DURATION = 10; // menit setelah adzan

            if (iqData?.enabled && iqData?.time) {
                const iqamahMin = timeToMinutes(iqData.time);
                if (
                    currentMinutes >= iqamahMin &&
                    currentMinutes < iqamahMin + 1
                ) {
                    newMood = "iqamah";
                    newMoodPrayerName = PRAYER_LABELS[cp];
                } else if (
                    currentMinutes >= iqamahMin + 3 &&
                    currentMinutes < adzanMin + KHUSUK_DURATION
                ) {
                    newMood = "khusuk";
                    newMoodPrayerName = PRAYER_LABELS[cp];
                }
            } else {
                // Jika tidak ada iqamah: mode khusuk langsung setelah adzan
                if (
                    currentMinutes >= adzanMin &&
                    currentMinutes < adzanMin + KHUSUK_DURATION
                ) {
                    newMood = "khusuk";
                    newMoodPrayerName = PRAYER_LABELS[cp];
                }
            }
        }

        mood = newMood;
        moodPrayerName = newMoodPrayerName;

        // --- Screen Saver & Tahajud Mode ---
        const isyaMin = timeToMinutes(resolved.isya);
        const subuhMin = timeToMinutes(resolved.subuh);
        const SCREENSAVER_DELAY = 120; // menit setelah Isya
        const SCREENSAVER_WAKE = 60; // menit sebelum Subuh
        const dalamJendelaScreensaver =
            currentMinutes >= isyaMin + SCREENSAVER_DELAY ||
            currentMinutes < subuhMin - SCREENSAVER_WAKE;
        const dalamJendelaTahajud =
            currentMinutes >= subuhMin - SCREENSAVER_WAKE &&
            currentMinutes < subuhMin;
        screensaver = dalamJendelaScreensaver;
        tahajudMode = dalamJendelaTahajud;
    }

    function rotateSlide() {
        slideFading = true;
        setTimeout(() => {
            const slides = payload?.slides ?? [];
            const total = Math.max(slides.length, DEFAULT_SLIDES.length);
            currentSlide = (currentSlide + 1) % total;
            slideFading = false;
        }, 500);
    }

    // ── Countdown Progress Helpers ──────────────────────────────────────
    function calcCountdownProgress(
        currentMinutes: number,
        resolved: Record<string, string>,
        nextIdx: number,
    ): number {
        let prevIdx = nextIdx - 1;
        if (prevIdx < 0) prevIdx = PRAYER_ORDER.length - 1;
        const prevPrayer = PRAYER_ORDER[prevIdx];
        const nextPrayer = PRAYER_ORDER[nextIdx];
        const prevMin = timeToMinutes(resolved[prevPrayer]);
        let nextMin = timeToMinutes(resolved[nextPrayer]);
        if (nextMin <= prevMin) nextMin += 1440;
        const currentAdjusted =
            currentMinutes < prevMin ? currentMinutes + 1440 : currentMinutes;
        const total = nextMin - prevMin;
        const elapsed = currentAdjusted - prevMin;
        return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    }

    function calcCountdownProgressAfterIsya(
        currentMinutes: number,
        resolved: Record<string, string>,
    ): number {
        const isyaMin = timeToMinutes(resolved.isya);
        const subuhMin = timeToMinutes(resolved.subuh);
        const total = 1440 - isyaMin + subuhMin;
        const elapsed =
            currentMinutes >= isyaMin
                ? currentMinutes - isyaMin
                : 1440 - isyaMin + currentMinutes;
        return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    }

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
        fetchData();

        // Clock update every second
        const clockInterval = setInterval(updateClock, 1000);
        updateClock();

        // Hijriyah update
        updateHijriyah();
        const hijriInterval = setInterval(updateHijriyah, 3600000); // refresh tiap jam

        // Prayer state update every second
        const prayerInterval = setInterval(updatePrayerState, 1000);

        // Slide rotation every 7 seconds
        const slideInterval = setInterval(rotateSlide, 7000);

        // Jumbotron rotate every 10 seconds
        const jumbotronInterval = setInterval(rotateJumbotron, 10000);

        // Refresh data every 15 seconds — biar layout & konten cepat sinkron
        const dataInterval = setInterval(fetchData, 15000);

        // Visibility change — refresh langsung saat tab display aktif lagi
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

    $effect(() => {
        if (payload) {
            updatePrayerState();
            // Fetch cuaca saat payload tersedia
            if (payload.masjid?.latitude && payload.masjid?.longitude) {
                fetchWeather(payload.masjid.latitude, payload.masjid.longitude);
            } else {
                weatherLoading = false;
            }
        }
    });

    function getLocationText(): string {
        if (!payload?.masjid) return "";
        const parts = [
            payload.masjid.address,
            payload.masjid.city,
            payload.masjid.province,
        ].filter(Boolean);
        return parts.join(", ");
    }

    function getYoutubeEmbedUrl(url: string): string {
        // Support format: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/live/ID
        let videoId = "";
        try {
            const u = new URL(url);
            if (u.hostname === "youtu.be") {
                videoId = u.pathname.slice(1);
            } else if (u.hostname.includes("youtube.com")) {
                videoId =
                    u.searchParams.get("v") ??
                    u.pathname.split("/").pop() ??
                    "";
            }
        } catch {
            videoId = url;
        }
        // autoplay=1 + mute=1 wajib agar browser mengizinkan autoplay
        // enablejsapi=1 untuk kontrol via JS jika diperlukan
        // playsinline=1 agar tidak fullscreen otomatis di mobile
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&enablejsapi=1&playsinline=1&iv_load_policy=3`;
    }

    function getRunningTextContent(): string {
        if (!payload?.runningTexts?.length) {
            return "Selamat datang di Masjid. Mohon menonaktifkan nada dering ponsel.";
        }
        return payload.runningTexts.map((rt) => rt.content).join("  |  ");
    }

    function getCurrentSlideContent() {
        const slides = payload?.slides ?? [];
        if (slides.length === 0) {
            return DEFAULT_SLIDES[currentSlide % DEFAULT_SLIDES.length];
        }
        const slide = slides[currentSlide % slides.length];
        return slide?.fileUrl
            ? null
            : DEFAULT_SLIDES[currentSlide % DEFAULT_SLIDES.length];
    }
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
    <div class="display-error-screen">
        <div class="display-error-card">
            <div class="display-error-icon">⚠️</div>
            <div class="display-error-title">Gangguan Data</div>
            <p class="display-error-msg">{error}</p>
            <div class="display-error-hint">
                <p>
                    📋 Coba refresh halaman. Jika masih muncul, hubungi pengurus
                    masjid.
                </p>
            </div>
            <button
                class="display-error-btn"
                onclick={() => window.location.reload()}
            >
                🔄 Refresh
            </button>
        </div>
    </div>
{:else if payload}
    {#if screensaver}
        <div class="screensaver">
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
                    Display dalam mode hemat • Akan aktif kembali saat Subuh
                </div>
            </div>
        </div>
    {:else if tahajudMode}
        <div class="tahajud">
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
                    <div class="tahajud-countdown-val">{countdown}</div>
                </div>
                <div class="tahajud-masjid">{payload.masjid.name}</div>
            </div>
        </div>
    {:else}
        <div
            class="tv-wrap"
            style={themeCssVars(payload?.theme?.palette ?? null)}
            class:tv-wrap--mood={mood !== "normal"}
        >
            <div class="bg-stars"></div>
            <div class="bg-grid"></div>
            <button
                class="sound-unlock-btn"
                onclick={() => {
                    try {
                        new (
                            window.AudioContext ||
                            (window as any).webkitAudioContext
                        )();
                    } catch (e) {}
                }}
                title="Aktifkan suara adzan">🔔</button
            >
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
                        <div class="masjid-loc">{getLocationText()}</div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="header-time">
                        {liveClock}
                        <span class="header-tz">{tzLabel}</span>
                    </div>
                    <div class="header-date">{liveDate}</div>
                </div>
            </header>

            <!-- MAIN BODY -->
            {#if payload.device.layoutMode === "youtube" && payload.youtubeItems.length > 0}
                <!-- YOUTUBE LAYOUT -->
                <YoutubeLayout
                    {payload}
                    {nextPrayerName}
                    {nextPrayerTime}
                    {countdown}
                    {countdownProgress}
                    {iqamahTime}
                    {activePrayerIndex}
                />
            {:else}
                <!-- DEFAULT LAYOUT -->
                <main class="main-body">
                    <!-- LEFT PANEL -->
                    <LeftPanel
                        {nextPrayerName}
                        {nextPrayerTime}
                        {countdown}
                        {countdownProgress}
                        {iqamahTime}
                    />

                    <!-- CENTER PANEL -->
                    <CenterPanel
                        {payload}
                        {activePrayerIndex}
                        {currentSlide}
                        {slideFading}
                    />

                    <!-- RIGHT PANEL -->
                    <RightPanel
                        {payload}
                        {hijriyahDate}
                        {weatherTemp}
                        {weatherCode}
                        {weatherLoading}
                        {currentJumbotron}
                        isJumat={getWIBParts(now).day === 5}
                    />
                </main>
            {/if}

            <!-- RUNNING TEXT -->
            <RunningBar content={getRunningTextContent()} />

            <!-- MOOD OVERLAY -->
            <MoodOverlay {mood} {moodPrayerName} />
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

    /* SCREENSAVER (MODE HEMAT) */
    .screensaver {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
            135deg,
            #05080f 0%,
            var(--bg-primary) 30%,
            #0d1520 60%,
            #080c18 100%
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
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 50%;
        overflow: hidden;
    }

    .screensaver-logo-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 50%;
    }

    .screensaver-masjid-name {
        font-family: var(--font-heading), serif;
        font-size: clamp(18px, 2.5vw, 36px);
        font-weight: 600;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
    }

    .screensaver-time {
        font-size: clamp(48px, 8vw, 120px);
        font-weight: 700;
        line-height: 1;
        letter-spacing: 0.02em;
        background: linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-top: 8px;
    }

    .screensaver-date {
        font-size: clamp(14px, 1.6vw, 24px);
        color: var(--text-muted);
    }

    .screensaver-hijri {
        font-size: clamp(12px, 1.3vw, 18px);
        color: var(--accent-muted);
        margin-top: 4px;
    }

    .screensaver-sub {
        position: absolute;
        bottom: 40px;
        font-size: clamp(10px, 0.9vw, 14px);
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
            #05080f 0%,
            var(--bg-primary) 40%,
            #0f1a2e 70%,
            #080c18 100%
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
        background: linear-gradient(135deg, #e2e8f0 0%, #64748b 100%);
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
        color: #fbbf24;
        text-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
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
        background: var(--bg-stars);
    }

    .bg-grid {
        position: absolute;
        inset: 0;
        background-image: var(--bg-grid);
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
        top: 2px;
        left: 0;
        right: 0;
        height: 13%;
        display: flex;
        align-items: center;
        padding: 0 2.5% 0 2%;
        background: var(--header-bg);
    }

    .masjid-logo-area {
        display: flex;
        align-items: center;
        gap: 1.2%;
        flex: 1;
    }

    .masjid-logo {
        width: 6%;
        aspect-ratio: 1;
        background: var(--border-accent);
        border: 1.5px solid var(--prayer-active-border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(16px, 2vw, 28px);
    }

    .masjid-logo-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 50%;
    }

    .masjid-name {
        font-family: var(--font-heading), serif;
        font-size: clamp(18px, 2.2vw, 36px);
        font-weight: 700;
        color: var(--accent-primary);
        letter-spacing: 0.05em;
    }

    .masjid-loc {
        font-size: clamp(11px, 1.2vw, 20px);
        color: var(--text-secondary);
        margin-top: 2px;
        letter-spacing: 0.08em;
    }

    .header-right {
        text-align: right;
    }

    .header-time {
        font-size: clamp(28px, 3.6vw, 74px);
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
        margin-left: 6px;
    }

    .header-date {
        font-size: clamp(13px, 1.5vw, 44px);
        color: var(--text-secondary);
        margin-top: 1px;
    }

    /* MAIN BODY */
    .main-body {
        position: absolute;
        top: calc(14% + 3px);
        bottom: 12%;
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
        transition: background 0.2s;
    }
    .sound-unlock-btn:hover {
        background: var(--prayer-active-bg);
    }

    /* Responsive */
    @media (max-width: 900px) {
        .main-body {
            flex-direction: column;
        }
    }
</style>
