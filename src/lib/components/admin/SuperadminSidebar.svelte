<script lang="ts">
  import { goto } from "$app/navigation";

  let {
    mobileOpen = $bindable(false),
    currentActive = "dashboard",
  }: {
    mobileOpen: boolean;
    currentActive: string;
  } = $props();

  type MenuItem = {
    id: string;
    label: string;
    path: string;
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
      path: "/superadmin/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
    },
    {
      id: "masjids",
      label: "Manajemen Masjid",
      path: "/superadmin/masjids",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
    {
      id: "admins",
      label: "Admin Masjid",
      path: "/superadmin/admins",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
    },
    {
      label: "Langganan & Pembayaran",
      items: [
        {
          id: "subscriptions",
          label: "Langganan",
          path: "/superadmin/subscriptions",
          icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        },
        {
          id: "plans",
          label: "Paket Harga",
          path: "/superadmin/subscriptions/plans",
          icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        },
        {
          id: "invoices",
          label: "Invoice",
          path: "/superadmin/subscriptions/invoices",
          icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        },
      ],
    },
    {
      id: "templates",
      label: "Template Global",
      path: "/superadmin/templates",
      icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    },
    {
      id: "konten-global",
      label: "Konten Global",
      path: "/superadmin/konten-global",
      icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      id: "monitoring",
      label: "Monitoring",
      path: "/superadmin/monitoring",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      id: "jadwal-global",
      label: "Jadwal Global",
      path: "/superadmin/jadwal-global",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    },
  ];

  let expandedGroups = $state<Set<string>>(new Set(["Langganan & Pembayaran"]));

  $effect(() => {
    for (const g of groups) {
      if ("items" in g) {
        for (const item of g.items) {
          if (item.id === currentActive) {
            expandedGroups.add(g.label);
          }
        }
      }
    }
  });

  function toggleGroup(label: string) {
    if (expandedGroups.has(label)) {
      expandedGroups.delete(label);
    } else {
      expandedGroups.add(label);
    }
    expandedGroups = new Set(expandedGroups);
  }

  function nav(path: string) {
    goto(path);
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
      <p class="text-[11px] font-medium text-slate-400">Superadmin Panel</p>
    </div>
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
          class="group mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
          onclick={() => toggleGroup(g.label)}
        >
          <svg
            class="h-3 w-3 transition-transform {expandedGroups.has(g.label)
              ? 'rotate-90'
              : ''}"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
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
          <div class="mb-1 ml-2 space-y-0.5 border-l-2 border-emerald-100 pl-2">
            {#each g.items as item}
              <button
                class="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 {currentActive ===
                item.id
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}"
                onclick={() => nav(item.path)}
              >
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-lg transition-all {currentActive ===
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
                {#if currentActive === item.id}
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
          class="group mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 {currentActive ===
          g.id
            ? 'bg-emerald-50 text-emerald-700 shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}"
          onclick={() => nav(g.path)}
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg transition-all {currentActive ===
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
          {#if currentActive === g.id}
            <span class="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
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
