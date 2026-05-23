import { redirect } from "@sveltejs/kit";
export const load = async ({ locals }: { locals: App.Locals }) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  return {
    user: locals.user,
  };
};
