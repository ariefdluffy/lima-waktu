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

    type MenuItem = {
        id: string;
        label: string;
        icon: string;
    };

    type MenuGroup = {
        label: string;
        items: MenuItem[];
    };

    const groups: (MenuItem | MenuGroup)[] = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
        },
        {
            label: "Pengaturan",
            items: [
                {
                    id: "profile",
                    label: "Profil Masjid",
                    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                },
                {
                    id: "schedule",
                    label: "Jadwal Sholat",
                    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
                },
                {
                    id: "iqamah",
                    label: "Iqamah",
                    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                },
                {
                    id: "other",
                    label: "Pengaturan Lain",
                    icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
                },
                {
                    id: "tema",
                    label: "Tema & Template",
                    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
                },
            ],
        },
        {
            label: "Konten",
            items: [
                {
                    id: "runningtext",
                    label: "Running Text",
                    icon: "M4 6h16M4 12h16M4 18h7",
                },
                {
                    id: "slides",
                    label: "Slide Foto",
                    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
                },
                {
                    id: "jumbotron",
                    label: "Jumbotron",
                    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
                },
                {
                    id: "events",
                    label: "Hari Besar",
                    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                },
                {
                    id: "youtube",
                    label: "YouTube",
                    icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                },
            ],
        },
    ];

    // Perangkat ditempatkan setelah Dashboard, sebelum Pengaturan
    groups.splice(1, 0, {
        id: "devices",
        label: "Perangkat",
        icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    });

    // Langganan ditempatkan setelah Perangkat
    groups.splice(2, 0, {
        id: "langganan",
        label: "Langganan",
        icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    });

    // Buka grup yang mengandung activeSection saat pertama kali mount
    function getInitialExpanded(): Set<string> {
        const set = new Set<string>();
        for (const g of groups) {
            if ("items" in g) {
                for (const item of g.items) {
                    if (item.id === activeSection) {
                        set.add(g.label);
                    }
                }
            }
        }
        return set;
    }

    let expandedGroups = $state<Set<string>>(getInitialExpanded());

    // Kalau user navigasi ke section yang grupnya belum terbuka, buka otomatis
    // tapi TIDAK menutup grup yang sudah dibuka user secara manual
    $effect(() => {
        for (const g of groups) {
            if ("items" in g) {
                for (const item of g.items) {
                    if (
                        item.id === activeSection &&
                        !expandedGroups.has(g.label)
                    ) {
                        expandedGroups = new Set([...expandedGroups, g.label]);
                    }
                }
            }
        }
    });

    function toggleGroup(label: string) {
        const next = new Set(expandedGroups);
        if (next.has(label)) {
            next.delete(label);
        } else {
            next.add(label);
        }
        expandedGroups = next;
    }

    function nav(section: string) {
        onNavigate(section);
        mobileOpen = false;
    }
</script>

<!-- Mobile Hamburger -->
<button
    class="fixed top-[calc(0.75rem+var(--safe-top,0px))] left-[calc(0.75rem+var(--safe-left,0px))] z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-95 xl:hidden"
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
        <a href="/" class="flex items-center gap-2">
            <img
                src="/icon/logo-horizontal.svg"
                alt="Lima Waktu"
                class="h-10 w-auto"
            />
        </a>
    </div>

    <!-- Nav Items -->
    <nav class="flex-1 overflow-y-auto px-3 py-4">
        <p
            class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400"
        >
            Menu Utama
        </p>
        {#each groups as g}
            {#if "items" in g}
                <!-- GROUP -->
                <button
                    class="group mb-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                    onclick={() => toggleGroup(g.label)}
                >
                    <svg
                        class="h-3 w-3 shrink-0 transition-transform {expandedGroups.has(
                            g.label,
                        )
                            ? 'rotate-90'
                            : ''}"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                        style="pointer-events:none"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                    <span class="text-xs font-semibold uppercase tracking-wider"
                        >{g.label}</span
                    >
                </button>
                {#if expandedGroups.has(g.label)}
                    <div
                        class="mb-1 ml-2 space-y-0.5 border-l-2 border-emerald-100 pl-2"
                    >
                        {#each g.items as item}
                            <button
                                class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 {activeSection ===
                                item.id
                                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}"
                                onclick={() => nav(item.id)}
                            >
                                <span
                                    class="flex h-7 w-7 items-center justify-center rounded-lg transition-all {activeSection ===
                                    item.id
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}"
                                >
                                    <svg
                                        class="h-3.5 w-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d={item.icon} />
                                    </svg>
                                </span>
                                <span>{item.label}</span>
                                {#if activeSection === item.id}
                                    <span
                                        class="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"
                                    ></span>
                                {/if}
                            </button>
                        {/each}
                    </div>
                {/if}
            {:else}
                <!-- STANDALONE ITEM -->
                <button
                    class="group mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 {activeSection ===
                    g.id
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}"
                    onclick={() => nav(g.id)}
                >
                    <span
                        class="flex h-8 w-8 items-center justify-center rounded-lg transition-all {activeSection ===
                        g.id
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
                            <path d={g.icon} />
                        </svg>
                    </span>
                    <span>{g.label}</span>
                    {#if activeSection === g.id}
                        <span
                            class="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"
                        ></span>
                    {/if}
                </button>
            {/if}
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
