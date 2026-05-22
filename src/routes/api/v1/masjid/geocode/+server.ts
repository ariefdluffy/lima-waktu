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
    return json({ ok: false, message: "Nama kota wajib diisi" }, { status: 400 });

  const masjidId = await resolveMasjidIdForUser(user, url.searchParams.get("masjid_id"));
  const cityName = body.city.trim();

  // Server-side geocoding via Open-Meteo
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=id&format=json`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!geoRes.ok) {
    return json(
      { ok: false, message: "Gagal menghubungi layanan geocoding" },
      { status: 502 },
    );
  }

  const geoJson = await geoRes.json();
  const result = geoJson?.results?.[0];
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

  return json({
    ok: true,
    data: { latitude: lat, longitude: lon, city: cityName, timezone: result.timezone ?? "Asia/Jakarta" },
  });
};
