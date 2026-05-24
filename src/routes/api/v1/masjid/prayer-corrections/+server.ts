import { desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { prayerCorrections } from "$lib/server/db/schema";
import { invalidateDisplayPrayerForMasjid } from "$lib/server/display/invalidate";

type CreateCorrectionBody = {
  prayerName?:
    | "imsak"
    | "subuh"
    | "sunrise"
    | "dhuha"
    | "dzuhur"
    | "ashar"
    | "maghrib"
    | "isya";
  offsetMinutes?: number;
  reason?: string;
  activeFrom?: string;
  activeUntil?: string;
  isActive?: boolean;
};

function parseDateString(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export const GET: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  const { url } = event;
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );
  const rows = await db
    .select()
    .from(prayerCorrections)
    .where(eq(prayerCorrections.masjidId, masjidId))
    .orderBy(desc(prayerCorrections.createdAt));

  return json({ ok: true, data: rows });
};

export const POST: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  const { request, url } = event;
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin", "admin_masjid"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const body = (await request
    .json()
    .catch(() => null)) as CreateCorrectionBody | null;

  if (!body?.prayerName || typeof body.offsetMinutes !== "number") {
    return json(
      { ok: false, message: "prayerName dan offsetMinutes wajib diisi" },
      { status: 400 },
    );
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );
  const activeFrom = parseDateString(body.activeFrom);
  const activeUntil = parseDateString(body.activeUntil);

  if (activeFrom === null || activeUntil === null) {
    return json(
      { ok: false, message: "activeFrom/activeUntil harus format YYYY-MM-DD" },
      { status: 400 },
    );
  }

  await db.insert(prayerCorrections).values({
    masjidId,
    prayerName: body.prayerName,
    offsetMinutes: body.offsetMinutes,
    reason: body.reason,
    activeFrom,
    activeUntil,
    isActive: body.isActive === false ? 0 : 1,
  });

  const [saved] = await db
    .select()
    .from(prayerCorrections)
    .where(eq(prayerCorrections.masjidId, masjidId))
    .orderBy(desc(prayerCorrections.id))
    .limit(1);

  invalidateDisplayPrayerForMasjid(masjidId);
  return json({ ok: true, data: saved }, { status: 201 });
};
