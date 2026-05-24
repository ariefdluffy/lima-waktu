<script lang="ts">
    import { onMount } from "svelte";
    import { showToast } from "$lib/stores/toast";
    import Toast from "$lib/components/admin/Toast.svelte";
    let { data, form } = $props();

    onMount(() => {
        if (form?.error) {
            showToast(form.error, "error");
        }
    });
</script>

<div
    class="min-h-[calc(100vh-56px)] bg-linear-to-br from-emerald-100 via-green-50 to-white px-4 py-10"
>
    <div class="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 class="text-2xl font-bold text-emerald-900">Daftar Akun Baru</h1>
        <p class="mt-1 text-sm text-slate-600">
            Akun Anda otomatis di-set sebagai admin masjid.
        </p>

        <form method="POST" class="mt-6 space-y-4">
            <label class="block space-y-1">
                <span
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Nama Lengkap *</span
                >
                <input
                    name="full_name"
                    type="text"
                    required
                    value={form?.fullName ?? ""}
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                />
            </label>

            <label class="block space-y-1">
                <span
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Email *</span
                >
                <input
                    name="email"
                    type="email"
                    required
                    value={form?.email ?? ""}
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                />
            </label>

            <label class="block space-y-1">
                <span
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Password *</span
                >
                <input
                    name="password"
                    type="password"
                    required
                    min="6"
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                />
            </label>

            <label class="block space-y-1">
                <span
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Konfirmasi Password *</span
                >
                <input
                    name="confirm_password"
                    type="password"
                    required
                    min="6"
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                />
            </label>

            <label class="block space-y-1">
                <span
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Nomor Telepon (Opsional)</span
                >
                <input
                    name="phone"
                    type="tel"
                    value={form?.phone ?? ""}
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                />
            </label>

            {#if form?.error}
                <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {form.error}
                </p>
            {/if}

            <button
                class="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
                Daftar Sekarang
            </button>
        </form>

        <div class="mt-6 text-center">
            <p class="text-xs text-slate-500">
                Sudah punya akun? <a
                    href="/auth/login"
                    class="font-semibold text-emerald-600 hover:underline"
                    >Masuk di sini</a
                >
            </p>
        </div>
    </div>
</div>

<Toast />
