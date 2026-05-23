import { redirect } from "@sveltejs/kit";
import { and, desc, eq, lte, gte, or, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import { platformAnnouncements } from "$lib/server/db/schema";

export const load = async ({ locals }: { locals: App.Locals }) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const announcements = await db
    .select()
    .from(platformAnnouncements)
    .where(
      and(
        eq(platformAnnouncements.isActive, 1),
        or(
          eq(platformAnnouncements.targetAudience, "all"),
          eq(platformAnnouncements.targetAudience, "superadmins"),
        ),
        or(
          isNull(platformAnnouncements.startAt),
          lte(platformAnnouncements.startAt, new Date()),
        ),
        or(
          isNull(platformAnnouncements.endAt),
          gte(platformAnnouncements.endAt, new Date()),
        ),
      ),
    )
    .orderBy(desc(platformAnnouncements.createdAt));

  return {
    user: locals.user,
    announcements,
  };
};
