import { db } from "$lib/server/db";
import { prayerProviders } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

// --- Tipe Data ---

export type PrayerTimesRaw = {
  imsak: string;
  subuh: string;
  sunrise: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
};

export type FetchResult =
  | {
      success: true;
      data: PrayerTimesRaw;
    }
  | {
      success: false;
      error: string;
    };

type ProviderFetchFn = (params: {
  dateYmd: string; // YYYY-MM-DD
  latitude: string;
  longitude: string;
  timezone: string;
  methodCode?: string; // methodCode dari prayerCalculationMethods
  baseUrl: string;
  apiKey?: string | null;
}) => Promise<FetchResult>;

// --- Registry Provider ---

const providerRegistry = new Map<string, ProviderFetchFn>();

function registerProvider(key: string, fn: ProviderFetchFn) {
  providerRegistry.set(key, fn);
}

// ============================================================
// Provider: Aladhan (api.aladhan.com)
// Docs: https://aladhan.com/prayer-times-api
// ============================================================
registerProvider(
  "aladhan",
  async ({ dateYmd, latitude, longitude, timezone, methodCode, baseUrl }) => {
    try {
      const dateParts = dateYmd.split("-");
      const day = parseInt(dateParts[2], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[0], 10);

      let url = `${baseUrl.replace(/\/$/, "")}/timings/${day}-${month}-${year}`;
      url += `?latitude=${encodeURIComponent(latitude)}`;
      url += `&longitude=${encodeURIComponent(longitude)}`;
      url += `&timezonestring=${encodeURIComponent(timezone)}`;

      if (methodCode) {
        url += `&method=${encodeURIComponent(methodCode)}`;
      }

      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return {
          success: false,
          error: `Aladhan HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const json = (await res.json()) as {
        code?: number;
        data?: { timings?: Record<string, string> };
      };

      if (json.code !== 200 || !json.data?.timings) {
        return { success: false, error: "Aladhan response format invalid" };
      }

      const t = json.data.timings;

      // Aladhan returns "Imsak", "Fajr", "Sunrise", "Dhuha", "Dhuhr", "Asr", "Maghrib", "Isha"
      return {
        success: true,
        data: {
          imsak: normalizeTime(t.Imsak),
          subuh: normalizeTime(t.Fajr),
          sunrise: normalizeTime(t.Sunrise),
          dhuha: normalizeTime(t.Dhuha),
          dzuhur: normalizeTime(t.Dhuhr),
          ashar: normalizeTime(t.Asr),
          maghrib: normalizeTime(t.Maghrib),
          isya: normalizeTime(t.Isha),
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Aladhan fetch failed: ${msg}` };
    }
  },
);

