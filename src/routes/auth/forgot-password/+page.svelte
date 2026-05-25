<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageData } from "./$types";

    let { data } = $props<{ data: PageData }>();
    let email = $state("");
    let submitted = $state(false);
</script>

<svelte:head>
    <title>Lupa Password — Lima Waktu</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md">
        <div class="text-center mb-8">
            <img
                src="/icon/logo-horizontal.svg"
                alt="Lima Waktu"
                class="h-10 mx-auto"
            />
            <h1 class="text-2xl font-bold text-gray-900 mt-6">Lupa Password</h1>
            <p class="text-gray-500 mt-2">
                Masukkan email Anda untuk menerima tautan reset password
            </p>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6">
            {#if submitted}
                <div class="text-center py-6">
                    <div
                        class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <svg
                            class="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <p class="text-gray-700 font-medium">Cek email Anda</p>
                    <p class="text-gray-500 text-sm mt-2">
                        Jika email terdaftar, tautan reset password akan
                        dikirim.
                    </p>
                    <a
                        href="/auth/login"
                        class="mt-4 inline-block text-sm text-emerald-700 hover:underline"
                    >
                        Kembali ke login
                    </a>
                </div>
            {:else}
                <form
                    method="POST"
                    use:enhance={() => {
                        submitted = true;
                        return async () => {};
                    }}
                >
                    <div class="mb-4">
                        <label
                            for="email"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Email</label
                        >
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            bind:value={email}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="admin@masjid.example.com"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!email}
                        class="w-full py-2 px-4 bg-emerald-700 text-white rounded-md font-medium hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Kirim Tautan Reset
                    </button>
                </form>

                <p class="text-center mt-4 text-sm text-gray-500">
                    <a
                        href="/auth/login"
                        class="text-emerald-700 hover:underline"
                        >Kembali ke login</a
                    >
                </p>
            {/if}
        </div>
    </div>
</div>
