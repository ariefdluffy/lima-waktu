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
        width: 6%;
        height: 100%;
        background: var(--prayer-active-glow);
        border-right: 1px solid var(--running-bar-border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(16px, 2vw, 32px);
        font-weight: 700;
        color: var(--accent-primary);
        letter-spacing: 0.08em;
    }

    .running-track {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
    }

    .running-text {
        display: inline-block;
        font-size: clamp(22px, 2.4vw, 48px);
        color: var(--text-secondary);
        animation: marquee 70s linear infinite;
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

    :global(.tv-wrap--mood) .running-bar {
        display: none;
    }
</style>
