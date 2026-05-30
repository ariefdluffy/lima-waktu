<script lang="ts">
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import { goto } from "$app/navigation";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();
    let editMode = $state(false);
    let deleteOpen = $state(false);

    const STATUS_COLORS: Record<string, string> = {
        active: "bg-emerald-100 text-emerald-700",
        trial: "bg-blue-100 text-blue-700",
        grace: "bg-yellow-100 text-yellow-700",
        expired: "bg-red-100 text-red-700",
        cancelled: "bg-slate-100 text-slate-500",
    };
    const DEVICE_STATUS: Record<string, string> = {
        online: "bg-emerald-100 text-emerald-700",
        offline: "bg-red-100 text-red-700",
        unknown: "bg-slate-100 text-slate-500",
    };

    function formatDate(d: unknown): string {
        if (!d) return "-";
        return new Date(d as string).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function confirmDelete() {
        deleteOpen = true;
    }

    $effect(() => {
        if (form?.saved) showToast("Data masjid berhasil disimpan");
    });
</script>

<div class="space-y-6">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-slate-400">
        <a href="/superadmin/masjids" class="hover:text-emerald-600"
            >Manajemen Masjid</a
        >
        <span>/</span>
        <span class="text-slate-700">{data.masjid.name}</span>
    </div>

    <!-- Info Umum & Edit -->
    <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-base font-semibold text-slate-800">Info Umum</h2>
            <div class="flex flex-wrap items-center gap-2">
                <form method="POST" action="?/toggleSuspend">
                    <button
                        class="rounded-lg px-3 py-1.5 text-xs font-medium {data
                            .masjid.isActive
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}"
                    >
                        {data.masjid.isActive ? "Suspend" : "Aktifkan"}
                    </button>
                </form>
                <form method="POST" action="?/resetDevices">
                    <button
                        class="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-200"
                    >
                        Reset Semua Device
                    </button>
                </form>
                <button
                    class="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-200"
                    onclick={confirmDelete}
                >
                    Hapus Masjid
                </button>
                <button
                    class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-emerald-100 hover:text-emerald-700"
                    onclick={() => (editMode = !editMode)}
                >
                    {editMode ? "Batal" : "Edit"}
                </button>
            </div>
        </div>

        {#if editMode}
            <form
                method="POST"
                action="?/updateMasjid"
                class="mt-4 grid gap-3 sm:grid-cols-2"
            >
                <div class="sm:col-span-2">
                    <label for="edit-name" class="block text-xs font-medium text-slate-500"
                        >Nama Masjid</label
                    >
                    <input
                        id="edit-name"
                        name="name"
                        value={data.masjid.name}
                        required
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-city" class="block text-xs font-medium text-slate-500"
                        >Kota</label
                    >
                    <input
                        id="edit-city"
                        name="city"
                        value={data.masjid.city ?? ""}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-province" class="block text-xs font-medium text-slate-500"
                        >Provinsi</label
                    >
                    <input
                        id="edit-province"
                        name="province"
                        value={data.masjid.province ?? ""}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-district" class="block text-xs font-medium text-slate-500"
                        >Kecamatan</label
                    >
                    <input
                        id="edit-district"
                        name="district"
                        value={data.masjid.district ?? ""}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-latitude" class="block text-xs font-medium text-slate-500"
                        >Latitude</label
                    >
                    <input
                        id="edit-latitude"
                        name="latitude"
                        type="number"
                        step="any"
                        value={data.masjid.latitude ?? ""}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-longitude" class="block text-xs font-medium text-slate-500"
                        >Longitude</label
                    >
                    <input
                        id="edit-longitude"
                        name="longitude"
                        type="number"
                        step="any"
                        value={data.masjid.longitude ?? ""}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-hijriOffset" class="block text-xs font-medium text-slate-500"
                        >Hijri Offset</label
                    >
                    <input
                        id="edit-hijriOffset"
                        name="hijriOffset"
                        type="number"
                        value={data.masjid.hijriOffset ?? 0}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-adzanScreenDuration" class="block text-xs font-medium text-slate-500"
                        >Durasi Layar Adzan (detik)</label
                    >
                    <input
                        id="edit-adzanScreenDuration"
                        name="adzanScreenDuration"
                        type="number"
                        value={data.masjid.adzanScreenDuration ?? 4}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-khusukScreenDuration" class="block text-xs font-medium text-slate-500"
                        >Durasi Layar Khusuk (detik)</label
                    >
                    <input
                        id="edit-khusukScreenDuration"
                        name="khusukScreenDuration"
                        type="number"
                        value={data.masjid.khusukScreenDuration ?? 10}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-screensaverDelayMinutes" class="block text-xs font-medium text-slate-500"
                        >Screensaver Delay (menit)</label
                    >
                    <input
                        id="edit-screensaverDelayMinutes"
                        name="screensaverDelayMinutes"
                        type="number"
                        value={data.masjid.screensaverDelayMinutes ?? 120}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-screensaverWakeMinutes" class="block text-xs font-medium text-slate-500"
                        >Screensaver Wake (menit)</label
                    >
                    <input
                        id="edit-screensaverWakeMinutes"
                        name="screensaverWakeMinutes"
                        type="number"
                        value={data.masjid.screensaverWakeMinutes ?? 60}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-screensaverMorningDelayMinutes" class="block text-xs font-medium text-slate-500"
                        >Screensaver Pagi Delay (menit stlh Syuruq)</label
                    >
                    <input
                        id="edit-screensaverMorningDelayMinutes"
                        name="screensaverMorningDelayMinutes"
                        type="number"
                        value={data.masjid.screensaverMorningDelayMinutes ?? 60}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-screensaverMorningWakeMinutes" class="block text-xs font-medium text-slate-500"
                        >Screensaver Pagi Wake (menit sblm Dzuhur)</label
                    >
                    <input
                        id="edit-screensaverMorningWakeMinutes"
                        name="screensaverMorningWakeMinutes"
                        type="number"
                        value={data.masjid.screensaverMorningWakeMinutes ?? 120}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="edit-timezone" class="block text-xs font-medium text-slate-500"
                        >Timezone</label
                    >
                    <select
                        id="edit-timezone"
                        name="timezone"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option
                            value="Asia/Jakarta"
                            selected={data.masjid.timezone === "Asia/Jakarta"}
                            >WIB</option
                        >
                        <option
                            value="Asia/Makassar"
                            selected={data.masjid.timezone === "Asia/Makassar"}
                            >WITA</option
                        >
                        <option
                            value="Asia/Jayapura"
                            selected={data.masjid.timezone === "Asia/Jayapura"}
                            >WIT</option
                        >
                    </select>
                </div>
                <div class="sm:col-span-2">
                    <label for="edit-address" class="block text-xs font-medium text-slate-500"
                        >Alamat</label
                    >
                    <textarea
                        id="edit-address"
                        name="address"
                        rows="2"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >{data.masjid.address ?? ""}</textarea
                    >
                </div>
                <div class="flex justify-end sm:col-span-2">
                    <button
                        class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        {:else}
            <div class="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                    <p class="text-xs text-slate-400">Status</p>
                    <p class="mt-0.5 font-medium text-slate-700">
                        {data.masjid.isActive ? "🟢 Aktif" : "🔴 Ditangguhkan"}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Kota</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.city ?? "-"}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Provinsi</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.province ?? "-"}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Kecamatan</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.district ?? "-"}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Latitude</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.latitude ?? "-"}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Longitude</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.longitude ?? "-"}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Hijri Offset</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.hijriOffset ?? 0}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Durasi Layar Adzan</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.adzanScreenDuration ?? 4} detik
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Durasi Layar Khusuk</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.khusukScreenDuration ?? 10} detik
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Screensaver Delay</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.screensaverDelayMinutes ?? 120} menit
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Screensaver Wake</p>
                    <p class="mt-0.5 text-slate-600">
                        {data.masjid.screensaverWakeMinutes ?? 60} menit
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Timezone</p>
                    <p class="mt-0.5 text-slate-600">{data.masjid.timezone}</p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">Dibuat</p>
                    <p class="mt-0.5 text-slate-600">
                        {formatDate(data.masjid.createdAt)}
                    </p>
                </div>
            </div>
            {#if data.masjid.address}
                <div class="mt-3">
                    <p class="text-xs text-slate-400">Alamat</p>
                    <p class="mt-0.5 text-sm text-slate-600">
                        {data.masjid.address}
                    </p>
                </div>
            {/if}
        {/if}
    </section>

    <!-- Admin Masjid -->
    <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">Admin Masjid</h2>
        {#if data.admins.length > 0}
            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr
                            class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"
                        >
                            <th class="pb-2 pr-4">Nama</th>
                            <th class="pb-2 pr-4">Email</th>
                            <th class="pb-2 pr-4">Role</th>
                            <th class="pb-2 pr-4">Status</th>
                            <th class="pb-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each data.admins as a}
                            <tr class="text-slate-600">
                                <td class="py-2 pr-4 font-medium text-slate-700"
                                    >{a.fullName}</td
                                >
                                <td class="py-2 pr-4 text-xs">{a.email}</td>
                                <td class="py-2 pr-4 text-xs capitalize"
                                    >{a.roleScope}</td
                                >
                                <td class="py-2 pr-4">
                                    {#if a.isActive}
                                        <span class="text-xs text-emerald-600"
                                            >Aktif</span
                                        >
                                    {:else}
                                        <span class="text-xs text-red-600"
                                            >Nonaktif</span
                                        >
                                    {/if}
                                </td>
                                <td class="py-2">
                                    <form method="POST" action="?/removeAdmin">
                                        <input
                                            type="hidden"
                                            name="user_id"
                                            value={a.userId}
                                        />
                                        <input
                                            type="hidden"
                                            name="masjid_id"
                                            value={data.masjid.id}
                                        />
                                        <button
                                            class="text-xs text-red-500 hover:text-red-700"
                                            >Lepas</button
                                        >
                                    </form>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">Belum ada admin.</p>
        {/if}
    </section>

    <!-- Devices -->
    <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">
            Perangkat ({data.devices.length})
        </h2>
        {#if data.devices.length > 0}
            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr
                            class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"
                        >
                            <th class="pb-2 pr-4">Nama</th>
                            <th class="pb-2 pr-4">Kode</th>
                            <th class="pb-2 pr-4">Status</th>
                            <th class="pb-2 pr-4">Orientasi</th>
                            <th class="pb-2">Terakhir Online</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each data.devices as d}
                            <tr class="text-slate-600">
                                <td class="py-2 pr-4 font-medium text-slate-700"
                                    >{d.name}</td
                                >
                                <td class="py-2 pr-4 text-xs font-mono"
                                    >{d.deviceCode}</td
                                >
                                <td class="py-2 pr-4">
                                    <span
                                        class="rounded-full px-2 py-0.5 text-xs font-semibold {DEVICE_STATUS[
                                            d.status
                                        ] ?? DEVICE_STATUS['unknown']}"
                                    >
                                        {d.status}
                                    </span>
                                </td>
                                <td class="py-2 pr-4 text-xs"
                                    >{d.orientation}</td
                                >
                                <td class="py-2 text-xs"
                                    >{formatDate(d.lastSeenAt)}</td
                                >
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">
                Belum ada perangkat terdaftar.
            </p>
        {/if}
    </section>

    <!-- Subscription -->
    <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">Langganan</h2>
        {#if data.subscriptions.length > 0}
            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr
                            class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"
                        >
                            <th class="pb-2 pr-4">Paket</th>
                            <th class="pb-2 pr-4">Siklus</th>
                            <th class="pb-2 pr-4">Status</th>
                            <th class="pb-2 pr-4">Mulai</th>
                            <th class="pb-2">Berakhir</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each data.subscriptions as sub}
                            <tr class="text-slate-600">
                                <td class="py-2 pr-4 font-medium text-slate-700"
                                    >{sub.packageName}</td
                                >
                                <td class="py-2 pr-4 text-xs capitalize"
                                    >{sub.billingCycle}</td
                                >
                                <td class="py-2 pr-4">
                                    <span
                                        class="rounded-full px-2 py-0.5 text-xs font-semibold {STATUS_COLORS[
                                            sub.status
                                        ] ?? ''}"
                                    >
                                        {sub.status}
                                    </span>
                                </td>
                                <td class="py-2 pr-4 text-xs"
                                    >{formatDate(sub.startDate)}</td
                                >
                                <td class="py-2 text-xs"
                                    >{formatDate(sub.endDate)}</td
                                >
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">Belum ada langganan.</p>
        {/if}
    </section>

    <!-- Audit Log -->
    <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">
            Aktivitas Terakhir
        </h2>
        {#if data.auditLogs.length > 0}
            <div class="mt-3 space-y-2">
                {#each data.auditLogs as log}
                    <div
                        class="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    >
                        <span class="shrink-0 font-mono text-slate-400"
                            >{formatDate(log.createdAt)}</span
                        >
                        <span class="font-semibold text-slate-700"
                            >{log.action}</span
                        >
                        <span class="text-slate-500">— {log.entity}</span>
                        {#if log.entityId}
                            <span class="text-slate-400">({log.entityId})</span>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">
                Belum ada aktivitas tercatat.
            </p>
        {/if}
    </section>
</div>

<ConfirmDialog
    open={deleteOpen}
    title="Hapus Masjid"
    message={data.masjid
        ? `Hapus masjid "${data.masjid.name}"? Tindakan ini tidak bisa dibatalkan.`
        : ""}
    confirmLabel="Ya, Hapus"
    cancelLabel="Batal"
    onconfirm={() => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "?/deleteMasjid";
        document.body.appendChild(form);
        form.submit();
    }}
    oncancel={() => (deleteOpen = false)}
/>
