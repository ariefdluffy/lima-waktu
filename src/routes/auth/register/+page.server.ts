import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { roles, userRoles, users } from "$lib/server/db/schema";
import { hashPassword } from "$lib/server/auth/password";

export const load: PageServerLoad = async () => {
  return {};
};

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();

    const fullName = String(form.get("full_name") ?? "").trim();
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirm_password") ?? "");
    const phone = String(form.get("phone") ?? "").trim();

    if (!fullName || !email || !password) {
      return {
        error: "Nama, email, dan password wajib diisi",
        fullName,
        email,
        phone,
      };
    }

    if (password !== confirmPassword) {
      return {
        error: "Password tidak cocok",
        fullName,
        email,
        phone,
      };
    }

    if (password.length < 6) {
      return {
        error: "Password minimal 6 karakter",
        fullName,
        email,
        phone,
      };
    }

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return {
        error: "Email sudah terdaftar",
        fullName,
        email,
        phone,
      };
    }

    const passwordHash = hashPassword(password);

    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      fullName,
      phone: phone || null,
      isActive: 1,
    });

    const [adminMasjidRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.code, "admin_masjid"))
      .limit(1);

    if (!adminMasjidRole) {
      return {
        error: "Role admin_masjid tidak ditemukan di database",
        fullName,
        email,
        phone,
      };
    }

    await db.insert(userRoles).values({
      userId,
      roleId: adminMasjidRole.id,
    });

    throw redirect(302, "/auth/login");
  },
};
