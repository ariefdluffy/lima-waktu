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
    }

    let {
        payload,
        nextPrayerName,
        nextPrayerTime,
        countdown,
        countdownProgress,
        iqamahTime,
        activePrayerIndex,
    }: Props = $props();

    let currentYoutubeIndex = $state(0);
    let youtubePlayer: any = $state(null);
    let iframeRef: HTMLIFrameElement | null = $state(null);

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
        youtubePlayer.setVolume(30); // Set volume ke 30%
    }

    onMount(() => {
        // Setup YouTube IFrame API listener
        const handleYoutubeStateChange = (event: any) => {
            // Simpan player reference
            youtubePlayer = event.target;

            // Set volume ke 30% ketika player ready
            if (event.data === 1) {
                // 1 = PLAYING
                setYoutubeVolume();
            }

            // State 0 = ENDED
            if (event.data === 0) {
                playNextVideo();
            }
        };

        // Expose handler globally untuk YouTube API
        (window as any).onYoutubeStateChange = handleYoutubeStateChange;
    });
</script>

<main class="main-body--youtube">
    <!-- VIDEO FULL AREA -->
    <div class="yt-video-backdrop">
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
        {#if payload.youtubeItems[currentYoutubeIndex].title}
            <div class="yt-video-label">
                {payload.youtubeItems[currentYoutubeIndex].title}
                {#if payload.youtubeItems.length > 1}
                    <span class="yt-video-counter">
                        ({currentYoutubeIndex + 1}/{payload.youtubeItems
                            .length})
                    </span>
                {/if}
            </div>
        {/if}
    </div>

    <!-- INFO OVERLAY -->
    <aside class="yt-info-overlay">
        <!-- NEXT PRAYER -->
        <div class="ov-next-section">
            <div class="ov-next-label">WAKTU BERIKUTNYA</div>
            <div class="ov-next-name">{nextPrayerName}</div>
            <div class="ov-next-time">{nextPrayerTime}</div>
        </div>

        <!-- COUNTDOWN -->
        <div class="ov-countdown-box">
            <div class="ov-countdown-label">MENUJU ADZAN</div>
            <div class="ov-countdown-val">{countdown}</div>
            <div class="ov-progress-track">
                <div
                    class="ov-progress-fill"
                    style="width: {countdownProgress}%"
                ></div>
            </div>
        </div>

        {#if iqamahTime}
            <div class="ov-iqamah-box">
                <span class="ov-iqamah-label">IQAMAH</span>
                <span class="ov-iqamah-val">{iqamahTime}</span>
            </div>
        {/if}

        <!-- PRAYER LIST -->
        <div class="ov-prayer-list">
            {#each PRAYER_ORDER as prayer, idx}
                <div
                    class="ov-prayer-row"
                    class:ov-prayer-row--active={idx === activePrayerIndex}
                >
                    <span class="ov-prayer-icon">{PRAYER_ICONS[prayer]}</span>
                    <span class="ov-prayer-name">{PRAYER_LABELS[prayer]}</span>
                    <span class="ov-prayer-time"
                        >{payload.schedule.resolved?.[prayer] ?? "--:--"}</span
                    >
                </div>
            {/each}
        </div>

        <!-- IMSAKIYAH -->
        <!-- <div class="ov-imsak-card">
            <div class="ov-imsak-title">IMSAKIYAH</div>
            <div class="ov-imsak-row">
                <div>
                    <div class="ov-imsak-sub">Imsak</div>
                    <div class="ov-imsak-val">
                        {payload.schedule.resolved?.imsak ?? "--:--"}
                    </div>
                </div>
                <div class="ov-imsak-sep">—</div>
                <div>
                    <div class="ov-imsak-sub">Syuruq</div>
                    <div class="ov-imsak-val">
                        {payload.schedule.resolved?.sunrise ?? "--:--"}
                    </div>
                </div>
            </div>
        </div> -->
    </aside>
</main>

<style>
    /* ─── MAIN CONTAINER ─── */
    .main-body--youtube {
        position: absolute;
        top: calc(14% + 3px);
        bottom: 8%;
        left: 0;
        right: 0;
    }

    /* ─── VIDEO BACKDROP ─── */
    .yt-video-backdrop {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        background: #000;
        border-right: 4px solid rgba(251, 191, 36, 0.6);
        box-shadow: -8px 0 20px rgba(251, 191, 36, 0.15);
    }

    .yt-iframe {
        width: 100%;
        flex: 1;
        border: none;
    }

    .yt-video-label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
        color: #fff;
        font-size: clamp(14px, 1.2vw, 24px);
        padding: 4% 4% 2%;
        text-align: center;
        pointer-events: none;
    }

    .yt-video-counter {
        font-size: clamp(10px, 0.8vw, 16px);
        color: rgba(255, 255, 255, 0.6);
        margin-left: 0.5em;
    }

    /* ─── INFO OVERLAY ─── */
    .yt-info-overlay {
        position: absolute;
        top: 8%;
        left: 2.5%;
        width: 24%;
        max-height: 95%;
        display: flex;
        flex-direction: column;
        padding: 1.8% 2.2%;
        gap: 0.6%;
        background: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        overflow: hidden;
    }

    /* ─── NEXT PRAYER ─── */
    .ov-next-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex-shrink: 0;
    }

    .ov-next-label {
        font-size: clamp(12px, 1.2vw, 30px);
        color: rgba(255, 255, 255, 0.55);
        letter-spacing: 0.18em;
        text-transform: uppercase;
        line-height: 1;
    }

    .ov-next-name {
        font-family: var(--font-heading), serif;
        font-size: clamp(22px, 3.4vw, 48px);
        font-weight: 700;
        color: #fbbf24;
        text-align: center;
        line-height: 1.15;
        margin-top: 2px;
    }

    .ov-next-time {
        font-size: clamp(36px, 5vw, 84px);
        font-weight: 700;
        color: #fff;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
        line-height: 1;
        margin-top: 2px;
    }

    /* ─── COUNTDOWN ─── */
    .ov-countdown-box {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 1% 5%;
        text-align: center;
        width: 100%;
        flex-shrink: 0;
        box-sizing: border-box;
    }

    .ov-countdown-label {
        font-size: clamp(10px, 0.8vw, 16px);
        color: rgba(255, 255, 255, 0.45);
        letter-spacing: 0.14em;
        line-height: 1.2;
    }

    .ov-countdown-val {
        font-size: clamp(18px, 2.8vw, 46px);
        font-weight: 700;
        color: #34d399;
        font-variant-numeric: tabular-nums;
        line-height: 1.3;
    }

    .ov-progress-track {
        margin-top: 4px;
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: 2px;
        overflow: hidden;
    }

    .ov-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #34d399, #10b981);
        border-radius: 2px;
        transition: width 1s linear;
    }

    /* ─── IQAMAH ─── */
    .ov-iqamah-box {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3%;
        background: rgba(251, 191, 36, 0.12);
        border: 1px solid rgba(251, 191, 36, 0.25);
        border-radius: 10px;
        padding: 0.6% 4%;
        width: 100%;
        flex-shrink: 0;
        box-sizing: border-box;
        margin-top: 2%;
    }

    .ov-iqamah-label {
        font-size: clamp(10px, 0.8vw, 36px);
        color: rgba(251, 191, 36, 0.7);
        letter-spacing: 0.12em;
        line-height: 1.2;
    }

    .ov-iqamah-val {
        font-size: clamp(16px, 2.8vw, 42px);
        color: #fbbf24;
        font-weight: 600;
        line-height: 1.2;
    }

    /* ─── PRAYER LIST ─── */
    .ov-prayer-list {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5%;
        flex: 1;
        min-height: 0;
        justify-content: center;
        margin-top: 2%;
    }

    .ov-prayer-row {
        display: flex;
        align-items: center;
        gap: 3%;
        padding: 0.4% 3%;
        margin-top: 1%;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .ov-prayer-row--active {
        background: rgba(52, 211, 153, 0.15);
        border-color: rgba(52, 211, 153, 0.35);
    }

    .ov-prayer-icon {
        font-size: clamp(11px, 0.9vw, 18px);
        width: 10%;
        text-align: center;
        flex-shrink: 0;
    }

    .ov-prayer-name {
        flex: 1;
        font-size: clamp(11px, 0.9vw, 18px);
        color: rgba(255, 255, 255, 0.85);
        letter-spacing: 0.04em;
        line-height: 1.3;
    }

    .ov-prayer-row--active .ov-prayer-name {
        color: #34d399;
        font-weight: 600;
    }

    .ov-prayer-time {
        font-size: clamp(12px, 1.1vw, 32px);
        font-weight: 700;
        color: #fff;
        font-variant-numeric: tabular-nums;
        line-height: 1.3;
    }

    /* ─── IMSAKIYAH ─── */
    .ov-imsak-card {
        width: 100%;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.2% 4%;
        flex-shrink: 0;
        box-sizing: border-box;
    }

    .ov-imsak-title {
        font-size: clamp(9px, 0.7vw, 14px);
        color: rgba(255, 255, 255, 0.5);
        letter-spacing: 0.14em;
        line-height: 1.1;
    }

    .ov-imsak-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1%;
    }

    .ov-imsak-sub {
        font-size: clamp(9px, 0.7vw, 14px);
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.1;
    }

    .ov-imsak-val {
        font-size: clamp(14px, 1.4vw, 28px);
        font-weight: 600;
        color: #fff;
        line-height: 1.2;
    }

    .ov-imsak-sep {
        color: rgba(255, 255, 255, 0.25);
        font-size: clamp(14px, 1.4vw, 28px);
    }
</style>
