<script lang="ts">
    import { EXPIRED_WATERMARK } from "$lib/utils/subscription";
</script>

<div class="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
    <h3 class="text-base font-semibold text-red-800">
        Akses Fitur Terbatas
    </h3>
    <p class="mt-2 text-sm text-red-700">
        Layar display masjid Anda akan menampilkan watermark animasi
        <strong>"{EXPIRED_WATERMARK}"</strong>
        secara berkala hingga langganan diaktifkan kembali.
    </p>
    <div
        class="mt-4 rounded-lg border border-red-200 bg-white/60 p-4 text-center font-mono text-xs tracking-wider text-red-600"
    >
        {EXPIRED_WATERMARK}
    </div>
</div>
