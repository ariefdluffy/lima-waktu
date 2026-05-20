<script lang="ts">
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import type { DisplayPayload } from "$lib/types/display";

    let { data }: { data: PageData } = $props();

    let payload: DisplayPayload | null = $state(null);
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
    let iqamahTime = $state("");
    let activePrayerIndex = $state(-1);

    // Slide state
    let currentSlide = $state(0);

    const PRAYER_ORDER = [
        "subuh",
        "dzuhur",
        "ashar",
        "maghrib",
        "isya",
    ] as const;
    const PRAYER_LABELS: Record<string, string> = {
        subuh: "SUBUH",
        dzuhur: "DZUHUR",
        ashar: "ASHAR",
        maghrib: "MAGHRIB",
        isya: "ISYA",
    };
    const PRAYER_ICONS: Record<string, string> = {
        subuh: "🌙",
        dzuhur: "☀️",
        ashar: "🌤️",
        maghrib: "🌅",
        isya: "🌃",
    };

    const DAYS = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
    ];
    const MONTHS = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];

    // Default slides (ayat)
    const DEFAULT_SLIDES = [
        {
            arabic: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ",
            trans: '"Dan dirikanlah shalat, tunaikanlah zakat, dan rukuklah beserta orang-orang yang rukuk."',
            src: "QS. Al-Baqarah: 43",
        },
        {
            arabic: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
            trans: '"Sesungguhnya shalat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman."',
            src: "QS. An-Nisa: 103",
        },
        {
            arabic: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ",
            trans: '"Peliharalah semua shalat dan shalat wustha. Dan laksanakanlah (shalat) karena Allah dengan khusyuk."',
            src: "QS. Al-Baqarah: 238",
        },
    ];

    function formatTime(date: Date): string {
        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
    }

    function formatDate(date: Date): string {
        const day = DAYS[date.getDay()];
        const d = date.getDate();
        const month = MONTHS[date.getMonth()];
        const year = date.getFullYear();
        return `${day}, ${d} ${month} ${year} M`;
    }

    function timeToMinutes(time: string): number {
        const [hh, mm] = time.split(":").map((v) => Number(v));
        return hh * 60 + mm;
    }

    function getCurrentTimeMinutes(): number {
        return now.getHours() * 60 + now.getMinutes();
    }

    function updateClock() {
        now = new Date();
        liveClock = formatTime(now);
        liveDate = formatDate(now);
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

        // Countdown
        if (found) {
            const targetMinutes = timeToMinutes(resolved[nextPrayer]);
            let diffMinutes = targetMinutes - currentMinutes;
            if (diffMinutes < 0) diffMinutes += 1440;

            const hh = Math.floor(diffMinutes / 60);
            const mm = diffMinutes % 60;
            const ss = 59 - now.getSeconds();
            countdown = `${String(hh).padStart(2, "0")} : ${String(mm).padStart(2, "0")} : ${String(ss).padStart(2, "0")}`;
        } else {
            // After Isya, countdown to tomorrow's Subuh
            const subuhMinutes = timeToMinutes(resolved.subuh);
            let diffMinutes = 1440 - currentMinutes + subuhMinutes;
            const hh = Math.floor(diffMinutes / 60);
            const mm = diffMinutes % 60;
            const ss = 59 - now.getSeconds();
            countdown = `${String(hh).padStart(2, "0")} : ${String(mm).padStart(2, "0")} : ${String(ss).padStart(2, "0")}`;
        }
    }

    function rotateSlide() {
        const slides = payload?.slides ?? [];
        const total = Math.max(slides.length, DEFAULT_SLIDES.length);
        currentSlide = (currentSlide + 1) % total;
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

        // Prayer state update every second
        const prayerInterval = setInterval(updatePrayerState, 1000);

        // Slide rotation every 7 seconds
        const slideInterval = setInterval(rotateSlide, 7000);

        // Refresh data every 60 seconds
        const dataInterval = setInterval(fetchData, 60000);

        return () => {
            clearInterval(clockInterval);
            clearInterval(prayerInterval);
            clearInterval(slideInterval);
            clearInterval(dataInterval);
        };
    });

    $effect(() => {
        if (payload) {
            updatePrayerState();
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
    <div class="error-screen">
        <p>Error: {error}</p>
    </div>
{:else if payload}
    <div class="tv-wrap">
        <div class="bg-stars"></div>
        <div class="bg-grid"></div>
        <div class="top-bar"></div>

        <!-- HEADER -->
        <header class="header">
            <div class="masjid-logo-area">
                <div class="masjid-logo">🕌</div>
                <div class="masjid-name-block">
                    <div class="masjid-name">{payload.masjid.name}</div>
                    <div class="masjid-loc">{getLocationText()}</div>
                </div>
            </div>
            <div class="header-right">
                <div class="header-time">{liveClock}</div>
                <div class="header-date">{liveDate}</div>
            </div>
        </header>

        <!-- MAIN BODY -->
        <main class="main-body">
            <!-- LEFT PANEL -->
            <aside class="left-panel">
                <div class="next-label">WAKTU BERIKUTNYA</div>
                <div class="next-prayer-name">{nextPrayerName}</div>
                <div class="next-prayer-time">{nextPrayerTime}</div>
                <div class="countdown-box">
                    <span class="countdown-label">MENUJU ADZAN</span>
                    <div class="countdown-val">{countdown}</div>
                </div>
                {#if iqamahTime}
                    <div class="iqamah-box">
                        <div class="iqamah-label">IQAMAH</div>
                        <div class="iqamah-val">{iqamahTime}</div>
                    </div>
                {/if}
            </aside>

            <!-- CENTER PANEL -->
            <section class="center-panel">
                <div class="prayer-grid">
                    {#each PRAYER_ORDER as prayer, idx}
                        <div
                            class="prayer-card"
                            class:active={idx === activePrayerIndex}
                        >
                            <div class="prayer-card-icon">
                                {PRAYER_ICONS[prayer]}
                            </div>
                            <div class="prayer-card-name">
                                {PRAYER_LABELS[prayer]}
                            </div>
                            <div class="prayer-card-time">
                                {payload.schedule.resolved?.[prayer] ?? "--:--"}
                            </div>
                            <div class="prayer-iqamah">
                                {#if payload.schedule.iqamah[prayer]?.enabled}
                                    Iqamah {payload.schedule.iqamah[prayer]
                                        .time}
                                {/if}
                            </div>
                            {#if idx === activePrayerIndex}
                                <div class="active-badge">BERIKUTNYA</div>
                            {/if}
                        </div>
                    {/each}
                </div>

                <div class="slide-area">
                    {#if payload.slides.length > 0 && payload.slides[currentSlide % payload.slides.length]?.fileUrl}
                        <img
                            src={payload.slides[
                                currentSlide % payload.slides.length
                            ].fileUrl}
                            alt={payload.slides[
                                currentSlide % payload.slides.length
                            ].title ?? "Slide"}
                            class="slide-image"
                        />
                    {:else}
                        {@const slide = getCurrentSlideContent()}
                        {#if slide}
                            <div class="slide-content">
                                <div class="slide-arabic">{slide.arabic}</div>
                                <div class="slide-translation">
                                    {slide.trans}
                                </div>
                                <div class="slide-source">{slide.src}</div>
                            </div>
                        {/if}
                    {/if}
                    <div class="slide-dots">
                        {#each Array(Math.max(payload.slides.length || 3, 3)) as _, i}
                            <div
                                class="dot"
                                class:active={i === currentSlide}
                            ></div>
                        {/each}
                    </div>
                </div>
            </section>

            <!-- RIGHT PANEL -->
            <aside class="right-panel">
                {#if payload.events.length > 0 && payload.events[0].countdownEnabled}
                    {@const event = payload.events[0]}
                    <div class="info-card event-card">
                        <div class="info-card-title">COUNTDOWN HARI BESAR</div>
                        <div class="event-days">
                            {Math.max(
                                0,
                                Math.ceil(
                                    (new Date(event.eventDate).getTime() -
                                        Date.now()) /
                                        86400000,
                                ),
                            )}
                        </div>
                        <div class="event-label">
                            Hari lagi menuju<br />
                            <span style="color: #c8a84b; font-weight: 600;"
                                >{event.title}</span
                            >
                        </div>
                    </div>
                {/if}

                <div class="info-card">
                    <div class="info-card-title">IMSAKIYAH HARI INI</div>
                    <div class="imsakiyah-row">
                        <div>
                            <div class="info-card-sub">Imsak</div>
                            <div class="info-card-value imsakiyah-time">
                                {payload.schedule.resolved?.imsak ?? "--:--"}
                            </div>
                        </div>
                        <div class="imsakiyah-sep">—</div>
                        <div>
                            <div class="info-card-sub">Syuruq</div>
                            <div class="info-card-value imsakiyah-time">
                                {payload.schedule.resolved?.sunrise ?? "--:--"}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="info-card">
                    <div class="info-card-title">PERANGKAT DISPLAY</div>
                    <div class="info-card-value" style="font-size: 0.9em;">
                        {payload.device.name}
                    </div>
                    <div class="info-card-sub">{payload.device.deviceCode}</div>
                </div>
            </aside>
        </main>

        <!-- RUNNING TEXT -->
        <footer class="running-bar">
            <div class="running-icon">📢 INFO</div>
            <div class="running-track">
                <div class="running-text">
                    🕌 {getRunningTextContent()}
                </div>
            </div>
        </footer>
    </div>
{/if}

<style>
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .loading-screen,
    .error-screen {
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0a0f1e;
        color: #fff;
        font-family: "Exo 2", sans-serif;
    }

    .error-screen {
        color: #ff6b6b;
    }

    .tv-wrap {
        width: 100vw;
        height: 100vh;
        background: #0a0f1e;
        font-family: "Exo 2", sans-serif;
        position: relative;
        overflow: hidden;
        color: #fff;
    }

    .bg-stars {
        position: absolute;
        inset: 0;
        background:
            radial-gradient(
                ellipse at 20% 50%,
                rgba(0, 80, 60, 0.15) 0%,
                transparent 60%
            ),
            radial-gradient(
                ellipse at 80% 20%,
                rgba(10, 40, 100, 0.2) 0%,
                transparent 60%
            ),
            radial-gradient(
                ellipse at 50% 100%,
                rgba(30, 10, 80, 0.2) 0%,
                transparent 60%
            );
    }

    .bg-grid {
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
            linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.025) 1px,
                transparent 1px
            );
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
            #c8a84b,
            #f0d080,
            #c8a84b,
            transparent
        );
    }

    /* HEADER */
    .header {
        position: absolute;
        top: 3px;
        left: 0;
        right: 0;
        height: 12%;
        display: flex;
        align-items: center;
        padding: 0 2.5% 0 2%;
        border-bottom: 1px solid rgba(200, 168, 75, 0.3);
        background: rgba(0, 0, 0, 0.3);
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
        background: rgba(200, 168, 75, 0.15);
        border: 1.5px solid rgba(200, 168, 75, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(16px, 2vw, 28px);
    }

    .masjid-name {
        font-family: "Cinzel", serif;
        font-size: clamp(12px, 1.6vw, 22px);
        font-weight: 700;
        color: #f0d080;
        letter-spacing: 0.05em;
    }

    .masjid-loc {
        font-size: clamp(8px, 0.9vw, 12px);
        color: rgba(255, 255, 255, 0.55);
        margin-top: 2px;
        letter-spacing: 0.08em;
    }

    .header-right {
        text-align: right;
    }

    .header-time {
        font-size: clamp(18px, 2.2vw, 32px);
        font-weight: 700;
        color: #f0d080;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
    }

    .header-date {
        font-size: clamp(8px, 0.9vw, 12px);
        color: rgba(255, 255, 255, 0.55);
        margin-top: 2px;
    }

    /* MAIN BODY */
    .main-body {
        position: absolute;
        top: 15%;
        bottom: 9%;
        left: 0;
        right: 0;
        display: flex;
    }

    /* LEFT PANEL */
    .left-panel {
        width: 24%;
        display: flex;
        flex-direction: column;
        padding: 3% 2% 3% 2.5%;
        border-right: 1px solid rgba(200, 168, 75, 0.2);
        background: rgba(0, 0, 0, 0.2);
        justify-content: center;
        align-items: center;
        gap: 4%;
    }

    .next-label {
        font-size: clamp(7px, 0.8vw, 11px);
        color: rgba(255, 255, 255, 0.5);
        letter-spacing: 0.15em;
        text-transform: uppercase;
    }

    .next-prayer-name {
        font-family: "Cinzel", serif;
        font-size: clamp(18px, 2.8vw, 40px);
        font-weight: 700;
        color: #f0d080;
        text-align: center;
    }

    .next-prayer-time {
        font-size: clamp(24px, 4vw, 56px);
        font-weight: 700;
        color: #fff;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
    }

    .countdown-box {
        background: rgba(200, 168, 75, 0.1);
        border: 1px solid rgba(200, 168, 75, 0.4);
        border-radius: 6px;
        padding: 3% 8%;
        text-align: center;
        width: 90%;
    }

    .countdown-label {
        font-size: clamp(6px, 0.7vw, 9px);
        color: rgba(255, 255, 255, 0.45);
        letter-spacing: 0.12em;
        display: block;
        margin-bottom: 2px;
    }

    .countdown-val {
        font-size: clamp(14px, 1.8vw, 26px);
        font-weight: 700;
        color: #c8a84b;
        font-variant-numeric: tabular-nums;
    }

    .iqamah-box {
        text-align: center;
    }

    .iqamah-label {
        font-size: clamp(6px, 0.7vw, 9px);
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 0.1em;
    }

    .iqamah-val {
        font-size: clamp(10px, 1.2vw, 16px);
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
    }

    /* CENTER PANEL */
    .center-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 2%;
        gap: 2%;
    }

    .prayer-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1.5%;
        height: 58%;
    }

    .prayer-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4%;
        padding: 4% 2%;
        transition: all 0.3s;
        position: relative;
        overflow: hidden;
    }

    .prayer-card.active {
        background: rgba(200, 168, 75, 0.12);
        border-color: rgba(200, 168, 75, 0.6);
    }

    .prayer-card.active::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #f0d080, transparent);
    }

    .prayer-card-icon {
        font-size: clamp(14px, 1.8vw, 24px);
        opacity: 0.6;
    }

    .prayer-card.active .prayer-card-icon {
        opacity: 1;
    }

    .prayer-card-name {
        font-size: clamp(9px, 1vw, 14px);
        color: rgba(255, 255, 255, 0.55);
        letter-spacing: 0.12em;
        font-weight: 500;
    }

    .prayer-card.active .prayer-card-name {
        color: #f0d080;
    }

    .prayer-card-time {
        font-size: clamp(16px, 2.2vw, 28px);
        font-weight: 700;
        color: #fff;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.03em;
    }

    .prayer-iqamah {
        font-size: clamp(7px, 0.75vw, 10px);
        color: rgba(255, 255, 255, 0.35);
    }

    .prayer-card.active .prayer-iqamah {
        color: rgba(200, 168, 75, 0.7);
    }

    .active-badge {
        font-size: clamp(6px, 0.65vw, 8px);
        background: rgba(200, 168, 75, 0.3);
        color: #f0d080;
        padding: 1px 6px;
        border-radius: 10px;
        letter-spacing: 0.1em;
    }

    .slide-area {
        flex: 1;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 6px;
        overflow: hidden;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .slide-content {
        text-align: center;
        padding: 3%;
    }

    .slide-arabic {
        font-family: "Noto Naskh Arabic", serif;
        font-size: clamp(14px, 2vw, 28px);
        color: #f0d080;
        line-height: 1.8;
        margin-bottom: 3%;
    }

    .slide-translation {
        font-size: clamp(8px, 0.9vw, 12px);
        color: rgba(255, 255, 255, 0.6);
        font-style: italic;
        line-height: 1.6;
    }

    .slide-source {
        font-size: clamp(6px, 0.7vw, 9px);
        color: rgba(200, 168, 75, 0.6);
        margin-top: 2%;
        letter-spacing: 0.1em;
    }

    .slide-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .slide-dots {
        position: absolute;
        bottom: 6px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 4px;
    }

    .dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
    }

    .dot.active {
        background: #c8a84b;
    }

    /* RIGHT PANEL */
    .right-panel {
        width: 22%;
        display: flex;
        flex-direction: column;
        padding: 2.5%;
        border-left: 1px solid rgba(200, 168, 75, 0.2);
        background: rgba(0, 0, 0, 0.2);
        gap: 3%;
        justify-content: flex-start;
        padding-top: 3%;
    }

    .info-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 5% 6%;
    }

    .info-card-title {
        font-size: clamp(6px, 0.7vw, 9px);
        color: rgba(200, 168, 75, 0.7);
        letter-spacing: 0.12em;
        margin-bottom: 4%;
    }

    .info-card-value {
        font-size: clamp(11px, 1.3vw, 18px);
        font-weight: 600;
        color: #fff;
        line-height: 1.3;
    }

    .info-card-sub {
        font-size: clamp(7px, 0.75vw, 10px);
        color: rgba(255, 255, 255, 0.4);
        margin-top: 2%;
    }

    .event-card {
        text-align: center;
    }

    .event-days {
        font-size: clamp(22px, 3vw, 42px);
        font-weight: 700;
        color: #c8a84b;
    }

    .event-label {
        font-size: clamp(7px, 0.75vw, 10px);
        color: rgba(255, 255, 255, 0.5);
        margin-top: 2%;
        line-height: 1.4;
    }

    .imsakiyah-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4%;
    }

    .imsakiyah-time {
        font-size: clamp(12px, 1.5vw, 20px);
    }

    .imsakiyah-sep {
        color: rgba(200, 168, 75, 0.3);
        font-size: clamp(12px, 1.5vw, 20px);
    }

    /* RUNNING TEXT */
    .running-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 9%;
        background: rgba(200, 168, 75, 0.12);
        border-top: 1px solid rgba(200, 168, 75, 0.3);
        display: flex;
        align-items: center;
        overflow: hidden;
    }

    .running-icon {
        flex-shrink: 0;
        width: 6%;
        height: 100%;
        background: rgba(200, 168, 75, 0.25);
        border-right: 1px solid rgba(200, 168, 75, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(9px, 1.1vw, 15px);
        font-weight: 700;
        color: #f0d080;
        letter-spacing: 0.08em;
    }

    .running-track {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
    }

    .running-text {
        display: inline-block;
        font-size: clamp(9px, 1.1vw, 15px);
        color: rgba(255, 255, 255, 0.85);
        animation: marquee 40s linear infinite;
        padding-left: 100%;
    }

    @keyframes marquee {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(-100%);
        }
    }

    /* Responsive */
    @media (max-width: 900px) {
        .right-panel {
            display: none;
        }
        .center-panel {
            padding: 2%;
        }
    }
</style>
