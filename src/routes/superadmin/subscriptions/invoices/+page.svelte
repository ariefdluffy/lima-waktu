<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();

    $effect(() => {
        if (form?.saved) showToast("Invoice berhasil diupdate");
    });

    let showGenerateInvoice = $state(false);

    const STATUS_COLORS: Record<string, string> = {
        draft: "bg-slate-100 text-slate-600",
        pending: "bg-yellow-100 text-yellow-700",
        paid: "bg-emerald-100 text-emerald-700",
        failed: "bg-red-100 text-red-700",
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

    function goFilter(e: Event) {
        const form = e.currentTarget as HTMLFormElement;
        const fd = new FormData(form);
        const status = fd.get("status") ?? "all";
        const masjid_id = fd.get("masjid_id") ?? "";
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", String(status));
        if (masjid_id) params.set("masjid_id", String(masjid_id));
        const qs = params.toString();
        goto(`/superadmin/subscriptions/invoices${qs ? `?${qs}` : ""}`);
    }

    function goPage(p: number) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set("page", String(p));
        goto(`/superadmin/subscriptions/invoices?${params}`);
    }
</script>

<div class="space-y-6">
    <!-- Filter Bar -->
    <form
        class="flex flex-wrap items-center gap-3"
        onsubmit={(e) => {
            e.preventDefault();
            goFilter(e);
        }}
    >
        <select
            name="status"
            value={data.statusFilter}
            class="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
        </select>
        <select
            name="masjid_id"
            value={data.masjidIdFilter}
            class="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
            <option value="">Semua Masjid</option>
            {#each data.masjids as m}
                <option value={m.id}>{m.name}</option>
            {/each}
        </select>
        <button
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >Filter</button
        >
    </form>

    <!-- Generate Invoice Button -->
    <div class="flex justify-end">
        <button
            onclick={() => (showGenerateInvoice = true)}
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
            + Generate Invoice
        </button>
    </div>

    <div
        class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
    >
        <table class="w-full text-sm">
            <thead>
                <tr
                    class="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                    <th class="px-4 py-3">Invoice</th>
                    <th class="px-4 py-3">Masjid</th>
                    <th class="px-4 py-3">Paket</th>
                    <th class="px-4 py-3">Amount</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Jatuh Tempo</th>
                    <th class="px-4 py-3">Dibayar</th>
                    <th class="px-4 py-3">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                {#each data.invoices as inv}
                    <tr class="hover:bg-emerald-50/40">
                        <td
                            class="px-4 py-3 font-mono text-xs font-medium text-slate-700"
                            >{inv.invoiceNo}</td
                        >
                        <td class="px-4 py-3 text-slate-600"
                            >{inv.masjidName}</td
                        >
                        <td class="px-4 py-3 text-slate-600"
                            >{inv.packageName}</td
                        >
                        <td class="px-4 py-3 font-medium text-slate-700"
                            >{formatRupiah(inv.amount)}</td
                        >
                        <td class="px-4 py-3">
                            <span
                                class="rounded-full px-2 py-0.5 text-xs font-semibold {STATUS_COLORS[
                                    inv.status
                                ] ?? ''}"
                            >
                                {inv.status}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-500"
                            >{formatDate(inv.dueDate)}</td
                        >
                        <td class="px-4 py-3 text-xs text-slate-500"
                            >{formatDate(inv.paidAt)}</td
                        >
                        <td class="px-4 py-3">
                            <form
                                method="POST"
                                action="?/updateStatus"
                                class="flex items-center gap-1"
                            >
                                <input type="hidden" name="id" value={inv.id} />
                                <select
                                    name="status"
                                    class="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                                >
                                    <option
                                        value="pending"
                                        selected={inv.status === "pending"}
                                        >Pending</option
                                    >
                                    <option
                                        value="paid"
                                        selected={inv.status === "paid"}
                                        >Paid</option
                                    >
                                    <option
                                        value="failed"
                                        selected={inv.status === "failed"}
                                        >Failed</option
                                    >
                                    <option
                                        value="cancelled"
                                        selected={inv.status === "cancelled"}
                                        >Cancelled</option
                                    >
                                </select>
                                <button
                                    class="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                                    >Update</button
                                >
                            </form>
                        </td>
                    </tr>
                {/each}
                {#if data.invoices.length === 0}
                    <tr
                        ><td
                            colspan="8"
                            class="px-4 py-8 text-center text-sm text-slate-400"
                            >Belum ada invoice.</td
                        ></tr
                    >
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
</div>

<!-- Modal Generate Invoice -->
{#if showGenerateInvoice}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onclick={() => (showGenerateInvoice = false)}
        onkeydown={() => {}}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
        <div
            class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onclick={(e) => e.stopPropagation()}
            role="presentation"
        >
            <h3 class="text-base font-semibold text-slate-800">
                Generate Invoice
            </h3>
            {#if form?.error}
                <p class="mt-2 text-sm font-medium text-red-600">
                    {form.error}
                </p>
            {/if}
            <form
                method="POST"
                action="?/generateInvoice"
                class="mt-4 space-y-4"
            >
                <div>
                    <label
                        for="subscriptionId"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Subskripsi
                    </label>
                    <select
                        name="subscriptionId"
                        id="subscriptionId"
                        required
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                        <option value="">— Pilih Subskripsi —</option>
                        {#each data.subscriptions as s}
                            <option value={s.id}>
                                {s.masjidName} — {s.packageName}
                            </option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label
                        for="amount"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Amount
                    </label>
                    <input
                        type="number"
                        name="amount"
                        id="amount"
                        required
                        step="0.01"
                        min="0"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label
                        for="dueDate"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Tanggal Jatuh Tempo
                    </label>
                    <input
                        type="date"
                        name="dueDate"
                        id="dueDate"
                        required
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label
                        for="paymentMethod"
                        class="mb-1 block text-xs font-medium text-slate-600"
                    >
                        Metode Pembayaran
                        <span class="text-slate-400">(opsional)</span>
                    </label>
                    <input
                        type="text"
                        name="paymentMethod"
                        id="paymentMethod"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div class="flex justify-end gap-2">
                    <button
                        type="button"
                        onclick={() => (showGenerateInvoice = false)}
                        class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button
                        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        Generate
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
