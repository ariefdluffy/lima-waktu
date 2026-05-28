<script lang="ts">
    let {
        data,
        navigateTo,
    }: {
        data: any;
        navigateTo: (section: string) => void;
    } = $props();

    const statCards = [
        {
            id: "runningtext",
            label: "Running Text",
            icon: "M4 6h16M4 12h16M4 18h7",
            color: "bg-blue-50 text-blue-600",
            border: "border-blue-100",
            badge: "bg-blue-100 text-blue-700",
            getValue: (d: any) => d.runningTextTotal ?? 0,
        },
        {
            id: "devices",
            label: "Perangkat",
            icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
            color: "bg-purple-50 text-purple-600",
            border: "border-purple-100",
            badge: "bg-purple-100 text-purple-700",
            getValue: (d: any) => `${d.deviceTotal ?? 0}/${d.maxDevices === 99 ? "∞" : d.maxDevices ?? 1}`,
        },
        {
            id: "slides",
            label: "Slide Foto",
            icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
            color: "bg-amber-50 text-amber-600",
            border: "border-amber-100",
            badge: "bg-amber-100 text-amber-700",
            getValue: (d: any) => d.slideTotal ?? 0,
        },
        {
            id: "jumbotron",
            label: "Jumbotron",
            icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7",
            color: "bg-rose-50 text-rose-600",
            border: "border-rose-100",
            badge: "bg-rose-100 text-rose-700",
            getValue: (d: any) => d.jumbotronTotal ?? 0,
        },
        {
            id: "events",
            label: "Hari Besar",
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            color: "bg-orange-50 text-orange-600",
            border: "border-orange-100",
            badge: "bg-orange-100 text-orange-700",
            getValue: (d: any) => d.eventTotal ?? 0,
        },
        {
            id: "youtube",
            label: "YouTube",
            icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "bg-red-50 text-red-600",
            border: "border-red-100",
            badge: "bg-red-100 text-red-700",
            getValue: (d: any) => d.youtubeTotal ?? 0,
        },
    ];
</script>

<!-- Stats Cards — 2 kolom di mobile, 3 di sm, 6 di lg -->
<section class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
    {#each statCards as card}
        <button
            onclick={() => navigateTo(card.id)}
            class="group flex flex-col gap-3 rounded-2xl border {card.border} bg-white p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-emerald-200 active:scale-[0.98]"
        >
            <!-- Icon + badge -->
            <div class="flex items-start justify-between gap-2">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl {card.color}">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d={card.icon} />
                    </svg>
                </span>
                <span class="rounded-full {card.badge} px-2 py-0.5 text-xs font-bold tabular-nums">
                    {card.getValue(data)}
                </span>
            </div>
            <!-- Label -->
            <div>
                <p class="text-xs font-medium text-slate-500 leading-tight">{card.label}</p>
                <p class="mt-0.5 text-[10px] text-slate-400 group-hover:text-emerald-500 transition-colors">
                    Kelola →
                </p>
            </div>
        </button>
    {/each}
</section>

<!-- Today's Schedule -->
{#if data.todaySchedule}
    {@const times = [
        { label: "Subuh",   time: data.todaySchedule.subuhTime },
        { label: "Dzuhur",  time: data.todaySchedule.dzuhurTime },
        { label: "Ashar",   time: data.todaySchedule.asharTime },
        { label: "Maghrib", time: data.todaySchedule.maghribTime },
        { label: "Isya",    time: data.todaySchedule.isyaTime },
    ]}
    <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Jadwal Hari Ini
        </h3>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {#each times as t}
                <div class="rounded-xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-3 text-center">
                    <p class="text-[10px] font-medium text-slate-500">{t.label}</p>
                    <p class="mt-1 text-sm font-bold text-emerald-700 tabular-nums">{t.time}</p>
                </div>
            {/each}
        </div>
    </section>
{:else}
    <div class="rounded-2xl bg-white p-5 shadow-sm text-center">
        <p class="text-sm text-slate-400">
            📅 Belum ada jadwal untuk hari ini.
            <button class="font-medium text-emerald-600 underline" onclick={() => navigateTo("schedule")}>
                Import jadwal
            </button>
        </p>
    </div>
{/if}

<!-- Quick Actions: navigasi ke section lain yang tidak ada di stats cards -->
<section class="rounded-2xl bg-white p-5 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold text-slate-700">⚡ Aksi Cepat</h3>
    <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {#each [
            { id: "profile",     label: "Profil",      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "bg-emerald-50 text-emerald-600" },
            { id: "schedule",    label: "Jadwal",      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "bg-blue-50 text-blue-600" },
            { id: "iqamah",      label: "Iqamah",      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-teal-50 text-teal-600" },
            { id: "tema",        label: "Tema",        icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01", color: "bg-violet-50 text-violet-600" },
            { id: "other",       label: "Pengaturan",  icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4", color: "bg-slate-50 text-slate-600" },
            { id: "langganan",   label: "Langganan",   icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", color: "bg-yellow-50 text-yellow-600" },
        ] as qa}
            <button
                onclick={() => navigateTo(qa.id)}
                class="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-600 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-sm active:scale-95"
            >
                <span class="flex h-8 w-8 items-center justify-center rounded-lg {qa.color}">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d={qa.icon} />
                    </svg>
                </span>
                <span class="text-center leading-tight">{qa.label}</span>
            </button>
        {/each}
    </div>
</section>
