<script lang="ts">
    import Pagination from "$lib/components/Pagination.svelte";

    let { data }: { data: any } = $props();
</script>

<article class="rounded-2xl bg-white p-5 shadow-sm">
    <h2 class="text-lg font-semibold text-emerald-900">Tambah YouTube Item</h2>
    <form method="POST" action="?/addYoutube" class="mt-4 space-y-3">
        <input type="hidden" name="masjid_id" value={data.masjid.id} />
        <input
            name="youtube_url"
            placeholder="https://youtube.com/watch?..."
            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
        />
        <input
            name="title"
            placeholder="Judul (opsional)"
            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
        />
        <button class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >Tambah YouTube</button>
    </form>
    <div class="mt-4 space-y-3">
        {#each data.youtubeItems as item}
            <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <details class="group">
                    <summary class="flex cursor-pointer items-center justify-between gap-2">
                        <p class="flex-1 truncate text-sm text-slate-700">
                            {item.title ?? "Video"} &bull; {item.youtubeUrl}
                        </p>
                        <span class="shrink-0 text-xs text-slate-400">#{item.orderIndex}</span>
                    </summary>
                    <div class="mt-3 space-y-2 border-t border-emerald-100 pt-3">
                        <form method="POST" action="?/editYoutube" class="space-y-2">
                            <input type="hidden" name="id" value={item.id} />
                            <input
                                type="url"
                                name="youtube_url"
                                value={item.youtubeUrl}
                                class="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                            />
                            <input
                                type="text"
                                name="title"
                                value={item.title ?? ""}
                                placeholder="Judul (opsional)"
                                class="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                            />
                            <button
                                type="submit"
                                class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                >Simpan</button>
                        </form>
                        <form
                            method="POST"
                            action="?/deleteYoutube"
                            onsubmit={(e) => { if (!confirm("Hapus YouTube item ini?")) e.preventDefault(); }}
                        >
                            <input type="hidden" name="id" value={item.id} />
                            <button type="submit" class="text-xs font-medium text-red-500 hover:text-red-700">Hapus</button>
                        </form>
                    </div>
                </details>
            </div>
        {/each}
        {#if data.youtubeItems.length === 0}
            <p class="text-xs text-slate-400">Belum ada YouTube item.</p>
        {/if}
    </div>
    <Pagination
        currentPage={data.youtubePage}
        totalPages={data.youtubeTotalPages}
        totalItems={data.youtubeTotal}
        paramName="pageYT"
    />
</article>
