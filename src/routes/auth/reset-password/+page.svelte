<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data } = $props<{ data: PageData }>();
  let password = $state("");
  let confirmPassword = $state("");
</script>

<svelte:head>
  <title>Reset Password — Lima Waktu</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <img src="/icon/logo-horizontal.svg" alt="Lima Waktu" class="h-10 mx-auto" />
      <h1 class="text-2xl font-bold text-gray-900 mt-6">Reset Password</h1>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-6">
      {#if !data.valid}
        <div class="text-center py-6">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p class="text-gray-700 font-medium">Token tidak valid</p>
          <p class="text-gray-500 text-sm mt-2">{data.error}</p>
          <a href="/auth/forgot-password" class="mt-4 inline-block text-sm text-emerald-700 hover:underline">
            Minta tautan baru
          </a>
        </div>
      {:else}
        <form method="POST" use:enhance>
          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minlength="6"
              bind:value={password}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div class="mb-6">
            <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              minlength="6"
              bind:value={confirmPassword}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ulangi password"
            />
          </div>
          <button
            type="submit"
            disabled={!password || password !== confirmPassword}
            class="w-full py-2 px-4 bg-emerald-700 text-white rounded-md font-medium hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Simpan Password Baru
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>
