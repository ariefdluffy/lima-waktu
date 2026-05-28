<script lang="ts">
    interface Props {
        content: string;
    }

    let { content }: Props = $props();
</script>

<footer class="running-bar">
    <div class="running-icon">📢 INFO</div>
    <div class="running-track">
        <div class="running-text">🕌 {content}</div>
    </div>
</footer>

<style>
    .running-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 8%;
        background: var(--running-bar-bg);
        border-top: 1px solid var(--running-bar-border);
        display: flex;
        align-items: center;
        overflow: hidden;
    }

    .running-icon {
        flex-shrink: 0;
        width: 7vw;
        height: 100%;
        background: var(--prayer-active-glow);
        border-right: 1px solid var(--running-bar-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(16px, 1vw, 28px);
        font-weight: 700;
        color: var(--accent-primary);
        letter-spacing: 0.08em;
    }

    .running-track {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        position: relative;
    }

    .running-text {
        display: inline-block;
        font-size: clamp(22px, 2vw, 48px);
        color: var(--text-secondary);
        white-space: nowrap;
        animation: marquee 70s linear infinite;
        will-change: transform;
        padding-left: 100%;
    }

    @keyframes marquee {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(-100%);
        }
    }

    /* ── Penyesuaian Khusus Layar Portrait (Vertikal) ── */
    @media (orientation: portrait) {
        .running-bar {
            height: 6vh; /* Kunci tinggi proporsional */
        }

        .running-icon {
            width: auto;
            padding: 0 4vw; /* Beri ruang horizontal */
            font-size: clamp(12px, 2.5vw, 22px);
            white-space: nowrap;
        }

        .running-text {
            font-size: clamp(16px, 3.2vw, 32px); /* Besarkan font agar sangat jelas */
            font-weight: 500;
        }
    }

    :global(.tv-wrap--mood) .running-bar {
        display: none;
    }
</style>
