<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { dev } from "$app/environment";

    let { error } = $props();
    let status = $derived(error?.status ?? 500);
    let message = $derived(
        error?.body?.message ??
            error?.message ??
            "Terjadi kesalahan pada server.",
    );
    let countdown = $state(30);

    onMount(() => {
        const interval = setInterval(() => {
            countdown -= 1;
            if (countdown <= 0) {
                window.location.reload();
            }
        }, 1000);
        return () => clearInterval(interval);
    });
</script>

<svelte:head>
    <title>Error {status} — Display TV</title>
</svelte:head>

<div class="error-page">
    <!-- Background decorative -->
    <div class="bg-pattern"></div>

    <div class="error-card">
        <!-- Icon -->
        <div class="error-icon">
            {#if status === 404}
                🔍
            {:else if status === 500}
                ⚠️
            {:else}
                ❌
            {/if}
        </div>

        <!-- Status code -->
        <div class="error-code">{status}</div>

        <!-- Title -->
        <h1 class="error-title">
            {#if status === 404}
                Halaman Tidak Ditemukan
            {:else if status === 500}
                Gangguan Server
            {:else}
                Terjadi Kesalahan
            {/if}
        </h1>

        <!-- Message -->
        <p class="error-message">{message}</p>

        <!-- Petunjuk -->
        <div class="error-guide">
            <p class="guide-title">📋 Yang perlu dilakukan:</p>
            <ol class="guide-list">
                <li>Segera hubungi pengurus masjid atau operator IT.</li>
                <li>Sampaikan kode error: <strong>{status}</strong></li>
                <li>
                    Info tambahan:
                    <span class="mono">{message}</span>
                </li>
                <li>Coba refresh halaman setelah beberapa saat.</li>
            </ol>
        </div>

        <!-- Auto-reload countdown -->
        <p class="auto-reload">
            Halaman akan refresh otomatis dalam {countdown} detik
        </p>

        <!-- Action -->
        <button class="refresh-btn" onclick={() => window.location.reload()}>
            🔄 Refresh Halaman
        </button>

        {#if dev}
            <details class="dev-detail">
                <summary>Detail Teknis (hanya mode development)</summary>
                <pre>{JSON.stringify(error, null, 2)}</pre>
            </details>
        {/if}
    </div>

    <div class="error-footer">
        <p>© Lima Waktu — Sistem Informasi Masjid</p>
    </div>
</div>

<style>
    .error-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: linear-gradient(
            135deg,
            #0a0f1e 0%,
            #1a1f2e 50%,
            #0f1525 100%
        );
        position: relative;
        overflow: hidden;
    }

    .bg-pattern {
        position: absolute;
        inset: 0;
        background-image:
            radial-gradient(
                ellipse at 20% 50%,
                rgba(16, 185, 129, 0.08) 0%,
                transparent 50%
            ),
            radial-gradient(
                ellipse at 80% 50%,
                rgba(52, 211, 153, 0.06) 0%,
                transparent 50%
            ),
            radial-gradient(
                ellipse at 50% 80%,
                rgba(6, 95, 70, 0.1) 0%,
                transparent 50%
            );
        pointer-events: none;
    }

    .error-card {
        position: relative;
        z-index: 1;
        max-width: 480px;
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 48px 32px 36px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .error-icon {
        font-size: 64px;
        margin-bottom: 12px;
        line-height: 1;
        filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.3));
    }

    .error-code {
        font-size: 72px;
        font-weight: 800;
        line-height: 1;
        background: linear-gradient(135deg, #f59e0b, #ef4444);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 8px;
        font-family: "Exo 2", system-ui, sans-serif;
    }

    .error-title {
        font-size: 20px;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 12px;
        font-family: "Exo 2", system-ui, sans-serif;
    }

    .error-message {
        font-size: 14px;
        color: #94a3b8;
        margin: 0 0 28px;
        line-height: 1.6;
        font-family: "Exo 2", system-ui, sans-serif;
    }

    .error-guide {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 20px 24px;
        margin-bottom: 28px;
        text-align: left;
    }

    .guide-title {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0 0 12px;
        font-family: "Exo 2", system-ui, sans-serif;
    }

    .guide-list {
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
        color: #94a3b8;
        line-height: 1.8;
        font-family: "Exo 2", system-ui, sans-serif;
    }

    .guide-list li {
        margin-bottom: 4px;
    }

    .guide-list strong {
        color: #fbbf24;
    }

    .mono {
        font-family: "Courier New", monospace;
        background: rgba(255, 255, 255, 0.08);
        padding: 1px 8px;
        border-radius: 4px;
        font-size: 12px;
        color: #e2e8f0;
        word-break: break-all;
    }

    .refresh-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #059669, #10b981);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 14px 32px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        font-family: "Exo 2", system-ui, sans-serif;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
    }

    .refresh-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(5, 150, 105, 0.4);
    }

    .refresh-btn:active {
        transform: translateY(0);
    }

    .auto-reload {
        font-size: 13px;
        color: #64748b;
        margin: 0 0 16px;
        font-family: "Exo 2", system-ui, sans-serif;
    }

    .dev-detail {
        margin-top: 20px;
        text-align: left;
    }

    .dev-detail summary {
        font-size: 12px;
        color: #64748b;
        cursor: pointer;
        font-family: "Exo 2", system-ui, sans-serif;
    }

    .dev-detail pre {
        font-size: 11px;
        color: #94a3b8;
        background: rgba(0, 0, 0, 0.3);
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin-top: 8px;
        max-height: 200px;
    }

    .error-footer {
        position: relative;
        z-index: 1;
        margin-top: 32px;
        font-size: 12px;
        color: #475569;
        font-family: "Exo 2", system-ui, sans-serif;
    }
</style>
