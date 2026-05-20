import type { ResolvedPrayerSchedule } from "./resolver";

type CacheEntry = {
  data: ResolvedPrayerSchedule;
  cachedAt: Date;
  expiresAt: Date;
};

// In-memory cache: key = "masjidId:YYYY-MM-DD"
const scheduleCache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 menit

export function getCachedSchedule(
  masjidId: string,
  dateYmd: string,
): ResolvedPrayerSchedule | null {
  const key = `${masjidId}:${dateYmd}`;
  const entry = scheduleCache.get(key);
  if (!entry) return null;
  if (new Date() > entry.expiresAt) {
    scheduleCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedSchedule(
  masjidId: string,
  dateYmd: string,
  data: ResolvedPrayerSchedule,
): void {
  const key = `${masjidId}:${dateYmd}`;
  const now = new Date();
  scheduleCache.set(key, {
    data,
    cachedAt: now,
    expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
  });
}

export function invalidateCache(masjidId: string, dateYmd: string): void {
  scheduleCache.delete(`${masjidId}:${dateYmd}`);
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: scheduleCache.size,
    keys: Array.from(scheduleCache.keys()),
  };
}
