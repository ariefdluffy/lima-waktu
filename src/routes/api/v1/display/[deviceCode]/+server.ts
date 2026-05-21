import { and, asc, desc, eq, gte, lte, or, isNull } from "drizzle-orm";
import { json, type RequestHandler } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import {
  devices,
  events,
  jumbotrons,
  masjids,
  runningTexts,
  slides,
  mediaAssets,
  themes,
  youtubeItems,
} from "$lib/server/db/schema";
import {
  resolvePrayerScheduleForMasjid,
  todayYmdInTimezone,
} from "$lib/server/prayer/resolver";
import { getCachedSchedule, setCachedSchedule } from "$lib/server/prayer/cache";

export const GET: RequestHandler = async ({ params, request }) => {
  const deviceCode = params.deviceCode?.trim();
  if (!deviceCode) {
    return json(
      { ok: false, message: "deviceCode wajib diisi" },
      { status: 400 },
    );
  }

  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.deviceCode, deviceCode))
    .limit(1);

  if (!device || device.isActive !== 1) {
    return json(
      { ok: false, message: "Device tidak ditemukan atau non-aktif" },
      { status: 404 },
    );
  }

  const [masjid] = await db
    .select()
    .from(masjids)
    .where(eq(masjids.id, device.masjidId))
    .limit(1);

  if (!masjid) {
    return json(
      { ok: false, message: "Masjid tidak ditemukan untuk device ini" },
      { status: 404 },
    );
  }

  // Heartbeat update — ringan, sekali per request
  await db
    .update(devices)
    .set({
      lastSeenAt: new Date(),
      status: "online",
    })
    .where(eq(devices.id, device.id));

  const today = todayYmdInTimezone(masjid.timezone ?? "Asia/Makassar");
  const todayDate = new Date(`${today}T00:00:00.000Z`);

  // Baca dari cache dulu, jika miss fetch dari DB dan simpan ke cache
  let schedule = getCachedSchedule(masjid.id, today);
  if (!schedule) {
    schedule = await resolvePrayerScheduleForMasjid(masjid.id, today);
    setCachedSchedule(masjid.id, today, schedule);
  }

  const [runningTextRows, slideRows, jumbotronRows, youtubeRows, eventRows] =
    await Promise.all([
      db
        .select()
        .from(runningTexts)
        .where(
          and(
            eq(runningTexts.masjidId, masjid.id),
            eq(runningTexts.isActive, 1),
            or(
              isNull(runningTexts.startAt),
              lte(runningTexts.startAt, new Date()),
            ),
            or(isNull(runningTexts.endAt), gte(runningTexts.endAt, new Date())),
          ),
        )
        .orderBy(desc(runningTexts.createdAt)),
      db
        .select({
          id: slides.id,
          title: slides.title,
          orderIndex: slides.orderIndex,
          startAt: slides.startAt,
          endAt: slides.endAt,
          isActive: slides.isActive,
          fileUrl: mediaAssets.fileUrl,
          fileType: mediaAssets.fileType,
        })
        .from(slides)
        .leftJoin(mediaAssets, eq(slides.mediaAssetId, mediaAssets.id))
        .where(
          and(
            eq(slides.masjidId, masjid.id),
            eq(slides.isActive, 1),
            or(isNull(slides.startAt), lte(slides.startAt, new Date())),
            or(isNull(slides.endAt), gte(slides.endAt, new Date())),
          ),
        )
        .orderBy(asc(slides.orderIndex)),
      db
        .select()
        .from(jumbotrons)
        .where(
          and(
            eq(jumbotrons.masjidId, masjid.id),
            eq(jumbotrons.isActive, 1),
            or(isNull(jumbotrons.startAt), lte(jumbotrons.startAt, new Date())),
            or(isNull(jumbotrons.endAt), gte(jumbotrons.endAt, new Date())),
          ),
        )
        .orderBy(desc(jumbotrons.createdAt)),
      db
        .select()
        .from(youtubeItems)
        .where(
          and(
            eq(youtubeItems.masjidId, masjid.id),
            eq(youtubeItems.isActive, 1),
            or(
              isNull(youtubeItems.startAt),
              lte(youtubeItems.startAt, new Date()),
            ),
            or(isNull(youtubeItems.endAt), gte(youtubeItems.endAt, new Date())),
          ),
        )
        .orderBy(asc(youtubeItems.orderIndex)),
      db
        .select()
        .from(events)
        .where(
          and(
            eq(events.masjidId, masjid.id),
            eq(events.isActive, 1),
            gte(events.eventDate, todayDate),
          ),
        )
        .orderBy(asc(events.eventDate))
        .limit(5),
    ]);

  // Fetch theme for this device — fallback to default "modern-minimalis"
  let themeData = null;
  const themeLookupId = device.themeId ?? null;
  if (themeLookupId) {
    const [theme] = await db
      .select()
      .from(themes)
      .where(eq(themes.id, themeLookupId))
      .limit(1);
    if (theme) {
      themeData = {
        id: theme.id,
        themeKey: theme.themeKey,
        name: theme.name,
        palette: theme.paletteJson as Record<string, string>,
        layout: theme.layoutJson as Record<string, unknown>,
        isGlobal: theme.isGlobal === 1,
      };
    }
  }
  // Fallback to default theme
  if (!themeData) {
    const [defaultTheme] = await db
      .select()
      .from(themes)
      .where(eq(themes.themeKey, "modern-minimalis"))
      .limit(1);
    if (defaultTheme) {
      themeData = {
        id: defaultTheme.id,
        themeKey: defaultTheme.themeKey,
        name: defaultTheme.name,
        palette: defaultTheme.paletteJson as Record<string, string>,
        layout: defaultTheme.layoutJson as Record<string, unknown>,
        isGlobal: defaultTheme.isGlobal === 1,
      };
    }
  }

  return json({
    ok: true,
    data: {
      generatedAt: new Date().toISOString(),
      device: {
        id: device.id,
        deviceCode: device.deviceCode,
        name: device.name,
        orientation: device.orientation,
        layoutMode: device.layoutMode,
      },
      theme: themeData,
      masjid: {
        id: masjid.id,
        name: masjid.name,
        address: masjid.address,
        city: masjid.city,
        district: masjid.district,
        province: masjid.province,
        timezone: masjid.timezone,
        latitude: masjid.latitude,
        longitude: masjid.longitude,
        hijriOffset: masjid.hijriOffset ?? 0,
        adzanScreenDuration: masjid.adzanScreenDuration ?? 4,
        khusukScreenDuration: masjid.khusukScreenDuration ?? 10,
        screensaverDelayMinutes: masjid.screensaverDelayMinutes ?? 120,
        screensaverWakeMinutes: masjid.screensaverWakeMinutes ?? 60,
        logoUrl: masjid.logoUrl ?? null,
      },
      schedule,
      runningTexts: runningTextRows.map((row) => ({
        id: row.id,
        content: row.content,
        speed: row.speed,
      })),
      slides: slideRows.map((row) => ({
        id: row.id,
        title: row.title,
        orderIndex: row.orderIndex,
        fileUrl: row.fileUrl,
        fileType: row.fileType,
      })),
      jumbotrons: jumbotronRows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        backgroundUrl: row.backgroundUrl,
      })),
      youtubeItems: youtubeRows.map((row) => ({
        id: row.id,
        title: row.title,
        youtubeUrl: row.youtubeUrl,
        orderIndex: row.orderIndex,
      })),
      events: eventRows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        eventDate: row.eventDate,
        eventTime: row.eventTime,
        countdownEnabled: row.countdownEnabled === 1,
      })),
    },
  });
};
