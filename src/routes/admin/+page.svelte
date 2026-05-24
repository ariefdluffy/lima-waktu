<script lang="ts">
    import { enhance, deserialize } from "$app/forms";
    import { goto, invalidate } from "$app/navigation";
    import { page } from "$app/stores";
    import Pagination from "$lib/components/Pagination.svelte";
    import AdminSidebar from "$lib/components/admin/AdminSidebar.svelte";
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import PrayerCorrection from "$lib/components/admin/PrayerCorrection.svelte";

    // Generate unique device code
    function generateDeviceCode(): string {
        return "LW-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    }
    let generatedDeviceCode = $state(generateDeviceCode());

    let { data } = $props();

    function dismissAnnouncement(id: number) {
        const el = document.getElementById("ann-" + id);
        if (el) el.remove();
    }

    const SEVERITY_COLORS: Record<string, string> = {
        info: "border-blue-200 bg-blue-50 text-blue-800",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
        critical: "border-red-200 bg-red-50 text-red-800",
    };

    // Announcements from admin layout data
    let announcements: Array<{
        id: number;
        title: string;
        content: string | null;
        severity: string;
    }> = $derived(($page.data as any).announcements ?? []);

    // Subscription utilities
    const STATUS_LABELS: Record<string, string> = {
        trial: "Masa Trial",
        active: "Aktif",
        grace: "Masa Tenggang",
        expired: "Kadaluarsa",
        cancelled: "Dibatalkan",
    };

    const STATUS_COLORS: Record<string, string> = {
        trial: "border-blue-200 bg-blue-50 text-blue-800",
        active: "border-emerald-200 bg-emerald-50 text-emerald-800",
        grace: "border-yellow-200 bg-yellow-50 text-yellow-800",
        expired: "border-red-200 bg-red-50 text-red-800",
        cancelled: "border-slate-200 bg-slate-50 text-slate-600",
    };

    function daysRemaining(endDate: string | Date): number {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    function formatDate(d: string | Date): string {
        return new Date(d).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    function isExpired(sub: {
        status: string;
        endDate: string | Date;
    }): boolean {
        if (sub.status === "expired") return true;
        if (
            (sub.status === "trial" || sub.status === "grace") &&
            new Date(sub.endDate) < new Date()
        )
            return true;
        return false;
    }

    // Type helper: slide dari server sudah include fileUrl via join
    function getSlideUrl(slide: any): string | null {
        return slide?.fileUrl ?? null;
    }

    // ----------------------------------------------------------------
    // Section navigation
    // ----------------------------------------------------------------
    type Section =
        | "dashboard"
        | "profile"
        | "runningtext"
        | "devices"
        | "iqamah"
        | "other"
        | "jumbotron"
        | "events"
        | "youtube"
        | "schedule"
        | "slides"
        | "tema"
        | "langganan";
    let activeSection = $state<Section>("dashboard");
    let mobileOpen = $state(false);

    // ----------------------------------------------------------------
    // Confirm dialog (hapus jumbotron)
    // ----------------------------------------------------------------
    let confirmOpen = $state(false);
    let pendingDeleteId = $state<number | null>(null);
    let pendingDeleteTitle = $state("");

    function askDeleteJumbotron(id: number, title: string) {
        pendingDeleteId = id;
        pendingDeleteTitle = title;
        confirmOpen = true;
    }

    function cancelDelete() {
        confirmOpen = false;
        pendingDeleteId = null;
        pendingDeleteTitle = "";
    }

    async function confirmDeleteJumbotron() {
        if (pendingDeleteId === null) return;
        confirmOpen = false;
        const formData = new FormData();
        formData.set("id", String(pendingDeleteId));
        const res = await fetch("?/deleteJumbotron", {
            method: "POST",
            body: formData,
        });
        const result = deserialize(await res.text());
        if (result.type === "success" || result.type === "redirect") {
            await invalidate("app:admin");
        }
        pendingDeleteId = null;
        pendingDeleteTitle = "";
    }

    // ----------------------------------------------------------------
    // Confirm dialog (hapus event)
    // ----------------------------------------------------------------
    let confirmEventOpen = $state(false);
    let pendingDeleteEventId = $state<number | null>(null);
    let pendingDeleteEventTitle = $state("");

    function askDeleteEvent(id: number, title: string) {
        pendingDeleteEventId = id;
        pendingDeleteEventTitle = title;
        confirmEventOpen = true;
    }

    function cancelDeleteEvent() {
        confirmEventOpen = false;
        pendingDeleteEventId = null;
        pendingDeleteEventTitle = "";
    }

    async function confirmDeleteEvent() {
        if (pendingDeleteEventId === null) return;
        confirmEventOpen = false;
        const formData = new FormData();
        formData.set("id", String(pendingDeleteEventId));
        const res = await fetch("?/deleteEvent", {
            method: "POST",
            body: formData,
        });
        const result = deserialize(await res.text());
        if (result.type === "success" || result.type === "redirect") {
            await invalidate("app:admin");
        }
        pendingDeleteEventId = null;
        pendingDeleteEventTitle = "";
    }

    // ----------------------------------------------------------------
    // Hapus semua data masjid
    // ----------------------------------------------------------------
    let confirmDeleteMasjidOpen = $state(false);

    function openDeleteMasjidDialog() {
        confirmDeleteMasjidOpen = true;
    }

    function handleDeleteMasjid() {
        confirmDeleteMasjidOpen = false;
        const m = data.masjid;
        if (!m) return;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "?/deleteMasjid";
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "masjid_id";
        input.value = m.id;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }

    function navigateTo(section: string) {
        if (section === "langganan") {
            goto("/admin?section=langganan");
            return;
        }
        activeSection = section as Section;
    }

    // Read section from URL param on mount
    $effect(() => {
        const s = $page.url.searchParams.get("section");
        if (
            s === "langganan" ||
            s === "dashboard" ||
            s === "profile" ||
            s === "runningtext" ||
            s === "devices" ||
            s === "iqamah" ||
            s === "other" ||
            s === "jumbotron" ||
            s === "events" ||
            s === "youtube" ||
            s === "schedule" ||
            s === "slides" ||
            s === "tema"
        ) {
            activeSection = s as Section;
        }
    });
    let toastMessage = $state("");
    let toastVisible = $state(false);

    function showToast(msg: string) {
        toastMessage = msg;
        toastVisible = true;
        setTimeout(() => {
            toastVisible = false;
            toastMessage = "";
        }, 2500);
    }

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
    // Adzan screen duration
    // ----------------------------------------------------------------
    let adzanDuration = $state(
        (() => {
            const v = data.masjid?.adzanScreenDuration;
            return v ?? 4;
        })(),
    );
    let khusukDuration = $state(
        (() => {
            const v = data.masjid?.khusukScreenDuration;
            return v ?? 10;
        })(),
    );
    let adzanDurationSaving = $state(false);
    let adzanDurationSuccess = $state(false);

    async function saveAdzanDuration() {
        adzanDurationSaving = true;
        adzanDurationSuccess = false;
        try {
            const res = await fetch("/api/v1/masjid/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adzanScreenDuration: Number(adzanDuration),
                    khusukScreenDuration: Number(khusukDuration),
                }),
            });
            const json = await res.json();
            if (json.ok) {
                adzanDurationSuccess = true;
                setTimeout(() => (adzanDurationSuccess = false), 3000);
                await invalidate(() => true);
            }
        } catch {}
        adzanDurationSaving = false;
    }

    // ----------------------------------------------------------------
    // Screensaver / mode hemat
    // ----------------------------------------------------------------
    let screensaverDelay = $state(
        (() => {
            const v = data.masjid?.screensaverDelayMinutes;
            return v ?? 120;
        })(),
    );
    let screensaverWake = $state(
        (() => {
            const v = data.masjid?.screensaverWakeMinutes;
            return v ?? 60;
        })(),
    );
    let morningDelay = $state(
        (() => {
            const v = data.masjid?.screensaverMorningDelayMinutes;
            return v ?? 60;
        })(),
    );
    let morningWake = $state(
        (() => {
            const v = data.masjid?.screensaverMorningWakeMinutes;
            return v ?? 120;
        })(),
    );
    let screensaverSaving = $state(false);
    let screensaverSuccess = $state(false);

    async function saveScreensaver() {
        screensaverSaving = true;
        screensaverSuccess = false;
        try {
            const res = await fetch("/api/v1/masjid/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    screensaverDelayMinutes: Number(screensaverDelay),
                    screensaverWakeMinutes: Number(screensaverWake),
                    screensaverMorningDelayMinutes: Number(morningDelay),
                    screensaverMorningWakeMinutes: Number(morningWake),
                }),
            });
            const json = await res.json();
            if (json.ok) {
                screensaverSuccess = true;
                setTimeout(() => (screensaverSuccess = false), 3000);
            }
        } catch {}
        screensaverSaving = false;
    }

    // ----------------------------------------------------------------
    // Hijri offset
    // ----------------------------------------------------------------
    let hijriOffset = $state(
        (() => {
            const v = data.masjid?.hijriOffset;
            return v ?? 0;
        })(),
    );
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
            const res = await fetch("/api/v1/masjid/geocode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ city: cityName }),
            });
            const json = await res.json();
            if (json.ok) {
                weatherLat = json.data.latitude;
                weatherLon = json.data.longitude;
                await invalidate(() => true);
            }
        } catch {
            // gagal resolve lat/lon — tidak critical, hanya weather
        }
    }

    // ----------------------------------------------------------------
    // Cuaca: update lat/lon manual
    // ----------------------------------------------------------------
    let weatherLat = $state(
        (() => {
            const v = data.masjid?.latitude;
            return v ?? "";
        })(),
    );
    let weatherLon = $state(
        (() => {
            const v = data.masjid?.longitude;
            return v ?? "";
        })(),
    );
    let weatherLocSaving = $state(false);
    let weatherLocSuccess = $state("");
    let weatherLocError = $state("");
    let weatherGeoLoading = $state(false);
    let weatherGeoSuccess = $state("");
    let weatherGeoError = $state("");

    async function autoResolveFromCity() {
        const city = data.masjid?.city?.trim();
        if (!city) {
            weatherGeoError = "Masjid belum memiliki data kota";
            setTimeout(() => (weatherGeoError = ""), 3000);
            return;
        }
        weatherGeoLoading = true;
        weatherGeoSuccess = "";
        weatherGeoError = "";
        try {
            const res = await fetch("/api/v1/masjid/geocode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ city }),
            });
            const json = await res.json();
            if (json.ok) {
                weatherLat = json.data.latitude;
                weatherLon = json.data.longitude;
                weatherGeoSuccess = `✓ Koordinat untuk "${city}" tersimpan`;
                setTimeout(() => (weatherGeoSuccess = ""), 4000);
                await invalidate(() => true);
            } else {
                weatherGeoError = json.message || "Gagal resolve";
                setTimeout(() => (weatherGeoError = ""), 4000);
            }
        } catch {
            weatherGeoError = "Gagal menghubungi server";
            setTimeout(() => (weatherGeoError = ""), 4000);
        } finally {
            weatherGeoLoading = false;
        }
    }

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
    let profileName = $state(
        (() => {
            const v = data.masjid?.name;
            return v ?? "";
        })(),
    );
    let profileAddress = $state(
        (() => {
            const v = data.masjid?.address;
            return v ?? "";
        })(),
    );
    let profileCity = $state(
        (() => {
            const v = data.masjid?.city;
            return v ?? "";
        })(),
    );
    let profileDistrict = $state(
        (() => {
            const v = data.masjid?.district;
            return v ?? "";
        })(),
    );
    let profileProvince = $state(
        (() => {
            const v = data.masjid?.province;
            return v ?? "";
        })(),
    );
    let profileTimezone = $state(
        (() => {
            const v = data.masjid?.timezone;
            return v ?? "Asia/Jakarta";
        })(),
    );
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
                    timezone: profileTimezone,
                }),
            });
            const json = await res.json();
            if (json.ok) {
                profileSuccess = "✓ Profil disimpan";
                setTimeout(() => (profileSuccess = ""), 3000);
                // Auto-resolve lat/lon dari city jika belum ada
                const city = profileCity.trim();
                if (city && !weatherLat && !data.masjid?.latitude) {
                    resolveAndSaveLatLon(city);
                }
                await invalidate(() => true);
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
    let logoPreview = $state(
        (() => {
            const v = data.masjid?.logoUrl;
            return v ?? "";
        })(),
    );
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
                // Refresh page data biar list jadwal terbaru muncul
                await invalidate(() => true);
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

<div class="flex min-h-screen bg-slate-50">
    <AdminSidebar {activeSection} onNavigate={navigateTo} bind:mobileOpen />

    <!-- Main Content Area -->
    <div class="flex flex-1 flex-col xl:ml-72">
        <!-- Top Header Bar -->
        <header
            class="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8"
        >
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div
                        class="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-emerald-700 text-white text-xs font-bold"
                    >
                        LW
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-slate-800">
                            {activeSection === "dashboard"
                                ? "Dashboard"
                                : activeSection === "profile"
                                  ? "Profil Masjid"
                                  : activeSection === "runningtext"
                                    ? "Running Text"
                                    : activeSection === "devices"
                                      ? "Perangkat"
                                      : activeSection === "iqamah"
                                        ? "Iqamah"
                                        : activeSection === "other"
                                          ? "Pengaturan Lain"
                                          : activeSection === "jumbotron"
                                            ? "Jumbotron"
                                            : activeSection === "events"
                                              ? "Hari Besar"
                                              : activeSection === "youtube"
                                                ? "YouTube"
                                                : activeSection === "schedule"
                                                  ? "Jadwal Sholat"
                                                  : activeSection === "slides"
                                                    ? "Slide Foto"
                                                    : "Dashboard"}
                        </p>
                        {#if data.masjid}
                            <p class="text-xs text-slate-400">
                                {data.masjid.name} • {data.masjid.city ?? "-"}
                            </p>
                        {/if}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="hidden sm:inline text-xs text-slate-400"
                        >{data.user?.fullName ?? "Admin"}</span
                    >
                    <form
                        method="POST"
                        action="/auth/logout"
                        class="hidden sm:block"
                    >
                        <button
                            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                            >Keluar</button
                        >
                    </form>
                </div>
            </div>
        </header>

        <!-- Content Area -->
        <div class="flex-1 px-4 py-4 sm:px-6 lg:px-8">
            <div class="mx-auto w-full max-w-7xl space-y-6">
                <!-- Announcement Banners -->
                {#if announcements.length > 0}
                    <div class="space-y-1">
                        {#each announcements as a}
                            <div
                                id="ann-{a.id}"
                                class="flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm {SEVERITY_COLORS[
                                    a.severity
                                ] ?? SEVERITY_COLORS['info']}"
                            >
                                <div class="flex-1">
                                    <span class="font-semibold">{a.title}</span>
                                    {#if a.content}
                                        <span class="ml-1">— {a.content}</span>
                                    {/if}
                                </div>
                                <button
                                    class="shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100"
                                    onclick={() => dismissAnnouncement(a.id)}
                                    aria-label="Tutup">✕</button
                                >
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if !data.masjid}
                    <div class="rounded-2xl bg-white p-8 shadow-sm">
                        <div
                            class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
                        >
                            <svg
                                class="h-10 w-10 text-emerald-600"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.5"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                /></svg
                            >
                        </div>
                        <h2
                            class="text-center text-xl font-bold text-slate-700"
                        >
                            Selamat Datang!
                        </h2>
                        <p class="mt-1 text-center text-sm text-slate-500">
                            Anda belum memiliki masjid. Buat masjid baru untuk
                            memulai.
                        </p>

                        <form
                            method="POST"
                            action="?/createMasjid"
                            class="mx-auto mt-6 max-w-lg space-y-4"
                        >
                            <label class="block space-y-1">
                                <span
                                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >Nama Masjid *</span
                                >
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                                />
                            </label>

                            <div class="grid gap-3 sm:grid-cols-2">
                                <label class="block space-y-1">
                                    <span
                                        class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                        >Kota</span
                                    >
                                    <input
                                        name="city"
                                        type="text"
                                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                                    />
                                </label>
                                <label class="block space-y-1">
                                    <span
                                        class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                        >Provinsi</span
                                    >
                                    <input
                                        name="province"
                                        type="text"
                                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                                    />
                                </label>
                            </div>

                            <label class="block space-y-1">
                                <span
                                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >Alamat</span
                                >
                                <textarea
                                    name="address"
                                    rows="2"
                                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                                ></textarea>
                            </label>

                            <label class="block space-y-1">
                                <span
                                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >Zona Waktu</span
                                >
                                <select
                                    name="timezone"
                                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                                >
                                    <option value="Asia/Jakarta"
                                        >WIB — Jakarta, Sumatra, Jawa Barat,
                                        Kalimantan Barat</option
                                    >
                                    <option value="Asia/Makassar"
                                        >WITA — Sulawesi, Bali, Nusa Tenggara,
                                        Kalimantan Selatan &amp; Timur</option
                                    >
                                    <option value="Asia/Jayapura"
                                        >WIT — Maluku, Papua</option
                                    >
                                </select>
                            </label>

                            <button
                                type="submit"
                                class="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
                            >
                                Buat Masjid Sekarang
                            </button>
                        </form>
                    </div>
                {:else}
                    <!-- ========== DASHBOARD ========== -->
                    {#if activeSection === "dashboard"}
                        <!-- Stats Cards -->
                        <section
                            class="grid gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                        >
                            <button
                                class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
                                onclick={() => navigateTo("runningtext")}
                            >
                                <div class="flex items-center gap-3">
                                    <span
                                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
                                    >
                                        <svg
                                            class="h-4.5 w-4.5"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M4 6h16M4 12h16M4 18h7"
                                            /></svg
                                        >
                                    </span>
                                    <div>
                                        <p
                                            class="text-[11px] font-medium text-slate-400"
                                        >
                                            Running Text
                                        </p>
                                        <p
                                            class="text-xl font-bold text-slate-700"
                                        >
                                            {data.runningTexts.length}
                                        </p>
                                    </div>
                                </div>
                            </button>
                            <button
                                class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
                                onclick={() => navigateTo("devices")}
                            >
                                <div class="flex items-center gap-3">
                                    <span
                                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600"
                                    >
                                        <svg
                                            class="h-4.5 w-4.5"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            /></svg
                                        >
                                    </span>
                                    <div>
                                        <p
                                            class="text-[11px] font-medium text-slate-400"
                                        >
                                            Devices
                                        </p>
                                        <p
                                            class="text-xl font-bold text-slate-700"
                                        >
                                            {data.devices.length}
                                        </p>
                                    </div>
                                </div>
                            </button>
                            <button
                                class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
                                onclick={() => navigateTo("slides")}
                            >
                                <div class="flex items-center gap-3">
                                    <span
                                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
                                    >
                                        <svg
                                            class="h-4.5 w-4.5"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            /></svg
                                        >
                                    </span>
                                    <div>
                                        <p
                                            class="text-[11px] font-medium text-slate-400"
                                        >
                                            Slides
                                        </p>
                                        <p
                                            class="text-xl font-bold text-slate-700"
                                        >
                                            {data.slides.length}
                                        </p>
                                    </div>
                                </div>
                            </button>
                            <button
                                class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
                                onclick={() => navigateTo("jumbotron")}
                            >
                                <div class="flex items-center gap-3">
                                    <span
                                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600"
                                    >
                                        <svg
                                            class="h-4.5 w-4.5"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            /></svg
                                        >
                                    </span>
                                    <div>
                                        <p
                                            class="text-[11px] font-medium text-slate-400"
                                        >
                                            Jumbotrons
                                        </p>
                                        <p
                                            class="text-xl font-bold text-slate-700"
                                        >
                                            {data.jumbotrons.length}
                                        </p>
                                    </div>
                                </div>
                            </button>
                            <button
                                class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
                                onclick={() => navigateTo("events")}
                            >
                                <div class="flex items-center gap-3">
                                    <span
                                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600"
                                    >
                                        <svg
                                            class="h-4.5 w-4.5"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            /></svg
                                        >
                                    </span>
                                    <div>
                                        <p
                                            class="text-[11px] font-medium text-slate-400"
                                        >
                                            Events
                                        </p>
                                        <p
                                            class="text-xl font-bold text-slate-700"
                                        >
                                            {data.eventTotal}
                                        </p>
                                    </div>
                                </div>
                            </button>
                            <button
                                class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
                                onclick={() => navigateTo("youtube")}
                            >
                                <div class="flex items-center gap-3">
                                    <span
                                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600"
                                    >
                                        <svg
                                            class="h-4.5 w-4.5"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.8"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            /></svg
                                        >
                                    </span>
                                    <div>
                                        <p
                                            class="text-[11px] font-medium text-slate-400"
                                        >
                                            YouTube
                                        </p>
                                        <p
                                            class="text-xl font-bold text-slate-700"
                                        >
                                            {data.youtubeItems.length}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </section>

                        <!-- Today's Schedule Quick View -->
                        {#if data.todaySchedule}
                            {@const times = [
                                {
                                    label: "Subuh",
                                    time: data.todaySchedule.subuhTime,
                                    icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
                                },
                                {
                                    label: "Dzuhur",
                                    time: data.todaySchedule.dzuhurTime,
                                    icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
                                },
                                {
                                    label: "Ashar",
                                    time: data.todaySchedule.asharTime,
                                    icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
                                },
                                {
                                    label: "Maghrib",
                                    time: data.todaySchedule.maghribTime,
                                    icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
                                },
                                {
                                    label: "Isya",
                                    time: data.todaySchedule.isyaTime,
                                    icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
                                },
                            ]}
                            <section class="rounded-2xl bg-white p-5 shadow-sm">
                                <h3
                                    class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"
                                >
                                    <svg
                                        class="h-4 w-4 text-emerald-500"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        viewBox="0 0 24 24"
                                        ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        /></svg
                                    >
                                    Jadwal Hari Ini
                                </h3>
                                <div
                                    class="grid grid-cols-3 sm:grid-cols-5 gap-2"
                                >
                                    {#each times as t}
                                        <div
                                            class="rounded-xl bg-linear-to-b from-emerald-50 to-white border border-emerald-100 p-3 text-center"
                                        >
                                            <p
                                                class="text-[10px] font-medium text-slate-500 mb-1"
                                            >
                                                {t.label}
                                            </p>
                                            <p
                                                class="text-sm font-bold text-emerald-700"
                                            >
                                                {t.time}
                                            </p>
                                        </div>
                                    {/each}
                                </div>
                            </section>
                        {:else}
                            <div
                                class="rounded-2xl bg-white p-5 shadow-sm text-center"
                            >
                                <p class="text-sm text-slate-400">
                                    📅 Belum ada jadwal untuk hari ini. <button
                                        class="text-emerald-600 underline font-medium"
                                        onclick={() => navigateTo("schedule")}
                                        >Import jadwal</button
                                    >
                                </p>
                            </div>
                        {/if}

                        <!-- Quick Action Buttons -->
                        {@const quickActions = [
                            {
                                id: "profile",
                                label: "Profil",
                                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                                color: "bg-emerald-50 text-emerald-600",
                            },
                            {
                                id: "schedule",
                                label: "Jadwal",
                                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h.01M9 13h.01M13 9h.01M13 13h.01",
                                color: "bg-blue-50 text-blue-600",
                            },
                            {
                                id: "devices",
                                label: "Perangkat",
                                icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                                color: "bg-purple-50 text-purple-600",
                            },
                            {
                                id: "events",
                                label: "Events",
                                icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                                color: "bg-orange-50 text-orange-600",
                            },
                            {
                                id: "runningtext",
                                label: "Running Text",
                                icon: "M4 6h16M4 12h16M4 18h7",
                                color: "bg-amber-50 text-amber-600",
                            },
                            {
                                id: "slides",
                                label: "Slide",
                                icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
                                color: "bg-rose-50 text-rose-600",
                            },
                        ]}
                        <section class="rounded-2xl bg-white p-5 shadow-sm">
                            <h3
                                class="text-sm font-semibold text-slate-700 mb-3"
                            >
                                ⚡ Aksi Cepat
                            </h3>
                            <div
                                class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
                            >
                                {#each quickActions as qa}
                                    <button
                                        onclick={() => navigateTo(qa.id)}
                                        class="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-600 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all"
                                    >
                                        <span
                                            class="flex h-8 w-8 items-center justify-center rounded-lg {qa.color}"
                                        >
                                            <svg
                                                class="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.8"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d={qa.icon}
                                                /></svg
                                            >
                                        </span>
                                        {qa.label}
                                    </button>
                                {/each}
                            </div>
                        </section>
                    {/if}

                    {#if activeSection === "profile"}
                        <!-- PROFIL MASJID -->
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
                                        Profil Masjid
                                    </h2>
                                    <p class="mt-0.5 text-xs text-slate-500">
                                        Edit nama, alamat, dan upload logo
                                        masjid.
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
                                    <div>
                                        <label
                                            for="profile-timezone"
                                            class="mb-1 block text-xs font-medium text-slate-600"
                                            >Zona Waktu</label
                                        >
                                        <select
                                            id="profile-timezone"
                                            bind:value={profileTimezone}
                                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                                        >
                                            <option value="Asia/Jakarta"
                                                >WIB (Asia/Jakarta)</option
                                            >
                                            <option value="Asia/Makassar"
                                                >WITA (Asia/Makassar)</option
                                            >
                                            <option value="Asia/Jayapura"
                                                >WIT (Asia/Jayapura)</option
                                            >
                                        </select>
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
                                            <p
                                                class="text-sm font-medium text-emerald-600"
                                            >
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
                                            <span
                                                class="text-5xl text-emerald-300"
                                                >🕌</span
                                            >
                                        {/if}
                                    </div>
                                    <input
                                        id="logo-file"
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        onchange={(e) => {
                                            const files = (
                                                e.target as HTMLInputElement
                                            ).files;
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
                                        <p
                                            class="text-sm font-medium text-emerald-600"
                                        >
                                            {logoSuccess}
                                        </p>
                                    {/if}
                                    {#if logoError}
                                        <p class="text-sm text-red-500">
                                            {logoError}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        </section>

                        <!-- ZONA BERBAHAYA: HAPUS DATA MASJID -->
                        <section
                            class="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6 shadow-sm"
                        >
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-red-800"
                                    >
                                        ⚠️ Zona Berbahaya
                                    </h2>
                                    <p class="mt-0.5 text-xs text-red-600">
                                        Tindakan ini akan menghapus <strong
                                            >semua data masjid</strong
                                        > secara permanen, termasuk perangkat, jadwal
                                        sholat, slide, jumbotron, running text, YouTube,
                                        dan data lainnya. Tidak bisa dibatalkan.
                                    </p>
                                </div>
                            </div>
                            <div class="mt-4 flex flex-wrap items-center gap-4">
                                <button
                                    onclick={openDeleteMasjidDialog}
                                    class="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md active:scale-[0.97]"
                                >
                                    🗑️ Hapus Semua Data Masjid
                                </button>
                            </div>
                        </section>
                    {/if}

                    {#if activeSection === "runningtext"}
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
                                                            value={item.speed ??
                                                                60}
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
                    {/if}

                    {#if activeSection === "devices"}
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
                                    type="hidden"
                                    name="device_code"
                                    value={generatedDeviceCode}
                                />
                                <input
                                    value={generatedDeviceCode}
                                    disabled
                                    class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 font-mono"
                                />
                                <button
                                    type="button"
                                    onclick={() => {
                                        const url =
                                            window.location.origin +
                                            "/display/" +
                                            generatedDeviceCode;
                                        navigator.clipboard.writeText(url);
                                        showToast("✓ Link display disalin!");
                                    }}
                                    class="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 transition-colors"
                                    title="Salin link publik display TV"
                                >
                                    📋 Copy Link
                                </button>
                                <input
                                    name="name"
                                    placeholder="Nama device"
                                    class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                                />
                                <select
                                    name="orientation"
                                    class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                                >
                                    <option value="horizontal"
                                        >Horizontal</option
                                    >
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
                                                <div
                                                    class="flex items-center gap-1.5"
                                                >
                                                    <a
                                                        href="/display/{item.deviceCode}"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                                                        title="Buka display di tab baru"
                                                    >
                                                        📺 Buka
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onclick={() => {
                                                            const url =
                                                                window.location
                                                                    .origin +
                                                                "/display/" +
                                                                item.deviceCode;
                                                            navigator.clipboard.writeText(
                                                                url,
                                                            );
                                                            showToast(
                                                                "✓ Link display disalin!",
                                                            );
                                                        }}
                                                        class="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                                                        title="Salin link publik display TV"
                                                    >
                                                        📋 Copy
                                                    </button>
                                                    <span
                                                        class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium
                                                {item.layoutMode === 'youtube'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-emerald-100 text-emerald-700'}"
                                                    >
                                                        {item.layoutMode ===
                                                        "youtube"
                                                            ? "▶ YouTube"
                                                            : "⊞ Default"}
                                                    </span>
                                                </div>
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
                                                            >⊞ Default (jadwal +
                                                            slide)</option
                                                        >
                                                        <option
                                                            value="youtube"
                                                            selected={item.layoutMode ===
                                                                "youtube"}
                                                            >▶ YouTube Streaming
                                                            (30% info / 70%
                                                            video)</option
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
                    {/if}

                    {#if activeSection === "iqamah"}
                        <!-- IQAMAH SETTINGS -->
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
                                        Pengaturan Iqamah
                                    </h2>
                                    <p class="mt-0.5 text-xs text-slate-500">
                                        Atur jeda menit antara adzan dan iqamah
                                        untuk setiap waktu sholat.
                                    </p>
                                </div>
                            </div>

                            <!-- Durasi Layar Adzan -->
                            <div
                                class="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
                            >
                                <div class="flex-1">
                                    <label
                                        for="adzan-duration"
                                        class="text-sm font-medium text-slate-700"
                                        >Durasi Layar Adzan</label
                                    >
                                    <p class="text-xs text-slate-500">
                                        Berapa menit layar "Waktu Adzan" tampil
                                        sebelum masuk mode Khusyuk.
                                    </p>
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
                                    <span class="text-sm text-slate-500"
                                        >menit</span
                                    >
                                </div>
                            </div>

                            <!-- Durasi Layar Khusyuk -->
                            <div
                                class="mt-2 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3"
                            >
                                <div class="flex-1">
                                    <label
                                        for="khusuk-duration"
                                        class="text-sm font-medium text-slate-700"
                                        >Durasi Layar Khusyuk</label
                                    >
                                    <p class="text-xs text-slate-500">
                                        Durasi layar Khusyuk/Iqamah setelah
                                        Iqamah selesai.
                                    </p>
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
                                    <span class="text-sm text-slate-500"
                                        >menit</span
                                    >
                                </div>
                            </div>

                            <div class="mt-3 flex items-center gap-2">
                                <button
                                    onclick={saveAdzanDuration}
                                    disabled={adzanDurationSaving}
                                    class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {#if adzanDurationSaving}
                                        ...
                                    {:else}
                                        Simpan
                                    {/if}
                                </button>
                                {#if adzanDurationSuccess}
                                    <span
                                        class="text-xs font-medium text-emerald-600"
                                        >✓</span
                                    >
                                {/if}
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
                                                                iqamahForm[i]
                                                                    .enabled
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
                                                            iqamahForm[i]
                                                                .delayMinutes
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
                                    <p
                                        class="text-sm font-medium text-emerald-600"
                                    >
                                        ✓ Berhasil disimpan.
                                    </p>
                                {/if}
                                {#if iqamahSaveError}
                                    <p class="text-sm text-red-500">
                                        {iqamahSaveError}
                                    </p>
                                {/if}
                            </div>
                        </section>
                    {/if}

                    {#if activeSection === "other"}
                        <!-- PENGATURAN LAIN: HIJRI + CUACA -->
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
                                        Pengaturan Lain
                                    </h2>
                                    <p class="mt-0.5 text-xs text-slate-500">
                                        Kalender Hijriyah & Cuaca Lokal.
                                    </p>
                                </div>
                            </div>
                            <div class="mt-5 grid gap-6 lg:grid-cols-2">
                                <!-- HIJRI OFFSET -->
                                <div
                                    class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5"
                                >
                                    <h3
                                        class="text-sm font-semibold text-emerald-800"
                                    >
                                        Kalender Hijriyah
                                    </h3>
                                    <p class="mt-1 text-xs text-slate-500">
                                        Sesuaikan selisih tanggal hijriyah.
                                    </p>
                                    <div
                                        class="mt-4 flex flex-wrap items-end gap-3"
                                    >
                                        <div class="w-32">
                                            <label
                                                for="hijri-offset"
                                                class="mb-1 block text-xs font-medium text-slate-600"
                                                >Offset Hari</label
                                            >
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
                                            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            {#if hijriOffsetSaving}
                                                ...
                                            {:else}
                                                Simpan
                                            {/if}
                                        </button>
                                        {#if hijriOffsetSuccess}
                                            <p
                                                class="text-sm font-medium text-emerald-600"
                                            >
                                                {hijriOffsetSuccess}
                                            </p>
                                        {/if}
                                        {#if hijriOffsetError}
                                            <p class="text-sm text-red-500">
                                                {hijriOffsetError}
                                            </p>
                                        {/if}
                                    </div>
                                    <p class="mt-2 text-xs text-slate-400">
                                        {hijriOffset > 0
                                            ? "+ "
                                            : ""}{hijriOffset
                                            ? `${hijriOffset} hari lebih lambat`
                                            : "0 (standar)"}
                                    </p>
                                </div>

                                <!-- CUACA -->
                                <div
                                    class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5"
                                >
                                    <h3
                                        class="text-sm font-semibold text-emerald-800"
                                    >
                                        Cuaca Lokal
                                    </h3>
                                    <p class="mt-1 text-xs text-slate-500">
                                        Klik "Cari dari Kota" untuk auto-detect
                                        dari kota masjid, atau isi manual.
                                    </p>
                                    <div
                                        class="mt-4 flex flex-wrap items-end gap-3"
                                    >
                                        <div class="w-32">
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
                                        <div class="w-32">
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
                                            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            {#if weatherLocSaving}
                                                ...
                                            {:else}
                                                Simpan
                                            {/if}
                                        </button>
                                        {#if weatherLocSuccess}
                                            <p
                                                class="text-sm font-medium text-emerald-600"
                                            >
                                                {weatherLocSuccess}
                                            </p>
                                        {/if}
                                        {#if weatherLocError}
                                            <p class="text-sm text-red-500">
                                                {weatherLocError}
                                            </p>
                                        {/if}
                                    </div>
                                    <div
                                        class="mt-3 flex flex-wrap items-center gap-2"
                                    >
                                        <button
                                            onclick={autoResolveFromCity}
                                            disabled={weatherGeoLoading}
                                            class="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                        >
                                            {#if weatherGeoLoading}
                                                ...
                                            {:else}
                                                🗺️ Cari dari Kota
                                            {/if}
                                        </button>
                                        {#if weatherGeoSuccess}
                                            <p
                                                class="text-sm font-medium text-emerald-600"
                                            >
                                                {weatherGeoSuccess}
                                            </p>
                                        {/if}
                                        {#if weatherGeoError}
                                            <p class="text-sm text-red-500">
                                                {weatherGeoError}
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- MODE HEMAT ENERGI -->
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
                                        Mode Hemat Energi
                                    </h2>
                                    <p class="mt-0.5 text-xs text-slate-500">
                                        Layar akan masuk mode hemat setelah Isya
                                        dan aktif kembali sebelum Subuh. Juga
                                        bisa aktif di pagi hari setelah Syuruq.
                                    </p>
                                </div>
                            </div>
                            <div class="mt-5 grid gap-4 sm:grid-cols-2">
                                <div
                                    class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5"
                                >
                                    <h3
                                        class="text-sm font-semibold text-emerald-800"
                                    >
                                        Aktif Setelah Isya
                                    </h3>
                                    <p class="mt-1 text-xs text-slate-500">
                                        Berapa menit setelah Isya layar masuk
                                        mode hemat.
                                    </p>
                                    <div class="mt-4">
                                        <label
                                            for="screensaver-delay"
                                            class="mb-1 block text-xs font-medium text-slate-600"
                                            >Menit setelah Isya</label
                                        >
                                        <input
                                            id="screensaver-delay"
                                            type="number"
                                            min="0"
                                            max="300"
                                            bind:value={screensaverDelay}
                                            class="w-32 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div
                                    class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5"
                                >
                                    <h3
                                        class="text-sm font-semibold text-emerald-800"
                                    >
                                        Bangun Sebelum Subuh
                                    </h3>
                                    <p class="mt-1 text-xs text-slate-500">
                                        Berapa menit sebelum Subuh layar aktif
                                        kembali.
                                    </p>
                                    <div class="mt-4">
                                        <label
                                            for="screensaver-wake"
                                            class="mb-1 block text-xs font-medium text-slate-600"
                                            >Menit sebelum Subuh</label
                                        >
                                        <input
                                            id="screensaver-wake"
                                            type="number"
                                            min="0"
                                            max="120"
                                            bind:value={screensaverWake}
                                            class="w-32 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <h3
                                class="mt-6 text-sm font-semibold text-emerald-800"
                            >
                                🌅 Mode Hemat Pagi
                            </h3>
                            <p class="mt-0.5 text-xs text-slate-500">
                                Layar masuk mode hemat setelah Syuruq dan aktif
                                kembali sebelum Dzuhur.
                            </p>
                            <div class="mt-3 grid gap-4 sm:grid-cols-2">
                                <div
                                    class="rounded-xl border border-amber-100 bg-amber-50/40 p-5"
                                >
                                    <h3
                                        class="text-sm font-semibold text-amber-800"
                                    >
                                        Aktif Setelah Syuruq
                                    </h3>
                                    <p class="mt-1 text-xs text-slate-500">
                                        Berapa menit setelah Syuruq layar masuk
                                        mode hemat.
                                    </p>
                                    <div class="mt-4">
                                        <label
                                            for="morning-delay"
                                            class="mb-1 block text-xs font-medium text-slate-600"
                                            >Menit setelah Syuruq</label
                                        >
                                        <input
                                            id="morning-delay"
                                            type="number"
                                            min="0"
                                            max="300"
                                            bind:value={morningDelay}
                                            class="w-32 rounded-xl border border-amber-200 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div
                                    class="rounded-xl border border-amber-100 bg-amber-50/40 p-5"
                                >
                                    <h3
                                        class="text-sm font-semibold text-amber-800"
                                    >
                                        Bangun Sebelum Dzuhur
                                    </h3>
                                    <p class="mt-1 text-xs text-slate-500">
                                        Berapa menit sebelum Dzuhur layar aktif
                                        kembali.
                                    </p>
                                    <div class="mt-4">
                                        <label
                                            for="morning-wake"
                                            class="mb-1 block text-xs font-medium text-slate-600"
                                            >Menit sebelum Dzuhur</label
                                        >
                                        <input
                                            id="morning-wake"
                                            type="number"
                                            min="0"
                                            max="300"
                                            bind:value={morningWake}
                                            class="w-32 rounded-xl border border-amber-200 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4 flex items-center gap-3">
                                <button
                                    onclick={saveScreensaver}
                                    disabled={screensaverSaving}
                                    class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {#if screensaverSaving}...{:else}Simpan{/if}
                                </button>
                                {#if screensaverSuccess}
                                    <p
                                        class="text-sm font-medium text-emerald-600"
                                    >
                                        ✓ Disimpan
                                    </p>
                                {/if}
                            </div>
                            <p class="mt-3 text-xs text-slate-400">
                                Hemat malam: aktif {screensaverDelay} menit setelah
                                Isya, bangun {screensaverWake} menit sebelum Subuh.
                                Hemat pagi: aktif {morningDelay} menit setelah Syuruq,
                                bangun {morningWake} menit sebelum Dzuhur.
                            </p>
                        </section>
                    {/if}

                    {#if activeSection === "jumbotron"}
                        <!-- JUMBOTRON -->
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
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
                                            <p
                                                class="text-sm font-semibold text-slate-700"
                                            >
                                                {item.title}
                                            </p>
                                            <p
                                                class="mt-1 text-xs text-slate-500"
                                            >
                                                {item.content}
                                            </p>
                                            {#if item.backgroundUrl}
                                                <p
                                                    class="mt-1 text-xs text-slate-400 truncate"
                                                >
                                                    BG: {item.backgroundUrl}
                                                </p>
                                            {/if}
                                            <button
                                                type="button"
                                                class="mt-2 text-xs font-medium text-red-500 hover:text-red-700"
                                                onclick={() =>
                                                    askDeleteJumbotron(
                                                        item.id,
                                                        item.title ??
                                                            "Jumbotron",
                                                    )}>Hapus</button
                                            >
                                        </div>
                                    {/each}
                                    {#if data.jumbotrons.length === 0}
                                        <p
                                            class="text-xs italic text-slate-400"
                                        >
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
                    {/if}

                    {#if activeSection === "youtube"}
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
                                                    {item.title ?? "Video"} &bull;
                                                    {item.youtubeUrl}
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
                    {/if}

                    {#if activeSection === "events"}
                        <!-- EVENTS (HARI BESAR) -->
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
                                        Hari Besar
                                    </h2>
                                    <p class="mt-0.5 text-xs text-slate-500">
                                        Atur acara / hari besar yang muncul di
                                        layar.
                                    </p>
                                </div>
                            </div>
                            <div class="mt-5 grid gap-4 sm:grid-cols-2">
                                <div class="space-y-3">
                                    <form
                                        method="POST"
                                        action="?/addEvent"
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
                                                <label
                                                    class="text-xs font-medium text-slate-500"
                                                    >Tanggal</label
                                                >
                                                <input
                                                    type="date"
                                                    name="event_date"
                                                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    class="text-xs font-medium text-slate-500"
                                                    >Jam (opsional)</label
                                                >
                                                <input
                                                    type="time"
                                                    name="event_time"
                                                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <label
                                            class="flex items-center gap-2 text-sm text-slate-600"
                                        >
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
                                            <p
                                                class="text-sm font-semibold text-slate-700"
                                            >
                                                {item.title}
                                            </p>
                                            {#if item.description}
                                                <p
                                                    class="mt-1 text-xs text-slate-500"
                                                >
                                                    {item.description}
                                                </p>
                                            {/if}
                                            <p
                                                class="mt-1 text-xs text-slate-400"
                                            >
                                                {item.eventDate}
                                                {#if item.eventTime}
                                                    {item.eventTime}
                                                {/if}
                                                {#if item.countdownEnabled}
                                                    &middot; Countdown ON
                                                {/if}
                                            </p>
                                            <button
                                                type="button"
                                                class="mt-2 text-xs font-medium text-red-500 hover:text-red-700"
                                                onclick={() =>
                                                    askDeleteEvent(
                                                        item.id,
                                                        item.title ?? "Acara",
                                                    )}>Hapus</button
                                            >
                                        </div>
                                    {/each}
                                    {#if data.events.length === 0}
                                        <p
                                            class="text-xs italic text-slate-400"
                                        >
                                            Belum ada acara.
                                        </p>
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
                    {/if}

                    {#if activeSection === "slides"}
                        <!-- SECTION SLIDE FOTO -->
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
                                        🖼️ Slide Foto Display TV
                                    </h2>
                                    <p class="mt-0.5 text-xs text-slate-500">
                                        Upload foto untuk slideshow di layar TV
                                        masjid. Format: JPEG, PNG.
                                    </p>
                                </div>
                                <span class="text-xs text-slate-400"
                                    >{data.slides.length} slide</span
                                >
                            </div>

                            <!-- Form Upload -->
                            <div
                                class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                            >
                                <div class="flex flex-wrap items-end gap-3">
                                    <div class="flex-1 min-w-50">
                                        <label
                                            for="slide-title"
                                            class="mb-1 block text-xs font-medium text-slate-600"
                                            >Judul (opsional)</label
                                        >
                                        <input
                                            id="slide-title"
                                            type="text"
                                            bind:value={slideTitle}
                                            placeholder="cth: Pengumuman Ramadan"
                                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                        />
                                    </div>
                                    <div class="flex-1 min-w-50">
                                        <label
                                            for="slide-file"
                                            class="mb-1 block text-xs font-medium text-slate-600"
                                            >File Foto</label
                                        >
                                        <input
                                            id="slide-file"
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onchange={(e) => {
                                                slideFile = (
                                                    e.target as HTMLInputElement
                                                ).files;
                                            }}
                                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-emerald-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-emerald-700 focus:border-emerald-400 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onclick={uploadSlide}
                                        disabled={slideUploading}
                                        class="shrink-0 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        {#if slideUploading}Mengupload...{:else}⬆️
                                            Upload{/if}
                                    </button>
                                </div>
                                {#if slideUploadError}<p
                                        class="mt-2 text-xs text-red-500"
                                    >
                                        {slideUploadError}
                                    </p>{/if}
                                {#if slideUploadSuccess}<p
                                        class="mt-2 text-xs font-medium text-emerald-600"
                                    >
                                        ✅ Foto berhasil diupload!
                                    </p>{/if}
                            </div>

                            <!-- Gallery Grid -->
                            <div class="mt-5">
                                {#if data.slides.length === 0}
                                    <div
                                        class="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center"
                                    >
                                        <svg
                                            class="mx-auto h-10 w-10 text-slate-300"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="1.5"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            /></svg
                                        >
                                        <p class="mt-3 text-sm text-slate-400">
                                            Belum ada slide foto
                                        </p>
                                        <p class="text-xs text-slate-300">
                                            Upload foto pertama Anda di atas
                                        </p>
                                    </div>
                                {:else}
                                    <div
                                        class="grid gap-4 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                                    >
                                        {#each data.slides as slide}
                                            <div
                                                class="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all"
                                            >
                                                <!-- Thumbnail -->
                                                <div
                                                    class="aspect-4/3 bg-slate-100"
                                                >
                                                    {#if getSlideUrl(slide)}
                                                        <img
                                                            src={getSlideUrl(
                                                                slide,
                                                            )!}
                                                            alt={slide.title ??
                                                                "Slide"}
                                                            class="h-full w-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    {:else}
                                                        <div
                                                            class="flex h-full items-center justify-center"
                                                        >
                                                            <svg
                                                                class="h-8 w-8 text-slate-300"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                stroke-width="1.5"
                                                                viewBox="0 0 24 24"
                                                                ><path
                                                                    stroke-linecap="round"
                                                                    stroke-linejoin="round"
                                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                /></svg
                                                            >
                                                        </div>
                                                    {/if}
                                                </div>
                                                <!-- Overlay info -->
                                                <div class="p-2.5">
                                                    <p
                                                        class="truncate text-xs font-medium text-slate-700"
                                                    >
                                                        {slide.title ??
                                                            "Tanpa judul"}
                                                    </p>
                                                    <div
                                                        class="mt-1 flex items-center justify-between gap-2"
                                                    >
                                                        <span
                                                            class="text-[10px] text-slate-400"
                                                            >#{slide.orderIndex}</span
                                                        >
                                                        <span
                                                            class="rounded-full px-1.5 py-0.5 text-[10px] font-medium {slide.isActive
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-slate-100 text-slate-500'}"
                                                            >{slide.isActive
                                                                ? "Aktif"
                                                                : "Nonaktif"}</span
                                                        >
                                                    </div>
                                                </div>
                                                <!-- Hover delete -->
                                                <form
                                                    method="POST"
                                                    action="?/deleteSlide"
                                                    class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="slide_id"
                                                        value={slide.id}
                                                    />
                                                    <button
                                                        type="submit"
                                                        onclick={(e) => {
                                                            if (
                                                                !confirm(
                                                                    "Hapus slide ini?",
                                                                )
                                                            )
                                                                e.preventDefault();
                                                        }}
                                                        class="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white shadow hover:bg-red-600"
                                                        title="Hapus slide"
                                                    >
                                                        <svg
                                                            class="h-3.5 w-3.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            stroke-width="2"
                                                            viewBox="0 0 24 24"
                                                            ><path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            /></svg
                                                        >
                                                    </button>
                                                </form>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            <Pagination
                                currentPage={data.slidePage}
                                totalPages={data.slideTotalPages}
                                totalItems={data.slideTotal}
                                paramName="pageSL"
                            />
                        </section>
                    {/if}

                    {#if activeSection === "schedule"}
                        <!-- Daftar Jadwal Tersimpan -->
                        <section class="rounded-2xl bg-white p-5 shadow-sm">
                            <h2 class="text-lg font-semibold text-emerald-900">
                                Jadwal Tersimpan
                            </h2>
                            <div class="mt-4 overflow-x-auto">
                                <table class="w-full text-xs">
                                    <thead>
                                        <tr
                                            class="border-b border-emerald-100 text-left text-slate-500"
                                        >
                                            <th class="pb-1 pr-2 font-medium"
                                                >Tanggal</th
                                            >
                                            <th class="pb-1 pr-2 font-medium"
                                                >Imsak</th
                                            >
                                            <th class="pb-1 pr-2 font-medium"
                                                >Subuh</th
                                            >
                                            <th class="pb-1 pr-2 font-medium"
                                                >Dzuhur</th
                                            >
                                            <th class="pb-1 pr-2 font-medium"
                                                >Ashar</th
                                            >
                                            <th class="pb-1 pr-2 font-medium"
                                                >Maghrib</th
                                            >
                                            <th class="pb-1 font-medium"
                                                >Isya</th
                                            >
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
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </td>
                                                <td
                                                    class="py-1 pr-2 text-slate-600"
                                                    >{s.imsakTime}</td
                                                >
                                                <td
                                                    class="py-1 pr-2 text-slate-600"
                                                    >{s.subuhTime}</td
                                                >
                                                <td
                                                    class="py-1 pr-2 text-slate-600"
                                                    >{s.dzuhurTime}</td
                                                >
                                                <td
                                                    class="py-1 pr-2 text-slate-600"
                                                    >{s.asharTime}</td
                                                >
                                                <td
                                                    class="py-1 pr-2 text-slate-600"
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
                        </section>

                        <!-- Prayer Correction Section -->
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <PrayerCorrection
                                corrections={data.prayerCorrections || []}
                            />
                        </section>

                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <!-- Header -->
                            <div
                                class="flex flex-wrap items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
                                        Jadwal Sholat
                                    </h2>
                                    <p class="mt-0.5 text-xs text-slate-500">
                                        Import otomatis dari API atau input
                                        manual per hari
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
                                                        onclick={() =>
                                                            selectKota(kota)}
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
                                        <span
                                            class="text-xs font-medium text-emerald-800"
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
                                                        value={String(
                                                            i + 1,
                                                        ).padStart(2, "0")}
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
                                                    <option value={y}
                                                        >{y}</option
                                                    >
                                                {/each}
                                            </select>
                                        </div>
                                        <div class="flex items-end">
                                            <button
                                                type="button"
                                                onclick={fetchBulk}
                                                disabled={bulkLoading ||
                                                    !selectedKota}
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
                                                <div
                                                    class="flex items-center gap-2"
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
                                                        Simpan {bulkPreview.length}
                                                        Jadwal
                                                    {/if}
                                                </button>
                                            </div>
                                            <!-- Tabel scroll -->
                                            <div
                                                class="max-h-80 overflow-y-auto"
                                            >
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
                                                                class="{i %
                                                                    2 ===
                                                                0
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
                                                for="scheduleDateManual"
                                                >Tanggal</label
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
                                        use:enhance={() => {
                                            return async ({ update }) => {
                                                await update({ reset: true });
                                                await invalidate(() => true);
                                            };
                                        }}
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
                                                    for="sunriseTime"
                                                    >Syuruq</label
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
                                                    for="dzuhurTime"
                                                    >Dzuhur</label
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
                                                    for="maghribTime"
                                                    >Maghrib</label
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
                                        <div
                                            class="mt-4 flex items-center justify-between"
                                        >
                                            <p class="text-xs text-slate-400">
                                                Jadwal akan disimpan untuk
                                                tanggal yang dipilih di atas
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

                    <!-- LANGANAN SECTION -->
                    {#if activeSection === "langganan"}
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
                                        Langganan
                                    </h2>
                                    <p class="text-xs text-slate-500">
                                        Status dan informasi masa aktif
                                    </p>
                                </div>
                            </div>

                            <div class="mt-5 max-w-2xl space-y-5">
                                {#if !data.masjid}
                                    <div
                                        class="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100"
                                    >
                                        <div
                                            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
                                        >
                                            <svg
                                                class="h-8 w-8 text-emerald-600"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                                /></svg
                                            >
                                        </div>
                                        <h3
                                            class="text-lg font-semibold text-slate-800"
                                        >
                                            Belum Punya Masjid
                                        </h3>
                                        <p class="mt-1 text-sm text-slate-500">
                                            Buat profil masjid terlebih dahulu
                                            untuk memulai.
                                        </p>
                                        <button
                                            onclick={() =>
                                                navigateTo("dashboard")}
                                            class="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700"
                                            >Buat Masjid</button
                                        >
                                    </div>
                                {:else if !data.subscription}
                                    <div
                                        class="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100"
                                    >
                                        <div
                                            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100"
                                        >
                                            <svg
                                                class="h-8 w-8 text-amber-600"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                                /></svg
                                            >
                                        </div>
                                        <h3
                                            class="text-lg font-semibold text-slate-800"
                                        >
                                            Belum Ada Langganan
                                        </h3>
                                        <p class="mt-1 text-sm text-slate-500">
                                            Masjid Anda belum memiliki langganan
                                            aktif. Hubungi superadmin untuk
                                            mengaktifkan.
                                        </p>
                                    </div>
                                {:else}
                                    {@const sub = data.subscription as {
                                        status: string;
                                        endDate: string | Date;
                                        startDate: string | Date;
                                        packageName: string;
                                    }}
                                    {@const expired = isExpired(sub)}
                                    {@const remaining = daysRemaining(
                                        sub.endDate,
                                    )}

                                    <!-- Status Card -->
                                    <div
                                        class="rounded-2xl border p-6 shadow-sm {STATUS_COLORS[
                                            sub.status
                                        ] ?? STATUS_COLORS['trial']}"
                                    >
                                        <div
                                            class="flex items-start justify-between gap-4"
                                        >
                                            <div class="flex-1">
                                                <p
                                                    class="text-xs font-medium uppercase tracking-wider opacity-70"
                                                >
                                                    {STATUS_LABELS[
                                                        sub.status
                                                    ] ?? sub.status}
                                                </p>
                                                <p
                                                    class="mt-1 text-2xl font-bold"
                                                >
                                                    {#if expired}
                                                        Masa Aktif Habis
                                                    {:else}
                                                        Aktif — {remaining} Hari Tersisa
                                                    {/if}
                                                </p>
                                                <div
                                                    class="mt-3 space-y-1 text-sm opacity-80"
                                                >
                                                    <p>
                                                        Paket: {sub.packageName}
                                                    </p>
                                                    <p>
                                                        Mulai: {formatDate(
                                                            sub.startDate,
                                                        )}
                                                    </p>
                                                    <p>
                                                        Berakhir: {formatDate(
                                                            sub.endDate,
                                                        )}{#if !expired}
                                                            <span
                                                                class="ml-1 font-semibold"
                                                                >({remaining} hari)</span
                                                            >{/if}
                                                    </p>
                                                </div>
                                            </div>
                                            <div
                                                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/30"
                                            >
                                                {#if expired}
                                                    <svg
                                                        class="h-7 w-7"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="1.5"
                                                        viewBox="0 0 24 24"
                                                        ><path
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                                        /></svg
                                                    >
                                                {:else}
                                                    <svg
                                                        class="h-7 w-7"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="1.5"
                                                        viewBox="0 0 24 24"
                                                        ><path
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        /></svg
                                                    >
                                                {/if}
                                            </div>
                                        </div>
                                    </div>

                                    {#if expired}
                                        <!-- Expired Warning -->
                                        <div
                                            class="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm"
                                        >
                                            <h3
                                                class="text-base font-semibold text-red-800"
                                            >
                                                Akses Fitur Terbatas
                                            </h3>
                                            <p
                                                class="mt-2 text-sm text-red-700"
                                            >
                                                Layar display masjid Anda akan
                                                menampilkan watermark
                                                <strong
                                                    >"LIMAWAKU.MY.ID — Aktifkan
                                                    langganan di menu Admin"</strong
                                                >
                                                hingga langganan diaktifkan kembali.
                                            </p>
                                            <div
                                                class="mt-4 rounded-lg border border-red-200 bg-white/60 p-4 text-center font-mono text-xs tracking-wider text-red-600"
                                            >
                                                LIMAWAKU.MY.ID — Aktifkan
                                                langganan di menu Admin
                                            </div>
                                        </div>

                                        <!-- How to Activate -->
                                        <div
                                            class="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
                                        >
                                            <h3
                                                class="text-base font-semibold text-slate-800"
                                            >
                                                Cara Mengaktifkan
                                            </h3>
                                            <p
                                                class="mt-2 text-sm text-slate-600"
                                            >
                                                Hubungi Contact Person untuk
                                                memperpanjang langganan. Setelah
                                                pembayaran dikonfirmasi, status
                                                akan diperbarui.
                                            </p>
                                            <a
                                                href="https://wa.me/6285250887277"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
                                            >
                                                <svg
                                                    class="h-5 w-5"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                    ><path
                                                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                                                    /></svg
                                                >
                                                Hubungi via WhatsApp
                                            </a>
                                            <p
                                                class="mt-4 text-xs text-slate-400"
                                            >
                                                Setelah diperpanjang, refresh
                                                halaman ini untuk mengembalikan
                                                akses penuh.
                                            </p>
                                        </div>
                                    {:else}
                                        <!-- Active Info -->
                                        <div
                                            class="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
                                        >
                                            <h3
                                                class="text-base font-semibold text-slate-800"
                                            >
                                                Informasi Langganan
                                            </h3>
                                            <p
                                                class="mt-2 text-sm text-slate-600"
                                            >
                                                Semua fitur dapat digunakan
                                                selama masa langganan aktif.
                                                {#if sub.status === "trial"}
                                                    Setelah masa trial berakhir,
                                                    layar display masjid akan
                                                    menampilkan watermark hingga
                                                    langganan diaktifkan.
                                                {/if}
                                            </p>
                                            <a
                                                href="https://wa.me/6285250887277"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
                                            >
                                                <svg
                                                    class="h-5 w-5"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                    ><path
                                                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                                                    /></svg
                                                >
                                                Hubungi via WhatsApp
                                            </a>
                                        </div>

                                        <!-- Watermark Preview -->
                                        <div
                                            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                        >
                                            <h3
                                                class="text-base font-semibold text-slate-800"
                                            >
                                                Pratinjau Watermark
                                            </h3>
                                            <p
                                                class="mt-1 text-xs text-slate-500"
                                            >
                                                Jika langganan tidak
                                                diperpanjang, layar display akan
                                                menampilkan:
                                            </p>
                                            <div
                                                class="mt-3 rounded-lg border border-dashed border-red-300 bg-red-50/50 p-4 text-center font-mono text-xs tracking-wider text-red-500"
                                            >
                                                LIMAWAKTU.MY.ID — Aktifkan
                                                langganan di menu Admin
                                            </div>
                                        </div>
                                    {/if}
                                {/if}
                            </div>
                        </section>
                    {/if}

                    <!-- TEMA & TEMPLATE SECTION -->
                    {#if activeSection === "tema"}
                        <section class="rounded-2xl bg-white p-6 shadow-sm">
                            <div
                                class="flex items-center justify-between gap-3"
                            >
                                <div>
                                    <h2
                                        class="text-lg font-semibold text-emerald-900"
                                    >
                                        Tema & Template
                                    </h2>
                                    <p class="mt-0.5 text-xs text-slate-500">
                                        Pilih template tampilan untuk setiap
                                        device display
                                    </p>
                                </div>
                            </div>
                            <div class="mt-5 space-y-4">
                                {#each data.devices as device}
                                    <div
                                        class="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <div
                                            class="flex items-center justify-between gap-3 mb-3"
                                        >
                                            <div>
                                                <p
                                                    class="font-semibold text-slate-700"
                                                >
                                                    {device.name}
                                                </p>
                                                <p
                                                    class="text-xs text-slate-400"
                                                >
                                                    Kode: {device.deviceCode} &middot;
                                                    Orientasi: {device.orientation}
                                                </p>
                                            </div>
                                            <a
                                                href="/display/{device.deviceCode}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="text-xs font-medium text-emerald-600 hover:underline"
                                                >Preview →</a
                                            >
                                        </div>
                                        <form
                                            method="POST"
                                            action="?/updateDeviceTheme"
                                            class="flex flex-wrap items-end gap-3"
                                        >
                                            <input
                                                type="hidden"
                                                name="device_id"
                                                value={device.id}
                                            />
                                            <div class="flex-1 min-w-40">
                                                <label
                                                    class="mb-1 block text-xs font-medium text-slate-600"
                                                    >Pilih Tema</label
                                                >
                                                <select
                                                    name="theme_id"
                                                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                                >
                                                    <option value=""
                                                        >-- Default (Modern
                                                        Minimalis) --</option
                                                    >
                                                    {#each data.themes as theme}
                                                        <option
                                                            value={theme.id}
                                                            selected={device.themeId ===
                                                                theme.id}
                                                            >{theme.name}</option
                                                        >
                                                    {/each}
                                                </select>
                                            </div>
                                            <button
                                                type="submit"
                                                class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
                                            >
                                                Simpan
                                            </button>
                                        </form>
                                    </div>
                                {/each}
                                {#if data.devices.length === 0}
                                    <p
                                        class="text-center text-sm text-slate-400 py-8"
                                    >
                                        Belum ada device terdaftar. Tambah
                                        device terlebih dahulu.
                                    </p>
                                {/if}
                            </div>
                        </section>
                    {/if}
                {/if}

                {#snippet mobileNavSnippet()}
                    <nav
                        class="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md xl:hidden pb-safe"
                    >
                        <div
                            class="flex items-center justify-around px-2 py-1.5"
                        >
                            <button
                                onclick={() => navigateTo("dashboard")}
                                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-0 {activeSection ===
                                'dashboard'
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'}"
                            >
                                <svg
                                    class="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3"
                                    /></svg
                                >
                                <span
                                    class="text-[10px] font-medium leading-none"
                                    >Home</span
                                >
                            </button>
                            <button
                                onclick={() => navigateTo("schedule")}
                                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-0 {activeSection ===
                                'schedule'
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'}"
                            >
                                <svg
                                    class="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2m-6 4h.01M9 13h.01M13 9h.01M13 13h.01"
                                    /></svg
                                >
                                <span
                                    class="text-[10px] font-medium leading-none"
                                    >Jadwal</span
                                >
                            </button>
                            <button
                                onclick={() => navigateTo("runningtext")}
                                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-0 {activeSection ===
                                'runningtext'
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'}"
                            >
                                <svg
                                    class="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M4 6h16M4 12h16M4 18h7"
                                    /></svg
                                >
                                <span
                                    class="text-[10px] font-medium leading-none"
                                    >Text</span
                                >
                            </button>
                            <button
                                onclick={() => navigateTo("devices")}
                                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-0 {activeSection ===
                                'devices'
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'}"
                            >
                                <svg
                                    class="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5"
                                    /></svg
                                >
                                <span
                                    class="text-[10px] font-medium leading-none"
                                    >Device</span
                                >
                            </button>
                            <button
                                onclick={() => navigateTo("events")}
                                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-0 {activeSection ===
                                'events'
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'}"
                            >
                                <svg
                                    class="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    /></svg
                                >
                                <span
                                    class="text-[10px] font-medium leading-none"
                                    >Events</span
                                >
                            </button>
                            <button
                                onclick={() => navigateTo("profile")}
                                class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-0 {activeSection ===
                                'profile'
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'}"
                            >
                                <svg
                                    class="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.8"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5"
                                    /></svg
                                >
                                <span
                                    class="text-[10px] font-medium leading-none"
                                    >Profil</span
                                >
                            </button>
                        </div>
                    </nav>
                {/snippet}

                {@render mobileNavSnippet()}
            </div>
        </div>
    </div>

    <ConfirmDialog
        open={confirmOpen}
        title="Hapus Jumbotron"
        message={`Yakin ingin menghapus jumbotron "${pendingDeleteTitle}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onconfirm={confirmDeleteJumbotron}
        oncancel={cancelDelete}
    />

    <ConfirmDialog
        open={confirmEventOpen}
        title="Hapus Acara"
        message={`Yakin ingin menghapus acara "${pendingDeleteEventTitle}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onconfirm={confirmDeleteEvent}
        oncancel={cancelDeleteEvent}
    />

    <ConfirmDialog
        open={confirmDeleteMasjidOpen}
        title="Hapus Semua Data Masjid"
        message={`⚠️ YAKIN INGIN MENGHAPUS SEMUA DATA MASJID?\n\n${data.deviceTotal > 0 ? `📺 ${data.deviceTotal} Perangkat\n` : ""}${data.prayerTotal > 0 ? `🕌 ${data.prayerTotal} Jadwal Sholat\n` : ""}${data.slideTotal > 0 ? `🖼️ ${data.slideTotal} Slide Foto\n` : ""}${data.jumbotronTotal > 0 ? `📢 ${data.jumbotronTotal} Jumbotron\n` : ""}${data.runningTextTotal > 0 ? `📝 ${data.runningTextTotal} Running Text\n` : ""}${data.youtubeTotal > 0 ? `🎬 ${data.youtubeTotal} YouTube\n` : ""}\n⚠️ Tindakan ini tidak bisa dibatalkan!`}
        confirmLabel="Ya, Hapus Semua"
        cancelLabel="Batal"
        onconfirm={handleDeleteMasjid}
        oncancel={() => (confirmDeleteMasjidOpen = false)}
    />
</div>

{#if toastVisible}
    <div class="toast">
        <span class="toast-icon">✓</span>
        <span class="toast-msg">{toastMessage}</span>
    </div>
{/if}

<style>
    .toast {
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #065f46, #047857);
        color: #fff;
        padding: 14px 28px;
        border-radius: 14px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 32px rgba(5, 150, 105, 0.35);
        animation: toastPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
        border: 1px solid rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(4px);
    }

    .toast-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        font-size: 13px;
        flex-shrink: 0;
    }

    .toast-msg {
        white-space: nowrap;
    }

    @keyframes toastPop {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.85);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
        }
    }
</style>
