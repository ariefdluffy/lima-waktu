<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";
    import Pagination from "$lib/components/Pagination.svelte";
    import PrayerCorrection from "$lib/components/admin/PrayerCorrection.svelte";

    type KotaResult = { id: string; lokasi: string };
    type BulkSchedule = {
        date: string;
        imsakTime: string;
        subuhTime: string;
        sunriseTime: string;
        dhuhaTime: string;
        dzuhurTime: string;
        asharTime: string;
        maghribTime: string;
        isyaTime: string;
    };
    type Tab = "bulk" | "manual";

    let {
        data,
        askDeleteSchedule,
        confirmResetSchedulesOpen = $bindable(),
        scheduleActionLoading,
        scheduleActionSuccess,
        scheduleActionError,
    }: {
        data: any;
        askDeleteSchedule: (id: number, date: string) => void;
        confirmResetSchedulesOpen: boolean;
        scheduleActionLoading: boolean;
        scheduleActionSuccess: string;
        scheduleActionError: string;
    } = $props();

    let activeTab = $state<Tab>("bulk");
    let kotaKeyword = $state("");
    let kotaResults = $state<KotaResult[]>([]);
    let selectedKota = $state<KotaResult | null>(null);
    let searchLoading = $state(false);
    let searchError = $state("");
    let searchTimeout: ReturnType<typeof setTimeout> | null = null;

    function onKotaInput() {
        if (searchTimeout) clearTimeout(searchTimeout);
        kotaResults = [];
        searchError = "";
        if (!kotaKeyword || kotaKeyword.length < 2) return;
        searchTimeout = setTimeout(async () => {
            searchLoading = true;
            try {
                const res = await fetch(
                    "/api/v1/prayer-fetch?action=search&keyword=" +
                        encodeURIComponent(kotaKeyword),
                );
                const json = await res.json();
                if (json.ok) kotaResults = json.data ?? [];
                else searchError = json.message ?? "Gagal mencari kota.";
            } catch {
                searchError = "Gagal terhubung ke server.";
            } finally {
                searchLoading = false;
            }
        }, 400);
    }

    function selectKota(kota: KotaResult) {
        selectedKota = kota;
        kotaKeyword = kota.lokasi;
        kotaResults = [];
    }

    const now = new Date();
    const MONTH_NAMES = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];
    const YEARS = Array.from(
        { length: 3 },
        (_, i) => now.getFullYear() - 1 + i,
    );
    let bulkYear = $state(now.getFullYear());
    let bulkMonth = $state(String(now.getMonth() + 1).padStart(2, "0"));
    let bulkLoading = $state(false);
    let bulkError = $state("");
    let bulkSuccess = $state("");
    let bulkPreview = $state<BulkSchedule[]>([]);
    let bulkSaving = $state(false);
    let bulkSaveSuccess = $state("");
    let bulkSaveError = $state("");

    async function fetchBulk() {
        const provider = data.prayerProviderInfo?.providerKey ?? "myquran";
        bulkLoading = true;
        bulkError = "";
        bulkPreview = [];
        bulkSuccess = "";
        bulkSaveSuccess = "";
        bulkSaveError = "";
        try {
            let url = "";
            if (data.prayerProviderInfo?.supportsSearch) {
                if (!selectedKota) {
                    bulkError = "Pilih kota terlebih dahulu.";
                    return;
                }
                url =
                    "/api/v1/prayer-fetch?action=bulk&provider=" +
                    provider +
                    "&kota_id=" +
                    selectedKota.id +
                    "&month=" +
                    bulkMonth +
                    "&year=" +
                    bulkYear;
            } else {
                if (!data.masjid?.latitude || !data.masjid?.longitude) {
                    bulkError = "Koordinat masjid belum diisi.";
                    return;
                }
                url =
                    "/api/v1/prayer-fetch?action=bulk&provider=" +
                    provider +
                    "&latitude=" +
                    data.masjid.latitude +
                    "&longitude=" +
                    data.masjid.longitude +
                    "&month=" +
                    bulkMonth +
                    "&year=" +
                    bulkYear +
                    "&timezone=" +
                    (data.masjid.timezone || "Asia/Jakarta");
            }
            const res = await fetch(url);
            const json = await res.json();
            if (!json.ok) {
                bulkError = json.message ?? "Gagal mengambil jadwal.";
                return;
            }
            bulkPreview = json.data ?? [];
            const locationLabel = data.prayerProviderInfo?.supportsSearch
                ? selectedKota?.lokasi
                : (data.masjid?.city ?? "lokasi masjid");
            const monthLabel = MONTH_NAMES[parseInt(bulkMonth) - 1];
            bulkSuccess =
                bulkPreview.length +
                " jadwal berhasil diambil untuk " +
                locationLabel +
                " - " +
                monthLabel +
                " " +
                bulkYear;
        } catch {
            bulkError = "Gagal terhubung ke server.";
        } finally {
            bulkLoading = false;
        }
    }

    async function saveBulk() {
        if (!data.masjid || bulkPreview.length === 0) return;
        bulkSaving = true;
        bulkSaveSuccess = "";
        bulkSaveError = "";
        try {
            const formData = new FormData();
            formData.set("masjid_id", data.masjid.id);
            formData.set("schedules", JSON.stringify(bulkPreview));
            const res = await fetch("?/bulkImportPrayerSchedule", {
                method: "POST",
                body: formData,
            });
            const result = await res.json();
            const saved = (result as any)?.data?.saved ?? bulkPreview.length;
            bulkSaveSuccess = saved + " jadwal berhasil disimpan.";
            bulkPreview = [];
            await invalidate(() => true);
        } catch {
            bulkSaveError = "Gagal menyimpan jadwal.";
        } finally {
            bulkSaving = false;
        }
    }

    let scheduleDate = $state("");
    let imsakTime = $state("");
    let subuhTime = $state("");
    let sunriseTime = $state("");
    let dhuhaTime = $state("");
    let dzuhurTime = $state("");
    let asharTime = $state("");
    let maghribTime = $state("");
    let isyaTime = $state("");
    let manualFetchLoading = $state(false);
    let manualFetchError = $state("");
    let manualFetchSuccess = $state("");

    async function fetchManual() {
        const provider = data.prayerProviderInfo?.providerKey ?? "myquran";
        manualFetchLoading = true;
        manualFetchError = "";
        manualFetchSuccess = "";
        try {
            let url = "";
            if (data.prayerProviderInfo?.supportsSearch) {
                if (!selectedKota) {
                    manualFetchError = "Pilih kota terlebih dahulu.";
                    return;
                }
                url =
                    "/api/v1/prayer-fetch?action=schedule&provider=" +
                    provider +
                    "&kota_id=" +
                    selectedKota.id +
                    "&date=" +
                    scheduleDate;
            } else {
                if (!data.masjid?.latitude || !data.masjid?.longitude) {
                    manualFetchError = "Koordinat masjid belum diisi.";
                    return;
                }
                url =
                    "/api/v1/prayer-fetch?action=schedule&provider=" +
                    provider +
                    "&latitude=" +
                    data.masjid.latitude +
                    "&longitude=" +
                    data.masjid.longitude +
                    "&date=" +
                    scheduleDate +
                    "&timezone=" +
                    (data.masjid.timezone || "Asia/Jakarta");
            }
            const res = await fetch(url);
            const json = await res.json();
            if (!json.ok) {
                manualFetchError = json.message ?? "Gagal mengambil jadwal.";
                return;
            }
            const d = json.data;
            imsakTime = d.imsakTime ?? "";
            subuhTime = d.subuhTime ?? "";
            sunriseTime = d.sunriseTime ?? "";
            dhuhaTime = d.dhuhaTime ?? "";
            dzuhurTime = d.dzuhurTime ?? "";
            asharTime = d.asharTime ?? "";
            maghribTime = d.maghribTime ?? "";
            isyaTime = d.isyaTime ?? "";
            manualFetchSuccess = "Data berhasil diambil dari API.";
        } catch {
            manualFetchError = "Gagal terhubung ke server.";
        } finally {
            manualFetchLoading = false;
        }
    }
