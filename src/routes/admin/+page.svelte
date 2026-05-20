<script lang="ts">
    import { enhance } from "$app/forms";

    let { data } = $props();

    // ----------------------------------------------------------------
    // Types
    // ----------------------------------------------------------------
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

    // ----------------------------------------------------------------
    // Tab state
    // ----------------------------------------------------------------
    type Tab = "bulk" | "manual";
    let activeTab = $state<Tab>("bulk");

    // ----------------------------------------------------------------
    // Shared: pencarian kota
    // ----------------------------------------------------------------
    let kotaKeyword = $state("");
    let kotaResults = $state<KotaResult[]>([]);
    let selectedKota = $state<KotaResult | null>(null);
    let searchLoading = $state(false);
    let searchError = $state("");
    let searchTimeout: ReturnType<typeof setTimeout> | null = null;

    function onKotaInput() {
        selectedKota = null;
        if (searchTimeout) clearTimeout(searchTimeout);
        if (kotaKeyword.trim().length < 2) {
            kotaResults = [];
            return;
        }
        searchTimeout = setTimeout(async () => {
            searchLoading = true;
            searchError = "";
            try {
                const res = await fetch(
                    `/api/v1/prayer-fetch?action=search&keyword=${encodeURIComponent(kotaKeyword.trim())}`,
                );
                const json = await res.json();
                if (json.ok) {
                    kotaResults = json.data ?? [];
                } else {
                    searchError = json.message ?? "Gagal mencari kota";
                    kotaResults = [];
                }
            } catch {
                searchError = "Gagal terhubung ke server";
                kotaResults = [];
            } finally {
                searchLoading = false;
            }
        }, 400);
    }

    function selectKota(kota: KotaResult) {
        selectedKota = kota;
        kotaKeyword = kota.lokasi;
        kotaResults = [];
        bulkError = "";
        bulkSuccess = "";
        manualFetchError = "";
        manualFetchSuccess = "";
    }

    // ----------------------------------------------------------------
    // Tab BULK: import per bulan
    // ----------------------------------------------------------------
    const now = new Date();
    let bulkYear = $state(String(now.getFullYear()));
    let bulkMonth = $state(String(now.getMonth() + 1).padStart(2, "0"));
    let bulkLoading = $state(false);
    let bulkError = $state("");
    let bulkSuccess = $state("");
    let bulkPreview = $state<BulkSchedule[]>([]);
    let bulkSaving = $state(false);
    let bulkSaveSuccess = $state("");
    let bulkSaveError = $state("");

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

    const YEARS = Array.from({ length: 5 }, (_, i) =>
        String(now.getFullYear() - 1 + i),
    );

    async function fetchBulk() {
        if (!selectedKota) {
            bulkError = "Pilih kota terlebih dahulu";
            return;
        }
        bulkLoading = true;
        bulkError = "";
        bulkSuccess = "";
        bulkPreview = [];
        bulkSaveSuccess = "";
        bulkSaveError = "";
        try {
            const res = await fetch(
                `/api/v1/prayer-fetch?action=bulk&kota_id=${encodeURIComponent(selectedKota.id)}&year=${bulkYear}&month=${bulkMonth}`,
            );
            const json = await res.json();
            if (json.ok && json.data?.length) {
                bulkPreview = json.data;
                bulkSuccess = `${json.data.length} hari jadwal berhasil diambil untuk ${selectedKota.lokasi} — ${MONTH_NAMES[Number(bulkMonth) - 1]} ${bulkYear}`;
            } else {
                bulkError = json.message ?? "Gagal mengambil jadwal bulanan";
            }
        } catch {
            bulkError = "Gagal terhubung ke server";
        } finally {
            bulkLoading = false;
        }
    }

    async function saveBulk() {
        if (!bulkPreview.length || !data.masjid) return;
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
            // SvelteKit form action returns {type, data} or {type, error}
            if (result?.type === "success" || result?.data?.bulkSuccess) {
                const saved = result?.data?.saved ?? bulkPreview.length;
                bulkSaveSuccess = `${saved} jadwal berhasil disimpan ke database!`;
                bulkPreview = [];
                bulkSuccess = "";
            } else {
                bulkSaveError =
                    result?.data?.error ??
                    result?.error?.message ??
                    "Gagal menyimpan jadwal";
            }
        } catch {
            bulkSaveError = "Gagal terhubung ke server";
        } finally {
            bulkSaving = false;
        }
    }

    // ----------------------------------------------------------------
    // Tab MANUAL: input satu hari
    // ----------------------------------------------------------------
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
        if (!selectedKota) {
            manualFetchError = "Pilih kota terlebih dahulu";
            return;
        }
        if (!scheduleDate) {
            manualFetchError = "Isi tanggal terlebih dahulu";
            return;
        }
        manualFetchLoading = true;
        manualFetchError = "";
        manualFetchSuccess = "";
        try {
            const res = await fetch(
                `/api/v1/prayer-fetch?action=schedule&kota_id=${encodeURIComponent(selectedKota.id)}&date=${encodeURIComponent(scheduleDate)}`,
            );
            const json = await res.json();
            if (json.ok && json.data) {
                const d = json.data;
                imsakTime = d.imsakTime ?? "";
                subuhTime = d.subuhTime ?? "";
                sunriseTime = d.sunriseTime ?? "";
                dhuhaTime = d.dhuhaTime ?? "";
                dzuhurTime = d.dzuhurTime ?? "";
                asharTime = d.asharTime ?? "";
                maghribTime = d.maghribTime ?? "";
                isyaTime = d.isyaTime ?? "";
                manualFetchSuccess = `Jadwal ${scheduleDate} berhasil diisi dari API`;
            } else {
                manualFetchError = json.message ?? "Gagal mengambil jadwal";
            }
        } catch {
            manualFetchError = "Gagal terhubung ke server";
        } finally {
            manualFetchLoading = false;
        }
    }
