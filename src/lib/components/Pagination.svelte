<script lang="ts">
    let {
        currentPage,
        totalPages,
        totalItems,
        paramName,
    }: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        paramName: string;
    } = $props();

    import { page } from "$app/stores";

    function buildUrl(value: number): string {
        const u = new URL($page.url);
        u.searchParams.set(paramName, String(value));
        return u.pathname + u.search;
    }

    const label = $derived(
        totalPages <= 1
            ? `${totalItems} data`
            : `Hal ${currentPage} / ${totalPages} · ${totalItems} data`,
    );
</script>

{#if totalPages > 1}
    <div class="mt-3 flex items-center justify-between gap-2">
        <span class="text-xs text-slate-500">{label}</span>
        <div class="flex gap-1">
            <a
                href={buildUrl(currentPage - 1)}
                class="rounded-lg border px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 {currentPage <= 1
                    ? 'pointer-events-none opacity-40'
                    : ''}"
                aria-disabled={currentPage <= 1}
                >&laquo; Prev</a
            >
            {#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
                <a
                    href={buildUrl(p)}
                    class="rounded-lg border px-2 py-1 text-xs font-medium {p === currentPage
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}"
                    >{p}</a
                >
            {/each}
            <a
                href={buildUrl(currentPage + 1)}
                class="rounded-lg border px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 {currentPage >= totalPages
                    ? 'pointer-events-none opacity-40'
                    : ''}"
                aria-disabled={currentPage >= totalPages}
                >Next &raquo;</a
            >
        </div>
    </div>
{:else}
    <p class="mt-2 text-right text-xs text-slate-400">{label}</p>
{/if}
