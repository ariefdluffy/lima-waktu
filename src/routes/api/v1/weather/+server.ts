import { json, type RequestHandler } from "@sveltejs/kit";

// Server-side cache — shared across all requests
const cache = new Map<
  string,
  { temp: number; code: number; fetchedAt: number }
>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit

// Jika daily limit kena, tunggu sampai tengah malam UTC
let dailyLimitUntil = 0;

function msTillMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return midnight.getTime() - now.getTime();
}

export const GET: RequestHandler = async ({ url }) => {
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return json(
      { ok: false, message: "lat dan lon wajib diisi" },
      { status: 400 },
    );
  }

  const cacheKey = `${lat},${lon}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  // Kembalikan cache jika masih valid
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return json({
      ok: true,
      temp: cached.temp,
      code: cached.code,
      cached: true,
    });
  }

  // Daily limit masih aktif — kembalikan cache lama atau error
  if (now < dailyLimitUntil) {
    if (cached) {
      return json({
        ok: true,
        temp: cached.temp,
        code: cached.code,
        cached: true,
      });
    }
    return json({ ok: false, message: "Daily limit" }, { status: 429 });
  }

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto&forecast_days=1`,
      { signal: AbortSignal.timeout(8000) },
    );

    if (res.status === 429) {
      dailyLimitUntil = now + msTillMidnightUTC();
      if (cached) {
        return json({
          ok: true,
          temp: cached.temp,
          code: cached.code,
          cached: true,
        });
      }
      return json({ ok: false, message: "Rate limited" }, { status: 429 });
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      // Daily API limit
      if (body?.reason?.includes("Daily API request limit")) {
        dailyLimitUntil = now + msTillMidnightUTC();
        if (cached) {
          return json({
            ok: true,
            temp: cached.temp,
            code: cached.code,
            cached: true,
          });
        }
        return json({ ok: false, message: "Daily limit" }, { status: 429 });
      }
      return json(
        { ok: false, message: `Upstream error ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    // Cek error di body (Open-Meteo kadang return 200 tapi ada error)
    if (data?.error) {
      if (data.reason?.includes("Daily API request limit")) {
        dailyLimitUntil = now + msTillMidnightUTC();
      }
      if (cached) {
        return json({
          ok: true,
          temp: cached.temp,
          code: cached.code,
          cached: true,
        });
      }
      return json(
        { ok: false, message: data.reason ?? "Error" },
        { status: 429 },
      );
    }

    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weathercode;
    cache.set(cacheKey, { temp, code, fetchedAt: now });

    return json({ ok: true, temp, code, cached: false });
  } catch (e) {
    if (cached) {
      return json({
        ok: true,
        temp: cached.temp,
        code: cached.code,
        cached: true,
      });
    }
    return json(
      { ok: false, message: "Gagal mengambil data cuaca" },
      { status: 502 },
    );
  }
};
