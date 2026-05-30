<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { subscribe, dismissToast } from "$lib/stores/toast";
    import type { ToastMessage } from "$lib/stores/toast";

    let toasts: ToastMessage[] = $state([]);
    let unsub: (() => void) | null = null;

    onMount(() => {
        unsub = subscribe((t) => {
            toasts = t;
        });
    });

    onDestroy(() => {
        unsub?.();
    });

    const ICONS: Record<string, string> = {
        success: "\u2714",
        error: "\u2716",
        info: "\u2139",
        neutral: "\u25C6",
    };
</script>

{#if toasts.length > 0}
    <div class="toast-container">
        {#each toasts as toast (toast.id)}
            <div
                class="toast-item {toast.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : toast.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-900'
                      : toast.type === 'info'
                        ? 'border-blue-200 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-slate-50 text-slate-800'}"
                role="alert"
            >
                <span class="toast-icon">{ICONS[toast.type]}</span>
                <span class="toast-message">{toast.message}</span>
                <button
                    class="toast-close"
                    onclick={() => dismissToast(toast.id)}
                    aria-label="Tutup">&times;</button
                >
            </div>
        {/each}
    </div>
{/if}

<style>
    .toast-container {
        position: fixed;
        top: calc(16px + var(--safe-top, 0px));
        right: calc(16px + var(--safe-right, 0px));
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 420px;
        pointer-events: none;
    }
    .toast-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-radius: 12px;
        border-width: 1px;
        border-style: solid;
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.06);
        font-size: 14px;
        font-weight: 500;
        pointer-events: auto;
        animation: toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .toast-icon {
        font-size: 18px;
        flex-shrink: 0;
    }
    .toast-message {
        flex: 1;
        line-height: 1.4;
    }
    .toast-close {
        flex-shrink: 0;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        opacity: 0.5;
        padding: 2px;
        transition: opacity 0.15s;
    }
    .toast-close:hover {
        opacity: 1;
    }
    @keyframes toastIn {
        from {
            opacity: 0;
            transform: translateX(40px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
    }
</style>
