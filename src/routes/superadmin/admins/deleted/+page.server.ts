import { desc, eq, sql, count, like, or, isNull, and } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";

import { db } from "$lib/server/db";
import { users, userRoles, masjidUsers, masjids } from "$lib/server/db/schema";
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
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = and(
    sql`${users.deletedAt} IS NOT NULL`,
    search
      ? or(
          like(users.fullName, `%${search}%`),
          like(users.email, `%${search}%`),
        )
      : undefined,
  );

  const [deletedRows, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        deletedAt: users.deletedAt,
      })
      .from(users)
      .innerJoin(
        userRoles,
        sql`${users.id} = ${userRoles.userId} AND ${userRoles.roleId} = (SELECT id FROM roles WHERE code = 'admin_masjid')`,
      )
      .where(where)
      .orderBy(desc(users.deletedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ val: count() })
      .from(users)
      .innerJoin(
        userRoles,
        sql`${users.id} = ${userRoles.userId} AND ${userRoles.roleId} = (SELECT id FROM roles WHERE code = 'admin_masjid')`,
      )
      .where(where)
      .then((r) => Number(r[0].val)),
  ]);

  // Ambil asosiasi masjid untuk tiap admin terhapus
  const userIds = deletedRows.map((u) => u.id);
  let masjidMap: Record<string, { masjidId: string; masjidName: string }[]> =
    {};

  if (userIds.length > 0) {
    const masjidAssoc = await db
      .select({
        userId: masjidUsers.userId,
        masjidId: masjidUsers.masjidId,
        masjidName: masjids.name,
      })
      .from(masjidUsers)
      .innerJoin(masjids, eq(masjidUsers.masjidId, masjids.id))
      .where(
        sql`${masjidUsers.userId} IN (${sql.join(
          userIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    for (const a of masjidAssoc) {
      if (!masjidMap[a.userId]) masjidMap[a.userId] = [];
      masjidMap[a.userId].push({
        masjidId: a.masjidId,
        masjidName: a.masjidName,
      });
    }
  }

  return {
    deletedAdmins: deletedRows.map((u) => ({
      ...u,
      masjids: masjidMap[u.id] ?? [],
    })),
    total: totalResult,
    page,
    totalPages: Math.ceil(totalResult / limit),
    search,
    restored: url.searchParams.get("restored") === "1",
  };
};

export const actions = {
  restoreAdmin: async ({ request, locals }) => {
    const form = await request.formData();
    const userId = String(form.get("user_id") ?? "").trim();

    if (!userId) return { error: "User ID wajib diisi" };

    const [target] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.id, userId), sql`${users.deletedAt} IS NOT NULL`))
      .limit(1);

    if (!target) return { error: "User tidak ditemukan atau belum dihapus" };

    await db
      .update(users)
      .set({ deletedAt: null, isActive: 1 })
      .where(eq(users.id, userId));

    await writeAuditLog({
      userId: locals.user?.id,
      action: "restore",
      entity: "admin",
      entityId: userId,
      changesJson: JSON.stringify({ targetEmail: target.email }),
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });

    return { restored: true };
  },
};
