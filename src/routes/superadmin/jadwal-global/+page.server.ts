import { desc, eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import {
  prayerProviders,
  prayerCalculationMethods,
  prayerSyncJobs,
  globalPrayerConfig,
} from "$lib/server/db/schema";
import { syncAllMasjids } from "$lib/server/prayer/sync";

export const load = async ({
  locals,
  url,
}: {
  locals: App.Locals;
  url: URL;
}) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const [providers, methods, recentJobs, configRows] = await Promise.all([
    db.select().from(prayerProviders).orderBy(prayerProviders.name),
    db
      .select()
      .from(prayerCalculationMethods)
      .orderBy(prayerCalculationMethods.methodCode),
    db
      .select()
      .from(prayerSyncJobs)
      .orderBy(desc(prayerSyncJobs.createdAt))
      .limit(20),
    db
      .select()
      .from(globalPrayerConfig)
      .where(eq(globalPrayerConfig.id, 1))
      .limit(1),
  ]);

  const config = configRows.length > 0 ? configRows[0] : null;

  return {
    providers,
    methods,
    recentJobs,
    config,
    refreshed: url.searchParams.get("refreshed") === "1",
    syncOk: url.searchParams.get("syncOk") === "1",
    syncMsg: url.searchParams.get("syncMsg") ?? null,
  };
};

export const actions = {
  updateProvider: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    const baseUrl = String(form.get("baseUrl") ?? "").trim();
    const isActive = form.get("isActive") === "1" ? 1 : 0;

    if (id) {
      await db
        .update(prayerProviders)
        .set({ baseUrl: baseUrl || null, isActive })
        .where(eq(prayerProviders.id, id));
    }

    return { saved: true };
  },

  updateGlobalConfig: async ({ request, locals }) => {
    const form = await request.formData();

    const primaryProviderId = form.get("primaryProviderId")
      ? Number(form.get("primaryProviderId"))
      : null;
    const fallbackProviderId = form.get("fallbackProviderId")
      ? Number(form.get("fallbackProviderId"))
      : null;
    const defaultMethodId = form.get("defaultMethodId")
      ? Number(form.get("defaultMethodId"))
      : null;
    const defaultTimezone = String(
      form.get("defaultTimezone") ?? "Asia/Jakarta",
    );
    const apiKey = String(form.get("apiKey") ?? "").trim() || null;
    const syncFrequency = String(form.get("syncFrequency") ?? "daily");
    const syncTime = String(form.get("syncTime") ?? "03:00");
    const lockProvider = form.get("lockProvider") === "1" ? 1 : 0;
    const lockMethod = form.get("lockMethod") === "1" ? 1 : 0;

    const updateData: Record<string, unknown> = {
      primaryProviderId,
      fallbackProviderId,
      defaultMethodId,
      defaultTimezone,
      apiKey,
      syncFrequency,
      syncTime: syncTime + ":00",
      lockProvider,
      lockMethod,
      updatedBy: locals.user?.id ?? null,
    };

    const existing = await db
      .select({ id: globalPrayerConfig.id })
      .from(globalPrayerConfig)
      .where(eq(globalPrayerConfig.id, 1))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(globalPrayerConfig)
        .set(updateData)
        .where(eq(globalPrayerConfig.id, 1));
    } else {
      await db.insert(globalPrayerConfig).values({ id: 1, ...updateData });
    }

    return { saved: true };
  },

  createProvider: async ({ request }) => {
    const form = await request.formData();
    const providerKey = String(form.get("providerKey") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const baseUrl = String(form.get("baseUrl") ?? "").trim() || null;

    if (providerKey && name) {
      await db.insert(prayerProviders).values({
        providerKey,
        name,
        baseUrl,
        isActive: 1,
      });
    }

    return { saved: true };
  },

  deleteProvider: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    if (id) {
      await db
        .update(prayerProviders)
        .set({ isActive: 0 })
        .where(eq(prayerProviders.id, id));
    }
    return { deleted: true };
  },

  refreshAllMasjids: async () => {
    const result = await syncAllMasjids();

    const syncStatus =
      result.errors.length > 0
        ? {
            ok: false,
            message: `${result.succeeded} berhasil, ${result.failed} gagal`,
          }
        : {
            ok: true,
            message: `Semua ${result.totalMasjids} masjid berhasil di-sync`,
          };

    const qp = new URLSearchParams();
    qp.set("refreshed", "1");
    qp.set("syncOk", syncStatus.ok ? "1" : "0");
    qp.set("syncMsg", syncStatus.message);

    throw redirect(302, `/superadmin/jadwal-global?${qp}`);
  },
};
