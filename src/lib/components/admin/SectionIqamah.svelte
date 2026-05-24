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
</script>

<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Pengaturan Iqamah</h2>
            <p class="mt-0.5 text-xs text-slate-500">
                Atur jeda menit antara adzan dan iqamah untuk setiap waktu sholat.
            </p>
        </div>
    </div>

    <!-- Durasi Layar Adzan -->
    <div class="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
        <div class="flex-1">
            <label for="adzan-duration" class="text-sm font-medium text-slate-700">Durasi Layar Adzan</label>
            <p class="text-xs text-slate-500">Berapa menit layar "Waktu Adzan" tampil sebelum masuk mode Khusyuk.</p>
        </div>
        <div class="flex items-center gap-2">
            <input
                id="adzan-duration"
                type="number"
                min="1"
                max="15"
                bind:value={adzanDuration}
                class="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm focus:border-emerald-400 focus:outline-none"
            />
            <span class="text-sm text-slate-500">menit</span>
        </div>
    </div>

    <!-- Durasi Layar Khusyuk -->
    <div class="mt-2 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
        <div class="flex-1">
            <label for="khusuk-duration" class="text-sm font-medium text-slate-700">Durasi Layar Khusyuk</label>
            <p class="text-xs text-slate-500">Durasi layar Khusyuk/Iqamah setelah Iqamah selesai.</p>
        </div>
        <div class="flex items-center gap-2">
            <input
                id="khusuk-duration"
                type="number"
                min="1"
                max="30"
                bind:value={khusukDuration}
                class="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm focus:border-emerald-400 focus:outline-none"
            />
            <span class="text-sm text-slate-500">menit</span>
        </div>
    </div>

    <div class="mt-3 flex items-center gap-2">
        <button
            onclick={saveAdzanDuration}
            disabled={adzanDurationSaving}
            class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
            {#if adzanDurationSaving}...{:else}Simpan{/if}
        </button>
        {#if adzanDurationSuccess}
            <span class="text-xs font-medium text-emerald-600">✓</span>
        {/if}
    </div>

    <div class="mt-5 overflow-x-auto">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-slate-100">
                    <th class="pb-2 text-left text-xs font-medium text-slate-500">Waktu Sholat</th>
                    <th class="pb-2 text-center text-xs font-medium text-slate-500">Aktif</th>
                    <th class="pb-2 text-center text-xs font-medium text-slate-500">Jeda (menit)</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                {#each iqamahForm as row, i}
                    <tr class="py-2">
                        <td class="py-3 pr-4">
                            <span class="font-semibold text-slate-700">{PRAYER_LABELS[row.prayerName]}</span>
                        </td>
                        <td class="py-3 text-center">
                            <label class="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    class="peer sr-only"
                                    bind:checked={iqamahForm[i].enabled}
                                />
                                <div
                                    class="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full"
                                ></div>
                            </label>
                        </td>
                        <td class="py-3 text-center">
                            <input
                                type="number"
                                min="0"
                                max="60"
                                bind:value={iqamahForm[i].delayMinutes}
                                disabled={!row.enabled}
                                class="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm disabled:opacity-40 focus:border-emerald-400 focus:outline-none"
                            />
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <div class="mt-5 flex items-center gap-3">
        <button
            onclick={saveIqamah}
            disabled={iqamahSaving}
            class="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
            {#if iqamahSaving}Menyimpan...{:else}Simpan Pengaturan Iqamah{/if}
        </button>
        {#if iqamahSaveSuccess}
            <p class="text-sm font-medium text-emerald-600">✓ Berhasil disimpan.</p>
        {/if}
        {#if iqamahSaveError}
            <p class="text-sm text-red-500">{iqamahSaveError}</p>
        {/if}
    </div>
</section>
