<script lang="ts">
    import type { DisplayPayload } from "$lib/types/display";
    import {
        PRAYER_ORDER,
        PRAYER_LABELS,
        PRAYER_ICONS,
        DEFAULT_SLIDES,
    } from "$lib/utils/prayer";
    import { getLocationText } from "$lib/display/helpers";

    interface Props {
        payload: DisplayPayload;
        nextPrayerName: string;
        nextPrayerTime: string;
        countdown: string;
        countdownProgress: number;
        iqamahTime: string;
        activePrayerIndex: number;
        liveClock: string;
        liveDate: string;
        hijriyahDate: string;
        currentSlide: number;
        slideFading: boolean;
        currentJumbotron: number;
        weatherTemp: number | null;
        weatherCode: number | null;
        weatherLoading: boolean;
        isJumat?: boolean;
    }

    let {
        payload,
        nextPrayerName,
        nextPrayerTime,
        countdown,
        countdownProgress,
        iqamahTime,
        activePrayerIndex,
        liveClock,
        liveDate,
        hijriyahDate,
        currentSlide,
        slideFading,
        currentJumbotron,
        weatherTemp,
        weatherCode,
        weatherLoading,
        isJumat = false,
    }: Props = $props();

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

    function getWeatherIcon(code: number): string {
        if (code === 0) return "☀️";
        if (code <= 2) return "⛅";
        if (code <= 3) return "☁️";
        if (code <= 49) return "🌫️";
        if (code <= 59) return "🌦️";
        if (code <= 69) return "🌧️";
        if (code <= 79) return "🌨️";
        if (code <= 84) return "🌧️";
        if (code <= 99) return "⛈️";
        return "🌡️";
    }

    function getWeatherDesc(code: number): string {
        if (code === 0) return "Cerah";
        if (code <= 2) return "Berawan";
        if (code <= 3) return "Mendung";
        if (code <= 49) return "Kabut";
        if (code <= 59) return "Gerimis";
        if (code <= 69) return "Hujan";
        if (code <= 79) return "Hujan Es";
        if (code <= 84) return "Hujan Lebat";
        if (code <= 99) return "Badai";
        return "Normal";
    }
</script>

