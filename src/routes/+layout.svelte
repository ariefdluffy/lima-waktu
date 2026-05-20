<script lang="ts">
    import "./layout.css";
    import favicon from "$lib/assets/favicon.svg";

    let { children, data } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>Lima Waktu Admin</title>
</svelte:head>

<div class="min-h-screen">
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
                <a
                    href="/superadmin"
                    class="text-sm text-slate-700 hover:text-emerald-700"
                    >Superadmin</a
                >
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
                {:else}
                    <a
                        href="/auth/login"
                        class="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                        >Login</a
                    >
                {/if}
            </div>
        </div>
    </nav>
    {@render children()}
</div>
