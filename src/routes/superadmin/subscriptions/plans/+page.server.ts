import { desc, eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { pricingPlans } from "$lib/server/db/schema";

export const load = async ({ locals }: { locals: App.Locals }) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const plans = await db
    .select()
    .from(pricingPlans)
    .orderBy(pricingPlans.sortOrder);

  return { plans };
};

export const actions = {
  createPlan: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const badge = String(form.get("badge") ?? "").trim();
    const priceMonthly = String(form.get("priceMonthly") ?? "0");
    const priceYearly = String(form.get("priceYearly") ?? "0");
    const priceNote = String(form.get("priceNote") ?? "").trim();
    const featuresJson = String(form.get("featuresJson") ?? "[]");
    const ctaLabel = String(form.get("ctaLabel") ?? "Mulai Gratis");
    const ctaHref = String(form.get("ctaHref") ?? "/auth/login");
    const isHighlight = form.get("isHighlight") === "1" ? 1 : 0;
    const sortOrder = Number(form.get("sortOrder") ?? 0);

    if (!name) return { error: "Nama paket wajib diisi" };

    await db.insert(pricingPlans).values({
      name,
      badge: badge || null,
      priceMonthly,
      priceYearly,
      priceNote: priceNote || null,
      featuresJson,
      ctaLabel,
      ctaHref,
      isHighlight,
      sortOrder,
      isActive: 1,
    });

    return { saved: true };
  },

  updatePlan: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    const name = String(form.get("name") ?? "").trim();
    const badge = String(form.get("badge") ?? "").trim();
    const priceMonthly = String(form.get("priceMonthly") ?? "0");
    const priceYearly = String(form.get("priceYearly") ?? "0");
    const priceNote = String(form.get("priceNote") ?? "").trim();
    const featuresJson = String(form.get("featuresJson") ?? "[]");
    const ctaLabel = String(form.get("ctaLabel") ?? "Mulai Gratis");
    const ctaHref = String(form.get("ctaHref") ?? "/auth/login");
    const isHighlight = form.get("isHighlight") === "1" ? 1 : 0;
    const sortOrder = Number(form.get("sortOrder") ?? 0);
    const isActive = form.get("isActive") === "1" ? 1 : 0;

    if (!id || !name) return { error: "Data tidak lengkap" };

    await db
      .update(pricingPlans)
      .set({
        name,
        badge: badge || null,
        priceMonthly,
        priceYearly,
        priceNote: priceNote || null,
        featuresJson,
        ctaLabel,
        ctaHref,
        isHighlight,
        sortOrder,
        isActive,
      })
      .where(eq(pricingPlans.id, id));

    return { saved: true };
  },

  deletePlan: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    if (id) {
      await db
        .update(pricingPlans)
        .set({ isActive: 0 })
        .where(eq(pricingPlans.id, id));
    }
    return { deleted: true };
  },
};
