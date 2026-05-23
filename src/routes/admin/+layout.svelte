<script lang="ts">
    import Toast from "$lib/components/admin/Toast.svelte";

    let { children, data } = $props();

    function dismissAnnouncement(id: number) {
        const el = document.getElementById("ann-" + id);
        if (el) el.remove();
    }

    const SEVERITY_COLORS: Record<string, string> = {
        info: "border-blue-200 bg-blue-50 text-blue-800",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
        critical: "border-red-200 bg-red-50 text-red-800",
    };
</script>

{#if data.announcements?.length > 0}
    <div class="space-y-1 px-4 pt-4 sm:px-6 lg:px-8">
        {#each data.announcements as a}
            <div
                id="ann-{a.id}"
                class="flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm {SEVERITY_COLORS[
                    a.severity
                ] ?? SEVERITY_COLORS['info']}"
            >
                <div class="flex-1">
                    <span class="font-semibold">{a.title}</span>
                    {#if a.content}
                        <span class="ml-1">— {a.content}</span>
                    {/if}
                </div>
                <button
                    class="shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100"
                    onclick={() => dismissAnnouncement(a.id)}
                    aria-label="Tutup">✕</button
                >
            </div>
        {/each}
    </div>
{/if}

{@render children()}

<Toast />
