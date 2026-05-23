import { desc, eq, sql, count } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { invoices, subscriptions, masjids } from "$lib/server/db/schema";

export const load = async ({
  locals,
  url,
}: {
  locals: App.Locals;
  url: URL;
}) => {
  if (!locals.user) throw redirect(302, "/auth/login");
  if (!locals.user.roles.includes("superadmin")) throw redirect(302, "/admin");

  const statusFilter = url.searchParams.get("status") ?? "all";
  const masjidIdFilter = url.searchParams.get("masjid_id") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const whereConditions = [];
  if (statusFilter !== "all") {
    whereConditions.push(
      eq(
        invoices.status,
        statusFilter as "draft" | "pending" | "paid" | "failed" | "cancelled",
      ),
    );
  }
  if (masjidIdFilter) {
    whereConditions.push(eq(invoices.masjidId, masjidIdFilter));
  }

  const where =
    whereConditions.length > 0
      ? sql`${sql.join(whereConditions, sql` AND `)}`
      : undefined;

  const [invRows, totalResult, masjidRows] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(where)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ val: count() })
      .from(invoices)
      .where(where)
      .then((r) => Number(r[0].val)),
    db
      .select({ id: masjids.id, name: masjids.name })
      .from(masjids)
      .orderBy(masjids.name),
  ]);

  const masjidMap: Record<string, string> = {};
  for (const m of masjidRows) masjidMap[m.id] = m.name;

  // Get subscription info for each invoice
  const subIds = [...new Set(invRows.map((inv) => inv.subscriptionId))];
  let subMap: Record<number, { packageName: string; masjidName: string }> = {};

  if (subIds.length > 0) {
    const subRows = await db
      .select({
        id: subscriptions.id,
        packageName: subscriptions.packageName,
        masjidId: subscriptions.masjidId,
      })
      .from(subscriptions)
      .where(
        sql`${subscriptions.id} IN (${sql.join(
          subIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
    for (const s of subRows) {
      subMap[Number(s.id)] = {
        packageName: s.packageName,
        masjidName: masjidMap[s.masjidId] ?? s.masjidId,
      };
    }
  }

  // Get all subscriptions for generate invoice dropdown
  const allSubRows = await db
    .select({
      id: subscriptions.id,
      packageName: subscriptions.packageName,
      masjidId: subscriptions.masjidId,
    })
    .from(subscriptions)
    .orderBy(subscriptions.packageName);

  return {
    invoices: invRows.map((inv) => ({
      ...inv,
      packageName: subMap[Number(inv.subscriptionId)]?.packageName ?? "-",
      masjidName: subMap[Number(inv.subscriptionId)]?.masjidName ?? "-",
    })),
    subscriptions: allSubRows.map((s) => ({
      id: Number(s.id),
      packageName: s.packageName,
      masjidName: masjidMap[s.masjidId] ?? s.masjidId,
    })),
    masjids: masjidRows,
    page,
    totalPages: Math.ceil(totalResult / limit),
    statusFilter,
    masjidIdFilter,
  };
};

export const actions = {
  updateStatus: async ({ request }) => {
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    const status = String(form.get("status") ?? "").trim();
    if (id && status) {
      const updateData: Record<string, unknown> = { status };
      if (status === "paid") updateData.paidAt = new Date();
      await db.update(invoices).set(updateData).where(eq(invoices.id, id));
    }

    return { saved: true };
  },

  generateInvoice: async ({ request }) => {
    const form = await request.formData();
    const subscriptionId = Number(form.get("subscriptionId") ?? 0);
    const amount = String(form.get("amount") ?? "0");
    const dueDate = String(form.get("dueDate") ?? "");
    const paymentMethod =
      String(form.get("paymentMethod") ?? "").trim() || null;

    if (!subscriptionId || !amount || !dueDate) {
      return { error: "Semua field wajib diisi." };
    }

    // Get masjidId from subscription
    const sub = await db
      .select({ masjidId: subscriptions.masjidId })
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!sub) {
      return { error: "Subskripsi tidak ditemukan." };
    }

    const now = new Date();
    const yyyymm =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `INV-${yyyymm}-${rand}`;

    await db.insert(invoices).values({
      subscriptionId,
      masjidId: sub.masjidId,
      invoiceNo,
      amount,
      dueDate: dueDate ? new Date(dueDate) : null,
      paymentMethod,
      status: "draft",
    });

    return { saved: true };
  },
};
