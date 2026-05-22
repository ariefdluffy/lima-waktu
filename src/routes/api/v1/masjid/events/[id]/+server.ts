import { and, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { events } from "$lib/server/db/schema";

type UpdateEventBody = {
  title?: string;
  description?: string | null;
  eventDate?: string;
  eventTime?: string | null;
  countdownEnabled?: boolean | number;
};

export const PUT: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  const { request, url } = event;
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin", "admin_masjid"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const id = Number(event.params.id);
  if (!id || isNaN(id)) {
    return json(
      { ok: false, message: "Parameter id tidak valid" },
      { status: 400 },
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as UpdateEventBody | null;

  if (!body) {
    return json(
      { ok: false, message: "Body request tidak valid" },
      { status: 400 },
    );
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(eq(events.id, id), eq(events.masjidId, masjidId)),
    )
    .limit(1);

  if (!existing) {
    return json(
      { ok: false, message: "Event tidak ditemukan" },
      { status: 404 },
    );
  }

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title.trim();
  if (body.description !== undefined) updateData.description = body.description;
  if (body.eventDate !== undefined) updateData.eventDate = body.eventDate.trim();
  if (body.eventTime !== undefined) updateData.eventTime = body.eventTime;
  if (body.countdownEnabled !== undefined) {
    updateData.countdownEnabled =
      body.countdownEnabled === false || body.countdownEnabled === 0 ? 0 : 1;
  }

  if (Object.keys(updateData).length === 0) {
    return json(
      { ok: false, message: "Tidak ada data yang diupdate" },
      { status: 400 },
    );
  }

  await db
    .update(events)
    .set(updateData)
    .where(and(eq(events.id, id), eq(events.masjidId, masjidId)));

  const [updated] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  return json({ ok: true, data: updated });
};

export const DELETE: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  const { url } = event;
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin", "admin_masjid"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const id = Number(event.params.id);
  if (!id || isNaN(id)) {
    return json(
      { ok: false, message: "Parameter id tidak valid" },
      { status: 400 },
    );
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(eq(events.id, id), eq(events.masjidId, masjidId)),
    )
    .limit(1);

  if (!existing) {
    return json(
      { ok: false, message: "Event tidak ditemukan" },
      { status: 404 },
    );
  }

  await db
    .update(events)
    .set({ isActive: 0 })
    .where(and(eq(events.id, id), eq(events.masjidId, masjidId)));

  return json({ ok: true, message: "Event berhasil dihapus" });
};