</script>

<div
    class="bg-linear-to-br from-emerald-100 via-green-50 to-white px-4 py-6 sm:px-6 lg:px-8"
>
    <div class="mx-auto w-full max-w-7xl space-y-6">
        <header class="rounded-2xl bg-white p-6 shadow-sm">
            <p
                class="text-xs font-semibold uppercase tracking-wider text-emerald-700"
            >
                Admin Masjid
            </p>
            <h1 class="mt-1 text-2xl font-bold text-emerald-900">
                Dashboard Operasional Masjid
            </h1>
            <p class="mt-2 text-sm text-slate-600">
                {#if data.masjid}
                    {data.masjid.name} • {data.masjid.city ?? "-"}
                {:else}
                    Belum ada masjid terhubung ke akun ini.
                {/if}
            </p>
        </header>

        {#if data.masjid}
            <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div class="rounded-xl bg-white p-4 shadow-sm">
                    <p class="text-xs text-slate-500">Running Text</p>
                    <p class="mt-1 text-2xl font-bold text-emerald-700">
                        {data.runningTexts.length}
                    </p>
                </div>
                <div class="rounded-xl bg-white p-4 shadow-sm">
                    <p class="text-xs text-slate-500">Devices</p>
                    <p class="mt-1 text-2xl font-bold text-emerald-700">
                        {data.devices.length}
                    </p>
                </div>
                <div class="rounded-xl bg-white p-4 shadow-sm">
                    <p class="text-xs text-slate-500">Slides</p>
                    <p class="mt-1 text-2xl font-bold text-emerald-700">
                        {data.slides.length}
                    </p>
                </div>
                <div class="rounded-xl bg-white p-4 shadow-sm">
                    <p class="text-xs text-slate-500">Jumbotrons</p>
                    <p class="mt-1 text-2xl font-bold text-emerald-700">
                        {data.jumbotrons.length}
                    </p>
                </div>
                <div class="rounded-xl bg-white p-4 shadow-sm">
                    <p class="text-xs text-slate-500">YouTube</p>
                    <p class="mt-1 text-2xl font-bold text-emerald-700">
                        {data.youtubeItems.length}
                    </p>
                </div>
            </section>

            <section class="grid gap-6 lg:grid-cols-2">
                <article class="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 class="text-lg font-semibold text-emerald-900">
                        Tambah Running Text
                    </h2>
                    <form
                        method="POST"
                        action="?/addRunningText"
                        class="mt-4 space-y-3"
                    >
                        <input
                            type="hidden"
                            name="masjid_id"
                            value={data.masjid.id}
                        />
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
                    <div class="mt-4 space-y-2">
                        {#each data.runningTexts as item}
                            <div
                                class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-slate-700"
                            >
                                {item.content}
                            </div>
                        {/each}
                    </div>
                </article>

                <article class="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 class="text-lg font-semibold text-emerald-900">
                        Tambah Device
                    </h2>
                    <form
                        method="POST"
                        action="?/addDevice"
                        class="mt-4 grid gap-3 sm:grid-cols-2"
                    >
                        <input
                            type="hidden"
                            name="masjid_id"
                            value={data.masjid.id}
                        />
                        <input
                            name="device_code"
                            placeholder="Kode device"
                            class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />
                        <input
                            name="name"
                            placeholder="Nama device"
                            class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />
                        <select
                            name="orientation"
                            class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        >
                            <option value="horizontal">Horizontal</option>
                            <option value="vertical">Vertical</option>
                        </select>
                        <div class="sm:col-span-2">
                            <button
                                class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >Tambah Device</button
                            >
                        </div>
                    </form>
                    <div class="mt-4 space-y-2">
                        {#each data.devices as item}
                            <div
                                class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-slate-700"
                            >
                                {item.deviceCode} - {item.name}
                            </div>
                        {/each}
                    </div>
                </article>
            </section>

            <section class="grid gap-6 lg:grid-cols-2">
                <article class="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 class="text-lg font-semibold text-emerald-900">
                        Tambah YouTube Item
                    </h2>
                    <form
                        method="POST"
                        action="?/addYoutube"
                        class="mt-4 space-y-3"
                    >
                        <input
                            type="hidden"
                            name="masjid_id"
                            value={data.masjid.id}
                        />
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
                        <button
                            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >Tambah YouTube</button
                        >
                    </form>
                    <div class="mt-4 space-y-2">
                        {#each data.youtubeItems as item}
                            <div
                                class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-slate-700"
                            >
                                {item.title ?? "Video"} • {item.youtubeUrl}
                            </div>
                        {/each}
                    </div>
                </article>

                <article class="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 class="text-lg font-semibold text-emerald-900">
                        Jadwal Hari Ini
                    </h2>
                    {#if data.todaySchedule}
                        <div
                            class="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-slate-700"
                        >
                            <p>Subuh: {data.todaySchedule.subuhTime}</p>
                            <p>Dzuhur: {data.todaySchedule.dzuhurTime}</p>
                            <p>Ashar: {data.todaySchedule.asharTime}</p>
                            <p>Maghrib: {data.todaySchedule.maghribTime}</p>
                            <p>Isya: {data.todaySchedule.isyaTime}</p>
                        </div>
                    {:else}
                        <p class="mt-3 text-sm text-slate-600">
                            Belum ada jadwal untuk hari ini.
                        </p>
                    {/if}
                </article>
            </section>

            <section class="rounded-2xl bg-white p-6 shadow-sm">
                <!-- Header -->
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 class="text-lg font-semibold text-emerald-900">Jadwal Sholat</h2>
                        <p class="mt-0.5 text-xs text-slate-500">Import otomatis dari API atau input manual per hari</p>
                    </div>
                    <!-- Tab switcher -->
                    <div class="flex rounded-xl border border-emerald-200 bg-emerald-50 p-1 text-sm">
                        <button
                            type="button"
                            onclick={() => (activeTab = 'bulk')}
                            class="rounded-lg px-4 py-1.5 font-medium transition-all {activeTab === 'bulk' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-emerald-700'}"
                        >Import Bulanan</button>
                        <button
                            type="button"
                            onclick={() => (activeTab = 'manual')}
                            class="rounded-lg px-4 py-1.5 font-medium transition-all {activeTab === 'manual' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-emerald-700'}"
                        >Input Manual</button>
                    </div>
                </div>

                <!-- Shared: Pencarian Kota -->
                <div class="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Sumber Data — MyQuran API</p>
                    <div class="relative">
                        <label class="mb-1 block text-xs font-medium text-slate-600" for="kotaKeyword">Cari Kota</label>
                        <div class="relative">
                            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
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
                            <p class="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                                <svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                Mencari kota...
                            </p>
                        {/if}
                        {#if searchError}
                            <p class="mt-1.5 text-xs text-red-500">{searchError}</p>
                        {/if}
                        {#if kotaResults.length > 0}
                            <ul class="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                                {#each kotaResults as kota}
                                    <li>
                                        <button
                                            type="button"
                                            class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50"
                                            onclick={() => selectKota(kota)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                            {kota.lokasi}
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    {#if selectedKota}
                        <div class="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                            <span class="text-xs font-medium text-emerald-800">Kota dipilih: <strong>{selectedKota.lokasi}</strong></span>
                        </div>
                    {/if}
                </div>

                <!-- ================================================ -->
                <!-- TAB: IMPORT BULANAN                              -->
                <!-- ================================================ -->
                {#if activeTab === 'bulk'}
                    <div class="mt-5 space-y-4">
                        <!-- Pilih bulan & tahun -->
                        <div class="grid gap-3 sm:grid-cols-3">
                            <div>
                                <label class="mb-1 block text-xs font-medium text-slate-600" for="bulkMonth">Bulan</label>
                                <select
                                    id="bulkMonth"
                                    bind:value={bulkMonth}
                                    class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                >
                                    {#each MONTH_NAMES as name, i}
                                        <option value={String(i + 1).padStart(2, '0')}>{name}</option>
                                    {/each}
                                </select>
                            </div>
                            <div>
                                <label class="mb-1 block text-xs font-medium text-slate-600" for="bulkYear">Tahun</label>
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
                                    disabled={bulkLoading || !selectedKota}
                                    class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {#if bulkLoading}
                                        <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                        Mengambil...
                                    {:else}
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                        Ambil Jadwal
                                    {/if}
                                </button>
                            </div>
                        </div>

                        {#if bulkError}
                            <div class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                {bulkError}
                            </div>
                        {/if}

                        {#if bulkSaveSuccess}
                            <div class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                {bulkSaveSuccess}
                            </div>
                        {/if}

                        {#if bulkSaveError}
                            <div class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                {bulkSaveError}
                            </div>
                        {/if}

                        <!-- Preview tabel -->
                        {#if bulkPreview.length > 0}
                            <div class="overflow-hidden rounded-xl border border-slate-200">
                                <!-- Banner info -->
                                <div class="flex items-center justify-between gap-3 border-b border-slate-200 bg-emerald-50 px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        <span class="text-xs font-medium text-emerald-800">{bulkSuccess}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onclick={saveBulk}
                                        disabled={bulkSaving}
                                        class="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        {#if bulkSaving}
                                            <svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                            Menyimpan...
                                        {:else}
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                                            Simpan {bulkPreview.length} Jadwal
                                        {/if}
                                    </button>
                                </div>
                                <!-- Tabel scroll -->
                                <div class="max-h-80 overflow-y-auto">
                                    <table class="w-full text-xs">
                                        <thead class="sticky top-0 bg-slate-100 text-slate-600">
                                            <tr>
                                                <th class="px-3 py-2 text-left font-semibold">Tanggal</th>
                                                <th class="px-3 py-2 text-center font-semibold">Imsak</th>
                                                <th class="px-3 py-2 text-center font-semibold">Subuh</th>
                                                <th class="px-3 py-2 text-center font-semibold">Syuruq</th>
                                                <th class="px-3 py-2 text-center font-semibold">Dhuha</th>
                                                <th class="px-3 py-2 text-center font-semibold">Dzuhur</th>
                                                <th class="px-3 py-2 text-center font-semibold">Ashar</th>
                                                <th class="px-3 py-2 text-center font-semibold">Maghrib</th>
                                                <th class="px-3 py-2 text-center font-semibold">Isya</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-100">
                                            {#each bulkPreview as row, i}
                                                <tr class="{i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50 transition-colors">
                                                    <td class="px-3 py-2 font-medium text-slate-700">{row.date}</td>
                                                    <td class="px-3 py-2 text-center text-slate-600">{row.imsakTime}</td>
                                                    <td class="px-3 py-2 text-center text-slate-600">{row.subuhTime}</td>
                                                    <td class="px-3 py-2 text-center text-slate-600">{row.sunriseTime}</td>
                                                    <td class="px-3 py-2 text-center text-slate-600">{row.dhuhaTime}</td>
                                                    <td class="px-3 py-2 text-center font-medium text-emerald-700">{row.dzuhurTime}</td>
                                                    <td class="px-3 py-2 text-center text-slate-600">{row.asharTime}</td>
                                                    <td class="px-3 py-2 text-center font-medium text-emerald-700">{row.maghribTime}</td>
                                                    <td class="px-3 py-2 text-center text-slate-600">{row.isyaTime}</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- ================================================ -->
                <!-- TAB: INPUT MANUAL                                -->
                <!-- ================================================ -->
                {#if activeTab === 'manual'}
                    <div class="mt-5 space-y-4">
                        <!-- Tombol tarik dari API -->
                        <div class="flex flex-wrap items-end gap-3">
                            <div class="flex-1">
                                <label class="mb-1 block text-xs font-medium text-slate-600" for="scheduleDateManual">Tanggal</label>
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
                                disabled={manualFetchLoading || !selectedKota || !scheduleDate}
                                class="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {#if manualFetchLoading}
                                    <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                    Mengambil...
                                {:else}
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                    Isi dari API
                                {/if}
                            </button>
                        </div>

                        {#if manualFetchError}
                            <div class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                {manualFetchError}
                            </div>
                        {/if}
                        {#if manualFetchSuccess}
                            <div class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                {manualFetchSuccess}
                            </div>
                        {/if}

                        <!-- Grid waktu sholat -->
                        <form method="POST" action="?/addPrayerSchedule" use:enhance class="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <input type="hidden" name="masjid_id" value={data.masjid.id} />
                            <input type="hidden" name="scheduleDate" value={scheduleDate} />
                            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label class="mb-1 block text-xs font-medium text-slate-500" for="imsakTime">Imsak</label>
                                    <input id="imsakTime" type="time" name="imsakTime" required bind:value={imsakTime}
                                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-medium text-slate-500" for="subuhTime">Subuh</label>
                                    <input id="subuhTime" type="time" name="subuhTime" required bind:value={subuhTime}
                                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-medium text-slate-500" for="sunriseTime">Syuruq</label>
                                    <input id="sunriseTime" type="time" name="sunriseTime" required bind:value={sunriseTime}
                                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-medium text-slate-500" for="dhuhaTime">Dhuha</label>
                                    <input id="dhuhaTime" type="time" name="dhuhaTime" required bind:value={dhuhaTime}
                                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-medium text-slate-500" for="dzuhurTime">Dzuhur</label>
                                    <input id="dzuhurTime" type="time" name="dzuhurTime" required bind:value={dzuhurTime}
                                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-medium text-slate-500" for="asharTime">Ashar</label>
                                    <input id="asharTime" type="time" name="asharTime" required bind:value={asharTime}
                                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-medium text-slate-500" for="maghribTime">Maghrib</label>
                                    <input id="maghribTime" type="time" name="maghribTime" required bind:value={maghribTime}
                                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                                </div>
                                <div>
                                    <label class="mb-1 block text-xs font-medium text-slate-500" for="isyaTime">Isya</label>
                                    <input id="isyaTime" type="time" name="isyaTime" required bind:value={isyaTime}
                                        class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                                </div>
                            </div>
                            <div class="mt-4 flex items-center justify-between">
                                <p class="text-xs text-slate-400">Jadwal akan disimpan untuk tanggal yang dipilih di atas</p>
                                <button
                                    type="submit"
                                    class="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                                    Simpan Jadwal
                                </button>
                            </div>
                        </form>
                    </div>
                {/if}
            </section>
                    <div class="grid gap-3 sm:grid-cols-2">
                        <div class="relative sm:col-span-2">
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="kotaKeyword"
                            >
                                Cari Kota
                            </label>
                            <input
                                id="kotaKeyword"
                                type="text"
                                placeholder="Ketik nama kota, contoh: Jakarta"
                                bind:value={kotaKeyword}
                                oninput={onKotaInput}
                                autocomplete="off"
                                class="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                            />
                            {#if searchLoading}
                                <p class="mt-1 text-xs text-slate-400">
                                    Mencari kota...
                                </p>
                            {/if}
                            {#if searchError}
                                <p class="mt-1 text-xs text-red-500">
                                    {searchError}
                                </p>
                            {/if}
                            {#if kotaResults.length > 0}
                                <ul
                                    class="absolute z-10 mt-1 w-full rounded-xl border border-emerald-200 bg-white shadow-lg"
                                >
                                    {#each kotaResults as kota}
                                        <li>
                                            <button
                                                type="button"
                                                class="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50"
                                                onclick={() => selectKota(kota)}
                                            >
                                                {kota.lokasi}
                                            </button>
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    </div>

                    {#if selectedKota}
                        <p class="mt-2 text-xs text-emerald-700">
                            Kota dipilih: <span class="font-semibold"
                                >{selectedKota.lokasi}</span
                            >
                        </p>
                    {/if}

                    <div class="mt-3">
                        <label
                            class="mb-1 block text-xs font-medium text-slate-600"
                            for="scheduleDateApi"
                        >
                            Tanggal
                        </label>
                        <input
                            id="scheduleDateApi"
                            type="date"
                            bind:value={scheduleDate}
                            class="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm sm:w-56"
                        />
                    </div>

                    <button
                        type="button"
                        onclick={fetchFromApi}
                        disabled={fetchLoading}
                        class="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {fetchLoading ? "Mengambil data..." : "Tarik dari API"}
                    </button>

                    {#if fetchError}
                        <p class="mt-2 text-xs text-red-500">{fetchError}</p>
                    {/if}
                    {#if fetchSuccess}
                        <p class="mt-2 text-xs text-emerald-600">
                            {fetchSuccess}
                        </p>
                    {/if}
                </div>

                <!-- Form simpan jadwal -->
                <form method="POST" action="?/addPrayerSchedule" class="mt-5">
                    <input
                        type="hidden"
                        name="masjid_id"
                        value={data.masjid.id}
                    />
                    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div class="sm:col-span-2 lg:col-span-3">
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="scheduleDate">Tanggal</label
                            >
                            <input
                                id="scheduleDate"
                                type="date"
                                name="scheduleDate"
                                required
                                bind:value={scheduleDate}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="imsakTime">Imsak</label
                            >
                            <input
                                id="imsakTime"
                                type="time"
                                name="imsakTime"
                                required
                                bind:value={imsakTime}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="subuhTime">Subuh</label
                            >
                            <input
                                id="subuhTime"
                                type="time"
                                name="subuhTime"
                                required
                                bind:value={subuhTime}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="sunriseTime">Syuruq</label
                            >
                            <input
                                id="sunriseTime"
                                type="time"
                                name="sunriseTime"
                                required
                                bind:value={sunriseTime}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="dhuhaTime">Dhuha</label
                            >
                            <input
                                id="dhuhaTime"
                                type="time"
                                name="dhuhaTime"
                                required
                                bind:value={dhuhaTime}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="dzuhurTime">Dzuhur</label
                            >
                            <input
                                id="dzuhurTime"
                                type="time"
                                name="dzuhurTime"
                                required
                                bind:value={dzuhurTime}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="asharTime">Ashar</label
                            >
                            <input
                                id="asharTime"
                                type="time"
                                name="asharTime"
                                required
                                bind:value={asharTime}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="maghribTime">Maghrib</label
                            >
                            <input
                                id="maghribTime"
                                type="time"
                                name="maghribTime"
                                required
                                bind:value={maghribTime}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1 block text-xs font-medium text-slate-600"
                                for="isyaTime">Isya</label
                            >
                            <input
                                id="isyaTime"
                                type="time"
                                name="isyaTime"
                                required
                                bind:value={isyaTime}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div class="mt-4">
                        <button
                            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >Simpan Jadwal</button
                        >
                    </div>
                </form>
            </section>
        {/if}
    </div>
</div>
