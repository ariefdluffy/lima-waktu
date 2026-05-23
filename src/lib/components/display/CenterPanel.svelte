<script lang="ts">
    import type { DisplayPayload } from "$lib/types/display";
    import {
        PRAYER_ORDER,
        PRAYER_LABELS,
        PRAYER_ICONS,
        DEFAULT_SLIDES,
    } from "$lib/utils/prayer";

    interface Props {
        payload: DisplayPayload;
        activePrayerIndex: number;
        currentSlide: number;
        slideFading: boolean;
        isJumat?: boolean;
    }

    let {
        payload,
        activePrayerIndex,
        currentSlide,
        slideFading,
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
</script>

<section class="center-panel">
    <div class="prayer-grid">
        {#each PRAYER_ORDER as prayer, idx}
            <div class="prayer-card" class:active={idx === activePrayerIndex}>
                <div class="prayer-card-icon">{PRAYER_ICONS[prayer]}</div>
                <div class="prayer-card-name">{PRAYER_LABELS[prayer]}</div>
                <div class="prayer-card-time">
                    {payload.schedule.resolved?.[prayer] ?? "--:--"}
                </div>
                <div class="prayer-iqamah">
                    {#if payload.schedule.iqamah[prayer]?.enabled && !(isJumat && prayer === "dzuhur")}
                        Iqamah {payload.schedule.iqamah[prayer].time}
                    {/if}
                </div>
                {#if idx === activePrayerIndex}
                    <div class="active-badge">BERIKUTNYA</div>
                {/if}
            </div>
        {/each}
    </div>

    <div class="slide-area" class:fade-out={slideFading}>
        {#if payload.slides.length > 0 && payload.slides[currentSlide % payload.slides.length]?.fileUrl}
            <img
                src={payload.slides[currentSlide % payload.slides.length]
                    .fileUrl}
                alt={payload.slides[currentSlide % payload.slides.length]
                    .title ?? "Slide"}
                class="slide-image"
            />
        {:else}
            {@const slide = getCurrentSlideContent()}
            {#if slide}
                <div class="slide-content">
                    <div class="slide-arabic">{slide.arabic}</div>
                    <div class="slide-translation">{slide.trans}</div>
                    <div class="slide-source">{slide.src}</div>
                </div>
            {/if}
        {/if}
        <div class="slide-dots">
            {#each Array(Math.max(payload.slides.length || 3, 3)) as _, i}
                <div class="dot" class:active={i === currentSlide}></div>
            {/each}
        </div>
    </div>
</section>

<style>
    .center-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1.5% 1% 1.5%;
        gap: 1.5%;
    }

    .prayer-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1%;
        height: 45%;
    }

    .prayer-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: var(--border-radius);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2%;
        padding: 2% 2%;
        transition: all 0.3s;
        position: relative;
        overflow: hidden;
    }

    .prayer-card.active {
        background: var(--prayer-active-bg);
        border-color: var(--prayer-active-border);
        animation: pulse-gold 3s ease-in-out infinite;
    }

    @keyframes pulse-gold {
        0%,
        100% {
            box-shadow: 0 0 0 0 var(--prayer-active-glow);
        }
        50% {
            box-shadow: 0 0 20px 4px var(--prayer-active-glow);
        }
    }

    .prayer-card.active::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(
            90deg,
            transparent,
            var(--accent-primary),
            transparent
        );
    }

    .prayer-card-icon {
        font-size: clamp(16px, 2vw, 32px);
        opacity: 0.6;
    }

    .prayer-card.active .prayer-card-icon {
        opacity: 1;
    }

    .prayer-card-name {
        font-size: clamp(14px, 1.8vw, 28px);
        color: var(--text-secondary);
        letter-spacing: 0.08em;
        font-weight: 500;
    }

    .prayer-card.active .prayer-card-name {
        color: var(--accent-primary);
    }

    .prayer-card-time {
        font-size: clamp(28px, 3.2vw, 96px);
        font-weight: 700;
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.03em;
        white-space: nowrap;
    }

    .prayer-iqamah {
        font-size: clamp(10px, 1.4vw, 24px);
        color: var(--text-muted);
        white-space: nowrap;
    }

    .prayer-card.active .prayer-iqamah {
        color: var(--accent-muted);
    }

    .active-badge {
        font-size: clamp(9px, 1vw, 58px);
        background: var(--running-bar-border);
        color: var(--accent-primary);
        padding: 2px 8px;
        border-radius: var(--border-radius);
        letter-spacing: 0.08em;
        font-weight: 600;
    }

    .slide-area {
        flex: 1;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: var(--border-radius);
        overflow: hidden;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1%;
        transition: opacity 0.5s ease;
    }

    .slide-area.fade-out {
        opacity: 0;
    }

    .slide-content {
        text-align: center;
        padding: 3%;
        align-self: center;
    }

    .slide-arabic {
        font-family: var(--font-arabic), serif;
        font-size: clamp(32px, 2.5vw, 54px);
        color: var(--accent-primary);
        line-height: 1.8;
        margin-bottom: 3%;
    }

    .slide-translation {
        font-size: clamp(14px, 1.5vw, 36px);
        color: var(--text-secondary);
        font-style: italic;
        line-height: 1.6;
    }

    .slide-source {
        font-size: clamp(10px, 1.6w, 32px);
        color: var(--accent-muted);
        margin-top: 2%;
        letter-spacing: 0.1em;
    }

    .slide-image {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 4px;
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
        background: var(--accent-secondary);
    }
</style>
