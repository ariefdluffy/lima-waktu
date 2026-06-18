import { desc, eq, sql, count } from "drizzle-orm";
import { fail, redirect } from "@sveltejs/kit";
import os from "node:os";
import { db } from "$lib/server/db";
import {
  devices,
  masjids,
  prayerProviderLogs,
  prayerSyncJobs,
} from "$lib/server/db/schema";

export const load = async ({ locals }: { locals: App.Locals }) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const [deviceRows, deviceTotal, onlineCount, offlineCount, unknownCount, providerLogs, syncJobs] = await Promise.all([
    // All devices with masjid name
    db
      .select({
        id: devices.id,
        name: devices.name,
        deviceCode: devices.deviceCode,
        status: devices.status,
        lastSeenAt: devices.lastSeenAt,
        isActive: devices.isActive,
        masjidId: devices.masjidId,
        masjidName: masjids.name,
      })
      .from(devices)
      .leftJoin(masjids, eq(devices.masjidId, masjids.id))
      .orderBy(desc(devices.lastSeenAt))
      .limit(50),
    // Device total count
    db
      .select({ val: count() })
      .from(devices)
      .then((r) => Number(r[0].val)),
    // Online: lastSeenAt within 5 min
    db
      .select({ val: count() })
      .from(devices)
      .where(sql`last_seen_at >= NOW() - INTERVAL 5 MINUTE`)
      .then((r) => Number(r[0].val)),
    // Offline: lastSeenAt exists but older than 5 min
    db
      .select({ val: count() })
      .from(devices)
      .where(sql`last_seen_at IS NOT NULL AND last_seen_at < NOW() - INTERVAL 5 MINUTE`)
      .then((r) => Number(r[0].val)),
    // Unknown: never polled (null)
    db
      .select({ val: count() })
      .from(devices)
      .where(sql`last_seen_at IS NULL`)
      .then((r) => Number(r[0].val)),
    // Provider logs last 20
    db
      .select()
      .from(prayerProviderLogs)
      .orderBy(desc(prayerProviderLogs.createdAt))
      .limit(20),
    // Sync jobs last 20
    db
      .select()
      .from(prayerSyncJobs)
      .orderBy(desc(prayerSyncJobs.createdAt))
      .limit(20),
  ]);

  const devStats = { online: onlineCount, offline: offlineCount, unknown: unknownCount };

  return {
    devices: deviceRows,
    deviceStats: devStats,
    totalDevices: deviceTotal,
    onlineCount,
    offlineCount,
    providerLogs,
    syncJobs,
    serverHealth: {
      status: "ok" as const,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      dbStatus: "connected" as const,
      cpuCount: os.cpus().length,
    },
  };
};

export const actions = {
  retrySync: async ({ request }) => {
    const form = await request.formData();
    const jobId = form.get("jobId");

    if (!jobId) return fail(400, { error: "jobId required" });

    await db
      .update(prayerSyncJobs)
      .set({
        status: "pending",
        errorMessage: null,
        nextRetryAt: sql`NOW()`,
      })
      .where(eq(prayerSyncJobs.id, Number(jobId)));

    return { success: true };
  },
};
