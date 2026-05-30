<script lang="ts">
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();

    let showAddProvider = $state(false);
    let deleteTarget = $state<number | null>(null);
    let deleteFormEl = $state<HTMLFormElement | null>(null);

    $effect(() => {
        if (form?.deleted) showToast("Provider berhasil dinonaktifkan");
        if (form?.saved) showToast("Konfigurasi berhasil disimpan");
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
</script>

<div class="space-y-6">
    <!-- Konfigurasi Global -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">
            Konfigurasi Global
        </h2>
        <form method="POST" action="?/updateGlobalConfig" class="mt-4">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label
                        for="primaryProviderId"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Provider Utama
                    </label>
                    <select
                        name="primaryProviderId"
                        id="primaryProviderId"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                        <option value="">— Pilih Provider —</option>
                        {#each data.providers as p}
                            <option
                                value={p.id}
                                selected={data.config?.primaryProviderId ===
                                    p.id}
                            >
                                {p.name}
                            </option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        for="fallbackProviderId"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Provider Cadangan
                    </label>
                    <select
                        name="fallbackProviderId"
                        id="fallbackProviderId"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                        <option value="">Tidak ada</option>
                        {#each data.providers as p}
                            <option
                                value={p.id}
                                selected={data.config?.fallbackProviderId ===
                                    p.id}
                            >
                                {p.name}
                            </option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        for="defaultMethodId"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Metode Hisab Default
                    </label>
                    <select
                        name="defaultMethodId"
                        id="defaultMethodId"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                        <option value="">— Pilih Metode —</option>
                        {#each data.methods as m}
                            <option
                                value={m.id}
                                selected={data.config?.defaultMethodId === m.id}
                            >
                                {m.methodName}
                            </option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        for="defaultTimezone"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Default Timezone
                    </label>
                    <select
                        name="defaultTimezone"
                        id="defaultTimezone"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                        {#each ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as tz}
                            <option
                                value={tz}
                                selected={(data.config?.defaultTimezone ??
                                    "Asia/Jakarta") === tz}
                            >
                                {tz}
                            </option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        for="apiKey"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        API Key
                        <span class="text-slate-400">(opsional)</span>
                    </label>
                    <input
                        type="text"
                        name="apiKey"
                        id="apiKey"
                        value={data.config?.apiKey ?? ""}
                        placeholder="API Key"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label
                        for="syncFrequency"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Frekuensi Sinkronisasi
                    </label>
                    <select
                        name="syncFrequency"
                        id="syncFrequency"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                        {#each ["daily", "weekly", "manual"] as f}
                            <option
                                value={f}
                                selected={(data.config?.syncFrequency ??
                                    "daily") === f}
                            >
                                {f === "daily"
                                    ? "Harian"
                                    : f === "weekly"
                                      ? "Mingguan"
                                      : "Manual"}
                            </option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        for="syncTime"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Waktu Sinkronisasi
                    </label>
                    <input
                        type="time"
                        name="syncTime"
                        id="syncTime"
                        value={data.config?.syncTime?.slice(0, 5) ?? "03:00"}
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div class="flex flex-col justify-end gap-2">
                    <label
                        class="flex items-center gap-2 text-sm text-slate-600"
                    >
                        <input
                            type="checkbox"
                            name="lockProvider"
                            value="1"
                            checked={data.config?.lockProvider === 1}
                        />
                        Kunci provider agar tidak bisa diubah admin masjid
                    </label>
                    <label
                        class="flex items-center gap-2 text-sm text-slate-600"
                    >
                        <input
                            type="checkbox"
                            name="lockMethod"
                            value="1"
                            checked={data.config?.lockMethod === 1}
                        />
                        Kunci metode hisab agar tidak bisa diubah admin masjid
                    </label>
                </div>
            </div>
            <div class="mt-4 flex justify-end">
                <button
                    class="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                    Simpan Konfigurasi Global
                </button>
            </div>
        </form>
    </section>

    <!-- Aksi Massal -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">Aksi Massal</h2>
        <div class="mt-3">
            <form method="POST" action="?/refreshAllMasjids">
                <button
                    class="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                    Refresh Semua Masjid
                </button>
            </form>
            {#if data.refreshed}
                <p
                    class="mt-2 text-sm font-medium {data.syncOk
                        ? 'text-emerald-600'
                        : 'text-amber-600'}"
                >
                    {data.syncMsg ?? "Sinkronisasi selesai."}
                </p>
            {/if}
        </div>
    </section>

    <!-- Providers -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-800">
                Provider Jadwal Sholat
            </h2>
            <button
                onclick={() => (showAddProvider = true)}
                class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
                + Tambah Provider
            </button>
        </div>
        {#if data.providers.length > 0}
            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr
                            class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"
                        >
                            <th class="pb-2 pr-4">Nama</th>
                            <th class="pb-2 pr-4">Key</th>
                            <th class="pb-2 pr-4">Base URL</th>
                            <th class="pb-2 pr-4">Aktif</th>
                            <th class="pb-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each data.providers as p}
                            <tr class="text-slate-600">
                                <td class="py-2 pr-4 font-medium text-slate-700"
                                    >{p.name}</td
                                >
                                <td class="py-2 pr-4 font-mono text-xs"
                                    >{p.providerKey}</td
                                >
                                <td class="py-2 pr-4 text-xs"
                                    >{p.baseUrl ?? "-"}</td
                                >
                                <td class="py-2 pr-4"
                                    >{p.isActive ? "✅" : "❌"}</td
                                >
                                <td class="py-2">
                                    <div class="flex items-center gap-1">
                                        <form
                                            method="POST"
                                            action="?/updateProvider"
                                            class="flex items-center gap-1"
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={p.id}
                                            />
                                            <input
                                                name="baseUrl"
                                                value={p.baseUrl ?? ""}
                                                placeholder="URL"
                                                class="w-40 rounded border border-slate-200 px-2 py-1 text-xs"
                                            />
                                            <select
                                                name="isActive"
                                                class="rounded border border-slate-200 px-2 py-1 text-xs"
                                            >
                                                <option
                                                    value="1"
                                                    selected={p.isActive === 1}
                                                    >Aktif</option
                                                >
                                                <option
                                                    value="0"
                                                    selected={p.isActive === 0}
                                                    >Nonaktif</option
                                                >
                                            </select>
                                            <button
                                                class="rounded bg-emerald-100 px-3 py-2.5 text-xs min-h-[44px] font-medium text-emerald-700 hover:bg-emerald-200 inline-flex items-center justify-center"
                                                >Update</button
                                            >
                                        </form>
                                        <form
                                            method="POST"
                                            action="?/deleteProvider"
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={p.id}
                                            />
                                            <button
                                                type="button"
                                                class="rounded bg-red-100 px-3 py-2.5 text-xs min-h-[44px] font-medium text-red-600 hover:bg-red-200 inline-flex items-center justify-center"
                                                onclick={(e) => {
                                                    deleteTarget = p.id;
                                                    deleteFormEl =
                                                        e.currentTarget?.closest(
                                                            "form",
                                                        );
                                                }}
                                            >
                                                Hapus
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">Belum ada provider.</p>
        {/if}
    </section>

    <!-- Calculation Methods -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">Metode Hisab</h2>
        {#if data.methods.length > 0}
            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr
                            class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"
                        >
                            <th class="pb-2 pr-4">Kode</th>
                            <th class="pb-2 pr-4">Nama</th>
                            <th class="pb-2 pr-4">Provider</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each data.methods as m}
                            <tr class="text-slate-600">
                                <td class="py-2 pr-4 font-mono text-xs"
                                    >{m.methodCode}</td
                                >
                                <td class="py-2 pr-4 font-medium text-slate-700"
                                    >{m.methodName}</td
                                >
                                <td class="py-2 pr-4 text-xs">{m.providerId}</td
                                >
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">Belum ada metode.</p>
        {/if}
    </section>

    <!-- Sync Jobs -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">
            Riwayat Sinkronisasi
        </h2>
        {#if data.recentJobs.length > 0}
            <div class="mt-3 space-y-1">
                {#each data.recentJobs as job}
                    <div
                        class="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                    >
                        <span class="shrink-0 text-slate-400"
                            >{formatDate(job.createdAt)}</span
                        >
                        <span
                            class="rounded-full bg-slate-100 px-1.5 py-0.5 font-medium capitalize"
                            >{job.status}</span
                        >
                        <span class="text-slate-500">— {job.providerKey}</span>
                    </div>
                {/each}
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">Belum ada sinkronisasi.</p>
        {/if}
    </section>
</div>

<ConfirmDialog
    open={deleteTarget !== null}
    title="Hapus Provider"
    message="Nonaktifkan provider ini? Data tidak akan hilang, hanya dinonaktifkan."
    confirmLabel="Ya, Nonaktifkan"
    cancelLabel="Batal"
    onconfirm={() => {
        if (deleteFormEl) deleteFormEl.requestSubmit();
        deleteTarget = null;
        deleteFormEl = null;
    }}
    oncancel={() => {
        deleteTarget = null;
        deleteFormEl = null;
    }}
/>

<!-- Modal Tambah Provider -->
{#if showAddProvider}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onclick={() => (showAddProvider = false)}
        onkeydown={() => {}}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <div
            class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onclick={(e) => e.stopPropagation()}
            role="presentation"
        >
            <h3 class="text-base font-semibold text-slate-800">
                Tambah Provider
            </h3>
            <form
                method="POST"
                action="?/createProvider"
                class="mt-4 space-y-4"
            >
                <div>
                    <label
                        for="providerKey"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Provider Key
                    </label>
                    <input
                        type="text"
                        name="providerKey"
                        id="providerKey"
                        required
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label
                        for="name"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Nama
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label
                        for="baseUrl"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Base URL
                        <span class="text-slate-400">(opsional)</span>
                    </label>
                    <input
                        type="text"
                        name="baseUrl"
                        id="baseUrl"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div class="flex justify-end gap-2">
                    <button
                        type="button"
                        onclick={() => (showAddProvider = false)}
                        class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        Simpan
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
