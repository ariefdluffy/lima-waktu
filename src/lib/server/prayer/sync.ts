import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import {
  globalPrayerConfig,
  prayerProviderLogs,
  prayerScheduleRawSources,
  prayerSchedules,
  prayerSyncJobs,
  masjids,
  prayerProviders,
  prayerCalculationMethods,
} from "$lib/server/db/schema";
import { fetchFromProvider } from "./provider";
import { invalidateCache } from "./cache";
import type { PrayerTimesRaw } from "./provider";

export type SyncResult = {
  totalMasjids: number;
  succeeded: number;
  failed: number;
  errors: Array<{ masjidId: string; masjidName: string; error: string }>;
};

/**
 * Baca globalPrayerConfig + data provider/method + semua masjid aktif,
 * lalu fetch jadwal untuk hari ini (beserta H+6 ke depan), simpan ke DB.
 *
 * Tiap masjid pake timezone masing-masing (masjids.timezone).
 * globalPrayerConfig.defaultTimezone cuma fallback kalo masjid gak punya tz.
 */
export async function syncAllMasjids(): Promise<SyncResult> {
  const result: SyncResult = {
    totalMasjids: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  // 1. Baca global config
  const [config] = await db
    .select()
    .from(globalPrayerConfig)
    .where(eq(globalPrayerConfig.id, 1))
    .limit(1);

  if (!config) {
    result.errors.push({
      masjidId: "",
      masjidName: "",
      error:
        "GlobalPrayerConfig belum dikonfigurasi. Isi dulu di /superadmin/jadwal-global",
    });
    return result;
  }

  const primaryProviderId = config.primaryProviderId;
  const fallbackProviderId = config.fallbackProviderId;
  const defaultMethodId = config.defaultMethodId;
  const defaultTimezone = config.defaultTimezone ?? "Asia/Jakarta";

  if (!primaryProviderId) {
    result.errors.push({
      masjidId: "",
      masjidName: "",
      error: "Provider Utama belum dipilih di konfigurasi global",
    });
    return result;
  }

  // 2. Baca data provider + method dari DB
  const [primaryProvider, fallbackProvider, defaultMethod] = await Promise.all([
    db
      .select()
      .from(prayerProviders)
      .where(eq(prayerProviders.id, primaryProviderId))
      .limit(1)
      .then((r) => r[0] ?? null),
    fallbackProviderId
      ? db
          .select()
          .from(prayerProviders)
          .where(eq(prayerProviders.id, fallbackProviderId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    defaultMethodId
      ? db
          .select()
          .from(prayerCalculationMethods)
          .where(eq(prayerCalculationMethods.id, defaultMethodId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  if (!primaryProvider) {
    result.errors.push({
      masjidId: "",
      masjidName: "",
      error: "Provider Utama tidak ditemukan di DB",
    });
    return result;
  }

  const methodCode = defaultMethod?.methodCode ?? undefined;
  const primaryApiKey = config.apiKey ?? null;

  // 3. Ambil semua masjid aktif
  const activeMasjids = await db
    .select({
      id: masjids.id,
      name: masjids.name,
      latitude: masjids.latitude,
      longitude: masjids.longitude,
      timezone: masjids.timezone,
    })
    .from(masjids)
    .where(eq(masjids.isActive, 1));

  result.totalMasjids = activeMasjids.length;

  if (activeMasjids.length === 0) {
    return result;
  }

  // 4. Buat daftar tanggal yang akan di-sync (hari ini + 6 hari ke depan)
  const dates = generateDateRange(7);

  // 5. Sync per masjid
  for (const masjid of activeMasjids) {
    const tz = masjid.timezone ?? defaultTimezone;
    const lat = masjid.latitude;
    const lng = masjid.longitude;

    if (!lat || !lng) {
      result.failed++;
      result.errors.push({
        masjidId: masjid.id,
        masjidName: masjid.name,
        error: "Koordinat (latitude/longitude) belum diisi",
      });
      continue;
    }

    let overallSuccess = true;

    for (const dateYmd of dates) {
      // Buat sync job record
      const [job] = await db.insert(prayerSyncJobs).values({
        masjidId: masjid.id,
        providerKey: primaryProvider.providerKey,
        status: "running",
        startedAt: sql`NOW()`,
      });

      const jobId = Number(job.insertId);
      let usedFallback = false;

      try {
        // Coba primary provider
        let fetchResult = await fetchFromProvider(primaryProvider.providerKey, {
          dateYmd,
          latitude: String(lat),
          longitude: String(lng),
          timezone: tz,
          methodCode,
          baseUrl: primaryProvider.baseUrl ?? "",
          apiKey: primaryApiKey,
        });

        // Jika gagal, coba fallback
        if (!fetchResult.success && fallbackProvider) {
          usedFallback = true;
          fetchResult = await fetchFromProvider(fallbackProvider.providerKey, {
            dateYmd,
            latitude: String(lat),
            longitude: String(lng),
            timezone: tz,
            methodCode,
            baseUrl: fallbackProvider.baseUrl ?? "",
            apiKey: primaryApiKey,
          });
        }

        if (!fetchResult.success) {
          overallSuccess = false;
          console.warn(
            `[PrayerScheduler] Fetch failed [${masjid.name}] ${dateYmd}: ${fetchResult.error}`,
          );
          await db
            .update(prayerSyncJobs)
            .set({
              status: "failed",
              finishedAt: sql`NOW()`,
              errorMessage: fetchResult.error,
            })
            .where(eq(prayerSyncJobs.id, jobId));

          // Log ke prayerProviderLogs
          await db.insert(prayerProviderLogs).values({
            providerId: usedFallback
              ? fallbackProvider!.id
              : primaryProvider.id,
            requestPath: `sync/${dateYmd}`,
            responseStatus: 0,
            requestPayload: {
              masjidId: masjid.id,
              dateYmd,
              provider: usedFallback
                ? fallbackProvider!.providerKey
                : primaryProvider.providerKey,
            },
            responsePayload: { error: fetchResult.error },
          });

          continue; // skip ke tanggal berikutnya
        }

        // Sukses — simpan/skip jika sudah ada jadwal manual override
        const [existing] = await db
          .select({
            id: prayerSchedules.id,
            isManualOverride: prayerSchedules.isManualOverride,
          })
          .from(prayerSchedules)
          .where(
            and(
              eq(prayerSchedules.masjidId, masjid.id),
              eq(prayerSchedules.scheduleDate, dateYmd as unknown as Date),
            ),
          )
          .limit(1);

        const currentProviderKey = usedFallback
          ? fallbackProvider!.providerKey
          : primaryProvider.providerKey;
        const sourceLabel =
          defaultMethod?.methodName ?? `${currentProviderKey} API`;

        if (existing) {
          // Jangan overwrite kalo manual override
          if (existing.isManualOverride === 1) {
            await db
              .update(prayerSyncJobs)
              .set({ status: "success", finishedAt: sql`NOW()` })
              .where(eq(prayerSyncJobs.id, jobId));
            continue;
          }

          await db
            .update(prayerSchedules)
            .set({
              ...timesToRow(fetchResult.data),
              sourceProvider: currentProviderKey,
              calculationMethod: sourceLabel,
              syncedAt: sql`NOW()`,
              isManualOverride: 0,
            })
            .where(eq(prayerSchedules.id, existing.id));
        } else {
          // Hapus data >14 hari
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 14);
          const cutoffStr = cutoffDate.toISOString().slice(0, 10);
          await db
            .delete(prayerSchedules)
            .where(
              and(
                eq(prayerSchedules.masjidId, masjid.id),
                lt(prayerSchedules.scheduleDate, cutoffStr as unknown as Date),
              ),
            );

          await db.insert(prayerSchedules).values({
            masjidId: masjid.id,
            scheduleDate: dateYmd as unknown as Date,
            ...timesToRow(fetchResult.data),
            sourceProvider: currentProviderKey,
            calculationMethod: sourceLabel,
            isManualOverride: 0,
            syncedAt: sql`NOW()`,
          });
        }

        // Simpan raw source — skip jika sudah ada untuk tanggal + provider yang sama
        const [existingRaw] = await db
          .select({ id: prayerScheduleRawSources.id })
          .from(prayerScheduleRawSources)
          .where(
            and(
              eq(prayerScheduleRawSources.masjidId, masjid.id),
              eq(
                prayerScheduleRawSources.scheduleDate,
                dateYmd as unknown as Date,
              ),
              eq(prayerScheduleRawSources.providerKey, currentProviderKey),
            ),
          )
          .limit(1);

        if (existingRaw) {
          await db
            .update(prayerScheduleRawSources)
            .set({ payload: fetchResult.data, fetchedAt: sql`NOW()` })
            .where(eq(prayerScheduleRawSources.id, existingRaw.id));
        } else {
          await db.insert(prayerScheduleRawSources).values({
            masjidId: masjid.id,
            scheduleDate: dateYmd as unknown as Date,
            providerKey: currentProviderKey,
            payload: fetchResult.data,
            fetchedAt: sql`NOW()`,
          });
        }

        // Update sync job sukses
        await db
          .update(prayerSyncJobs)
          .set({ status: "success", finishedAt: sql`NOW()` })
          .where(eq(prayerSyncJobs.id, jobId));

        // Log ke prayerProviderLogs
        await db.insert(prayerProviderLogs).values({
          providerId: usedFallback ? fallbackProvider!.id : primaryProvider.id,
          requestPath: `sync/${dateYmd}`,
          responseStatus: 200,
          requestPayload: { masjidId: masjid.id, dateYmd },
          responsePayload: { status: "ok" },
        });

        // Invalidate cache
        invalidateCache(masjid.id, dateYmd);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        overallSuccess = false;
        console.error(
          `[PrayerScheduler] Exception [${masjid.name}] ${dateYmd}: ${msg}`,
          err,
        );
        await db
          .update(prayerSyncJobs)
          .set({ status: "failed", finishedAt: sql`NOW()`, errorMessage: msg })
          .where(eq(prayerSyncJobs.id, jobId));
      }
    }

    if (overallSuccess) {
      result.succeeded++;
    } else {
      result.failed++;
      result.errors.push({
        masjidId: masjid.id,
        masjidName: masjid.name,
        error: "Beberapa tanggal gagal di-sync",
      });
    }
  }

  return result;
}

// --- Helpers ---

function timesToRow(times: PrayerTimesRaw) {
  return {
    imsakTime: times.imsak,
    subuhTime: times.subuh,
    sunriseTime: times.sunrise,
    dhuhaTime: times.dhuha,
    dzuhurTime: times.dzuhur,
    asharTime: times.ashar,
    maghribTime: times.maghrib,
    isyaTime: times.isya,
  };
}

function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}
