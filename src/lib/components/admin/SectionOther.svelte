<script lang="ts">
    let {
        hijriOffset = $bindable(),
        hijriOffsetSaving,
        hijriOffsetSuccess,
        hijriOffsetError,
        saveHijriOffset,
        weatherLat = $bindable(),
        weatherLon = $bindable(),
        weatherLocSaving,
        weatherLocSuccess,
        weatherLocError,
        weatherGeoLoading,
        weatherGeoSuccess,
        weatherGeoError,
        saveWeatherLocation,
        autoResolveFromCity,
        screensaverDelay = $bindable(),
        screensaverWake = $bindable(),
        morningDelay = $bindable(),
        morningWake = $bindable(),
        screensaverSaving,
        screensaverSuccess,
        saveScreensaver,
    }: {
        hijriOffset: number;
        hijriOffsetSaving: boolean;
        hijriOffsetSuccess: string;
        hijriOffsetError: string;
        saveHijriOffset: () => void;
        weatherLat: string;
        weatherLon: string;
        weatherLocSaving: boolean;
        weatherLocSuccess: string;
        weatherLocError: string;
        weatherGeoLoading: boolean;
        weatherGeoSuccess: string;
        weatherGeoError: string;
        saveWeatherLocation: () => void;
        autoResolveFromCity: () => void;
        screensaverDelay: number;
        screensaverWake: number;
        morningDelay: number;
        morningWake: number;
        screensaverSaving: boolean;
        screensaverSuccess: boolean;
        saveScreensaver: () => void;
    } = $props();
</script>

