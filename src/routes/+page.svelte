<script lang="ts">
    import { onMount } from "svelte";

    let currentYear = $state(new Date().getFullYear());

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

    const pricing = [
        {
            name: "Starter",
            badge: null,
            price: "Gratis",
            priceNote: "selamanya",
            features: [
                "1 device display",
                "Jadwal sholat manual",
                "Running text dasar",
                "Support komunitas",
            ],
            cta: "Mulai Gratis",
            ctaHref: "/auth/login",
            highlight: false,
        },
        {
            name: "Masjid",
            badge: "POPULER",
            price: "Rp 99.000",
            priceNote: "/ bulan atau Rp 990.000 / tahun",
            features: [
                "3 device display",
                "Jadwal sholat otomatis",
                "Slide gambar & jumbotron",
                "Running text unlimited",
                "Mode Sholat Jumat",
                "Event countdown",
                "Support prioritas",
            ],
            cta: "Pilih Paket Ini",
            ctaHref: "/auth/login",
            highlight: true,
        },
        {
            name: "Premium",
            badge: null,
            price: "Rp 199.000",
            priceNote: "/ bulan atau Rp 1.990.000 / tahun",
            features: [
                "Unlimited device",
                "Semua fitur Masjid",
                "Upload media",
                "YouTube integration",
                "Tema custom",
                "Laporan & statistik",
                "Dedicated support",
            ],
            cta: "Hubungi Kami",
            ctaHref: "/auth/login",
            highlight: false,
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
    class="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 px-4 py-20 text-white sm:px-6 lg:px-8"
>
    <div
        class="absolute inset-0 opacity-10"
        style="background-image: radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px); background-size: 60px 60px;"
    ></div>
    <div class="relative mx-auto max-w-4xl text-center">
        <div class="mb-6 text-7xl">🕌</div>
        <h1
            class="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        >
            Display TV Masjid yang<br />
            <span class="text-emerald-300">Elegan & Mudah Dikelola</span>
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-emerald-100 sm:text-xl">
            Tampilkan jadwal sholat, running text, dan informasi masjid di layar
            TV dengan tampilan premium. Dikelola dari mana saja, kapan saja.
        </p>
        <div
            class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
            <a
                href="/auth/login"
                class="rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-emerald-800 shadow-lg transition hover:bg-emerald-50 hover:shadow-xl"
            >
                Mulai Gratis
            </a>
            <a
                href="#demo"
                class="rounded-2xl border-2 border-white/60 px-8 py-3.5 text-base font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
                Lihat Demo ↓
            </a>
        </div>
        <p class="mt-6 text-sm text-emerald-300">
            Tidak perlu kartu kredit. Gratis untuk 1 device.
        </p>
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
            {#each pricing as plan}
                <div
                    class="relative flex flex-col rounded-2xl border-2 p-6 transition
          {plan.highlight
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
                            class="text-lg font-bold {plan.highlight
                                ? 'text-white'
                                : 'text-slate-900'}"
                        >
                            {plan.name}
                        </h3>
                        <div class="mt-3">
                            <span
                                class="text-3xl font-extrabold {plan.highlight
                                    ? 'text-white'
                                    : 'text-emerald-700'}">{plan.price}</span
                            >
                            <span
                                class="ml-1 text-sm {plan.highlight
                                    ? 'text-emerald-200'
                                    : 'text-slate-500'}">{plan.priceNote}</span
                            >
                        </div>
                    </div>
                    <ul class="mb-6 flex-1 space-y-2">
                        {#each plan.features as feat}
                            <li
                                class="flex items-start gap-2 text-sm {plan.highlight
                                    ? 'text-emerald-100'
                                    : 'text-slate-600'}"
                            >
                                <span
                                    class="mt-0.5 text-xs {plan.highlight
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
              {plan.highlight
                            ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'}"
                    >
                        {plan.cta}
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
            href="/auth/login"
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
                <a href="/admin" class="hover:text-emerald-700">Admin</a>
                <a href="/superadmin" class="hover:text-emerald-700"
                    >Superadmin</a
                >
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
