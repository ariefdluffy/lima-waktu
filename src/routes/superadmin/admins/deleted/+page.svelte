<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();

    let restoreTarget = $state<{ userId: string; fullName: string } | null>(null);
    let restoreFormEl = $state<HTMLFormElement | null>(null);

    $effect(() => {
        if (form?.restored) showToast("Admin berhasil dipulihkan");
        if (form?.error) showToast(form.error, "error");
    });

    function goSearch(e: Event) {
        const form = e.currentTarget as HTMLFormElement;
        const fd = new FormData(form);
        const q = fd.get("q") ?? "";
        goto(`/superadmin/admins/deleted?q=${encodeURIComponent(String(q))}`);
    }

    function goPage(p: number) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set("page", String(p));
        goto(`/superadmin/admins/deleted?${params}`);
    }

    function formatDate(d: unknown): string {
        if (!d) return "-";
        return new Date(d as string).toLocaleString("id-ID", {
            timeZone: "Asia/Makassar",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-lg font-semibold text-slate-800">Admin Terhapus</h1>
            <p class="mt-0.5 text-xs text-slate-500">
                {data.total} admin telah dihapus (soft delete) — bisa dipulihkan
                kapan saja.
            </p>
        </div>
        <a
            href="/superadmin/admins"
            class="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >← Admin Aktif</a
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
                    <th class="px-4 py-3">Dihapus Pada</th>
                    <th class="px-4 py-3">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                {#each data.deletedAdmins as a}
                    <tr class="hover:bg-red-50/30">
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
                                            class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                            >{m.masjidName}</span
                                        >
                                    {/each}
                                </div>
                            {:else}
                                <span class="text-xs text-slate-400">-</span>
                            {/if}
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-500"
                            >{formatDate(a.deletedAt)}</td
                        >
                        <td class="px-4 py-3">
                            <form
                                method="POST"
                                action="?/restoreAdmin"
                                class="inline"
                            >
                                <input
                                    type="hidden"
                                    name="user_id"
                                    value={a.id}
                                />
                                <button
                                    type="button"
                                    class="rounded-lg bg-emerald-100 px-3 py-2.5 text-xs min-h-[44px] font-medium text-emerald-700 hover:bg-emerald-200 inline-flex items-center justify-center"
                                    onclick={(e) => {
                                        restoreTarget = {
                                            userId: a.id,
                                            fullName: a.fullName,
                                        };
                                        restoreFormEl = (
                                            e.currentTarget as HTMLButtonElement
                                        ).closest("form") as HTMLFormElement;
                                    }}>Pulihkan</button
                                >
                            </form>
                        </td>
                    </tr>
                {/each}
                {#if data.deletedAdmins.length === 0}
                    <tr>
                        <td
                            colspan="5"
                            class="px-4 py-8 text-center text-sm text-slate-400"
                        >
                            Tidak ada admin terhapus.
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
                    class="rounded-lg border border-slate-200 px-3 py-2.5 text-sm min-h-[44px] text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center"
                    onclick={() => goPage(data.page - 1)}>Sebelumnya</button
                >
            {/if}
            <span class="text-sm text-slate-500"
                >Halaman {data.page} dari {data.totalPages}</span
            >
            {#if data.page < data.totalPages}
                <button
                    class="rounded-lg border border-slate-200 px-3 py-2.5 text-sm min-h-[44px] text-slate-600 hover:bg-slate-50 inline-flex items-center justify-center"
                    onclick={() => goPage(data.page + 1)}>Selanjutnya</button
                >
            {/if}
        </div>
    {/if}

    <ConfirmDialog
        open={restoreTarget !== null}
        title="Pulihkan Admin"
        message={restoreTarget
            ? `Pulihkan admin "${restoreTarget.fullName}"? Akun akan aktif kembali dan bisa login.`
            : ""}
        confirmLabel="Ya, Pulihkan"
        cancelLabel="Batal"
        onconfirm={() => {
            if (restoreFormEl) restoreFormEl.requestSubmit();
            restoreTarget = null;
            restoreFormEl = null;
        }}
        oncancel={() => {
            restoreTarget = null;
            restoreFormEl = null;
        }}
    />
</div>
