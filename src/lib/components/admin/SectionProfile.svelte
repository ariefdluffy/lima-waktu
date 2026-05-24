<script lang="ts">
    let {
        data,
        profileName = $bindable(),
        profileAddress = $bindable(),
        profileCity = $bindable(),
        profileDistrict = $bindable(),
        profileProvince = $bindable(),
        profileTimezone = $bindable(),
        profileSaving,
        profileSuccess,
        profileError,
        saveProfile,
        logoFile = $bindable(),
        logoPreview,
        logoSaving,
        logoSuccess,
        logoError,
        uploadLogo,
        openDeleteMasjidDialog,
    }: {
        data: any;
        profileName: string;
        profileAddress: string;
        profileCity: string;
        profileDistrict: string;
        profileProvince: string;
        profileTimezone: string;
        profileSaving: boolean;
        profileSuccess: string;
        profileError: string;
        saveProfile: () => void;
        logoFile: File | null;
        logoPreview: string;
        logoSaving: boolean;
        logoSuccess: string;
        logoError: string;
        uploadLogo: () => void;
        openDeleteMasjidDialog: () => void;
    } = $props();
</script>

<!-- PROFIL MASJID -->
<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Profil Masjid</h2>
            <p class="mt-0.5 text-xs text-slate-500">Edit nama, alamat, dan upload logo masjid.</p>
        </div>
    </div>
    <div class="mt-5 grid gap-6 lg:grid-cols-2">
        <!-- Form data diri -->
        <div class="space-y-4">
            <div>
                <label for="profile-name" class="mb-1 block text-xs font-medium text-slate-600">Nama Masjid</label>
                <input
                    id="profile-name"
                    type="text"
                    bind:value={profileName}
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                />
            </div>
            <div>
                <label for="profile-address" class="mb-1 block text-xs font-medium text-slate-600">Alamat</label>
                <input
                    id="profile-address"
                    type="text"
                    bind:value={profileAddress}
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                />
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label for="profile-city" class="mb-1 block text-xs font-medium text-slate-600">Kota</label>
                    <input
                        id="profile-city"
                        type="text"
                        bind:value={profileCity}
                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label for="profile-district" class="mb-1 block text-xs font-medium text-slate-600">Kecamatan</label>
                    <input
                        id="profile-district"
                        type="text"
                        bind:value={profileDistrict}
                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                    />
                </div>
            </div>
            <div>
                <label for="profile-province" class="mb-1 block text-xs font-medium text-slate-600">Provinsi</label>
                <input
                    id="profile-province"
                    type="text"
                    bind:value={profileProvince}
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                />
            </div>
            <div>
                <label for="profile-timezone" class="mb-1 block text-xs font-medium text-slate-600">Zona Waktu</label>
                <select
                    id="profile-timezone"
                    bind:value={profileTimezone}
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                >
                    <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                    <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                    <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                </select>
            </div>
            <div class="flex items-center gap-3">
                <button
                    onclick={saveProfile}
                    disabled={profileSaving}
                    class="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                    {#if profileSaving}Menyimpan...{:else}Simpan Profil{/if}
                </button>
                {#if profileSuccess}
                    <p class="text-sm font-medium text-emerald-600">{profileSuccess}</p>
                {/if}
                {#if profileError}
                    <p class="text-sm text-red-500">{profileError}</p>
                {/if}
            </div>
        </div>

        <!-- Upload Logo -->
        <div class="flex flex-col items-center gap-4">
            <div class="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-emerald-300 bg-emerald-50">
                {#if logoPreview}
                    <img src={logoPreview} alt="Logo masjid" class="h-full w-full object-contain" />
                {:else}
                    <span class="text-5xl text-emerald-300">🕌</span>
                {/if}
            </div>
            <input
                id="logo-file"
                type="file"
                accept=".jpg,.jpeg,.png"
                onchange={(e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0) {
                        logoFile = files[0];
                    }
                }}
                class="w-full max-w-xs rounded-xl border border-emerald-200 px-3 py-2 text-sm"
            />
            <button
                onclick={uploadLogo}
                disabled={logoSaving}
                class="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
                {#if logoSaving}Mengupload...{:else}Upload Logo{/if}
            </button>
            {#if logoSuccess}
                <p class="text-sm font-medium text-emerald-600">{logoSuccess}</p>
            {/if}
            {#if logoError}
                <p class="text-sm text-red-500">{logoError}</p>
            {/if}
        </div>
    </div>
</section>

<!-- ZONA BERBAHAYA: HAPUS DATA MASJID -->
<section class="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-red-800">⚠️ Zona Berbahaya</h2>
            <p class="mt-0.5 text-xs text-red-600">
                Tindakan ini akan menghapus <strong>semua data masjid</strong> secara permanen,
                termasuk perangkat, jadwal sholat, slide, jumbotron, running text, YouTube, dan data lainnya.
                Tidak bisa dibatalkan.
            </p>
        </div>
    </div>
    <div class="mt-4 flex flex-wrap items-center gap-4">
        <button
            onclick={openDeleteMasjidDialog}
            class="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md active:scale-[0.97]"
        >
            🗑️ Hapus Semua Data Masjid
        </button>
    </div>
</section>
