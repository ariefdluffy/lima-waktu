<script lang="ts">
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();
    let showCreateModal = $state(false);

    let deleteTarget = $state<{ id: number; title: string } | null>(null);
    let deleteFormEl = $state<HTMLFormElement | null>(null);

    $effect(() => {
        if (form?.deleted) showToast("Pengumuman berhasil dihapus");
        if (form?.saved) showToast("Pengumuman berhasil disimpan");
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

    function formatDateShort(d: unknown): string {
        if (!d) return "-";
        return new Date(d as string).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    const SEVERITY_COLORS: Record<string, string> = {
        info: "bg-blue-100 text-blue-700",
        warning: "bg-yellow-100 text-yellow-700",
        critical: "bg-red-100 text-red-700",
    };

    const AUDIENCE_LABELS: Record<string, string> = {
        all: "Semua",
        admins: "Admin",
        superadmins: "Superadmin",
    };
</script>

<div class="space-y-6">
    <!-- Pengumuman Platform -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-800">
                Pengumuman Platform ({data.announcements.length})
            </h2>
            <button
                class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                onclick={() => (showCreateModal = true)}
                >+ Buat Pengumuman</button
            >
        </div>
        {#if data.announcements.length > 0}
            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr
                            class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"
                        >
                            <th class="pb-2 pr-4">Judul</th>
                            <th class="pb-2 pr-4">Severity</th>
                            <th class="pb-2 pr-4">Target</th>
                            <th class="pb-2 pr-4">Status</th>
                            <th class="pb-2 pr-4">Mulai</th>
                            <th class="pb-2 pr-4">Berakhir</th>
                            <th class="pb-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each data.announcements as a}
                            <tr class="text-slate-600 hover:bg-emerald-50/40">
                                <td
                                    class="py-2 pr-4 font-medium text-slate-700"
                                >
                                    {a.title}
                                </td>
                                <td class="py-2 pr-4">
                                    <span
                                        class="rounded-full px-2 py-0.5 text-xs font-semibold {SEVERITY_COLORS[
                                            a.severity
                                        ] ?? SEVERITY_COLORS['info']}"
                                    >
                                        {a.severity}
                                    </span>
                                </td>
                                <td class="py-2 pr-4 text-xs capitalize">
                                    {AUDIENCE_LABELS[a.targetAudience] ??
                                        a.targetAudience}
                                </td>
                                <td class="py-2 pr-4">
                                    {#if a.isActive}
                                        <span
                                            class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                                            >Aktif</span
                                        >
                                    {:else}
                                        <span
                                            class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
                                            >Nonaktif</span
                                        >
                                    {/if}
                                </td>
                                <td class="py-2 pr-4 text-xs">
                                    {formatDateShort(a.startAt)}
                                </td>
                                <td class="py-2 pr-4 text-xs">
                                    {formatDateShort(a.endAt)}
                                </td>
                                <td class="py-2">
                                    <div class="flex items-center gap-1">
                                        <form
                                            method="POST"
                                            action="?/toggleAnnouncement"
                                            class="inline"
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={a.id}
                                            />
                                            <button
                                                class="rounded-lg px-2 py-1 text-xs font-medium {a.isActive
                                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}"
                                            >
                                                {a.isActive ? "⏸" : "▶"}
                                            </button>
                                        </form>
                                        <form
                                            method="POST"
                                            action="?/deleteAnnouncement"
                                            class="inline"
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={a.id}
                                            />
                                            <button
                                                type="button"
                                                class="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                                                onclick={(e) => {
                                                    deleteTarget = {
                                                        id: a.id,
                                                        title: a.title,
                                                    };
                                                    deleteFormEl =
                                                        e.currentTarget?.closest(
                                                            "form",
                                                        ) ?? null;
                                                }}>Hapus</button
                                            >
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">
                Belum ada pengumuman platform.
            </p>
        {/if}
    </section>

    <!-- Media Assets -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">
            Semua Media ({data.assets.length})
        </h2>
        {#if data.assets.length > 0}
            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr
                            class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"
                        >
                            <th class="pb-2 pr-4">File</th>
                            <th class="pb-2 pr-4">Tipe</th>
                            <th class="pb-2 pr-4">Judul</th>
                            <th class="pb-2 pr-4">Masjid</th>
                            <th class="pb-2">Dibuat</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each data.assets as a}
                            <tr class="text-slate-600">
                                <td
                                    class="py-2 pr-4 max-w-48 truncate font-mono text-xs"
                                    >{a.fileUrl}</td
                                >
                                <td class="py-2 pr-4 text-xs capitalize"
                                    >{a.fileType}</td
                                >
                                <td class="py-2 pr-4 text-slate-700"
                                    >{a.title ?? "-"}</td
                                >
                                <td class="py-2 pr-4 text-xs"
                                    >{a.masjidId ?? "Global"}</td
                                >
                                <td class="py-2 text-xs"
                                    >{formatDate(a.createdAt)}</td
                                >
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">Belum ada media.</p>
        {/if}
    </section>
</div>

<ConfirmDialog
    open={deleteTarget !== null}
    title="Hapus Pengumuman"
    message={deleteTarget ? `Hapus pengumuman "${deleteTarget.title}"?` : ""}
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

<!-- Create Announcement Modal -->
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
                Buat Pengumuman Platform
            </h2>
            <form
                method="POST"
                action="?/createAnnouncement"
                class="mt-4 grid gap-3"
            >
                <div>
                    <label for="ann-title" class="block text-xs font-medium text-slate-500"
                        >Judul *</label
                    >
                    <input
                        id="ann-title"
                        name="title"
                        required
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="ann-content" class="block text-xs font-medium text-slate-500"
                        >Konten</label
                    >
                    <textarea
                        id="ann-content"
                        name="content"
                        rows="3"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    ></textarea>
                </div>
                <div>
                    <label for="ann-severity" class="block text-xs font-medium text-slate-500"
                        >Severity</label
                    >
                    <select
                        id="ann-severity"
                        name="severity"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div>
                    <label for="ann-target" class="block text-xs font-medium text-slate-500"
                        >Target Audiens</label
                    >
                    <select
                        id="ann-target"
                        name="targetAudience"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                        <option value="all">Semua</option>
                        <option value="admins">Admin</option>
                        <option value="superadmins">Superadmin</option>
                    </select>
                </div>
                <div>
                    <label for="ann-startAt" class="block text-xs font-medium text-slate-500"
                        >Mulai</label
                    >
                    <input
                        id="ann-startAt"
                        name="startAt"
                        type="datetime-local"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="ann-endAt" class="block text-xs font-medium text-slate-500"
                        >Berakhir</label
                    >
                    <input
                        id="ann-endAt"
                        name="endAt"
                        type="datetime-local"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
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
