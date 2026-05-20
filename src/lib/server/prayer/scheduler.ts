import { db } from "$lib/server/db";
import { devices, masjids } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import {
  resolvePrayerScheduleForMasjid,
  todayYmdInJakarta,
} from "./resolver";
import { setCachedSchedule } from "./cache";

const INTERVAL_MS = 15 * 60 * 1000; // 15 menit
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

async function refreshAllSchedules(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const today = todayYmdInJakarta();

    // Ambil semua masjid yang punya device aktif
    const activeDevices = await db
      .selectDistinct({ masjidId: devices.masjidId })
      .from(devices)
      .where(eq(devices.isActive, 1));

    if (activeDevices.length === 0) return;

    const masjidIds = activeDevices.map((d) => d.masjidId);

    console.log(
      `[PrayerScheduler] Refreshing ${masjidIds.length} masjid(s) for ${today}...`,
    );

    await Promise.allSettled(
      masjidIds.map(async (masjidId) => {
        try {
          const schedule = await resolvePrayerScheduleForMasjid(
            masjidId,
            today,
          );
          setCachedSchedule(masjidId, today, schedule);
          console.log(`[PrayerScheduler] Cached schedule for masjid ${masjidId}`);
        } catch (err) {
          console.error(
            `[PrayerScheduler] Failed to refresh masjid ${masjidId}:`,
            err,
          );
        }
      }),
    );

    console.log(`[PrayerScheduler] Refresh done at ${new Date().toISOString()}`);
  } catch (err) {
    console.error("[PrayerScheduler] Unexpected error:", err);
  } finally {
    isRunning = false;
  }
}

export function startPrayerScheduler(): void {
  if (schedulerTimer) return; // sudah berjalan

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
