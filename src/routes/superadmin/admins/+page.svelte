<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";

    let { data, form } = $props();
    let showCreateModal = $state(false);
    let editAdminId = $state<string | null>(null);
    let resetPassUserId = $state<string | null>(null);
    let resetPassResult = $state<string | null>(null);

    // Handle reset password result from form action
    $effect(() => {
        if (form?.newPassword) {
            resetPassResult = form.newPassword;
        }
    });

    function findAdmin(id: string) {
        return (
            data.admins.find(
                (a: {
                    id: string;
                    fullName: string;
                    email: string;
                    phone: string | null;
                    isActive: number;
                    lastLoginAt: string | null;
                    createdAt: string;
                    masjids: {
                        masjidId: string;
                        masjidName: string;
                        roleScope: string;
                    }[];
                }) => a.id === id,
            ) ?? null
        );
    }
    const editAdminData = $derived(editAdminId ? findAdmin(editAdminId) : null);

    function goSearch(e: Event) {
        const form = e.currentTarget as HTMLFormElement;
        const fd = new FormData(form);
        const q = fd.get("q") ?? "";
        goto(`/superadmin/admins?q=${encodeURIComponent(String(q))}`);
    }

    function goPage(p: number) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set("page", String(p));
        goto(`/superadmin/admins?${params}`);
    }

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
    <!-- Success Toast -->
    {#if data.success === "created"}
        <div
            class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700"
        >
            ✅ Admin berhasil dibuat.
        </div>
    {/if}

    <!-- Header -->
    <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500">Total {data.total} admin masjid</p>
        <button
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            onclick={() => (showCreateModal = true)}>+ Tambah Admin</button
        >
    </div>

    <!-- Search -->
    <form
        class="flex items-center gap-3"
        onsubmit={(e) => {
            e.preventDefault();
            goSearch(e);
        }}
    >
        <input
            name="q"
            placeholder="Cari nama atau email..."
            value={data.search}
            class="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <button
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >Cari</button
        >
    </form>

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
                    <th class="px-4 py-3">Email</th>
                    <th class="px-4 py-3">Masjid</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Login Terakhir</th>
                    <th class="px-4 py-3">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                {#each data.admins as a}
                    <tr class="hover:bg-emerald-50/40">
                        <td class="px-4 py-3 font-medium text-slate-800"
                            >{a.fullName}</td
                        >
                        <td class="px-4 py-3 text-xs text-slate-500"
                            >{a.email}</td
                        >
                        <td class="px-4 py-3">
                            {#if a.masjids.length > 0}
                                <div class="flex flex-wrap gap-1">
                                    {#each a.masjids as m}
                                        <span
                                            class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                        >
                                            {m.masjidName}
                                            {#if m.roleScope !== "owner"}
                                                <span class="text-slate-400"
                                                    >({m.roleScope})</span
                                                >
                                            {/if}
                                        </span>
                                    {/each}
                                </div>
                            {:else}
                                <span class="text-xs text-slate-400">-</span>
                            {/if}
                        </td>
                        <td class="px-4 py-3">
                            {#if a.isActive}
                                <span
                                    class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                                    >Aktif</span
                                >
                            {:else}
                                <span
                                    class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
                                    >Nonaktif</span
                                >
                            {/if}
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-400"
                            >{formatDate(a.lastLoginAt)}</td
                        >
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-1">
                                <button
                                    class="rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                                    onclick={() => (editAdminId = a.id)}
                                    >Edit</button
                                >
                                <button
                                    class="rounded-lg bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200"
                                    onclick={() => (resetPassUserId = a.id)}
                                    >Reset PW</button
                                >
                                <form
                                    method="POST"
                                    action="?/toggleActive"
                                    class="inline"
                                >
                                    <input
                                        type="hidden"
                                        name="user_id"
                                        value={a.id}
                                    />
                                    <input
                                        type="hidden"
                                        name="is_active"
                                        value={a.isActive}
                                    />
                                    <button
                                        class="rounded-lg px-2 py-1 text-xs font-medium {a.isActive
                                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}"
                                    >
                                        {a.isActive ? "⏸" : "▶"}
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                {/each}
                {#if data.admins.length === 0}
                    <tr>
                        <td
                            colspan="6"
                            class="px-4 py-8 text-center text-sm text-slate-400"
                        >
                            Tidak ada admin ditemukan.
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
            <span class="text-sm text-slate-500"
                >Halaman {data.page} dari {data.totalPages}</span
            >
            {#if data.page < data.totalPages}
                <button
                    class="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
                    onclick={() => goPage(data.page + 1)}>Selanjutnya</button
                >
            {/if}
        </div>
    {/if}

    <!-- Reset Password Success Alert -->
    {#if resetPassResult}
        <div
            class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
            <p class="font-semibold">✅ Password berhasil direset!</p>
            <p class="mt-1">
                Password baru:
                <span class="font-mono font-bold">{resetPassResult}</span>
            </p>
            <p class="mt-0.5 text-xs text-emerald-500">
                Salin password ini sekarang. Tidak akan ditampilkan lagi.
            </p>
            <button
                class="mt-2 rounded-lg bg-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-300"
                onclick={() => (resetPassResult = null)}>Tutup</button
            >
        </div>
    {/if}

    <!-- Edit Admin Modal -->
    {#if editAdminId && editAdminData}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onclick={() => (editAdminId = null)}
        >
            <div
                class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                onclick={(e) => e.stopPropagation()}
            >
                <h2 class="text-lg font-semibold text-emerald-900">
                    Edit Admin
                </h2>
                <form
                    method="POST"
                    action="?/updateAdmin"
                    class="mt-4 grid gap-3"
                >
                    <input
                        type="hidden"
                        name="user_id"
                        value={editAdminData.id}
                    />
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Nama Lengkap</label
                        >
                        <input
                            name="fullName"
                            value={editAdminData.fullName}
                            required
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Email</label
                        >
                        <input
                            name="email"
                            type="email"
                            value={editAdminData.email}
                            required
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >No. HP</label
                        >
                        <input
                            name="phone"
                            value={editAdminData.phone ?? ""}
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            onclick={() => (editAdminId = null)}>Batal</button
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

    <!-- Reset Password Modal -->
    {#if resetPassUserId}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onclick={() => (resetPassUserId = null)}
        >
            <div
                class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onclick={(e) => e.stopPropagation()}
            >
                <h2 class="text-lg font-semibold text-emerald-900">
                    Reset Password Admin
                </h2>
                <form
                    method="POST"
                    action="?/resetPassword"
                    class="mt-4 space-y-4"
                >
                    <input
                        type="hidden"
                        name="user_id"
                        value={resetPassUserId}
                    />
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Password Baru * (min 6 karakter)</label
                        >
                        <input
                            name="password"
                            type="password"
                            required
                            minlength={6}
                            placeholder="Masukkan password baru"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            onclick={() => (resetPassUserId = null)}
                            >Batal</button
                        >
                        <button
                            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >Reset Password</button
                        >
                    </div>
                </form>
            </div>
        </div>
    {/if}

    <!-- Audit Log -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-800">Aktivitas Terbaru</h2>
        {#if data.auditLogs.length > 0}
            <div class="mt-3 space-y-1">
                {#each data.auditLogs as log}
                    <div
                        class="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                    >
                        <span class="shrink-0 font-mono text-slate-400"
                            >{formatDate(log.createdAt)}</span
                        >
                        <span class="font-semibold">{log.action}</span>
                        <span class="text-slate-500">— {log.entity}</span>
                    </div>
                {/each}
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">Belum ada aktivitas.</p>
        {/if}
    </section>
</div>

<!-- Create Admin Modal -->
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
                Tambah Admin Masjid
            </h2>
            <form method="POST" action="?/createAdmin" class="mt-4 grid gap-3">
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >Nama Lengkap *</label
                    >
                    <input
                        name="fullName"
                        required
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >Email *</label
                    >
                    <input
                        name="email"
                        type="email"
                        required
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >No. HP</label
                    >
                    <input
                        name="phone"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >Password * (min 6 karakter)</label
                    >
                    <input
                        name="password"
                        type="password"
                        required
                        minlength={6}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >Masjid</label
                    >
                    <select
                        name="masjid_id"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="">-- Pilih masjid --</option>
                        {#each data.masjids as m}
                            <option value={m.id}>{m.name}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >Role</label
                    >
                    <select
                        name="roleScope"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="owner">Owner</option>
                        <option value="operator">Operator</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>
                <div class="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        onclick={() => (showCreateModal = false)}>Batal</button
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
