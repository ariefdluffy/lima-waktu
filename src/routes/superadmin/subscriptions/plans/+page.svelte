<script lang="ts">
    import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
    import { showToast } from "$lib/stores/toast";

    let { data, form } = $props();
    let showCreateModal = $state(false);
    let editId = $state<number | null>(null);
    let deleteTarget = $state<number | null>(null);
    let deleteFormEl = $state<HTMLFormElement | null>(null);

    $effect(() => {
        if (form?.deleted) showToast("Paket berhasil dinonaktifkan");
        if (form?.saved) showToast("Paket berhasil disimpan");
    });

    function formatRupiah(v: unknown): string {
        return "Rp " + Number(v ?? 0).toLocaleString("id-ID");
    }
</script>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500">{data.plans.length} paket</p>
        <button
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            onclick={() => (showCreateModal = true)}>+ Tambah Paket</button
        >
    </div>

    <!-- Plan Cards -->
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.plans as plan}
            <div
                class="rounded-xl border {plan.isHighlight
                    ? 'border-emerald-300 ring-2 ring-emerald-200'
                    : 'border-slate-200'} bg-white p-5 shadow-sm"
            >
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="font-semibold text-slate-800">
                            {plan.name}
                        </h3>
                        {#if plan.badge}
                            <span
                                class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                                >{plan.badge}</span
                            >
                        {/if}
                    </div>
                    <span
                        class="text-xs {plan.isActive
                            ? 'text-emerald-600'
                            : 'text-red-500'}"
                        >{plan.isActive ? "Aktif" : "Nonaktif"}</span
                    >
                </div>
                <div class="mt-3 space-y-1 text-sm">
                    <p>
                        <span class="font-semibold text-slate-700"
                            >{formatRupiah(plan.priceMonthly)}</span
                        ><span class="text-xs text-slate-400">/bln</span>
                    </p>
                    <p>
                        <span class="font-semibold text-slate-700"
                            >{formatRupiah(plan.priceYearly)}</span
                        ><span class="text-xs text-slate-400">/thn</span>
                    </p>
                    <p class="text-xs text-slate-500">
                        📺 Maks. Device: <strong
                            >{plan.maxDevices === 99
                                ? "Unlimited"
                                : plan.maxDevices}</strong
                        >
                    </p>
                </div>
                {#if plan.priceNote}
                    <p class="mt-1 text-xs text-slate-400">{plan.priceNote}</p>
                {/if}
                <div class="mt-3 flex items-center gap-2">
                    <button
                        class="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-emerald-100 hover:text-emerald-700"
                        onclick={() => (editId = plan.id)}>Edit</button
                    >
                    <form method="POST" action="?/deletePlan" class="inline">
                        <input type="hidden" name="id" value={plan.id} />
                        <button
                            type="button"
                            class="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                            onclick={(e) => {
                                deleteTarget = plan.id;
                                deleteFormEl = e.currentTarget.closest(
                                    "form",
                                ) as HTMLFormElement;
                            }}>Nonaktifkan</button
                        >
                    </form>
                </div>
            </div>
        {/each}
    </section>
</div>

<!-- Create Modal -->
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
                Tambah Paket Harga
            </h2>
            <form method="POST" action="?/createPlan" class="mt-4 grid gap-3">
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >Nama Paket *</label
                    >
                    <input
                        name="name"
                        required
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Badge (contoh: "Populer")</label
                        >
                        <input
                            name="badge"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Sort Order</label
                        >
                        <input
                            name="sortOrder"
                            type="number"
                            value="0"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Harga Bulanan (Rp)</label
                        >
                        <input
                            name="priceMonthly"
                            type="number"
                            value="0"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Harga Tahunan (Rp)</label
                        >
                        <input
                            name="priceYearly"
                            type="number"
                            value="0"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >Catatan Harga</label
                    >
                    <input
                        name="priceNote"
                        placeholder="mis. Gratis selamanya"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >Fitur (JSON array)</label
                    >
                    <textarea
                        name="featuresJson"
                        rows="3"
                        placeholder={'["Fitur 1", "Fitur 2"]'}
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >[]</textarea
                    >
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500"
                        >Maks. Device <span class="text-slate-400"
                            >(99 = Unlimited)</span
                        ></label
                    >
                    <input
                        name="maxDevices"
                        type="number"
                        min="1"
                        value="1"
                        class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >CTA Label</label
                        >
                        <input
                            name="ctaLabel"
                            value="Mulai Gratis"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >CTA Link</label
                        >
                        <input
                            name="ctaHref"
                            value="/auth/login"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                </div>
                <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isHighlight" value="1" />
                    <span class="text-slate-600"
                        >Tandai sebagai paket unggulan (highlight)</span
                    >
                </label>
                <div class="flex justify-end gap-2">
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

<!-- Edit Modal -->
{#if editId !== null}
    {@const plan = data.plans.find((p: { id: number }) => p.id === editId)}
    {#if plan}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onclick={() => (editId = null)}
        >
            <div
                class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                onclick={(e) => e.stopPropagation()}
            >
                <h2 class="text-lg font-semibold text-emerald-900">
                    Edit Paket: {plan.name}
                </h2>
                <form
                    method="POST"
                    action="?/updatePlan"
                    class="mt-4 grid gap-3"
                >
                    <input type="hidden" name="id" value={plan.id} />
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Nama Paket</label
                        >
                        <input
                            name="name"
                            value={plan.name}
                            required
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="block text-xs font-medium text-slate-500"
                                >Badge</label
                            >
                            <input
                                name="badge"
                                value={plan.badge ?? ""}
                                class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-xs font-medium text-slate-500"
                                >Sort Order</label
                            >
                            <input
                                name="sortOrder"
                                type="number"
                                value={plan.sortOrder}
                                class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                class="block text-xs font-medium text-slate-500"
                                >Harga Bulanan</label
                            >
                            <input
                                name="priceMonthly"
                                type="number"
                                value={plan.priceMonthly}
                                class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                class="block text-xs font-medium text-slate-500"
                                >Harga Tahunan</label
                            >
                            <input
                                name="priceYearly"
                                type="number"
                                value={plan.priceYearly}
                                class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Fitur (JSON)</label
                        >
                        <textarea
                            name="featuresJson"
                            rows="3"
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            >{plan.featuresJson ?? "[]"}</textarea
                        >
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500"
                            >Maks. Device <span class="text-slate-400"
                                >(99 = Unlimited)</span
                            ></label
                        >
                        <input
                            name="maxDevices"
                            type="number"
                            min="1"
                            value={plan.maxDevices ?? 1}
                            class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                    </div>
                    <label class="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="isHighlight"
                            value="1"
                            checked={plan.isHighlight === 1}
                        />
                        <span class="text-slate-600">Highlight</span>
                    </label>
                    <label class="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="isActive"
                            value="1"
                            checked={plan.isActive === 1}
                        />
                        <span class="text-slate-600">Aktif</span>
                    </label>
                    <div class="flex justify-end gap-2">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            onclick={() => (editId = null)}>Batal</button
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
{/if}

<ConfirmDialog
    open={deleteTarget !== null}
    title="Nonaktifkan Paket"
    message="Nonaktifkan paket harga ini?"
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
