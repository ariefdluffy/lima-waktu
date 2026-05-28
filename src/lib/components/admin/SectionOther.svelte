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

<div class="space-y-5">

    <!-- ── Header ── -->
    <div class="flex items-center gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
        </span>
        <div>
            <h2 class="text-lg font-semibold text-slate-800">Pengaturan Lain</h2>
            <p class="text-xs text-slate-500">Kalender Hijriyah, Cuaca Lokal, dan Mode Hemat Energi.</p>
        </div>
    </div>

    <!-- ══════════════════════════════════════════
         BAGIAN 1 — KALENDER & CUACA
    ══════════════════════════════════════════ -->
    <div class="grid gap-4 lg:grid-cols-2">

        <!-- Kalender Hijriyah -->
        <div class="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </span>
                <div>
                    <p class="text-sm font-semibold text-slate-700">Kalender Hijriyah</p>
                    <p class="text-[11px] text-slate-400">Sesuaikan selisih tanggal hijriyah</p>
                </div>
            </div>

            <div class="rounded-xl border border-emerald-50 bg-emerald-50/50 px-4 py-3 mb-4">
                <p class="text-[11px] font-medium text-emerald-700 uppercase tracking-wide mb-2">Offset Hari</p>
                <div class="flex items-center gap-3">
                    <input
                        id="hijri-offset"
                        type="number"
                        min="-5"
                        max="5"
                        bind:value={hijriOffset}
                        class="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-bold text-emerald-700 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                    <span class="text-xs text-slate-400">hari</span>
                    <span class="ml-auto rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {hijriOffset > 0 ? `+${hijriOffset}` : hijriOffset === 0 ? "Standar" : `${hijriOffset}`}
                    </span>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button
                    onclick={saveHijriOffset}
                    disabled={hijriOffsetSaving}
                    class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                >
                    {#if hijriOffsetSaving}
                        <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Menyimpan...
                    {:else}
                        Simpan
                    {/if}
                </button>
                {#if hijriOffsetSuccess}
                    <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {hijriOffsetSuccess}
                    </span>
                {/if}
                {#if hijriOffsetError}
                    <span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {hijriOffsetError}
                    </span>
                {/if}
            </div>
        </div>

        <!-- Cuaca Lokal -->
        <div class="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-3 mb-4">
                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                </span>
                <div>
                    <p class="text-sm font-semibold text-slate-700">Cuaca Lokal</p>
                    <p class="text-[11px] text-slate-400">Koordinat untuk data cuaca di layar</p>
                </div>
            </div>

            <!-- Auto-detect dari kota -->
            <div class="mb-3">
                <button
                    onclick={autoResolveFromCity}
                    disabled={weatherGeoLoading}
                    class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 active:scale-95 disabled:opacity-60"
                >
                    {#if weatherGeoLoading}
                        <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Mencari koordinat...
                    {:else}
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Cari Otomatis dari Kota
                    {/if}
                </button>
                {#if weatherGeoSuccess}
                    <p class="mt-1.5 text-center text-xs font-medium text-emerald-600">{weatherGeoSuccess}</p>
                {/if}
                {#if weatherGeoError}
                    <p class="mt-1.5 text-center text-xs text-red-500">{weatherGeoError}</p>
                {/if}
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-2 mb-3">
                <div class="h-px flex-1 bg-slate-100"></div>
                <span class="text-[11px] text-slate-400">atau isi manual</span>
                <div class="h-px flex-1 bg-slate-100"></div>
            </div>

            <!-- Input manual -->
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label for="weather-lat" class="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wide">Latitude</label>
                    <input
                        id="weather-lat"
                        type="text"
                        placeholder="-6.2146"
                        bind:value={weatherLat}
                        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-700 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                </div>
                <div>
                    <label for="weather-lon" class="mb-1 block text-[11px] font-medium text-slate-500 uppercase tracking-wide">Longitude</label>
                    <input
                        id="weather-lon"
                        type="text"
                        placeholder="106.8451"
                        bind:value={weatherLon}
                        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-700 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                    />
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button
                    onclick={saveWeatherLocation}
                    disabled={weatherLocSaving}
                    class="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-95 disabled:opacity-60"
                >
                    {#if weatherLocSaving}
                        <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Menyimpan...
                    {:else}
                        Simpan Koordinat
                    {/if}
                </button>
                {#if weatherLocSuccess}
                    <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {weatherLocSuccess}
                    </span>
                {/if}
                {#if weatherLocError}
                    <span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {weatherLocError}
                    </span>
                {/if}
            </div>
        </div>
    </div>

    <!-- ══════════════════════════════════════════
         BAGIAN 2 — MODE HEMAT ENERGI
    ══════════════════════════════════════════ -->

    <!-- Divider -->
    <div class="flex items-center gap-3">
        <div class="h-px flex-1 bg-slate-100"></div>
        <span class="text-xs font-medium text-slate-400">Mode Hemat Energi</span>
        <div class="h-px flex-1 bg-slate-100"></div>
    </div>

    <!-- Info banner -->
    <div class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </span>
        <p class="text-xs text-slate-500 leading-relaxed">
            Layar TV akan otomatis masuk mode hemat setelah waktu yang ditentukan, lalu aktif kembali sebelum waktu sholat berikutnya.
            Berguna untuk menghemat listrik di malam hari dan pagi hari.
        </p>
    </div>

    <!-- Grid 4 card -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        <!-- Aktif setelah Isya -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                </span>
                <div>
                    <p class="text-xs font-bold text-slate-700">Hemat Malam</p>
                    <p class="text-[10px] text-slate-400">Aktif setelah Isya</p>
                </div>
            </div>
            <p class="mb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Menit setelah Isya</p>
            <div class="flex items-center gap-2">
                <input
                    id="screensaver-delay"
                    type="number"
                    min="0"
                    max="300"
                    bind:value={screensaverDelay}
                    class="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-bold text-slate-700 shadow-inner focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <span class="text-xs text-slate-400">menit</span>
            </div>
            {#if screensaverDelay > 300}
                <p class="mt-1 text-[11px] font-medium text-red-500">Maksimal 300 menit</p>
            {/if}
        </div>

        <!-- Bangun sebelum Subuh -->
        <div class="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                    </svg>
                </span>
                <div>
                    <p class="text-xs font-bold text-slate-700">Bangun Malam</p>
                    <p class="text-[10px] text-slate-400">Aktif sebelum Subuh</p>
                </div>
            </div>
            <p class="mb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Menit sebelum Subuh</p>
            <div class="flex items-center gap-2">
                <input
                    id="screensaver-wake"
                    type="number"
                    min="0"
                    max="160"
                    bind:value={screensaverWake}
                    class="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-bold text-indigo-700 shadow-inner focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <span class="text-xs text-slate-400">menit</span>
            </div>
            {#if screensaverWake > 160}
                <p class="mt-1 text-[11px] font-medium text-red-500">Maksimal 160 menit</p>
            {/if}
        </div>

        <!-- Aktif setelah Syuruq -->
        <div class="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                    </svg>
                </span>
                <div>
                    <p class="text-xs font-bold text-slate-700">Hemat Pagi</p>
                    <p class="text-[10px] text-slate-400">Aktif setelah Syuruq</p>
                </div>
            </div>
            <p class="mb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Menit setelah Syuruq</p>
            <div class="flex items-center gap-2">
                <input
                    id="morning-delay"
                    type="number"
                    min="0"
                    max="160"
                    bind:value={morningDelay}
                    class="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-bold text-amber-700 shadow-inner focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
                <span class="text-xs text-slate-400">menit</span>
            </div>
            {#if morningDelay > 160}
                <p class="mt-1 text-[11px] font-medium text-red-500">Maksimal 160 menit</p>
            {/if}
        </div>

        <!-- Bangun sebelum Dzuhur -->
        <div class="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                    </svg>
                </span>
                <div>
                    <p class="text-xs font-bold text-slate-700">Bangun Pagi</p>
                    <p class="text-[10px] text-slate-400">Aktif sebelum Dzuhur</p>
                </div>
            </div>
            <p class="mb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Menit sebelum Dzuhur</p>
            <div class="flex items-center gap-2">
                <input
                    id="morning-wake"
                    type="number"
                    min="0"
                    max="160"
                    bind:value={morningWake}
                    class="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-bold text-orange-700 shadow-inner focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
                <span class="text-xs text-slate-400">menit</span>
            </div>
            {#if morningWake > 160}
                <p class="mt-1 text-[11px] font-medium text-red-500">Maksimal 160 menit</p>
            {/if}
        </div>
    </div>

    <!-- Caption penjelasan -->
    <div class="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
        <span class="mt-0.5 text-amber-500">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </span>
        <p class="text-xs text-amber-700 leading-relaxed">
            <span class="font-semibold">Isi 0 untuk menonaktifkan.</span> Hemat Pagi = 0 berarti layar tidak masuk mode hemat setelah Syuruq.
            Bangun Pagi = 0 berarti layar tidak bangun sebelum Dzuhur (tetap hemat sampai Dzuhur).
        </p>
    </div>

    <!-- Ringkasan jadwal hemat -->
    <div class="grid gap-2 sm:grid-cols-2">
        <div class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
            <span class="text-base">🌙</span>
            <p class="text-xs text-slate-500">
                Hemat malam: aktif <span class="font-semibold text-slate-700">{screensaverDelay} mnt</span> setelah Isya,
                bangun <span class="font-semibold text-slate-700">{screensaverWake} mnt</span> sebelum Subuh
            </p>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-2.5">
            <span class="text-base">🌅</span>
            <p class="text-xs text-slate-500">
                Hemat pagi: aktif <span class="font-semibold text-slate-700">{morningDelay} mnt</span> setelah Syuruq,
                bangun <span class="font-semibold text-slate-700">{morningWake} mnt</span> sebelum Dzuhur
            </p>
        </div>
    </div>

    <!-- Tombol simpan -->
    <div class="flex items-center gap-3 pt-1">
        <button
            onclick={saveScreensaver}
            disabled={screensaverSaving}
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
        >
            {#if screensaverSaving}
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Menyimpan...
            {:else}
                <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Simpan Mode Hemat
            {/if}
        </button>
        {#if screensaverSuccess}
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Berhasil disimpan
            </span>
        {/if}
    </div>

</div>
