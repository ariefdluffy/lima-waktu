<script lang="ts">
    let { data } = $props();

    const STATUS_COLORS: Record<string, string> = {
        active: "bg-emerald-100 text-emerald-700",
        trial: "bg-blue-100 text-blue-700",
        grace: "bg-yellow-100 text-yellow-700",
        expired: "bg-red-100 text-red-700",
        cancelled: "bg-slate-100 text-slate-500",
    };

    function formatDate(d: unknown): string {
        if (!d) return "-";
        return new Date(d as string).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function formatRupiah(v: unknown): string {
        return "Rp " + Number(v ?? 0).toLocaleString("id-ID");
    }

    const s = $derived(data.stats);

    type RevenueItem = { month: string; revenue: number };
    type DeviceChart = { online: number; offline: number; unknown: number };

    const revenueChart = $derived(data.revenueChart as RevenueItem[]);
    const deviceChart = $derived(data.deviceChart as DeviceChart);
    const maxRevenue = $derived(
        Math.max(...revenueChart.map((r: RevenueItem) => r.revenue), 1),
    );
    const totalDev = $derived(
        deviceChart.online + deviceChart.offline + deviceChart.unknown,
    );
</script>

<div class="space-y-6">
    <!-- Stats Cards -->
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
            class="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
        >
            <p class="text-xs text-slate-500">Total Masjid</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
                {s.totalMasjid}
            </p>
            <p class="mt-0.5 text-xs text-slate-400">
                {s.activeMasjid} aktif
            </p>
        </div>
        <div
            class="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
        >
            <p class="text-xs text-slate-500">Display</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
                {s.onlineDevices}/{s.totalDevices}
            </p>
            <p class="mt-0.5 text-xs text-slate-400">
                {s.offlineDevices} offline
            </p>
        </div>
        <div
            class="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
        >
            <p class="text-xs text-slate-500">Admin</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
                {s.totalUsers}
            </p>
            <p class="mt-0.5 text-xs text-slate-400">Total user terdaftar</p>
        </div>
        <div
            class="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
        >
            <p class="text-xs text-slate-500">Subscription Aktif</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
                {s.subscriptionActive}
            </p>
            <p class="mt-0.5 text-xs text-slate-400">
                {s.subscriptionTrial} trial • {s.subscriptionGrace} grace • {s.subscriptionExpired}
                expired
            </p>
        </div>
    </section>

    <!-- Revenue + Subscription Stats -->
    <section class="grid gap-4 sm:grid-cols-2">
        <div
            class="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
        >
            <p class="text-xs text-slate-500">Pendapatan Bulan Ini</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
                {formatRupiah(s.revenueMonthly)}
            </p>
        </div>
        <div
            class="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
        >
            <p class="text-xs text-slate-500">Pendapatan Tahun Ini</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
                {formatRupiah(s.revenueYearly)}
            </p>
        </div>
    </section>

    <!-- Revenue Chart 6 Bulan -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold text-slate-800">
            Grafik Pendapatan (6 Bulan)
        </h2>
        {#if revenueChart.length > 0}
            <div class="flex items-end gap-3">
                {#each revenueChart as item}
                    <div class="flex flex-1 flex-col items-center gap-1">
                        <span class="text-xs font-medium text-slate-500">
                            {formatRupiah(item.revenue)}
                        </span>
                        <div
                            class="w-full rounded-md bg-emerald-400"
                            style="height: {(item.revenue / maxRevenue) *
                                120}px; min-height: 4px;"
                        ></div>
                        <span class="text-xs text-slate-500">
                            {item.month.slice(5, 7)}/{item.month.slice(0, 4)}
                        </span>
                    </div>
                {/each}
            </div>
        {:else}
            <p class="text-sm text-slate-400">Belum ada data pendapatan.</p>
        {/if}
    </section>

    <!-- Device Status Chart -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-4 text-sm font-semibold text-slate-800">
            Status Display
        </h2>
        <div class="space-y-3">
            <!-- Online -->
            <div class="flex items-center gap-3">
                <span class="w-20 text-xs font-medium text-slate-600"
                    >Online</span
                >
                <div
                    class="h-4 flex-1 overflow-hidden rounded-full bg-slate-100"
                >
                    <div
                        class="h-full rounded-full bg-emerald-500 transition-all"
                        style="width: {deviceChart.online > 0
                            ? (deviceChart.online / totalDev) * 100 + '%'
                            : '0%'}"
                    ></div>
                </div>
                <span class="w-8 text-right text-sm font-bold text-emerald-700"
                    >{deviceChart.online}</span
                >
            </div>
            <!-- Offline -->
            <div class="flex items-center gap-3">
                <span class="w-20 text-xs font-medium text-slate-600"
                    >Offline</span
                >
                <div
                    class="h-4 flex-1 overflow-hidden rounded-full bg-slate-100"
                >
                    <div
                        class="h-full rounded-full bg-red-500 transition-all"
                        style="width: {deviceChart.offline > 0
                            ? (deviceChart.offline / totalDev) * 100 + '%'
                            : '0%'}"
                    ></div>
                </div>
                <span class="w-8 text-right text-sm font-bold text-red-700"
                    >{deviceChart.offline}</span
                >
            </div>
            <!-- Unknown -->
            <div class="flex items-center gap-3">
                <span class="w-20 text-xs font-medium text-slate-600"
                    >Tidak Diketahui</span
                >
                <div
                    class="h-4 flex-1 overflow-hidden rounded-full bg-slate-100"
                >
                    <div
                        class="h-full rounded-full bg-slate-400 transition-all"
                        style="width: {deviceChart.unknown > 0
                            ? (deviceChart.unknown / totalDev) * 100 + '%'
                            : '0%'}"
                    ></div>
                </div>
                <span class="w-8 text-right text-sm font-bold text-slate-700"
                    >{deviceChart.unknown}</span
                >
            </div>
        </div>
    </section>

    <!-- Expiring Soon -->
    {#if data.expiringSubscriptions.length > 0}
        <section class="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <h2 class="text-sm font-semibold text-yellow-800">
                ⏳ Subscription Akan Berakhir (7 hari)
            </h2>
            <div class="mt-2 space-y-1">
                {#each data.expiringSubscriptions as sub}
                    <p class="text-xs text-yellow-700">
                        #{sub.id} — {sub.packageName} — berakhir {formatDate(
                            sub.endDate,
                        )}
                    </p>
                {/each}
            </div>
        </section>
    {/if}

    <!-- Device Offline -->
    {#if data.offlineDeviceList.length > 0}
        <section class="rounded-xl border border-red-200 bg-red-50 p-4">
            <h2 class="text-sm font-semibold text-red-800">
                🔴 Display Offline
            </h2>
            <div class="mt-2 space-y-1">
                {#each data.offlineDeviceList as dvc}
                    <p class="text-xs text-red-700">
                        {dvc.name} ({dvc.deviceCode}) — terakhir {formatDate(
                            dvc.lastSeenAt,
                        )}
                    </p>
                {/each}
            </div>
        </section>
    {/if}

    <!-- Recent Masjids + Recent Subscriptions -->
    <section class="grid gap-6 lg:grid-cols-2">
        <article
            class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
            <h2 class="text-sm font-semibold text-slate-800">Masjid Terbaru</h2>
            <div class="mt-3 space-y-2">
                {#each data.recentMasjids as m}
                    <div
                        class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                        <span class="font-medium text-slate-700">{m.name}</span>
                        <span class="text-xs text-slate-400"
                            >{m.city ?? "-"}</span
                        >
                    </div>
                {/each}
                {#if data.recentMasjids.length === 0}
                    <p class="text-xs text-slate-400">Belum ada masjid.</p>
                {/if}
            </div>
        </article>

        <article
            class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
            <h2 class="text-sm font-semibold text-slate-800">
                Subscription Terbaru
            </h2>
            <div class="mt-3 space-y-2">
                {#each data.recentSubscriptions as sub}
                    <div
                        class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                        <span class="font-medium text-slate-700"
                            >{sub.packageName}</span
                        >
                        <span
                            class="rounded-full px-2 py-0.5 text-xs font-semibold {STATUS_COLORS[
                                sub.status
                            ] ?? 'bg-slate-100 text-slate-500'}"
                        >
                            {sub.status}
                        </span>
                    </div>
                {/each}
                {#if data.recentSubscriptions.length === 0}
                    <p class="text-xs text-slate-400">
                        Belum ada subscription.
                    </p>
                {/if}
            </div>
        </article>
    </section>
</div>
