<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();

    let deleteTarget = $state<number | null>(null);
    let deleteFormEl = $state<HTMLFormElement | null>(null);

    $effect(() => {
        if (form?.deleted) showToast("Subscription berhasil dihapus");
        if (form?.saved) showToast("Subscription berhasil diupdate");
    });

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

    let editingId = $state<number | null>(null);
    let editStatus = $state<string>("");
    let editEndDate = $state<string>("");
    let editAutoRenew = $state<number>(0);

    function openEdit(sub: Record<string, unknown>) {
        editingId = sub.id as number;
        editStatus = sub.status as string;
        editEndDate = sub.endDate ? (sub.endDate as string) : "";
        editAutoRenew = sub.autoRenew as number;
    }

    function closeEdit() {
        editingId = null;
    }

    function goSearch(e: Event) {
        const form = e.currentTarget as HTMLFormElement;
        const fd = new FormData(form);
        const q = fd.get("q") ?? "";
        const status = fd.get("status") ?? "all";
        goto(
            `/superadmin/subscriptions?q=${encodeURIComponent(String(q))}&status=${status}`,
        );
    }

    function goPage(p: number) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set("page", String(p));
        goto(`/superadmin/subscriptions?${params}`);
    }
</script>

<div class="space-y-6">
    <!-- Quick Stats -->
    <section class="grid gap-4 sm:grid-cols-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-xs text-slate-500">Total</p>
            <p class="mt-1 text-2xl font-bold text-slate-700">
                {data.totalCount}
            </p>
        </div>
        <div
            class="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm"
        >
            <p class="text-xs text-slate-500">Active</p>
            <p class="mt-1 text-2xl font-bold text-emerald-700">
                {data.statusCounts.active}
            </p>
        </div>
        <div class="rounded-xl border border-yellow-200 bg-white p-4 shadow-sm">
            <p class="text-xs text-slate-500">Trial/Grace</p>
            <p class="mt-1 text-2xl font-bold text-yellow-700">
                {data.statusCounts.trial + data.statusCounts.grace}
            </p>
        </div>
        <div class="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
            <p class="text-xs text-slate-500">Expired</p>
            <p class="mt-1 text-2xl font-bold text-red-700">
                {data.statusCounts.expired + data.statusCounts.cancelled}
            </p>
        </div>
    </section>

    <!-- Search & Filter Bar -->
    <form
        class="flex flex-wrap items-center gap-3"
        onsubmit={(e) => {
            e.preventDefault();
            goSearch(e);
        }}
    >
        <input
            name="q"
            placeholder="Cari masjid..."
            value={data.search}
            class="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <select
            name="status"
            value={data.statusFilter}
            class="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
            <option value="all">Semua Status</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="grace">Grace</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
        </select>
        <button
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >Cari</button
        >
    </form>

    <!-- Subscription Table -->
    <div
        class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
    >
        <table class="w-full text-sm">
            <thead>
                <tr
                    class="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                    <th class="px-4 py-3">Masjid</th>
                    <th class="px-4 py-3">Paket</th>
                    <th class="px-4 py-3">Siklus</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Harga</th>
                    <th class="px-4 py-3">Mulai</th>
                    <th class="px-4 py-3">Berakhir</th>
                    <th class="px-4 py-3">Auto</th>
                    <th class="px-4 py-3">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                {#each data.subscriptions as sub}
                    <tr class="hover:bg-emerald-50/40">
                        <td class="px-4 py-3 font-medium text-slate-800"
                            >{sub.masjidName}</td
                        >
                        <td class="px-4 py-3 text-slate-600"
                            >{sub.packageName}</td
                        >
                        <td class="px-4 py-3 text-xs text-slate-500">
                            {sub.billingCycle === "monthly"
                                ? "Bulanan"
                                : "Tahunan"}
                        </td>
                        <td class="px-4 py-3">
                            <span
                                class="rounded-full px-2 py-0.5 text-xs font-semibold {STATUS_COLORS[
                                    sub.status
                                ] ?? ''}"
                            >
                                {sub.status}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-slate-600"
                            >{formatRupiah(sub.price)}</td
                        >
                        <td class="px-4 py-3 text-xs text-slate-500"
                            >{formatDate(sub.startDate)}</td
                        >
                        <td class="px-4 py-3 text-xs text-slate-500"
                            >{formatDate(sub.endDate)}</td
                        >
                        <td class="px-4 py-3 text-xs text-slate-500"
                            >{sub.autoRenew ? "✓" : "-"}</td
                        >
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-1">
                                <button
                                    class="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                                    onclick={() => openEdit(sub)}>✎</button
                                >
                                <form
                                    method="POST"
                                    action="?/deleteSubscription"
                                    class="inline"
                                >
                                    <input
                                        type="hidden"
                                        name="id"
                                        value={sub.id}
                                    />
                                    <button
                                        type="button"
                                        class="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                                        onclick={(e) => {
                                            deleteTarget = sub.id;
                                            deleteFormEl =
                                                e.currentTarget?.closest(
                                                    "form",
                                                );
                                        }}>🗑</button
                                    >
                                </form>
                            </div>
                        </td>
                    </tr>
                {/each}
                {#if data.subscriptions.length === 0}
                    <tr>
                        <td
                            colspan="9"
                            class="px-4 py-8 text-center text-sm text-slate-400"
                        >
                            Belum ada subscription.
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>

    <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Subscription"
        message="Hapus subscription ini?"
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

    <!-- Edit Modal -->
    {#if editingId !== null}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onclick={closeEdit}
        >
            <div
                class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onclick={(e) => e.stopPropagation()}
            >
                <h2 class="text-lg font-semibold text-emerald-900">
                    Edit Subscription
                </h2>
                <form
                    method="POST"
                    action="?/updateSubscription"
                    class="mt-4 space-y-4"
                >
                    <input type="hidden" name="id" value={editingId} />
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Status</label
                        >
                        <select
                            name="status"
                            bind:value={editStatus}
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >
                            <option value="trial">Trial</option>
                            <option value="active">Active</option>
                            <option value="grace">Grace</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Tanggal Berakhir</label
                        >
                        <input
                            name="end_date"
                            type="date"
                            bind:value={editEndDate}
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <input
                            name="auto_renew"
                            type="checkbox"
                            value="1"
                            checked={editAutoRenew === 1}
                            class="rounded border-slate-300 text-emerald-600"
                        />
                        <label class="text-sm text-slate-600">Auto Renew</label>
                    </div>
                    <div class="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            onclick={closeEdit}>Batal</button
                        >
                        <button
                            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            onclick={closeEdit}>Simpan</button
                        >
                    </div>
                </form>
            </div>
        </div>
    {/if}
</div>
