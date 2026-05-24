import { eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { resolveMasjidIdForUser } from "$lib/server/api/tenant";
import { db } from "$lib/server/db";
import { iqamahSettings } from "$lib/server/db/schema";
import { invalidateDisplayPrayerForMasjid } from "$lib/server/display/invalidate";

type IqamahSettingItem = {
  prayerName?: "subuh" | "dzuhur" | "ashar" | "maghrib" | "isya" | "jumat";
  delayMinutes?: number;
  enabled?: boolean;
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
    .from(iqamahSettings)
    .where(eq(iqamahSettings.masjidId, masjidId));

  return json({ ok: true, data: rows });
};

export const PUT: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  const { request, url } = event;
  if (!user)
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin", "admin_masjid"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | IqamahSettingItem[]
    | null;

  if (!Array.isArray(body)) {
    return json(
      { ok: false, message: "Body harus berupa array" },
      { status: 400 },
    );
  }

  for (const item of body) {
    if (!item.prayerName) {
      return json(
        { ok: false, message: "prayerName wajib diisi pada setiap item" },
        { status: 400 },
      );
    }
    if (typeof item.delayMinutes !== "number") {
      return json(
        {
          ok: false,
          message: "delayMinutes wajib berupa number pada setiap item",
        },
        { status: 400 },
      );
    }
  }

  const masjidId = await resolveMasjidIdForUser(
    user,
    url.searchParams.get("masjid_id"),
  );

  for (const item of body) {
    const enabledVal = item.enabled === false ? 0 : 1;
    await db
      .insert(iqamahSettings)
      .values({
        masjidId,
        prayerName: item.prayerName!,
        delayMinutes: item.delayMinutes!,
        enabled: enabledVal,
        updatedBy: user.id,
      })
      .onDuplicateKeyUpdate({
        set: {
          delayMinutes: item.delayMinutes!,
          enabled: enabledVal,
          updatedBy: user.id,
        },
      });
  }

  const rows = await db
    .select()
    .from(iqamahSettings)
    .where(eq(iqamahSettings.masjidId, masjidId));

  return json({ ok: true, data: rows });
};
