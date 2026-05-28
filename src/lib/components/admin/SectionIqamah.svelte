<script lang="ts">
    let {
        iqamahForm = $bindable(),
        adzanDuration = $bindable(),
        khusukDuration = $bindable(),
        adzanDurationSaving,
        adzanDurationSuccess,
        saveAdzanDuration,
        iqamahSaving,
        iqamahSaveSuccess,
        iqamahSaveError,
        saveIqamah,
        PRAYER_LABELS,
    }: {
        iqamahForm: Array<{ prayerName: string; delayMinutes: number; enabled: boolean }>;
        adzanDuration: number;
        khusukDuration: number;
        adzanDurationSaving: boolean;
        adzanDurationSuccess: boolean;
        saveAdzanDuration: () => void;
        iqamahSaving: boolean;
        iqamahSaveSuccess: boolean;
        iqamahSaveError: string;
        saveIqamah: () => void;
        PRAYER_LABELS: Record<string, string>;
    } = $props();

    const prayerMeta: Record<string, { icon: string; color: string; border: string; bg: string; badge: string; time: string }> = {
        subuh:   { icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z", color: "text-indigo-600", border: "border-indigo-100", bg: "bg-indigo-50", badge: "bg-indigo-100 text-indigo-700", time: "Fajar" },
        dzuhur:  { icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z", color: "text-amber-600", border: "border-amber-100", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700", time: "Siang" },
        ashar:   { icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z", color: "text-orange-600", border: "border-orange-100", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700", time: "Sore" },
        maghrib: { icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z", color: "text-rose-600", border: "border-rose-100", bg: "bg-rose-50", badge: "bg-rose-100 text-rose-700", time: "Petang" },
        isya:    { icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z", color: "text-slate-600", border: "border-slate-200", bg: "bg-slate-50", badge: "bg-slate-100 text-slate-700", time: "Malam" },
        jumat:   { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0", color: "text-emerald-600", border: "border-emerald-100", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", time: "Jum'at" },
    };

    function getMeta(name: string) {
        return prayerMeta[name.toLowerCase()] ?? prayerMeta["dzuhur"];
    }
</script>

<section class="space-y-5">
    <!-- Header -->
    <div class="flex items-center gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </span>
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Pengaturan Iqamah</h2>
            <p class="text-xs text-slate-500">Atur jeda adzan–iqamah dan durasi layar untuk setiap waktu sholat.</p>
        </div>
    </div>

    <!-- Durasi Layar — 2 card sejajar -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <!-- Durasi Adzan -->
        <div class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v6l4 2M12 6a6 6 0 100 12A6 6 0 0012 6z" />
                    </svg>
                </span>
                <div>
                    <p class="text-sm font-semibold text-slate-700">Layar Adzan</p>
                    <p class="text-[11px] text-slate-400">Tampil sebelum mode Khusyuk</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <input
                    id="adzan-duration"
                    type="number"
                    min="1"
                    max="15"
                    bind:value={adzanDuration}
                    class="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-bold text-emerald-700 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <span class="text-sm text-slate-500">menit</span>
            </div>
        </div>

        <!-- Durasi Khusyuk -->
        <div class="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </span>
                <div>
                    <p class="text-sm font-semibold text-slate-700">Layar Khusyuk</p>
                    <p class="text-[11px] text-slate-400">Durasi setelah iqamah selesai</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <input
                    id="khusuk-duration"
                    type="number"
                    min="1"
                    max="30"
                    bind:value={khusukDuration}
                    class="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-bold text-teal-700 shadow-inner focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <span class="text-sm text-slate-500">menit</span>
            </div>
        </div>
    </div>

    <!-- Tombol Simpan Durasi -->
    <div class="flex items-center gap-3">
        <button
            onclick={saveAdzanDuration}
            disabled={adzanDurationSaving}
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
        >
            {#if adzanDurationSaving}
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Menyimpan...
            {:else}
                Simpan Durasi
            {/if}
        </button>
        {#if adzanDurationSuccess}
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Tersimpan
            </span>
        {/if}
    </div>

    <!-- Divider -->
    <div class="flex items-center gap-3">
        <div class="h-px flex-1 bg-slate-100"></div>
        <span class="text-xs font-medium text-slate-400">Jeda Iqamah per Waktu Sholat</span>
        <div class="h-px flex-1 bg-slate-100"></div>
    </div>

    <!-- Card per Waktu Sholat -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each iqamahForm as row, i}
            {@const meta = getMeta(row.prayerName)}
            <div class="rounded-2xl border {meta.border} bg-white p-4 shadow-sm transition-all {row.enabled ? '' : 'opacity-60'}">
                <!-- Header card -->
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2.5">
                        <span class="flex h-9 w-9 items-center justify-center rounded-xl {meta.bg} {meta.color}">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d={meta.icon} />
                            </svg>
                        </span>
                        <div>
                            <p class="text-sm font-bold text-slate-700">{PRAYER_LABELS[row.prayerName]}</p>
                            <p class="text-[11px] text-slate-400">{meta.time}</p>
                        </div>
                    </div>
                    <!-- Toggle -->
                    <label class="relative inline-flex cursor-pointer items-center" title="{row.enabled ? 'Nonaktifkan' : 'Aktifkan'}">
                        <input
                            type="checkbox"
                            class="peer sr-only"
                            bind:checked={iqamahForm[i].enabled}
                        />
                        <div class="peer h-5 w-9 rounded-full bg-slate-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full"></div>
                    </label>
                </div>

                <!-- Jeda input -->
                <div class="flex items-center gap-3">
                    <div class="flex-1">
                        <p class="mb-1 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Jeda Iqamah</p>
                        <div class="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="60"
                                bind:value={iqamahForm[i].delayMinutes}
                                disabled={!row.enabled}
                                class="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-bold {meta.color} shadow-inner transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                            />
                            <span class="text-xs text-slate-400">menit</span>
                        </div>
                    </div>
                    {#if row.enabled}
                        <span class="{meta.badge} rounded-full px-2.5 py-1 text-[11px] font-semibold">Aktif</span>
                    {:else}
                        <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">Nonaktif</span>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <!-- Tombol Simpan Iqamah -->
    <div class="flex items-center gap-3 pt-1">
        <button
            onclick={saveIqamah}
            disabled={iqamahSaving}
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
        >
            {#if iqamahSaving}
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Menyimpan...
            {:else}
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Simpan Pengaturan Iqamah
            {/if}
        </button>
        {#if iqamahSaveSuccess}
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Berhasil disimpan
            </span>
        {/if}
        {#if iqamahSaveError}
            <span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {iqamahSaveError}
            </span>
        {/if}
    </div>
</section>
