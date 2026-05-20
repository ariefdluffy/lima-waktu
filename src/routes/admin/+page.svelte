<script lang="ts">
    import { enhance, deserialize } from "$app/forms";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import Pagination from "$lib/components/Pagination.svelte";

    let { data } = $props();

    // ----------------------------------------------------------------
    // Pagination helper
    // ----------------------------------------------------------------
    function buildPageUrl(param: string, value: number): string {
        const u = new URL($page.url);
        u.searchParams.set(param, String(value));
        return u.pathname + u.search;
    }

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
    // Slides
    // ----------------------------------------------------------------
    let slideFile: FileList | null = $state(null);
    let slideTitle = $state("");
    let slideUploading = $state(false);
    let slideUploadError = $state("");
    let slideUploadSuccess = $state(false);

    async function uploadSlide() {
        if (!slideFile || slideFile.length === 0) {
            slideUploadError = "Pilih file foto terlebih dahulu.";
            return;
        }
        slideUploading = true;
        slideUploadError = "";
        slideUploadSuccess = false;
        try {
            // Step 1: upload media
            const fd = new FormData();
            fd.append("file", slideFile[0]);
            fd.append("title", slideTitle || slideFile[0].name);
            const mediaRes = await fetch("/api/v1/masjid/media", {
                method: "POST",
                body: fd,
            });
            const mediaJson = await mediaRes.json();
            if (!mediaJson.ok) {
                slideUploadError = mediaJson.message ?? "Gagal upload foto.";
                return;
            }
            // Step 2: create slide
            const slideRes = await fetch("/api/v1/masjid/slides", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: slideTitle || slideFile[0].name,
                    mediaAssetId: mediaJson.data.id,
                    orderIndex: 0,
                    isActive: true,
                }),
            });
            const slideJson = await slideRes.json();
            if (!slideJson.ok) {
                slideUploadError = slideJson.message ?? "Gagal membuat slide.";
                return;
            }
            slideUploadSuccess = true;
            slideTitle = "";
            slideFile = null;
            // reload page to refresh slide list
            setTimeout(() => location.reload(), 1000);
        } catch (e) {
            slideUploadError = "Terjadi kesalahan saat upload.";
        } finally {
            slideUploading = false;
        }
    }

    // ----------------------------------------------------------------
    // Iqamah settings
    // ----------------------------------------------------------------
    const PRAYER_NAMES = [
        "subuh",
        "dzuhur",
        "ashar",
        "maghrib",
        "isya",
    ] as const;
    const PRAYER_LABELS: Record<string, string> = {
        subuh: "Subuh",
        dzuhur: "Dzuhur",
        ashar: "Ashar",
        maghrib: "Maghrib",
        isya: "Isya",
    };

    type IqamahRow = {
        prayerName: string;
        delayMinutes: number;
        enabled: boolean;
    };

    // Build initial state dari data server, default 10 menit enabled
    let iqamahForm = $state<IqamahRow[]>(
        PRAYER_NAMES.map((p) => {
            const existing = data.iqamahSettings?.find(
                (r: any) => r.prayerName === p,
            );
            return {
                prayerName: p,
                delayMinutes: existing?.delayMinutes ?? 10,
                enabled: existing ? existing.enabled === 1 : true,
            };
        }),
    );

    let iqamahSaving = $state(false);
    let iqamahSaveSuccess = $state(false);
    let iqamahSaveError = $state("");

    // ----------------------------------------------------------------
    // Hijri offset
    // ----------------------------------------------------------------
    let hijriOffset = $state(data.masjid?.hijriOffset ?? 0);
    let hijriOffsetSaving = $state(false);
    let hijriOffsetSuccess = $state("");
    let hijriOffsetError = $state("");

    async function saveHijriOffset() {
        hijriOffsetSaving = true;
        hijriOffsetSuccess = "";
        hijriOffsetError = "";
        try {
            const res = await fetch("/api/v1/masjid/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hijriOffset: Number(hijriOffset) }),
            });
            const json = await res.json();
            if (json.ok) {
                hijriOffsetSuccess = "✓ Disimpan";
                hijriOffset = json.data.hijriOffset ?? 0;
            } else {
                hijriOffsetError = json.message || "Gagal menyimpan";
            }
        } catch {
            hijriOffsetError = "Gagal menghubungi server";
        } finally {
            hijriOffsetSaving = false;
        }
    }

    async function saveIqamah() {
        iqamahSaving = true;
        iqamahSaveSuccess = false;
        iqamahSaveError = "";
        try {
            const res = await fetch("/api/v1/masjid/iqamah-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    iqamahForm.map((r) => ({
                        prayerName: r.prayerName,
                        delayMinutes: Number(r.delayMinutes),
                        enabled: r.enabled,
                    })),
                ),
            });
            const json = await res.json();
            if (json.ok) {
                iqamahSaveSuccess = true;
                setTimeout(() => (iqamahSaveSuccess = false), 3000);
            } else {
                iqamahSaveError = json.message ?? "Gagal menyimpan.";
            }
        } catch {
            iqamahSaveError = "Terjadi kesalahan jaringan.";
        } finally {
            iqamahSaving = false;
        }
    }

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
        // Auto-resolve lat/lon dari nama kota + simpan ke masjid
        resolveAndSaveLatLon(kota.lokasi);
    }

    // ----------------------------------------------------------------
    // Resolve lat/lon dari nama kota via Open-Meteo Geocoding
    // ----------------------------------------------------------------
    async function resolveAndSaveLatLon(cityName: string) {
        try {
            const res = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=id&format=json`,
            );
            const json = await res.json();
            const result = json?.results?.[0];
            if (result?.latitude && result?.longitude) {
                const lat = result.latitude.toFixed(7);
                const lon = result.longitude.toFixed(7);
                await fetch("/api/v1/masjid/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        latitude: Number(lat),
                        longitude: Number(lon),
                        city: cityName,
                    }),
                });
            }
        } catch {
            // gagal resolve lat/lon — tidak critical, hanya weather
        }
    }

    // ----------------------------------------------------------------
    // Cuaca: update lat/lon manual
    // ----------------------------------------------------------------
    let weatherLat = $state(data.masjid?.latitude ?? "");
    let weatherLon = $state(data.masjid?.longitude ?? "");
    let weatherLocSaving = $state(false);
    let weatherLocSuccess = $state("");
    let weatherLocError = $state("");

    async function saveWeatherLocation() {
        weatherLocSaving = true;
        weatherLocSuccess = "";
        weatherLocError = "";
        try {
            const res = await fetch("/api/v1/masjid/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    latitude: Number(weatherLat),
                    longitude: Number(weatherLon),
                }),
            });
            const json = await res.json();
            if (json.ok) {
                weatherLocSuccess = "✓ Tersimpan";
                setTimeout(() => (weatherLocSuccess = ""), 3000);
            } else {
                weatherLocError = json.message || "Gagal";
            }
        } catch {
            weatherLocError = "Gagal menghubungi server";
        } finally {
            weatherLocSaving = false;
        }
    }

    // ----------------------------------------------------------------
    // Profil Masjid
    // ----------------------------------------------------------------
    let profileName = $state(data.masjid?.name ?? "");
    let profileAddress = $state(data.masjid?.address ?? "");
    let profileCity = $state(data.masjid?.city ?? "");
    let profileDistrict = $state(data.masjid?.district ?? "");
    let profileProvince = $state(data.masjid?.province ?? "");
    let profileSaving = $state(false);
    let profileSuccess = $state("");
    let profileError = $state("");

    async function saveProfile() {
        profileSaving = true;
        profileSuccess = "";
        profileError = "";
        try {
            const res = await fetch("/api/v1/masjid/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profileName.trim(),
                    address: profileAddress.trim() || null,
                    city: profileCity.trim() || null,
                    district: profileDistrict.trim() || null,
                    province: profileProvince.trim() || null,
                }),
            });
            const json = await res.json();
            if (json.ok) {
                profileSuccess = "✓ Profil disimpan";
                setTimeout(() => (profileSuccess = ""), 3000);
            } else {
                profileError = json.message || "Gagal";
            }
        } catch {
            profileError = "Gagal menghubungi server";
        } finally {
            profileSaving = false;
        }
    }

    // ----------------------------------------------------------------
    // Logo Masjid
    // ----------------------------------------------------------------
    let logoFile = $state<File | null>(null);
    let logoPreview = $state(data.masjid?.logoUrl ?? "");
    let logoSaving = $state(false);
    let logoSuccess = $state("");
    let logoError = $state("");

    async function uploadLogo() {
        if (!logoFile) {
            logoError = "Pilih file logo terlebih dahulu";
            return;
        }
        logoSaving = true;
        logoSuccess = "";
        logoError = "";
        try {
            const fd = new FormData();
            fd.append("file", logoFile);
            fd.append("title", "logo-masjid");
            const mediaRes = await fetch("/api/v1/masjid/media", {
                method: "POST",
                body: fd,
            });
            const mediaJson = await mediaRes.json();
            if (!mediaJson.ok) {
                logoError = mediaJson.message || "Gagal upload";
                return;
            }
            const fileUrl = mediaJson.data.fileUrl;

            const res = await fetch("/api/v1/masjid/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logoUrl: fileUrl }),
            });
            const json = await res.json();
            if (json.ok) {
                logoPreview = fileUrl;
                logoSuccess = "✓ Logo tersimpan";
                setTimeout(() => (logoSuccess = ""), 3000);
            } else {
                logoError = json.message || "Gagal";
            }
        } catch {
            logoError = "Gagal menghubungi server";
        } finally {
            logoSaving = false;
        }
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
            const result = deserialize(await res.text()) as any;
            console.log("[saveBulk] result:", JSON.stringify(result));
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

            <!-- PROFIL MASJID -->
            <section class="rounded-2xl bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-lg font-semibold text-emerald-900">
                            Profil Masjid
                        </h2>
                        <p class="mt-0.5 text-xs text-slate-500">
                            Edit nama, alamat, dan upload logo masjid.
                        </p>
                    </div>
                </div>
                <div class="mt-5 grid gap-6 lg:grid-cols-2">
                    <!-- Form data diri -->
                    <div class="space-y-4">
                        <div>
                            <label
                                for="profile-name"
                                class="mb-1 block text-xs font-medium text-slate-600"
                                >Nama Masjid</label
                            >
                            <input
                                id="profile-name"
                                type="text"
                                bind:value={profileName}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                for="profile-address"
                                class="mb-1 block text-xs font-medium text-slate-600"
                                >Alamat</label
                            >
                            <input
                                id="profile-address"
                                type="text"
                                bind:value={profileAddress}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    for="profile-city"
                                    class="mb-1 block text-xs font-medium text-slate-600"
                                    >Kota</label
                                >
                                <input
                                    id="profile-city"
                                    type="text"
                                    bind:value={profileCity}
                                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label
                                    for="profile-district"
                                    class="mb-1 block text-xs font-medium text-slate-600"
                                    >Kecamatan</label
                                >
                                <input
                                    id="profile-district"
                                    type="text"
                                    bind:value={profileDistrict}
                                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                for="profile-province"
                                class="mb-1 block text-xs font-medium text-slate-600"
                                >Provinsi</label
                            >
                            <input
                                id="profile-province"
                                type="text"
                                bind:value={profileProvince}
                                class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div class="flex items-center gap-3">
                            <button
                                onclick={saveProfile}
                                disabled={profileSaving}
                                class="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {#if profileSaving}
                                    Menyimpan...
                                {:else}
                                    Simpan Profil
                                {/if}
                            </button>
                            {#if profileSuccess}
                                <p class="text-sm font-medium text-emerald-600">
                                    {profileSuccess}
                                </p>
                            {/if}
                            {#if profileError}
                                <p class="text-sm text-red-500">
                                    {profileError}
                                </p>
                            {/if}
                        </div>
                    </div>

                    <!-- Upload Logo -->
                    <div class="flex flex-col items-center gap-4">
                        <div
                            class="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-emerald-300 bg-emerald-50"
                        >
                            {#if logoPreview}
                                <img
                                    src={logoPreview}
                                    alt="Logo masjid"
                                    class="h-full w-full object-contain"
                                />
                            {:else}
                                <span class="text-5xl text-emerald-300">🕌</span
                                >
                            {/if}
                        </div>
                        <input
                            id="logo-file"
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onchange={(e) => {
                                const files = (e.target as HTMLInputElement)
                                    .files;
                                if (files && files.length > 0) {
                                    logoFile = files[0];
                                    logoError = "";
                                }
                            }}
                            class="w-full max-w-xs rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />
                        <button
                            onclick={uploadLogo}
                            disabled={logoSaving}
                            class="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {#if logoSaving}
                                Mengupload...
                            {:else}
                                Upload Logo
                            {/if}
                        </button>
                        {#if logoSuccess}
                            <p class="text-sm font-medium text-emerald-600">
                                {logoSuccess}
                            </p>
                        {/if}
                        {#if logoError}
                            <p class="text-sm text-red-500">{logoError}</p>
                        {/if}
                    </div>
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
                    <div class="mt-4 space-y-3">
                        {#each data.runningTexts as item}
                            <div
                                class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                            >
                                <details class="group">
                                    <summary
                                        class="flex cursor-pointer items-center justify-between gap-2"
                                    >
                                        <p
                                            class="flex-1 truncate text-sm text-slate-700"
                                        >
                                            {item.content}
                                        </p>
                                        <span
                                            class="shrink-0 text-xs text-slate-400"
                                            >{item.speed ?? 60}s</span
                                        >
                                    </summary>
                                    <div
                                        class="mt-3 space-y-2 border-t border-emerald-100 pt-3"
                                    >
                                        <form
                                            method="POST"
                                            action="?/editRunningText"
                                            class="space-y-2"
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={item.id}
                                            />
                                            <textarea
                                                name="content"
                                                rows="2"
                                                class="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                                >{item.content}</textarea
                                            >
                                            <div
                                                class="flex items-center gap-2"
                                            >
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
                                            onsubmit={(e) => {
                                                if (
                                                    !confirm(
                                                        "Hapus running text ini?",
                                                    )
                                                )
                                                    e.preventDefault();
                                            }}
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={item.id}
                                            />
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
                            <p class="text-xs text-slate-400">
                                Belum ada running text.
                            </p>
                        {/if}
                    </div>
                    <Pagination
                        currentPage={data.runningTextPage}
                        totalPages={data.runningTextTotalPages}
                        totalItems={data.runningTextTotal}
                        paramName="pageRT"
                    />
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
                    <div class="mt-4 space-y-3">
                        {#each data.devices as item}
                            <div
                                class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                            >
                                <details class="group">
                                    <summary
                                        class="flex cursor-pointer items-center justify-between gap-2"
                                    >
                                        <div>
                                            <p
                                                class="text-sm font-semibold text-slate-700"
                                            >
                                                {item.deviceCode} — {item.name}
                                            </p>
                                            <p
                                                class="mt-0.5 text-xs text-slate-400"
                                            >
                                                {item.orientation} · {item.status}
                                            </p>
                                        </div>
                                        <span
                                            class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium
                                            {item.layoutMode === 'youtube'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-emerald-100 text-emerald-700'}"
                                        >
                                            {item.layoutMode === "youtube"
                                                ? "▶ YouTube"
                                                : "⊞ Default"}
                                        </span>
                                    </summary>
                                    <div
                                        class="mt-3 space-y-2 border-t border-emerald-100 pt-3"
                                    >
                                        <!-- Edit Nama -->
                                        <form
                                            method="POST"
                                            action="?/editDevice"
                                            class="flex items-center gap-2"
                                        >
                                            <input
                                                type="hidden"
                                                name="device_id"
                                                value={item.id}
                                            />
                                            <label
                                                for="device_name_{item.id}"
                                                class="text-xs text-slate-500"
                                                >Nama:</label
                                            >
                                            <input
                                                id="device_name_{item.id}"
                                                type="text"
                                                name="name"
                                                value={item.name}
                                                class="flex-1 rounded-lg border border-emerald-200 px-2 py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
                                            />
                                            <button
                                                type="submit"
                                                class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                >Simpan</button
                                            >
                                        </form>
                                        <!-- Layout -->
                                        <form
                                            method="POST"
                                            action="?/updateDeviceLayout"
                                            class="flex items-center gap-2"
                                        >
                                            <input
                                                type="hidden"
                                                name="device_id"
                                                value={item.id}
                                            />
                                            <label
                                                for="layout_mode_{item.id}"
                                                class="text-xs text-slate-500"
                                                >Layout:</label
                                            >
                                            <select
                                                id="layout_mode_{item.id}"
                                                name="layout_mode"
                                                class="flex-1 rounded-lg border border-emerald-200 px-2 py-1.5 text-xs text-slate-700"
                                            >
                                                <option
                                                    value="default"
                                                    selected={item.layoutMode ===
                                                        "default"}
                                                    >⊞ Default (jadwal + slide)</option
                                                >
                                                <option
                                                    value="youtube"
                                                    selected={item.layoutMode ===
                                                        "youtube"}
                                                    >▶ YouTube Streaming (30%
                                                    info / 70% video)</option
                                                >
                                            </select>
                                            <button
                                                type="submit"
                                                class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                >Simpan</button
                                            >
                                        </form>
                                        <!-- Hapus -->
                                        <form
                                            method="POST"
                                            action="?/deleteDevice"
                                            onsubmit={(e) => {
                                                if (
                                                    !confirm(
                                                        "Hapus device ini?",
                                                    )
                                                )
                                                    e.preventDefault();
                                            }}
                                        >
                                            <input
                                                type="hidden"
                                                name="device_id"
                                                value={item.id}
                                            />
                                            <button
                                                type="submit"
                                                class="text-xs font-medium text-red-500 hover:text-red-700"
                                                >Hapus Device</button
                                            >
                                        </form>
                                    </div>
                                </details>
                            </div>
                        {/each}
                        {#if data.devices.length === 0}
                            <p class="text-xs italic text-slate-400">
                                Belum ada device terdaftar.
                            </p>
                        {/if}
                    </div>
                    <Pagination
                        currentPage={data.devicePage}
                        totalPages={data.deviceTotalPages}
                        totalItems={data.deviceTotal}
                        paramName="pageDV"
                    />
                </article>
            </section>

            <!-- IQAMAH SETTINGS -->
            <section class="rounded-2xl bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-lg font-semibold text-emerald-900">
                            Pengaturan Iqamah
                        </h2>
                        <p class="mt-0.5 text-xs text-slate-500">
                            Atur jeda menit antara adzan dan iqamah untuk setiap
                            waktu sholat.
                        </p>
                    </div>
                </div>

                <div class="mt-5 overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-slate-100">
                                <th
                                    class="pb-2 text-left text-xs font-medium text-slate-500"
                                    >Waktu Sholat</th
                                >
                                <th
                                    class="pb-2 text-center text-xs font-medium text-slate-500"
                                    >Aktif</th
                                >
                                <th
                                    class="pb-2 text-center text-xs font-medium text-slate-500"
                                    >Jeda (menit)</th
                                >
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            {#each iqamahForm as row, i}
                                <tr class="py-2">
                                    <td class="py-3 pr-4">
                                        <span
                                            class="font-semibold text-slate-700"
                                            >{PRAYER_LABELS[
                                                row.prayerName
                                            ]}</span
                                        >
                                    </td>
                                    <td class="py-3 text-center">
                                        <label
                                            class="relative inline-flex cursor-pointer items-center"
                                        >
                                            <input
                                                type="checkbox"
                                                class="peer sr-only"
                                                bind:checked={
                                                    iqamahForm[i].enabled
                                                }
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
                                            bind:value={
                                                iqamahForm[i].delayMinutes
                                            }
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
                        {#if iqamahSaving}
                            Menyimpan...
                        {:else}
                            Simpan Pengaturan Iqamah
                        {/if}
                    </button>
                    {#if iqamahSaveSuccess}
                        <p class="text-sm font-medium text-emerald-600">
                            ✓ Berhasil disimpan.
                        </p>
                    {/if}
                    {#if iqamahSaveError}
                        <p class="text-sm text-red-500">{iqamahSaveError}</p>
                    {/if}
                </div>
            </section>

            <!-- HIJRI OFFSET -->
            <section class="rounded-2xl bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-lg font-semibold text-emerald-900">
                            Kalender Hijriyah
                        </h2>
                        <p class="mt-0.5 text-xs text-slate-500">
                            Sesuaikan selisih tanggal hijriyah jika hasil
                            perhitungan berbeda dengan observasi hilal lokal.
                        </p>
                    </div>
                </div>
                <div class="mt-5 flex flex-wrap items-end gap-4">
                    <div class="w-40">
                        <label
                            for="hijri-offset"
                            class="mb-1 block text-xs font-medium text-slate-600"
                        >
                            Offset Hari
                        </label>
                        <input
                            id="hijri-offset"
                            type="number"
                            min="-5"
                            max="5"
                            bind:value={hijriOffset}
                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <button
                        onclick={saveHijriOffset}
                        disabled={hijriOffsetSaving}
                        class="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {#if hijriOffsetSaving}
                            Menyimpan...
                        {:else}
                            Simpan
                        {/if}
                    </button>
                    {#if hijriOffsetSuccess}
                        <p class="text-sm font-medium text-emerald-600">
                            {hijriOffsetSuccess}
                        </p>
                    {/if}
                    {#if hijriOffsetError}
                        <p class="text-sm text-red-500">{hijriOffsetError}</p>
                    {/if}
                    <p class="text-xs text-slate-400">
                        {hijriOffset > 0 ? "+ " : ""}{hijriOffset
                            ? `${hijriOffset} hari lebih lambat`
                            : "0 (standar)"}
                    </p>
                </div>
            </section>

            <!-- CUACA: SET LOKASI -->
            <section class="rounded-2xl bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-lg font-semibold text-emerald-900">
                            Cuaca Lokal
                        </h2>
                        <p class="mt-0.5 text-xs text-slate-500">
                            Atur lokasi untuk menampilkan cuaca di layar TV.
                            Koordinat otomatis terisi saat pilih kota di tab
                            Jadwal Sholat.
                        </p>
                    </div>
                </div>
                <div class="mt-5 flex flex-wrap items-end gap-4">
                    <div class="w-40">
                        <label
                            for="weather-lat"
                            class="mb-1 block text-xs font-medium text-slate-600"
                            >Latitude</label
                        >
                        <input
                            id="weather-lat"
                            type="text"
                            placeholder="-6.2146"
                            bind:value={weatherLat}
                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="w-40">
                        <label
                            for="weather-lon"
                            class="mb-1 block text-xs font-medium text-slate-600"
                            >Longitude</label
                        >
                        <input
                            id="weather-lon"
                            type="text"
                            placeholder="106.8451"
                            bind:value={weatherLon}
                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <button
                        onclick={saveWeatherLocation}
                        disabled={weatherLocSaving}
                        class="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {#if weatherLocSaving}
                            Menyimpan...
                        {:else}
                            Simpan Lokasi
                        {/if}
                    </button>
                    {#if weatherLocSuccess}
                        <p class="text-sm font-medium text-emerald-600">
                            {weatherLocSuccess}
                        </p>
                    {/if}
                    {#if weatherLocError}
                        <p class="text-sm text-red-500">{weatherLocError}</p>
                    {/if}
                </div>
            </section>

            <!-- JUMBOTRON -->
            <section class="rounded-2xl bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-lg font-semibold text-emerald-900">
                            Jumbotrons
                        </h2>
                        <p class="mt-0.5 text-xs text-slate-500">
                            Pesan besar yang tampil di layar TV.
                        </p>
                    </div>
                </div>
                <div class="mt-5 grid gap-4 sm:grid-cols-2">
                    <div class="space-y-3">
                        <form
                            method="POST"
                            action="?/addJumbotron"
                            class="space-y-3"
                        >
                            <input
                                type="hidden"
                                name="masjid_id"
                                value={data.masjid.id}
                            />
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
                                class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >Tambah Jumbotron</button
                            >
                        </form>
                    </div>
                    <div class="space-y-2 max-h-80 overflow-y-auto">
                        {#each data.jumbotrons as item}
                            <div
                                class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                            >
                                <p class="text-sm font-semibold text-slate-700">
                                    {item.title}
                                </p>
                                <p class="mt-1 text-xs text-slate-500">
                                    {item.content}
                                </p>
                                {#if item.backgroundUrl}
                                    <p
                                        class="mt-1 text-xs text-slate-400 truncate"
                                    >
                                        BG: {item.backgroundUrl}
                                    </p>
                                {/if}
                                <form
                                    method="POST"
                                    action="?/deleteJumbotron"
                                    class="mt-2"
                                    onsubmit={(e) => {
                                        if (!confirm("Hapus jumbotron ini?"))
                                            e.preventDefault();
                                    }}
                                >
                                    <input
                                        type="hidden"
                                        name="id"
                                        value={item.id}
                                    />
                                    <button
                                        type="submit"
                                        class="text-xs font-medium text-red-500 hover:text-red-700"
                                        >Hapus</button
                                    >
                                </form>
                            </div>
                        {/each}
                        {#if data.jumbotrons.length === 0}
                            <p class="text-xs italic text-slate-400">
                                Belum ada jumbotron.
                            </p>
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
                    <div class="mt-4 space-y-3">
                        {#each data.youtubeItems as item}
                            <div
                                class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                            >
                                <details class="group">
                                    <summary
                                        class="flex cursor-pointer items-center justify-between gap-2"
                                    >
                                        <p
                                            class="flex-1 truncate text-sm text-slate-700"
                                        >
                                            {item.title ?? "Video"} &bull; {item.youtubeUrl}
                                        </p>
                                        <span
                                            class="shrink-0 text-xs text-slate-400"
                                            >#{item.orderIndex}</span
                                        >
                                    </summary>
                                    <div
                                        class="mt-3 space-y-2 border-t border-emerald-100 pt-3"
                                    >
                                        <form
                                            method="POST"
                                            action="?/editYoutube"
                                            class="space-y-2"
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={item.id}
                                            />
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
                                                >Simpan</button
                                            >
                                        </form>
                                        <form
                                            method="POST"
                                            action="?/deleteYoutube"
                                            onsubmit={(e) => {
                                                if (
                                                    !confirm(
                                                        "Hapus YouTube item ini?",
                                                    )
                                                )
                                                    e.preventDefault();
                                            }}
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={item.id}
                                            />
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
                        {#if data.youtubeItems.length === 0}
                            <p class="text-xs text-slate-400">
                                Belum ada YouTube item.
                            </p>
                        {/if}
                    </div>
                    <Pagination
                        currentPage={data.youtubePage}
                        totalPages={data.youtubeTotalPages}
                        totalItems={data.youtubeTotal}
                        paramName="pageYT"
                    />
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

                    <!-- Daftar Jadwal Tersimpan -->
                    <h3 class="mt-5 text-sm font-semibold text-emerald-800">
                        Jadwal Tersimpan
                    </h3>
                    <div class="mt-2 overflow-x-auto">
                        <table class="w-full text-xs">
                            <thead>
                                <tr
                                    class="border-b border-emerald-100 text-left text-slate-500"
                                >
                                    <th class="pb-1 pr-2 font-medium"
                                        >Tanggal</th
                                    >
                                    <th class="pb-1 pr-2 font-medium">Imsak</th>
                                    <th class="pb-1 pr-2 font-medium">Subuh</th>
                                    <th class="pb-1 pr-2 font-medium">Dzuhur</th
                                    >
                                    <th class="pb-1 pr-2 font-medium">Ashar</th>
                                    <th class="pb-1 pr-2 font-medium"
                                        >Maghrib</th
                                    >
                                    <th class="pb-1 font-medium">Isya</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.prayerScheduleList as s}
                                    <tr
                                        class="border-b border-emerald-50 hover:bg-emerald-50"
                                    >
                                        <td
                                            class="py-1 pr-2 font-medium text-slate-700"
                                        >
                                            {new Date(
                                                s.scheduleDate,
                                            ).toLocaleDateString("id-ID", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td class="py-1 pr-2 text-slate-600"
                                            >{s.imsakTime}</td
                                        >
                                        <td class="py-1 pr-2 text-slate-600"
                                            >{s.subuhTime}</td
                                        >
                                        <td class="py-1 pr-2 text-slate-600"
                                            >{s.dzuhurTime}</td
                                        >
                                        <td class="py-1 pr-2 text-slate-600"
                                            >{s.asharTime}</td
                                        >
                                        <td class="py-1 pr-2 text-slate-600"
                                            >{s.maghribTime}</td
                                        >
                                        <td class="py-1 text-slate-600"
                                            >{s.isyaTime}</td
                                        >
                                    </tr>
                                {/each}
                                {#if data.prayerScheduleList.length === 0}
                                    <tr>
                                        <td
                                            colspan="7"
                                            class="py-3 text-center text-slate-400"
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
                </article>
            </section>

            <!-- SECTION SLIDE FOTO -->
            <section class="rounded-2xl bg-white p-6 shadow-sm">
                <h2 class="text-lg font-semibold text-emerald-900">
                    🖼️ Slide Foto Display TV
                </h2>
                <p class="mt-1 text-xs text-slate-500">
                    Upload foto untuk ditampilkan sebagai slideshow di layar TV
                    masjid. Format: JPEG, PNG. Maks 1MB.
                </p>

                <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    <!-- Form Upload -->
                    <div class="space-y-3">
                        <div>
                            <label
                                for="slide-title"
                                class="block text-xs font-medium text-slate-600 mb-1"
                                >Judul Slide (opsional)</label
                            >
                            <input
                                id="slide-title"
                                type="text"
                                bind:value={slideTitle}
                                placeholder="cth: Pengumuman Ramadan"
                                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label
                                for="slide-file"
                                class="block text-xs font-medium text-slate-600 mb-1"
                                >File Foto</label
                            >
                            <input
                                id="slide-file"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onchange={(e) => {
                                    slideFile = (e.target as HTMLInputElement)
                                        .files;
                                }}
                                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                            />
                        </div>
                        <button
                            onclick={uploadSlide}
                            disabled={slideUploading}
                            class="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {#if slideUploading}Mengupload...{:else}⬆️ Upload
                                Foto{/if}
                        </button>
                        {#if slideUploadError}
                            <p class="text-xs text-red-500">
                                {slideUploadError}
                            </p>
                        {/if}
                        {#if slideUploadSuccess}
                            <p class="text-xs text-emerald-600 font-medium">
                                ✅ Foto berhasil diupload!
                            </p>
                        {/if}
                    </div>

                    <!-- Daftar Slide -->
                    <div>
                        <p class="text-xs font-medium text-slate-600 mb-2">
                            Slide Terdaftar ({data.slides.length})
                        </p>
                        {#if data.slides.length === 0}
                            <p class="text-xs text-slate-400 italic">
                                Belum ada slide foto.
                            </p>
                        {:else}
                            <div class="space-y-2 max-h-64 overflow-y-auto">
                                {#each data.slides as slide}
                                    <div
                                        class="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                                    >
                                        <div>
                                            <p
                                                class="text-sm font-medium text-slate-700"
                                            >
                                                {slide.title ?? "Tanpa judul"}
                                            </p>
                                            <p class="text-xs text-slate-400">
                                                Order: {slide.orderIndex} • {slide.isActive
                                                    ? "Aktif"
                                                    : "Nonaktif"}
                                            </p>
                                        </div>
                                        <form
                                            method="POST"
                                            action="?/deleteSlide"
                                        >
                                            <input
                                                type="hidden"
                                                name="slide_id"
                                                value={slide.id}
                                            />
                                            <button
                                                type="submit"
                                                class="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                                                onclick={(e) => {
                                                    if (
                                                        !confirm(
                                                            "Hapus slide ini?",
                                                        )
                                                    )
                                                        e.preventDefault();
                                                }}>Hapus</button
                                            >
                                        </form>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
                <Pagination
                    currentPage={data.slidePage}
                    totalPages={data.slideTotalPages}
                    totalItems={data.slideTotal}
                    paramName="pageSL"
                />
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
                    <!-- Tab switcher -->
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
                <div
                    class="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                    <p
                        class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                        Sumber Data — MyQuran API
                    </p>
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
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                                    /></svg
                                >
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
                                Mencari kota...
                            </p>
                        {/if}
                        {#if searchError}
                            <p class="mt-1.5 text-xs text-red-500">
                                {searchError}
                            </p>
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
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                                                /><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                /></svg
                                            >
                                            {kota.lokasi}
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
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
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                /></svg
                            >
                            <span class="text-xs font-medium text-emerald-800"
                                >Kota dipilih: <strong
                                    >{selectedKota.lokasi}</strong
                                ></span
                            >
                        </div>
                    {/if}
                </div>

                <!-- ================================================ -->
                <!-- TAB: IMPORT BULANAN                              -->
                <!-- ================================================ -->
                {#if activeTab === "bulk"}
                    <div class="mt-5 space-y-4">
                        <!-- Pilih bulan & tahun -->
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
                                        <option
                                            value={String(i + 1).padStart(
                                                2,
                                                "0",
                                            )}>{name}</option
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
                                    disabled={bulkLoading || !selectedKota}
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

                        <!-- Preview tabel -->
                        {#if bulkPreview.length > 0}
                            <div
                                class="overflow-hidden rounded-xl border border-slate-200"
                            >
                                <!-- Banner info -->
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
                                        <span
                                            class="text-xs font-medium text-emerald-800"
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
                                <!-- Tabel scroll -->
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
                                        <tbody
                                            class="divide-y divide-slate-100"
                                        >
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

                <!-- ================================================ -->
                <!-- TAB: INPUT MANUAL                                -->
                <!-- ================================================ -->
                {#if activeTab === "manual"}
                    <div class="mt-5 space-y-4">
                        <!-- Tombol tarik dari API -->
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
                                    !selectedKota ||
                                    !scheduleDate}
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

                        <!-- Grid waktu sholat -->
                        <form
                            method="POST"
                            action="?/addPrayerSchedule"
                            use:enhance
                            class="rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                            <input
                                type="hidden"
                                name="masjid_id"
                                value={data.masjid.id}
                            />
                            <input
                                type="hidden"
                                name="scheduleDate"
                                value={scheduleDate}
                            />
                            <div
                                class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                            >
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
                                    Jadwal akan disimpan untuk tanggal yang
                                    dipilih di atas
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
        {/if}
    </div>
</div>
