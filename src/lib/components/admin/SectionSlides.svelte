<script lang="ts">
    import Pagination from "$lib/components/Pagination.svelte";

    let {
        data,
        slideTitle = $bindable(),
        slideFile = $bindable(),
        slideUploading,
        slideUploadError,
        slideUploadSuccess,
        uploadSlide,
        getSlideUrl,
        isExpired = false,
    }: {
        data: any;
        slideTitle: string;
        slideFile: FileList | null;
        slideUploading: boolean;
        slideUploadError: string;
        slideUploadSuccess: boolean;
        uploadSlide: () => void;
        getSlideUrl: (slide: any) => string | null;
        isExpired?: boolean;
    } = $props();
</script>

<section class="rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
        <div>
            <h2 class="text-lg font-semibold text-emerald-900">🖼️ Slide Foto Display TV</h2>
            <p class="mt-0.5 text-xs text-slate-500">Upload foto untuk slideshow di layar TV masjid. Format: JPEG, PNG.</p>
        </div>
        <span class="text-xs text-slate-400">{data.slides.length} slide</span>
    </div>

    <!-- Form Upload -->
    <div class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div class="flex flex-wrap items-end gap-3">
            <div class="flex-1 min-w-50">
                <label for="slide-title" class="mb-1 block text-xs font-medium text-slate-600">Judul (opsional)</label>
                <input
                    id="slide-title"
                    type="text"
                    bind:value={slideTitle}
                    placeholder="cth: Pengumuman Ramadan"
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                />
            </div>
            <div class="flex-1 min-w-50">
                <label for="slide-file" class="mb-1 block text-xs font-medium text-slate-600">File Foto</label>
                <input
                    id="slide-file"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onchange={(e) => { slideFile = (e.target as HTMLInputElement).files; }}
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-emerald-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-emerald-700 focus:border-emerald-400 focus:outline-none"
                />
            </div>
            <button
                onclick={uploadSlide}
                disabled={slideUploading || isExpired}
                class="shrink-0 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 {isExpired ? 'cursor-not-allowed' : ''}"
            >
                {#if slideUploading}Mengupload...{:else}⬆️ Upload{/if}
            </button>
        </div>
        {#if slideUploadError}
            <p class="mt-2 text-xs text-red-500">{slideUploadError}</p>
        {/if}
        {#if slideUploadSuccess}
            <p class="mt-2 text-xs font-medium text-emerald-600">✅ Foto berhasil diupload!</p>
        {/if}
    </div>

    <!-- Gallery Grid -->
    <div class="mt-5">
        {#if data.slides.length === 0}
            <div class="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                <svg class="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                    ><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p class="mt-3 text-sm text-slate-400">Belum ada slide foto</p>
                <p class="text-xs text-slate-300">Upload foto pertama Anda di atas</p>
            </div>
        {:else}
            <div class="grid gap-4 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {#each data.slides as slide}
                    <div class="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                        <!-- Thumbnail -->
                        <div class="aspect-4/3 bg-slate-100">
                            {#if getSlideUrl(slide)}
                                <img
                                    src={getSlideUrl(slide)!}
                                    alt={slide.title ?? "Slide"}
                                    class="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            {:else}
                                <div class="flex h-full items-center justify-center">
                                    <svg class="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                                        ><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            {/if}
                        </div>
                        <!-- Info -->
                        <div class="p-2.5">
                            <p class="truncate text-xs font-medium text-slate-700">{slide.title ?? "Tanpa judul"}</p>
                            <div class="mt-1 flex items-center justify-between gap-2">
                                <span class="text-[10px] text-slate-400">#{slide.orderIndex}</span>
                                <span class="rounded-full px-1.5 py-0.5 text-[10px] font-medium {slide.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
                                    {slide.isActive ? "Aktif" : "Nonaktif"}
                                </span>
                            </div>
                        </div>
                        <!-- Hover delete -->
                        <form
                            method="POST"
                            action="?/deleteSlide"
                            class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <input type="hidden" name="slide_id" value={slide.id} />
                            <button
                                type="submit"
                                disabled={isExpired}
                                onclick={(e) => { if (!confirm("Hapus slide ini?")) e.preventDefault(); }}
                                class="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white shadow hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Hapus slide"
                            >
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                                    ><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </form>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
    <Pagination
        currentPage={data.slidePage}
        totalPages={data.slideTotalPages}
        totalItems={data.slideTotal}
        paramName="pageSL"
    />
</section>
