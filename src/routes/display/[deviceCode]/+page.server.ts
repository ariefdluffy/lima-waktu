import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { devices } from "$lib/server/db/schema";

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

  return { device };
};
