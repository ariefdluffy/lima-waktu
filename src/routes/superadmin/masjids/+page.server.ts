import { desc, eq, sql, count, like, or } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { randomUUID } from "node:crypto";
import { db } from "$lib/server/db";
import {
  masjids,
  masjidUsers,
  users,
  subscriptions,
  devices,
} from "$lib/server/db/schema";
import { writeAuditLog } from "$lib/server/audit";

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
  if (search) {
    whereConditions.push(
      or(like(masjids.name, `%${search}%`), like(masjids.city, `%${search}%`)),
    );
  }
  if (statusFilter === "active") {
    whereConditions.push(eq(masjids.isActive, 1));
  } else if (statusFilter === "suspended") {
    whereConditions.push(eq(masjids.isActive, 0));
  }

  const where =
    whereConditions.length > 0
      ? sql`${sql.join(whereConditions, sql` AND `)}`
      : undefined;

  const [masjidRows, totalResult] = await Promise.all([
    db
      .select({
        id: masjids.id,
        name: masjids.name,
        city: masjids.city,
        province: masjids.province,
        timezone: masjids.timezone,
        isActive: masjids.isActive,
        createdAt: masjids.createdAt,
      })
      .from(masjids)
      .where(where)
      .orderBy(desc(masjids.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ val: count() })
      .from(masjids)
      .where(where)
      .then((r) => Number(r[0].val)),
  ]);

  // Get subscription status and device count per masjid
  const masjidIds = masjidRows.map((m) => m.id);
  let subMap: Record<string, { status: string; packageName: string }> = {};
  let deviceCountMap: Record<string, number> = {};
  let deviceOnlineMap: Record<string, number> = {};

  if (masjidIds.length > 0) {
    const [subRows, deviceRows] = await Promise.all([
      db
        .select({
          masjidId: subscriptions.masjidId,
          status: subscriptions.status,
          packageName: subscriptions.packageName,
        })
        .from(subscriptions)
        .where(
          sql`${subscriptions.masjidId} IN (${sql.join(
            masjidIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        ),
      db
        .select({
          masjidId: devices.masjidId,
          isOnline: sql<number>`CASE WHEN ${devices.lastSeenAt} > NOW() - INTERVAL 5 MINUTE THEN 1 ELSE 0 END`,
        })
        .from(devices)
        .where(
          sql`${devices.masjidId} IN (${sql.join(
            masjidIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        ),
    ]);

    for (const s of subRows) {
      if (!subMap[s.masjidId]) {
        subMap[s.masjidId] = { status: s.status, packageName: s.packageName };
      }
    }
    for (const d of deviceRows) {
      deviceCountMap[d.masjidId] = (deviceCountMap[d.masjidId] ?? 0) + 1;
      if (d.isOnline)
        deviceOnlineMap[d.masjidId] = (deviceOnlineMap[d.masjidId] ?? 0) + 1;
    }
  }

  const allUsers = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email })
    .from(users)
    .orderBy(users.fullName);

  return {
    masjids: masjidRows.map((m) => ({
      ...m,
      subscription: subMap[m.id] ?? null,
      deviceCount: deviceCountMap[m.id] ?? 0,
      deviceOnline: deviceOnlineMap[m.id] ?? 0,
    })),
    total: totalResult,
    page,
    totalPages: Math.ceil(totalResult / limit),
    search,
    statusFilter,
    users: allUsers,
    createSuccess: url.searchParams.get("created") === "1",
    deleted: url.searchParams.get("deleted") === "1",
  };
};

export const actions = {
  createMasjid: async ({ request, locals }) => {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    const province = String(form.get("province") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();
    const district = String(form.get("district") ?? "").trim();
    const adminUserId = String(form.get("admin_user_id") ?? "").trim();
    const timezone = String(form.get("timezone") ?? "Asia/Jakarta").trim();

    if (!name) return { error: "Nama masjid wajib diisi" };

    const masjidId = randomUUID();
    await db.insert(masjids).values({
      id: masjidId,
      name,
      city: city || null,
      province: province || null,
      address: address || null,
      district: district || null,
      timezone,
      isActive: 1,
    });

    if (adminUserId) {
      await db.insert(masjidUsers).values({
        masjidId,
        userId: adminUserId,
        roleScope: "owner",
        isActive: 1,
      });
    }

    await writeAuditLog({
        masjidId,
        userId: locals.user?.id,
        action: "create",
        entity: "masjid",
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      });
    throw redirect(302, "/superadmin/masjids?created=1");
  },

  toggleSuspend: async ({ request, locals }) => {
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    const currentActive = Number(form.get("is_active") ?? 1);
    if (!masjidId) return;

    await db
      .update(masjids)
      .set({ isActive: currentActive ? 0 : 1 })
      .where(eq(masjids.id, masjidId));

    await writeAuditLog({
        masjidId,
        userId: locals.user?.id,
        action: "update",
        entity: "masjid_suspend",
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      });

    return { saved: true };
  },

  deleteMasjid: async ({ request, locals }) => {
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    if (!masjidId) return;

    await db.delete(masjids).where(eq(masjids.id, masjidId));

    await writeAuditLog({
        masjidId,
        userId: locals.user?.id,
        action: "delete",
        entity: "masjid",
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      });

    return { deleted: true };
  },
};
