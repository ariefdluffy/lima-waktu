<script lang="ts">
    interface Props {
        open: boolean;
        title?: string;
        message?: string;
        confirmLabel?: string;
        cancelLabel?: string;
        onconfirm: () => void;
        oncancel: () => void;
    }

    let {
        open = false,
        title = "Konfirmasi Hapus",
        message = "Apakah kamu yakin ingin menghapus item ini?",
        confirmLabel = "Ya, Hapus",
        cancelLabel = "Batal",
        onconfirm,
        oncancel,
    }: Props = $props();
</script>

{#if open}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="backdrop" onclick={oncancel}>
        <!-- Dialog -->
        <div
            class="dialog"
            onclick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-message"
            tabindex="-1"
        >
            <div class="dialog-icon">🗑️</div>
            <h2 class="dialog-title" id="dialog-title">{title}</h2>
            <p class="dialog-message" id="dialog-message">{message}</p>
            <div class="dialog-actions">
                <button class="btn-cancel" onclick={oncancel}
                    >{cancelLabel}</button
                >
                <button class="btn-confirm" onclick={onconfirm}
                    >{confirmLabel}</button
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: 200;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: backdropIn 0.2s ease-out;
    }

    .dialog {
        background: #fff;
        border-radius: 20px;
        padding: 32px 28px 24px;
        width: 100%;
        max-width: 380px;
        box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.18),
            0 4px 16px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        animation: dialogIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .dialog-icon {
        font-size: 48px;
        margin-bottom: 12px;
        animation: iconShake 0.4s ease-out 0.15s both;
    }

    .dialog-title {
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 8px;
    }

    .dialog-message {
        font-size: 14px;
        color: #64748b;
        margin: 0 0 24px;
        line-height: 1.6;
    }

    .dialog-actions {
        display: flex;
        gap: 10px;
        width: 100%;
    }

    .btn-cancel {
        flex: 1;
        padding: 10px 16px;
        border-radius: 12px;
        border: 1.5px solid #e2e8f0;
        background: #f8fafc;
        color: #475569;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn-cancel:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
    }

    .btn-confirm {
        flex: 1;
        padding: 10px 16px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .btn-confirm:hover {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
        transform: translateY(-1px);
    }

    .btn-confirm:active {
        transform: translateY(0);
    }

    @keyframes backdropIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes dialogIn {
        from {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    @keyframes iconShake {
        0% {
            transform: rotate(0deg);
        }
        20% {
            transform: rotate(-12deg);
        }
        40% {
            transform: rotate(10deg);
        }
        60% {
            transform: rotate(-8deg);
        }
        80% {
            transform: rotate(6deg);
        }
        100% {
            transform: rotate(0deg);
        }
    }
</style>
