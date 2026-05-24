<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let currentYear = $state(new Date().getFullYear());

    function formatRupiah(val: string | number | null): string {
        const n = Number(val ?? 0);
        if (n === 0) return "Gratis";
        return "Rp " + n.toLocaleString("id-ID");
    }

    function getFeatures(plan: { featuresJson: unknown }): string[] {
        if (Array.isArray(plan.featuresJson))
            return plan.featuresJson as string[];
        if (typeof plan.featuresJson === "string") {
            const trimmed = plan.featuresJson.trim();
            if (trimmed.startsWith("[")) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) return parsed as string[];
                } catch {
                    /* ignore */
                }
            }
            return trimmed.split(",").map((f) => f.trim());
        }
        return [];
    }

    const features = [
        {
            icon: "🕐",
            title: "Jadwal Sholat Akurat",
            desc: "Tampilkan 5 waktu sholat dengan countdown real-time dan pengingat iqamah otomatis. Koreksi waktu per masjid.",
        },
        {
            icon: "📺",
            title: "Display TV Premium",
            desc: "Template modern dark dengan font besar dan kontras tinggi. Cocok untuk TV 32 hingga 55 inch di ruang sholat.",
        },
        {
            icon: "⚙️",
            title: "Kelola dari Mana Saja",
            desc: "Panel admin berbasis web. Ubah running text, slide gambar, dan jadwal tanpa perlu datang ke lokasi masjid.",
        },
        {
            icon: "📢",
            title: "Running Text & Pengumuman",
            desc: "Sampaikan informasi penting kepada jamaah langsung di layar TV. Jadwal kajian, pengumuman, dan lainnya.",
        },
        {
            icon: "🖼️",
            title: "Slide Gambar & Jumbotron",
            desc: "Upload foto kegiatan masjid, poster kajian, atau konten inspiratif untuk ditampilkan di sela jadwal sholat.",
        },
        {
            icon: "🔒",
            title: "Multi-Tenant & Aman",
            desc: "Setiap masjid punya data terpisah. Admin hanya bisa akses data masjidnya sendiri. Sistem aman dan terpercaya.",
        },
    ];
</script>

<svelte:head>
    <title>Lima Waktu — Display TV Masjid yang Elegan & Mudah Dikelola</title>
    <meta
        name="description"
        content="Platform Display TV untuk masjid Indonesia. Tampilkan jadwal sholat, running text, dan informasi masjid di layar TV dengan tampilan premium."
    />
</svelte:head>

<!-- HERO -->
<section
    class="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 px-4 py-16 text-white sm:px-6 lg:px-8"
