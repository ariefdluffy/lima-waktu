<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";

    let {
        corrections = [],
        onSave,
    }: {
        corrections: Array<{
            id: number;
            prayerName: string;
            offsetMinutes: number;
            reason: string;
            activeFrom: string;
            activeUntil: string;
            isActive: number;
        }>;
        onSave?: () => void;
    } = $props();

    const PRAYER_NAMES = [
        { key: "imsak", label: "Imsak" },
        { key: "subuh", label: "Subuh" },
        { key: "sunrise", label: "Syuruq (Sunrise)" },
        { key: "dhuha", label: "Dhuha" },
        { key: "dzuhur", label: "Dzuhur" },
        { key: "ashar", label: "Ashar" },
        { key: "maghrib", label: "Maghrib" },
        { key: "isya", label: "Isya" },
    ];

    let showForm = $state(false);
    let formData = $state({
        prayerName: "dzuhur",
        offsetMinutes: 0,
        reason: "",
        activeFrom: new Date().toISOString().split("T")[0],
        activeUntil: new Date().toISOString().split("T")[0],
        isActive: 1,
    });

    let editingId = $state<number | null>(null);
    let loading = $state(false);
    let message = $state("");

    function resetForm() {
        formData = {
            prayerName: "dzuhur",
            offsetMinutes: 0,
            reason: "",
            activeFrom: new Date().toISOString().split("T")[0],
            activeUntil: new Date().toISOString().split("T")[0],
            isActive: 1,
        };
        editingId = null;
        showForm = false;
    }

    function getPrayerLabel(key: string): string {
        return PRAYER_NAMES.find((p) => p.key === key)?.label || key;
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h3 class="text-lg font-semibold text-emerald-900">
                Koreksi Waktu Sholat
            </h3>
            <p class="mt-1 text-sm text-slate-600">
                Sesuaikan waktu sholat dengan offset/adjustment untuk periode
                tertentu
            </p>
        </div>
        <button
            type="button"
            onclick={() => (showForm = !showForm)}
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
            {showForm ? "Batal" : "+ Tambah Koreksi"}
        </button>
    </div>

    <!-- Form Tambah/Edit -->
    {#if showForm}
        <form
            method="POST"
            action="?/savePrayerCorrection"
            use:enhance={() => {
                loading = true;
                return async ({ result }) => {
                    loading = false;
                    if (result.type === "success") {
                        message = "Koreksi berhasil disimpan";
                        resetForm();
                        await invalidate("app:admin");
                        setTimeout(() => (message = ""), 3000);
                    } else if (result.type === "error") {
                        message = "Gagal menyimpan koreksi";
                    }
                };
            }}
            class="rounded-xl border border-emerald-200 bg-emerald-50 p-6"
        >
            <!-- Hidden masjid_id input -->
            <input type="hidden" name="masjid_id" value={$page.data.masjid?.id || ""} />

            <div class="grid gap-4 sm:grid-cols-2">
                <!-- Prayer Name -->
                <div>
                    <label class="block text-sm font-medium text-slate-700">
                        Waktu Sholat
                    </label>
                    <select
                        name="prayerName"
                        bind:value={formData.prayerName}
                        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                        {#each PRAYER_NAMES as prayer}
                            <option value={prayer.key}>{prayer.label}</option>
                        {/each}
                    </select>
                </div>

                <!-- Offset Minutes -->
                <div>
                    <label class="block text-sm font-medium text-slate-700">
                        Offset (menit)
                    </label>
                    <input
                        type="number"
                        name="offsetMinutes"
                        bind:value={formData.offsetMinutes}
                        placeholder="Contoh: -2 atau +5"
                        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <p class="mt-1 text-xs text-slate-500">
                        Negatif = lebih awal, Positif = lebih lambat
                    </p>
                </div>

                <!-- Active From -->
                <div>
                    <label class="block text-sm font-medium text-slate-700">
                        Berlaku Dari
                    </label>
                    <input
                        type="date"
                        name="activeFrom"
                        bind:value={formData.activeFrom}
                        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                </div>

                <!-- Active Until -->
                <div>
                    <label class="block text-sm font-medium text-slate-700">
                        Berlaku Sampai
                    </label>
                    <input
                        type="date"
                        name="activeUntil"
                        bind:value={formData.activeUntil}
                        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                </div>

                <!-- Reason (Full Width) -->
                <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-slate-700">
                        Alasan
                    </label>
                    <input
                        type="text"
                        name="reason"
                        bind:value={formData.reason}
                        placeholder="Contoh: Hasil verifikasi lapangan"
                        class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                </div>

                <!-- Is Active -->
                <div class="sm:col-span-2">
                    <label class="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isActive"
                            value="1"
                            checked={formData.isActive === 1}
                            onchange={(e) => {
                                const target = e.target as HTMLInputElement;
                                formData.isActive = target.checked ? 1 : 0;
                            }}
                            class="rounded border-slate-300"
                        />
                        <span class="text-sm font-medium text-slate-700">
                            Aktifkan koreksi ini
                        </span>
                    </label>
                </div>
            </div>

            <!-- Buttons -->
            <div class="mt-6 flex gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                    {loading ? "Menyimpan..." : "Simpan Koreksi"}
                </button>
                <button
                    type="button"
                    onclick={resetForm}
                    class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                    Batal
                </button>
            </div>
        </form>
    {/if}

    <!-- Message -->
    {#if message}
        <div
            class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
            {message}
        </div>
    {/if}

    <!-- Daftar Koreksi -->
    <div class="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {#if corrections.length === 0}
            <div class="px-6 py-8 text-center text-slate-500">
                <p class="text-sm">Belum ada koreksi waktu sholat.</p>
            </div>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-slate-200 bg-slate-50">
                            <th
                                class="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Sholat
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Offset
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Periode
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Alasan
                            </th>
                            <th
                                class="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each corrections as correction}
                            <tr
                                class="border-b border-slate-100 hover:bg-slate-50"
                            >
                                <td
                                    class="px-4 py-3 font-medium text-slate-800"
                                >
                                    {getPrayerLabel(correction.prayerName)}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold {correction.offsetMinutes <
                                        0
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-orange-100 text-orange-700'}"
                                    >
                                        {correction.offsetMinutes > 0
                                            ? "+"
                                            : ""}
                                        {correction.offsetMinutes} menit
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-xs text-slate-600">
                                    {formatDate(correction.activeFrom)} s/d
                                    {formatDate(correction.activeUntil)}
                                </td>
                                <td class="px-4 py-3 text-xs text-slate-600">
                                    {correction.reason || "-"}
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold {correction.isActive
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-100 text-slate-600'}"
                                    >
                                        {correction.isActive
                                            ? "Aktif"
                                            : "Nonaktif"}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
