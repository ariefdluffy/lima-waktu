<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";
    import Pagination from "$lib/components/Pagination.svelte";
    import { DEFAULT_RUNNING_TEXT } from "$lib/display/helpers";

    let { data }: { data: any } = $props();

    function refresh() {
        return async ({ result }: { result: any }) => {
            if (result.type === "success" || result.type === "redirect") {
                await invalidate("app:admin");
            }
        };
    }
</script>

<article class="rounded-2xl bg-white p-5 shadow-sm">
    <h2 class="text-lg font-semibold text-emerald-900">Tambah Running Text</h2>
    <form
        method="POST"
        action="?/addRunningText"
        use:enhance={refresh}
        class="mt-4 space-y-3"
    >
        <input type="hidden" name="masjid_id" value={data.masjid.id} />
        <input
            name="content"
            placeholder="Informasi untuk jamaah"
            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
        />
        <input
            name="speed"
            type="number"
            min="10"
            max="200"
            value="60"
            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
        />
        <button
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >Simpan</button
        >
    </form>
    <div class="mt-4 space-y-3">
        {#each data.runningTexts as item}
            <div
                class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
            >
                <details class="group">
                    <summary
                        class="flex cursor-pointer items-center justify-between gap-2"
                    >
                        <p class="flex-1 truncate text-sm text-slate-700">
                            {item.content}
                        </p>
                        <span class="shrink-0 text-xs text-slate-400"
                            >{item.speed ?? 60}s</span
                        >
                    </summary>
                    <div
                        class="mt-3 space-y-2 border-t border-emerald-100 pt-3"
                    >
                        <form
                            method="POST"
                            action="?/editRunningText"
                            use:enhance={refresh}
                            class="space-y-2"
                        >
                            <input type="hidden" name="id" value={item.id} />
                            <textarea
                                name="content"
                                rows="2"
                                class="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                >{item.content}</textarea
                            >
                            <div class="flex items-center gap-2">
                                <label
                                    for="speed_{item.id}"
                                    class="text-xs text-slate-500"
                                    >Speed (detik):</label
                                >
                                <input
                                    id="speed_{item.id}"
                                    type="number"
                                    name="speed"
                                    min="10"
                                    max="300"
                                    value={item.speed ?? 60}
                                    class="w-20 rounded-lg border border-emerald-200 px-2 py-1 text-center text-sm"
                                />
                                <button
                                    type="submit"
                                    class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                    >Simpan</button
                                >
                            </div>
                        </form>
                        <form
                            method="POST"
                            action="?/deleteRunningText"
                            use:enhance={refresh}
                            onsubmit={(e) => {
                                if (!confirm("Hapus running text ini?"))
                                    e.preventDefault();
                            }}
                        >
                            <input type="hidden" name="id" value={item.id} />
                            <button
                                type="submit"
                                class="text-xs font-medium text-red-500 hover:text-red-700"
                                >Hapus</button
                            >
                        </form>
                    </div>
                </details>
            </div>
        {/each}
        {#if data.runningTexts.length === 0}
            <div
                class="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3"
            >
                <p class="text-xs text-amber-700 font-medium">
                    Running text kosong — tidak akan tampil di layar display.
                </p>
                <p class="mt-1 text-xs text-amber-500">
                    Default: “{DEFAULT_RUNNING_TEXT}”
                </p>
            </div>
        {/if}
    </div>
    <Pagination
        currentPage={data.runningTextPage}
        totalPages={data.runningTextTotalPages}
        totalItems={data.runningTextTotal}
        paramName="pageRT"
    />
</article>
