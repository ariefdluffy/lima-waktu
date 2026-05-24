<script lang="ts">
    let {
        data,
        navigateTo,
        STATUS_LABELS,
        STATUS_COLORS,
        isExpired,
        daysRemaining,
        formatDate,
    }: {
        data: any;
        navigateTo: (section: string) => void;
        STATUS_LABELS: Record<string, string>;
        STATUS_COLORS: Record<string, string>;
        isExpired: (sub: { status: string; endDate: string | Date }) => boolean;
        daysRemaining: (endDate: string | Date) => number;
        formatDate: (d: string | Date) => string;
    } = $props();
</script>

<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Langganan</h2>
            <p class="text-xs text-slate-500">Status dan informasi masa aktif</p>
        </div>
    </div>

    <div class="mt-5 max-w-2xl space-y-5">
        {#if !data.masjid}
            <div class="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <svg class="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                        ><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 class="text-lg font-semibold text-slate-800">Belum Punya Masjid</h3>
                <p class="mt-1 text-sm text-slate-500">Buat profil masjid terlebih dahulu untuk memulai.</p>
                <button
                    onclick={() => navigateTo("dashboard")}
                    class="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700"
                    >Buat Masjid</button>
            </div>
        {:else if !data.subscription}
            <div class="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                    <svg class="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                        ><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                </div>
                <h3 class="text-lg font-semibold text-slate-800">Belum Ada Langganan</h3>
                <p class="mt-1 text-sm text-slate-500">
                    Masjid Anda belum memiliki langganan aktif. Hubungi superadmin untuk mengaktifkan.
                </p>
            </div>
        {:else}
            {@const sub = data.subscription as { status: string; endDate: string | Date; startDate: string | Date; packageName: string }}
            {@const expired = isExpired(sub)}
            {@const remaining = daysRemaining(sub.endDate)}

            <!-- Status Card -->
            <div class="rounded-2xl border p-6 shadow-sm {STATUS_COLORS[sub.status] ?? STATUS_COLORS['trial']}">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                        <p class="text-xs font-medium uppercase tracking-wider opacity-70">
                            {STATUS_LABELS[sub.status] ?? sub.status}
                        </p>
                        <p class="mt-1 text-2xl font-bold">
                            {#if expired}Masa Aktif Habis{:else}Aktif — {remaining} Hari Tersisa{/if}
                        </p>
                        <div class="mt-3 space-y-1 text-sm opacity-80">
                            <p>Paket: {sub.packageName}</p>
                            <p>Mulai: {formatDate(sub.startDate)}</p>
                            <p>
                                Berakhir: {formatDate(sub.endDate)}{#if !expired}<span class="ml-1 font-semibold">({remaining} hari)</span>{/if}
                            </p>
                        </div>
                    </div>
                    <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/30">
                        {#if expired}
                            <svg class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                                ><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        {:else}
                            <svg class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                                ><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {/if}
                    </div>
                </div>
            </div>

            {#if expired}
                <!-- Expired Warning -->
                <div class="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                    <h3 class="text-base font-semibold text-red-800">Akses Fitur Terbatas</h3>
                    <p class="mt-2 text-sm text-red-700">
                        Layar display masjid Anda akan menampilkan watermark
                        <strong>"LIMAWAKU.MY.ID — Aktifkan langganan di menu Admin"</strong>
                        hingga langganan diaktifkan kembali.
                    </p>
                    <div class="mt-4 rounded-lg border border-red-200 bg-white/60 p-4 text-center font-mono text-xs tracking-wider text-red-600">
                        LIMAWAKU.MY.ID — Aktifkan langganan di menu Admin
                    </div>
                </div>

                <!-- How to Activate -->
                <div class="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <h3 class="text-base font-semibold text-slate-800">Cara Mengaktifkan</h3>
                    <p class="mt-2 text-sm text-slate-600">
                        Hubungi Contact Person untuk memperpanjang langganan. Setelah pembayaran dikonfirmasi, status akan diperbarui.
                    </p>
                    <a
                        href="https://wa.me/6285250887277"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
                    >
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"
                            ><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        Hubungi via WhatsApp
                    </a>
                    <p class="mt-4 text-xs text-slate-400">
                        Setelah diperpanjang, refresh halaman ini untuk mengembalikan akses penuh.
                    </p>
                </div>
            {:else}
                <!-- Active Info -->
                <div class="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                    <h3 class="text-base font-semibold text-slate-800">Informasi Langganan</h3>
                    <p class="mt-2 text-sm text-slate-600">
                        Semua fitur dapat digunakan selama masa langganan aktif.
                        {#if sub.status === "trial"}
                            Setelah masa trial berakhir, layar display masjid akan menampilkan watermark hingga langganan diaktifkan.
                        {/if}
                    </p>
                    <a
                        href="https://wa.me/6285250887277"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700"
                    >
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"
                            ><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        Hubungi via WhatsApp
                    </a>
                </div>

                <!-- Watermark Preview -->
                <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 class="text-base font-semibold text-slate-800">Pratinjau Watermark</h3>
                    <p class="mt-1 text-xs text-slate-500">
                        Jika langganan tidak diperpanjang, layar display akan menampilkan:
                    </p>
                    <div class="mt-3 rounded-lg border border-dashed border-red-300 bg-red-50/50 p-4 text-center font-mono text-xs tracking-wider text-red-500">
                        LIMAWAKTU.MY.ID — Aktifkan langganan di menu Admin
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</section>
