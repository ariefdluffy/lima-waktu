import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import { devices } from "$lib/server/db/schema";

// Halaman ini publik — tidak perlu login.
//
// Heartbeat dilakukan di endpoint /api/v1/display/[deviceCode] tiap 15 detik
// (lihat +page.svelte → fetchData). Kita TIDAK update lastSeenAt di sini lagi
// supaya tidak terjadi double-write yang bersaingan dengan UPDATE dari API.
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
