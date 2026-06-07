<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidate } from "$app/navigation";
    import Pagination from "$lib/components/Pagination.svelte";

    let {
        data,
        askDeleteYoutube,
        showToast,
        isExpired = false,
    }: {
        data: any;
        askDeleteYoutube: (id: number, title: string | null) => void;
        showToast: (msg: string) => void;
        isExpired?: boolean;
    } = $props();

    let addFormEl = $state<HTMLFormElement | null>(null);

    // ----------------------------------------------------------------
    // Local copy untuk drag & drop (reactive terhadap data.youtubeItems)
    // ----------------------------------------------------------------
    let items = $state<any[]>([]);
    $effect(() => {
        items = [...data.youtubeItems];
    });

    function refreshYoutube(action: "add" | "edit" | "reorder" = "edit") {
        return () =>
            async ({ result }: { result: any }) => {
                if (result.type === "success" || result.type === "redirect") {
                    await invalidate("app:admin");
                    if (action === "add") {
                        addFormEl?.reset();
                        showToast("✓ YouTube item berhasil ditambahkan!");
                    } else if (action === "edit") {
                        showToast("✓ YouTube item berhasil disimpan!");
                    } else if (action === "reorder") {
                        showToast("✓ Urutan YouTube berubah!");
                    }
                } else if (result.type === "error") {
                    showToast("✗ Gagal: " + (result.message ?? "Server error"));
                }
            };
    }

    // ----------------------------------------------------------------
    // Drag & Drop
    // ----------------------------------------------------------------
    let dragIndex = $state<number | null>(null);
    let dragOverIndex = $state<number | null>(null);
    let isDragging = $state(false);
    let dragReorderFormEl = $state<HTMLFormElement | null>(null);

    function onDragStart(e: DragEvent, idx: number) {
        dragIndex = idx;
        isDragging = true;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(idx));
        }
    }

    function onDragOver(e: DragEvent, idx: number) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        dragOverIndex = idx;
    }

    function onDragLeave() {
        dragOverIndex = null;
    }

    function onDrop(e: DragEvent, dropIdx: number) {
        e.preventDefault();
        if (dragIndex === null || dragIndex === dropIdx) {
            dragIndex = null;
            dragOverIndex = null;
            isDragging = false;
            return;
        }

        // Reorder local array
        const newItems = [...items];
        const [moved] = newItems.splice(dragIndex, 1);
        newItems.splice(dropIdx, 0, moved);
        items = newItems;

        dragIndex = null;
        dragOverIndex = null;
        isDragging = false;

        // Submit ke server
        submitDragReorder();
    }

    function onDragEnd() {
        dragIndex = null;
        dragOverIndex = null;
        isDragging = false;
    }

    // Touch drag support
    let touchDragIndex = $state<number | null>(null);
    let touchDragActive = $state(false);

    function onTouchStart(e: TouchEvent, idx: number) {
        touchDragIndex = idx;
    }

    function onTouchEnd(e: TouchEvent) {
        if (
            touchDragIndex !== null &&
            dragOverIndex !== null &&
            touchDragIndex !== dragOverIndex
        ) {
            const newItems = [...items];
            const [moved] = newItems.splice(touchDragIndex, 1);
            newItems.splice(dragOverIndex, 0, moved);
            items = newItems;
            submitDragReorder();
        }
        touchDragIndex = null;
        dragOverIndex = null;
        touchDragActive = false;
    }

    // Svelte use: action — pasang touchmove dengan passive:false agar preventDefault bisa dipanggil
    function touchMoveAction(node: HTMLElement, idx: number) {
        function handleTouchMove(e: TouchEvent) {
            if (touchDragIndex === null) return;
            e.preventDefault(); // cegah scroll saat drag
            touchDragActive = true;
            const touch = e.touches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            const row = el?.closest("[data-drag-idx]");
            if (row) {
                dragOverIndex = Number(row.getAttribute("data-drag-idx"));
            }
        }
        node.addEventListener("touchmove", handleTouchMove, { passive: false });
        return {
            destroy() {
                node.removeEventListener("touchmove", handleTouchMove);
            },
        };
    }

    async function submitDragReorder() {
        const orderedIds = items.map((i) => i.id).join(",");
        // Hitung offset berdasarkan halaman aktif
        // PAGE_SIZE = 15 (sama dengan server), halaman dari URL param pageYT
        const pageYT = Math.max(1, Number(new URLSearchParams(window.location.search).get("pageYT") ?? 1));
        const pageOffset = (pageYT - 1) * 15;

        const formData = new FormData();
        formData.set("masjid_id", data.masjid.id);
        formData.set("ordered_ids", orderedIds);
        formData.set("page_offset", String(pageOffset));

        const res = await fetch("?/dragReorderYoutube", {
            method: "POST",
            body: formData,
        });
        if (res.ok) {
            await invalidate("app:admin");
            showToast("✓ Urutan YouTube berubah!");
        } else {
            showToast("✗ Gagal menyimpan urutan.");
            // Rollback ke data asli
            items = [...data.youtubeItems];
        }
    }
