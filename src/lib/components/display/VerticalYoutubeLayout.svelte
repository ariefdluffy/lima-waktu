<script lang="ts">
    import { onMount } from "svelte";
    import type { DisplayPayload } from "$lib/types/display";
    import {
        PRAYER_ORDER,
        PRAYER_LABELS,
        PRAYER_ICONS,
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
        currentJumbotron?: number;
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
        currentJumbotron = 0,
        isJumat = false,
    }: Props = $props();

    let currentYoutubeIndex = $state(0);
    let ytPlayer: any = null;
    let ytPlayerReady = false;

    function getVideoId(url: string): string {
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
        return videoId;
    }

    function playNextVideo() {
        if (!payload.youtubeItems || payload.youtubeItems.length === 0) return;
        const nextIndex =
            (currentYoutubeIndex + 1) % payload.youtubeItems.length;
        currentYoutubeIndex = nextIndex;
        if (ytPlayer && ytPlayerReady) {
            const nextId = getVideoId(
                payload.youtubeItems[nextIndex].youtubeUrl,
            );
            if (nextId) ytPlayer.loadVideoById(nextId);
        }
    }

    onMount(() => {
        const firstVideoId = getVideoId(
            payload.youtubeItems?.[0]?.youtubeUrl ?? "",
        );
        if (!firstVideoId) return;

        function initPlayer() {
            ytPlayer = new (window as any).YT.Player("v-yt-player", {
                videoId: firstVideoId,
                playerVars: {
                    autoplay: 1,
                    mute: 0,
                    controls: 0,
                    loop: 0,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1,
                    iv_load_policy: 3,
                    enablejsapi: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (event: any) => {
                        ytPlayerReady = true;
                        event.target.setVolume(30);
                        event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        if (event.data === 1) {
                            event.target.setVolume(30);
                        }
                        if (event.data === 0) {
                            playNextVideo();
                        }
                    },
                },
            });
        }

        if ((window as any).YT && (window as any).YT.Player) {
            initPlayer();
        } else {
            // Chain callback agar tidak overwrite instance lain (misal YoutubeLayout)
            const prev = (window as any).onYouTubeIframeAPIReady;
            (window as any).onYouTubeIframeAPIReady = () => {
                if (typeof prev === "function") prev();
                initPlayer();
            };
            if (!document.getElementById("yt-api-script")) {
                const script = document.createElement("script");
                script.id = "yt-api-script";
                script.src = "https://www.youtube.com/iframe_api";
                document.head.appendChild(script);
            }
        }

        return () => {
            if (ytPlayer) {
                try {
                    ytPlayer.destroy();
                } catch {}
                ytPlayer = null;
                ytPlayerReady = false;
            }
        };
    });
</script>

