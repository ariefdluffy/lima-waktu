<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";
    import Pagination from "$lib/components/Pagination.svelte";

    let {
        data,
        askDeleteJumbotron,
        isExpired = false,
    }: {
        data: any;
        askDeleteJumbotron: (id: number, title: string) => void;
        isExpired?: boolean;
    } = $props();

    function refresh() {
        return async ({ result }: { result: any }) => {
            if (result.type === "success" || result.type === "redirect") {
                await invalidate("app:admin");
            }
        };
    }
</script>

<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Jumbotrons</h2>
            <p class="mt-0.5 text-xs text-slate-500">Pesan besar yang tampil di layar TV.</p>
        </div>
    </div>
    <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div class="space-y-3">
            <form method="POST" action="?/addJumbotron" use:enhance={refresh} class="space-y-3">
                <input type="hidden" name="masjid_id" value={data.masjid.id} />
                <input
                    type="text"
                    name="title"
                    placeholder="Judul"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                />
                <textarea
                    name="content"
                    rows="3"
                    placeholder="Isi pesan..."
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                ></textarea>
                <input
                    type="url"
                    name="background_url"
                    placeholder="URL Background (opsional)"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={isExpired}
                    class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 {isExpired ? 'opacity-50 cursor-not-allowed' : ''}"
                    >Tambah Jumbotron</button>
            </form>
        </div>
        <div class="space-y-2 max-h-80 overflow-y-auto">
            {#each data.jumbotrons as item}
                <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p class="text-sm font-semibold text-slate-700">{item.title}</p>
                    <p class="mt-1 text-xs text-slate-500">{item.content}</p>
                    {#if item.backgroundUrl}
                        <p class="mt-1 text-xs text-slate-400 truncate">BG: {item.backgroundUrl}</p>
                    {/if}
                    <button
                        type="button"
                        disabled={isExpired}
                        class="mt-2 text-xs font-medium text-red-500 hover:text-red-700 {isExpired ? 'opacity-50 cursor-not-allowed' : ''}"
                        onclick={() => askDeleteJumbotron(item.id, item.title ?? "Jumbotron")}
                        >Hapus</button>
                </div>
            {/each}
            {#if data.jumbotrons.length === 0}
                <p class="text-xs italic text-slate-400">Belum ada jumbotron.</p>
            {/if}
        </div>
    </div>
    <Pagination
        currentPage={data.jumbotronPage}
        totalPages={data.jumbotronTotalPages}
        totalItems={data.jumbotronTotal}
        paramName="pageJB"
    />
</section>
