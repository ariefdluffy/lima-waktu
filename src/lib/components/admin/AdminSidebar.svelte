<script lang="ts">
    let {
        activeSection,
        onNavigate,
        mobileOpen = $bindable(false),
    }: {
        activeSection: string;
        onNavigate: (section: string) => void;
        mobileOpen: boolean;
    } = $props();

    const sections: {
        id: string;
        label: string;
        icon: string;
        badge?: string;
    }[] = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
        },
        {
            id: "profile",
            label: "Profil Masjid",
            icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        },
        {
            id: "runningtext",
            label: "Running Text",
            icon: "M4 6h16M4 12h16M4 18h7",
        },
        {
            id: "devices",
            label: "Perangkat",
            icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
        },
        {
            id: "iqamah",
            label: "Iqamah",
            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        {
            id: "hijri",
            label: "Hijri Offset",
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        },
        {
            id: "weather",
            label: "Cuaca",
            icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
        },
        {
            id: "jumbotron",
            label: "Jumbotron",
            icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
        },
        {
            id: "youtube",
            label: "YouTube",
            icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        {
            id: "schedule",
            label: "Jadwal Sholat",
            icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
        },
        {
            id: "slides",
            label: "Slide Foto",
            icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
        },
    ];

    function nav(section: string) {
        onNavigate(section);
        mobileOpen = false;
    }
</script>

<!-- Mobile Hamburger -->
<button
    class="fixed top-3 left-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-95 xl:hidden"
    onclick={() => (mobileOpen = !mobileOpen)}
    aria-label="Toggle menu"
>
    <svg
        class="h-5 w-5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
    >
        {#if mobileOpen}
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
            />
        {:else}
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
            />
        {/if}
    </svg>
</button>

<!-- Overlay -->
{#if mobileOpen}
    <button
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
        onclick={() => (mobileOpen = false)}
        aria-label="Tutup menu"
    ></button>
{/if}

<!-- Sidebar -->
<aside
    class="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out xl:translate-x-0 {mobileOpen
        ? 'translate-x-0'
        : '-translate-x-full'}"
>
    <!-- Logo Area -->
    <div class="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
        <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-200"
        >
            <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>
        </div>
        <div>
            <p class="text-base font-bold text-slate-800">Lima Waktu</p>
            <p class="text-[11px] font-medium text-slate-400">Admin Panel</p>
        </div>
    </div>

    <!-- Nav Items -->
    <nav class="flex-1 overflow-y-auto px-3 py-4">
        <p
            class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400"
        >
            Menu Utama
        </p>
        {#each sections as sec}
            <button
                class="group mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 {activeSection ===
                sec.id
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}"
                onclick={() => nav(sec.id)}
            >
                <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg transition-all {activeSection ===
                    sec.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}"
                >
                    <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                    >
                        <path d={sec.icon} />
                    </svg>
                </span>
                <span>{sec.label}</span>
                {#if activeSection === sec.id}
                    <span
                        class="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"
                    ></span>
                {/if}
            </button>
        {/each}
    </nav>

    <!-- Footer -->
    <div class="border-t border-slate-100 px-5 py-4">
        <form method="POST" action="/auth/logout">
            <button
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
            >
                <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400"
                >
                    <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>
                </span>
                Keluar
            </button>
        </form>
    </div>
</aside>
