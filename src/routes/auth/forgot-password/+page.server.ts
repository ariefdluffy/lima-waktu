import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { users, passwordResets } from "$lib/server/db/schema";
import { sendResetPasswordEmail } from "$lib/email/notification";

export const load: PageServerLoad = async () => {
  return {};
};

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    if (!email) {
      return { error: "Email wajib diisi", ok: false };
    }

    const [user] = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Jangan bocorkan apakah email terdaftar — tetap kasih pesan sukses
    if (!user) {
      return { ok: true, message: "Jika email terdaftar, tautan reset akan dikirim." };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    // Nonaktifkan token lama untuk user ini
    await db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(passwordResets.userId, user.id));

    await db.insert(passwordResets).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Kirim email — jangan blokir response
    sendResetPasswordEmail({
      email,
      fullName: user.fullName,
      token,
      expiresInHours: 1,
    }).catch((err) => {
      console.error("[forgot-password] Gagal kirim email:", err);
    });

    return { ok: true, message: "Jika email terdaftar, tautan reset akan dikirim." };
  },
};
