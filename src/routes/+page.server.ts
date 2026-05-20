import type { PageServerLoad } from "./$types";
import { asc, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { pricingPlans } from "$lib/server/db/schema";

export const load: PageServerLoad = async ({ locals }) => {
  const plans = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.isActive, 1))
    .orderBy(asc(pricingPlans.sortOrder));

  return {
    user: locals.user ?? null,
    plans,
  };
};
