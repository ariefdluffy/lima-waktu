import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/auth/login");
  }

  if (locals.user.roles.includes("superadmin")) {
    throw redirect(302, "/superadmin");
  }

  throw redirect(302, "/admin");
};
