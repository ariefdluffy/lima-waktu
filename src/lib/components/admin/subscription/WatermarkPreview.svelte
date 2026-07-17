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
        Animasi: slide horizontal menyeberangi layar + pulse opacity (samar).
    </p>
</div>

<style>
    .animate-marquee {
        display: inline-block;
        animation: marqueeSlide 4s linear infinite;
    }
    @keyframes marqueeSlide {
        0% {
            transform: translateX(-50%);
        }
        100% {
            transform: translateX(50%);
        }
    }
</style>
