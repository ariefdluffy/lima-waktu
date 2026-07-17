// Shared subscription logic — pakai di server (admin + display API) dan client.
// Single source of truth untuk menentukan apakah subscription sudah expired.

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "grace"
  | "expired"
  | "cancelled";

export type SubscriptionLike = {
  status: string;
  endDate: string | Date;
};

/**
 * Cek apakah subscription sudah expired.
 * - null / undefined → false (anggap belum pernah langganan, bukan expired).
 *   Catatan: TV API tetap skip watermark kalau null (lihat display endpoint).
 * - status = "expired" atau "cancelled" → true.
 * - status = "trial" / "grace" / "active" tapi endDate < now → true.
 */
export function isSubscriptionExpired(
  sub: SubscriptionLike | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!sub) return false;
  const status = sub.status as SubscriptionStatus;
  if (status === "expired" || status === "cancelled") return true;
  const end = sub.endDate instanceof Date ? sub.endDate : new Date(sub.endDate);
  if (isNaN(end.getTime())) return false;
  if (
    status === "trial" ||
    status === "grace" ||
    status === "active"
  ) {
    return end.getTime() < now.getTime();
  }
  return false;
}

/**
 * Watermark text yang ditampilkan di TV saat subscription expired.
 * Konsisten antara admin page, SectionLangganan, dan TV display API.
 */
export const EXPIRED_WATERMARK =
  "LIMAWAKTU.MY.ID — Aktifkan langganan di menu Admin";
