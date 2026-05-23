import { syncAllMasjids } from "./sync";

const INTERVAL_MS = 15 * 60 * 1000; // 15 menit
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

async function refreshAllSchedules(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    console.log(`[PrayerScheduler] Starting sync for all masjids...`);

    const result = await syncAllMasjids();

    if (result.totalMasjids === 0) {
      console.log(
        `[PrayerScheduler] No active masjids found. If global config missing, please configure at /superadmin/jadwal-global`,
      );
    } else {
      console.log(
        `[PrayerScheduler] Sync done: ${result.succeeded} succeeded, ${result.failed} failed out of ${result.totalMasjids} masjids`,
      );
      if (result.errors.length > 0) {
        for (const e of result.errors.slice(0, 5)) {
          console.warn(`[PrayerScheduler] Error: [${e.masjidName}] ${e.error}`);
        }
      }
    }
  } catch (err) {
    console.error("[PrayerScheduler] Unexpected error:", err);
  } finally {
    isRunning = false;
  }
}

export function startPrayerScheduler(): void {
  if (schedulerTimer) return;

  console.log(
    `[PrayerScheduler] Starting — interval every ${INTERVAL_MS / 60000} minutes`,
  );

  // Jalankan sekali langsung saat startup
  refreshAllSchedules();

  // Lalu setiap 15 menit
  schedulerTimer = setInterval(refreshAllSchedules, INTERVAL_MS);
}

export function stopPrayerScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log("[PrayerScheduler] Stopped");
  }
}

export { refreshAllSchedules };
