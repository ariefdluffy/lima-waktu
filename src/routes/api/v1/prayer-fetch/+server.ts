import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent } from "$lib/server/auth/basic";
import { db } from "$lib/server/db";
import { globalPrayerConfig, prayerProviders } from "$lib/server/db/schema";
import { fetchFromProvider } from "$lib/server/prayer/provider";
import { eq } from "drizzle-orm";

// MyQuran API docs:
// Search kota : GET https://api.myquran.com/v2/sholat/kota/cari/{keyword}
// Jadwal harian: GET https://api.myquran.com/v2/sholat/jadwal/{kota_id}/{tahun}/{bulan}/{hari}
// Jadwal bulanan: GET https://api.myquran.com/v2/sholat/jadwal/{kota_id}/{tahun}/{bulan}

type MyQuranJadwal = {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
};

type PrayerSchedule = {
  date: string;
  imsakTime: string;
  subuhTime: string;
  sunriseTime: string;
  dhuhaTime: string;
  dzuhurTime: string;
  asharTime: string;
  maghribTime: string;
  isyaTime: string;
};

/**
 * Get provider configuration from database
 */
async function getProviderConfig(providerKey: string) {
  const [provider] = await db
    .select()
    .from(prayerProviders)
    .where(eq(prayerProviders.providerKey, providerKey))
    .limit(1);

  return provider;
}

/**
 * Get default provider and global config
 */
async function getGlobalConfig() {
  const [config] = await db.select().from(globalPrayerConfig).limit(1);
  return config;
}

/**
 * Get default provider from global config
 */
async function getDefaultProvider() {
  const config = await getGlobalConfig();

  if (!config?.primaryProviderId) {
    return "myquran"; // Fallback to MyQuran
  }

  const [provider] = await db
    .select()
    .from(prayerProviders)
    .where(eq(prayerProviders.id, config.primaryProviderId))
    .limit(1);

  return provider?.providerKey ?? "myquran";
}

