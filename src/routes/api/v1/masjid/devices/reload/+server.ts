import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { devices } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { invalidateDisplayCacheByDevice } from "$lib/server/display/cache";

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        throw error(401, "Unauthorized");
    }

    const body = await request.json();
    const deviceId = body.deviceId;

    if (!deviceId) {
        return json({ ok: false, message: "deviceId diperlukan" }, { status: 400 });
    }

    // Ambil deviceCode
    const [device] = await db
        .select({ deviceCode: devices.deviceCode, masjidId: devices.masjidId })
        .from(devices)
        .where(eq(devices.id, deviceId))
        .limit(1);

    if (!device) {
        return json({ ok: false, message: "Device tidak ditemukan" }, { status: 404 });
    }

    // Set forceReload = 1
    await db.update(devices).set({ forceReload: 1 }).where(eq(devices.id, deviceId));

    // Invalidate cache
    invalidateDisplayCacheByDevice(device.deviceCode);

    console.log("[api/reload] forceReload=1 for device:", device.deviceCode);

    return json({ ok: true, message: "Perintah reload dikirim" });
};
