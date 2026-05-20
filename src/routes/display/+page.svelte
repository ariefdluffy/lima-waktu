<script lang="ts">
    import type { PageData } from "./$types";
    let { data } = $props<{ data: PageData & { isSuperadmin: boolean } }>();
</script>

{#if data.isSuperadmin}
    <!-- Superadmin tidak memiliki akses ke halaman ini -->
{:else}
    <div
        class="bg-linear-to-br from-emerald-100 via-green-50 to-white px-4 py-6 sm:px-6 lg:px-8"
    >
        <div class="mx-auto w-full max-w-7xl space-y-6">
            <header class="rounded-2xl bg-white p-6 shadow-sm">
                <h1 class="text-2xl font-bold text-emerald-900">Display TV</h1>
                <p class="mt-2 text-sm text-slate-600">
                    {#if data.masjid}
                        {data.masjid.name} — {data.devices.length} device terdaftar
                    {:else}
                        Belum ada masjid terhubung.
                    {/if}
                </p>
            </header>

            {#if data.masjid}
                <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {#each data.devices as device}
                        <a
                            href="/display/{device.deviceCode}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="block rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md hover:ring-2 hover:ring-emerald-300"
                        >
                            <div class="mb-3 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="text-xl">📺</span>
                                    <h2 class="font-semibold text-slate-800">
                                        {device.name}
                                    </h2>
                                </div>
                                <span
                                    class="rounded-full px-2 py-0.5 text-xs font-medium
									{device.status === 'online'
                                        ? 'bg-green-100 text-green-700'
                                        : device.status === 'offline'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-slate-100 text-slate-500'}"
                                >
                                    {device.status}
                                </span>
                            </div>
                            <p class="text-xs text-slate-500">
                                Kode: {device.deviceCode}
                            </p>
                            <p class="mt-1 text-xs text-slate-400">
                                Orientasi: {device.orientation}
                            </p>
                            <p
                                class="mt-3 text-xs font-medium text-emerald-600"
                            >
                                Buka Display →
                            </p>
                        </a>
                    {/each}
                </section>

                {#if data.devices.length === 0}
                    <section
                        class="rounded-2xl bg-white p-10 text-center shadow-sm"
                    >
                        <p class="text-slate-400">
                            Belum ada device display terdaftar.
                        </p>
                        <p class="mt-2 text-sm text-slate-500">
                            Tambah device melalui halaman Admin.
                        </p>
                        <a
                            href="/admin"
                            class="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >Ke Halaman Admin</a
                        >
                    </section>
                {/if}
            {/if}
        </div>
    </div>
{/if}
