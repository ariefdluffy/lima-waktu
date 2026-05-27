<script lang="ts">
    import { enhance, deserialize } from "$app/forms";
    import { goto, invalidate } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { showToast as showToastGlobal } from "$lib/stores/toast";
    import AdminSidebar from "$lib/components/admin/AdminSidebar.svelte";
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import SectionDashboard from "$lib/components/admin/SectionDashboard.svelte";
    import SectionProfile from "$lib/components/admin/SectionProfile.svelte";
    import SectionRunningText from "$lib/components/admin/SectionRunningText.svelte";
    import SectionDevices from "$lib/components/admin/SectionDevices.svelte";
    import SectionIqamah from "$lib/components/admin/SectionIqamah.svelte";
    import SectionOther from "$lib/components/admin/SectionOther.svelte";
    import SectionJumbotron from "$lib/components/admin/SectionJumbotron.svelte";
    import SectionYoutube from "$lib/components/admin/SectionYoutube.svelte";
    import SectionEvents from "$lib/components/admin/SectionEvents.svelte";
    import SectionSlides from "$lib/components/admin/SectionSlides.svelte";
    import SectionSchedule from "$lib/components/admin/SectionSchedule.svelte";
    import SectionLangganan from "$lib/components/admin/SectionLangganan.svelte";
    import SectionTema from "$lib/components/admin/SectionTema.svelte";

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
    // Confirm dialog (hapus youtube)
    // ----------------------------------------------------------------
    let confirmDeleteYoutubeOpen = $state(false);
    let pendingDeleteYoutubeId = $state<number | null>(null);
    let pendingDeleteYoutubeTitle = $state("");

    function askDeleteYoutube(id: number, title: string | null) {
        pendingDeleteYoutubeId = id;
        pendingDeleteYoutubeTitle = title ?? "Video";
        confirmDeleteYoutubeOpen = true;
    }

    function cancelDeleteYoutube() {
        confirmDeleteYoutubeOpen = false;
        pendingDeleteYoutubeId = null;
        pendingDeleteYoutubeTitle = "";
    }

    async function confirmDeleteYoutube() {
        if (pendingDeleteYoutubeId === null) return;
        confirmDeleteYoutubeOpen = false;
        const formData = new FormData();
        formData.set("id", String(pendingDeleteYoutubeId));
        const res = await fetch("?/deleteYoutube", {
            method: "POST",
            body: formData,
        });
        const result = deserialize(await res.text());
        if (result.type === "success" || result.type === "redirect") {
            await invalidate("app:admin");
        }
        pendingDeleteYoutubeId = null;
        pendingDeleteYoutubeTitle = "";
    }

    // ----------------------------------------------------------------
    // Confirm dialog (hapus device)
    // ----------------------------------------------------------------
    let confirmDeleteDeviceOpen = $state(false);
    let pendingDeleteDeviceId = $state<string | null>(null);
    let pendingDeleteDeviceName = $state("");

    function askDeleteDevice(id: string, name: string) {
        pendingDeleteDeviceId = id;
        pendingDeleteDeviceName = name;
        confirmDeleteDeviceOpen = true;
    }

    function cancelDeleteDevice() {
        confirmDeleteDeviceOpen = false;
        pendingDeleteDeviceId = null;
        pendingDeleteDeviceName = "";
    }

    async function confirmDeleteDevice() {
        if (!pendingDeleteDeviceId) return;
        confirmDeleteDeviceOpen = false;
        const formData = new FormData();
        formData.set("device_id", pendingDeleteDeviceId);
        const res = await fetch("?/deleteDevice", {
            method: "POST",
            body: formData,
        });
        const result = deserialize(await res.text());
        if (result.type === "success" || result.type === "redirect") {
            showToast("🗑️ Device berhasil dihapus!");
            await invalidate("app:admin");
        }
        pendingDeleteDeviceId = null;
        pendingDeleteDeviceName = "";
    }

    // ----------------------------------------------------------------
    // Hapus semua data masjid
    // ----------------------------------------------------------------
    let confirmDeleteMasjidOpen = $state(false);

    // Hapus jadwal sholat
    // ----------------------------------------------------------------
    let confirmDeleteScheduleOpen = $state(false);
    let pendingDeleteScheduleId = $state<number | null>(null);
    let pendingDeleteScheduleDate = $state("");
    let confirmResetSchedulesOpen = $state(false);
    let scheduleActionLoading = $state(false);
    let scheduleActionSuccess = $state("");
    let scheduleActionError = $state("");

    function askDeleteSchedule(id: number, date: string) {
        pendingDeleteScheduleId = id;
        pendingDeleteScheduleDate = date;
        confirmDeleteScheduleOpen = true;
    }

    async function confirmDeleteSchedule() {
        if (!pendingDeleteScheduleId || !data.masjid) return;
        confirmDeleteScheduleOpen = false;
        scheduleActionLoading = true;
        scheduleActionSuccess = "";
        scheduleActionError = "";
        try {
            const formData = new FormData();
            formData.set("schedule_id", String(pendingDeleteScheduleId));
            formData.set("masjid_id", data.masjid.id);
            const res = await fetch("?/deletePrayerSchedule", {
                method: "POST",
                body: formData,
            });
            const result = deserialize(await res.text());
            if (result.type === "success" || result.type === "redirect") {
                scheduleActionSuccess = "Jadwal berhasil dihapus.";
                setTimeout(() => (scheduleActionSuccess = ""), 3000);
                await invalidate(() => true);
            } else {
                scheduleActionError = "Gagal menghapus jadwal.";
            }
        } catch {
            scheduleActionError = "Gagal terhubung ke server.";
        } finally {
            scheduleActionLoading = false;
            pendingDeleteScheduleId = null;
            pendingDeleteScheduleDate = "";
        }
    }

    async function confirmResetSchedules() {
        if (!data.masjid) return;
        confirmResetSchedulesOpen = false;
        scheduleActionLoading = true;
        scheduleActionSuccess = "";
        scheduleActionError = "";
        try {
            const formData = new FormData();
            formData.set("masjid_id", data.masjid.id);
            const res = await fetch("?/resetPrayerSchedules", {
                method: "POST",
                body: formData,
            });
            const result = deserialize(await res.text());
            if (result.type === "success" || result.type === "redirect") {
                scheduleActionSuccess = "Semua jadwal berhasil direset.";
                setTimeout(() => (scheduleActionSuccess = ""), 3000);
                await invalidate(() => true);
            } else {
                scheduleActionError = "Gagal mereset jadwal.";
            }
        } catch {
            scheduleActionError = "Gagal terhubung ke server.";
        } finally {
            scheduleActionLoading = false;
        }
    }

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
        goto(`/admin?section=${section}`);
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

    onMount(() => {
        const toastParam = $page.url.searchParams.get("toast");
        if (toastParam === "login_success") {
            showToastGlobal(
                "Berhasil masuk! Selamat datang kembali.",
                "success",
            );
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
            const errMsg = e instanceof Error ? e.message : "";
            if (
                errMsg.includes("exceeds limit") ||
                errMsg.includes("Content-length")
            ) {
                slideUploadError = "File terlalu besar. Maksimal 1MB.";
            } else {
                slideUploadError = "Terjadi kesalahan saat upload.";
            }
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
                // Auto-resolve lat/lon dari city setiap kali city berubah
                const city = profileCity.trim();
                const cityChanged = city && city !== data.masjid?.city;
                const noCoords =
                    !data.masjid?.latitude || !data.masjid?.longitude;
                if (city && (cityChanged || noCoords)) {
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
        if (logoFile.size > 512 * 1024) {
            logoError = "Ukuran file maksimal 512KB. Pilih file lebih kecil.";
            showToastGlobal(
                "⚠️ Ukuran file maksimal 512KB. Pilih file lebih kecil.",
            );
            return;
        }
        if (!["image/jpeg", "image/png"].includes(logoFile.type)) {
            logoError = "Tipe file tidak diizinkan. Hanya JPEG dan PNG.";
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
                showToastGlobal("⚠️ " + (mediaJson.message || "Upload gagal"));
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
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : "";
            if (
                errMsg.includes("exceeds limit") ||
                errMsg.includes("Content-length")
            ) {
                logoError = "File terlalu besar. Maksimal 1MB.";
                showToastGlobal(
                    "⚠️ Ukuran file maksimal 1MB. Pilih file lebih kecil.",
                );
            } else {
                logoError = "Gagal menghubungi server";
                showToastGlobal("⚠️ Gagal menghubungi server. Coba lagi.");
            }
        } finally {
            logoSaving = false;
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
                    {#if activeSection === "dashboard"}
                        <SectionDashboard {data} {navigateTo} />
                    {/if}

                    {#if activeSection === "profile"}
                        <SectionProfile
                            {data}
                            bind:profileName
                            bind:profileAddress
                            bind:profileCity
                            bind:profileDistrict
                            bind:profileProvince
                            bind:profileTimezone
                            {profileSaving}
                            {profileSuccess}
                            {profileError}
                            {saveProfile}
                            bind:logoFile
                            {logoPreview}
                            {logoSaving}
                            {logoSuccess}
                            {logoError}
                            {uploadLogo}
                            {openDeleteMasjidDialog}
                        />
                    {/if}

                    {#if activeSection === "runningtext"}
                        <SectionRunningText {data} />
                    {/if}

                    {#if activeSection === "devices"}
                        <SectionDevices
                            {data}
                            {generatedDeviceCode}
                            {showToast}
                            {askDeleteDevice}
                        />
                    {/if}

                    {#if activeSection === "iqamah"}
                        <SectionIqamah
                            bind:iqamahForm
                            bind:adzanDuration
                            bind:khusukDuration
                            {adzanDurationSaving}
                            {adzanDurationSuccess}
                            {saveAdzanDuration}
                            {iqamahSaving}
                            {iqamahSaveSuccess}
                            {iqamahSaveError}
                            {saveIqamah}
                            {PRAYER_LABELS}
                        />
                    {/if}

                    {#if activeSection === "other"}
                        <SectionOther
                            bind:hijriOffset
                            {hijriOffsetSaving}
                            {hijriOffsetSuccess}
                            {hijriOffsetError}
                            {saveHijriOffset}
                            bind:weatherLat
                            bind:weatherLon
                            {weatherLocSaving}
                            {weatherLocSuccess}
                            {weatherLocError}
                            {weatherGeoLoading}
                            {weatherGeoSuccess}
                            {weatherGeoError}
                            {saveWeatherLocation}
                            {autoResolveFromCity}
                            bind:screensaverDelay
                            bind:screensaverWake
                            bind:morningDelay
                            bind:morningWake
                            {screensaverSaving}
                            {screensaverSuccess}
                            {saveScreensaver}
                        />
                    {/if}

                    {#if activeSection === "jumbotron"}
                        <SectionJumbotron {data} {askDeleteJumbotron} />
                    {/if}

                    {#if activeSection === "youtube"}
                        <SectionYoutube {data} {askDeleteYoutube} {showToast} />
                    {/if}

                    {#if activeSection === "events"}
                        <SectionEvents {data} {askDeleteEvent} />
                    {/if}

                    {#if activeSection === "slides"}
                        <SectionSlides
                            {data}
                            bind:slideTitle
                            bind:slideFile
                            {slideUploading}
                            {slideUploadError}
                            {slideUploadSuccess}
                            {uploadSlide}
                            {getSlideUrl}
                        />
                    {/if}

                    {#if activeSection === "schedule"}
                        <SectionSchedule
                            {data}
                            {askDeleteSchedule}
                            bind:confirmResetSchedulesOpen
                            {scheduleActionLoading}
                            {scheduleActionSuccess}
                            {scheduleActionError}
                        />
                    {/if}

                    {#if activeSection === "langganan"}
                        <SectionLangganan
                            {data}
                            {navigateTo}
                            {STATUS_LABELS}
                            {STATUS_COLORS}
                            {isExpired}
                            {daysRemaining}
                            {formatDate}
                        />
                    {/if}

                    {#if activeSection === "tema"}
                        <SectionTema {data} />
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
        open={confirmDeleteYoutubeOpen}
        title="Hapus YouTube"
        message={`Yakin ingin menghapus YouTube item "${pendingDeleteYoutubeTitle}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onconfirm={confirmDeleteYoutube}
        oncancel={cancelDeleteYoutube}
    />

    <ConfirmDialog
        open={confirmDeleteDeviceOpen}
        title="Hapus Device"
        message={`Yakin ingin menghapus device "${pendingDeleteDeviceName}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onconfirm={confirmDeleteDevice}
        oncancel={cancelDeleteDevice}
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

    <ConfirmDialog
        open={confirmDeleteScheduleOpen}
        title="Hapus Jadwal"
        message={`Yakin ingin menghapus jadwal tanggal ${pendingDeleteScheduleDate ? new Date(pendingDeleteScheduleDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : ""}? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onconfirm={confirmDeleteSchedule}
        oncancel={() => {
            confirmDeleteScheduleOpen = false;
            pendingDeleteScheduleId = null;
            pendingDeleteScheduleDate = "";
        }}
    />

    <ConfirmDialog
        open={confirmResetSchedulesOpen}
        title="Reset Semua Jadwal"
        message={`Yakin ingin menghapus semua ${data.prayerTotal} jadwal tersimpan untuk masjid ini? Jadwal akan diisi ulang otomatis oleh sistem saat sync berikutnya. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Reset Semua"
        cancelLabel="Batal"
        onconfirm={confirmResetSchedules}
        oncancel={() => (confirmResetSchedulesOpen = false)}
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
