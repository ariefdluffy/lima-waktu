import { randomUUID } from "node:crypto";
import { and, desc, eq, count } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import {
  devices,
  iqamahSettings,
  jumbotrons,
  masjidUsers,
  masjids,
  mediaAssets,
  prayerSchedules,
  runningTexts,
  slides,
  youtubeItems,
} from "$lib/server/db/schema";
import { fail } from "@sveltejs/kit";
import { todayYmdInJakarta } from "$lib/server/prayer/resolver";

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ locals, url }) => {
  const pageRunningText = Math.max(
    1,
    Number(url.searchParams.get("pageRT") ?? 1),
  );
  const pageYoutube = Math.max(1, Number(url.searchParams.get("pageYT") ?? 1));
  const pagePrayer = Math.max(1, Number(url.searchParams.get("pagePR") ?? 1));
  const pageDevice = Math.max(1, Number(url.searchParams.get("pageDV") ?? 1));
  const pageSlide = Math.max(1, Number(url.searchParams.get("pageSL") ?? 1));
  const pageJumbotron = Math.max(
    1,
    Number(url.searchParams.get("pageJB") ?? 1),
  );
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
      runningTextTotal: 0,
      runningTextPage: 1,
      runningTextTotalPages: 1,
      devices: [],
      slides: [],
      jumbotrons: [],
      youtubeItems: [],
      youtubeTotal: 0,
      youtubePage: 1,
      youtubeTotalPages: 1,
      prayerScheduleList: [],
      prayerTotal: 0,
      prayerPage: 1,
      prayerTotalPages: 1,
      todaySchedule: null,
      iqamahSettings: [],
      devicePage: 1,
      deviceTotalPages: 1,
      deviceTotal: 0,
      slidePage: 1,
      slideTotalPages: 1,
      slideTotal: 0,
      jumbotronPage: 1,
      jumbotronTotalPages: 1,
      jumbotronTotal: 0,
    };
  }

  const today = todayYmdInJakarta();
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
        eq(prayerSchedules.scheduleDate, today as unknown as Date),
      ),
    )
    .limit(1);

  const [
    runningTextRows,
    runningTextCountRows,
    deviceRows,
    deviceCountRows,
    slideRows,
    slideCountRows,
    jumbotronRows,
    jumbotronCountRows,
    youtubeRows,
    youtubeCountRows,
    prayerRows,
    prayerCountRows,
    iqamahRows,
  ] = await Promise.all([
    db
      .select()
      .from(runningTexts)
      .where(eq(runningTexts.masjidId, masjidId))
      .orderBy(desc(runningTexts.createdAt))
      .limit(PAGE_SIZE)
      .offset((pageRunningText - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(runningTexts)
      .where(eq(runningTexts.masjidId, masjidId)),
    db
      .select()
      .from(devices)
      .where(eq(devices.masjidId, masjidId))
      .orderBy(desc(devices.createdAt))
      .limit(PAGE_SIZE)
      .offset((pageDevice - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(devices)
      .where(eq(devices.masjidId, masjidId)),
    db
      .select({
        id: slides.id,
        masjidId: slides.masjidId,
        mediaAssetId: slides.mediaAssetId,
        title: slides.title,
        orderIndex: slides.orderIndex,
        startAt: slides.startAt,
        endAt: slides.endAt,
        isActive: slides.isActive,
        createdAt: slides.createdAt,
        updatedAt: slides.updatedAt,
        fileUrl: mediaAssets.fileUrl,
      })
      .from(slides)
      .leftJoin(mediaAssets, eq(slides.mediaAssetId, mediaAssets.id))
      .where(eq(slides.masjidId, masjidId))
      .orderBy(desc(slides.orderIndex))
      .limit(PAGE_SIZE)
      .offset((pageSlide - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(slides)
      .where(eq(slides.masjidId, masjidId)),
    db
      .select()
      .from(jumbotrons)
      .where(eq(jumbotrons.masjidId, masjidId))
      .orderBy(desc(jumbotrons.createdAt))
      .limit(PAGE_SIZE)
      .offset((pageJumbotron - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(jumbotrons)
      .where(eq(jumbotrons.masjidId, masjidId)),
    db
      .select()
      .from(youtubeItems)
      .where(eq(youtubeItems.masjidId, masjidId))
      .orderBy(desc(youtubeItems.orderIndex))
      .limit(PAGE_SIZE)
      .offset((pageYoutube - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(youtubeItems)
      .where(eq(youtubeItems.masjidId, masjidId)),
    db
      .select()
      .from(prayerSchedules)
      .where(eq(prayerSchedules.masjidId, masjidId))
      .orderBy(desc(prayerSchedules.scheduleDate))
      .limit(PAGE_SIZE)
      .offset((pagePrayer - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(prayerSchedules)
      .where(eq(prayerSchedules.masjidId, masjidId)),
    db
      .select()
      .from(iqamahSettings)
      .where(eq(iqamahSettings.masjidId, masjidId)),
  ]);

  const runningTextTotal = runningTextCountRows[0]?.total ?? 0;
  const deviceTotal = deviceCountRows[0]?.total ?? 0;
  const slideTotal = slideCountRows[0]?.total ?? 0;
  const jumbotronTotal = jumbotronCountRows[0]?.total ?? 0;
  const youtubeTotal = youtubeCountRows[0]?.total ?? 0;
  const prayerTotal = prayerCountRows[0]?.total ?? 0;

  return {
    masjid,
    runningTexts: runningTextRows,
    runningTextTotal,
    runningTextPage: pageRunningText,
    runningTextTotalPages: Math.max(1, Math.ceil(runningTextTotal / PAGE_SIZE)),
    devices: deviceRows,
    deviceTotal,
    devicePage: pageDevice,
    deviceTotalPages: Math.max(1, Math.ceil(deviceTotal / PAGE_SIZE)),
    slides: slideRows.map((row) => ({
      id: row.id,
      masjidId: row.masjidId,
      mediaAssetId: row.mediaAssetId,
      title: row.title,
      orderIndex: row.orderIndex,
      startAt: row.startAt,
      endAt: row.endAt,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      fileUrl: row.fileUrl,
    })),
    slideTotal,
    slidePage: pageSlide,
    slideTotalPages: Math.max(1, Math.ceil(slideTotal / PAGE_SIZE)),
    jumbotrons: jumbotronRows,
    jumbotronTotal,
    jumbotronPage: pageJumbotron,
    jumbotronTotalPages: Math.max(1, Math.ceil(jumbotronTotal / PAGE_SIZE)),
    youtubeItems: youtubeRows,
    youtubeTotal,
    youtubePage: pageYoutube,
    youtubeTotalPages: Math.max(1, Math.ceil(youtubeTotal / PAGE_SIZE)),
    prayerScheduleList: prayerRows,
    prayerTotal,
    prayerPage: pagePrayer,
    prayerTotalPages: Math.max(1, Math.ceil(prayerTotal / PAGE_SIZE)),
    todaySchedule,
    iqamahSettings: iqamahRows,
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
  updateDeviceLayout: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }
    const form = await request.formData();
    const deviceId = String(form.get("device_id") ?? "").trim();
    const layoutMode = String(form.get("layout_mode") ?? "default");
    const validModes = ["default", "youtube"];
    if (!deviceId || !validModes.includes(layoutMode)) {
      return fail(400, { error: "Data tidak valid" });
    }
    await db
      .update(devices)
      .set({ layoutMode: layoutMode as "default" | "youtube" })
      .where(eq(devices.id, deviceId));
  },

  deleteRunningText: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    if (id) await db.delete(runningTexts).where(eq(runningTexts.id, id));
  },

  editRunningText: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    const content = String(form.get("content") ?? "").trim();
    const speed = Number(form.get("speed") ?? 60);
    if (id && content) {
      await db
        .update(runningTexts)
        .set({ content, speed: Number.isFinite(speed) ? speed : 60 })
        .where(eq(runningTexts.id, id));
    }
  },

  editDevice: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const id = String(form.get("device_id") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    if (id && name) {
      await db.update(devices).set({ name }).where(eq(devices.id, id));
    }
  },

  deleteDevice: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const id = String(form.get("device_id") ?? "").trim();
    if (id) await db.delete(devices).where(eq(devices.id, id));
  },

  editYoutube: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    const youtubeUrl = String(form.get("youtube_url") ?? "").trim();
    const title = String(form.get("title") ?? "").trim();
    if (id && youtubeUrl) {
      await db
        .update(youtubeItems)
        .set({ youtubeUrl, title: title || null })
        .where(eq(youtubeItems.id, id));
    }
  },

  deleteYoutube: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    if (id) await db.delete(youtubeItems).where(eq(youtubeItems.id, id));
  },

  addJumbotron: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    const title = String(form.get("title") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();
    const backgroundUrl = String(form.get("background_url") ?? "").trim();
    if (masjidId && title && content) {
      await db.insert(jumbotrons).values({
        masjidId,
        title,
        content,
        backgroundUrl: backgroundUrl || null,
        isActive: 1,
      });
    }
  },

  deleteJumbotron: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    if (id) await db.delete(jumbotrons).where(eq(jumbotrons.id, id));
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
      // Validasi format tanggal YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) continue;
      const dateStr = s.date;

      const [existing] = await db
        .select({ id: prayerSchedules.id })
        .from(prayerSchedules)
        .where(
          and(
            eq(prayerSchedules.masjidId, masjidId),
            eq(prayerSchedules.scheduleDate, dateStr as unknown as Date),
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
          scheduleDate: dateStr as unknown as Date,
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

  deleteSlide: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const slideId = Number(form.get("slide_id") ?? 0);
    if (slideId) {
      await db.delete(slides).where(eq(slides.id, slideId));
    }
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

    const parsedDate = new Date(`${scheduleDate}T12:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return fail(400, { error: "Format tanggal tidak valid" });
    }
    // Gunakan string YYYY-MM-DD langsung untuk kolom date agar tidak ada timezone shift
    const dateStr = scheduleDate;

    const [existing] = await db
      .select({ id: prayerSchedules.id })
      .from(prayerSchedules)
      .where(
        and(
          eq(prayerSchedules.masjidId, masjidId),
          eq(prayerSchedules.scheduleDate, dateStr as unknown as Date),
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
        scheduleDate: dateStr as unknown as Date,
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
