import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { eq } from "drizzle-orm";
import { masjids } from "$lib/server/db/schema";

export const POST: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin", "admin_masjid"]))
    return json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { request, url } = event;
  const body = await request.json().catch(() => null);
  if (!body || !body.city)
    return json(
      { ok: false, message: "Nama kota wajib diisi" },
      { status: 400 },
    );

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );
  const cityName = body.city.trim();

  // Helper: query Open-Meteo untuk satu nama kota
  async function fetchGeoResult(name: string) {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=id&format=json`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.results?.[0] ?? null;
  }

  // Coba nama lengkap dulu, lalu fallback dengan memotong kata terakhir
  // Contoh: "Jakarta Selatan" → "Jakarta Selatan" → "Jakarta"
  let result: any = null;
  let triedName = cityName;
  try {
    const parts = cityName.split(/\s+/);
    for (let i = parts.length; i >= 1; i--) {
      triedName = parts.slice(0, i).join(" ");
      result = await fetchGeoResult(triedName);
      if (result?.latitude && result?.longitude) break;
      result = null;
    }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return json(
      {
        ok: false,
        message: isTimeout
          ? "Layanan geocoding timeout, coba lagi"
          : "Gagal menghubungi layanan geocoding",
      },
      { status: 502 },
    );
  }

  if (!result?.latitude || !result?.longitude) {
    return json(
      { ok: false, message: `Koordinat untuk "${cityName}" tidak ditemukan` },
      { status: 404 },
    );
  }

  const lat = result.latitude.toFixed(7);
  const lon = result.longitude.toFixed(7);

  await db
    .update(masjids)
    .set({
      latitude: String(lat),
      longitude: String(lon),
      city: cityName,
      timezone: result.timezone ?? undefined,
    })
    .where(eq(masjids.id, masjidId));

  // Jika fallback terjadi, beri tahu nama yang berhasil di-resolve
  const resolvedNote = triedName !== cityName
    ? ` (via "${triedName}")`
    : "";

  return json({
    ok: true,
    resolvedName: triedName,
    note: resolvedNote ? `Koordinat ditemukan via "${triedName}"` : null,
    data: {
      latitude: lat,
      longitude: lon,
      city: cityName,
      timezone: result.timezone ?? "Asia/Jakarta",
    },
  });
};
