<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";
    import Pagination from "$lib/components/Pagination.svelte";
    import { DEFAULT_RUNNING_TEXT } from "$lib/display/helpers";

    let { data, isExpired = false }: { data: any; isExpired?: boolean } = $props();

    function refresh() {
        return async ({ result }: { result: any }) => {
            if (result.type === "success" || result.type === "redirect") {
                await invalidate("app:admin");
            }
        };
    }
</script>

<section class="space-y-5">
    <!-- Form Tambah -->
    <div class="rounded-2xl bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
            <div>
                <h2 class="text-lg font-semibold text-emerald-900">📜 Running Text</h2>
                <p class="mt-0.5 text-xs text-slate-500">Teks berjalan yang tampil di layar TV masjid.</p>
            </div>
            <span class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {data.runningTexts.length} teks
            </span>
        </div>

        <form
            method="POST"
            action="?/addRunningText"
            use:enhance={refresh}
            class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
        >
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tambah Teks Baru</p>
            <input type="hidden" name="masjid_id" value={data.masjid.id} />
            <div class="flex flex-col gap-3">
                <div>
                    <label for="rt-content" class="mb-1 block text-xs font-medium text-slate-600">
                        Isi Teks
                    </label>
                    <input
                        id="rt-content"
                        name="content"
                        type="text"
                        placeholder="cth: Pengajian rutin setiap Ahad pagi pukul 07.00"
                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                </div>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div class="flex-1">
                        <label for="rt-speed" class="mb-1 block text-xs font-medium text-slate-600">
                            Kecepatan <span class="font-normal text-slate-400">(10–200 detik)</span>
                        </label>
                        <input
                            id="rt-speed"
                            name="speed"
                            type="number"
                            min="10"
                            max="200"
                            value="60"
                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:w-32"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isExpired}
                        class="shrink-0 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all {isExpired ? 'opacity-50 cursor-not-allowed' : ''}"
                    >
                        + Tambah
                    </button>
                </div>
            </div>
        </form>
    </div>

    <!-- List -->
    <div class="rounded-2xl bg-white p-5 shadow-sm">
        {#if data.runningTexts.length === 0}
            <div class="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 p-5 text-center">
                <p class="text-sm font-medium text-amber-700">Running text kosong</p>
                <p class="mt-1 text-xs text-amber-500">
                    Tidak ada teks yang tampil — default: "{DEFAULT_RUNNING_TEXT}"
                </p>
            </div>
        {:else}
            <div class="space-y-2">
                {#each data.runningTexts as item}
                    <div class="rounded-xl border border-emerald-100 bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                        <!-- Baris ringkasan -->
                        <details class="group">
                            <summary class="flex cursor-pointer items-start gap-3 px-4 py-3 sm:items-center">
                                <!-- Icon -->
                                <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 sm:mt-0">
                                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                </span>
                                <!-- Konten -->
                                <div class="min-w-0 flex-1">
                                    <p class="line-clamp-2 text-sm text-slate-700 sm:truncate sm:line-clamp-none">
                                        {item.content}
                                    </p>
                                </div>
                                <!-- Speed badge -->
                                <span class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                    {item.speed ?? 60}s
                                </span>
                            </summary>

                            <!-- Edit form -->
                            <div class="border-t border-emerald-50 px-4 pb-4 pt-3">
                                <form
                                    method="POST"
                                    action="?/editRunningText"
                                    use:enhance={refresh}
                                    class="space-y-3"
                                >
                                    <input type="hidden" name="id" value={item.id} />
                                    <div>
                                        <label for="edit-content-{item.id}" class="mb-1 block text-xs text-slate-500">Isi Teks</label>
                                        <textarea
                                            id="edit-content-{item.id}"
                                            name="content"
                                            rows="2"
                                            class="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                        >{item.content}</textarea>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-3">
                                        <div class="flex items-center gap-2">
                                            <label for="speed_{item.id}" class="text-xs text-slate-500">
                                                Kecepatan (detik):
                                            </label>
                                            <input
                                                id="speed_{item.id}"
                                                type="number"
                                                name="speed"
                                                min="10"
                                                max="300"
                                                value={item.speed ?? 60}
                                                class="w-20 rounded-lg border border-emerald-200 px-2 py-1.5 text-center text-sm focus:border-emerald-400 focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isExpired}
                                            class="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors {isExpired ? 'opacity-50 cursor-not-allowed' : ''}"
                                        >Simpan</button>
                                    </div>
                                </form>

                                <form
                                    method="POST"
                                    action="?/deleteRunningText"
                                    use:enhance={refresh}
                                    class="mt-2"
                                    onsubmit={(e) => {
                                        if (!confirm("Hapus running text ini?")) e.preventDefault();
                                    }}
                                >
                                    <input type="hidden" name="id" value={item.id} />
                                    <button
                                        type="submit"
                                        disabled={isExpired}
                                        class="rounded-lg border border-red-200 px-4 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors {isExpired ? 'opacity-50 cursor-not-allowed' : ''}"
                                    >Hapus</button>
                                </form>
                            </div>
                        </details>
                    </div>
                {/each}
            </div>
        {/if}

        <Pagination
            currentPage={data.runningTextPage}
            totalPages={data.runningTextTotalPages}
            totalItems={data.runningTextTotal}
            paramName="pageRT"
        />
    </div>
</section>
