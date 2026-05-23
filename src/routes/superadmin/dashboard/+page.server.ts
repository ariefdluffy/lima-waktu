import { desc, eq, sql, count } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";

import { db } from "$lib/server/db";
import {
  masjids,
  devices,
  users,
  subscriptions,
  invoices,
} from "$lib/server/db/schema";

export const load = async ({ locals }: { locals: App.Locals }) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const now = new Date();

  const [
    totalMasjid,
    activeMasjid,
    totalUsers,
    totalDevices,
    onlineDevices,
    subscriptionCounts,
    revenueMonthly,
    revenueYearly,
    recentMasjids,
    recentSubscriptions,
    offlineDeviceList,
    expiringSubscriptions,
    revenueChartData,
    deviceStatusRaw,
  ] = await Promise.all([
    // Total masjid
    db
      .select({ val: count() })
      .from(masjids)
      .then((r) => Number(r[0].val)),

    // Active masjid
    db
      .select({ val: count() })
      .from(masjids)
      .where(eq(masjids.isActive, 1))
      .then((r) => Number(r[0].val)),

    // Total users
    db
      .select({ val: count() })
      .from(users)
      .then((r) => Number(r[0].val)),

    // Total devices
    db
      .select({ val: count() })
      .from(devices)
      .then((r) => Number(r[0].val)),

    // Online devices (heartbeat within last 5 min)
    db
      .select({ val: count() })
      .from(devices)
      .where(sql`${devices.lastSeenAt} > NOW() - INTERVAL 5 MINUTE`)
      .then((r) => Number(r[0].val)),

    // Subscription counts by status
    db
      .select({
        status: subscriptions.status,
        val: count(),
      })
      .from(subscriptions)
      .groupBy(subscriptions.status),

    // Revenue this month
    db
      .select({ val: sql<string>`COALESCE(SUM(${invoices.amount}), 0)` })
      .from(invoices)
      .where(
        sql`${invoices.status} = 'paid' AND ${invoices.paidAt} >= DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')`,
      )
      .then((r) => Number(r[0].val)),

    // Revenue this year
    db
      .select({ val: sql<string>`COALESCE(SUM(${invoices.amount}), 0)` })
      .from(invoices)
      .where(
        sql`${invoices.status} = 'paid' AND ${invoices.paidAt} >= DATE_FORMAT(NOW(), '%Y-01-01 00:00:00')`,
      )
      .then((r) => Number(r[0].val)),

    // Recent masjids (10)
    db.select().from(masjids).orderBy(desc(masjids.createdAt)).limit(10),

    // Recent subscriptions (10)
    db
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt))
      .limit(10),

    // Offline devices (lastSeen > 5 min ago or null, limit 10)
    db
      .select()
      .from(devices)
      .where(
        sql`${devices.lastSeenAt} IS NULL OR ${devices.lastSeenAt} < NOW() - INTERVAL 5 MINUTE`,
      )
      .orderBy(desc(devices.lastSeenAt))
      .limit(10),

    // Subscription expiring in 7 days
    db
      .select()
      .from(subscriptions)
      .where(
        sql`${subscriptions.status} IN ('active', 'trial', 'grace') AND ${subscriptions.endDate} BETWEEN CURDATE() AND CURDATE() + INTERVAL 7 DAY`,
      )
      .orderBy(subscriptions.endDate)
      .limit(10),

    // Revenue chart: last 6 months
    db
      .select({
        month: sql<string>`DATE_FORMAT(${invoices.paidAt}, '%Y-%m')`,
        revenue: sql<string>`COALESCE(SUM(${invoices.amount}), 0)`,
      })
      .from(invoices)
      .where(
        sql`${invoices.status} = 'paid' AND ${invoices.paidAt} >= DATE_SUB(NOW(), INTERVAL 6 MONTH)`,
      )
      .groupBy(sql`DATE_FORMAT(${invoices.paidAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${invoices.paidAt}, '%Y-%m')`),

    // Device status counts
    db
      .select({
        status: devices.status,
        val: count(),
      })
      .from(devices)
      .groupBy(devices.status),
  ]);

  const subMap: Record<string, number> = {
    active: 0,
    expired: 0,
    trial: 0,
    grace: 0,
    cancelled: 0,
  };
  for (const s of subscriptionCounts) {
    subMap[s.status] = Number(s.val);
  }

  const deviceStatusCounts: Record<string, number> = {
    online: 0,
    offline: 0,
    unknown: 0,
  };
  for (const d of deviceStatusRaw) {
    deviceStatusCounts[d.status] = Number(d.val);
  }

  return {
    revenueChart: revenueChartData.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue),
    })),
    deviceChart: deviceStatusCounts,
    stats: {
      totalMasjid,
      activeMasjid,
      totalUsers,
      totalDevices,
      onlineDevices: Number(onlineDevices),
      offlineDevices: totalDevices - Number(onlineDevices),
      subscriptionActive: subMap["active"] ?? 0,
      subscriptionExpired: subMap["expired"] ?? 0,
      subscriptionTrial: subMap["trial"] ?? 0,
      subscriptionGrace: subMap["grace"] ?? 0,
      revenueMonthly: Number(revenueMonthly),
      revenueYearly: Number(revenueYearly),
    },
    recentMasjids,
    recentSubscriptions,
    offlineDeviceList,
    expiringSubscriptions,
  };
};
