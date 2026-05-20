import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { prayerSchedules } from "$lib/server/db/schema";

type UpsertPrayerScheduleBody = {
  scheduleDate?: string;
  imsakTime?: string;
  subuhTime?: string;
  sunriseTime?: string;
  dhuhaTime?: string;
  dzuhurTime?: string;
  asharTime?: string;
  maghribTime?: string;
  isyaTime?: string;
  sourceProvider?: string;
  calculationMethod?: string;
  isManualOverride?: boolean;
};

function parseDateString(value: string) {
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
  const fromRaw =
    url.searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const toRaw = url.searchParams.get("to") ?? fromRaw;
  const from = parseDateString(fromRaw);
  const to = parseDateString(toRaw);

  if (!from || !to) {
    return json(
      { ok: false, message: "Parameter from/to harus format YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const rows = await db
    .select()
    .from(prayerSchedules)
    .where(
      and(
        eq(prayerSchedules.masjidId, masjidId),
        gte(prayerSchedules.scheduleDate, from),
        lte(prayerSchedules.scheduleDate, to),
      ),
    )
    .orderBy(asc(prayerSchedules.scheduleDate));

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
    .catch(() => null)) as UpsertPrayerScheduleBody | null;
  if (
    !body?.scheduleDate ||
    !body.imsakTime ||
    !body.subuhTime ||
    !body.sunriseTime ||
    !body.dhuhaTime ||
    !body.dzuhurTime ||
    !body.asharTime ||
    !body.maghribTime ||
    !body.isyaTime
  ) {
    return json(
      { ok: false, message: "Semua waktu sholat wajib diisi" },
      { status: 400 },
    );
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );
  const scheduleDate = parseDateString(body.scheduleDate);

  if (!scheduleDate) {
    return json(
      { ok: false, message: "scheduleDate harus format YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: prayerSchedules.id })
    .from(prayerSchedules)
    .where(
      and(
        eq(prayerSchedules.masjidId, masjidId),
        eq(prayerSchedules.scheduleDate, scheduleDate),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(prayerSchedules)
      .set({
        imsakTime: body.imsakTime,
        subuhTime: body.subuhTime,
        sunriseTime: body.sunriseTime,
        dhuhaTime: body.dhuhaTime,
        dzuhurTime: body.dzuhurTime,
        asharTime: body.asharTime,
        maghribTime: body.maghribTime,
        isyaTime: body.isyaTime,
        sourceProvider: body.sourceProvider ?? "manual",
        calculationMethod: body.calculationMethod ?? "manual-default",
        isManualOverride: body.isManualOverride === true ? 1 : 0,
        syncedAt: new Date(),
      })
      .where(eq(prayerSchedules.id, existing.id));
  } else {
    await db.insert(prayerSchedules).values({
      masjidId,
      scheduleDate,
      imsakTime: body.imsakTime,
      subuhTime: body.subuhTime,
      sunriseTime: body.sunriseTime,
      dhuhaTime: body.dhuhaTime,
      dzuhurTime: body.dzuhurTime,
      asharTime: body.asharTime,
      maghribTime: body.maghribTime,
      isyaTime: body.isyaTime,
      sourceProvider: body.sourceProvider ?? "manual",
      calculationMethod: body.calculationMethod ?? "manual-default",
      isManualOverride: body.isManualOverride === true ? 1 : 0,
      syncedAt: new Date(),
    });
  }

  const [saved] = await db
    .select()
    .from(prayerSchedules)
    .where(
      and(
        eq(prayerSchedules.masjidId, masjidId),
        eq(prayerSchedules.scheduleDate, scheduleDate),
      ),
    )
    .orderBy(desc(prayerSchedules.id))
    .limit(1);

  return json({ ok: true, data: saved });
};
