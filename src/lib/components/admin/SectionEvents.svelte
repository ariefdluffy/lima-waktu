<script lang="ts">
    import Pagination from "$lib/components/Pagination.svelte";

    let {
        data,
        askDeleteEvent,
    }: {
        data: any;
        askDeleteEvent: (id: number, title: string) => void;
    } = $props();
</script>

<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Hari Besar</h2>
            <p class="mt-0.5 text-xs text-slate-500">
                Atur acara / hari besar yang muncul di layar.
            </p>
        </div>
    </div>
    <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div class="space-y-3">
            <form method="POST" action="?/addEvent" class="space-y-3">
                <input type="hidden" name="masjid_id" value={data.masjid.id} />
                <input
                    type="text"
                    name="title"
                    placeholder="Judul Acara"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                />
                <textarea
                    name="description"
                    rows="2"
                    placeholder="Deskripsi (opsional)"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                ></textarea>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs font-medium text-slate-500"
                            >Tanggal</label
                        >
                        <input
                            type="date"
                            name="event_date"
                            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label class="text-xs font-medium text-slate-500"
                            >Jam (opsional)</label
                        >
                        <input
                            type="time"
                            name="event_time"
                            class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                        />
                    </div>
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        name="countdown_enabled"
                        value="1"
                        checked
                        class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Aktifkan countdown
                </label>
                <button
                    type="submit"
                    class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >Tambah Acara</button
                >
            </form>
        </div>
        <div class="space-y-2 max-h-80 overflow-y-auto">
            {#each data.events as item}
                <div
                    class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                >
                    <p class="text-sm font-semibold text-slate-700">
                        {item.title}
                    </p>
                    {#if item.description}
                        <p class="mt-1 text-xs text-slate-500">
                            {item.description}
                        </p>
                    {/if}
                    <p class="mt-1 text-xs text-slate-400">
                        {item.eventDate}
                        {#if item.eventTime}{item.eventTime}{/if}
                        {#if item.countdownEnabled}&middot; Countdown ON{/if}
                    </p>
                    <button
                        type="button"
                        class="mt-2 text-xs font-medium text-red-500 hover:text-red-700"
                        onclick={() =>
                            askDeleteEvent(item.id, item.title ?? "Acara")}
                        >Hapus</button
                    >
                </div>
            {/each}
            {#if data.events.length === 0}
                <p class="text-xs italic text-slate-400">Belum ada acara.</p>
            {/if}
        </div>
    </div>
    <Pagination
        currentPage={data.eventPage}
        totalPages={data.eventTotalPages}
        totalItems={data.eventTotal}
        paramName="pageEV"
    />
</section>