</script>

<!-- Daftar Jadwal Tersimpan -->
<section class="rounded-2xl bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-emerald-900">Jadwal Tersimpan</h2>
        {#if data.prayerScheduleList.length > 0 || data.prayerTotal > 0}
            <button
                type="button"
                onclick={() => (confirmResetSchedulesOpen = true)}
                disabled={scheduleActionLoading}
                class="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
                Reset Semua
            </button>
        {/if}
    </div>

    {#if scheduleActionSuccess}
        <div
            class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
        >
            ✓ {scheduleActionSuccess}
        </div>
    {/if}
    {#if scheduleActionError}
        <div
            class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600"
        >
            ✗ {scheduleActionError}
        </div>
    {/if}

    <div class="mt-4 overflow-x-auto">
        <table class="w-full text-xs">
            <thead>
                <tr
                    class="border-b border-emerald-100 text-left text-slate-500"
                >
                    <th class="pb-1 pr-2 font-medium">Tanggal</th>
                    <th class="pb-1 pr-2 font-medium">Imsak</th>
                    <th class="pb-1 pr-2 font-medium">Subuh</th>
                    <th class="pb-1 pr-2 font-medium">Dzuhur</th>
                    <th class="pb-1 pr-2 font-medium">Ashar</th>
                    <th class="pb-1 pr-2 font-medium">Maghrib</th>
                    <th class="pb-1 pr-2 font-medium">Isya</th>
                    <th class="pb-1 font-medium"></th>
                </tr>
            </thead>
            <tbody>
                {#each data.prayerScheduleList as s}
                    <tr class="border-b border-emerald-50 hover:bg-emerald-50">
                        <td class="py-1 pr-2 font-medium text-slate-700">
                            {new Date(s.scheduleDate).toLocaleDateString(
                                "id-ID",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                },
                            )}
                        </td>
                        <td class="py-1 pr-2 text-slate-600">{s.imsakTime}</td>
                        <td class="py-1 pr-2 text-slate-600">{s.subuhTime}</td>
                        <td class="py-1 pr-2 text-slate-600">{s.dzuhurTime}</td>
                        <td class="py-1 pr-2 text-slate-600">{s.asharTime}</td>
                        <td class="py-1 pr-2 text-slate-600">{s.maghribTime}</td
                        >
                        <td class="py-1 pr-2 text-slate-600">{s.isyaTime}</td>
                        <td class="py-1">
                            <button
                                type="button"
                                onclick={() =>
                                    askDeleteSchedule(
                                        s.id,
                                        String(s.scheduleDate),
                                    )}
                                disabled={scheduleActionLoading}
                                class="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                                title="Hapus jadwal ini"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-3.5 w-3.5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fill-rule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </button>
                        </td>
                    </tr>
                {/each}
                {#if data.prayerScheduleList.length === 0}
                    <tr>
                        <td colspan="8" class="py-3 text-center text-slate-400"
                            >Belum ada jadwal tersimpan.</td
                        >
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
    <Pagination
        currentPage={data.prayerPage}
        totalPages={data.prayerTotalPages}
        totalItems={data.prayerTotal}
        paramName="pagePR"
    />
</section>

<!-- Prayer Correction Section -->
<section class="rounded-2xl bg-white p-6 shadow-sm">
    <PrayerCorrection corrections={data.prayerCorrections || []} />
</section>

<section class="rounded-2xl bg-white p-6 shadow-sm">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">
                Jadwal Sholat
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">
                Import otomatis dari API atau input manual per hari
            </p>
        </div>
        <div
            class="flex rounded-xl border border-emerald-200 bg-emerald-50 p-1 text-sm"
        >
            <button
                type="button"
                onclick={() => (activeTab = "bulk")}
                class="rounded-lg px-4 py-1.5 font-medium transition-all {activeTab ===
                'bulk'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-700'}"
                >Import Bulanan</button
            >
            <button
                type="button"
                onclick={() => (activeTab = "manual")}
                class="rounded-lg px-4 py-1.5 font-medium transition-all {activeTab ===
                'manual'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-emerald-700'}"
                >Input Manual</button
            >
        </div>
    </div>

    <!-- Shared: Pencarian Kota -->
    <div class="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p
            class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
            Sumber Data — {data.prayerProviderInfo?.providerName ??
                "MyQuran API"}
        </p>
        {#if data.prayerProviderInfo?.supportsSearch}
            <div class="relative">
                <label
                    class="mb-1 block text-xs font-medium text-slate-600"
                    for="kotaKeyword">Cari Kota</label
                >
                <div class="relative">
                    <span
                        class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                            />
                        </svg>
                    </span>
                    <input
                        id="kotaKeyword"
                        type="text"
                        placeholder="Ketik nama kota, contoh: Jakarta, Surabaya..."
                        bind:value={kotaKeyword}
                        oninput={onKotaInput}
                        autocomplete="off"
                        class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                </div>
                {#if searchLoading}
                    <p
                        class="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400"
                    >
                        <svg
                            class="h-3 w-3 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            />
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                            />
                        </svg>
                        Mencari kota...
                    </p>
                {/if}
                {#if searchError}
                    <p class="mt-1.5 text-xs text-red-500">{searchError}</p>
                {/if}
                {#if kotaResults.length > 0}
                    <ul
                        class="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
                    >
                        {#each kotaResults as kota}
                            <li>
                                <button
                                    type="button"
                                    class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50"
                                    onclick={() => selectKota(kota)}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-3.5 w-3.5 shrink-0 text-emerald-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    {kota.lokasi}
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
                {#if selectedKota}
                    <div
                        class="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span class="text-xs font-medium text-emerald-800"
                            >Kota dipilih: <strong>{selectedKota.lokasi}</strong
                            ></span
                        >
                    </div>
                {/if}
            </div>
        {:else}
            <div class="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p class="text-xs text-blue-700">
                    <strong>{data.prayerProviderInfo?.providerName}</strong>
                    menggunakan koordinat lokasi masjid.
                    {#if data.masjid?.latitude && data.masjid?.longitude}
                        <span class="block mt-1">
                            Lokasi: <strong
                                >{data.masjid.latitude}, {data.masjid
                                    .longitude}</strong
                            >
                            (Timezone: {data.masjid.timezone || "Asia/Jakarta"})
                        </span>
                    {:else}
                        <span class="block mt-1 text-red-600 font-semibold">
                            ⚠️ Koordinat masjid belum diisi. Silakan lengkapi di
                            menu Profil.
                        </span>
                    {/if}
                </p>
            </div>
        {/if}
    </div>

    {#if activeTab === "bulk"}
        <div class="mt-5 space-y-4">
            <div class="grid gap-3 sm:grid-cols-3">
                <div>
                    <label
                        class="mb-1 block text-xs font-medium text-slate-600"
                        for="bulkMonth">Bulan</label
                    >
                    <select
                        id="bulkMonth"
                        bind:value={bulkMonth}
                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                        {#each MONTH_NAMES as name, i}
                            <option value={String(i + 1).padStart(2, "0")}
                                >{name}</option
                            >
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        class="mb-1 block text-xs font-medium text-slate-600"
                        for="bulkYear">Tahun</label
                    >
                    <select
                        id="bulkYear"
                        bind:value={bulkYear}
                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                        {#each YEARS as y}
                            <option value={y}>{y}</option>
                        {/each}
                    </select>
                </div>
                <div class="flex items-end">
                    <button
                        type="button"
                        onclick={fetchBulk}
                        disabled={bulkLoading ||
                            (data.prayerProviderInfo?.supportsSearch
                                ? !selectedKota
                                : !data.masjid?.latitude ||
                                  !data.masjid?.longitude)}
                        class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {#if bulkLoading}
                            <svg
                                class="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                ><circle
                                    class="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    stroke-width="4"
                                /><path
                                    class="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8z"
                                /></svg
                            >
                            Mengambil...
                        {:else}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                /></svg
                            >
                            Ambil Jadwal
                        {/if}
                    </button>
                </div>
            </div>

            {#if bulkError}
                <div
                    class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        /></svg
                    >
                    {bulkError}
                </div>
            {/if}

            {#if bulkSaveSuccess}
                <div
                    class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        /></svg
                    >
                    {bulkSaveSuccess}
                </div>
            {/if}

            {#if bulkSaveError}
                <div
                    class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        /></svg
                    >
                    {bulkSaveError}
                </div>
            {/if}

            {#if bulkPreview.length > 0}
                <div class="overflow-hidden rounded-xl border border-slate-200">
                    <div
                        class="flex items-center justify-between gap-3 border-b border-slate-200 bg-emerald-50 px-4 py-3"
                    >
                        <div class="flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                /></svg
                            >
                            <span class="text-xs font-medium text-emerald-800"
                                >{bulkSuccess}</span
                            >
                        </div>
                        <button
                            type="button"
                            onclick={saveBulk}
                            disabled={bulkSaving}
                            class="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {#if bulkSaving}
                                <svg
                                    class="h-3.5 w-3.5 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    ><circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    /><path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v8z"
                                    /></svg
                                >
                                Menyimpan...
                            {:else}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                    /></svg
                                >
                                Simpan {bulkPreview.length} Jadwal
                            {/if}
                        </button>
                    </div>
                    <div class="max-h-80 overflow-y-auto">
                        <table class="w-full text-xs">
                            <thead
                                class="sticky top-0 bg-slate-100 text-slate-600"
                            >
                                <tr>
                                    <th
                                        class="px-3 py-2 text-left font-semibold"
                                        >Tanggal</th
                                    >
                                    <th
                                        class="px-3 py-2 text-center font-semibold"
                                        >Imsak</th
                                    >
                                    <th
                                        class="px-3 py-2 text-center font-semibold"
                                        >Subuh</th
                                    >
                                    <th
                                        class="px-3 py-2 text-center font-semibold"
                                        >Syuruq</th
                                    >
                                    <th
                                        class="px-3 py-2 text-center font-semibold"
                                        >Dhuha</th
                                    >
                                    <th
                                        class="px-3 py-2 text-center font-semibold"
                                        >Dzuhur</th
                                    >
                                    <th
                                        class="px-3 py-2 text-center font-semibold"
                                        >Ashar</th
                                    >
                                    <th
                                        class="px-3 py-2 text-center font-semibold"
                                        >Maghrib</th
                                    >
                                    <th
                                        class="px-3 py-2 text-center font-semibold"
                                        >Isya</th
                                    >
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                {#each bulkPreview as row, i}
                                    <tr
                                        class="{i % 2 === 0
                                            ? 'bg-white'
                                            : 'bg-slate-50'} hover:bg-emerald-50 transition-colors"
                                    >
                                        <td
                                            class="px-3 py-2 font-medium text-slate-700"
                                            >{row.date}</td
                                        >
                                        <td
                                            class="px-3 py-2 text-center text-slate-600"
                                            >{row.imsakTime}</td
                                        >
                                        <td
                                            class="px-3 py-2 text-center text-slate-600"
                                            >{row.subuhTime}</td
                                        >
                                        <td
                                            class="px-3 py-2 text-center text-slate-600"
                                            >{row.sunriseTime}</td
                                        >
                                        <td
                                            class="px-3 py-2 text-center text-slate-600"
                                            >{row.dhuhaTime}</td
                                        >
                                        <td
                                            class="px-3 py-2 text-center font-medium text-emerald-700"
                                            >{row.dzuhurTime}</td
                                        >
                                        <td
                                            class="px-3 py-2 text-center text-slate-600"
                                            >{row.asharTime}</td
                                        >
                                        <td
                                            class="px-3 py-2 text-center font-medium text-emerald-700"
                                            >{row.maghribTime}</td
                                        >
                                        <td
                                            class="px-3 py-2 text-center text-slate-600"
                                            >{row.isyaTime}</td
                                        >
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    {#if activeTab === "manual"}
        <div class="mt-5 space-y-4">
            <div class="flex flex-wrap items-end gap-3">
                <div class="flex-1">
                    <label
                        class="mb-1 block text-xs font-medium text-slate-600"
                        for="scheduleDateManual">Tanggal</label
                    >
                    <input
                        id="scheduleDateManual"
                        type="date"
                        bind:value={scheduleDate}
                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                </div>
                <button
                    type="button"
                    onclick={fetchManual}
                    disabled={manualFetchLoading ||
                        !scheduleDate ||
                        (data.prayerProviderInfo?.supportsSearch
                            ? !selectedKota
                            : !data.masjid?.latitude ||
                              !data.masjid?.longitude)}
                    class="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {#if manualFetchLoading}
                        <svg
                            class="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            ><circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            /><path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                            /></svg
                        >
                        Mengambil...
                    {:else}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            /></svg
                        >
                        Isi dari API
                    {/if}
                </button>
            </div>

            {#if manualFetchError}
                <div
                    class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        /></svg
                    >
                    {manualFetchError}
                </div>
            {/if}
            {#if manualFetchSuccess}
                <div
                    class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        /></svg
                    >
                    {manualFetchSuccess}
                </div>
            {/if}

            <form
                method="POST"
                action="?/addPrayerSchedule"
                use:enhance={() => {
                    return async ({ update }) => {
                        await update({ reset: true });
                        await invalidate(() => true);
                    };
                }}
                class="rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
                <input type="hidden" name="masjid_id" value={data.masjid.id} />
                <input type="hidden" name="scheduleDate" value={scheduleDate} />
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-slate-500"
                            for="imsakTime">Imsak</label
                        >
                        <input
                            id="imsakTime"
                            type="time"
                            name="imsakTime"
                            required
                            bind:value={imsakTime}
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-slate-500"
                            for="subuhTime">Subuh</label
                        >
                        <input
                            id="subuhTime"
                            type="time"
                            name="subuhTime"
                            required
                            bind:value={subuhTime}
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-slate-500"
                            for="sunriseTime">Syuruq</label
                        >
                        <input
                            id="sunriseTime"
                            type="time"
                            name="sunriseTime"
                            required
                            bind:value={sunriseTime}
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-slate-500"
                            for="dhuhaTime">Dhuha</label
                        >
                        <input
                            id="dhuhaTime"
                            type="time"
                            name="dhuhaTime"
                            required
                            bind:value={dhuhaTime}
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-slate-500"
                            for="dzuhurTime">Dzuhur</label
                        >
                        <input
                            id="dzuhurTime"
                            type="time"
                            name="dzuhurTime"
                            required
                            bind:value={dzuhurTime}
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-slate-500"
                            for="asharTime">Ashar</label
                        >
                        <input
                            id="asharTime"
                            type="time"
                            name="asharTime"
                            required
                            bind:value={asharTime}
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-slate-500"
                            for="maghribTime">Maghrib</label
                        >
                        <input
                            id="maghribTime"
                            type="time"
                            name="maghribTime"
                            required
                            bind:value={maghribTime}
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                    <div>
                        <label
                            class="mb-1 block text-xs font-medium text-slate-500"
                            for="isyaTime">Isya</label
                        >
                        <input
                            id="isyaTime"
                            type="time"
                            name="isyaTime"
                            required
                            bind:value={isyaTime}
                            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <p class="text-xs text-slate-400">
                        Jadwal akan disimpan untuk tanggal yang dipilih di atas
                    </p>
                    <button
                        type="submit"
                        class="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                            /></svg
                        >
                        Simpan Jadwal
                    </button>
                </div>
            </form>
        </div>
    {/if}
</section>
