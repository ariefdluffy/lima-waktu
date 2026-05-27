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

  const [deviceRows, deviceTotal, deviceCount, providerLogs, syncJobs] = await Promise.all([
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
    // Device stats
    db
      .select({
        status: devices.status,
        val: count(),
      })
      .from(devices)
      .groupBy(devices.status),
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

  const devStats: Record<string, number> = {
    online: 0,
    offline: 0,
    unknown: 0,
  };
  for (const d of deviceCount) {
    devStats[d.status] = Number(d.val);
  }

  return {
    devices: deviceRows,
    deviceStats: devStats,
    totalDevices: deviceTotal,
    onlineCount: devStats["online"] ?? 0,
    offlineCount: devStats["offline"] ?? 0,
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
