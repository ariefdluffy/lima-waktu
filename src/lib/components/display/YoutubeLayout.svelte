<script lang="ts">
    import { onMount } from "svelte";
    import type { DisplayPayload } from "$lib/types/display";
    import {
        PRAYER_ORDER,
        PRAYER_LABELS,
        PRAYER_ICONS,
    } from "$lib/utils/prayer";

    interface Props {
        payload: DisplayPayload;
        nextPrayerName: string;
        nextPrayerTime: string;
        countdown: string;
        countdownProgress: number;
        iqamahTime: string;
        activePrayerIndex: number;
        liveDate?: string;
        hijriyahDate?: string;
    }

    let {
        payload,
        nextPrayerName,
        nextPrayerTime,
        countdown,
        countdownProgress,
        iqamahTime,
        activePrayerIndex,
        liveDate = "",
        hijriyahDate = "",
    }: Props = $props();

    let currentYoutubeIndex = $state(0);
    let youtubePlayer: any = $state(null);

    function getYoutubeEmbedUrl(url: string): string {
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
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&loop=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1&iv_load_policy=3`;
    }

    function playNextVideo() {
        if (!payload.youtubeItems || payload.youtubeItems.length === 0) return;
        currentYoutubeIndex =
            (currentYoutubeIndex + 1) % payload.youtubeItems.length;
    }

    function setYoutubeVolume() {
        if (!youtubePlayer) return;
        youtubePlayer.setVolume(30);
    }

    onMount(() => {
        const handleYoutubeStateChange = (event: any) => {
            youtubePlayer = event.target;
            if (event.data === 1) {
                setYoutubeVolume();
            }
            if (event.data === 0) {
                playNextVideo();
            }
        };
        (window as any).onYoutubeStateChange = handleYoutubeStateChange;
    });
</script>

<!-- ═══════════════════════════════════════════════════════════
     YOUTUBE LAYOUT — 2 Frame: Video (kiri) + Info Sholat (kanan)
     ═══════════════════════════════════════════════════════════ -->
<div class="yt-layout">

    <!-- ── FRAME KIRI: YouTube Video ── -->
    <div class="yt-frame-video">
        <div class="yt-frame-video__inner">
            <!-- Label frame -->
            <div class="yt-frame-label">
                <span class="yt-frame-label__dot"></span>
                LIVE STREAMING
                {#if payload.youtubeItems.length > 1}
                    <span class="yt-frame-label__counter">
                        {currentYoutubeIndex + 1}/{payload.youtubeItems.length}
                    </span>
                {/if}
            </div>

            <!-- iframe YouTube -->
            {#key currentYoutubeIndex}
                <iframe
                    src={getYoutubeEmbedUrl(
                        payload.youtubeItems[currentYoutubeIndex].youtubeUrl,
                    ) + "&onStateChange=onYoutubeStateChange"}
                    title={payload.youtubeItems[currentYoutubeIndex].title ??
                        "Live Streaming"}
                    class="yt-iframe"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowfullscreen
                ></iframe>
            {/key}

            <!-- Judul video (bottom overlay) -->
            {#if payload.youtubeItems[currentYoutubeIndex].title}
                <div class="yt-video-title">
                    {payload.youtubeItems[currentYoutubeIndex].title}
                </div>
            {/if}
        </div>
    </div>

    <!-- ── DIVIDER ── -->
    <div class="yt-divider"></div>

    <!-- ── FRAME KANAN: Info Waktu Sholat ── -->
    <div class="yt-frame-info">
        <div class="yt-frame-info__inner">

            <!-- Label frame -->
            <!-- Tanggal & Hijriyah -->
            <div class="yt-info-dates">
                {#if liveDate}
                    <div class="yt-info-date-masehi">{liveDate}</div>
                {/if}
                {#if hijriyahDate}
                    <div class="yt-info-date-hijri">{hijriyahDate}</div>
                {/if}
            </div>

            <!-- Sholat berikutnya -->
            <div class="yt-info-next">
                <div class="yt-info-next__label">BERIKUTNYA</div>
                <div class="yt-info-next__name">{nextPrayerName}</div>
                <div class="yt-info-next__time">{nextPrayerTime}</div>
            </div>

            <!-- Countdown -->
            <div class="yt-info-countdown">
                <div class="yt-info-countdown__label">MENUJU ADZAN</div>
                <div class="yt-info-countdown__val">{countdown}</div>
                <div class="yt-info-progress-track">
                    <div
                        class="yt-info-progress-fill"
                        style="width: {countdownProgress}%"
                    ></div>
                </div>
            </div>

            <!-- Iqamah -->
            {#if iqamahTime}
                <div class="yt-info-iqamah">
                    <span class="yt-info-iqamah__label">IQAMAH</span>
                    <span class="yt-info-iqamah__val">{iqamahTime}</span>
                </div>
            {/if}

            <!-- Separator -->
            <div class="yt-info-sep"></div>

            <!-- Daftar waktu sholat -->
            <div class="yt-info-prayer-list">
                {#each PRAYER_ORDER as prayer, idx}
                    <div
                        class="yt-info-prayer-row"
                        class:yt-info-prayer-row--active={idx === activePrayerIndex}
                    >
                        <span class="yt-info-prayer-row__icon">{PRAYER_ICONS[prayer]}</span>
                        <span class="yt-info-prayer-row__name">{PRAYER_LABELS[prayer]}</span>
                        <span class="yt-info-prayer-row__time">
                            {payload.schedule.resolved?.[prayer] ?? "--:--"}
                        </span>
                    </div>
                {/each}
            </div>



        </div>
    </div>
</div>

<style>
    /* ═══════════════════════════════════════════
       CONTAINER UTAMA — 2 kolom
       ═══════════════════════════════════════════ */
    .yt-layout {
        position: absolute;
        top: calc(13% + 3px);
        bottom: 8%;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: 0;
    }

    /* ═══════════════════════════════════════════
       FRAME KIRI — VIDEO
       ═══════════════════════════════════════════ */
    .yt-frame-video {
        flex: 0 0 75%;
        display: flex;
        flex-direction: column;
        background: #000;
        position: relative;
    }

    .yt-frame-video__inner {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        border: 2px solid rgba(251, 191, 36, 0.35);
        border-radius: 12px 0 0 12px;
        overflow: hidden;
        box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.04),
            0 0 32px rgba(0, 0, 0, 0.6);
    }

    /* Label "LIVE STREAMING" di pojok kiri atas */
    .yt-frame-label {
        position: absolute;
        top: 12px;
        left: 14px;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        border: 1px solid rgba(239, 68, 68, 0.5);
        border-radius: 20px;
        padding: 4px 12px 4px 8px;
        font-size: clamp(9px, 0.75vw, 13px);
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .yt-frame-label__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ef4444;
        box-shadow: 0 0 6px #ef4444;
        animation: live-blink 1.4s ease-in-out infinite;
        flex-shrink: 0;
    }

    @keyframes live-blink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.3; }
    }

    .yt-frame-label__counter {
        font-size: clamp(8px, 0.65vw, 11px);
        color: rgba(255, 255, 255, 0.55);
        margin-left: 2px;
    }

    .yt-iframe {
        width: 100%;
        flex: 1;
        border: none;
        display: block;
    }

    /* Judul video — gradient overlay di bawah */
    .yt-video-title {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
        color: #fff;
        font-size: clamp(11px, 1vw, 18px);
        padding: 5% 4% 2%;
        text-align: center;
        pointer-events: none;
        letter-spacing: 0.04em;
    }

    /* ═══════════════════════════════════════════
       DIVIDER
       ═══════════════════════════════════════════ */
    .yt-divider {
        flex: 0 0 3px;
        background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(251, 191, 36, 0.6) 20%,
            rgba(251, 191, 36, 0.8) 50%,
            rgba(251, 191, 36, 0.6) 80%,
            transparent 100%
        );
        box-shadow: 0 0 12px rgba(251, 191, 36, 0.25);
    }

    /* ═══════════════════════════════════════════
       FRAME KANAN — INFO WAKTU SHOLAT
       ═══════════════════════════════════════════ */
    .yt-frame-info {
        flex: 0 0 25%;
        display: flex;
        flex-direction: column;
        background: rgba(0, 0, 0, 0.55);
        position: relative;
    }

    .yt-frame-info__inner {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3% 5%;
        gap: 0;
        border: 2px solid rgba(251, 191, 36, 0.25);
        border-left: none;
        border-radius: 0 12px 12px 0;
        overflow: hidden;
        background: linear-gradient(
            160deg,
            rgba(15, 23, 42, 0.92) 0%,
            rgba(10, 15, 30, 0.96) 100%
        );
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    }

    /* Label frame kanan */
    .yt-info-frame-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: clamp(9px, 0.75vw, 13px);
        font-weight: 700;
        color: rgba(251, 191, 36, 0.8);
        letter-spacing: 0.18em;
        text-transform: uppercase;
        margin-bottom: 3%;
        padding-bottom: 2%;
        border-bottom: 1px solid rgba(251, 191, 36, 0.2);
        width: 100%;
        justify-content: center;
    }

    .yt-info-frame-label__icon {
        font-size: clamp(11px, 1vw, 18px);
    }

    /* Tanggal */
    .yt-info-dates {
        text-align: center;
        margin-bottom: 3%;
        width: 100%;
    }

    .yt-info-date-masehi {
        font-size: clamp(9px, 0.8vw, 14px);
        color: rgba(255, 255, 255, 0.55);
        letter-spacing: 0.06em;
        line-height: 1.4;
    }

    .yt-info-date-hijri {
        font-size: clamp(9px, 0.75vw, 13px);
        color: rgba(251, 191, 36, 0.6);
        letter-spacing: 0.04em;
        line-height: 1.4;
        margin-top: 1px;
    }

    /* Sholat berikutnya */
    .yt-info-next {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        margin-bottom: 3%;
    }

    .yt-info-next__label {
        font-size: clamp(8px, 0.65vw, 11px);
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        line-height: 1;
    }

    .yt-info-next__name {
        font-family: var(--font-heading, "Cinzel"), serif;
        font-size: clamp(18px, 2.8vw, 42px);
        font-weight: 700;
        color: #fbbf24;
        line-height: 1.15;
        margin-top: 2px;
        text-align: center;
    }

    .yt-info-next__time {
        font-size: clamp(28px, 4.2vw, 68px);
        font-weight: 700;
        color: #fff;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
        line-height: 1;
        margin-top: 2px;
    }

    /* Countdown */
    .yt-info-countdown {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 10px;
        padding: 2% 5%;
        text-align: center;
        margin-bottom: 2%;
        box-sizing: border-box;
    }

    .yt-info-countdown__label {
        font-size: clamp(8px, 0.65vw, 11px);
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 0.16em;
        line-height: 1.2;
    }

    .yt-info-countdown__val {
        font-size: clamp(16px, 2.2vw, 36px);
        font-weight: 700;
        color: #34d399;
        font-variant-numeric: tabular-nums;
        line-height: 1.3;
    }

    .yt-info-progress-track {
        margin-top: 4px;
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
    }

    .yt-info-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #34d399, #10b981);
        border-radius: 2px;
        transition: width 1s linear;
    }

    /* Iqamah */
    .yt-info-iqamah {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.22);
        border-radius: 8px;
        padding: 1.5% 5%;
        width: 100%;
        box-sizing: border-box;
        margin-bottom: 2%;
    }

    .yt-info-iqamah__label {
        font-size: clamp(8px, 0.65vw, 11px);
        color: rgba(251, 191, 36, 0.65);
        letter-spacing: 0.14em;
    }

    .yt-info-iqamah__val {
        font-size: clamp(14px, 1.8vw, 28px);
        color: #fbbf24;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    /* Separator */
    .yt-info-sep {
        width: 100%;
        height: 1px;
        background: linear-gradient(
            to right,
            transparent,
            rgba(251, 191, 36, 0.3),
            transparent
        );
        margin: 2% 0;
        flex-shrink: 0;
    }

    /* Daftar waktu sholat */
    .yt-info-prayer-list {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.5%;
        flex: 1;
        min-height: 0;
        justify-content: center;
    }

    .yt-info-prayer-row {
        display: flex;
        align-items: center;
        gap: 4%;
        padding: 1.5% 4%;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: background 0.3s;
    }

    .yt-info-prayer-row--active {
        background: rgba(52, 211, 153, 0.13);
        border-color: rgba(52, 211, 153, 0.3);
    }

    .yt-info-prayer-row__icon {
        font-size: clamp(10px, 0.85vw, 15px);
        width: 12%;
        text-align: center;
        flex-shrink: 0;
    }

    .yt-info-prayer-row__name {
        flex: 1;
        font-size: clamp(10px, 0.85vw, 15px);
        color: rgba(255, 255, 255, 0.8);
        letter-spacing: 0.05em;
        line-height: 1.3;
    }

    .yt-info-prayer-row--active .yt-info-prayer-row__name {
        color: #34d399;
        font-weight: 600;
    }

    .yt-info-prayer-row__time {
        font-size: clamp(11px, 1vw, 18px);
        font-weight: 700;
        color: #fff;
        font-variant-numeric: tabular-nums;
        line-height: 1.3;
    }

    .yt-info-prayer-row--active .yt-info-prayer-row__time {
        color: #34d399;
    }

    /* Imsak & Syuruq */
    .yt-info-extra {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6%;
        width: 100%;
        margin-top: 2%;
        padding-top: 2%;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        flex-shrink: 0;
    }

    .yt-info-extra__item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
    }

    .yt-info-extra__label {
        font-size: clamp(7px, 0.6vw, 10px);
        color: rgba(255, 255, 255, 0.35);
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    .yt-info-extra__val {
        font-size: clamp(10px, 0.9vw, 16px);
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
        font-variant-numeric: tabular-nums;
    }

    .yt-info-extra__divider {
        font-size: clamp(10px, 0.9vw, 16px);
        color: rgba(255, 255, 255, 0.2);
    }

    /* Nama masjid */
    .yt-info-masjid {
        font-size: clamp(8px, 0.65vw, 11px);
        color: rgba(255, 255, 255, 0.25);
        text-align: center;
        letter-spacing: 0.08em;
        margin-top: 2%;
        flex-shrink: 0;
        padding: 0 4%;
        line-height: 1.4;
    }
</style>
