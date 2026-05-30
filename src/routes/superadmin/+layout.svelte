<script lang="ts">
    import { page } from "$app/stores";
    import SuperadminSidebar from "$lib/components/admin/SuperadminSidebar.svelte";
    import Toast from "$lib/components/admin/Toast.svelte";

    let { children, data } = $props();
    let mobileOpen = $state(false);
    let currentPath = $derived(String($page.url.pathname));

    function dismissAnnouncement(id: number) {
        const el = document.getElementById("ann-" + id);
        if (el) el.remove();
    }

    const SEVERITY_COLORS: Record<string, string> = {
        info: "border-blue-200 bg-blue-50 text-blue-800",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
        critical: "border-red-200 bg-red-50 text-red-800",
    };

    function activeSection(): string {
        const p = currentPath;
        if (p === "/superadmin" || p === "/superadmin/dashboard")
            return "dashboard";
        if (p.startsWith("/superadmin/masjids")) return "masjids";
        if (p.startsWith("/superadmin/admins")) return "admins";
        if (p.startsWith("/superadmin/subscriptions/plans")) return "plans";
        if (p.startsWith("/superadmin/subscriptions/invoices"))
            return "invoices";
        if (p.startsWith("/superadmin/subscriptions")) return "subscriptions";
        if (p.startsWith("/superadmin/templates")) return "templates";
        if (p.startsWith("/superadmin/konten-global")) return "konten-global";
        if (p.startsWith("/superadmin/monitoring")) return "monitoring";
        if (p.startsWith("/superadmin/jadwal-global")) return "jadwal-global";
        return "dashboard";
    }

    function sectionTitle(): string {
        const map: Record<string, string> = {
            dashboard: "Dashboard",
            masjids: "Manajemen Masjid",
            admins: "Manajemen Admin",
            subscriptions: "Langganan",
            plans: "Paket Harga",
            invoices: "Invoice",
            templates: "Template Global",
            "konten-global": "Konten Global",
            monitoring: "Monitoring",
            "jadwal-global": "Konfigurasi Jadwal Sholat",
        };
        return map[activeSection()] ?? "Dashboard";
    }
</script>

<div class="flex min-h-screen bg-slate-50">
    <SuperadminSidebar bind:mobileOpen currentActive={activeSection()} />

    <!-- Mobile Bottom Nav -->
    <nav
        class="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md xl:hidden pb-[calc(0.375rem+var(--safe-bottom))]"
    >
        <div class="flex items-center justify-around px-2 py-1.5">
            <a
                href="/superadmin/dashboard"
                class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 min-h-[44px] {activeSection() === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}"
            >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"
                    ><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3"/></svg
                >
                <span class="text-[11px] font-medium leading-none">Dashboard</span>
            </a>
            <a
                href="/superadmin/masjids"
                class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 min-h-[44px] {activeSection() === 'masjids' ? 'text-emerald-600' : 'text-slate-400'}"
            >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"
                    ><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg
                >
                <span class="text-[11px] font-medium leading-none">Masjid</span>
            </a>
            <a
                href="/superadmin/admins"
                class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 min-h-[44px] {activeSection() === 'admins' ? 'text-emerald-600' : 'text-slate-400'}"
            >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"
                    ><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg
                >
                <span class="text-[11px] font-medium leading-none">Admin</span>
            </a>
            <a
                href="/superadmin/subscriptions"
                class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 min-h-[44px] {activeSection() === 'subscriptions' ? 'text-emerald-600' : 'text-slate-400'}"
            >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"
                    ><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg
                >
                <span class="text-[11px] font-medium leading-none">Langganan</span>
            </a>
            <a
                href="/superadmin/monitoring"
                class="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 min-h-[44px] {activeSection() === 'monitoring' ? 'text-emerald-600' : 'text-slate-400'}"
            >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"
                    ><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg
                >
                <span class="text-[11px] font-medium leading-none">Monitor</span>
            </a>
        </div>
    </nav>

    <!-- Main Content Area -->
    <div class="flex flex-1 flex-col xl:ml-72">
        <!-- Top Header Bar -->
        <header
            class="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8"
        >
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white"
                    >
                        SA
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-slate-800">
                            {sectionTitle()}
                        </p>
                        <p class="text-xs text-slate-400">Superadmin</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="hidden text-xs text-slate-400 sm:inline"
                        >Superadmin</span
                    >
                    <form
                        method="POST"
                        action="/auth/logout"
                        class="sm:hidden"
                    >
                        <button
                            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >Keluar</button
                        >
                    </form>
                    <form
                        method="POST"
                        action="/auth/logout"
                        class="hidden sm:block"
                    >
                        <button
                            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >Keluar</button
                        >
                    </form>
                </div>
            </div>
        </header>

        <!-- Content Area -->
        <div class="flex-1 px-4 py-4 sm:px-6 lg:px-8 pb-[calc(0.375rem+var(--safe-bottom,0px)+56px)] xl:pb-4">
            <div class="mx-auto w-full max-w-7xl space-y-6">
                <!-- Announcement Banners -->
                {#if data.announcements?.length > 0}
                    <div class="space-y-2">
                        {#each data.announcements as a}
                            <div
                                id="ann-{a.id}"
                                class="rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-3 {SEVERITY_COLORS[
                                    a.severity
                                ] ?? SEVERITY_COLORS['info']}"
                            >
                                <div class="flex-1">
                                    <span class="font-semibold">{a.title}</span>
                                    {#if a.content}
                                        <span class="ml-1">— {a.content}</span>
                                    {/if}
                                </div>
                                <button
                                    class="shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100"
                                    onclick={() => dismissAnnouncement(a.id)}
                                    aria-label="Tutup">✕</button
                                >
                            </div>
                        {/each}
                    </div>
                {/if}

                {@render children()}
            </div>
        </div>
    </div>
</div>

<Toast />
