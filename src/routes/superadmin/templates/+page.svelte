<script lang="ts">
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();

    let showCreateModal = $state(false);
    let editingId = $state<number | null>(null);
    let editName = $state("");
    let editThemeKey = $state("");
    let editPaletteJson = $state("");
    let editLayoutJson = $state("");
    let editIsGlobal = $state(false);
    let deleteTarget = $state<{ id: number; name: string } | null>(null);
    let deleteForms = $state<Map<number, HTMLFormElement>>(new Map());

    function registerDeleteForm(node: HTMLFormElement, id: number) {
        const existing = deleteForms.get(id);
        if (existing) existing.remove();
        node.dataset.deleteId = String(id);
        deleteForms.set(id, node);
        return {
            destroy() {
                deleteForms.delete(id);
            }
        };
    }

    $effect(() => {
        if (form?.deleted) showToast("Template berhasil dinonaktifkan");
        if (form?.saved) showToast("Template berhasil disimpan");
    });

    function openCreate() {
        editingId = null;
        editName = "";
        editThemeKey = "";
        editPaletteJson = "";
        editLayoutJson = "";
        editIsGlobal = false;
        showCreateModal = true;
    }

    function openEdit(t: Record<string, unknown>) {
        editingId = t.id as number;
        editName = t.name as string;
        editThemeKey = t.themeKey as string;
        editPaletteJson = t.paletteJson
            ? JSON.stringify(t.paletteJson, null, 2)
            : "";
        editLayoutJson = t.layoutJson
            ? JSON.stringify(t.layoutJson, null, 2)
            : "";
        editIsGlobal = t.isGlobal === 1;
        showCreateModal = true;
    }

    function closeModal() {
        showCreateModal = false;
        editingId = null;
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <h1 class="text-lg font-semibold text-slate-800">Templates</h1>
        <button
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            onclick={openCreate}>+ Tambah Template</button
        >
    </div>

    <!-- Global Templates -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">
            Template Global ({data.globalThemes.length})
        </h2>
        {#if data.globalThemes.length > 0}
            <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {#each data.globalThemes as t}
                    <div
                        class="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                        <p class="font-medium text-slate-800">{t.name}</p>
                        <p class="mt-1 text-xs text-slate-400">
                            Key: {t.themeKey}
                        </p>
                        <p class="mt-0.5 text-xs text-slate-400">
                            {t.isActive ? "✅ Aktif" : "❌ Nonaktif"}
                        </p>
                    </div>
                {/each}
            </div>
        {:else}
            <p class="mt-3 text-sm text-slate-400">
                Belum ada template global. Buat template dengan isGlobal=1.
            </p>
        {/if}
    </section>

    <!-- All Themes -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-base font-semibold text-slate-800">
            Semua Template ({data.allThemes.length})
        </h2>
        {#if data.allThemes.length > 0}
            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr
                            class="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"
                        >
                            <th class="pb-2 pr-4">Nama</th>
                            <th class="pb-2 pr-4">Key</th>
                            <th class="pb-2 pr-4">Global</th>
                            <th class="pb-2 pr-4">Aktif</th>
                            <th class="pb-2">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each data.allThemes as t}
                            <tr class="text-slate-600">
                                <td class="py-2 pr-4 font-medium text-slate-700"
                                    >{t.name}</td
                                >
                                <td class="py-2 pr-4 font-mono text-xs"
                                    >{t.themeKey}</td
                                >
                                <td class="py-2 pr-4 text-xs"
                                    >{t.isGlobal
                                        ? "🌍 Global"
                                        : "🏠 Per-masjid"}</td
                                >
                                <td class="py-2 pr-4"
                                    >{t.isActive ? "✅" : "❌"}</td
                                >
                                <td class="py-2">
                                    <div class="flex items-center gap-1">
                                        <button
                                            class="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                                            onclick={() => openEdit(t)}
                                            >✎</button
                                        >
                                        <form
                                            method="POST"
                                            action="?/toggleActive"
                                            class="inline"
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={t.id}
                                            />
                                            <input
                                                type="hidden"
                                                name="is_active"
                                                value={t.isActive}
                                            />
                                            <button
                                                class="rounded-lg px-2 py-1 text-xs font-medium {t.isActive
                                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}"
                                            >
                                                {t.isActive ? "⏸" : "▶"}
                                            </button>
                                        </form>
                                        <form
                                            method="POST"
                                            action="?/deleteTheme"
                                            class="inline"
                                            use:registerDeleteForm={t.id}
                                        >
                                            <input
                                                type="hidden"
                                                name="id"
                                                value={t.id}
                                            />
                                            <button
                                                type="button"
                                                class="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                                                onclick={() => {
                                                    deleteTarget = {
                                                        id: t.id,
                                                        name: t.name,
                                                    };
                                                }}>🗑</button
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
            <p class="mt-3 text-sm text-slate-400">Belum ada template.</p>
        {/if}
    </section>

    <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Template"
        message={deleteTarget ? `Hapus template "${deleteTarget.name}"?` : ""}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onconfirm={() => {
            if (deleteTarget) {
                const form = deleteForms.get(deleteTarget.id);
                if (form) form.requestSubmit();
                deleteForms.delete(deleteTarget.id);
            }
            deleteTarget = null;
        }}
        oncancel={() => {
            deleteTarget = null;
        }}
    />

    <!-- Create / Edit Modal -->
    {#if showCreateModal}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onclick={closeModal}
        >
            <div
                class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                onclick={(e) => e.stopPropagation()}
            >
                <h2 class="text-lg font-semibold text-emerald-900">
                    {editingId !== null
                        ? "Edit Template"
                        : "Tambah Template Baru"}
                </h2>
                <form
                    method="POST"
                    action={editingId !== null
                        ? "?/updateTheme"
                        : "?/createTheme"}
                    class="mt-4 grid gap-3"
                >
                    {#if editingId !== null}
                        <input type="hidden" name="id" value={editingId} />
                    {/if}
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-medium text-slate-500"
                            >Nama Template *</label
                        >
                        <input
                            name="name"
                            required
                            bind:value={editName}
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-medium text-slate-500"
                            >Theme Key *</label
                        >
                        <input
                            name="theme_key"
                            required
                            bind:value={editThemeKey}
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-medium text-slate-500"
                            >Palette JSON</label
                        >
                        <textarea
                            name="palette_json"
                            bind:value={editPaletteJson}
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                            rows="3"
                            placeholder="Contoh: primary: #10b981"
                        ></textarea>
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-medium text-slate-500"
                            >Layout JSON</label
                        >
                        <textarea
                            name="layout_json"
                            bind:value={editLayoutJson}
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                            rows="3"
                        ></textarea>
                    </div>
                    <div class="flex items-center gap-2">
                        <input
                            name="is_global"
                            type="checkbox"
                            value="1"
                            checked={editIsGlobal}
                            class="rounded border-slate-300 text-emerald-600"
                        />
                        <label class="text-sm text-slate-600"
                            >Template Global</label
                        >
                    </div>
                    <div class="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            onclick={closeModal}>Batal</button
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
