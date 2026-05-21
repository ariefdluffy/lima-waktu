import { json, type RequestHandler } from "@sveltejs/kit";

// Server-side cache — shared across all requests
const cache = new Map<string, { temp: number; code: number; fetchedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit

export const GET: RequestHandler = async ({ url }) => {
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return json({ ok: false, message: "lat dan lon wajib diisi" }, { status: 400 });
  }

  const cacheKey = `${lat},${lon}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  // Kembalikan cache jika masih valid
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return json({ ok: true, temp: cached.temp, code: cached.code, cached: true });
  }

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto&forecast_days=1`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (res.status === 429) {
      // Kembalikan cache lama jika ada
      if (cached) {
        return json({ ok: true, temp: cached.temp, code: cached.code, cached: true });
      }
      return json({ ok: false, message: "Rate limited" }, { status: 429 });
    }

    if (!res.ok) {
      return json({ ok: false, message: `Upstream error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weathercode;

    cache.set(cacheKey, { temp, code, fetchedAt: now });

    return json({ ok: true, temp, code, cached: false });
  } catch (e) {
    // Kembalikan cache lama jika ada
    if (cached) {
      return json({ ok: true, temp: cached.temp, code: cached.code, cached: true });
    }
    return json({ ok: false, message: "Gagal mengambil data cuaca" }, { status: 502 });
  }
};
