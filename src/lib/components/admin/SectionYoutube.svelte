<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";
    import Pagination from "$lib/components/Pagination.svelte";

    let { data }: { data: any } = $props();

    function refreshYoutube() {
        return async ({ result }: { result: any }) => {
            if (result.type === "success" || result.type === "redirect") {
                await invalidate("app:admin");
            }
        };
    }
</script>

<article class="rounded-2xl bg-white p-5 shadow-sm">
    <h2 class="text-lg font-semibold text-emerald-900">Tambah YouTube Item</h2>
    <form method="POST" action="?/addYoutube" use:enhance={refreshYoutube} class="mt-4 space-y-3">
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

    <div class="mt-4 space-y-2">
        {#if data.youtubeItems.length === 0}
            <p class="text-xs text-slate-400">Belum ada YouTube item.</p>
        {:else}
            <p class="text-xs text-slate-400">
                {data.youtubeItems.length} item · diputar sesuai urutan ↕
            </p>
            {#each data.youtubeItems as item, idx}
                <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <!-- Baris atas: urutan + judul + tombol naik/turun -->
                    <div class="flex items-center gap-2">
                        <!-- Nomor urut -->
                        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                            {idx + 1}
                        </span>

                        <!-- Judul & URL -->
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium text-slate-700">
                                {item.title ?? "Video"}
                            </p>
                            <p class="truncate text-xs text-slate-400">{item.youtubeUrl}</p>
                        </div>

                        <!-- Tombol naik / turun -->
                        <div class="flex shrink-0 flex-col gap-0.5">
                            <form method="POST" action="?/reorderYoutube" use:enhance={refreshYoutube}>
                                <input type="hidden" name="masjid_id" value={data.masjid.id} />
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="direction" value="up" />
                                <button
                                    type="submit"
                                    disabled={idx === 0}
                                    title="Naik"
                                    class="flex h-6 w-6 items-center justify-center rounded bg-white text-slate-500 shadow-sm hover:bg-emerald-100 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
                                >▲</button>
                            </form>
                            <form method="POST" action="?/reorderYoutube" use:enhance={refreshYoutube}>
                                <input type="hidden" name="masjid_id" value={data.masjid.id} />
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="direction" value="down" />
                                <button
                                    type="submit"
                                    disabled={idx === data.youtubeItems.length - 1}
                                    title="Turun"
                                    class="flex h-6 w-6 items-center justify-center rounded bg-white text-slate-500 shadow-sm hover:bg-emerald-100 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
                                >▼</button>
                            </form>
                        </div>
                    </div>

                    <!-- Detail edit (collapsible) -->
                    <details class="mt-2 group">
                        <summary class="cursor-pointer text-xs text-emerald-600 hover:text-emerald-800">
                            Edit / Hapus
                        </summary>
                        <div class="mt-3 space-y-2 border-t border-emerald-100 pt-3">
                            <form method="POST" action="?/editYoutube" use:enhance={refreshYoutube} class="space-y-2">
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
                                use:enhance={refreshYoutube}
                                onsubmit={(e) => { if (!confirm("Hapus YouTube item ini?")) e.preventDefault(); }}
                            >
                                <input type="hidden" name="id" value={item.id} />
                                <button type="submit" class="text-xs font-medium text-red-500 hover:text-red-700">Hapus</button>
                            </form>
                        </div>
                    </details>
                </div>
            {/each}
        {/if}
    </div>

    <Pagination
        currentPage={data.youtubePage}
        totalPages={data.youtubeTotalPages}
        totalItems={data.youtubeTotal}
        paramName="pageYT"
    />
</article>
