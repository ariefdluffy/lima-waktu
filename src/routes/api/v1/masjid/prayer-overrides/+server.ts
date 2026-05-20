import { and, desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { prayerOverrides } from "$lib/server/db/schema";

type CreateOverrideBody = {
  scheduleDate?: string;
  prayerName?:
    | "subuh"
    | "dzuhur"
    | "ashar"
    | "maghrib"
    | "isya"
    | "imsak"
    | "sunrise"
    | "dhuha";
  overrideTime?: string;
  reason?: string;
};

const VALID_PRAYER_NAMES = [
  "subuh",
  "dzuhur",
  "ashar",
  "maghrib",
  "isya",
  "imsak",
  "sunrise",
  "dhuha",
] as const;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDateString(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

export const GET: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  const { url } = event;
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const dateParam = url.searchParams.get("date") ?? todayDateString();
  const scheduleDate = parseDateString(dateParam);

  if (!scheduleDate) {
    return json(
      { ok: false, message: "Parameter date harus format YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  const rows = await db
    .select()
    .from(prayerOverrides)
    .where(
      and(
        eq(prayerOverrides.masjidId, masjidId),
        eq(prayerOverrides.scheduleDate, scheduleDate),
      ),
    )
    .orderBy(desc(prayerOverrides.createdAt));

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
    .catch(() => null)) as CreateOverrideBody | null;

  if (!body?.scheduleDate || !body?.prayerName || !body?.overrideTime) {
    return json(
      {
        ok: false,
        message: "scheduleDate, prayerName, dan overrideTime wajib diisi",
      },
      { status: 400 },
    );
  }

  const scheduleDate = parseDateString(body.scheduleDate);
  if (!scheduleDate) {
    return json(
      { ok: false, message: "scheduleDate harus format YYYY-MM-DD" },
      { status: 400 },
    );
  }

  if (!(VALID_PRAYER_NAMES as readonly string[]).includes(body.prayerName)) {
    return json(
      {
        ok: false,
        message: `prayerName tidak valid. Pilihan: ${VALID_PRAYER_NAMES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  if (!isValidTime(body.overrideTime)) {
    return json(
      { ok: false, message: "overrideTime harus format HH:MM" },
      { status: 400 },
    );
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  await db
    .insert(prayerOverrides)
    .values({
      masjidId,
      scheduleDate,
      prayerName: body.prayerName,
      overrideTime: body.overrideTime,
      reason: body.reason,
      createdBy: user.id,
    })
    .onDuplicateKeyUpdate({
      set: {
        overrideTime: body.overrideTime,
        reason: body.reason,
        createdBy: user.id,
      },
    });

  const [saved] = await db
    .select()
    .from(prayerOverrides)
    .where(
      and(
        eq(prayerOverrides.masjidId, masjidId),
        eq(prayerOverrides.scheduleDate, scheduleDate),
        eq(prayerOverrides.prayerName, body.prayerName),
      ),
    )
    .limit(1);

  return json({ ok: true, data: saved }, { status: 201 });
};

export const DELETE: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  const { url } = event;
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin", "admin_masjid"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const idParam = url.searchParams.get("id");
  if (!idParam || isNaN(Number(idParam))) {
    return json(
      { ok: false, message: "Parameter id wajib diisi dan harus berupa angka" },
      { status: 400 },
    );
  }
  const id = Number(idParam);

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  const [existing] = await db
    .select({ id: prayerOverrides.id })
    .from(prayerOverrides)
    .where(
      and(eq(prayerOverrides.id, id), eq(prayerOverrides.masjidId, masjidId)),
    )
    .limit(1);

  if (!existing) {
    return json(
      { ok: false, message: "Override tidak ditemukan" },
      { status: 404 },
    );
  }

  await db
    .delete(prayerOverrides)
    .where(
      and(eq(prayerOverrides.id, id), eq(prayerOverrides.masjidId, masjidId)),
    );

  return json({ ok: true, message: "Override berhasil dihapus" });
};
