<script lang="ts">
    import { isSubscriptionExpired } from "$lib/utils/subscription";
    import SubscriptionStatusCard from "./subscription/SubscriptionStatusCard.svelte";
    import ExpiredWarning from "./subscription/ExpiredWarning.svelte";
    import ContactCta from "./subscription/ContactCta.svelte";
    import WatermarkPreview from "./subscription/WatermarkPreview.svelte";

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

    // Use shared util (fallback ke prop client isExpired untuk backward compat)
    const isExpiredSafe = (
        sub: { status: string; endDate: string | Date } | null,
    ): boolean => (sub ? isSubscriptionExpired(sub) : isExpired(sub!));
</script>

<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">Langganan</h2>
            <p class="text-xs text-slate-500">
                Status dan informasi masa aktif
            </p>
        </div>
    </div>

    <div class="mt-5 max-w-2xl space-y-5">
        {#if !data.masjid}
            <!-- STATE: Belum punya masjid -->
            <div
                class="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100"
            >
                <div
                    class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
                >
                    <svg
                        class="h-8 w-8 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        /></svg
                    >
                </div>
                <h3 class="text-lg font-semibold text-slate-800">
                    Belum Punya Masjid
                </h3>
                <p class="mt-1 text-sm text-slate-500">
                    Buat profil masjid terlebih dahulu untuk memulai.
                </p>
                <button
                    onclick={() => navigateTo("dashboard")}
                    class="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700"
                    >Buat Masjid</button
                >
            </div>
        {:else if !data.subscription}
            <!-- STATE: Ada masjid tapi subscription null (edge case) -->
            <div
                class="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100"
            >
                <div
                    class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100"
                >
                    <svg
                        class="h-8 w-8 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        /></svg
                    >
                </div>
                <h3 class="text-lg font-semibold text-slate-800">
                    Belum Ada Data Langganan
                </h3>
                <p class="mt-1 text-sm text-slate-500">
                    Hubungi superadmin untuk mengaktifkan langganan masjid Anda.
                </p>
            </div>
        {:else}
            {@const sub = data.subscription}
            {@const expired = isExpiredSafe(sub)}
            {@const remaining = daysRemaining(sub.endDate)}

            <!-- Status utama -->
            <SubscriptionStatusCard
                {sub}
                {expired}
                {remaining}
                statusLabel={STATUS_LABELS[sub.status] ?? sub.status}
                statusColor={STATUS_COLORS[sub.status] ??
                    STATUS_COLORS["trial"]}
                {formatDate}
            />

            {#if expired}
                <!-- STATE: Expired -->
                <ExpiredWarning />

                <div
                    class="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
                >
                    <h3 class="text-base font-semibold text-slate-800">
                        Cara Mengaktifkan
                    </h3>
                    <p class="mt-2 text-sm text-slate-600">
                        Hubungi Contact Person untuk memperpanjang langganan.
                        Setelah pembayaran dikonfirmasi, status akan diperbarui.
                    </p>
                    <ContactCta />
                    <p class="mt-4 text-xs text-slate-400">
                        Setelah diperpanjang, refresh halaman ini untuk
                        mengembalikan akses penuh.
                    </p>
                </div>
            {:else}
                <!-- STATE: Aktif -->
                <div
                    class="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
                >
                    <h3 class="text-base font-semibold text-slate-800">
                        Informasi Langganan
                    </h3>
                    <p class="mt-2 text-sm text-slate-600">
                        Semua fitur dapat digunakan selama masa langganan aktif.
                        {#if sub.status === "trial"}
                            Setelah masa trial berakhir, layar display masjid
                            akan menampilkan watermark animasi hingga langganan
                            diaktifkan.
                        {/if}
                    </p>
                    <ContactCta />
                </div>

                <WatermarkPreview />
            {/if}
        {/if}
    </div>
</section>
