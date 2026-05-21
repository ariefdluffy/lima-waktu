<script lang="ts">
    interface Props {
        nextPrayerName: string;
        nextPrayerTime: string;
        countdown: string;
        countdownProgress: number;
        iqamahTime: string;
    }

    let {
        nextPrayerName,
        nextPrayerTime,
        countdown,
        countdownProgress,
        iqamahTime,
    }: Props = $props();
</script>

<aside class="left-panel">
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
        width: 20%;
        display: flex;
        flex-direction: column;
        padding: 2% 2% 0.3% 2.5%;
        border-right: 1px solid rgba(200, 168, 75, 0.2);
        background: rgba(0, 0, 0, 0.2);
        justify-content: center;
        align-items: center;
        align-self: stretch;
        gap: 1.5%;
        overflow: hidden;
    }

    .next-label {
        font-size: clamp(10px, 1vw, 20px);
        color: rgba(255, 255, 255, 0.5);
        letter-spacing: 0.15em;
        text-transform: uppercase;
    }

    .next-prayer-name {
        font-family: "Cinzel", serif;
        font-size: clamp(28px, 2.9vw, 56px);
        font-weight: 700;
        color: #f0d080;
        text-align: center;
        line-height: 1.1;
    }

    .next-prayer-time {
        font-size: clamp(48px, 5.2vw, 100px);
        font-weight: 700;
        color: #fff;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
        line-height: 1;
    }

    .countdown-box {
        background: rgba(200, 168, 75, 0.1);
        border: 1px solid rgba(200, 168, 75, 0.4);
        border-radius: 6px;
        padding: 2% 6%;
        text-align: center;
        width: 92%;
    }

    .countdown-label {
        font-size: clamp(8px, 0.85vw, 16px);
        color: rgba(255, 255, 255, 0.45);
        letter-spacing: 0.12em;
        display: block;
        margin-bottom: 2px;
    }

    .countdown-val {
        font-size: clamp(22px, 2.7vw, 52px);
        font-weight: 700;
        color: #c8a84b;
        font-variant-numeric: tabular-nums;
    }

    .progress-track {
        margin-top: 6px;
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #c8a84b, #f0d080);
        border-radius: 2px;
        transition: width 1s linear;
    }

    .iqamah-box {
        text-align: center;
        width: 92%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 2% 4%;
    }

    .iqamah-label {
        font-size: clamp(8px, 0.85vw, 16px);
        color: rgba(255, 255, 255, 0.4);
        letter-spacing: 0.1em;
    }

    .iqamah-val {
        font-size: clamp(14px, 1.9vw, 36px);
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
    }
</style>
