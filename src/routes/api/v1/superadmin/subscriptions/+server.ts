import { and, desc, eq } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { authenticateEvent, hasAnyRole } from "$lib/server/auth/basic";
import { db } from "$lib/server/db";
import { masjids, subscriptions } from "$lib/server/db/schema";

type CreateSubscriptionBody = {
  masjidId?: string;
  packageName?: string;
  billingCycle?: "monthly" | "yearly";
  status?: "trial" | "active" | "grace" | "expired" | "cancelled";
  startDate?: string;
  endDate?: string;
  price?: number;
  autoRenew?: boolean;
};

function parseDateOnly(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d;
}

export const GET: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  if (!user) return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const masjidId = event.url.searchParams.get("masjid_id");
  const status = event.url.searchParams.get("status");

  const conditions = [];
  if (masjidId) conditions.push(eq(subscriptions.masjidId, masjidId));
  if (status) conditions.push(eq(subscriptions.status, status as "trial" | "active" | "grace" | "expired" | "cancelled"));

  const rows = await db
    .select({
      id: subscriptions.id,
      masjidId: subscriptions.masjidId,
      masjidName: masjids.name,
      packageName: subscriptions.packageName,
      billingCycle: subscriptions.billingCycle,
      status: subscriptions.status,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      price: subscriptions.price,
      autoRenew: subscriptions.autoRenew,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .leftJoin(masjids, eq(subscriptions.masjidId, masjids.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(subscriptions.createdAt));

  return json({ ok: true, data: rows });
};

export const POST: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  if (!user) return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const body = (await event.request.json().catch(() => null)) as CreateSubscriptionBody | null;
  if (!body?.masjidId || !body?.packageName || !body?.startDate || !body?.endDate) {
    return json({ ok: false, message: "masjidId, packageName, startDate, endDate wajib diisi" }, { status: 400 });
  }

  const startDate = parseDateOnly(body.startDate);
  const endDate = parseDateOnly(body.endDate);
  if (!startDate || !endDate) {
    return json({ ok: false, message: "startDate/endDate harus format YYYY-MM-DD" }, { status: 400 });
  }

  await db.insert(subscriptions).values({
    masjidId: body.masjidId,
    packageName: body.packageName,
    billingCycle: body.billingCycle ?? "monthly",
    status: body.status ?? "active",
    startDate,
    endDate,
    price: String(body.price ?? 0),
    autoRenew: body.autoRenew ? 1 : 0,
  });

  const [created] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.masjidId, body.masjidId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return json({ ok: true, data: created }, { status: 201 });
};

export const PUT: RequestHandler = async (event) => {
  const user = await authenticateEvent(event);
  if (!user) return json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!hasAnyRole(user, ["superadmin"])) {
    return json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const id = Number(event.url.searchParams.get("id"));
  if (!id) return json({ ok: false, message: "id wajib diisi" }, { status: 400 });

  const body = (await event.request.json().catch(() => null)) as CreateSubscriptionBody | null;
  if (!body) return json({ ok: false, message: "Body tidak valid" }, { status: 400 });

  const startDate = parseDateOnly(body.startDate);
  const endDate = parseDateOnly(body.endDate);

  await db
    .update(subscriptions)
    .set({
      packageName: body.packageName,
      billingCycle: body.billingCycle,
      status: body.status,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      price: body.price !== undefined ? String(body.price) : undefined,
      autoRenew: body.autoRenew !== undefined ? (body.autoRenew ? 1 : 0) : undefined,
    })
    .where(eq(subscriptions.id, id));

  const [updated] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .limit(1);

  return json({ ok: true, data: updated });
};
