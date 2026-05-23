import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { randomUUID } from "node:crypto";
import { db } from "$lib/server/db";
import { masjids, masjidUsers, subscriptions } from "$lib/server/db/schema";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  // Redirect to dashboard — heavy data queries are done there
  throw redirect(302, "/superadmin/dashboard");
};

export const actions: Actions = {
  createMasjid: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    const province = String(form.get("province") ?? "").trim();
    const adminUserId = String(form.get("admin_user_id") ?? "").trim();
    const timezone = String(form.get("timezone") ?? "Asia/Jakarta").trim();
    if (!name || !adminUserId) return;

    const masjidId = randomUUID();
    await db.insert(masjids).values({
      id: masjidId,
      name,
      city: city || null,
      province: province || null,
      timezone,
      isActive: 1,
    });
    await db.insert(masjidUsers).values({
      masjidId,
      userId: adminUserId,
      roleScope: "owner",
      isActive: 1,
    });
  },

  createSubscription: async ({ request }) => {
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    const packageName = String(form.get("package_name") ?? "").trim();
    const billingCycle = String(form.get("billing_cycle") ?? "monthly") as
      | "monthly"
      | "yearly";
    const status = String(form.get("status") ?? "active") as
      | "trial"
      | "active"
      | "grace"
      | "expired"
      | "cancelled";
    const startDate = String(form.get("start_date") ?? "").trim();
    const endDate = String(form.get("end_date") ?? "").trim();
    const price = Number(form.get("price") ?? 0);
    const autoRenew = form.get("auto_renew") === "1" ? 1 : 0;

    if (!masjidId || !packageName || !startDate || !endDate) return;

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    await db.insert(subscriptions).values({
      masjidId,
      packageName,
      billingCycle,
      status,
      startDate: start,
      endDate: end,
      price: String(price),
      autoRenew,
    });
  },
};
