<script lang="ts">
    import { EXPIRED_WATERMARK } from "$lib/utils/subscription";
</script>

<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 class="text-base font-semibold text-slate-800">
        Pratinjau Watermark di TV
    </h3>
    <p class="mt-1 text-xs text-slate-500">
        Jika langganan tidak diperpanjang, layar display TV akan menampilkan
        watermark animasi berikut secara berkala (tiap ~60 detik):
    </p>
    <div
        class="mt-3 overflow-hidden rounded-lg border border-dashed border-red-300 bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-center"
    >
        <div class="animate-marquee whitespace-nowrap font-mono text-sm tracking-wider text-white/60">
            {EXPIRED_WATERMARK}
        </div>
    </div>
    <p class="mt-2 text-xs text-slate-400">
        Text langsung muncul penuh di tengah (tanpa animasi masuk/keluar),
        denyut halus pelan. Interval: 5 menit, tampil 10 detik.
    </p>
</div>

<style>
    .animate-marquee {
        display: inline-block;
        font-size: clamp(18px, 3vw, 44px);
        font-weight: 700;
        letter-spacing: 0.16em;
        animation: marqueePulse 4s ease-in-out infinite;
    }
    @keyframes marqueePulse {
        0%,
        100% {
            opacity: 0.7;
        }
        50% {
            opacity: 0.85;
        }
    }
</style>
