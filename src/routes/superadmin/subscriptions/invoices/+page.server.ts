import { desc, eq, sql, count, and } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { invoices, subscriptions, masjids } from "$lib/server/db/schema";
import { isSubscriptionExpired } from "$lib/utils/subscription";

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
    const status = String(form.get("status") ?? "").trim() as
      | "draft"
      | "pending"
      | "paid"
      | "failed"
      | "cancelled";

    if (!id || !status) return { error: "Data tidak lengkap." };

    // Ambil info invoice + subscription terkait
    const [inv] = await db
      .select({
        id: invoices.id,
        subscriptionId: invoices.subscriptionId,
        status: invoices.status,
        amount: invoices.amount,
      })
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!inv) return { error: "Invoice tidak ditemukan." };

    const updateData: Record<string, unknown> = { status };
    if (status === "paid") updateData.paidAt = new Date();

    await db.update(invoices).set(updateData).where(eq(invoices.id, id));

    // Jika invoice dibayar, perpanjang/aktifkan subscription
    if (status === "paid" && inv.subscriptionId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, inv.subscriptionId))
        .limit(1);

      if (sub) {
        const now = new Date();
        const amountNum = Number(inv.amount);
        // Hitung penambahan hari: default 30 hari per pembayaran
        // TODO: sesuaikan dengan billingCycle jika disimpan di invoice
        const addDays = amountNum > 0 ? 30 : 0;

        // Jika subscription masih aktif, perpanjang dari endDate
        // Jika sudah expired, mulai dari hari ini
        const currentEnd = new Date(sub.endDate);
        const newStart = isSubscriptionExpired(sub) ? now : currentEnd;
        const newEnd = new Date(newStart);
        newEnd.setDate(newEnd.getDate() + addDays);

        await db
          .update(subscriptions)
          .set({
            status: "active",
            endDate: newEnd,
          })
          .where(eq(subscriptions.id, sub.id));
      }
    }

    return { saved: true };
  },

  generateInvoice: async ({ request }) => {
    const form = await request.formData();
    const subscriptionId = Number(form.get("subscriptionId") ?? 0);
    const amountRaw = String(form.get("amount") ?? "0");
    const dueDateRaw = String(form.get("dueDate") ?? "");
    const paymentMethod =
      String(form.get("paymentMethod") ?? "").trim() || null;

    if (!subscriptionId || !amountRaw || !dueDateRaw) {
      return { error: "Semua field wajib diisi." };
    }

    const amountNum = Number(amountRaw);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { error: "Amount harus berupa angka positif." };
    }

    const dueDate = new Date(dueDateRaw);
    if (isNaN(dueDate.getTime())) {
      return { error: "Tanggal jatuh tempo tidak valid." };
    }

    // Get subscription details
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!sub) {
      return { error: "Subskripsi tidak ditemukan." };
    }

    // Cek apakah ada invoice draft/pending untuk subscription yang sama
    const [existingInvoice] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(
        and(
          eq(invoices.subscriptionId, subscriptionId),
          sql`${invoices.status} IN ('draft', 'pending')`,
        ),
      )
      .limit(1);

    if (existingInvoice) {
      return { error: "Sudah ada invoice draft/pending untuk subscription ini." };
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
      amount: amountRaw,
      dueDate,
      paymentMethod,
      status: "draft",
    });

    return { saved: true };
  },
};
