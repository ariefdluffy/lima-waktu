import { processAutoRenew } from "./auto-renew";

const INTERVAL_MS = 60 * 60 * 1000; // 1 jam
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

async function runAutoRenew(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    console.log("[SubscriptionScheduler] Checking auto-renew...");
    const result = await processAutoRenew();

    if (result.renewed > 0) {
      console.log(
        `[SubscriptionScheduler] Renewed ${result.renewed} subscription(s)`,
      );
    } else {
      console.log("[SubscriptionScheduler] No subscriptions to renew");
    }

    if (result.errors.length > 0) {
      for (const e of result.errors) {
        console.warn(`[SubscriptionScheduler] Error: ${e}`);
      }
    }
  } catch (err) {
    console.error("[SubscriptionScheduler] Unexpected error:", err);
  } finally {
    isRunning = false;
  }
}

export function startSubscriptionScheduler(): void {
  if (schedulerTimer) return;

  console.log(
    `[SubscriptionScheduler] Starting — interval every ${INTERVAL_MS / 60000} minutes`,
  );

  // Jalankan sekali langsung saat startup
  runAutoRenew();

  // Lalu setiap 1 jam
  schedulerTimer = setInterval(runAutoRenew, INTERVAL_MS);
}

export function stopSubscriptionScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log("[SubscriptionScheduler] Stopped");
  }
}