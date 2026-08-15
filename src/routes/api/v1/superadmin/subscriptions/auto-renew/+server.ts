import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { processAutoRenew } from "$lib/server/subscription/auto-renew";

export const POST: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  if (!user) {
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  if (!hasAnyRole(user, ["superadmin"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await processAutoRenew();
    return json({ ok: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ ok: false, message: msg }, { status: 500 });
  }
};
