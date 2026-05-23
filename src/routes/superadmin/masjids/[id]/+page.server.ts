import { desc, eq, sql } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import {
  masjids,
  masjidUsers,
  users,
  devices,
  subscriptions,
  auditLogs,
} from "$lib/server/db/schema";

export const load = async ({
  locals,
  params,
}: {
  locals: App.Locals;
  params: Record<string, string>;
}) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const { id } = params;

  const [masjid] = await db
    .select()
    .from(masjids)
    .where(eq(masjids.id, id))
    .limit(1);
  if (!masjid) throw redirect(302, "/superadmin/masjids");

  const [adminRows, deviceRows, subscriptionRows, logRows] = await Promise.all([
    db
      .select({
        userId: masjidUsers.userId,
        fullName: users.fullName,
        email: users.email,
        roleScope: masjidUsers.roleScope,
        isActive: masjidUsers.isActive,
      })
      .from(masjidUsers)
      .innerJoin(users, eq(masjidUsers.userId, users.id))
      .where(eq(masjidUsers.masjidId, id)),
    db.select().from(devices).where(eq(devices.masjidId, id)),
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.masjidId, id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(10),
    db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.masjidId, id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(20),
  ]);

  return {
    masjid,
    admins: adminRows,
    devices: deviceRows,
    subscriptions: subscriptionRows,
    auditLogs: logRows,
  };
};

export const actions = {
  updateMasjid: async ({ request, params }) => {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    const province = String(form.get("province") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();
    const district = String(form.get("district") ?? "").trim();
    const timezone = String(form.get("timezone") ?? "Asia/Jakarta").trim();
    const latitude = form.get("latitude")
      ? String(form.get("latitude")).trim()
      : null;
    const longitude = form.get("longitude")
      ? String(form.get("longitude")).trim()
      : null;
    const hijriOffset = Number(form.get("hijriOffset") ?? 0);
    const adzanScreenDuration = Number(form.get("adzanScreenDuration") ?? 4);
    const khusukScreenDuration = Number(form.get("khusukScreenDuration") ?? 10);
    const screensaverDelayMinutes = Number(
      form.get("screensaverDelayMinutes") ?? 120,
    );
    const screensaverWakeMinutes = Number(
      form.get("screensaverWakeMinutes") ?? 60,
    );
    const screensaverMorningDelayMinutes = Number(
      form.get("screensaverMorningDelayMinutes") ?? 60,
    );
    const screensaverMorningWakeMinutes = Number(
      form.get("screensaverMorningWakeMinutes") ?? 120,
    );

    if (!name) return { error: "Nama wajib diisi" };

    await db
      .update(masjids)
      .set({
        name,
        city: city || null,
        province: province || null,
        address: address || null,
        district: district || null,
        timezone,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        hijriOffset,
        adzanScreenDuration,
        khusukScreenDuration,
        screensaverDelayMinutes,
        screensaverWakeMinutes,
        screensaverMorningDelayMinutes,
        screensaverMorningWakeMinutes,
      })
      .where(eq(masjids.id, params.id));

    return { saved: true };
  },

  toggleSuspend: async ({ params }) => {
    const [m] = await db
      .select({ isActive: masjids.isActive })
      .from(masjids)
      .where(eq(masjids.id, params.id))
      .limit(1);
    if (m) {
      await db
        .update(masjids)
        .set({ isActive: m.isActive ? 0 : 1 })
        .where(eq(masjids.id, params.id));
    }

    return { saved: true };
  },

  deleteMasjid: async ({ params }) => {
    await db.delete(masjids).where(eq(masjids.id, params.id));
    throw redirect(302, "/superadmin/masjids?deleted=1");
  },

  resetDevices: async ({ params }) => {
    await db
      .update(devices)
      .set({ pairedAt: null, lastSeenAt: null, status: "unknown", isActive: 0 })
      .where(eq(devices.masjidId, params.id));

    return { saved: true };
  },

  removeAdmin: async ({ request }) => {
    const form = await request.formData();
    const userId = String(form.get("user_id") ?? "").trim();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    if (userId && masjidId) {
      await db
        .delete(masjidUsers)
        .where(
          sql`${masjidUsers.masjidId} = ${masjidId} AND ${masjidUsers.userId} = ${userId}`,
        );
    }

    return { saved: true };
  },
};
