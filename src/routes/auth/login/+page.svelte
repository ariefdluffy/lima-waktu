<script lang="ts">
    let { form } = $props();
</script>

<div
    class="min-h-[calc(100vh-56px)] bg-linear-to-br from-emerald-100 via-green-50 to-white px-4 py-10"
>
    <div class="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 class="text-2xl font-bold text-emerald-900">Login Lima Waktu</h1>
        <p class="mt-1 text-sm text-slate-600">
            Masuk sebagai Admin Masjid atau Superadmin.
        </p>

        <form method="POST" class="mt-6 space-y-4">
            <label class="block space-y-1">
                <span
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >Email</span
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
                    >Password</span
                >
                <input
                    name="password"
                    type="password"
                    required
                    class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring"
                />
            </label>

            {#if form?.message}
                <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {form.message}
                </p>
            {/if}

            <button
                class="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
                Masuk
            </button>
        </form>

        <div class="mt-6 text-center">
            <p class="text-xs text-slate-500">
                Belum punya akun? <a
                    href="/auth/register"
                    class="font-semibold text-emerald-600 hover:underline"
                    >Daftar di sini</a
                >
            </p>
        </div>
    </div>
</div>
