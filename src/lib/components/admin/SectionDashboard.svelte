<script lang="ts">
    let {
        data,
        navigateTo,
    }: {
        data: any;
        navigateTo: (section: string) => void;
    } = $props();

    const quickActions = [
        {
            id: "profile",
            label: "Profil",
            icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
            color: "bg-emerald-50 text-emerald-600",
        },
        {
            id: "schedule",
            label: "Jadwal",
            icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h.01M9 13h.01M13 9h.01M13 13h.01",
            color: "bg-blue-50 text-blue-600",
        },
        {
            id: "devices",
            label: "Perangkat",
            icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
            color: "bg-purple-50 text-purple-600",
        },
        {
            id: "events",
            label: "Events",
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            color: "bg-orange-50 text-orange-600",
        },
        {
            id: "runningtext",
            label: "Running Text",
            icon: "M4 6h16M4 12h16M4 18h7",
            color: "bg-amber-50 text-amber-600",
        },
        {
            id: "slides",
            label: "Slide",
            icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
            color: "bg-rose-50 text-rose-600",
        },
    ];
</script>

<!-- Stats Cards -->
<section class="grid gap-3 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
    <button
        class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
        onclick={() => navigateTo("runningtext")}
    >
        <div class="flex items-center gap-3">
            <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
            >
                <svg
                    class="h-4.5 w-4.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M4 6h16M4 12h16M4 18h7"
                    /></svg
                >
            </span>
            <div>
                <p class="text-[11px] font-medium text-slate-400">
                    Running Text
                </p>
                <p class="text-xl font-bold text-slate-700">
                    {data.runningTexts.length}
                </p>
            </div>
        </div>
    </button>
    <button
        class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
        onclick={() => navigateTo("devices")}
    >
        <div class="flex items-center gap-3">
            <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600"
            >
                <svg
                    class="h-4.5 w-4.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    /></svg
                >
            </span>
            <div>
                <p class="text-[11px] font-medium text-slate-400">Devices</p>
                <p class="text-xl font-bold text-slate-700">
                    {data.devices.length}
                </p>
            </div>
        </div>
    </button>
    <button
        class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
        onclick={() => navigateTo("slides")}
    >
        <div class="flex items-center gap-3">
            <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
            >
                <svg
                    class="h-4.5 w-4.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    /></svg
                >
            </span>
            <div>
                <p class="text-[11px] font-medium text-slate-400">Slides</p>
                <p class="text-xl font-bold text-slate-700">
                    {data.slides.length}
                </p>
            </div>
        </div>
    </button>
    <button
        class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
        onclick={() => navigateTo("jumbotron")}
    >
        <div class="flex items-center gap-3">
            <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600"
            >
                <svg
                    class="h-4.5 w-4.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    /></svg
                >
            </span>
            <div>
                <p class="text-[11px] font-medium text-slate-400">Jumbotrons</p>
                <p class="text-xl font-bold text-slate-700">
                    {data.jumbotrons.length}
                </p>
            </div>
        </div>
    </button>
    <button
        class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
        onclick={() => navigateTo("events")}
    >
        <div class="flex items-center gap-3">
            <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600"
            >
                <svg
                    class="h-4.5 w-4.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    /></svg
                >
            </span>
            <div>
                <p class="text-[11px] font-medium text-slate-400">Events</p>
                <p class="text-xl font-bold text-slate-700">
                    {data.eventTotal}
                </p>
            </div>
        </div>
    </button>
    <button
        class="group cursor-pointer w-full text-left rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all"
        onclick={() => navigateTo("youtube")}
    >
        <div class="flex items-center gap-3">
            <span
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600"
            >
                <svg
                    class="h-4.5 w-4.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    /></svg
                >
            </span>
            <div>
                <p class="text-[11px] font-medium text-slate-400">YouTube</p>
                <p class="text-xl font-bold text-slate-700">
                    {data.youtubeItems.length}
                </p>
            </div>
        </div>
    </button>
</section>

<!-- Today's Schedule Quick View -->
{#if data.todaySchedule}
    {@const times = [
        {
            label: "Subuh",
            time: data.todaySchedule.subuhTime,
            icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
        },
        {
            label: "Dzuhur",
            time: data.todaySchedule.dzuhurTime,
            icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
        },
        {
            label: "Ashar",
            time: data.todaySchedule.asharTime,
            icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
        },
        {
            label: "Maghrib",
            time: data.todaySchedule.maghribTime,
            icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
        },
        {
            label: "Isya",
            time: data.todaySchedule.isyaTime,
            icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
        },
    ]}
    <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h3
            class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"
        >
            <svg
                class="h-4 w-4 text-emerald-500"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                /></svg
            >
            Jadwal Hari Ini
        </h3>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {#each times as t}
                <div
                    class="rounded-xl bg-linear-to-b from-emerald-50 to-white border border-emerald-100 p-3 text-center"
                >
                    <p class="text-[10px] font-medium text-slate-500 mb-1">
                        {t.label}
                    </p>
                    <p class="text-sm font-bold text-emerald-700">{t.time}</p>
                </div>
            {/each}
        </div>
    </section>
{:else}
    <div class="rounded-2xl bg-white p-5 shadow-sm text-center">
        <p class="text-sm text-slate-400">
            📅 Belum ada jadwal untuk hari ini. <button
                class="text-emerald-600 underline font-medium"
                onclick={() => navigateTo("schedule")}>Import jadwal</button
            >
        </p>
    </div>
{/if}

<!-- Quick Action Buttons -->
<section class="rounded-2xl bg-white p-5 shadow-sm">
    <h3 class="text-sm font-semibold text-slate-700 mb-3">⚡ Aksi Cepat</h3>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {#each quickActions as qa}
            <button
                onclick={() => navigateTo(qa.id)}
                class="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-medium text-slate-600 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all"
            >
                <span
                    class="flex h-8 w-8 items-center justify-center rounded-lg {qa.color}"
                >
                    <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d={qa.icon}
                        /></svg
                    >
                </span>
                {qa.label}
            </button>
        {/each}
    </div>
</section>
