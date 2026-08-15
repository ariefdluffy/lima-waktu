import { desc, eq, sql, count, and, isNull } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";

import { db } from "$lib/server/db";
import {
  masjids,
  devices,
  users,
  subscriptions,
  invoices,
} from "$lib/server/db/schema";
import { isSubscriptionExpired } from "$lib/utils/subscription";

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
    unknownDevicesCount,
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

    // Total users (tidak termasuk soft-deleted)
    db
      .select({ val: count() })
      .from(users)
      .where(isNull(users.deletedAt))
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

    // Subscription counts by status (includes expired based on date)
    db
      .select({
        status: subscriptions.status,
        endDate: subscriptions.endDate,
        val: count(),
      })
      .from(subscriptions)
      .groupBy(subscriptions.status, subscriptions.endDate),

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

    // Unknown devices count (no heartbeat ever)
    db
      .select({ val: count() })
      .from(devices)
      .where(sql`${devices.lastSeenAt} IS NULL`)
      .then((r) => Number(r[0].val)),
  ]);

  // Calculate subscription counts: DB status + date-based expiry
  const subCounts = {
    active: 0,
    expired: 0,
    trial: 0,
    grace: 0,
    cancelled: 0,
  };

  for (const s of subscriptionCounts) {
    const statusStr = String(s.status ?? "");
    const endDateVal = s.endDate instanceof Date ? s.endDate : new Date(String(s.endDate));
    const effectiveExpired = statusStr === "cancelled" || statusStr === "expired" || (!isNaN(endDateVal.getTime()) && isSubscriptionExpired({ status: statusStr, endDate: endDateVal }));
    const effectiveStatus = effectiveExpired ? "expired" : statusStr;
    const key = effectiveStatus as keyof typeof subCounts;
    if (subCounts[key] !== undefined) {
      subCounts[key] += Number(s.val);
    }
  }

  const deviceStatusCounts = {
    online: Number(onlineDevices),
    offline: totalDevices - Number(onlineDevices) - unknownDevicesCount,
    unknown: unknownDevicesCount,
  };

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
      offlineDevices: totalDevices - Number(onlineDevices) - unknownDevicesCount,
      subscriptionActive: subCounts["active"] ?? 0,
      subscriptionExpired: subCounts["expired"] ?? 0,
      subscriptionTrial: subCounts["trial"] ?? 0,
      subscriptionGrace: subCounts["grace"] ?? 0,
      revenueMonthly: Number(revenueMonthly),
      revenueYearly: Number(revenueYearly),
    },
    recentMasjids,
    recentSubscriptions,
    offlineDeviceList,
    expiringSubscriptions,
  };
};
