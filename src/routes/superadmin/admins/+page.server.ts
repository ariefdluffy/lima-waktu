import { desc, eq, sql, count, like, or } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { randomUUID } from "node:crypto";

import { db } from "$lib/server/db";
import {
  users,
  userRoles,
  roles,
  masjidUsers,
  masjids,
  auditLogs,
} from "$lib/server/db/schema";
import { hashPassword } from "$lib/server/auth/password";

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

  const whereConditions = [];
  if (search) {
    whereConditions.push(
      or(like(users.fullName, `%${search}%`), like(users.email, `%${search}%`)),
    );
  }

  const where =
    whereConditions.length > 0
      ? sql`${sql.join(whereConditions, sql` AND `)}`
      : undefined;

  const [adminRows, totalResult, allMasjids, auditLogRows] = await Promise.all([
    db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(
        userRoles,
        sql`${users.id} = ${userRoles.userId} AND ${userRoles.roleId} = (SELECT id FROM roles WHERE code = 'admin_masjid')`,
      )
      .where(where)
      .orderBy(desc(users.createdAt))
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
    db
      .select({ id: masjids.id, name: masjids.name })
      .from(masjids)
      .where(eq(masjids.isActive, 1))
      .orderBy(masjids.name),
    db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(20),
  ]);

  // Get masjid association for each admin
  const userIds = adminRows.map((u) => u.id);
  let masjidMap: Record<
    string,
    { masjidId: string; masjidName: string; roleScope: string }[]
  > = {};

  if (userIds.length > 0) {
    const masjidAssoc = await db
      .select({
        userId: masjidUsers.userId,
        masjidId: masjidUsers.masjidId,
        masjidName: masjids.name,
        roleScope: masjidUsers.roleScope,
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
        roleScope: a.roleScope,
      });
    }
  }

  return {
    admins: adminRows.map((u) => ({
      ...u,
      masjids: masjidMap[u.id] ?? [],
    })),
    total: totalResult,
    page,
    totalPages: Math.ceil(totalResult / limit),
    search,
    masjids: allMasjids,
    auditLogs: auditLogRows,
    success: url.searchParams.get("success"),
  };
};

export const actions = {
  createAdmin: async ({ request }) => {
    const form = await request.formData();
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const phone = String(form.get("phone") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    const roleScope = String(form.get("roleScope") ?? "owner").trim();

    if (!fullName || !email || !password) {
      return { error: "Nama, email, dan password wajib diisi" };
    }
    if (password.length < 6) {
      return { error: "Password minimal 6 karakter" };
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      return { error: "Email sudah terdaftar" };
    }

    const userId = randomUUID();
    const passwordHash = hashPassword(password);

    await db.insert(users).values({
      id: userId,
      fullName,
      email,
      phone: phone || null,
      passwordHash,
      isActive: 1,
    });

    // Assign role "admin_masjid"
    const [adminRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.code, "admin_masjid"))
      .limit(1);

    if (adminRole) {
      await db.insert(userRoles).values({ userId, roleId: adminRole.id });
    }

    if (masjidId) {
      await db.insert(masjidUsers).values({
        masjidId,
        userId,
        roleScope: roleScope as "owner" | "operator" | "viewer",
        isActive: 1,
      });
    }

    throw redirect(302, "/superadmin/admins?success=created");
  },

  updateAdmin: async ({ request }) => {
    const form = await request.formData();
    const userId = String(form.get("user_id") ?? "").trim();
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const phone = String(form.get("phone") ?? "").trim();

    if (!userId || !fullName) return { error: "Data tidak lengkap" };

    await db
      .update(users)
      .set({ fullName, email, phone: phone || null })
      .where(eq(users.id, userId));

    return { saved: true };
  },

  resetPassword: async ({ request }) => {
    const form = await request.formData();
    const userId = String(form.get("user_id") ?? "").trim();
    const newPassword = String(form.get("password") ?? "").trim();

    if (!userId || !newPassword || newPassword.length < 6) {
      return { error: "Password minimal 6 karakter" };
    }

    const passwordHash = hashPassword(newPassword);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return { newPassword };
  },

  toggleActive: async ({ request }) => {
    const form = await request.formData();
    const userId = String(form.get("user_id") ?? "").trim();
    const currentActive = Number(form.get("is_active") ?? 1);

    if (!userId) return;
    await db
      .update(users)
      .set({ isActive: currentActive ? 0 : 1 })
      .where(eq(users.id, userId));

    return { saved: true };
  },

  assignMasjid: async ({ request }) => {
    const form = await request.formData();
    const userId = String(form.get("user_id") ?? "").trim();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    const roleScope = String(form.get("roleScope") ?? "operator").trim();

    if (!userId || !masjidId) return;

    const [existing] = await db
      .select({ id: masjidUsers.id })
      .from(masjidUsers)
      .where(
        sql`${masjidUsers.userId} = ${userId} AND ${masjidUsers.masjidId} = ${masjidId}`,
      )
      .limit(1);

    if (existing) return { error: "Admin sudah terdaftar di masjid ini" };

    await db.insert(masjidUsers).values({
      masjidId,
      userId,
      roleScope: roleScope as "owner" | "operator" | "viewer",
      isActive: 1,
    });

    return { saved: true };
  },

  removeMasjid: async ({ request }) => {
    const form = await request.formData();
    const userId = String(form.get("user_id") ?? "").trim();
    const masjidId = String(form.get("masjid_id") ?? "").trim();

    if (userId && masjidId) {
      await db
        .delete(masjidUsers)
        .where(
          sql`${masjidUsers.userId} = ${userId} AND ${masjidUsers.masjidId} = ${masjidId}`,
        );
    }

    return { deleted: true };
  },
};
