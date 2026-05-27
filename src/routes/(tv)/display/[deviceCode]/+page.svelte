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
    import "$lib/styles/display-layout-fix.css";
    import "$lib/styles/display-responsive-1366.css";
    import "$lib/styles/display-hd-1366.css";
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
    // `now` di-update tiap detik oleh updateClock() dan dibaca dari
    // prayerInterval. Pakai $state supaya konsisten dengan model reaktif Svelte
    // dan bebas warning lint.
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
    //
    // Anti-stuck strategy:
    // 1. AbortController dengan timeout 12 detik supaya request tidak
    //    menggantung tak terbatas saat server lambat / koneksi mati.
    // 2. Guard `inflight` mencegah tumpukan fetch saat polling lebih cepat
    //    dari respons (interval 15s, timeout 12s → maks 1 request berjalan).
    // 3. Setelah berhasil, `error` di-reset ke null supaya layar error
    //    countdown tidak terus reload halaman.
    // 4. Jika sudah pernah ada payload sebelumnya, kegagalan transient
    //    tidak memunculkan error screen — cukup log dan biarkan UI tetap
    //    menampilkan data lama. Error screen hanya muncul saat initial load.
    let inflight: AbortController | null = null;

    async function fetchData() {
        if (inflight) return; // ada request berjalan, lewati siklus ini
        const ac = new AbortController();
        inflight = ac;
        const timeoutId = setTimeout(() => ac.abort(), 12_000);
        try {
            const res = await fetch(
                `/api/v1/display/${data.device.deviceCode}`,
                { signal: ac.signal, cache: "no-store" },
            );
            const json = await res.json();
            if (json.ok) {
                payload = json.data;
                error = null; // sukses → bersihkan flag error
            } else if (!payload) {
                error = json.message ?? "Gagal mengambil data";
            } else {
                console.warn(
                    "[display] fetch !ok, keep stale payload:",
                    json.message,
                );
            }
        } catch (e: any) {
            const aborted = e?.name === "AbortError";
            if (aborted) {
                console.warn("[display] fetch dibatalkan (timeout)");
            } else if (!payload) {
                error = "Gagal mengambil data";
            } else {
                console.warn("[display] fetch gagal, keep stale payload:", e);
            }
        } finally {
            clearTimeout(timeoutId);
            inflight = null;
            loading = false;
        }
    }

    onMount(() => {
        initAudio();
        fetchData();

        // ── Heartbeat watchdog ─────────────────────────────────
        // Deteksi otomatis jika halaman "membeku" (clock tidak update / paint
        // tidak terjadi). Akar penyebab bisa apa saja: GPU saturasi, browser
        // bug, OS swap, dll. Watchdog ini reload halaman begitu deteksi
        // anomali, jadi TV self-recover tanpa intervensi manual.
        //
        // Dua heartbeat dipantau:
        //   - tickHeartbeat: di-update tiap clockInterval (1s).
        //     Kalau setInterval tidak fire >30s = main thread / event loop stuck.
        //   - frameHeartbeat: di-update tiap requestAnimationFrame (~16ms).
        //     Kalau rAF tidak fire >60s = rendering pipeline stuck (compositor).
        //
        // Saat document hidden, browser sengaja throttle interval & rAF, jadi
        // watchdog skip pengecekan. Setelah balik visible, baseline di-reset.
        let lastTickAt = Date.now();
        let lastFrameAt = Date.now();
        let rafId = 0;
        const rafBeat = () => {
            lastFrameAt = Date.now();
            rafId = requestAnimationFrame(rafBeat);
        };
        rafId = requestAnimationFrame(rafBeat);

        const clockInterval = setInterval(() => {
            updateClock();
            lastTickAt = Date.now();
        }, 1000);
        updateClock();

        updateHijriyah();
        const hijriInterval = setInterval(updateHijriyah, 3600000);

        const prayerInterval = setInterval(() => {
            if (payload) updatePrayerState(payload, now);
        }, 1000);

        // Slide & jumbotron tidak dirender saat screensaver → skip kerjanya
        // supaya tidak ada DOM update sia-sia.
        const slideInterval = setInterval(() => {
            if (prayer.screensaver) return;
            rotateSlide();
        }, 7000);

        const jumbotronInterval = setInterval(() => {
            if (prayer.screensaver) return;
            rotateJumbotron();
        }, 10000);

        // Saat screensaver aktif (bisa berjam-jam tanpa perubahan), turunkan
        // frekuensi fetch dari 15s ke 60s. Counter dipakai supaya tidak perlu
        // teardown/setup interval saat state berubah.
        let dataTickCounter = 0;
        const dataInterval = setInterval(() => {
            dataTickCounter += 1;
            if (prayer.screensaver && dataTickCounter % 4 !== 0) return;
            fetchData();
        }, 15000);

        // Safety net reload tiap 6 jam.
        // Memori JS sudah ditangani, tapi GPU/compositor memory di TV/Smart
        // browser bisa tetap leak (di luar kontrol kita). Reload ini reset
        // semua context grafis dengan biaya ≤1 detik downtime.
        const reloadInterval = setInterval(
            () => {
                window.location.reload();
            },
            6 * 60 * 60 * 1000,
        );

        // Watchdog: cek heartbeat tiap 10 detik.
        const TICK_DEAD_MS = 30_000;
        const FRAME_DEAD_MS = 60_000;
        const TICK_WARN_MS = 10_000;
        const watchdogInterval = setInterval(() => {
            // Browser throttle saat tab background — tidak valid untuk dicek.
            if (
                typeof document !== "undefined" &&
                document.visibilityState !== "visible"
            ) {
                return;
            }
            const tickGap = Date.now() - lastTickAt;
            const frameGap = Date.now() - lastFrameAt;

            if (tickGap > TICK_WARN_MS && tickGap <= TICK_DEAD_MS) {
                console.warn("[watchdog] clock lag", tickGap, "ms");
            }
            if (tickGap > TICK_DEAD_MS) {
                console.error(
                    "[watchdog] clock stale",
                    tickGap,
                    "ms — reloading",
                );
                window.location.reload();
                return;
            }
            if (frameGap > FRAME_DEAD_MS) {
                console.error(
                    "[watchdog] rAF stale",
                    frameGap,
                    "ms — reloading",
                );
                window.location.reload();
            }
        }, 10_000);

        const onVisible = () => {
            if (document.visibilityState === "visible") {
                // Reset baseline supaya tidak false-positive setelah tab
                // sempat di-background lama.
                lastTickAt = Date.now();
                lastFrameAt = Date.now();
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
            clearInterval(reloadInterval);
            clearInterval(watchdogInterval);
            if (rafId) cancelAnimationFrame(rafId);
            document.removeEventListener("visibilitychange", onVisible);
            // Pastikan fetch in-flight ikut dibatalkan saat halaman diunmount.
            inflight?.abort();
            inflight = null;
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
                <!-- Kolom Kiri: identitas masjid + waktu -->
                <div class="screensaver-col-left">
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
                    <div class="screensaver-sub">Mode hemat energi aktif</div>
                </div>

                <!-- Divider -->
                <div class="screensaver-divider"></div>

                <!-- Kolom Kanan: card sholat berikutnya -->
                <div class="screensaver-col-right">
                    <div class="screensaver-next-prayer">
                        <div class="screensaver-next-label">
                            SHOLAT BERIKUTNYA
                        </div>
                        <div class="screensaver-next-name">
                            {prayer.nextPrayerName}
                        </div>
                        <div class="screensaver-next-time">
                            {prayer.nextPrayerTime}
                        </div>
                        {#if prayer.iqamahTime}
                            <div class="screensaver-next-iqamah">
                                Iqamah {prayer.iqamahTime}
                            </div>
                        {/if}
                        <div class="screensaver-next-countdown">
                            <span class="screensaver-next-cd-icon">⏳</span>
                            {prayer.countdown}
                        </div>
                    </div>
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
            class:no-running={!payload?.runningTexts?.length}
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
                    {liveDate}
                    {hijriyahDate}
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
            {#if payload.runningTexts?.length}
                <RunningBar
                    content={getRunningTextContent(payload.runningTexts)}
                />
            {/if}

            <!-- MOOD OVERLAY — sembunyi saat flash aktif biar gak bertumpuk -->
            {#if !prayer.flash}
                <MoodOverlay
                    mood={prayer.mood}
                    moodPrayerName={prayer.moodPrayerName}
                    moodPrayerKey={prayer.moodPrayerKey}
                    countdown={prayer.moodCountdown}
                    countdownLabel={prayer.moodCountdownLabel}
                    isJumat={getWIBParts(now, tz).day === 5}
                />
            {/if}

            <!-- FLASH OVERLAY -->
            {#if prayer.flash}
                <div class="flash-overlay flash-overlay--{prayer.flashType}">
                    {#if prayer.flashType === "adzan"}
                        <div class="flash-title">ALLAHU AKBAR</div>
                        <div class="flash-subtitle">WAKTU ADZAN TELAH TIBA</div>
                        <div class="flash-arabic">اللهُ أَكْبَر</div>
                    {:else}
                        <div class="flash-title">IQAMAH</div>
                        <div class="flash-subtitle">SEGERA TEGAKKAN SHAF</div>
                        <div class="flash-arabic">قَدْ قَامَتِ الصَّلَاة</div>
                    {/if}
                </div>
            {/if}
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
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0;
        animation: screensaverFade 2s ease-out;
        width: 100%;
        max-width: 1200px;
        padding: 0 48px;
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
        margin-bottom: 4px;
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
        font-size: clamp(18px, 3vw, 96px);
        font-weight: 600;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
    }

    .screensaver-time {
        font-size: clamp(48px, 10vw, 250px);
        font-weight: 700;
        line-height: 1;
        letter-spacing: 0.02em;
        color: var(--text-primary);
        /* text-shadow disederhanakan: blur kecil agar repaint tiap detik
           (karena seconds berubah) tidak terlalu mahal di GPU. */
        text-shadow: 0 0 8px var(--accent-muted);
        margin-top: 4px;
        /* Batasi area repaint hanya elemen ini, bukan parent. */
        contain: layout paint style;
        font-variant-numeric: tabular-nums;
    }

    .screensaver-date {
        font-size: clamp(14px, 4vw, 48px);
        color: var(--text-muted);
    }

    .screensaver-hijri {
        font-size: clamp(12px, 3vw, 54px);
        color: var(--accent-muted);
        margin-top: 4px;
    }

    .screensaver-sub {
        font-size: clamp(10px, 0.9vw, 38px);
        color: var(--text-muted);
        text-align: center;
        width: 100%;
        padding: 0 24px;
        margin-top: 12px;
    }

    /* Column Layouts */
    .screensaver-col-left {
        flex: 1.2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 8px;
    }

    .screensaver-divider {
        width: 1px;
        height: 400px;
        background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0) 0%,
            var(--border-accent, rgba(200, 168, 75, 0.25)) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        margin: 0 60px;
    }

    .screensaver-col-right {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
    }

    /* SCREENSAVER — Next Prayer Card */
    .screensaver-next-prayer {
        padding: 40px 48px;
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(255, 255, 255, 0.02) 100%
        );
        border: 1px solid var(--border-accent, rgba(200, 168, 75, 0.25));
        border-radius: var(--border-radius, 24px);
        /* backdrop-filter dihapus: di TV/long-running, blur di belakang elemen
           yang sering repaint (kartu animation + countdown tiap detik) menyebabkan
           GPU memory tumbuh terus dan main thread starve. */
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        /* Animasi pulse memakai opacity (compositor-only) supaya tidak
           memicu repaint penuh kartu. */
        animation: screensaverCardPulse 4s ease-in-out infinite;
        width: 100%;
        max-width: 420px;
        /* Tambahkan satu box-shadow statis sebagai pengganti animasi shadow. */
        box-shadow:
            0 0 24px rgba(200, 168, 75, 0.1),
            inset 0 0 24px rgba(200, 168, 75, 0.04);
        contain: layout paint style;
    }

    @keyframes screensaverCardPulse {
        0%,
        100% {
            opacity: 0.92;
        }
        50% {
            opacity: 1;
        }
    }

    .screensaver-next-label {
        font-size: clamp(8px, 0.7vw, 16px);
        font-weight: 600;
        letter-spacing: 0.2em;
        color: var(--accent-muted, #c8a84b);
        text-transform: uppercase;
    }

    .screensaver-next-name {
        font-family: var(--font-heading), serif;
        font-size: clamp(18px, 3.5vw, 52px);
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: 0.08em;
    }

    .screensaver-next-time {
        font-size: clamp(24px, 45.5vw, 82px);
        font-weight: 700;
        color: var(--accent-primary, #c8a84b);
        line-height: 1.1;
        /* text-shadow lebih ringan: nilai aslinya 12px blur radius pada teks 82px
           memicu paint mahal saat parent kartu di-animate. */
        text-shadow: 0 0 6px var(--accent-muted, rgba(200, 168, 75, 0.3));
        font-variant-numeric: tabular-nums;
        contain: layout paint style;
    }

    .screensaver-next-iqamah {
        font-size: clamp(10px, 1vw, 24px);
        color: var(--text-muted);
        font-weight: 500;
    }

    .screensaver-next-countdown {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: clamp(14px, 2vw, 38px);
        font-weight: 600;
        color: var(--text-secondary);
        font-variant-numeric: tabular-nums;
        margin-top: 4px;
        /* Countdown berubah tiap detik — isolasi paint scope-nya. */
        contain: layout paint style;
    }

    .screensaver-next-cd-icon {
        font-size: clamp(12px, 1.4vw, 28px);
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
        color: var(--text-primary);
        text-shadow: 0 0 20px var(--accent-muted);
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

    /* Flash layar saat adzan/iqamah bersamaan dengan beep */
    .flash-overlay {
        position: absolute;
        inset: 0;
        z-index: 999;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: clamp(8px, 1.5vh, 24px);
        animation: flashFade 0.6s ease-out forwards;
    }

    /* Adzan — flash kuning keemasan */
    .flash-overlay--adzan {
        background: radial-gradient(
            ellipse at center,
            rgba(255, 200, 50, 0.97) 0%,
            rgba(200, 130, 10, 0.95) 100%
        );
        animation: flashFadeAdzan 0.6s ease-out forwards;
    }

    /* Iqamah — flash hijau */
    .flash-overlay--iqamah {
        background: radial-gradient(
            ellipse at center,
            rgba(30, 180, 100, 0.97) 0%,
            rgba(10, 100, 50, 0.95) 100%
        );
        animation: flashFadeIqamah 0.6s ease-out forwards;
    }

    .flash-title {
        font-size: clamp(36px, 8vw, 120px);
        font-weight: 900;
        color: #fff;
        letter-spacing: 0.12em;
        text-shadow: 0 4px 32px rgba(0, 0, 0, 0.3);
        text-align: center;
        animation: flashTextSlide 0.6s ease-out forwards;
    }

    .flash-subtitle {
        font-size: clamp(16px, 3vw, 48px);
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        letter-spacing: 0.2em;
        text-align: center;
        animation: flashTextSlide 0.6s ease-out 0.05s forwards;
    }

    .flash-arabic {
        font-family: var(--font-arabic, "Noto Naskh Arabic", serif);
        font-size: clamp(28px, 6vw, 90px);
        color: rgba(255, 255, 255, 0.95);
        direction: rtl;
        text-align: center;
        text-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
        animation: flashTextSlide 0.6s ease-out 0.1s forwards;
    }

    @keyframes flashFadeAdzan {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        70% {
            opacity: 1;
            transform: scale(1.02);
        }
        100% {
            opacity: 0;
            transform: scale(1.04);
        }
    }

    @keyframes flashFadeIqamah {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        70% {
            opacity: 1;
            transform: scale(1.02);
        }
        100% {
            opacity: 0;
            transform: scale(1.04);
        }
    }

    @keyframes flashTextSlide {
        0% {
            transform: translateY(20px);
            opacity: 0;
        }
        100% {
            transform: translateY(0);
            opacity: 1;
        }
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
        height: 13%;
        display: flex;
        align-items: center;
        padding: 1.5% 2.5% 2% 2%;
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
        font-size: clamp(24px, 3vw, 82px);
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
        font-family: var(--font-heading, "Cinzel"), serif;
        font-size: clamp(12px, 3.2vw, 36px);
        font-weight: 700;
        color: var(--accent-primary);
        letter-spacing: 0.05em;
        line-height: 1.1;
    }

    .masjid-loc {
        font-size: clamp(8px, 1.2vw, 20px);
        color: var(--text-secondary);
        margin-top: 1px;
        letter-spacing: 0.08em;
    }

    .header-right {
        text-align: right;
    }

    .header-time {
        font-size: clamp(28px, 6.5vw, 144px);
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

    /* MAIN BODY — full height tanpa running bar */
    .no-running .main-body {
        bottom: 0;
    }

    .sound-unlock-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 100;
        background: var(--border-accent);
        border: 1px solid var(--accent-muted);
        border-radius: 50%;
        width: 26px;
        height: 26px;
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

    /* Responsive */
    @media (max-width: 900px) {
        .main-body {
            flex-direction: column;
        }
    }
</style>
