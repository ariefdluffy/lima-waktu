<script lang="ts">
    import { page } from "$app/stores";
    import SuperadminSidebar from "$lib/components/admin/SuperadminSidebar.svelte";

    let { children } = $props();
    let mobileOpen = $state(false);
    let currentPath = $derived(String($page.url.pathname));

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

    <!-- Main Content Area -->
    <div class="flex flex-1 flex-col xl:ml-72">
        <!-- Top Header Bar -->
        <header
            class="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8"
        >
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div
                        class="hidden h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white sm:flex"
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
        <div class="flex-1 px-4 py-4 sm:px-6 lg:px-8">
            <div class="mx-auto w-full max-w-7xl space-y-6">
                {@render children()}
            </div>
        </div>
    </div>
</div>
