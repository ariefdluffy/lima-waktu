import { and, desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { slides } from "$lib/server/db/schema";

type CreateSlideBody = {
  title?: string;
  mediaAssetId?: number;
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
    .from(slides)
    .where(eq(slides.masjidId, masjidId))
    .orderBy(desc(slides.orderIndex));

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
    .catch(() => null)) as CreateSlideBody | null;
  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  await db.insert(slides).values({
    masjidId,
    title: body?.title,
    mediaAssetId: body?.mediaAssetId,
    orderIndex: body?.orderIndex ?? 0,
    isActive: body?.isActive === false ? 0 : 1,
  });

  const [created] = await db
    .select()
    .from(slides)
    .where(
      and(
        eq(slides.masjidId, masjidId),
        eq(slides.orderIndex, body?.orderIndex ?? 0),
      ),
    )
    .orderBy(desc(slides.id))
    .limit(1);

  return json({ ok: true, data: created }, { status: 201 });
};
