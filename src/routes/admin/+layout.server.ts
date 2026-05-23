import { redirect } from "@sveltejs/kit";
import { and, desc, eq, lte, gte, or, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import {
  platformAnnouncements,
  masjidUsers,
  masjids,
  subscriptions,
} from "$lib/server/db/schema";

export const load = async ({
  locals,
  url,
}: {
  locals: App.Locals;
  url: URL;
}) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (
    !locals.user.roles.includes("admin_masjid") &&
    !locals.user.roles.includes("superadmin")
  ) {
    throw redirect(302, "/auth/login");
  }

  // Look up user's masjid
  let masjidId: string | null = null;

  if (locals.user.roles.includes("superadmin")) {
    const [firstMasjid] = await db
      .select({ id: masjids.id })
      .from(masjids)
      .limit(1);
    masjidId = firstMasjid?.id ?? null;
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
  }

  // Subscription guard — redirect expired to main page with section param
  let subscription = null;
  if (
    masjidId &&
    url.pathname === "/admin" &&
    !url.searchParams.has("section")
  ) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.masjidId, masjidId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (sub) {
      subscription = sub;
      const now = new Date();
      const endDate = new Date(sub.endDate);
      const isExpired =
        sub.status === "expired" ||
        ((sub.status === "trial" || sub.status === "grace") && endDate < now);

      if (isExpired) {
        throw redirect(302, "/admin?section=langganan");
      }
    }
  }

  const announcements = await db
    .select()
    .from(platformAnnouncements)
    .where(
      and(
        eq(platformAnnouncements.isActive, 1),
        or(
          eq(platformAnnouncements.targetAudience, "all"),
          eq(platformAnnouncements.targetAudience, "admins"),
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
    announcements,
    subscription,
  };
};
