// In-memory cache untuk payload Display TV.
//
// Kenapa perlu: endpoint /api/v1/display/[deviceCode] dipanggil tiap 15 detik
// per TV. Tanpa cache, satu masjid dengan 5 TV = ~200 query/menit (bahkan saat
// schedule sudah di-cache oleh prayer cache). Cache ini menyimpan hasil
// agregasi semua data display (slides, running text, jumbotron, youtube,
// events, theme, masjid, subscription) per device.
//
// TTL singkat (15 detik) supaya update dari admin tetap cepat sampai ke TV,
// tapi cukup untuk memotong query bertubi-tubi dari satu device.

export type DisplayCacheEntry = {
  data: unknown;
  watermark: string | null;
  cachedAt: number;
  expiresAt: number;
};

const cache = new Map<string, DisplayCacheEntry>();
const TTL_MS = 15_000; // 15 detik — sinkron dengan interval polling client

export function getCachedDisplayPayload(
  deviceCode: string,
): DisplayCacheEntry | null {
  const entry = cache.get(deviceCode);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(deviceCode);
    return null;
  }
  return entry;
}

export function setCachedDisplayPayload(
  deviceCode: string,
  data: unknown,
  watermark: string | null,
): void {
  const now = Date.now();
  cache.set(deviceCode, {
    data,
    watermark,
    cachedAt: now,
    expiresAt: now + TTL_MS,
  });
}

/**
 * Invalidate cache untuk semua device milik masjid tertentu.
 * Dipanggil oleh admin endpoints saat ada perubahan slides/runningTexts/dll.
 */
export function invalidateDisplayCacheByMasjid(masjidId: string): void {
  // Cache berbasis deviceCode, jadi kita tag entry pakai masjidId di payload.
  for (const [key, entry] of cache.entries()) {
    const payload = entry.data as { masjid?: { id?: string } } | null;
    if (payload?.masjid?.id === masjidId) {
      cache.delete(key);
    }
  }
}

/** Invalidate cache untuk satu device. */
export function invalidateDisplayCacheByDevice(deviceCode: string): void {
  cache.delete(deviceCode);
}

/** Hapus semua cache (untuk testing / debug). */
export function clearDisplayCache(): void {
  cache.clear();
}

export function getDisplayCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
