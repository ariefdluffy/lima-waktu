import { and, desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { devices } from "$lib/server/db/schema";
import { invalidateDisplayForMasjid } from "$lib/server/display/invalidate";

type CreateDeviceBody = {
  id?: string;
  deviceCode?: string;
  name?: string;
  orientation?: "horizontal" | "vertical";
  status?: "online" | "offline" | "unknown";
  isActive?: boolean;
};

function generatePseudoUuid() {
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
    .from(devices)
    .where(eq(devices.masjidId, masjidId))
    .orderBy(desc(devices.createdAt));

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
    .catch(() => null)) as CreateDeviceBody | null;
  if (!body?.deviceCode?.trim() || !body?.name?.trim()) {
    return json(
      { ok: false, message: "deviceCode dan name wajib diisi" },
      { status: 400 },
    );
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );
  await db.insert(devices).values({
    id: body.id ?? generatePseudoUuid(),
    masjidId,
    deviceCode: body.deviceCode.trim(),
    name: body.name.trim(),
    orientation: body.orientation ?? "horizontal",
    status: body.status ?? "unknown",
    pairedAt: new Date(),
    isActive: body.isActive === false ? 0 : 1,
  });

  const [created] = await db
    .select()
    .from(devices)
    .where(
      and(
        eq(devices.masjidId, masjidId),
        eq(devices.deviceCode, body.deviceCode.trim()),
      ),
    )
    .orderBy(desc(devices.createdAt))
    .limit(1);

  invalidateDisplayForMasjid(masjidId);
  return json({ ok: true, data: created }, { status: 201 });
};
