<script lang="ts">
    interface Props {
        nextPrayerName: string;
        nextPrayerTime: string;
        countdown: string;
        countdownProgress: number;
        iqamahTime: string;
        liveDate: string;
    }

    let {
        nextPrayerName,
        nextPrayerTime,
        countdown,
        countdownProgress,
        iqamahTime,
        liveDate,
    }: Props = $props();
</script>

<aside class="left-panel">
    <div class="left-date">{liveDate}</div>
    <div class="next-label">WAKTU BERIKUTNYA</div>
    <div class="next-prayer-name">{nextPrayerName}</div>
    <div class="next-prayer-time">{nextPrayerTime}</div>
    <div class="countdown-box">
        <span class="countdown-label">MENUJU ADZAN</span>
        <div class="countdown-val">{countdown}</div>
        <!-- Progress Bar -->
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
</aside>

<style>
    .left-panel {
        width: 23%;
        display: flex;
        flex-direction: column;
        padding: 1% 2% 0.3% 2.5%;
        border-right: 1px solid var(--border-accent);
        background: var(--bg-secondary);
        justify-content: center;
        align-items: center;
        align-self: stretch;
        gap: 1.5%;
        overflow: hidden;
    }

    .left-date {
        font-size: clamp(14px, 2vw, 56px);
        color: var(--accent-primary);
        font-weight: 600;
        margin-bottom: 4px;
    }

    .next-label {
        font-size: clamp(11px, 1.2vw, 48px);
        color: var(--text-secondary);
        letter-spacing: 0.15em;
        text-transform: uppercase;
    }

    .next-prayer-name {
        font-family: var(--font-heading), serif;
        font-size: clamp(32px, 5.5vw, 120px);
        font-weight: 700;
        color: var(--accent-primary);
        text-align: center;
        line-height: 1.1;
    }

    .next-prayer-time {
        font-size: clamp(56px, 7vw, 160px);
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
        padding: 3% 2%;
        text-align: center;
        width: 98%;
    }

    .countdown-label {
        font-size: clamp(9px, 2vw, 40px);
        color: var(--text-muted);
        letter-spacing: 0.12em;
        display: block;
        margin-bottom: 2px;
    }

    .countdown-val {
        font-size: clamp(24px, 5.2vw, 96px);
        font-weight: 700;
        color: var(--accent-secondary);
        font-variant-numeric: tabular-nums;
    }

    .progress-track {
        margin-top: 6px;
        width: 100%;
        height: 8px;
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
        width: 98%;
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: var(--border-radius);
        padding: 2% 2%;
    }

    .iqamah-label {
        font-size: clamp(9px, 2.8vw, 92px);
        color: var(--text-muted);
        letter-spacing: 0.1em;
    }

    .iqamah-val {
        font-size: clamp(16px, 4.3vw, 84px);
        color: var(--text-secondary);
        font-weight: 500;
    }
</style>
