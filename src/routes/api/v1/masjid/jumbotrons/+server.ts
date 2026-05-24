import { desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { jumbotrons } from "$lib/server/db/schema";
import { invalidateDisplayForMasjid } from "$lib/server/display/invalidate";

type CreateJumbotronBody = {
  title?: string;
  content?: string;
  backgroundUrl?: string;
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
  const rows = await db
    .select()
    .from(jumbotrons)
    .where(eq(jumbotrons.masjidId, masjidId))
    .orderBy(desc(jumbotrons.createdAt));

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
    .catch(() => null)) as CreateJumbotronBody | null;
  if (!body?.title?.trim()) {
    return json({ ok: false, message: "title wajib diisi" }, { status: 400 });
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );
  await db.insert(jumbotrons).values({
    masjidId,
    title: body.title.trim(),
    content: body.content,
    backgroundUrl: body.backgroundUrl,
    isActive: body.isActive === false ? 0 : 1,
  });

  const [created] = await db
    .select()
    .from(jumbotrons)
    .where(eq(jumbotrons.masjidId, masjidId))
    .orderBy(desc(jumbotrons.id))
    .limit(1);

  invalidateDisplayForMasjid(masjidId);
  return json({ ok: true, data: created }, { status: 201 });
};
