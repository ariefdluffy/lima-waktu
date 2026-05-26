<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";

    let { data }: { data: any } = $props();

    function refresh() {
        return async ({ result }: { result: any }) => {
            if (result.type === "success" || result.type === "redirect") {
                await invalidate("app:admin");
            }
        };
    }
</script>

<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Tema &amp; Template</h2>
            <p class="mt-0.5 text-xs text-slate-500">Pilih template tampilan untuk setiap device display</p>
        </div>
    </div>
    <div class="mt-5 space-y-4">
        {#each data.devices as device}
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <p class="font-semibold text-slate-700">{device.name}</p>
                        <p class="text-xs text-slate-400">
                            Kode: {device.deviceCode} &middot; Orientasi: {device.orientation}
                        </p>
                    </div>
                    <a
                        href="/display/{device.deviceCode}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-xs font-medium text-emerald-600 hover:underline"
                        >Preview &rarr;</a>
                </div>
                <form
                    method="POST"
                    action="?/updateDeviceTheme"
                    use:enhance={refresh}
                    class="flex flex-wrap items-end gap-3"
                >
                    <input type="hidden" name="device_id" value={device.id} />
                    <div class="flex-1 min-w-40">
                        <label class="mb-1 block text-xs font-medium text-slate-600">Pilih Tema</label>
                        <select
                            name="theme_id"
                            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                        >
                            <option value="">-- Default (Modern Minimalis) --</option>
                            {#each data.themes as theme}
                                <option value={theme.id} selected={device.themeId === theme.id}
                                    >{theme.name}</option>
                            {/each}
                        </select>
                    </div>
                    <button
                        type="submit"
                        class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
                    >
                        Simpan
                    </button>
                </form>
            </div>
        {/each}
        {#if data.devices.length === 0}
            <p class="text-center text-sm text-slate-400 py-8">
                Belum ada device terdaftar. Tambah device terlebih dahulu.
            </p>
        {/if}
    </div>
</section>
