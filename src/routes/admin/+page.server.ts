import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import {
  devices,
  jumbotrons,
  masjidUsers,
  masjids,
  prayerSchedules,
  runningTexts,
  slides,
  youtubeItems,
} from "$lib/server/db/schema";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/auth/login");
  }

  if (
    !locals.user.roles.includes("admin_masjid") &&
    !locals.user.roles.includes("superadmin")
  ) {
    throw redirect(302, "/auth/login");
  }

  let masjidId: string | null = null;

  if (locals.user.roles.includes("superadmin")) {
    const [firstMasjid] = await db
      .select({ id: masjids.id })
      .from(masjids)
      .limit(1);
    masjidId = firstMasjid?.id ?? null;
  } else {
    const [membership] = await db
      .select({ masjidId: masjidUsers.masjidId })
      .from(masjidUsers)
      .where(
        and(
          eq(masjidUsers.userId, locals.user.id),
          eq(masjidUsers.isActive, 1),
        ),
      )
      .limit(1);
    masjidId = membership?.masjidId ?? null;
  }

  if (!masjidId) {
    return {
      masjid: null,
      runningTexts: [],
      devices: [],
      slides: [],
      jumbotrons: [],
      youtubeItems: [],
      todaySchedule: null,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const [masjid] = await db
    .select()
    .from(masjids)
    .where(eq(masjids.id, masjidId))
    .limit(1);
  const [todaySchedule] = await db
    .select()
    .from(prayerSchedules)
    .where(
      and(
        eq(prayerSchedules.masjidId, masjidId),
        eq(prayerSchedules.scheduleDate, new Date(`${today}T00:00:00.000Z`)),
      ),
    )
    .limit(1);

  const [runningTextRows, deviceRows, slideRows, jumbotronRows, youtubeRows] =
    await Promise.all([
      db
        .select()
        .from(runningTexts)
        .where(eq(runningTexts.masjidId, masjidId))
        .orderBy(desc(runningTexts.createdAt))
        .limit(10),
      db
        .select()
        .from(devices)
        .where(eq(devices.masjidId, masjidId))
        .orderBy(desc(devices.createdAt))
        .limit(10),
      db
        .select()
        .from(slides)
        .where(eq(slides.masjidId, masjidId))
        .orderBy(desc(slides.orderIndex))
        .limit(10),
      db
        .select()
        .from(jumbotrons)
        .where(eq(jumbotrons.masjidId, masjidId))
        .orderBy(desc(jumbotrons.createdAt))
        .limit(10),
      db
        .select()
        .from(youtubeItems)
        .where(eq(youtubeItems.masjidId, masjidId))
        .orderBy(desc(youtubeItems.orderIndex))
        .limit(10),
    ]);

  return {
    masjid,
    runningTexts: runningTextRows,
    devices: deviceRows,
    slides: slideRows,
    jumbotrons: jumbotronRows,
    youtubeItems: youtubeRows,
    todaySchedule,
  };
};

export const actions: Actions = {
  addRunningText: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "");
    const content = String(form.get("content") ?? "").trim();
    const speed = Number(form.get("speed") ?? 60);

    if (masjidId && content) {
      await db.insert(runningTexts).values({
        masjidId,
        content,
        speed: Number.isFinite(speed) ? speed : 60,
        isActive: 1,
      });
    }
  },
  addDevice: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "");
    const deviceCode = String(form.get("device_code") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const orientation =
      String(form.get("orientation") ?? "horizontal") === "vertical"
        ? "vertical"
        : "horizontal";

    if (masjidId && deviceCode && name) {
      const id = randomUUID();
      await db.insert(devices).values({
        id,
        masjidId,
        deviceCode,
        name,
        orientation,
        status: "unknown",
        isActive: 1,
        pairedAt: new Date(),
      });
    }
  },
  addYoutube: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "");
    const youtubeUrl = String(form.get("youtube_url") ?? "").trim();
    const title = String(form.get("title") ?? "").trim();

    if (masjidId && youtubeUrl) {
      await db.insert(youtubeItems).values({
        masjidId,
        youtubeUrl,
        title: title || null,
        orderIndex: 0,
        isActive: 1,
      });
    }
  },

  bulkImportPrayerSchedule: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    const schedulesRaw = String(form.get("schedules") ?? "").trim();

    if (!masjidId || !schedulesRaw) {
      return fail(400, { error: "Data tidak lengkap" });
    }

    let schedules: Array<{
      date: string;
      imsakTime: string;
      subuhTime: string;
      sunriseTime: string;
      dhuhaTime: string;
      dzuhurTime: string;
      asharTime: string;
      maghribTime: string;
      isyaTime: string;
    }>;

    try {
      schedules = JSON.parse(schedulesRaw);
    } catch {
      return fail(400, { error: "Format data jadwal tidak valid" });
    }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return fail(400, { error: "Tidak ada data jadwal untuk disimpan" });
    }

    let saved = 0;
    for (const s of schedules) {
      const parsedDate = new Date(`${s.date}T00:00:00.000Z`);
      if (Number.isNaN(parsedDate.getTime())) continue;

      const [existing] = await db
        .select({ id: prayerSchedules.id })
        .from(prayerSchedules)
        .where(
          and(
            eq(prayerSchedules.masjidId, masjidId),
            eq(prayerSchedules.scheduleDate, parsedDate),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(prayerSchedules)
          .set({
            imsakTime: s.imsakTime,
            subuhTime: s.subuhTime,
            sunriseTime: s.sunriseTime,
            dhuhaTime: s.dhuhaTime,
            dzuhurTime: s.dzuhurTime,
            asharTime: s.asharTime,
            maghribTime: s.maghribTime,
            isyaTime: s.isyaTime,
            sourceProvider: "myquran",
            calculationMethod: "myquran-api",
            isManualOverride: 0,
          })
          .where(eq(prayerSchedules.id, existing.id));
      } else {
        await db.insert(prayerSchedules).values({
          masjidId,
          scheduleDate: parsedDate,
          imsakTime: s.imsakTime,
          subuhTime: s.subuhTime,
          sunriseTime: s.sunriseTime,
          dhuhaTime: s.dhuhaTime,
          dzuhurTime: s.dzuhurTime,
          asharTime: s.asharTime,
          maghribTime: s.maghribTime,
          isyaTime: s.isyaTime,
          sourceProvider: "myquran",
          calculationMethod: "myquran-api",
          isManualOverride: 0,
        });
      }
      saved++;
    }

    return { bulkSuccess: true, saved };
  },

  addPrayerSchedule: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    const scheduleDate = String(form.get("scheduleDate") ?? "").trim();
    const subuhTime = String(form.get("subuhTime") ?? "").trim();
    const dzuhurTime = String(form.get("dzuhurTime") ?? "").trim();
    const asharTime = String(form.get("asharTime") ?? "").trim();
    const maghribTime = String(form.get("maghribTime") ?? "").trim();
    const isyaTime = String(form.get("isyaTime") ?? "").trim();
    const imsakTime = String(form.get("imsakTime") ?? "").trim();
    const sunriseTime = String(form.get("sunriseTime") ?? "").trim();
    const dhuhaTime = String(form.get("dhuhaTime") ?? "").trim();

    if (
      !masjidId ||
      !scheduleDate ||
      !subuhTime ||
      !dzuhurTime ||
      !asharTime ||
      !maghribTime ||
      !isyaTime ||
      !imsakTime ||
      !sunriseTime ||
      !dhuhaTime
    ) {
      return fail(400, { error: "Semua field jadwal wajib diisi" });
    }

    const parsedDate = new Date(`${scheduleDate}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return fail(400, { error: "Format tanggal tidak valid" });
    }

    const [existing] = await db
      .select({ id: prayerSchedules.id })
      .from(prayerSchedules)
      .where(
        and(
          eq(prayerSchedules.masjidId, masjidId),
          eq(prayerSchedules.scheduleDate, parsedDate),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(prayerSchedules)
        .set({
          imsakTime,
          subuhTime,
          sunriseTime,
          dhuhaTime,
          dzuhurTime,
          asharTime,
          maghribTime,
          isyaTime,
          sourceProvider: "manual",
          calculationMethod: "manual-default",
          isManualOverride: 1,
        })
        .where(eq(prayerSchedules.id, existing.id));
    } else {
      await db.insert(prayerSchedules).values({
        masjidId,
        scheduleDate: parsedDate,
        imsakTime,
        subuhTime,
        sunriseTime,
        dhuhaTime,
        dzuhurTime,
        asharTime,
        maghribTime,
        isyaTime,
        sourceProvider: "manual",
        calculationMethod: "manual-default",
        isManualOverride: 1,
      });
    }
  },
};