<div class="vertical-layout">
    <!-- ── 1. CARD IDENTITAS MASJID ── -->
    <div class="v-card v-masjid-card">
        <div class="v-masjid-logo">
            {#if payload.masjid.logoUrl}
                <img
                    src={payload.masjid.logoUrl}
                    alt="Logo"
                    class="v-logo-img"
                />
            {:else}
                🕌
            {/if}
        </div>
        <div class="v-masjid-details">
            <h1 class="v-masjid-name">{payload.masjid.name}</h1>
            <p class="v-masjid-loc">{getLocationText(payload.masjid)}</p>
        </div>
    </div>

    <!-- ── 2. CARD JAM DIGITAL EKSKLUSIF ── -->
    <div class="v-card v-clock-card">
        <div class="v-time-display">{liveClock}</div>
        <div class="v-date-display">
            <span class="v-masehi">{liveDate}</span>
            <span class="v-divider-dot">•</span>
            <span class="v-hijri">{hijriyahDate || "—"}</span>
        </div>
    </div>

    <!-- ── 3. CARD SHOLAT BERIKUTNYA & HARI BESAR ── -->
    <div class="v-next-row-wrap">
        <!-- Card Sholat Berikutnya (75%) -->
        <div class="v-card v-next-card">
            <div class="v-next-row">
                <div class="v-next-info">
                    <span class="v-next-label">SHOLAT BERIKUTNYA</span>
                    <span class="v-next-name">{nextPrayerName}</span>
                </div>
                <div class="v-next-time">{nextPrayerTime}</div>
            </div>

            <div class="v-countdown-section">
                <div class="v-cd-meta">
                    <span class="v-cd-label">MENUJU ADZAN</span>
                    <span class="v-cd-val">{countdown}</span>
                </div>
                <div class="v-progress-track">
                    <div
                        class="v-progress-fill"
                        style="width: {countdownProgress}%"
                    ></div>
                </div>
            </div>

            {#if iqamahTime}
                <div class="v-iqamah-tag">
                    ⏱️ JEDA IQAMAH: <span class="v-iq-time">{iqamahTime}</span>
                </div>
            {/if}
        </div>

        <!-- Card Hari Besar (25%) — hanya tampil jika ada event aktif -->
        {#if payload.events.filter((e) => e.countdownEnabled).length > 0}
            {@const event = payload.events.filter((e) => e.countdownEnabled)[0]}
            {@const daysLeft = Math.max(
                0,
                Math.ceil(
                    (new Date(event.eventDate).getTime() - Date.now()) /
                        86400000,
                ),
            )}
            <div class="v-card v-event-card">
                <div class="v-event-days">{daysLeft}</div>
                <div class="v-event-days-label">HARI LAGI</div>
                <div class="v-event-title">{event.title}</div>
            </div>
        {/if}
    </div>

    <!-- ── 5. CARD MEDIA SLIDE / AYAT QURAN ── -->
    <div class="v-card v-media-card">
        <div class="v-slide-area" class:fade-out={slideFading}>
            {#if payload.slides.length > 0 && payload.slides[currentSlide % payload.slides.length]?.fileUrl}
                <img
                    src={payload.slides[currentSlide % payload.slides.length]
                        .fileUrl}
                    alt={payload.slides[currentSlide % payload.slides.length]
                        .title ?? "Slide"}
                    class="v-slide-image"
                />
            {:else}
                {@const slide = getCurrentSlideContent()}
                {#if slide}
                    <div class="v-slide-content">
                        <div class="v-slide-arabic">{slide.arabic}</div>
                        <div class="v-slide-translation">{slide.trans}</div>
                        <div class="v-slide-source">{slide.src}</div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>

    <!-- ── 4. CARD DAFTAR WAKTU SHOLAT ── -->
    <div class="v-card v-prayer-list-card">
        <div class="v-prayer-list">
            {#each PRAYER_ORDER as prayer, idx}
                <div
                    class="v-prayer-row"
                    class:active={idx === activePrayerIndex}
                >
                    <span class="v-prayer-icon">{PRAYER_ICONS[prayer]}</span>
                    <span class="v-prayer-name">{PRAYER_LABELS[prayer]}</span>
                    <span class="v-prayer-time">
                        {payload.schedule.resolved?.[prayer] ?? "--:--"}
                    </span>
                    {#if payload.schedule.iqamah[prayer]?.enabled && !(isJumat && prayer === "dzuhur")}
                        <span class="v-prayer-iqamah"
                            >IQ: {payload.schedule.iqamah[prayer].time}</span
                        >
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <!-- ── 6. CARD FOOTER (CUACA & JUMBOTRON / HARI BESAR) ── -->
    <footer class="v-footer-row">
        <!-- Weather Info -->
        {#if payload.masjid.latitude && payload.masjid.longitude}
            <div class="v-card v-weather-card">
                {#if weatherLoading}
                    <span class="v-weather-loading">⏳</span>
                {:else if weatherTemp !== null && weatherCode !== null}
                    <span class="v-weather-icon"
                        >{getWeatherIcon(weatherCode)}</span
                    >
                    <div class="v-weather-text">
                        <span class="v-temp">{weatherTemp}°C</span>
                        <span class="v-desc">{getWeatherDesc(weatherCode)}</span
                        >
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Jumbotron / Announcement & Hari Besar -->
        {#if payload.jumbotrons.length > 0 || (payload.events.length > 0 && payload.events[0].countdownEnabled)}
            {@const totalItems =
                payload.jumbotrons.length +
                payload.events.filter((e) => e.countdownEnabled).length}
            {@const itemIndex = currentJumbotron % totalItems}
            {@const isJumbotron = itemIndex < payload.jumbotrons.length}
            {@const jumbotron = isJumbotron
                ? payload.jumbotrons[itemIndex]
                : null}
            {@const event = !isJumbotron
                ? payload.events.filter((e) => e.countdownEnabled)[
                      itemIndex - payload.jumbotrons.length
                  ]
                : null}

            <div class="v-card v-jumbotron-card">
                {#if isJumbotron && jumbotron}
                    {#if jumbotron.backgroundUrl}
                        <!-- Jumbotron foto -->
                        <img
                            src={jumbotron.backgroundUrl}
                            alt={jumbotron.title ?? "Jumbotron"}
                            class="v-jb-bg-img"
                        />
                        <div class="v-jb-img-overlay">
                            {#if jumbotron.title}<span class="v-jb-img-title"
                                    >{jumbotron.title}</span
                                >{/if}
                            {#if jumbotron.content}<span
                                    class="v-jb-img-content"
                                    >{jumbotron.content}</span
                                >{/if}
                        </div>
                    {:else}
                        <!-- Jumbotron teks berjalan -->
                        <span class="v-jb-tag">📢</span>
                        <div class="v-jb-scroll-wrap">
                            <div class="v-jb-scroll-text">
                                <span class="v-jb-title"
                                    >{jumbotron.title ?? "Pengumuman"}:</span
                                >
                                <span class="v-jb-content"
                                    >{jumbotron.content}</span
                                >
                            </div>
                        </div>
                    {/if}
                {:else if event}
                    <!-- Hari Besar / Event -->
                    <span class="v-jb-tag">🗓️</span>
                    <span class="v-event-text">
                        <strong
                            >{Math.max(
                                0,
                                Math.ceil(
                                    (new Date(event.eventDate).getTime() -
                                        Date.now()) /
                                        86400000,
                                ),
                            )}</strong
                        >
                        hari lagi menuju <strong>{event.title}</strong>
                    </span>
                {/if}
            </div>
        {/if}
    </footer>
</div>

<style>
    /* ═══════════════════════════════════════════
       CONTAINER UTAMA (VERTikal Portrait)
       ═══════════════════════════════════════════ */
    .vertical-layout {
        position: absolute;
        top: 0;
        bottom: 8%; /* space for running text */
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        padding: 3vh 4vw;
        gap: 1.6vh;
        background: linear-gradient(
            180deg,
            var(--bg-primary) 0%,
            var(--bg-secondary) 100%
        );
        overflow: hidden;
        box-sizing: border-box;
    }

    :global(.no-running) .vertical-layout {
        bottom: 0;
    }

    /* Base Card Styling */
    .v-card {
        background: var(--card-bg, rgba(255, 255, 255, 0.03));
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
        border-radius: var(--border-radius, 16px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        box-sizing: border-box;
    }

    /* ── 1. CARD IDENTITAS MASJID ── */
    .v-masjid-card {
        display: flex;
        align-items: center;
        gap: 4vw;
        padding: 1.5vh 4vw;
        border-color: var(--border-accent);
    }

    .v-masjid-logo {
        width: 12vw;
        height: 12vw;
        max-width: 72px;
        max-height: 72px;
        aspect-ratio: 1;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid var(--prayer-active-border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(20px, 4.5vw, 36px);
        overflow: hidden;
        flex-shrink: 0;
    }

    .v-logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .v-masjid-details {
        flex: 1;
        min-width: 0;
    }

    .v-masjid-name {
        font-family: var(--font-heading, "Cinzel"), serif;
        font-size: clamp(16px, 3.8vw, 36px);
        font-weight: 700;
        color: var(--accent-primary);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .v-masjid-loc {
        font-size: clamp(10px, 2.2vw, 20px);
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
    }

    /* ── 2. CARD JAM DIGITAL EKSKLUSIF ── */
    .v-clock-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2.2vh 4vw;
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.01) 100%
        );
    }

    .v-time-display {
        font-size: clamp(48px, 11vw, 110px);
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
        letter-spacing: 0.02em;
        text-shadow: 0 0 15px var(--accent-muted);
        font-variant-numeric: tabular-nums;
    }

    .v-date-display {
        display: flex;
        align-items: center;
        gap: 2vw;
        font-size: clamp(11px, 2.5vw, 22px);
        color: var(--text-secondary);
        margin-top: 1vh;
        font-weight: 500;
    }

    .v-divider-dot {
        color: var(--accent-secondary);
    }

    .v-hijri {
        color: var(--accent-secondary);
        font-weight: 600;
    }

    /* ── 3. CARD SHOLAT BERIKUTNYA & HARI BESAR ── */
    .v-next-row-wrap {
        display: flex;
        gap: 2vw;
        align-items: stretch;
    }

    .v-next-card {
        flex: 3; /* 75% */
        padding: 2vh 5vw;
        display: flex;
        flex-direction: column;
        gap: 1.5vh;
    }

    /* Card Hari Besar (25%) */
    .v-event-card {
        flex: 1; /* 25% */
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.5vh 2vw;
        text-align: center;
        gap: 0.5vh;
        background: linear-gradient(
            135deg,
            rgba(251, 191, 36, 0.08) 0%,
            rgba(245, 158, 11, 0.03) 100%
        );
        border-color: rgba(251, 191, 36, 0.3);
    }

    .v-event-days {
        font-size: clamp(22px, 5vw, 48px);
        font-weight: 700;
        color: #fbbf24;
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }

    .v-event-days-label {
        font-size: clamp(7px, 1.5vw, 12px);
        color: var(--text-muted);
        letter-spacing: 0.1em;
        font-weight: 600;
    }

    .v-event-title {
        font-size: clamp(8px, 1.8vw, 14px);
        color: #fbbf24;
        font-weight: 600;
        line-height: 1.3;
        word-break: break-word;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
    }

    .v-next-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .v-next-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .v-next-label {
        font-size: clamp(10px, 2.2vw, 20px);
        color: var(--accent-muted);
        letter-spacing: 0.15em;
        font-weight: 600;
    }

    .v-next-name {
        font-family: var(--font-heading, "Cinzel"), serif;
        font-size: clamp(20px, 4.8vw, 42px);
        font-weight: 700;
        color: var(--accent-primary);
        margin-top: 2px;
    }

    .v-next-time {
        font-size: clamp(28px, 6.2vw, 56px);
        font-weight: 700;
        color: var(--text-primary);
    }

    .v-countdown-section {
        display: flex;
        flex-direction: column;
        gap: 0.8vh;
    }

    .v-cd-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .v-cd-label {
        font-size: clamp(9px, 2vw, 16px);
        color: var(--text-muted);
    }

    .v-cd-val {
        font-size: clamp(14px, 3vw, 28px);
        font-weight: 700;
        color: #34d399;
        font-variant-numeric: tabular-nums;
    }

    .v-progress-track {
        width: 100%;
        height: 5px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        overflow: hidden;
    }

    .v-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #34d399, #10b981);
        transition: width 1s linear;
    }

    .v-iqamah-tag {
        font-size: clamp(10px, 2vw, 18px);
        color: var(--text-secondary);
        text-align: center;
        font-weight: 500;
    }

    .v-iq-time {
        color: var(--accent-secondary);
        font-weight: 700;
    }

    /* ── 6. CARD DAFTAR WAKTU SHOLAT ── */
    .v-prayer-list-card {
        padding: 1.2vh 3vw;
    }

    .v-prayer-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1vh 2vw;
    }

    .v-prayer-row {
        display: flex;
        align-items: center;
        padding: 0.8vh 2vw;
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid rgba(255, 255, 255, 0.03);
        border-radius: var(--border-radius, 10px);
        transition: all 0.3s ease;
        overflow: hidden;
        min-width: 0;
    }

    .v-prayer-row.active {
        background: var(--prayer-active-bg);
        border-color: var(--prayer-active-border);
        box-shadow:
            0 0 10px var(--prayer-active-glow),
            inset 0 0 8px rgba(255, 255, 255, 0.03);
    }

    .v-prayer-row.active .v-prayer-name {
        color: var(--accent-primary);
        font-weight: 700;
    }

    .v-prayer-row.active .v-prayer-time {
        color: var(--accent-primary);
    }

    .v-prayer-icon {
        font-size: clamp(11px, 2.5vw, 20px);
        margin-right: 1.5vw;
        flex-shrink: 0;
    }

    .v-prayer-name {
        font-size: clamp(10px, 2.2vw, 18px);
        color: var(--text-secondary);
        font-weight: 600;
        letter-spacing: 0.05em;
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .v-prayer-row.active .v-prayer-name {
        color: var(--accent-primary);
    }

    .v-prayer-time {
        font-size: clamp(12px, 2.6vw, 24px);
        font-weight: 700;
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
        white-space: nowrap;
    }

    .v-prayer-row.active .v-prayer-time {
        color: var(--accent-primary);
    }

    .v-prayer-iqamah {
        font-size: clamp(8px, 1.8vw, 14px);
        color: var(--text-muted);
        margin-left: 1.5vw;
        background: rgba(255, 255, 255, 0.05);
        padding: 1px 5px;
        border-radius: 4px;
        white-space: nowrap;
        flex-shrink: 0;
    }

    /* ── 5. CARD MEDIA SLIDE / AYAT QURAN ── */
    .v-media-card {
        padding: 1vh 4vw;
        flex: 1.2;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 20vh;
    }

    .v-slide-area {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.5s ease;
    }

    .v-slide-area.fade-out {
        opacity: 0;
    }

    .v-slide-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
    }

    .v-slide-content {
        text-align: center;
        width: 100%;
    }

    .v-slide-arabic {
        font-family: var(--font-arabic), serif;
        font-size: clamp(20px, 4.5vw, 42px);
        color: var(--accent-primary);
        line-height: 1.5;
        margin-bottom: 1vh;
        direction: rtl;
    }

    .v-slide-translation {
        font-size: clamp(11px, 2.4vw, 20px);
        color: var(--text-secondary);
        font-style: italic;
        line-height: 1.4;
    }

    .v-slide-source {
        font-size: clamp(8px, 1.8vw, 14px);
        color: var(--accent-muted);
        margin-top: 0.8vh;
        letter-spacing: 0.05em;
    }

    /* ── 6. CARD FOOTER ── */
    .v-footer-row {
        display: flex;
        gap: 2vw;
        height: 7vh;
        min-height: 44px;
        align-items: stretch;
        flex-shrink: 0;
    }

    .v-weather-card {
        flex: 0 0 28%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2vw;
        padding: 0 3vw;
    }

    .v-weather-loading {
        font-size: clamp(14px, 3vw, 24px);
        opacity: 0.6;
    }

    .v-weather-icon {
        font-size: clamp(16px, 3.5vw, 28px);
    }

    .v-weather-text {
        display: flex;
        flex-direction: column;
    }

    .v-temp {
        font-size: clamp(12px, 2.4vw, 20px);
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.1;
    }

    .v-desc {
        font-size: clamp(8px, 1.8vw, 13px);
        color: var(--text-muted);
    }

    .v-jumbotron-card {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 2vw;
        padding: 0 3vw;
        overflow: hidden;
        position: relative;
    }

    /* Jumbotron dengan foto */
    .v-jb-bg-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
        opacity: 0.85;
    }

    .v-jb-img-overlay {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 3vw;
        width: 100%;
        background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.6) 0%,
            rgba(0, 0, 0, 0.2) 100%
        );
        height: 100%;
        border-radius: inherit;
    }

    .v-jb-img-title {
        font-size: clamp(11px, 2.4vw, 20px);
        font-weight: 700;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .v-jb-img-content {
        font-size: clamp(9px, 1.8vw, 14px);
        color: rgba(255, 255, 255, 0.8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .v-jb-tag {
        font-size: clamp(14px, 3vw, 24px);
        flex-shrink: 0;
    }

    .v-jb-scroll-wrap {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
    }

    .v-jb-scroll-text {
        display: inline-block;
        white-space: nowrap;
        animation: marquee-jb 40s linear infinite;
        will-change: transform;
        padding-left: 100%;
        font-size: clamp(11px, 2.4vw, 20px);
        color: var(--text-secondary);
    }

    @keyframes marquee-jb {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(-100%);
        }
    }

    .v-jb-title {
        font-weight: 700;
        color: #7dd3fc;
        margin-right: 1.5vw;
    }

    .v-jb-content {
        color: var(--text-secondary);
    }

    .v-event-text {
        font-size: clamp(10px, 2.2vw, 18px);
        color: var(--accent-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* ── Penyesuaian Responsif untuk Tinggi Layar Besar (FHD/2K/4K) ── */
    @media (min-height: 1000px) {
        .vertical-layout {
            padding: 4vh 4vw;
            gap: 2.2vh;
        }

        .v-masjid-card {
            padding: 2vh 4vw;
        }

        .v-clock-card {
            padding: 3vh 4vw;
        }

        .v-next-card {
            padding: 3vh 5vw;
            gap: 2vh;
        }

        .v-prayer-list-card {
            padding: 2.5vh 3vw;
        }

        .v-prayer-list {
            gap: 1.2vh;
        }

        .v-prayer-row {
            padding: 1.5vh 4vw;
        }

        .v-media-card {
            padding: 3vh 4vw;
        }
    }
</style>