</script>

<section class="space-y-5">
    <!-- Header -->
    <div class="rounded-2xl bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
            <div>
                <h2 class="text-lg font-semibold text-emerald-900">
                    📺 YouTube Playlist
                </h2>
                <p class="mt-0.5 text-xs text-slate-500">
                    Video diputar sesuai urutan. Seret ☰ untuk mengubah urutan.
                </p>
            </div>
            <span class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {data.youtubeItems.length} video
            </span>
        </div>

        <!-- Form Tambah -->
        <form
            bind:this={addFormEl}
            method="POST"
            action="?/addYoutube"
            use:enhance={refreshYoutube("add")}
            class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
        >
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tambah Video Baru
            </p>
            <input type="hidden" name="masjid_id" value={data.masjid.id} />
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div class="flex-1 min-w-0">
                    <label class="mb-1 block text-xs font-medium text-slate-600" for="yt-url">
                        URL YouTube
                    </label>
                    <input
                        id="yt-url"
                        name="youtube_url"
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                </div>
                <div class="flex-1 min-w-0">
                    <label class="mb-1 block text-xs font-medium text-slate-600" for="yt-title">
                        Judul <span class="font-normal text-slate-400">(opsional)</span>
                    </label>
                    <input
                        id="yt-title"
                        name="title"
                        type="text"
                        placeholder="cth: Kajian Subuh"
                        class="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isExpired}
                    class="shrink-0 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all {isExpired ? 'opacity-50 cursor-not-allowed' : ''}"
                >
                    + Tambah
                </button>
            </div>
        </form>
    </div>

    <!-- List -->
    <div class="rounded-2xl bg-white p-5 shadow-sm">
        {#if items.length === 0}
            <div class="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg class="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                    </svg>
                </div>
                <p class="text-sm text-slate-400">Belum ada video YouTube.</p>
                <p class="text-xs text-slate-300">Tambahkan video di atas untuk memulai.</p>
            </div>
        {:else}
            <div class="space-y-2">
                {#each items as item, idx (item.id)}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        data-drag-idx={idx}
                        draggable="true"
                        ondragstart={(e) => onDragStart(e, idx)}
                        ondragover={(e) => onDragOver(e, idx)}
                        ondragleave={onDragLeave}
                        ondrop={(e) => onDrop(e, idx)}
                        ondragend={onDragEnd}
                        ontouchstart={(e) => onTouchStart(e, idx)}
                        ontouchend={(e) => onTouchEnd(e)}
                        use:touchMoveAction={idx}
                        class="rounded-xl border transition-all duration-150
                            {dragOverIndex === idx && dragIndex !== idx
                                ? 'border-emerald-400 bg-emerald-50 scale-[1.01] shadow-md'
                                : dragIndex === idx
                                  ? 'border-emerald-300 bg-emerald-50/60 opacity-60'
                                  : 'border-emerald-100 bg-white hover:border-emerald-200 hover:shadow-sm'}"
                    >
                        <div class="flex items-start gap-2 px-3 py-3 sm:items-center sm:gap-3 sm:px-4">
                            <!-- Drag handle -->
                            <div
                                class="mt-0.5 flex shrink-0 cursor-grab touch-none active:cursor-grabbing sm:mt-0"
                                title="Seret untuk mengubah urutan"
                            >
                                <span class="text-lg leading-none text-slate-300 select-none hover:text-slate-500">☰</span>
                            </div>

                            <!-- Nomor urut -->
                            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 sm:mt-0">
                                {idx + 1}
                            </span>

                            <!-- Judul & URL — stack di mobile, inline di sm+ -->
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-medium text-slate-700">
                                    {item.title ?? "Video"}
                                </p>
                                <p class="mt-0.5 break-all text-xs text-slate-400 sm:truncate sm:break-normal">
                                    {item.youtubeUrl}
                                </p>
                            </div>

                            <!-- Tombol naik / turun -->
                            <div class="flex shrink-0 flex-col gap-0.5">
                                <form
                                    method="POST"
                                    action="?/reorderYoutube"
                                    use:enhance={refreshYoutube("reorder")}
                                >
                                    <input type="hidden" name="masjid_id" value={data.masjid.id} />
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="direction" value="up" />
                                    <button
                                        type="submit"
                                        disabled={idx === 0 && data.youtubePage === 1 || isExpired}
                                        title="Naik"
                                        class="flex h-7 w-7 items-center justify-center rounded bg-white text-slate-400 shadow-sm hover:bg-emerald-100 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                                    >▲</button>
                                </form>
                                <form
                                    method="POST"
                                    action="?/reorderYoutube"
                                    use:enhance={refreshYoutube("reorder")}
                                >
                                    <input type="hidden" name="masjid_id" value={data.masjid.id} />
                                    <input type="hidden" name="id" value={item.id} />
                                    <input type="hidden" name="direction" value="down" />
                                    <button
                                        type="submit"
                                        disabled={idx === items.length - 1 && data.youtubePage === data.youtubeTotalPages || isExpired}
                                        title="Turun"
                                        class="flex h-7 w-7 items-center justify-center rounded bg-white text-slate-400 shadow-sm hover:bg-emerald-100 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                                    >▼</button>
                                </form>
                            </div>
                        </div>

                        <!-- Detail edit (collapsible) -->
                        <details class="group border-t border-emerald-50">
                            <summary class="cursor-pointer px-3 py-2 text-xs text-emerald-600 hover:text-emerald-800 sm:px-4">
                                Edit / Hapus
                            </summary>
                            <div class="px-3 pb-3 pt-2 sm:px-4">
                                <form
                                    method="POST"
                                    action="?/editYoutube"
                                    use:enhance={refreshYoutube("edit")}
                                    class="flex flex-col gap-2 sm:flex-row sm:items-end"
                                >
                                    <input type="hidden" name="id" value={item.id} />
                                    <div class="flex-1 min-w-0">
                                        <label for="edit-url-{item.id}" class="mb-1 block text-xs text-slate-500">URL</label>
                                        <input
                                            id="edit-url-{item.id}"
                                            type="url"
                                            name="youtube_url"
                                            value={item.youtubeUrl}
                                            class="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                        />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <label for="edit-title-{item.id}" class="mb-1 block text-xs text-slate-500">Judul</label>
                                        <input
                                            id="edit-title-{item.id}"
                                            type="text"
                                            name="title"
                                            value={item.title ?? ""}
                                            placeholder="Judul (opsional)"
                                            class="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                                        />
                                    </div>
                                    <div class="flex shrink-0 items-center gap-2">
                                        <button
                                            type="submit"
                                            disabled={isExpired}
                                            class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors {isExpired ? 'opacity-50 cursor-not-allowed' : ''}"
                                        >Simpan</button>
                                        <button
                                            type="button"
                                            disabled={isExpired}
                                            onclick={() => askDeleteYoutube(item.id, item.title)}
                                            class="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors {isExpired ? 'opacity-50 cursor-not-allowed' : ''}"
                                        >Hapus</button>
                                    </div>
                                </form>
                            </div>
                        </details>
                    </div>
                {/each}
            </div>
        {/if}

        <Pagination
            currentPage={data.youtubePage}
            totalPages={data.youtubeTotalPages}
            totalItems={data.youtubeTotal}
            paramName="pageYT"
        />
    </div>
</section>
