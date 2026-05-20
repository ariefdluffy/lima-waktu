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
        background: rgba(200, 168, 75, 0.12);
        border-top: 1px solid rgba(200, 168, 75, 0.3);
        display: flex;
        align-items: center;
        overflow: hidden;
    }

    .running-icon {
        flex-shrink: 0;
        width: 6%;
        height: 100%;
        background: rgba(200, 168, 75, 0.25);
        border-right: 1px solid rgba(200, 168, 75, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(14px, 1.8vw, 26px);
        font-weight: 700;
        color: #f0d080;
        letter-spacing: 0.08em;
    }

    .running-track {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
    }

    .running-text {
        display: inline-block;
        font-size: clamp(20px, 2.2vw, 42px);
        color: rgba(255, 255, 255, 0.85);
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
