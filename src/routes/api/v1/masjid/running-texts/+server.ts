import { and, desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { runningTexts } from "$lib/server/db/schema";
import { invalidateDisplayForMasjid } from "$lib/server/display/invalidate";

type CreateRunningTextBody = {
  content?: string;
  speed?: number;
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
    .from(runningTexts)
    .where(eq(runningTexts.masjidId, masjidId))
    .orderBy(desc(runningTexts.createdAt));

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
    .catch(() => null)) as CreateRunningTextBody | null;
  if (!body?.content?.trim()) {
    return json({ ok: false, message: "content wajib diisi" }, { status: 400 });
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  await db.insert(runningTexts).values({
    masjidId,
    content: body.content.trim(),
    speed: body.speed ?? 60,
    isActive: body.isActive === false ? 0 : 1,
  });

  const [created] = await db
    .select()
    .from(runningTexts)
    .where(
      and(
        eq(runningTexts.masjidId, masjidId),
        eq(runningTexts.content, body.content.trim()),
      ),
    )
    .orderBy(desc(runningTexts.id))
    .limit(1);

  invalidateDisplayForMasjid(masjidId);
  return json({ ok: true, data: created }, { status: 201 });
};
