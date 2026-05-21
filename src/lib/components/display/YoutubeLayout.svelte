<script lang="ts">
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
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&enablejsapi=1&playsinline=1&iv_load_policy=3`;
    }
</script>

<main class="main-body main-body--youtube">
    <!-- LEFT INFO PANEL (30%) -->
    <aside class="yt-info-panel">
        <div class="next-label">WAKTU BERIKUTNYA</div>
        <div class="next-prayer-name">{nextPrayerName}</div>
        <div class="next-prayer-time">{nextPrayerTime}</div>
        <div class="countdown-box">
            <span class="countdown-label">MENUJU ADZAN</span>
            <div class="countdown-val">{countdown}</div>
            <div class="progress-track">
                <div
                    class="progress-fill"
                    style="width: {countdownProgress}%"
                ></div>
            </div>
        </div>
        {#if iqamahTime}
            <div class="iqamah-box">
                <div class="iqamah-label">IQAMAH</div>
                <div class="iqamah-val">{iqamahTime}</div>
            </div>
        {/if}

        <div class="yt-prayer-list">
            {#each PRAYER_ORDER as prayer, idx}
                <div
                    class="yt-prayer-row"
                    class:yt-prayer-row--active={idx === activePrayerIndex}
                >
                    <span class="yt-prayer-icon">{PRAYER_ICONS[prayer]}</span>
                    <span class="yt-prayer-name">{PRAYER_LABELS[prayer]}</span>
                    <span class="yt-prayer-time">
                        {payload.schedule.resolved?.[prayer] ?? "--:--"}
                    </span>
                </div>
            {/each}
        </div>

        <div class="yt-imsak-card">
            <div class="info-card-title">IMSAKIYAH</div>
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
    </aside>

    <!-- YOUTUBE PANEL (70%) -->
    <section class="yt-video-panel">
        <iframe
            src={getYoutubeEmbedUrl(payload.youtubeItems[0].youtubeUrl)}
            title={payload.youtubeItems[0].title ?? "Live Streaming"}
            class="yt-iframe"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowfullscreen
        ></iframe>
        {#if payload.youtubeItems[0].title}
            <div class="yt-video-label">{payload.youtubeItems[0].title}</div>
        {/if}
    </section>
</main>

<style>
    .main-body--youtube {
        position: absolute;
        top: calc(14% + 3px);
        bottom: 12%;
        left: 0;
        right: 0;
        display: flex;
        flex-direction: row;
    }

    .yt-info-panel {
        width: 30%;
        display: flex;
        flex-direction: column;
        padding: 2% 2% 2% 2.5%;
        border-right: 1px solid var(--border-accent);
        background: var(--bg-secondary);
        justify-content: flex-start;
        align-items: center;
        gap: 2%;
        overflow: hidden;
    }

    .next-label {
        font-size: clamp(10px, 1vw, 20px);
        color: var(--text-secondary);
        letter-spacing: 0.15em;
        text-transform: uppercase;
    }

    .next-prayer-name {
        font-family: var(--font-heading), serif;
        font-size: clamp(28px, 2.9vw, 56px);
        font-weight: 700;
        color: var(--accent-primary);
        text-align: center;
        line-height: 1.1;
    }

    .next-prayer-time {
        font-size: clamp(48px, 5.2vw, 100px);
        font-weight: 700;
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
        line-height: 1;
    }

    .countdown-box {
        background: var(--running-bar-bg);
        border: 1px solid var(--running-bar-border);
        border-radius: var(--border-radius);
        padding: 2% 6%;
        text-align: center;
        width: 92%;
    }

    .countdown-label {
        font-size: clamp(8px, 0.85vw, 16px);
        color: var(--text-muted);
        letter-spacing: 0.12em;
        display: block;
        margin-bottom: 2px;
    }

    .countdown-val {
        font-size: clamp(22px, 2.7vw, 52px);
        font-weight: 700;
        color: var(--accent-secondary);
        font-variant-numeric: tabular-nums;
    }

    .progress-track {
        margin-top: 6px;
        width: 100%;
        height: 4px;
        background: var(--border-color);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: var(--progress-fill);
        border-radius: 2px;
        transition: width 1s linear;
    }

    .iqamah-box {
        text-align: center;
        width: 92%;
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: var(--border-radius);
        padding: 2% 4%;
    }

    .iqamah-label {
        font-size: clamp(8px, 0.85vw, 16px);
        color: var(--text-muted);
        letter-spacing: 0.1em;
    }

    .iqamah-val {
        font-size: clamp(14px, 1.9vw, 36px);
        color: var(--text-secondary);
        font-weight: 500;
    }

    .yt-prayer-list {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2%;
        margin-top: 2%;
    }

    .yt-prayer-row {
        display: flex;
        align-items: center;
        gap: 4%;
        padding: 2% 4%;
        border-radius: var(--border-radius);
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
    }

    .yt-prayer-row--active {
        background: var(--prayer-active-bg);
        border-color: var(--prayer-active-border);
    }

    .yt-prayer-icon {
        font-size: clamp(10px, 1.2vw, 18px);
        width: 10%;
        text-align: center;
    }

    .yt-prayer-name {
        flex: 1;
        font-size: clamp(9px, 1vw, 15px);
        color: var(--text-secondary);
        letter-spacing: 0.06em;
    }

    .yt-prayer-row--active .yt-prayer-name {
        color: var(--accent-primary);
    }

    .yt-prayer-time {
        font-size: clamp(11px, 1.3vw, 19px);
        font-weight: 700;
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
    }

    .yt-imsak-card {
        width: 100%;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 4% 6%;
        margin-top: 2%;
    }

    .info-card-title {
        font-size: clamp(10px, 1.1vw, 16px);
        color: var(--accent-muted);
        letter-spacing: 0.12em;
        margin-bottom: 4%;
    }

    .info-card-value {
        font-size: clamp(16px, 2vw, 28px);
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.3;
    }

    .info-card-sub {
        font-size: clamp(11px, 1.2vw, 17px);
        color: var(--text-muted);
        margin-top: 2%;
    }

    .imsakiyah-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4%;
    }

    .imsakiyah-time {
        font-size: clamp(18px, 2.2vw, 32px);
    }

    .imsakiyah-sep {
        color: var(--accent-muted);
        font-size: clamp(18px, 2.2vw, 32px);
    }

    .yt-video-panel {
        flex: 1;
        position: relative;
        display: flex;
        flex-direction: column;
        background: #000;
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
        background: linear-gradient(transparent, var(--bg-secondary));
        color: var(--text-secondary);
        font-size: clamp(12px, 1.4vw, 22px);
        padding: 3% 4% 2%;
        text-align: center;
    }
</style>
