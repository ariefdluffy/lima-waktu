import { desc, eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { mediaAssets, platformAnnouncements } from "$lib/server/db/schema";

export const load = async ({ locals }: { locals: App.Locals }) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const [assets, announcements] = await Promise.all([
    db
      .select()
      .from(mediaAssets)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(50),
    db
      .select()
      .from(platformAnnouncements)
      .orderBy(desc(platformAnnouncements.createdAt))
      .limit(50),
  ]);

  return { assets, announcements };
};

export const actions = {
  createAnnouncement: async ({ request, locals }) => {
    if (!locals.user) throw redirect(302, "/auth/login");

    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();
    const severity = String(form.get("severity") ?? "info");
    const targetAudience = String(form.get("targetAudience") ?? "all");
    const startAtStr = String(form.get("startAt") ?? "").trim();
    const endAtStr = String(form.get("endAt") ?? "").trim();

    if (!title) return { error: "Judul wajib diisi" };

    const insertData: typeof platformAnnouncements.$inferInsert = {
      title,
      content: content || null,
      severity: severity as "info" | "warning" | "critical",
      targetAudience: targetAudience as "all" | "admins" | "superadmins",
      startAt: startAtStr ? new Date(startAtStr) : null,
      endAt: endAtStr ? new Date(endAtStr) : null,
      createdBy: locals.user.id ?? null,
    };
    await db.insert(platformAnnouncements).values(insertData);
  },

  toggleAnnouncement: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id"));

    if (!id) return;

    const [existing] = await db
      .select({ isActive: platformAnnouncements.isActive })
      .from(platformAnnouncements)
      .where(eq(platformAnnouncements.id, id))
      .limit(1);

    if (existing) {
      await db
        .update(platformAnnouncements)
        .set({ isActive: existing.isActive ? 0 : 1 })
        .where(eq(platformAnnouncements.id, id));
    }
  },

  deleteAnnouncement: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id"));

    if (!id) return;

    await db
      .delete(platformAnnouncements)
      .where(eq(platformAnnouncements.id, id));
  },
};
