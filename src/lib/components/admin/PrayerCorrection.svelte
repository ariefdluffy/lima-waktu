<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";
    import { page } from "$app/stores";

    let {
        corrections = [],
        onSave,
    }: {
        corrections: Array<{
            id: number;
            prayerName: string;
            offsetMinutes: number;
            reason: string | null;
            activeFrom: Date | string | null;
            activeUntil: Date | string | null;
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
    let isEditing = $state(false);
    let editingId = $state<number | null>(null);
    let formData = $state({
        prayerName: "dzuhur",
        offsetMinutes: 0,
        reason: "",
        activeFrom: new Date().toISOString().split("T")[0],
        activeUntil: new Date().toISOString().split("T")[0],
        isActive: 1,
    });

    let loading = $state(false);
    let message = $state("");
    let messageType = $state<"success" | "error">("success");

    // Delete confirmation state
    let showDeleteConfirm = $state(false);
    let deleteConfirmId = $state<number | null>(null);
    let deleteConfirmTitle = $state("");
    let deleteLoading = $state(false);
    let deleteCountdown = $state(0);

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
        isEditing = false;
        showForm = false;
    }

    function getPrayerLabel(key: string): string {
        return PRAYER_NAMES.find((p) => p.key === key)?.label || key;
    }

    function formatDate(dateStr: Date | string | null): string {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function startEdit(correction: any) {
        isEditing = true;
        editingId = correction.id;
        formData = {
            prayerName: correction.prayerName,
            offsetMinutes: correction.offsetMinutes,
            reason: correction.reason,
            activeFrom: correction.activeFrom,
            activeUntil: correction.activeUntil,
            isActive: correction.isActive,
        };
        showForm = true;
    }

    function startDelete(id: number, prayerName: string) {
        deleteConfirmId = id;
        deleteConfirmTitle = getPrayerLabel(prayerName);
        showDeleteConfirm = true;
        deleteCountdown = 3;

        // Countdown timer
        const interval = setInterval(() => {
            deleteCountdown--;
            if (deleteCountdown <= 0) {
                clearInterval(interval);
            }
        }, 1000);
    }

    function cancelDelete() {
        showDeleteConfirm = false;
        deleteConfirmId = null;
        deleteCountdown = 0;
    }

    async function confirmDelete() {
        if (!deleteConfirmId) return;
        deleteLoading = true;

        const formData = new FormData();
        formData.set("id", String(deleteConfirmId));

        try {
            const res = await fetch("?/deletePrayerCorrection", {
                method: "POST",
                body: formData,
            });

            const result = await res.json();
            if (result.type === "success") {
                message = "Koreksi berhasil dihapus";
                messageType = "success";
                showDeleteConfirm = false;
                deleteConfirmId = null;
                await invalidate("app:admin");
                setTimeout(() => (message = ""), 3000);
            } else {
                message = "Gagal menghapus koreksi";
                messageType = "error";
            }
        } catch (error) {
            message = "Gagal menghapus koreksi";
            messageType = "error";
        } finally {
            deleteLoading = false;
        }
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
            onclick={() => {
                if (showForm && !isEditing) {
                    resetForm();
                } else if (!showForm) {
                    resetForm();
                    showForm = true;
                }
            }}
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
            {showForm ? "Batal" : "+ Tambah Koreksi"}
        </button>
    </div>

    <!-- Form Tambah/Edit -->
    {#if showForm}
        <form
            method="POST"
            action={isEditing
                ? "?/updatePrayerCorrection"
                : "?/savePrayerCorrection"}
            use:enhance={() => {
                loading = true;
                return async ({ result }) => {
                    loading = false;
                    if (result.type === "success") {
                        message = isEditing
                            ? "Koreksi berhasil diperbarui"
                            : "Koreksi berhasil disimpan";
                        messageType = "success";
                        resetForm();
                        await invalidate("app:admin");
                        setTimeout(() => (message = ""), 3000);
                    } else if (result.type === "error") {
                        message = "Gagal menyimpan koreksi";
                        messageType = "error";
                    }
                };
            }}
            class="rounded-xl border border-emerald-200 bg-emerald-50 p-6"
        >
            <!-- Hidden inputs -->
            <input
                type="hidden"
                name="masjid_id"
                value={$page.data.masjid?.id || ""}
            />
            {#if isEditing && editingId}
                <input type="hidden" name="id" value={editingId} />
            {/if}

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
                    {loading
                        ? "Menyimpan..."
                        : isEditing
                          ? "Perbarui Koreksi"
                          : "Simpan Koreksi"}
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
            class="rounded-lg border px-4 py-3 text-sm {messageType ===
            'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'}"
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
                            <th
                                class="px-4 py-3 text-left font-semibold text-slate-700"
                            >
                                Aksi
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
                                <td class="px-4 py-3">
                                    <div class="flex gap-2">
                                        <button
                                            type="button"
                                            onclick={() =>
                                                startEdit(correction)}
                                            class="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onclick={() =>
                                                startDelete(
                                                    correction.id,
                                                    correction.prayerName,
                                                )}
                                            class="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>

<!-- Delete Confirmation Dialog dengan Animasi -->
{#if showDeleteConfirm}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
        <div
            class="rounded-2xl bg-white p-6 shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200"
        >
            <!-- Header -->
            <div class="mb-4">
                <h3 class="text-lg font-bold text-slate-900">
                    Hapus Koreksi Waktu Sholat?
                </h3>
                <p class="mt-2 text-sm text-slate-600">
                    Anda akan menghapus koreksi untuk <span
                        class="font-semibold text-slate-800"
                        >{deleteConfirmTitle}</span
                    >
                </p>
            </div>

            <!-- Warning -->
            <div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-3">
                <p class="text-xs text-red-700">
                    ⚠️ Tindakan ini tidak dapat dibatalkan. Koreksi akan dihapus
                    secara permanen.
                </p>
            </div>

            <!-- Countdown Button -->
            <div class="mb-4">
                <button
                    type="button"
                    disabled={deleteCountdown > 0 || deleteLoading}
                    onclick={confirmDelete}
                    class="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition {deleteCountdown >
                    0
                        ? 'animate-pulse'
                        : ''}"
                >
                    {deleteLoading
                        ? "Menghapus..."
                        : deleteCountdown > 0
                          ? `Hapus dalam ${deleteCountdown}s`
                          : "Ya, Hapus Koreksi"}
                </button>
            </div>

            <!-- Cancel Button -->
            <button
                type="button"
                onclick={cancelDelete}
                disabled={deleteLoading}
                class="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
            >
                Batal
            </button>
        </div>
    </div>
{/if}

<style>
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes zoomIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    :global(.animate-in) {
        animation: fadeIn 0.2s ease-out;
    }

    :global(.zoom-in-95) {
        animation: zoomIn 0.2s ease-out;
    }

    :global(.fade-in) {
        animation: fadeIn 0.2s ease-out;
    }
</style>
