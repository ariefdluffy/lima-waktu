<script lang="ts">
    let { data } = $props();

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
</script>

<div
    class="bg-linear-to-br from-emerald-100 via-green-50 to-white px-4 py-6 sm:px-6 lg:px-8"
>
    <div class="mx-auto w-full max-w-7xl space-y-6">
        <header class="rounded-2xl bg-white p-6 shadow-sm">
            <p
                class="text-xs font-semibold uppercase tracking-wider text-emerald-700"
            >
                Superadmin
            </p>
            <h1 class="mt-1 text-2xl font-bold text-emerald-900">
                Kontrol Pusat Platform Lima Waktu
            </h1>
            <p class="mt-2 text-sm text-slate-600">
                Kelola tenant masjid, user, dan subscription.
            </p>
        </header>

        <!-- Stats -->
        <section class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-xl bg-white p-4 shadow-sm">
                <p class="text-xs text-slate-500">Total Masjid</p>
                <p class="mt-1 text-2xl font-bold text-emerald-700">
                    {data.masjids.length}
                </p>
            </div>
            <div class="rounded-xl bg-white p-4 shadow-sm">
                <p class="text-xs text-slate-500">Total Users</p>
                <p class="mt-1 text-2xl font-bold text-emerald-700">
                    {data.users.length}
                </p>
            </div>
            <div class="rounded-xl bg-white p-4 shadow-sm">
                <p class="text-xs text-slate-500">Subscriptions</p>
                <p class="mt-1 text-2xl font-bold text-emerald-700">
                    {data.subscriptions.length}
                </p>
            </div>
        </section>

        <!-- Tambah Masjid + Tambah Subscription -->
        <section class="grid gap-6 lg:grid-cols-2">
            <article class="rounded-2xl bg-white p-5 shadow-sm">
                <h2 class="text-lg font-semibold text-emerald-900">
                    Tambah Masjid Baru
                </h2>
                <form
                    method="POST"
                    action="?/createMasjid"
                    class="mt-4 grid gap-3 sm:grid-cols-2"
                >
                    <input
                        name="name"
                        placeholder="Nama masjid"
                        required
                        class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                    <input
                        name="city"
                        placeholder="Kota"
                        class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                    <input
                        name="province"
                        placeholder="Provinsi"
                        class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                    <select
                        name="admin_user_id"
                        class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    >
                        {#each data.users as user}
                            <option value={user.id}
                                >{user.fullName} ({user.email})</option
                            >
                        {/each}
                    </select>
                    <div class="sm:col-span-2">
                        <button
                            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >Buat Masjid</button
                        >
                    </div>
                </form>
            </article>

            <article class="rounded-2xl bg-white p-5 shadow-sm">
                <h2 class="text-lg font-semibold text-emerald-900">
                    Buat Subscription
                </h2>
                <form
                    method="POST"
                    action="?/createSubscription"
                    class="mt-4 grid gap-3 sm:grid-cols-2"
                >
                    <div class="sm:col-span-2">
                        <select
                            name="masjid_id"
                            required
                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        >
                            <option value="">-- Pilih Masjid --</option>
                            {#each data.masjids as m}
                                <option value={m.id}>{m.name}</option>
                            {/each}
                        </select>
                    </div>
                    <input
                        name="package_name"
                        placeholder="Nama paket (mis. Masjid)"
                        required
                        class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                    <select
                        name="billing_cycle"
                        class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    >
                        <option value="monthly">Bulanan</option>
                        <option value="yearly">Tahunan</option>
                    </select>
                    <select
                        name="status"
                        class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="grace">Grace</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <input
                        name="price"
                        type="number"
                        min="0"
                        placeholder="Harga (Rp)"
                        value="0"
                        class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                    <div>
                        <label
                            for="start_date"
                            class="mb-1 block text-xs text-slate-500"
                            >Mulai</label
                        >
                        <input
                            id="start_date"
                            name="start_date"
                            type="date"
                            required
                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label
                            for="end_date"
                            class="mb-1 block text-xs text-slate-500"
                            >Berakhir</label
                        >
                        <input
                            id="end_date"
                            name="end_date"
                            type="date"
                            required
                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <div class="flex items-center gap-2 sm:col-span-2">
                        <input
                            type="checkbox"
                            name="auto_renew"
                            value="1"
                            id="auto_renew"
                            class="rounded"
                        />
                        <label for="auto_renew" class="text-sm text-slate-600"
                            >Auto Renew</label
                        >
                    </div>
                    <div class="sm:col-span-2">
                        <button
                            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >Buat Subscription</button
                        >
                    </div>
                </form>
            </article>
        </section>

        <!-- Tabel Subscription -->
        <section class="rounded-2xl bg-white p-5 shadow-sm">
            <h2 class="mb-4 text-lg font-semibold text-emerald-900">
                Daftar Subscription
            </h2>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr
                            class="border-b border-emerald-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                            <th class="pb-2 pr-4">Masjid</th>
                            <th class="pb-2 pr-4">Paket</th>
                            <th class="pb-2 pr-4">Siklus</th>
                            <th class="pb-2 pr-4">Status</th>
                            <th class="pb-2 pr-4">Mulai</th>
                            <th class="pb-2 pr-4">Berakhir</th>
                            <th class="pb-2 pr-4">Harga</th>
                            <th class="pb-2">Auto</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        {#each data.subscriptions as sub}
                            {@const masjid = data.masjids.find(
                                (m) => m.id === sub.masjidId,
                            )}
                            <tr class="hover:bg-emerald-50/40">
                                <td class="py-2 pr-4 font-medium text-slate-700"
                                    >{masjid?.name ?? sub.masjidId}</td
                                >
                                <td class="py-2 pr-4 text-slate-600"
                                    >{sub.packageName}</td
                                >
                                <td class="py-2 pr-4 text-slate-500"
                                    >{sub.billingCycle === "monthly"
                                        ? "Bulanan"
                                        : "Tahunan"}</td
                                >
                                <td class="py-2 pr-4">
                                    <span
                                        class="rounded-full px-2 py-0.5 text-xs font-semibold {STATUS_COLORS[
                                            sub.status
                                        ] ?? 'bg-slate-100 text-slate-500'}"
                                    >
                                        {sub.status}
                                    </span>
                                </td>
                                <td class="py-2 pr-4 text-slate-500"
                                    >{formatDate(sub.startDate)}</td
                                >
                                <td class="py-2 pr-4 text-slate-500"
                                    >{formatDate(sub.endDate)}</td
                                >
                                <td class="py-2 pr-4 text-slate-600"
                                    >{formatRupiah(sub.price)}</td
                                >
                                <td class="py-2 text-slate-500"
                                    >{sub.autoRenew ? "✓" : "-"}</td
                                >
                            </tr>
                        {/each}
                        {#if data.subscriptions.length === 0}
                            <tr
                                ><td
                                    colspan="8"
                                    class="py-4 text-center text-slate-400"
                                    >Belum ada subscription.</td
                                ></tr
                            >
                        {/if}
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Daftar Masjid + Daftar User -->
        <section class="grid gap-6 lg:grid-cols-2">
            <article class="rounded-2xl bg-white p-5 shadow-sm">
                <h2 class="text-lg font-semibold text-emerald-900">
                    Daftar Masjid
                </h2>
                <div class="mt-4 space-y-2">
                    {#each data.masjids as masjid}
                        <div
                            class="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-slate-700"
                        >
                            <span>{masjid.name}</span>
                            <span class="text-xs text-slate-400"
                                >{masjid.city ?? "-"} • {masjid.timezone}</span
                            >
                        </div>
                    {/each}
                </div>
            </article>

            <article class="rounded-2xl bg-white p-5 shadow-sm">
                <h2 class="text-lg font-semibold text-emerald-900">
                    Daftar User
                </h2>
                <div class="mt-4 space-y-2">
                    {#each data.users as user}
                        <div
                            class="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-slate-700"
                        >
                            <span>{user.fullName}</span>
                            <span class="text-xs text-slate-400"
                                >{user.email}</span
                            >
                        </div>
                    {/each}
                </div>
            </article>
        </section>
    </div>
</div>
