<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();
    let showCreateModal = $state(false);
    let deleteTarget = $state<{ id: string; name: string } | null>(null);

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

    function goSearch(e: Event) {
        const form = e.currentTarget as HTMLFormElement;
        const fd = new FormData(form);
        const q = fd.get("q") ?? "";
        const status = fd.get("status") ?? "all";
        goto(
            `/superadmin/masjids?q=${encodeURIComponent(String(q))}&status=${status}`,
        );
    }

    function goPage(p: number) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set("page", String(p));
        goto(`/superadmin/masjids?${params}`);
    }

    function askDelete(id: string, name: string) {
        deleteTarget = { id, name };
    }

    $effect(() => {
        if (form?.saved) showToast("Masjid berhasil diupdate");
        if (form?.deleted) showToast("Masjid berhasil dihapus");
        if (data.deleted) showToast("Masjid berhasil dihapus");
    });
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <p class="text-xs text-slate-500">Total {data.total} masjid</p>
        </div>
        <button
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            onclick={() => (showCreateModal = true)}>+ Tambah Masjid</button
        >
    </div>

    <!-- Search & Filter -->
    <form
        class="flex flex-wrap items-center gap-3"
        onsubmit={(e) => {
            e.preventDefault();
            goSearch(e);
        }}
    >
        <input
            name="q"
            placeholder="Cari nama atau kota..."
            value={data.search}
            class="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <select
            name="status"
            value={data.statusFilter}
            class="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="suspended">Ditangguhkan</option>
        </select>
        <button
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >Cari</button
        >
    </form>

    <!-- Success Toast -->
    <form method="POST" action="?/deleteMasjid" id="delete-masjid-form">
        <input type="hidden" name="masjid_id" id="delete-masjid-input" />
    </form>

    {#if data.createSuccess}
        <div
            class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700"
        >
            ✅ Masjid berhasil dibuat.
        </div>
    {/if}

    <!-- Table -->
    <div
        class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
    >
        <table class="w-full text-sm">
            <thead>
                <tr
                    class="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                    <th class="px-4 py-3">Nama</th>
                    <th class="px-4 py-3">Kota</th>
                    <th class="px-4 py-3">TZ</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Langganan</th>
                    <th class="px-4 py-3">Device</th>
                    <th class="px-4 py-3">Dibuat</th>
                    <th class="px-4 py-3">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                {#each data.masjids as m}
                    <tr class="hover:bg-emerald-50/40">
                        <td class="px-4 py-3 font-medium text-slate-800">
                            <a
                                href="/superadmin/masjids/{m.id}"
                                class="hover:text-emerald-700 hover:underline"
                            >
                                {m.name}
                            </a>
                        </td>
                        <td class="px-4 py-3 text-slate-500">{m.city ?? "-"}</td
                        >
                        <td class="px-4 py-3 text-xs text-slate-400"
                            >{m.timezone}</td
                        >
                        <td class="px-4 py-3">
                            {#if m.isActive}
                                <span
                                    class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                                    >Aktif</span
                                >
                            {:else}
                                <span
                                    class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
                                    >Ditangguhkan</span
                                >
                            {/if}
                        </td>
                        <td class="px-4 py-3">
                            {#if m.subscription}
                                <span
                                    class="rounded-full px-2 py-0.5 text-xs font-semibold {STATUS_COLORS[
                                        m.subscription.status
                                    ] ?? 'bg-slate-100 text-slate-500'}"
                                >
                                    {m.subscription.status}
                                </span>
                            {:else}
                                <span class="text-xs text-slate-400">-</span>
                            {/if}
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-500">
                            {m.deviceOnline}/{m.deviceCount}
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-400">
                            {formatDate(m.createdAt)}
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-1">
                                <a
                                    href="/superadmin/masjids/{m.id}"
                                    class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-emerald-100 hover:text-emerald-700"
                                >
                                    ✎
                                </a>
                                <form
                                    method="POST"
                                    action="?/toggleSuspend"
                                    class="inline"
                                >
                                    <input
                                        type="hidden"
                                        name="masjid_id"
                                        value={m.id}
                                    />
                                    <input
                                        type="hidden"
                                        name="is_active"
                                        value={m.isActive}
                                    />
                                    <button
                                        class="rounded-lg px-2 py-1 text-xs font-medium {m.isActive
                                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}"
                                    >
                                        {m.isActive ? "⏸" : "▶"}
                                    </button>
                                </form>
                                <button
                                    class="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                                    onclick={() => askDelete(m.id, m.name)}
                                >
                                    🗑
                                </button>
                            </div>
                        </td>
                    </tr>
                {/each}
                {#if data.masjids.length === 0}
                    <tr>
                        <td
                            colspan="8"
                            class="px-4 py-8 text-center text-sm text-slate-400"
                        >
                            Tidak ada masjid ditemukan.
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    {#if data.totalPages > 1}
        <div class="flex items-center justify-center gap-2">
            {#if data.page > 1}
                <button
                    class="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
                    onclick={() => goPage(data.page - 1)}>Sebelumnya</button
                >
            {/if}
            <span class="text-sm text-slate-500">
                Halaman {data.page} dari {data.totalPages}
            </span>
            {#if data.page < data.totalPages}
                <button
                    class="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
                    onclick={() => goPage(data.page + 1)}>Selanjutnya</button
                >
            {/if}
        </div>
    {/if}

    <!-- Create Modal -->
    <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Masjid"
        message={deleteTarget
            ? `Hapus masjid "${deleteTarget.name}"? Semua data terkait akan ikut terhapus.`
            : ""}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onconfirm={() => {
            if (deleteTarget) {
                const input = document.getElementById(
                    "delete-masjid-input",
                ) as HTMLInputElement;
                input.value = deleteTarget.id;
                const form = document.getElementById(
                    "delete-masjid-form",
                ) as HTMLFormElement;
                form.requestSubmit();
            }
            deleteTarget = null;
        }}
        oncancel={() => (deleteTarget = null)}
    />

    {#if showCreateModal}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onclick={() => (showCreateModal = false)}
        >
            <div
                class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                onclick={(e) => e.stopPropagation()}
            >
                <h2 class="text-lg font-semibold text-emerald-900">
                    Tambah Masjid Baru
                </h2>
                <form
                    method="POST"
                    action="?/createMasjid"
                    class="mt-4 grid gap-3 sm:grid-cols-2"
                >
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-medium text-slate-500"
                            >Nama Masjid *</label
                        >
                        <input
                            name="name"
                            required
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Kota</label
                        >
                        <input
                            name="city"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Provinsi</label
                        >
                        <input
                            name="province"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-medium text-slate-500"
                            >Kecamatan</label
                        >
                        <input
                            name="district"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-medium text-slate-500"
                            >Alamat</label
                        >
                        <textarea
                            name="address"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            rows="2"
                        ></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Timezone</label
                        >
                        <select
                            name="timezone"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="Asia/Jakarta"
                                >WIB — Jakarta, Sumatra, Jawa Barat</option
                            >
                            <option value="Asia/Makassar"
                                >WITA — Sulawesi, Bali, Nusa Tenggara</option
                            >
                            <option value="Asia/Jayapura"
                                >WIT — Maluku, Papua</option
                            >
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Admin Masjid</label
                        >
                        <select
                            name="admin_user_id"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="">-- Tanpa admin --</option>
                            {#each data.users as u}
                                <option value={u.id}
                                    >{u.fullName} ({u.email})</option
                                >
                            {/each}
                        </select>
                    </div>
                    <div
                        class="flex items-center justify-end gap-2 sm:col-span-2"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            onclick={() => (showCreateModal = false)}
                            >Batal</button
                        >
                        <button
                            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >Simpan</button
                        >
                    </div>
                </form>
            </div>
        </div>
    {/if}
</div>
