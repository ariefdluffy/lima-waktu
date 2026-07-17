<script lang="ts">
    let {
        sub,
        expired,
        remaining,
        statusLabel,
        statusColor,
        formatDate,
    }: {
        sub: {
            status: string;
            endDate: string | Date;
            startDate: string | Date;
            packageName: string;
        };
        expired: boolean;
        remaining: number;
        statusLabel: string;
        statusColor: string;
        formatDate: (d: string | Date) => string;
    } = $props();
</script>

<div
    class="rounded-2xl border p-6 shadow-sm {statusColor ?? 'border-blue-200 bg-blue-50 text-blue-800'}"
>
    <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
            <p
                class="text-xs font-medium uppercase tracking-wider opacity-70"
            >
                {statusLabel}
            </p>
            <p class="mt-1 text-2xl font-bold">
                {#if expired}
                    Masa Aktif Habis
                {:else}
                    Aktif — {remaining} Hari Tersisa
                {/if}
            </p>
            <div class="mt-3 space-y-1 text-sm opacity-80">
                <p>Paket: {sub.packageName}</p>
                <p>Mulai: {formatDate(sub.startDate)}</p>
                <p>
                    Berakhir: {formatDate(sub.endDate)}
                    {#if !expired}
                        <span class="ml-1 font-semibold"
                            >({remaining} hari)</span
                        >
                    {/if}
                </p>
            </div>
        </div>
        <div
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/30"
        >
            {#if expired}
                <svg
                    class="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    /></svg
                >
            {:else}
                <svg
                    class="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    /></svg
                >
            {/if}
        </div>
    </div>
</div>
