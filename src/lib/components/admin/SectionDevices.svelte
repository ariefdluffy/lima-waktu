<script lang="ts">
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
</script>

<article class="rounded-2xl bg-white p-5 shadow-sm">
    <h2 class="text-lg font-semibold text-emerald-900">Tambah Device</h2>

    <!-- Info limit device -->
    <div
        class="mt-3 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs
        {data.deviceTotal >= data.maxDevices
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-emerald-100 bg-emerald-50 text-emerald-700'}"
    >
        <span class="text-base">{data.deviceTotal >= data.maxDevices ? "⚠️" : "📺"}</span>
        <span>
            Device terdaftar: <strong>{data.deviceTotal}</strong>
            /
            <strong>{data.maxDevices === 99 ? "Unlimited" : data.maxDevices}</strong>
            {#if data.deviceTotal >= data.maxDevices}
                — Batas tercapai. Hapus device yang ada atau upgrade langganan.
            {/if}
        </span>
    </div>

    <form method="POST" action="?/addDevice" class="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="masjid_id" value={data.masjid.id} />
        <input type="hidden" name="device_code" value={generatedDeviceCode} />
        <input
            value={generatedDeviceCode}
            disabled
            class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 font-mono"
        />
        <button
            type="button"
            onclick={() => {
                const url = window.location.origin + "/display/" + generatedDeviceCode;
                navigator.clipboard.writeText(url);
                showToast("✓ Link display disalin!");
            }}
            class="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 transition-colors"
            title="Salin link publik display TV"
        >
            📋 Copy Link
        </button>
        <input
            name="name"
            placeholder="Nama device"
            class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
            disabled={data.deviceTotal >= data.maxDevices}
        />
        <select
            name="orientation"
            class="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
            disabled={data.deviceTotal >= data.maxDevices}
        >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
        </select>
        <div class="sm:col-span-2">
            {#if data.deviceTotal >= data.maxDevices}
                <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-600 font-medium">
                    🔒 Batas maksimal device tercapai. Hapus device yang ada atau upgrade langganan.
                </div>
            {:else}
                <button class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >Tambah Device</button>
            {/if}
        </div>
    </form>

    <div class="mt-4 space-y-3">
        {#each data.devices as item}
            <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <details class="group">
                    <summary class="flex cursor-pointer items-center justify-between gap-2">
                        <div>
                            <p class="text-sm font-semibold text-slate-700">{item.deviceCode} — {item.name}</p>
                            <p class="mt-0.5 text-xs text-slate-400">{item.orientation} · {item.status}</p>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <a
                                href="/display/{item.deviceCode}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                                title="Buka display di tab baru"
                            >
                                📺 Buka
                            </a>
                            <button
                                type="button"
                                onclick={() => {
                                    const url = window.location.origin + "/display/" + item.deviceCode;
                                    navigator.clipboard.writeText(url);
                                    showToast("✓ Link display disalin!");
                                }}
                                class="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                                title="Salin link publik display TV"
                            >
                                📋 Copy
                            </button>
                            <span
                                class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium
                                {item.layoutMode === 'youtube'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700'}"
                            >
                                {item.layoutMode === "youtube" ? "▶ YouTube" : "⊞ Default"}
                            </span>
                        </div>
                    </summary>
                    <div class="mt-3 space-y-2 border-t border-emerald-100 pt-3">
                        <!-- Edit Nama -->
                        <form method="POST" action="?/editDevice" class="flex items-center gap-2">
                            <input type="hidden" name="device_id" value={item.id} />
                            <label for="device_name_{item.id}" class="text-xs text-slate-500">Nama:</label>
                            <input
                                id="device_name_{item.id}"
                                type="text"
                                name="name"
                                value={item.name}
                                class="flex-1 rounded-lg border border-emerald-200 px-2 py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
                            />
                            <button
                                type="submit"
                                class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                >Simpan</button>
                        </form>
                        <!-- Layout -->
                        <form method="POST" action="?/updateDeviceLayout" class="flex items-center gap-2">
                            <input type="hidden" name="device_id" value={item.id} />
                            <label for="layout_mode_{item.id}" class="text-xs text-slate-500">Layout:</label>
                            <select
                                id="layout_mode_{item.id}"
                                name="layout_mode"
                                class="flex-1 rounded-lg border border-emerald-200 px-2 py-1.5 text-xs text-slate-700"
                            >
                                <option value="default" selected={item.layoutMode === "default"}>⊞ Default (jadwal + slide)</option>
                                <option value="youtube" selected={item.layoutMode === "youtube"}>▶ YouTube Streaming (30% info / 70% video)</option>
                            </select>
                            <button
                                type="submit"
                                class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                >Simpan</button>
                        </form>
                        <!-- Hapus -->
                        <button
                            type="button"
                            onclick={() => askDeleteDevice(item.id, item.name)}
                            class="text-xs font-medium text-red-500 hover:text-red-700"
                            >Hapus Device</button>
                    </div>
                </details>
            </div>
        {/each}
        {#if data.devices.length === 0}
            <p class="text-xs italic text-slate-400">Belum ada device terdaftar.</p>
        {/if}
    </div>
    <Pagination
        currentPage={data.devicePage}
        totalPages={data.deviceTotalPages}
        totalItems={data.deviceTotal}
        paramName="pageDV"
    />
</article>
