import { redirect, type RequestHandler } from "@sveltejs/kit";
import { destroySession } from "$lib/server/auth/session";
import { writeAuditLog } from "$lib/server/audit";
import { getAuthenticatedUserFromSession } from "$lib/server/auth/session";

export const POST: RequestHandler = async (event) => {
  const user = await getAuthenticatedUserFromSession(event);

  if (user) {
    await writeAuditLog({
      userId: user.id,
      action: "logout",
      entity: "user_session",
      ipAddress:
        event.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        null,
      userAgent: event.request.headers.get("user-agent"),
    });
  }

  await destroySession(event.cookies);
  throw redirect(302, "/auth/login?toast=logged_out");
};
