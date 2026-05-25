import { eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { passwordResets, users } from "$lib/server/db/schema";
import { hashPassword } from "$lib/server/auth/password";

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get("token");

  if (!token) {
    return { valid: false as const, error: "Token tidak ditemukan" };
  }

  const [record] = await db
    .select({
      id: passwordResets.id,
      userId: passwordResets.userId,
      expiresAt: passwordResets.expiresAt,
      usedAt: passwordResets.usedAt,
    })
    .from(passwordResets)
    .where(eq(passwordResets.token, token))
    .limit(1);

  if (!record) {
    return { valid: false as const, error: "Token tidak valid" };
  }

  if (record.usedAt) {
    return { valid: false as const, error: "Token sudah digunakan" };
  }

  if (new Date() > new Date(record.expiresAt)) {
    return { valid: false as const, error: "Token sudah kedaluwarsa" };
  }

  return { valid: true as const, token };
};

export const actions: Actions = {
  default: async ({ request, url }) => {
    const token = url.searchParams.get("token");
    if (!token) {
      return { error: "Token tidak ditemukan" };
    }

    const form = await request.formData();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirm_password") ?? "");

    if (!password || password.length < 6) {
      return { error: "Password minimal 6 karakter" };
    }

    if (password !== confirmPassword) {
      return { error: "Password tidak cocok" };
    }

    const [record] = await db
      .select({
        id: passwordResets.id,
        userId: passwordResets.userId,
        expiresAt: passwordResets.expiresAt,
        usedAt: passwordResets.usedAt,
      })
      .from(passwordResets)
      .where(eq(passwordResets.token, token))
      .limit(1);

    if (!record || record.usedAt || new Date() > new Date(record.expiresAt)) {
      return { error: "Token tidak valid atau sudah kedaluwarsa" };
    }

    const passwordHash = hashPassword(password);

    await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
    await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, record.id));

    throw redirect(302, "/auth/login?toast=password_reset");
  },
};
