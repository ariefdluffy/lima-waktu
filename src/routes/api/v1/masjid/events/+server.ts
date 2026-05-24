import { and, desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { events } from "$lib/server/db/schema";
import { invalidateDisplayForMasjid } from "$lib/server/display/invalidate";

type CreateEventBody = {
  title?: string;
  description?: string | null;
  eventDate?: string;
  eventTime?: string | null;
  countdownEnabled?: boolean | number;
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

  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.masjidId, masjidId), eq(events.isActive, 1)))
    .orderBy(desc(events.eventDate));

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
    .catch(() => null)) as CreateEventBody | null;

  if (!body?.title?.trim() || !body?.eventDate?.trim()) {
    return json(
      { ok: false, message: "title dan eventDate wajib diisi" },
      { status: 400 },
    );
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  const [inserted] = await db.insert(events).values({
    masjidId,
    title: body.title.trim(),
    description: body.description ?? null,
    eventDate: new Date(body.eventDate.trim()),
    eventTime: body.eventTime ?? null,
    countdownEnabled:
      body.countdownEnabled === false || body.countdownEnabled === 0 ? 0 : 1,
  });

  const [created] = await db
    .select()
    .from(events)
    .where(eq(events.id, inserted.insertId))
    .limit(1);

  invalidateDisplayForMasjid(masjidId);
  return json({ ok: true, data: created }, { status: 201 });
};