>
    <!-- Animated Background Pattern -->
    <div class="absolute inset-0 opacity-5">
        <div
            class="absolute inset-0"
            style="background-image: radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px); background-size: 60px 60px;"
        ></div>
    </div>

    <!-- Decorative Blobs -->
    <div
        class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
    ></div>
    <div
        class="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl"
    ></div>

    <div class="relative mx-auto max-w-7xl">
        <div class="grid items-center gap-8 md:gap-12 lg:grid-cols-2">
            <!-- Left: Logo & Visual -->
            <div class="flex justify-center order-2 lg:order-1">
                <div class="relative w-full max-w-4xl">
                    <!-- Glow Effect - Lebih Besar -->
                    <div
                        class="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/30 blur-3xl"
                    ></div>
                    <!-- Logo Container - Lebih Besar & Kontras -->
                    <div
                        class="relative rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 p-8 sm:p-12 md:p-16 shadow-2xl"
                    >
                        <!-- Horizontal Logo -->
                        <img
                            src="/icon/logo-horizontal.svg"
                            alt="Lima Waktu"
                            class="w-full h-auto drop-shadow-2xl mx-auto max-w-2xl"
                        />
                    </div>
                </div>
            </div>

            <!-- Right: Content -->
            <div class="space-y-6 text-center lg:text-left order-1 lg:order-2">
                <!-- Badge -->
                <div
                    class="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-200 border border-emerald-400/30 justify-center lg:justify-start w-full lg:w-auto"
                >
                    <span class="relative flex h-2 w-2">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                        ></span>
                        <span
                            class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"
                        ></span>
                    </span>
                    Solusi Display TV Terpercaya
                </div>

                <!-- Main Heading -->
                <div>
                    <h1
                        class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
                    >
                        Tampilkan Jadwal Sholat dengan
                        <span
                            class="block bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-300 bg-clip-text text-transparent mt-2"
                        >
                            Desain Premium
                        </span>
                    </h1>
                </div>

                <!-- Subheading -->
                <p
                    class="text-base sm:text-lg text-emerald-100 leading-relaxed"
                >
                    Platform Display TV modern untuk masjid Indonesia. Kelola
                    jadwal sholat, running text, dan informasi masjid dari satu
                    dashboard intuitif. Tanpa ribet, tanpa teknis.
                </p>

                <!-- Features List -->
                <div class="space-y-3 pt-4">
                    <div
                        class="flex items-start gap-3 justify-center lg:justify-start"
                    >
                        <svg
                            class="h-5 w-5 sm:h-6 sm:w-6 text-emerald-300 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span class="text-sm sm:text-base text-emerald-50"
                            >Jadwal sholat real-time dengan countdown otomatis</span
                        >
                    </div>
                    <div
                        class="flex items-start gap-3 justify-center lg:justify-start"
                    >
                        <svg
                            class="h-5 w-5 sm:h-6 sm:w-6 text-emerald-300 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span class="text-sm sm:text-base text-emerald-50"
                            >Template TV elegan dengan kontras tinggi & font
                            besar</span
                        >
                    </div>
                    <div
                        class="flex items-start gap-3 justify-center lg:justify-start"
                    >
                        <svg
                            class="h-5 w-5 sm:h-6 sm:w-6 text-emerald-300 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span class="text-sm sm:text-base text-emerald-50"
                            >Kelola dari mana saja — panel admin berbasis web</span
                        >
                    </div>
                </div>

                <!-- CTA Buttons -->
                <div
                    class="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 justify-center lg:justify-start"
                >
                    <a
                        href="/auth/register"
                        class="inline-flex items-center justify-center rounded-xl bg-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-emerald-800 shadow-lg transition hover:bg-emerald-50 hover:shadow-xl active:scale-95"
                    >
                        Mulai Gratis Sekarang
                        <svg
                            class="ml-2 h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                        </svg>
                    </a>
                    <a
                        href="#demo"
                        class="inline-flex items-center justify-center rounded-xl border-2 border-white/40 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white transition hover:border-white hover:bg-white/10 backdrop-blur-sm"
                    >
                        Lihat Demo
                        <svg
                            class="ml-2 h-4 w-4 sm:h-5 sm:w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    </a>
                </div>

                <!-- Trust Badge -->
                <p class="text-xs sm:text-sm text-emerald-300 pt-4">
                    ✓ Tidak perlu kartu kredit • Gratis untuk 1 device • Setup
                    dalam 5 menit
                </p>
            </div>
        </div>
    </div>
</section>

<!-- FEATURES -->
<section class="bg-white px-4 py-16 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl">
        <div class="mb-12 text-center">
            <p
                class="text-sm font-semibold uppercase tracking-widest text-emerald-600"
            >
                Fitur Unggulan
            </p>
            <h2 class="mt-2 text-3xl font-bold text-slate-900">
                Semua yang Dibutuhkan Masjid Anda
            </h2>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each features as f}
                <div
                    class="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 transition hover:border-emerald-300 hover:shadow-md"
                >
                    <div class="mb-3 text-3xl">{f.icon}</div>
                    <h3 class="mb-2 text-base font-bold text-slate-800">
                        {f.title}
                    </h3>
                    <p class="text-sm leading-relaxed text-slate-600">
                        {f.desc}
                    </p>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- DEMO -->
<section id="demo" class="bg-slate-900 px-4 py-16 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl">
        <div class="mb-10 text-center">
            <p
                class="text-sm font-semibold uppercase tracking-widest text-emerald-400"
            >
                Preview Langsung
            </p>
            <h2 class="mt-2 text-3xl font-bold text-white">
                Tampilan Display TV
            </h2>
            <p class="mt-3 text-slate-400">
                Inilah yang akan terlihat di layar TV masjid Anda — elegan,
                informatif, dan mudah dibaca.
            </p>
        </div>
        <div
            class="overflow-hidden rounded-2xl border border-slate-700 shadow-2xl"
        >
            <iframe
                src="/display-preview"
                title="Preview Display TV Masjid Lima Waktu"
                class="w-full border-0"
                style="aspect-ratio: 16/9;"
                loading="lazy"
            ></iframe>
        </div>
        <p class="mt-4 text-center text-xs text-slate-500">
            Preview template "Modern Mosque Premium" — tampilan aktual
            bergantung pada data masjid Anda.
        </p>
    </div>
</section>

