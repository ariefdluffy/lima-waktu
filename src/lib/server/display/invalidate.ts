import {
  invalidateDisplayCacheByMasjid,
  invalidateDisplayCacheByDevice,
} from "./cache";
import { invalidateCache as invalidatePrayerCache } from "$lib/server/prayer/cache";

/**
 * Invalidate semua cache yang terkait Display TV untuk satu masjid.
 *
 * Dipanggil dari endpoint admin sesudah perubahan data (slides, running text,
 * jumbotron, youtube, events, devices, profile masjid). Setelah ini, polling
 * berikutnya dari TV akan ambil data segar.
 */
export function invalidateDisplayForMasjid(masjidId: string): void {
  invalidateDisplayCacheByMasjid(masjidId);
}

/**
 * Khusus untuk perubahan data sholat (schedule, override, correction,
 * iqamah-settings). Bersihkan juga prayer cache karena resolver hasilnya
 * yang masuk ke payload Display.
 */
export function invalidateDisplayPrayerForMasjid(masjidId: string): void {
  invalidatePrayerCache(masjidId, "*");
  invalidateDisplayCacheByMasjid(masjidId);
}

/**
 * Invalidate satu device (mis. saat device baru di-pair atau di-rename).
 */
export function invalidateDisplayForDevice(deviceCode: string): void {
  invalidateDisplayCacheByDevice(deviceCode);
}
