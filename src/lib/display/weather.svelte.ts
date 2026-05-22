// ── Reactive Weather State ───────────────────────────────────────
export const weather = $state({
  temp: null as number | null,
  code: null as number | null,
  loading: true,
  fetched: false,
  lastFetched: 0,
});

const WEATHER_CACHE_MS = 30 * 60 * 1000; // 30 menit

// ── Public ───────────────────────────────────────────────────────
export async function fetchWeather(lat: string, lon: string) {
  const now = Date.now();
  if (weather.fetched && now - weather.lastFetched < WEATHER_CACHE_MS) {
    weather.loading = false;
    return;
  }
  try {
    const res = await fetch(`/api/v1/weather?lat=${lat}&lon=${lon}`);
    const json = await res.json();
    if (json.ok) {
      weather.temp = json.temp;
      weather.code = json.code;
      weather.lastFetched = now;
      weather.fetched = true;
    } else {
      if (!weather.fetched) {
        weather.temp = null;
        weather.code = null;
      }
    }
  } catch {
    if (!weather.fetched) {
      weather.temp = null;
      weather.code = null;
    }
  } finally {
    weather.loading = false;
  }
}

export function skipWeather() {
  weather.loading = false;
}
