import { and, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { masjids } from "$lib/server/db/schema";
import { invalidateDisplayForMasjid } from "$lib/server/display/invalidate";

type UpdateProfileBody = {
  name?: string;
  address?: string;
  city?: string;
  district?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  hijriOffset?: number;
  adzanScreenDuration?: number;
  khusukScreenDuration?: number;
  screensaverDelayMinutes?: number;
  screensaverWakeMinutes?: number;
  screensaverMorningDelayMinutes?: number;
  screensaverMorningWakeMinutes?: number;
  logoUrl?: string;
  isActive?: boolean;
};

export const GET: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  const { url } = event;
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  const [profile] = await db
    .select()
    .from(masjids)
    .where(eq(masjids.id, masjidId))
    .limit(1);
  if (!profile)
    return json(
      { ok: false, message: "Masjid tidak ditemukan" },
      { status: 404 },
    );

  return json({ ok: true, data: profile });
};

export const PUT: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  const { request, url } = event;
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });

  if (!hasAnyRole(user, ["superadmin", "admin_masjid"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const body = (await request
    .json()
    .catch(() => null)) as UpdateProfileBody | null;
  if (!body)
    return json(
      { ok: false, message: "Body JSON tidak valid" },
      { status: 400 },
    );

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  await db
    .update(masjids)
    .set({
      name: body.name,
      address: body.address,
      city: body.city,
      district: body.district,
      province: body.province,
      latitude: body.latitude !== undefined ? String(body.latitude) : undefined,
      longitude:
        body.longitude !== undefined ? String(body.longitude) : undefined,
      timezone: body.timezone,
      hijriOffset:
        body.hijriOffset !== undefined ? body.hijriOffset : undefined,
      adzanScreenDuration:
        body.adzanScreenDuration !== undefined
          ? body.adzanScreenDuration
          : undefined,
      khusukScreenDuration:
        body.khusukScreenDuration !== undefined
          ? body.khusukScreenDuration
          : undefined,
      screensaverDelayMinutes:
        body.screensaverDelayMinutes !== undefined
          ? body.screensaverDelayMinutes
          : undefined,
      screensaverWakeMinutes:
        body.screensaverWakeMinutes !== undefined
          ? body.screensaverWakeMinutes
          : undefined,
      screensaverMorningDelayMinutes:
        body.screensaverMorningDelayMinutes !== undefined
          ? body.screensaverMorningDelayMinutes
          : undefined,
      screensaverMorningWakeMinutes:
        body.screensaverMorningWakeMinutes !== undefined
          ? body.screensaverMorningWakeMinutes
          : undefined,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : undefined,
      isActive:
        body.isActive !== undefined ? (body.isActive ? 1 : 0) : undefined,
    })
    .where(and(eq(masjids.id, masjidId)));

  const [profile] = await db
    .select()
    .from(masjids)
    .where(eq(masjids.id, masjidId))
    .limit(1);
  invalidateDisplayForMasjid(masjidId);
  return json({ ok: true, data: profile });
};