export const GET: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { url } = event;
  const action = url.searchParams.get("action");
  const providerParam = url.searchParams.get("provider")?.trim();

  // Use default provider if not specified
  const provider: string = providerParam || (await getDefaultProvider());

  // ----------------------------------------------------------------
  // action=search  →  cari kota berdasarkan keyword (MyQuran only)
  // ----------------------------------------------------------------
  if (action === "search") {
    if (provider !== "myquran") {
      return json(
        {
          ok: false,
          message: `Provider '${provider}' tidak mendukung pencarian kota. Gunakan provider 'myquran'.`,
        },
        { status: 400 },
      );
    }

    const keyword = url.searchParams.get("keyword")?.trim();
    if (!keyword || keyword.length < 2) {
      return json(
        { ok: false, message: "Keyword minimal 2 karakter" },
        { status: 400 },
      );
    }

    try {
      const res = await fetch(
        `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(keyword)}`,
      );
      if (!res.ok) {
        return json(
          { ok: false, message: "Gagal mengambil data kota dari MyQuran" },
          { status: 502 },
        );
      }
      const data = await res.json();
      return json({ ok: true, data: data.data ?? [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return json(
        { ok: false, message: `Gagal mencari kota: ${msg}` },
        { status: 500 },
      );
    }
  }

  // ----------------------------------------------------------------
  // action=schedule  →  jadwal satu hari
  // ----------------------------------------------------------------
  if (action === "schedule") {
    const dateRaw = url.searchParams.get("date")?.trim(); // YYYY-MM-DD

    if (!dateRaw || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      return json(
        { ok: false, message: "Parameter date harus format YYYY-MM-DD" },
        { status: 400 },
      );
    }

    // MyQuran: gunakan kota_id
    if (provider === "myquran") {
      const kotaId = url.searchParams.get("kota_id")?.trim();
      if (!kotaId) {
        return json(
          {
            ok: false,
            message: "Parameter kota_id wajib diisi untuk provider myquran",
          },
          { status: 400 },
        );
      }

      try {
        const [year, month, day] = dateRaw.split("-");
        const res = await fetch(
          `https://api.myquran.com/v2/sholat/jadwal/${encodeURIComponent(kotaId)}/${year}/${month}/${day}`,
        );
        if (!res.ok) {
          return json(
            { ok: false, message: "Gagal mengambil jadwal dari MyQuran" },
            { status: 502 },
          );
        }
        const data = await res.json();
        const jadwal: MyQuranJadwal | undefined = data?.data?.jadwal;
        if (!jadwal) {
          return json(
            { ok: false, message: "Data jadwal tidak ditemukan" },
            { status: 404 },
          );
        }

        return json({
          ok: true,
          data: {
            imsakTime: jadwal.imsak,
            subuhTime: jadwal.subuh,
            sunriseTime: jadwal.terbit,
            dhuhaTime: jadwal.dhuha,
            dzuhurTime: jadwal.dzuhur,
            asharTime: jadwal.ashar,
            maghribTime: jadwal.maghrib,
            isyaTime: jadwal.isya,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return json(
          { ok: false, message: `Gagal mengambil jadwal: ${msg}` },
          { status: 500 },
        );
      }
    }

    // Aladhan & Generic: gunakan latitude, longitude, timezone
    // Aladhan & Generic: gunakan latitude, longitude, timezone
    const latitudeRaw = url.searchParams.get("latitude")?.trim();
    const longitudeRaw = url.searchParams.get("longitude")?.trim();
    const timezoneRaw = url.searchParams.get("timezone")?.trim();

    if (!latitudeRaw || !longitudeRaw || !timezoneRaw) {
      return json(
        {
          ok: false,
          message: `Provider '${provider}' memerlukan parameter: latitude, longitude, timezone`,
        },
        { status: 400 },
      );
    }

    const latitude = latitudeRaw;
    const longitude = longitudeRaw;
    const timezone = timezoneRaw;

    try {
      const providerConfig = await getProviderConfig(provider);
      if (!providerConfig) {
        return json(
          { ok: false, message: `Provider '${provider}' tidak ditemukan` },
          { status: 404 },
        );
      }

      const globalConfig = await getGlobalConfig();
      const baseUrl = providerConfig.baseUrl || "https://api.aladhan.com/v1";
      const result = await fetchFromProvider(provider, {
        dateYmd: dateRaw,
        latitude,
        longitude,
        timezone,
        baseUrl,
        apiKey: globalConfig?.apiKey || null,
      });

      if (!result.success) {
        return json({ ok: false, message: result.error }, { status: 502 });
      }

      return json({
        ok: true,
        data: {
          imsakTime: result.data.imsak,
          subuhTime: result.data.subuh,
          sunriseTime: result.data.sunrise,
          dhuhaTime: result.data.dhuha,
          dzuhurTime: result.data.dzuhur,
          asharTime: result.data.ashar,
          maghribTime: result.data.maghrib,
          isyaTime: result.data.isya,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return json(
        { ok: false, message: `Gagal mengambil jadwal: ${msg}` },
        { status: 500 },
      );
    }
  }

  // ----------------------------------------------------------------
  // action=bulk  →  jadwal satu bulan penuh
  // ----------------------------------------------------------------
  if (action === "bulk") {
    const year = url.searchParams.get("year")?.trim();
    const month = url.searchParams.get("month")?.trim(); // 1-12

    if (!year || !month) {
      return json(
        {
          ok: false,
          message: "Parameter year dan month wajib diisi",
        },
        { status: 400 },
      );
    }

    const paddedMonth = month.padStart(2, "0");

    // MyQuran: gunakan kota_id
    if (provider === "myquran") {
      const kotaId = url.searchParams.get("kota_id")?.trim();
      if (!kotaId) {
        return json(
          {
            ok: false,
            message: "Parameter kota_id wajib diisi untuk provider myquran",
          },
          { status: 400 },
        );
      }

      try {
        const res = await fetch(
          `https://api.myquran.com/v2/sholat/jadwal/${encodeURIComponent(kotaId)}/${year}/${paddedMonth}`,
        );
        if (!res.ok) {
          return json(
            {
              ok: false,
              message: "Gagal mengambil jadwal bulanan dari MyQuran",
            },
            { status: 502 },
          );
        }
        const data = await res.json();
        const jadwalList: MyQuranJadwal[] = data?.data?.jadwal ?? [];

        if (!jadwalList.length) {
          return json(
            { ok: false, message: "Data jadwal bulanan tidak ditemukan" },
            { status: 404 },
          );
        }

        // Normalise ke format yang dipakai form
        const schedules = jadwalList
          .map((j) => {
            // j.tanggal bisa berupa number (1) atau string ("Jumat, 01/05/2026")
            // Ekstrak angka hari saja
            let dayNum: number;
            if (typeof j.tanggal === "number") {
              dayNum = j.tanggal;
            } else {
              // Format: "Jumat, 01/05/2026" — ambil bagian DD dari DD/MM/YYYY
              const match = String(j.tanggal).match(/(\d{1,2})\/\d{2}\/\d{4}/);
              dayNum = match ? parseInt(match[1], 10) : NaN;
            }
            const dayStr = String(dayNum).padStart(2, "0");
            return {
              date: `${year}-${paddedMonth}-${dayStr}`,
              imsakTime: j.imsak,
              subuhTime: j.subuh,
              sunriseTime: j.terbit,
              dhuhaTime: j.dhuha,
              dzuhurTime: j.dzuhur,
              asharTime: j.ashar,
              maghribTime: j.maghrib,
              isyaTime: j.isya,
            };
          })
          .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.date));

        return json({ ok: true, data: schedules });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return json(
          { ok: false, message: `Gagal mengambil jadwal bulanan: ${msg}` },
          { status: 500 },
        );
      }
    }

    // Aladhan & Generic: gunakan latitude, longitude, timezone
    // Aladhan & Generic: gunakan latitude, longitude, timezone
    const latitudeRawBulk = url.searchParams.get("latitude")?.trim();
    const longitudeRawBulk = url.searchParams.get("longitude")?.trim();
    const timezoneRawBulk = url.searchParams.get("timezone")?.trim();

    if (!latitudeRawBulk || !longitudeRawBulk || !timezoneRawBulk) {
      return json(
        {
          ok: false,
          message: `Provider '${provider}' memerlukan parameter: latitude, longitude, timezone`,
        },
        { status: 400 },
      );
    }

    try {
      const providerConfig = await getProviderConfig(provider);
      if (!providerConfig) {
        return json(
          { ok: false, message: `Provider '${provider}' tidak ditemukan` },
          { status: 404 },
        );
      }

      const globalConfig = await getGlobalConfig();
      const baseUrl = (
        providerConfig.baseUrl || "https://api.aladhan.com/v1"
      ).replace(/\/$/, "");
      const apiKey = globalConfig?.apiKey || null;
      const methodCode = globalConfig?.defaultMethodId ? undefined : undefined; // resolved below

      // Ambil methodCode dari globalConfig jika ada
      let resolvedMethodCode: string | undefined;
      if (globalConfig?.defaultMethodId) {
        const { prayerCalculationMethods } =
          await import("$lib/server/db/schema");
        const [method] = await db
          .select({ methodCode: prayerCalculationMethods.methodCode })
          .from(prayerCalculationMethods)
          .where(eq(prayerCalculationMethods.id, globalConfig.defaultMethodId))
          .limit(1);
        resolvedMethodCode = method?.methodCode ?? undefined;
      }

      // Untuk Aladhan: gunakan endpoint /calendar untuk satu request per bulan
      if (provider === "aladhan") {
        let calUrl = `${baseUrl}/calendar/${year}/${paddedMonth}`;
        calUrl += `?latitude=${encodeURIComponent(latitudeRawBulk)}`;
        calUrl += `&longitude=${encodeURIComponent(longitudeRawBulk)}`;
        calUrl += `&timezonestring=${encodeURIComponent(timezoneRawBulk)}`;
        if (resolvedMethodCode) {
          calUrl += `&method=${encodeURIComponent(resolvedMethodCode)}`;
        }

        const res = await fetch(calUrl, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          let detail = res.statusText;
          try {
            detail = (await res.text()).slice(0, 200);
          } catch {
            /* ignore */
          }
          return json(
            {
              ok: false,
              message: `Aladhan calendar HTTP ${res.status}: ${detail}`,
            },
            { status: 502 },
          );
        }

        const data = (await res.json()) as {
          code?: number;
          data?: Array<{
            timings?: Record<string, string>;
            date?: { gregorian?: { date?: string } };
          }>;
        };

        if (
          data.code !== 200 ||
          !Array.isArray(data.data) ||
          !data.data.length
        ) {
          return json(
            {
              ok: false,
              message: "Aladhan calendar: format response tidak valid",
            },
            { status: 502 },
          );
        }

        function pad2(n: number) {
          return String(n).padStart(2, "0");
        }
        function normalizeTime(v: string | undefined): string {
          if (!v) return "00:00";
          const match = v.trim().match(/^(\d{1,2})\s*:\s*(\d{1,2})/);
          if (!match) return "00:00";
          const h = Number(match[1]);
          const m = Number(match[2]);
          if (isNaN(h) || isNaN(m)) return "00:00";
          return `${pad2(h)}:${pad2(m)}`;
        }

        const schedules: PrayerSchedule[] = data.data.map((entry, idx) => {
          const t = entry.timings ?? {};
          // date format dari Aladhan: "DD-MM-YYYY"
          const rawDate = entry.date?.gregorian?.date ?? "";
          let dateYmd: string;
          if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
            const [dd, mm, yyyy] = rawDate.split("-");
            dateYmd = `${yyyy}-${mm}-${dd}`;
          } else {
            // fallback: hitung dari index
            dateYmd = `${year}-${paddedMonth}-${pad2(idx + 1)}`;
          }
          return {
            date: dateYmd,
            imsakTime: normalizeTime(t.Imsak),
            subuhTime: normalizeTime(t.Fajr),
            sunriseTime: normalizeTime(t.Sunrise),
            dhuhaTime: normalizeTime(t.Dhuha),
            dzuhurTime: normalizeTime(t.Dhuhr),
            asharTime: normalizeTime(t.Asr),
            maghribTime: normalizeTime(t.Maghrib),
            isyaTime: normalizeTime(t.Isha),
          };
        });

        return json({
          ok: true,
          data: schedules,
          totalRequested: schedules.length,
          totalSucceeded: schedules.length,
          totalFailed: 0,
        });
      }

      // Generic provider: fallback ke loop per-hari dengan concurrency terbatas
      const daysInMonth = new Date(
        parseInt(year),
        parseInt(month),
        0,
      ).getDate();
      const schedules: PrayerSchedule[] = [];
      const failedDates: Array<{ date: string; error: string }> = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, "0");
        const dateYmd = `${year}-${paddedMonth}-${dayStr}`;

        // Retry max 2x
        let result = await fetchFromProvider(provider, {
          dateYmd,
          latitude: latitudeRawBulk,
          longitude: longitudeRawBulk,
          timezone: timezoneRawBulk,
          baseUrl,
          apiKey,
          methodCode: resolvedMethodCode,
        });
        if (!result.success) {
          await new Promise((r) => setTimeout(r, 500));
          result = await fetchFromProvider(provider, {
            dateYmd,
            latitude: latitudeRawBulk,
            longitude: longitudeRawBulk,
            timezone: timezoneRawBulk,
            baseUrl,
            apiKey,
            methodCode: resolvedMethodCode,
          });
        }

        if (result.success) {
          schedules.push({
            date: dateYmd,
            imsakTime: result.data.imsak,
            subuhTime: result.data.subuh,
            sunriseTime: result.data.sunrise,
            dhuhaTime: result.data.dhuha,
            dzuhurTime: result.data.dzuhur,
            asharTime: result.data.ashar,
            maghribTime: result.data.maghrib,
            isyaTime: result.data.isya,
          });
        } else {
          failedDates.push({ date: dateYmd, error: result.error });
        }

        if (day < daysInMonth) await new Promise((r) => setTimeout(r, 150));
      }

      if (!schedules.length) {
        return json(
          {
            ok: false,
            message: "Gagal mengambil data jadwal untuk bulan ini",
            failedDates,
          },
          { status: 502 },
        );
      }

      return json({
        ok: true,
        data: schedules,
        totalRequested: daysInMonth,
        totalSucceeded: schedules.length,
        totalFailed: failedDates.length,
        failedDates: failedDates.length > 0 ? failedDates : undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return json(
        { ok: false, message: `Gagal mengambil jadwal bulanan: ${msg}` },
        { status: 500 },
      );
    }
  }

  return json(
    {
      ok: false,
      message:
        "Parameter action tidak valid. Gunakan: search | schedule | bulk",
    },
    { status: 400 },
  );
};
