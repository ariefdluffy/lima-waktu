import { eq, desc } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { themes } from "$lib/server/db/schema";

export const load = async ({ locals }: { locals: App.Locals }) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const globalThemes = await db
    .select()
    .from(themes)
    .where(eq(themes.isGlobal, 1))
    .orderBy(desc(themes.createdAt));

  const allThemes = await db
    .select()
    .from(themes)
    .orderBy(desc(themes.createdAt));

  return {
    globalThemes,
    allThemes,
  };
};

export const actions = {
  createTheme: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const themeKey = String(form.get("theme_key") ?? "").trim();
    const paletteJson = String(form.get("palette_json") ?? "").trim();
    const layoutJson = String(form.get("layout_json") ?? "").trim();
    const isGlobal = form.get("is_global") === "1" ? 1 : 0;

    if (!name || !themeKey) return { error: "Nama dan Theme Key wajib diisi" };

    const val: typeof themes.$inferInsert = {
      name,
      themeKey,
      isGlobal,
      isActive: 1,
    };
    if (paletteJson) {
      try {
        val.paletteJson = JSON.parse(paletteJson);
      } catch {
        return { error: "Palette JSON tidak valid" };
      }
    }
    if (layoutJson) {
      try {
        val.layoutJson = JSON.parse(layoutJson);
      } catch {
        return { error: "Layout JSON tidak valid" };
      }
    }

    await db.insert(themes).values(val);

    return { saved: true };
  },

  updateTheme: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    const name = String(form.get("name") ?? "").trim();
    const themeKey = String(form.get("theme_key") ?? "").trim();
    const paletteJson = String(form.get("palette_json") ?? "").trim();
    const layoutJson = String(form.get("layout_json") ?? "").trim();
    const isGlobal = form.get("is_global") === "1" ? 1 : 0;

    if (!id || !name || !themeKey) return;

    const updateData: Record<string, unknown> = { name, themeKey, isGlobal };
    if (paletteJson) {
      try {
        updateData.paletteJson = JSON.parse(paletteJson);
      } catch {
        return { error: "Palette JSON tidak valid" };
      }
    }
    if (layoutJson) {
      try {
        updateData.layoutJson = JSON.parse(layoutJson);
      } catch {
        return { error: "Layout JSON tidak valid" };
      }
    }

    await db.update(themes).set(updateData).where(eq(themes.id, id));

    return { saved: true };
  },

  toggleActive: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    const currentActive = Number(form.get("is_active") ?? 1);
    if (!id) return;

    await db
      .update(themes)
      .set({ isActive: currentActive ? 0 : 1 })
      .where(eq(themes.id, id));

    return { saved: true };
  },

  deleteTheme: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    if (!id) return;

    await db.update(themes).set({ isActive: 0 }).where(eq(themes.id, id));

    return { deleted: true };
  },
};
