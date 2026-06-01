<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";
    import Pagination from "$lib/components/Pagination.svelte";

    let {
        data,
        generatedDeviceCode,
        showToast,
        askDeleteDevice,
    }: {
        data: any;
        generatedDeviceCode: string;
        showToast: (msg: string) => void;
        askDeleteDevice: (id: string, name: string) => void;
    } = $props();

    function copyLink(deviceCode: string) {
        const url = window.location.origin + "/display/" + deviceCode;
        navigator.clipboard.writeText(url);
        showToast("✓ Link display disalin!");
    }
</script>

<section class="space-y-5">
    <!-- Form Tambah -->
    <div class="rounded-2xl bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
            <div>
                <h2 class="text-lg font-semibold text-emerald-900">📺 Perangkat Display</h2>
                <p class="mt-0.5 text-xs text-slate-500">Daftarkan TV atau layar untuk menampilkan jadwal masjid.</p>
            </div>
            <span class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {data.deviceTotal}/{data.maxDevices === 99 ? "∞" : data.maxDevices}
            </span>
        </div>

        <!-- Info limit -->
        <div class="mt-3 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs
            {data.deviceTotal >= data.maxDevices
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-emerald-100 bg-emerald-50 text-emerald-700'}">
            <span class="text-base">{data.deviceTotal >= data.maxDevices ? "⚠️" : "📺"}</span>
            <span>
                Device terdaftar: <strong>{data.deviceTotal}</strong> / <strong>{data.maxDevices === 99 ? "Unlimited" : data.maxDevices}</strong>
                {#if data.deviceTotal >= data.maxDevices}
                    — Batas tercapai. Hapus device yang ada atau upgrade langganan.
                {/if}
            </span>
        </div>

        <!-- Form -->
        <form
            method="POST"
            action="?/addDevice"
            use:enhance={() => async ({ result }) => {
                if (result.type === "success" || result.type === "redirect") await invalidate("app:admin");
            }}
            class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
        >
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tambah Device Baru</p>
            <input type="hidden" name="masjid_id" value={data.masjid.id} />
            <input type="hidden" name="device_code" value={generatedDeviceCode} />

            <div class="flex flex-col gap-3">
                <!-- Kode device (readonly info) -->
                <div>
                    <label class="mb-1 block text-xs font-medium text-slate-600">Kode Device (otomatis)</label>
                    <input
                        value={generatedDeviceCode}
                        disabled
                        class="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-sm text-emerald-700"
                    />
                </div>

                <div class="flex flex-col gap-3 sm:flex-row">
                    <div class="flex-1">
                        <label for="device-name" class="mb-1 block text-xs font-medium text-slate-600">Nama Device</label>
                        <input
                            id="device-name"
                            name="name"
                            type="text"
                            placeholder="cth: TV Utama, Layar Selasar"
                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            disabled={data.deviceTotal >= data.maxDevices}
                        />
                    </div>
                    <div class="sm:w-44">
                        <label for="device-orientation" class="mb-1 block text-xs font-medium text-slate-600">Orientasi</label>
                        <select
                            id="device-orientation"
                            name="orientation"
                            class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                            disabled={data.deviceTotal >= data.maxDevices}
                        >
                            <option value="horizontal">Horizontal</option>
                            <option value="vertical">Vertical</option>
                        </select>
                    </div>
                </div>

                {#if data.deviceTotal >= data.maxDevices}
                    <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-600">
                        🔒 Batas maksimal device tercapai. Hapus device yang ada atau upgrade langganan.
                    </div>
                {:else}
                    <button
                        type="submit"
                        class="self-start rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
                    >
                        + Tambah Device
                    </button>
                {/if}
            </div>
        </form>
    </div>

    <!-- List Device -->
    <div class="rounded-2xl bg-white p-5 shadow-sm">
        {#if data.devices.length === 0}
            <div class="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg class="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <p class="text-sm text-slate-400">Belum ada device terdaftar.</p>
                <p class="text-xs text-slate-300">Tambahkan device di atas untuk memulai.</p>
            </div>
        {:else}
            <div class="space-y-2">
                {#each data.devices as item}
                    <div class="rounded-xl border border-emerald-100 bg-white hover:border-emerald-200 hover:shadow-sm transition-all">
                        <details class="group">
                            <!-- Summary -->
                            <summary class="flex cursor-pointer items-start gap-3 px-4 py-3 sm:items-center">
                                <!-- Icon -->
                                <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 sm:mt-0">
                                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </span>

                                <!-- Info -->
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-semibold text-slate-700">{item.name}</p>
                                    <p class="mt-0.5 text-xs text-slate-400">
                                        <span class="font-mono">{item.deviceCode}</span>
                                        · {item.orientation}
                                        · {item.status}
                                    </p>
                                </div>

                                <!-- Aksi cepat -->
                                <div class="flex shrink-0 items-center gap-1.5">
                                    <span class="hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline
                                        {item.layoutMode === 'youtube'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-emerald-100 text-emerald-700'}">
                                        {item.layoutMode === "youtube" ? "▶ YouTube" : "⊞ Default"}
                                    </span>
                                    <a
                                        href="/display/{item.deviceCode}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onclick={(e) => e.stopPropagation()}
                                        class="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                                        title="Buka display di tab baru"
                                    >📺 Buka</a>
                                    <button
                                        type="button"
                                        onclick={(e) => { e.stopPropagation(); copyLink(item.deviceCode); }}
                                        class="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                                        title="Salin link display"
                                    >📋 Salin</button>
                                </div>
                            </summary>

                            <!-- Detail edit -->
                            <div class="border-t border-emerald-50 px-4 pb-4 pt-3 space-y-3">
                                <!-- Badge layout di mobile -->
                                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium sm:hidden
                                    {item.layoutMode === 'youtube'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-emerald-100 text-emerald-700'}">
                                    {item.layoutMode === "youtube" ? "▶ YouTube" : "⊞ Default"}
                                </span>

                                <!-- Edit Nama & Orientasi -->
                                <form
                                    method="POST"
                                    action="?/editDevice"
                                    use:enhance={() => async ({ result }) => {
                                        if (result.type === "success" || result.type === "redirect") await invalidate("app:admin");
                                    }}
                                    class="flex flex-col gap-3 rounded-xl border border-emerald-50 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:gap-2"
                                >
                                    <input type="hidden" name="device_id" value={item.id} />
                                    
                                    <div class="flex flex-col gap-1 sm:flex-1">
                                        <label for="device_name_{item.id}" class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nama Device</label>
                                        <input
                                            id="device_name_{item.id}"
                                            type="text"
                                            name="name"
                                            value={item.name}
                                            class="w-full rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none"
                                        />
                                    </div>

                                    <div class="flex flex-col gap-1 sm:w-36">
                                        <label for="device_orient_{item.id}" class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Orientasi</label>
                                        <select
                                            id="device_orient_{item.id}"
                                            name="orientation"
                                            class="w-full rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm focus:border-emerald-400 focus:outline-none"
                                        >
                                            <option value="horizontal" selected={item.orientation === "horizontal"}>Horizontal</option>
                                            <option value="vertical" selected={item.orientation === "vertical"}>Vertical</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        class="mt-2 self-start rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors sm:mt-4 sm:self-auto"
                                    >Simpan Perubahan</button>
                                </form>

                                <!-- Layout Mode -->
                                <form
                                    method="POST"
                                    action="?/updateDeviceLayout"
                                    use:enhance={() => async ({ result }) => {
                                        if (result.type === "success" || result.type === "redirect") await invalidate("app:admin");
                                    }}
                                    class="flex flex-col gap-2 sm:flex-row sm:items-center"
                                >
                                    <input type="hidden" name="device_id" value={item.id} />
                                    <label for="layout_mode_{item.id}" class="shrink-0 text-xs text-slate-500 sm:w-16">Layout:</label>
                                    <select
                                        id="layout_mode_{item.id}"
                                        name="layout_mode"
                                        class="flex-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
                                    >
                                        <option value="default" selected={item.layoutMode === "default"}>⊞ Default (jadwal + slide)</option>
                                        <option value="youtube" selected={item.layoutMode === "youtube"}>▶ YouTube Streaming</option>
                                    </select>
                                    <button
                                        type="submit"
                                        class="self-start rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors sm:self-auto"
                                    >Simpan</button>
                                </form>

                                <!-- Aksi Lain -->
                                <div class="flex items-center gap-3 border-t border-slate-100 pt-3">
                                    <button
                                        type="button"
                                        onclick={async () => {
                                            try {
                                                const res = await fetch("/api/v1/masjid/devices/reload", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ deviceId: item.id })
                                                });
                                                const json = await res.json();
                                                if (json.ok) {
                                                    showToast("🔄 Perintah reload dikirim ke TV!");
                                                } else {
                                                    showToast("Gagal: " + (json.message || "Unknown error"));
                                                }
                                            } catch (e) {
                                                showToast("Gagal menghubungi server");
                                            }
                                        }}
                                        class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                                        title="TV akan dimuat ulang pada siklus update berikutnya (maks 15 detik)"
                                    >🔄 Reload TV</button>

                                    <button
                                        type="button"
                                        onclick={() => askDeleteDevice(item.id, item.name)}
                                        class="rounded-lg border border-red-200 px-4 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                                    >Hapus Device</button>
                                </div>
                            </div>
                        </details>
                    </div>
                {/each}
            </div>
        {/if}

        <Pagination
            currentPage={data.devicePage}
            totalPages={data.deviceTotalPages}
            totalItems={data.deviceTotal}
            paramName="pageDV"
        />
    </div>
</section>
