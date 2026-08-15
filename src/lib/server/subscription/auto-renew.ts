import { eq, sql, and, inArray, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import { subscriptions, invoices, auditLogs } from "$lib/server/db/schema";
import { isSubscriptionExpired } from "$lib/utils/subscription";

/**
 * Proses auto-renew: cari subscription yang expired tapi autoRenew = 1,
 * perpanjang endDate sesuai billingCycle, dan buat invoice.
 */
export async function processAutoRenew(): Promise<{
  renewed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let renewed = 0;

  try {
    // Ambil semua subscription yang auto_renew = 1, status bukan expired/cancelled
    const candidates = await db
      .select({
        id: subscriptions.id,
        masjidId: subscriptions.masjidId,
        packageName: subscriptions.packageName,
        billingCycle: subscriptions.billingCycle,
        status: subscriptions.status,
        endDate: subscriptions.endDate,
        price: subscriptions.price,
        maxDevices: subscriptions.maxDevices,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.autoRenew, 1),
          inArray(subscriptions.status, ["active", "trial", "grace"]),
        ),
      );

    const now = new Date();
    const yyyymm =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0");

    for (const sub of candidates) {
      // Cek benar-benar expired berdasarkan endDate
      const expired = isSubscriptionExpired(sub, now);
      if (!expired) continue;

      try {
        // Hitung durasi perpanjangan
        const months = sub.billingCycle === "yearly" ? 12 : 1;
        const newEndDate = new Date(sub.endDate);
        newEndDate.setMonth(newEndDate.getMonth() + months);

        // Update subscription
        await db
          .update(subscriptions)
          .set({
            endDate: newEndDate,
            status: "active",
          })
          .where(eq(subscriptions.id, sub.id));

        // Buat invoice untuk renewal
        const rand = Math.floor(1000 + Math.random() * 9000);
        const invoiceNo = `INV-${yyyymm}-${rand}`;
        await db.insert(invoices).values({
          subscriptionId: sub.id,
          masjidId: sub.masjidId,
          invoiceNo,
          amount: sub.price,
          dueDate: newEndDate,
          status: "pending",
        });

        // Audit log
        await db.insert(auditLogs).values({
          masjidId: sub.masjidId,
          action: "update",
          entity: "subscription_autorenew",
          entityId: String(sub.id),
          changesJson: JSON.stringify({
            previousEndDate: sub.endDate,
            newEndDate,
            billingCycle: sub.billingCycle,
            invoiceNo,
          }),
          createdAt: now,
        });

        console.log(
          `[AutoRenew] ${sub.packageName} (${sub.billingCycle}) #${sub.id}: extended to ${newEndDate.toISOString().split("T")[0]}`,
        );
        renewed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[AutoRenew] Failed for sub #${sub.id}:`, msg);
        errors.push(`Subscription #${sub.id}: ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AutoRenew] Fatal error:", msg);
    errors.push(`Fatal: ${msg}`);
  }

  return { renewed, errors };
}