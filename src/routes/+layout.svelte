<script lang="ts">
    import "./layout.css";
    import favicon from "$lib/assets/favicon.svg";
    import { page } from "$app/stores";

    let { children, data } = $props();

    // Sembunyikan navbar di halaman display publik
    let isDisplayRoute = $derived($page.url.pathname.startsWith("/display/"));
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>Lima Waktu Admin</title>
</svelte:head>

<div class="min-h-screen">
    {#if !isDisplayRoute}
        <nav class="border-b border-emerald-200 bg-white/90 backdrop-blur">
            <div
                class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
            >
                <div class="flex items-center gap-4">
                    <a href="/" class="text-sm font-bold text-emerald-800"
                        >Lima Waktu</a
                    >
                    <a
                        href="/admin"
                        class="text-sm text-slate-700 hover:text-emerald-700"
                        >Admin</a
                    >
                    {#if data.user}
                        <a
                            href="/display"
                            class="text-sm text-slate-700 hover:text-emerald-700"
                            >Display TV</a
                        >
                    {/if}
                    {#if data.user?.roles.includes("superadmin")}
                        <a
                            href="/superadmin"
                            class="text-sm text-slate-700 hover:text-emerald-700"
                            >Superadmin</a
                        >
                    {/if}
                </div>
                <div class="flex items-center gap-3 text-xs text-slate-600">
                    {#if data.user}
                        <span class="hidden sm:inline"
                            >{data.user.fullName} ({data.user.roles.join(
                                ", ",
                            )})</span
                        >
                        <form method="POST" action="/auth/logout">
                            <button
                                class="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                                >Logout</button
                            >
                        </form>
                    {/if}
                </div>
            </div>
        </nav>
    {/if}
    {@render children()}
</div>
