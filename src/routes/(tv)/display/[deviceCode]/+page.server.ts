import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { eq, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import { devices } from "$lib/server/db/schema";

// Halaman ini publik — tidak perlu login
export const load: PageServerLoad = async ({ params }) => {
  const deviceCode = params.deviceCode?.trim();
  if (!deviceCode) {
    throw error(400, "deviceCode wajib diisi");
  }

  const [device] = await db
    .select({
      id: devices.id,
      deviceCode: devices.deviceCode,
      name: devices.name,
      orientation: devices.orientation,
      isActive: devices.isActive,
    })
    .from(devices)
    .where(eq(devices.deviceCode, deviceCode))
    .limit(1);

  if (!device || device.isActive !== 1) {
    throw error(404, "Device tidak ditemukan atau non-aktif");
  }

  // Update lastSeenAt pakai NOW() biar cocok sama perbandingan di dashboard
  await db
    .update(devices)
    .set({ lastSeenAt: sql`NOW()`, status: "online" })
    .where(eq(devices.id, device.id));

  return { device };
};
