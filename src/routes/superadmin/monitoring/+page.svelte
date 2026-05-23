<script lang="ts">
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();

    $effect(() => {
        if (form?.success) showToast("Sync berhasil dijadwalkan ulang");
    });

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

    function lastSeenStatus(lastSeen: unknown): string {
        if (!lastSeen) return "bg-red-100 text-red-700";
        const diff = Date.now() - new Date(lastSeen as string).getTime();
        return diff < 5 * 60 * 1000
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700";
    }

    function formatUptime(seconds: number): string {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (d > 0) return `${d}h ${h}j ${m}m`;
        if (h > 0) return `${h}j ${m}m`;
        return `${m}m`;
    }

    function formatMB(bytes: number): string {
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }

    const serverHealth = $derived(data.serverHealth);

    function lastSeenLabel(lastSeen: unknown): string {
        if (!lastSeen) return "Tidak pernah";
        const diff = Date.now() - new Date(lastSeen as string).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 5) return "Online";
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}j`;
    }
</script>

<div class="space-y-6">
    <!-- Device Stats -->
    <section class="grid gap-4 sm:grid-cols-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-xs text-slate-500">Total Device</p>
            <p class="mt-1 text-2xl font-bold text-slate-700">
                {data.totalDevices}
            </p>
        </div>
        <div
            class="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm"
        >
            <p class="text-xs text-slate-500">Online</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
                {data.onlineCount}
            </p>
        </div>
        <div class="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
            <p class="text-xs text-slate-500">Offline</p>
            <p class="mt-1 text-2xl font-bold text-red-700">
                {data.offlineCount}
            </p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-xs text-slate-500">Tidak Diketahui</p>
            <p class="mt-1 text-2xl font-bold text-slate-700">
                {data.deviceStats.unknown ?? 0}
            </p>
        </div>
    </section>

    <!-- Server Health -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-slate-800">Server Health</h2>
        <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
                <span
                    class="inline-block h-2.5 w-2.5 rounded-full {serverHealth.status ===
                    'ok'
                        ? 'bg-emerald-500'
                        : 'bg-red-500'}"
                ></span>
                <span class="font-medium text-emerald-700">Berjalan Normal</span
                >
                <span class="text-xs text-slate-400">
                    ({serverHealth.dbStatus})</span
                >
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <p class="text-xs text-slate-500">CPU (Logical)</p>
                    <p class="font-semibold text-slate-700">
                        {serverHealth.cpuCount} core
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-500">Uptime</p>
                    <p class="font-semibold text-slate-700">
                        {formatUptime(serverHealth.uptime)}
                    </p>
                </div>
                <div>
                    <p class="text-xs text-slate-500">Memory (RSS)</p>
                    <p class="font-semibold text-slate-700">
                        {formatMB(serverHealth.memory.rss)}
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Device Table -->
    <div
        class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
    >
        <table class="w-full text-sm">
            <thead>
                <tr
                    class="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                    <th class="px-4 py-3">Nama</th>
                    <th class="px-4 py-3">Kode</th>
                    <th class="px-4 py-3">Masjid</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Terakhir Online</th>
                    <th class="px-4 py-3">Aktif</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                {#each data.devices as d}
                    <tr class="hover:bg-emerald-50/40">
                        <td class="px-4 py-3 font-medium text-slate-800"
                            >{d.name}</td
                        >
                        <td class="px-4 py-3 font-mono text-xs text-slate-500"
                            >{d.deviceCode}</td
                        >
                        <td class="px-4 py-3 text-slate-600"
                            >{d.masjidName ?? "-"}</td
                        >
                        <td class="px-4 py-3">
                            <span
                                class="rounded-full px-2 py-0.5 text-xs font-semibold {lastSeenStatus(
                                    d.lastSeenAt,
                                )}"
                            >
                                {lastSeenLabel(d.lastSeenAt)}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-500"
                            >{formatDate(d.lastSeenAt)}</td
                        >
                        <td class="px-4 py-3 text-xs"
                            >{d.isActive ? "✅" : "❌"}</td
                        >
                    </tr>
                {/each}
                {#if data.devices.length === 0}
                    <tr
                        ><td
                            colspan="6"
                            class="px-4 py-8 text-center text-sm text-slate-400"
                            >Belum ada device.</td
                        ></tr
                    >
                {/if}
            </tbody>
        </table>
    </div>

    <!-- Provider Logs + Sync Jobs -->
    <section class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold text-slate-800">
                Log Provider Jadwal
            </h2>
            {#if data.providerLogs.length > 0}
                <div class="mt-3 space-y-1">
                    {#each data.providerLogs as log}
                        <div
                            class="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                        >
                            <span class="shrink-0 text-slate-400"
                                >{formatDate(log.createdAt)}</span
                            >
                            <span class="font-medium"
                                >{log.responseStatus ?? "-"}</span
                            >
                            <span class="text-slate-500"
                                >{log.requestPath ?? ""}</span
                            >
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="mt-3 text-sm text-slate-400">Belum ada log.</p>
            {/if}
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold text-slate-800">Sync Jobs</h2>
            {#if data.syncJobs.length > 0}
                <div class="mt-3 space-y-1">
                    {#each data.syncJobs as job}
                        <div
                            class="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                        >
                            <span class="shrink-0 text-slate-400"
                                >{formatDate(job.createdAt)}</span
                            >
                            <span class="font-medium capitalize"
                                >{job.status}</span
                            >
                            <span class="text-slate-500"
                                >— {job.providerKey}</span
                            >
                            {#if job.status === "failed"}
                                <form method="POST" action="?/retrySync">
                                    <input
                                        type="hidden"
                                        name="jobId"
                                        value={job.id}
                                    />
                                    <button
                                        type="submit"
                                        class="ml-auto rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
                                    >
                                        Retry
                                    </button>
                                </form>
                            {/if}
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="mt-3 text-sm text-slate-400">Belum ada job.</p>
            {/if}
        </div>
    </section>
</div>
