import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent } from "$lib/server/auth/basic";

export const GET: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);

  if (!user) {
    return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  return json({ ok: true, data: user });
};