<div class="v-yt-layout">
    <!-- ── 1. YOUTUBE VIDEO (Paling Atas) ── -->
    <div class="v-yt-video-frame">
        <div class="v-yt-label">
            <span class="v-yt-dot"></span>
            LIVE STREAMING
            {#if payload.youtubeItems.length > 1}
                <span class="v-yt-counter">
                    {currentYoutubeIndex + 1}/{payload.youtubeItems.length}
                </span>
            {/if}
        </div>
        <div id="v-yt-player" class="v-yt-iframe"></div>
        {#if payload.youtubeItems[currentYoutubeIndex]?.title}
            <div class="v-yt-title">
                {payload.youtubeItems[currentYoutubeIndex].title}
            </div>
        {/if}
    </div>

    <!-- ── CONTAINER KONTEN (Di bawah Video) ── -->
    <div class="v-yt-content">
        <!-- ── 2. CARD IDENTITAS MASJID ── -->
        <div class="v-yt-card v-yt-masjid-card">
            <div class="v-yt-masjid-logo">
                {#if payload.masjid.logoUrl}
                    <img
                        src={payload.masjid.logoUrl}
                        alt="Logo"
                        class="v-yt-logo-img"
                    />
                {:else}
                    🕌
                {/if}
            </div>
            <div class="v-yt-masjid-details">
                <h1 class="v-yt-masjid-name">{payload.masjid.name}</h1>
                <p class="v-yt-masjid-loc">{getLocationText(payload.masjid)}</p>
            </div>
        </div>

        <!-- ── 3. CARD JAM TERPISAH (Sleek Digital Clock Card) ── -->
        <div class="v-yt-card v-yt-clock-card">
            <div class="v-yt-time-display">{liveClock}</div>
            <div class="v-yt-date-display">
                <span class="v-yt-masehi">{liveDate}</span>
                <span class="v-yt-divider-dot">•</span>
                <span class="v-yt-hijri">{hijriyahDate}</span>
            </div>
        </div>

        <!-- ── 4. CARD SHOLAT BERIKUTNYA & COUNTDOWN ── -->
        <div class="v-yt-card v-yt-next-card">
            <div class="v-yt-next-row">
                <div class="v-yt-next-info">
                    <span class="v-yt-next-label">BERIKUTNYA</span>
                    <span class="v-yt-next-name">{nextPrayerName}</span>
                </div>
                <div class="v-yt-next-time">{nextPrayerTime}</div>
            </div>

            <div class="v-yt-countdown-section">
                <div class="v-yt-cd-meta">
                    <span class="v-yt-cd-label">MENUJU ADZAN</span>
                    <span class="v-yt-cd-val">{countdown}</span>
                </div>
                <div class="v-yt-progress-track">
                    <div
                        class="v-yt-progress-fill"
                        style="width: {countdownProgress}%"
                    ></div>
                </div>
            </div>

            {#if iqamahTime && !isJumat}
                <div class="v-yt-iqamah-tag">
                    ⏱️ JEDA IQAMAH: <span class="v-yt-iq-time"
                        >{iqamahTime}</span
                    >
                </div>
            {/if}
        </div>

        <!-- ── 5. CARD GRID WAKTU SHOLAT ── -->
        <div class="v-yt-card v-yt-grid-card">
            <div class="v-yt-prayer-grid">
                {#each PRAYER_ORDER as prayer, idx}
                    <div
                        class="v-yt-prayer-item"
                        class:active={idx === activePrayerIndex}
                    >
                        <span class="v-yt-p-icon">{PRAYER_ICONS[prayer]}</span>
                        <span class="v-yt-p-name"
                            >{isJumat && prayer === "dzuhur"
                                ? "JUM'AT"
                                : PRAYER_LABELS[prayer]}</span
                        >
                        <span class="v-yt-p-time">
                            {payload.schedule.resolved?.[prayer] ?? "--:--"}
                        </span>
                        {#if payload.schedule.iqamah[prayer]?.enabled && !(isJumat && prayer === "dzuhur")}
                            <span class="v-yt-p-iq"
                                >IQ: {payload.schedule.iqamah[prayer]
                                    .time}</span
                            >
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <!-- ── 6. CARD FOOTER JUMBOTRON ── -->
        {#if payload.jumbotrons.length > 0}
            {@const jumbotron =
                payload.jumbotrons[
                    currentJumbotron % payload.jumbotrons.length
                ]}
            <div class="v-yt-card v-yt-jumbotron-card">
                {#if jumbotron.backgroundUrl}
                    <img
                        src={jumbotron.backgroundUrl}
                        alt={jumbotron.title ?? "Jumbotron"}
                        class="v-yt-jb-bg-img"
                    />
                    <div class="v-yt-jb-img-overlay">
                        {#if jumbotron.title}<span class="v-yt-jb-img-title"
                                >{jumbotron.title}</span
                            >{/if}
                        {#if jumbotron.content}<span class="v-yt-jb-img-content"
                                >{jumbotron.content}</span
                            >{/if}
                    </div>
                {:else}
                    <span class="v-yt-jb-tag">📢</span>
                    <div class="v-yt-jb-scroll-wrap">
                        <div class="v-yt-jb-scroll-text">
                            <span class="v-yt-jb-title"
                                >{jumbotron.title ?? "Pengumuman"}:</span
                            >
                            <span class="v-yt-jb-content"
                                >{jumbotron.content}</span
                            >
                        </div>
                    </div>
                {/if}
            </div>
        {:else if payload.events.length > 0 && payload.events[0].countdownEnabled}
            {@const event = payload.events[0]}
            <div class="v-yt-card v-yt-jumbotron-card">
                <span class="v-yt-jb-tag">🗓️</span>
                <span class="v-yt-event-text">
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
            </div>
        {/if}
    </div>
</div>

<style>
    /* ═══════════════════════════════════════════
       CONTAINER UTAMA
       ═══════════════════════════════════════════ */
    .v-yt-layout {
        position: absolute;
        top: 0;
        bottom: 8%; /* space for running text */
        left: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        background: linear-gradient(
            180deg,
            var(--bg-primary) 0%,
            var(--bg-secondary) 100%
        );
        overflow: hidden;
        box-sizing: border-box;
    }

    :global(.no-running) .v-yt-layout {
        bottom: 0;
    }

    /* ── 1. YOUTUBE FRAME (Top, 16:9) ── */
    .v-yt-video-frame {
        width: 100vw;
        aspect-ratio: 16/9;
        background: #000;
        position: relative;
        border-bottom: 2px solid var(--border-accent);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        flex-shrink: 0;
    }

    .v-yt-label {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(239, 68, 68, 0.5);
        border-radius: 20px;
        padding: 4px 10px;
        font-size: clamp(8px, 2vw, 12px);
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.1em;
    }

    .v-yt-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ef4444;
        box-shadow: 0 0 6px #ef4444;
        animation: live-blink 1.4s ease-in-out infinite;
    }

    @keyframes live-blink {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.3;
        }
    }

    .v-yt-counter {
        font-size: clamp(7px, 1.8vw, 10px);
        color: rgba(255, 255, 255, 0.5);
        margin-left: 2px;
    }

    .v-yt-iframe {
        width: 100%;
        height: 100%;
        border: none;
    }

    .v-yt-iframe :global(iframe) {
        width: 100%;
        height: 100%;
        border: none;
    }

    .v-yt-title {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));
        color: #fff;
        font-size: clamp(10px, 2.4vw, 16px);
        padding: 4% 3% 2%;
        text-align: center;
        pointer-events: none;
    }

    /* ── CONTAINER UNTUK CARD KONTEN DI BAWAH ── */
    .v-yt-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        padding: 2.5vh 4vw;
        gap: 1.8vh;
        overflow: hidden;
    }

    /* Base Card Styling */
    .v-yt-card {
        background: var(--card-bg, rgba(255, 255, 255, 0.03));
        border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
        border-radius: var(--border-radius, 16px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        box-sizing: border-box;
    }

    /* ── 2. CARD IDENTITAS MASJID ── */
    .v-yt-masjid-card {
        display: flex;
        align-items: center;
        gap: 4vw;
        padding: 1.5vh 4vw;
        border-color: var(--border-accent);
    }

    .v-yt-masjid-logo {
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

    .v-yt-logo-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .v-yt-masjid-details {
        flex: 1;
        min-width: 0;
    }

    .v-yt-masjid-name {
        font-family: var(--font-heading, "Cinzel"), serif;
        font-size: clamp(14px, 3.5vw, 32px);
        font-weight: 700;
        color: var(--accent-primary);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .v-yt-masjid-loc {
        font-size: clamp(9px, 2.2vw, 18px);
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
    }

    /* ── 3. CARD JAM TERPISAH ── */
    .v-yt-clock-card {
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

    .v-yt-time-display {
        font-size: clamp(48px, 11vw, 110px);
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
        letter-spacing: 0.02em;
        text-shadow: 0 0 15px var(--accent-muted);
        font-variant-numeric: tabular-nums;
    }

    .v-yt-date-display {
        display: flex;
        align-items: center;
        gap: 2vw;
        font-size: clamp(11px, 2.5vw, 22px);
        color: var(--text-secondary);
        margin-top: 1vh;
        font-weight: 500;
    }

    .v-yt-divider-dot {
        color: var(--accent-secondary);
    }

    .v-yt-hijri {
        color: var(--accent-secondary);
        font-weight: 600;
    }

    /* ── 4. CARD SHOLAT BERIKUTNYA ── */
    .v-yt-next-card {
        padding: 2vh 5vw;
        display: flex;
        flex-direction: column;
        gap: 1.5vh;
    }

    .v-yt-next-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .v-yt-next-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .v-yt-next-label {
        font-size: clamp(9px, 2.2vw, 16px);
        color: var(--accent-muted);
        letter-spacing: 0.1em;
        font-weight: 600;
    }

    .v-yt-next-name {
        font-family: var(--font-heading, "Cinzel"), serif;
        font-size: clamp(20px, 4.8vw, 42px);
        font-weight: 700;
        color: var(--accent-primary);
        margin-top: 2px;
    }

    .v-yt-next-time {
        font-size: clamp(28px, 6.2vw, 56px);
        font-weight: 700;
        color: var(--text-primary);
    }

    .v-yt-countdown-section {
        display: flex;
        flex-direction: column;
        gap: 0.8vh;
    }

    .v-yt-cd-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .v-yt-cd-label {
        font-size: clamp(9px, 2vw, 16px);
        color: var(--text-muted);
    }

    .v-yt-cd-val {
        font-size: clamp(14px, 3vw, 28px);
        font-weight: 700;
        color: #34d399;
        font-variant-numeric: tabular-nums;
    }

    .v-yt-progress-track {
        width: 100%;
        height: 5px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        overflow: hidden;
    }

    .v-yt-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #34d399, #10b981);
        transition: width 1s linear;
    }

    .v-yt-iqamah-tag {
        font-size: clamp(10px, 2vw, 18px);
        color: var(--text-secondary);
        text-align: center;
        font-weight: 500;
    }

    .v-yt-iq-time {
        color: var(--accent-secondary);
        font-weight: 700;
    }

    /* ── 5. CARD GRID WAKTU SHOLAT ── */
    .v-yt-grid-card {
        padding: 1.5vh 3vw;
        border-color: rgba(255, 255, 255, 0.05);
    }

    .v-yt-prayer-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1.5vw;
    }

    .v-yt-prayer-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.8vh 1vw;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius, 10px);
        text-align: center;
        gap: 0.6vh;
        transition: all 0.3s ease;
    }

    /* ── Penyesuaian Responsif untuk Tinggi Layar Besar (FHD/2K/4K) ── */
    @media (min-height: 1000px) {
        .v-yt-content {
            padding: 3vh 4vw;
            gap: 2.2vh;
        }

        .v-yt-masjid-card {
            padding: 2vh 4vw;
        }

        .v-yt-clock-card {
            padding: 3vh 4vw;
        }

        .v-yt-next-card {
            padding: 3.2vh 5vw;
            gap: 2vh;
        }

        .v-yt-prayer-item {
            padding: 2.5vh 1vw;
            gap: 1vh;
        }
    }

    .v-yt-prayer-item.active {
        background: var(--prayer-active-bg);
        border-color: var(--prayer-active-border);
        box-shadow: 0 0 12px var(--prayer-active-glow);
    }

    .v-yt-p-icon {
        font-size: clamp(14px, 3.2vw, 26px);
    }

    .v-yt-p-name {
        font-size: clamp(9px, 2vw, 16px);
        color: var(--text-secondary);
        font-weight: 600;
        letter-spacing: 0.05em;
    }

    .v-yt-prayer-item.active .v-yt-p-name {
        color: var(--accent-primary);
    }

    .v-yt-p-time {
        font-size: clamp(14px, 3.2vw, 30px);
        font-weight: 700;
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
    }

    .v-yt-p-iq {
        font-size: clamp(7px, 1.5vw, 11px);
        color: var(--text-muted);
        background: rgba(255, 255, 255, 0.05);
        padding: 1px 4px;
        border-radius: 3px;
        white-space: nowrap;
    }

    /* ── 6. CARD FOOTER JUMBOTRON ── */
    .v-yt-jumbotron-card {
        display: flex;
        align-items: center;
        gap: 2vw;
        padding: 0 3vw;
        height: 7vh;
        min-height: 44px;
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
    }

    /* Jumbotron foto */
    .v-yt-jb-bg-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
        opacity: 0.85;
    }

    .v-yt-jb-img-overlay {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 3vw;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.6) 0%,
            rgba(0, 0, 0, 0.2) 100%
        );
        border-radius: inherit;
    }

    .v-yt-jb-img-title {
        font-size: clamp(11px, 2.4vw, 20px);
        font-weight: 700;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .v-yt-jb-img-content {
        font-size: clamp(9px, 1.8vw, 14px);
        color: rgba(255, 255, 255, 0.8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Jumbotron teks berjalan */
    .v-yt-jb-tag {
        font-size: clamp(14px, 3vw, 24px);
        flex-shrink: 0;
    }

    .v-yt-jb-scroll-wrap {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
    }

    .v-yt-jb-scroll-text {
        display: inline-block;
        white-space: nowrap;
        animation: marquee-yt-jb 40s linear infinite;
        will-change: transform;
        padding-left: 100%;
        font-size: clamp(11px, 2.4vw, 20px);
        color: var(--text-secondary);
    }

    @keyframes marquee-yt-jb {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(-100%);
        }
    }

    .v-yt-jb-title {
        font-weight: 700;
        color: #7dd3fc;
        margin-right: 1.5vw;
    }

    .v-yt-jb-content {
        color: var(--text-secondary);
    }

    .v-yt-event-text {
        font-size: clamp(10px, 2.2vw, 18px);
        color: var(--accent-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