<!-- PENGATURAN LAIN: HIJRI + CUACA -->
<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Pengaturan Lain</h2>
            <p class="mt-0.5 text-xs text-slate-500">Kalender Hijriyah &amp; Cuaca Lokal.</p>
        </div>
    </div>
    <div class="mt-5 grid gap-6 lg:grid-cols-2">
        <!-- HIJRI OFFSET -->
        <div class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
            <h3 class="text-sm font-semibold text-emerald-800">Kalender Hijriyah</h3>
            <p class="mt-1 text-xs text-slate-500">Sesuaikan selisih tanggal hijriyah.</p>
            <div class="mt-4 flex flex-wrap items-end gap-3">
                <div class="w-32">
                    <label for="hijri-offset" class="mb-1 block text-xs font-medium text-slate-600">Offset Hari</label>
                    <input
                        id="hijri-offset"
                        type="number"
                        min="-5"
                        max="5"
                        bind:value={hijriOffset}
                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                </div>
                <button
                    onclick={saveHijriOffset}
                    disabled={hijriOffsetSaving}
                    class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                    {#if hijriOffsetSaving}...{:else}Simpan{/if}
                </button>
                {#if hijriOffsetSuccess}
                    <p class="text-sm font-medium text-emerald-600">{hijriOffsetSuccess}</p>
                {/if}
                {#if hijriOffsetError}
                    <p class="text-sm text-red-500">{hijriOffsetError}</p>
                {/if}
            </div>
            <p class="mt-2 text-xs text-slate-400">
                {hijriOffset > 0 ? "+ " : ""}{hijriOffset ? `${hijriOffset} hari lebih lambat` : "0 (standar)"}
            </p>
        </div>

        <!-- CUACA -->
        <div class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
            <h3 class="text-sm font-semibold text-emerald-800">Cuaca Lokal</h3>
            <p class="mt-1 text-xs text-slate-500">
                Klik "Cari dari Kota" untuk auto-detect dari kota masjid, atau isi manual.
            </p>
            <div class="mt-4 flex flex-wrap items-end gap-3">
                <div class="w-32">
                    <label for="weather-lat" class="mb-1 block text-xs font-medium text-slate-600">Latitude</label>
                    <input
                        id="weather-lat"
                        type="text"
                        placeholder="-6.2146"
                        bind:value={weatherLat}
                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                </div>
                <div class="w-32">
                    <label for="weather-lon" class="mb-1 block text-xs font-medium text-slate-600">Longitude</label>
                    <input
                        id="weather-lon"
                        type="text"
                        placeholder="106.8451"
                        bind:value={weatherLon}
                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                </div>
                <button
                    onclick={saveWeatherLocation}
                    disabled={weatherLocSaving}
                    class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                    {#if weatherLocSaving}...{:else}Simpan{/if}
                </button>
                {#if weatherLocSuccess}
                    <p class="text-sm font-medium text-emerald-600">{weatherLocSuccess}</p>
                {/if}
                {#if weatherLocError}
                    <p class="text-sm text-red-500">{weatherLocError}</p>
                {/if}
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-2">
                <button
                    onclick={autoResolveFromCity}
                    disabled={weatherGeoLoading}
                    class="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                    {#if weatherGeoLoading}...{:else}🗺️ Cari dari Kota{/if}
                </button>
                {#if weatherGeoSuccess}
                    <p class="text-sm font-medium text-emerald-600">{weatherGeoSuccess}</p>
                {/if}
                {#if weatherGeoError}
                    <p class="text-sm text-red-500">{weatherGeoError}</p>
                {/if}
            </div>
        </div>
    </div>
</section>

<!-- MODE HEMAT ENERGI -->
<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Mode Hemat Energi</h2>
            <p class="mt-0.5 text-xs text-slate-500">
                Layar akan masuk mode hemat setelah Isya dan aktif kembali sebelum Subuh.
                Juga bisa aktif di pagi hari setelah Syuruq.
            </p>
        </div>
    </div>
    <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
            <h3 class="text-sm font-semibold text-emerald-800">Aktif Setelah Isya</h3>
            <p class="mt-1 text-xs text-slate-500">Berapa menit setelah Isya layar masuk mode hemat.</p>
            <div class="mt-4">
                <label for="screensaver-delay" class="mb-1 block text-xs font-medium text-slate-600">Menit setelah Isya</label>
                <input
                    id="screensaver-delay"
                    type="number"
                    min="0"
                    max="300"
                    bind:value={screensaverDelay}
                    class="w-32 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                />
            </div>
        </div>
        <div class="rounded-xl border border-emerald-100 bg-emerald-50/40 p-5">
            <h3 class="text-sm font-semibold text-emerald-800">Bangun Sebelum Subuh</h3>
            <p class="mt-1 text-xs text-slate-500">Berapa menit sebelum Subuh layar aktif kembali.</p>
            <div class="mt-4">
                <label for="screensaver-wake" class="mb-1 block text-xs font-medium text-slate-600">Menit sebelum Subuh</label>
                <input
                    id="screensaver-wake"
                    type="number"
                    min="0"
                    max="120"
                    bind:value={screensaverWake}
                    class="w-32 rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                />
            </div>
        </div>
    </div>
    <h3 class="mt-6 text-sm font-semibold text-emerald-800">🌅 Mode Hemat Pagi</h3>
    <p class="mt-0.5 text-xs text-slate-500">
        Layar masuk mode hemat setelah Syuruq dan aktif kembali sebelum Dzuhur.
    </p>
    <div class="mt-3 grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-amber-100 bg-amber-50/40 p-5">
            <h3 class="text-sm font-semibold text-amber-800">Aktif Setelah Syuruq</h3>
            <p class="mt-1 text-xs text-slate-500">Berapa menit setelah Syuruq layar masuk mode hemat.</p>
            <div class="mt-4">
                <label for="morning-delay" class="mb-1 block text-xs font-medium text-slate-600">Menit setelah Syuruq</label>
                <input
                    id="morning-delay"
                    type="number"
                    min="0"
                    max="300"
                    bind:value={morningDelay}
                    class="w-32 rounded-xl border border-amber-200 px-3 py-2 text-sm"
                />
            </div>
        </div>
        <div class="rounded-xl border border-amber-100 bg-amber-50/40 p-5">
            <h3 class="text-sm font-semibold text-amber-800">Bangun Sebelum Dzuhur</h3>
            <p class="mt-1 text-xs text-slate-500">Berapa menit sebelum Dzuhur layar aktif kembali.</p>
            <div class="mt-4">
                <label for="morning-wake" class="mb-1 block text-xs font-medium text-slate-600">Menit sebelum Dzuhur</label>
                <input
                    id="morning-wake"
                    type="number"
                    min="0"
                    max="300"
                    bind:value={morningWake}
                    class="w-32 rounded-xl border border-amber-200 px-3 py-2 text-sm"
                />
            </div>
        </div>
    </div>
    <div class="mt-4 flex items-center gap-3">
        <button
            onclick={saveScreensaver}
            disabled={screensaverSaving}
            class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
            {#if screensaverSaving}...{:else}Simpan{/if}
        </button>
        {#if screensaverSuccess}
            <p class="text-sm font-medium text-emerald-600">✓ Disimpan</p>
        {/if}
    </div>
    <p class="mt-3 text-xs text-slate-400">
        Hemat malam: aktif {screensaverDelay} menit setelah Isya, bangun {screensaverWake} menit sebelum Subuh.
        Hemat pagi: aktif {morningDelay} menit setelah Syuruq, bangun {morningWake} menit sebelum Dzuhur.
    </p>
</section>
