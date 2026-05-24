import { desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { youtubeItems } from "$lib/server/db/schema";
import { invalidateDisplayForMasjid } from "$lib/server/display/invalidate";

type CreateYoutubeBody = {
  youtubeUrl?: string;
  title?: string;
  orderIndex?: number;
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
    .from(youtubeItems)
    .where(eq(youtubeItems.masjidId, masjidId))
    .orderBy(desc(youtubeItems.orderIndex));

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
    .catch(() => null)) as CreateYoutubeBody | null;
  if (!body?.youtubeUrl?.trim()) {
    return json(
      { ok: false, message: "youtubeUrl wajib diisi" },
      { status: 400 },
    );
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );
  await db.insert(youtubeItems).values({
    masjidId,
    youtubeUrl: body.youtubeUrl.trim(),
    title: body.title,
    orderIndex: body.orderIndex ?? 0,
    isActive: body.isActive === false ? 0 : 1,
  });

  const [created] = await db
    .select()
    .from(youtubeItems)
    .where(eq(youtubeItems.masjidId, masjidId))
    .orderBy(desc(youtubeItems.id))
    .limit(1);

  invalidateDisplayForMasjid(masjidId);
  return json({ ok: true, data: created }, { status: 201 });
};