<!-- PRICING -->
<section id="harga" class="bg-white px-4 py-16 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl">
        <div class="mb-12 text-center">
            <p
                class="text-sm font-semibold uppercase tracking-widest text-emerald-600"
            >
                Harga
            </p>
            <h2 class="mt-2 text-3xl font-bold text-slate-900">
                Transparan, Tanpa Biaya Tersembunyi
            </h2>
            <p class="mt-3 text-slate-500">
                Pilih paket yang sesuai kebutuhan masjid Anda.
            </p>
        </div>
        <div class="grid gap-6 lg:grid-cols-3">
            {#each data.plans as plan}
                {@const highlight = plan.isHighlight === 1}
                <div
                    class="relative flex flex-col rounded-2xl border-2 p-6 transition
                        {highlight
                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-xl shadow-emerald-200'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:shadow-md'}"
                >
                    {#if plan.badge}
                        <div
                            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-0.5 text-xs font-bold text-amber-900"
                        >
                            {plan.badge}
                        </div>
                    {/if}
                    <div class="mb-4">
                        <h3
                            class="text-lg font-bold {highlight
                                ? 'text-white'
                                : 'text-slate-900'}"
                        >
                            {plan.name}
                        </h3>
                        <div class="mt-3">
                            <span
                                class="text-3xl font-extrabold {highlight
                                    ? 'text-white'
                                    : 'text-emerald-700'}"
                            >
                                {formatRupiah(plan.priceMonthly)}
                            </span>
                            <span
                                class="ml-1 text-sm {highlight
                                    ? 'text-emerald-200'
                                    : 'text-slate-500'}"
                            >
                                {plan.priceNote ?? ""}
                            </span>
                        </div>
                    </div>
                    <ul class="mb-6 flex-1 space-y-2">
                        {#each getFeatures(plan) as feat}
                            <li
                                class="flex items-start gap-2 text-sm {highlight
                                    ? 'text-emerald-100'
                                    : 'text-slate-600'}"
                            >
                                <span
                                    class="mt-0.5 text-xs {highlight
                                        ? 'text-emerald-300'
                                        : 'text-emerald-500'}">✓</span
                                >
                                {feat}
                            </li>
                        {/each}
                    </ul>
                    <a
                        href={plan.ctaHref}
                        class="block rounded-xl py-2.5 text-center text-sm font-bold transition
                            {highlight
                            ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'}"
                    >
                        {plan.ctaLabel}
                    </a>
                </div>
            {/each}
        </div>
    </div>
</section>

<!-- TESTIMONIAL -->
<section class="bg-emerald-50 px-4 py-16 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-2xl text-center">
        <div class="mb-4 text-4xl">🤲</div>
        <blockquote
            class="text-lg font-medium leading-relaxed text-slate-700 sm:text-xl"
        >
            "Lima Waktu membantu masjid kami menampilkan jadwal sholat dengan
            tampilan yang sangat rapi. Jamaah sangat terbantu dan tidak perlu
            lagi bertanya waktu sholat."
        </blockquote>
        <p class="mt-4 text-sm font-semibold text-emerald-700">
            Ustadz Ahmad Fauzi
        </p>
        <p class="text-xs text-slate-500">Masjid Al-Ikhlas, Jakarta Selatan</p>
    </div>
</section>

<!-- CTA BOTTOM -->
<section class="bg-emerald-700 px-4 py-16 text-center sm:px-6 lg:px-8">
    <div class="mx-auto max-w-2xl">
        <h2 class="text-3xl font-bold text-white">
            Siap meningkatkan pengalaman jamaah masjid Anda?
        </h2>
        <p class="mt-4 text-emerald-200">
            Daftar gratis sekarang. Tidak perlu kartu kredit.
        </p>
        <a
            href="/auth/register"
            class="mt-8 inline-block rounded-2xl bg-white px-10 py-4 text-base font-bold text-emerald-800 shadow-lg transition hover:bg-emerald-50 hover:shadow-xl"
        >
            Daftar Sekarang — Gratis
        </a>
    </div>
</section>

<!-- FOOTER -->
<footer class="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl">
        <div
            class="flex flex-col items-center justify-between gap-6 sm:flex-row"
        >
            <div>
                <div class="flex items-center gap-2">
                    <span class="text-2xl">🕌</span>
                    <span class="text-lg font-bold text-emerald-800"
                        >Lima Waktu</span
                    >
                </div>
                <p class="mt-1 text-xs text-slate-500">
                    Platform Display TV untuk Masjid Indonesia
                </p>
            </div>
            <nav class="flex gap-6 text-sm text-slate-600">
                <!-- <a href="/admin" class="hover:text-emerald-700">Admin</a>
                <a href="/superadmin" class="hover:text-emerald-700"
                    >Superadmin</a
                > -->
                <a href="/auth/login" class="hover:text-emerald-700">Login</a>
                <a href="#demo" class="hover:text-emerald-700">Demo</a>
                <a href="#harga" class="hover:text-emerald-700">Harga</a>
            </nav>
        </div>
        <div
            class="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400"
        >
            © {currentYear} Lima Waktu. Dibuat dengan ❤️ untuk masjid-masjid Indonesia.
        </div>
    </div>
</footer>
