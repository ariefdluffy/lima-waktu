<script lang="ts">
    import { page } from "$app/stores";
    import { dev } from "$app/environment";

    let { error } = $props();
    let status = $derived(error?.status ?? 500);
    let message = $derived(
        error?.body?.message ??
            error?.message ??
            "Terjadi kesalahan pada server.",
    );
</script>

<svelte:head>
    <title>Error {status} — Lima Waktu</title>
</svelte:head>

<div class="error-page">
    <div class="error-card">
        <div class="error-icon">
            {#if status === 404}
                🔍
            {:else if status === 500}
                ⚠️
            {:else}
                ❌
            {/if}
        </div>

        <div class="error-code">{status}</div>

        <h1 class="error-title">
            {#if status === 404}
                Halaman Tidak Ditemukan
            {:else if status === 500}
                Gangguan Server
            {:else}
                Terjadi Kesalahan
            {/if}
        </h1>

        <p class="error-message">{message}</p>

        <div class="error-actions">
            <a href="/" class="btn-primary">🏠 Kembali ke Beranda</a>
            <button class="btn-secondary" onclick={() => window.location.reload()}>
                🔄 Coba Lagi
            </button>
        </div>

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
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        position: relative;
        overflow: hidden;
    }

    .error-page::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
            radial-gradient(
                ellipse at 20% 50%,
                rgba(16, 185, 129, 0.08) 0%,
                transparent 50%
            ),
            radial-gradient(
                ellipse at 80% 50%,
                rgba(52, 211, 153, 0.06) 0%,
                transparent 50%
            );
        pointer-events: none;
    }

    .error-card {
        position: relative;
        z-index: 1;
        max-width: 420px;
        width: 100%;
        background: rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 48px 32px 36px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .error-icon {
        font-size: 56px;
        margin-bottom: 12px;
        line-height: 1;
        filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.25));
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
    }

    .error-title {
        font-size: 20px;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 12px;
    }

    .error-message {
        font-size: 14px;
        color: #94a3b8;
        margin: 0 0 28px;
        line-height: 1.6;
        word-break: break-word;
    }

    .error-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: linear-gradient(135deg, #059669, #10b981);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 14px 32px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(5, 150, 105, 0.4);
    }

    .btn-secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.06);
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 14px 32px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
    }

    .dev-detail {
        margin-top: 20px;
        text-align: left;
    }

    .dev-detail summary {
        font-size: 12px;
        color: #64748b;
        cursor: pointer;
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
    }
</style>
