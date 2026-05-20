import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { and, desc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { devices, masjids, masjidUsers } from "$lib/server/db/schema";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, "/auth/login");

  let masjidId: string | null = null;
  let masjid = null;

  if (locals.user.roles.includes("superadmin")) {
    const [first] = await db.select().from(masjids).limit(1);
    masjidId = first?.id ?? null;
    masjid = first ?? null;
  } else {
    const [membership] = await db
      .select({ masjidId: masjidUsers.masjidId })
      .from(masjidUsers)
      .where(
        and(
          eq(masjidUsers.userId, locals.user.id),
          eq(masjidUsers.isActive, 1),
        ),
      )
      .limit(1);
    masjidId = membership?.masjidId ?? null;
    if (masjidId) {
      const [m] = await db
        .select()
        .from(masjids)
        .where(eq(masjids.id, masjidId))
        .limit(1);
      masjid = m ?? null;
    }
  }

  if (!masjidId)
    return {
      masjid: null,
      devices: [],
      isSuperadmin: locals.user.roles.includes("superadmin"),
    };

  const deviceRows = await db
    .select()
    .from(devices)
    .where(and(eq(devices.masjidId, masjidId), eq(devices.isActive, 1)))
    .orderBy(desc(devices.createdAt));

  return {
    masjid,
    devices: deviceRows,
    isSuperadmin: locals.user.roles.includes("superadmin"),
  };
};
