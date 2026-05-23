import { desc, eq, sql, count, like } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { subscriptions, masjids, pricingPlans } from "$lib/server/db/schema";

export const load = async ({
  locals,
  url,
}: {
  locals: App.Locals;
  url: URL;
}) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const search = url.searchParams.get("q") ?? "";
  const statusFilter = url.searchParams.get("status") ?? "all";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const whereConditions = [];
  if (statusFilter !== "all") {
    whereConditions.push(
      eq(
        subscriptions.status,
        statusFilter as "trial" | "active" | "grace" | "expired" | "cancelled",
      ),
    );
  }
  if (search) {
    whereConditions.push(like(masjids.name, `%${search}%`));
  }

  const where =
    whereConditions.length > 0
      ? sql`${sql.join(whereConditions, sql` AND `)}`
      : undefined;

  const [subRows, totalResult, allMasjids, allPlans, statusCounts] =
    await Promise.all([
      db
        .select({
          id: subscriptions.id,
          masjidId: subscriptions.masjidId,
          packageName: subscriptions.packageName,
          billingCycle: subscriptions.billingCycle,
          status: subscriptions.status,
          startDate: subscriptions.startDate,
          endDate: subscriptions.endDate,
          price: subscriptions.price,
          autoRenew: subscriptions.autoRenew,
          createdAt: subscriptions.createdAt,
          masjidName: masjids.name,
        })
        .from(subscriptions)
        .innerJoin(masjids, eq(subscriptions.masjidId, masjids.id))
        .where(where)
        .orderBy(desc(subscriptions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ val: count() })
        .from(subscriptions)
        .innerJoin(masjids, eq(subscriptions.masjidId, masjids.id))
        .where(where)
        .then((r) => Number(r[0].val)),
      db
        .select({ id: masjids.id, name: masjids.name })
        .from(masjids)
        .where(eq(masjids.isActive, 1))
        .orderBy(masjids.name),
      db
        .select()
        .from(pricingPlans)
        .where(eq(pricingPlans.isActive, 1))
        .orderBy(pricingPlans.sortOrder),
      // Total counts per status (for quick stats)
      db
        .select({
          status: subscriptions.status,
          val: count(),
        })
        .from(subscriptions)
        .groupBy(subscriptions.status),
    ]);

  const statusCountMap: Record<string, number> = {
    active: 0,
    trial: 0,
    grace: 0,
    expired: 0,
    cancelled: 0,
  };
  for (const s of statusCounts) {
    statusCountMap[s.status] = Number(s.val);
  }

  return {
    subscriptions: subRows.map((s) => ({
      ...s,
      masjidName: s.masjidName ?? s.masjidId,
    })),
    masjids: allMasjids,
    plans: allPlans,
    page,
    totalPages: Math.ceil(totalResult / limit),
    search,
    statusFilter,
    totalCount: totalResult,
    statusCounts: statusCountMap,
  };
};

export const actions = {
  updateSubscription: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get("id") ?? "").trim();
    const status = String(form.get("status") ?? "").trim();
    const endDate = String(form.get("end_date") ?? "").trim();
    const autoRenew = form.get("auto_renew") === "1" ? 1 : 0;

    if (!id) return;

    const updateData: Record<string, unknown> = { autoRenew };
    if (status)
      updateData.status = status as
        | "trial"
        | "active"
        | "grace"
        | "expired"
        | "cancelled";
    if (endDate) updateData.endDate = new Date(endDate);

    await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, Number(id)));

    return { saved: true };
  },

  deleteSubscription: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get("id") ?? "").trim();
    if (id) {
      await db.delete(subscriptions).where(eq(subscriptions.id, Number(id)));
    }
    return { deleted: true };
  },
};