// ============================================================
// Provider: MyQuran (api.myquran.com)
// Docs: https://myquran.github.io/api-docs/
// Catatan: MyQuran pake city ID (kab/kota), bukan lat/lng.
// Untuk support lat/lng, kita perlu mapping terpisah.
// Sementara gunakan endpoint jadwal berdasarkan kota + tanggal.
// ============================================================
registerProvider("myquran", async ({ dateYmd, baseUrl, methodCode }) => {
  try {
    const dateParts = dateYmd.split("-");
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];

    // MyQuran butuh cityId — simpan di methodCode
    // Format: methodCode = "cityId" (misal "1301" untuk Jakarta Pusat)
    // Jika methodCode bukan angka murni (misal "20" dari Aladhan method), tolak lebih awal
    // dengan pesan yang jelas agar admin tahu harus isi city ID yang benar.
    if (!methodCode || !/^\d{3,}$/.test(methodCode)) {
      return {
        success: false,
        error: `MyQuran butuh city ID (3+ digit angka) di field Method Code, bukan "${methodCode ?? "kosong"}". Contoh: 1301 (Jakarta Pusat), 3471 (Yogyakarta). Cek daftar di https://api.myquran.com/v2/sholat/kota/semua`,
      };
    }

    const url = `${baseUrl.replace(/\/$/, "")}/sholat/jadwal/${methodCode}/${year}/${month}/${day}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      // Coba baca body untuk detail error
      let detail = res.statusText;
      try {
        const errBody = await res.text();
        if (errBody) detail = errBody.slice(0, 200);
      } catch {
        /* ignore */
      }
      return {
        success: false,
        error: `MyQuran HTTP ${res.status} untuk cityId=${methodCode} tanggal=${dateYmd}: ${detail}`,
      };
    }

    const json = (await res.json()) as {
      status?: boolean;
      data?: {
        lokasi?: string;
        jadwal?: {
          imsak?: string;
          subuh?: string;
          terbit?: string;
          dhuha?: string;
          dzuhur?: string;
          ashar?: string;
          maghrib?: string;
          isya?: string;
          tanggal?: string;
        };
      };
    };

    if (!json.status || !json.data?.jadwal) {
      return { success: false, error: "MyQuran response format invalid" };
    }

    const j = json.data.jadwal;

    return {
      success: true,
      data: {
        imsak: normalizeTime(j.imsak),
        subuh: normalizeTime(j.subuh),
        sunrise: normalizeTime(j.terbit),
        dhuha: normalizeTime(j.dhuha),
        dzuhur: normalizeTime(j.dzuhur),
        ashar: normalizeTime(j.ashar),
        maghrib: normalizeTime(j.maghrib),
        isya: normalizeTime(j.isya),
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `MyQuran fetch failed: ${msg}` };
  }
});

// ============================================================
// Provider: Generic API (custom provider via baseUrl)
// Format response harus sesuai struktur { data: { timings: {...} } }
// atau format MyQuran-like. Coba kedua format.
// ============================================================
registerProvider(
  "generic",
  async ({ dateYmd, latitude, longitude, timezone, baseUrl, apiKey }) => {
    try {
      let url = baseUrl;
      // Replace placeholders
      url = url.replace(/\{date\}/g, dateYmd);
      url = url.replace(/\{latitude\}/g, encodeURIComponent(latitude));
      url = url.replace(/\{longitude\}/g, encodeURIComponent(longitude));
      url = url.replace(/\{timezone\}/g, encodeURIComponent(timezone));

      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        return {
          success: false,
          error: `Generic HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const json = (await res.json()) as Record<string, unknown>;

      // Coba parse format Aladhan-like
      const aladhanData = (
        json as { data?: { timings?: Record<string, string> } }
      ).data;
      if (aladhanData?.timings) {
        const t = aladhanData.timings;
        return {
          success: true,
          data: {
            imsak: normalizeTime(t.Imsak),
            subuh: normalizeTime(t.Fajr),
            sunrise: normalizeTime(t.Sunrise),
            dhuha: normalizeTime(t.Dhuha),
            dzuhur: normalizeTime(t.Dhuhr),
            ashar: normalizeTime(t.Asr),
            maghrib: normalizeTime(t.Maghrib),
            isya: normalizeTime(t.Isha),
          },
        };
      }

      // Coba parse format MyQuran-like
      const myquranData = (
        json as { data?: { jadwal?: Record<string, string> } }
      ).data;
      if (myquranData?.jadwal) {
        const j = myquranData.jadwal;
        return {
          success: true,
          data: {
            imsak: normalizeTime(j.imsak),
            subuh: normalizeTime(j.subuh),
            sunrise: normalizeTime(j.terbit),
            dhuha: normalizeTime(j.dhuha),
            dzuhur: normalizeTime(j.dzuhur),
            ashar: normalizeTime(j.ashar),
            maghrib: normalizeTime(j.maghrib),
            isya: normalizeTime(j.isya),
          },
        };
      }

      return {
        success: false,
        error: "Generic API: response format unrecognized",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Generic fetch failed: ${msg}` };
    }
  },
);

// --- Helpers ---

function normalizeTime(value: string | null | undefined): string {
  if (!value) return "00:00";
  const parts = value.trim().split(":");
  if (parts.length < 2) return "00:00";
  return `${pad2(Number(parts[0]))}:${pad2(Number(parts[1]))}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// --- Public API ---

/**
 * Cari provider yang terdaftar di DB berdasarkan providerKey.
 * Fallback: coba generic provider jika providerKey tidak dikenal.
 */
async function getProviderFn(
  providerKey: string,
): Promise<ProviderFetchFn | null> {
  const fn = providerRegistry.get(providerKey);
  if (fn) return fn;

  // Cek apakah providerKey ada di DB (custom provider)
  const [row] = await db
    .select({ providerKey: prayerProviders.providerKey })
    .from(prayerProviders)
    .where(eq(prayerProviders.providerKey, providerKey))
    .limit(1);

  if (row) {
    // Custom provider yang tidak built-in — pakai generic fetcher
    return providerRegistry.get("generic") ?? null;
  }

  return null;
}

/**
 * Fetch jadwal sholat dari provider tertentu.
 */
export async function fetchFromProvider(
  providerKey: string,
  params: {
    dateYmd: string;
    latitude: string;
    longitude: string;
    timezone: string;
    methodCode?: string;
    baseUrl: string;
    apiKey?: string | null;
  },
): Promise<FetchResult> {
  const fn = await getProviderFn(providerKey);
  if (!fn) {
    return { success: false, error: `Unknown provider: ${providerKey}` };
  }
  return fn(params);
}

/**
 * Daftar provider key yang punya implementasi built-in
 */
export function getBuiltInProviderKeys(): string[] {
  return Array.from(providerRegistry.keys()).filter((k) => k !== "generic");
}
