<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();
    let showCreateModal = $state(false);
    let editAdminId = $state<string | null>(null);
    let resetPassUserId = $state<string | null>(null);
    let resetPassResult = $state<string | null>(null);
    let deleteTarget = $state<{
        userId: string;
        masjidId: string;
        masjidName: string;
    } | null>(null);
    let deleteFormEl = $state<HTMLFormElement | null>(null);

    $effect(() => {
        if (form?.deleted) showToast("Admin berhasil dihapus dari masjid");
        if (form?.saved) showToast("Data admin berhasil disimpan");
        if (form?.error) showToast(form.error, "error");
    });

    // Handle reset password result from form action
    $effect(() => {
        if (form?.newPassword) {
            resetPassResult = form.newPassword;
        }
    });

    function findAdmin(id: string) {
        return data.admins.find((a) => a.id === id) ?? null;
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
                                        <div
                                            class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                        >
                                            {m.masjidName}
                                            {#if m.roleScope !== "owner"}
                                                <span class="text-slate-400"
                                                    >({m.roleScope})</span
                                                >
                                                <form
                                                    method="POST"
                                                    action="?/removeMasjid"
                                                    class="inline"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="user_id"
                                                        value={a.id}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name="masjid_id"
                                                        value={m.masjidId}
                                                    />
                                                    <button
                                                        type="button"
                                                        class="text-red-400 hover:text-red-600"
                                                        onclick={(e) => {
                                                            const form = (
                                                                e.currentTarget as HTMLButtonElement
                                                            ).closest(
                                                                "form",
                                                            ) as HTMLFormElement;
                                                            deleteTarget = {
                                                                userId: a.id,
                                                                masjidId:
                                                                    m.masjidId,
                                                                masjidName:
                                                                    m.masjidName,
                                                            };
                                                            deleteFormEl = form;
                                                        }}>✕</button
                                                    >
                                                </form>
                                            {/if}
                                        </div>
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
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            tabindex="-1"
            onclick={() => (editAdminId = null)}
            onkeydown={(e) => { if (e.key === 'Escape') editAdminId = null; }}
        >
            <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
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
                        <label for="edit-fullName" class="block text-xs font-medium text-slate-500"
                            >Nama Lengkap</label
                        >
                        <input
                            id="edit-fullName"
                            name="fullName"
                            value={editAdminData.fullName}
                            required
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label for="edit-email" class="block text-xs font-medium text-slate-500"
                            >Email</label
                        >
                        <input
                            id="edit-email"
                            name="email"
                            type="email"
                            value={editAdminData.email}
                            required
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label for="edit-phone" class="block text-xs font-medium text-slate-500"
                            >No. HP</label
                        >
                        <input
                            id="edit-phone"
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
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            tabindex="-1"
            onclick={() => (resetPassUserId = null)}
            onkeydown={(e) => { if (e.key === 'Escape') resetPassUserId = null; }}
        >
            <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
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
                        <label for="reset-password" class="block text-xs font-medium text-slate-500"
                            >Password Baru * (min 6 karakter)</label
                        >
                        <input
                            id="reset-password"
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
            <div class="mt-3 space-y-2">
                {#each data.auditLogs as log}
                    {@const changes = log.changesJson
                        ? typeof log.changesJson === "string"
                            ? JSON.parse(log.changesJson)
                            : log.changesJson
                        : null}
                    <div
                        class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    >
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-2">
                                <span class="shrink-0 font-mono text-slate-400"
                                    >{formatDate(log.createdAt)}</span
                                >
                                <span class="font-semibold">{log.action}</span>
                                <span class="text-slate-500"
                                    >— {log.entity}</span
                                >
                            </div>
                            {#if log.ipAddress}
                                <span
                                    class="shrink-0 font-mono text-[10px] text-slate-300"
                                    >{log.ipAddress}</span
                                >
                            {/if}
                        </div>
                        <div
                            class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400"
                        >
                            {#if log.userFullName}
                                <span
                                    >Oleh:
                                    <span class="font-medium text-slate-500"
                                        >{log.userFullName}</span
                                    ></span
                                >
                            {/if}
                            {#if log.entityId}
                                <span
                                    >ID:
                                    <span class="font-mono text-slate-500"
                                        >{log.entityId}</span
                                    ></span
                                >
                            {/if}
                            {#if log.masjidId}
                                <span
                                    >Masjid ID:
                                    <span class="font-mono text-slate-500"
                                        >{log.masjidId}</span
                                    ></span
                                >
                            {/if}
                        </div>
                        {#if changes}
                            <div
                                class="mt-1 rounded bg-white/60 px-2 py-1 font-mono text-[10px] text-slate-400"
                            >
                                {JSON.stringify(changes)}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">Belum ada aktivitas.</p>
        {/if}
    </section>
</div>

<ConfirmDialog
    open={deleteTarget !== null}
    title="Hapus Admin dari Masjid"
    message={deleteTarget
        ? `Hapus admin dari masjid "${deleteTarget.masjidName}"?`
        : ""}
    confirmLabel="Ya, Hapus"
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

<!-- Create Admin Modal -->
{#if showCreateModal}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        onclick={() => (showCreateModal = false)}
        onkeydown={(e) => { if (e.key === 'Escape') showCreateModal = false; }}
    >
        <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
        <div
            class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onclick={(e) => e.stopPropagation()}
        >
            <h2 class="text-lg font-semibold text-emerald-900">
                Tambah Admin Masjid
            </h2>
            <form method="POST" action="?/createAdmin" class="mt-4 grid gap-3">
                <div>
                    <label for="create-fullName" class="block text-xs font-medium text-slate-500"
                        >Nama Lengkap *</label
                    >
                    <input
                        id="create-fullName"
                        name="fullName"
                        required
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="create-email" class="block text-xs font-medium text-slate-500"
                        >Email *</label
                    >
                    <input
                        id="create-email"
                        name="email"
                        type="email"
                        required
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="create-phone" class="block text-xs font-medium text-slate-500"
                        >No. HP</label
                    >
                    <input
                        id="create-phone"
                        name="phone"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="create-password" class="block text-xs font-medium text-slate-500"
                        >Password * (min 6 karakter)</label
                    >
                    <input
                        id="create-password"
                        name="password"
                        type="password"
                        required
                        minlength={6}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="create-masjid" class="block text-xs font-medium text-slate-500"
                        >Masjid</label
                    >
                    <select
                        id="create-masjid"
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
                    <label for="create-role" class="block text-xs font-medium text-slate-500"
                        >Role</label
                    >
                    <select
                        id="create-role"
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
