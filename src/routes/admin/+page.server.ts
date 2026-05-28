import { randomUUID } from "node:crypto";
import { and, desc, eq, count, lt, sql } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import {
  devices,
  events,
  iqamahSettings,
  jumbotrons,
  masjidUsers,
  masjids,
  mediaAssets,
  prayerSchedules,
  prayerCorrections,
  runningTexts,
  slides,
  subscriptions,
  themes,
  youtubeItems,
  globalPrayerConfig,
  prayerProviders,
  prayerCalculationMethods,
} from "$lib/server/db/schema";
import { fail } from "@sveltejs/kit";
import {
  resolvePrayerScheduleForMasjid,
  todayYmdInTimezone,
} from "$lib/server/prayer/resolver";
import { invalidateCache } from "$lib/server/prayer/cache";
import { prayerCalculationMethods as prayerCalcMethodsTable } from "$lib/server/db/schema";

const PAGE_SIZE = 10;

// Helper: get provider info dari DB
async function getProviderInfo(providerId: number | null) {
  if (!providerId) return null;
  const [provider] = await db
    .select()
    .from(prayerProviders)
    .where(eq(prayerProviders.id, providerId))
    .limit(1);
  return provider ?? null;
}

// Helper: get method info dari DB
async function getMethodInfo(methodId: number | null) {
  if (!methodId) return null;
  const [method] = await db
    .select()
    .from(prayerCalculationMethods)
    .where(eq(prayerCalculationMethods.id, methodId))
    .limit(1);
  return method ?? null;
}

// Sections yang butuh data spesifik
const SECTION_RUNNINGTEXT = "runningtext";
const SECTION_DEVICES     = "devices";
const SECTION_SLIDES      = "slides";
const SECTION_JUMBOTRON   = "jumbotron";
const SECTION_YOUTUBE     = "youtube";
const SECTION_SCHEDULE    = "schedule";
const SECTION_IQAMAH      = "iqamah";
const SECTION_EVENTS      = "events";
const SECTION_TEMA        = "tema";
const SECTION_DASHBOARD   = "dashboard";

export const load: PageServerLoad = async ({ locals, url, depends }) => {
  depends("app:admin");

  // Section aktif — dipakai untuk lazy load
  const section = url.searchParams.get("section") ?? SECTION_DASHBOARD;

  const pageRunningText = Math.max(1, Number(url.searchParams.get("pageRT") ?? 1));
  const pageYoutube     = Math.max(1, Number(url.searchParams.get("pageYT") ?? 1));
  const pagePrayer      = Math.max(1, Number(url.searchParams.get("pagePR") ?? 1));
  const pageDevice      = Math.max(1, Number(url.searchParams.get("pageDV") ?? 1));
  const pageSlide       = Math.max(1, Number(url.searchParams.get("pageSL") ?? 1));
  const pageJumbotron   = Math.max(1, Number(url.searchParams.get("pageJB") ?? 1));
  const pageEvent       = Math.max(1, Number(url.searchParams.get("pageEV") ?? 1));

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
      user: locals.user,
      section,
      runningTexts: [], runningTextTotal: 0, runningTextPage: 1, runningTextTotalPages: 1,
      devices: [], deviceTotal: 0, devicePage: 1, deviceTotalPages: 1,
      slides: [], slideTotal: 0, slidePage: 1, slideTotalPages: 1,
      jumbotrons: [], jumbotronTotal: 0, jumbotronPage: 1, jumbotronTotalPages: 1,
      youtubeItems: [], youtubeTotal: 0, youtubePage: 1, youtubeTotalPages: 1,
      prayerScheduleList: [], prayerTotal: 0, prayerPage: 1, prayerTotalPages: 1,
      events: [], eventTotal: 0, eventPage: 1, eventTotalPages: 1,
      todaySchedule: null,
      iqamahSettings: [],
      prayerCorrections: [],
      themes: [],
      subscription: null,
      maxDevices: 1,
      prayerProviderInfo: { providerKey: "myquran", providerName: "MyQuran API", supportsSearch: true },
    };
  }

  const [masjid] = await db
    .select()
    .from(masjids)
    .where(eq(masjids.id, masjidId))
    .limit(1);

  // ── Data wajib: selalu di-load (dipakai dashboard, header, iqamah) ──────────
  const [subscriptionRow, configRow] = await Promise.all([
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.masjidId, masjidId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(globalPrayerConfig)
      .where(eq(globalPrayerConfig.id, 1))
      .limit(1)
      .then((r) => r[0] ?? null),
  ]);

  // todaySchedule dipakai di dashboard
  const today = todayYmdInTimezone(masjid?.timezone ?? "Asia/Jakarta");
  const resolvedSchedule = await resolvePrayerScheduleForMasjid(masjidId, today);
  const todaySchedule = resolvedSchedule.resolved
    ? {
        subuhTime: resolvedSchedule.resolved.subuh,
        dzuhurTime: resolvedSchedule.resolved.dzuhur,
        asharTime: resolvedSchedule.resolved.ashar,
        maghribTime: resolvedSchedule.resolved.maghrib,
        isyaTime: resolvedSchedule.resolved.isya,
      }
    : null;

  let prayerProviderInfo = {
    providerKey: "myquran",
    providerName: "MyQuran API",
    supportsSearch: true,
  };
  if (configRow?.primaryProviderId) {
    const provider = await getProviderInfo(configRow.primaryProviderId);
    if (provider) {
      prayerProviderInfo = {
        providerKey: provider.providerKey,
        providerName: provider.name,
        supportsSearch: provider.providerKey === "myquran",
      };
    }
  }

  // ── Default empty values untuk semua section ────────────────────────────────
  let runningTextRows:    typeof runningTexts.$inferSelect[]     = [];
  let runningTextTotal    = 0;
  let deviceRows:         typeof devices.$inferSelect[]          = [];
  let deviceTotal         = 0;
  let slideRows:          Array<typeof slides.$inferSelect & { fileUrl: string | null }> = [];
  let slideTotal          = 0;
  let jumbotronRows:      typeof jumbotrons.$inferSelect[]       = [];
  let jumbotronTotal      = 0;
  let youtubeRows:        typeof youtubeItems.$inferSelect[]     = [];
  let youtubeTotal        = 0;
  let prayerRows:         typeof prayerSchedules.$inferSelect[]  = [];
  let prayerTotal         = 0;
  let iqamahRows:         typeof iqamahSettings.$inferSelect[]   = [];
  let eventRows:          typeof events.$inferSelect[]           = [];
  let eventTotal          = 0;
  let prayerCorrectionsRows: typeof prayerCorrections.$inferSelect[] = [];
  let themeRows:          typeof themes.$inferSelect[]           = [];

  // ── Lazy load: hanya fetch data yang dibutuhkan section aktif ───────────────
  if (section === SECTION_RUNNINGTEXT) {
    [runningTextRows, [{ total: runningTextTotal }]] = await Promise.all([
      db.select().from(runningTexts)
        .where(eq(runningTexts.masjidId, masjidId))
        .orderBy(desc(runningTexts.createdAt))
        .limit(PAGE_SIZE).offset((pageRunningText - 1) * PAGE_SIZE),
      db.select({ total: count() }).from(runningTexts)
        .where(eq(runningTexts.masjidId, masjidId)),
    ]);
  }

  if (section === SECTION_DEVICES) {
    [deviceRows, [{ total: deviceTotal }]] = await Promise.all([
      db.select().from(devices)
        .where(eq(devices.masjidId, masjidId))
        .orderBy(desc(devices.createdAt))
        .limit(PAGE_SIZE).offset((pageDevice - 1) * PAGE_SIZE),
      db.select({ total: count() }).from(devices)
        .where(eq(devices.masjidId, masjidId)),
    ]);
  }

  if (section === SECTION_SLIDES) {
    const [rawSlides, [{ total }]] = await Promise.all([
      db.select({
          id: slides.id, masjidId: slides.masjidId, mediaAssetId: slides.mediaAssetId,
          title: slides.title, orderIndex: slides.orderIndex, startAt: slides.startAt,
          endAt: slides.endAt, isActive: slides.isActive, createdAt: slides.createdAt,
          updatedAt: slides.updatedAt, fileUrl: mediaAssets.fileUrl,
        })
        .from(slides)
        .leftJoin(mediaAssets, eq(slides.mediaAssetId, mediaAssets.id))
        .where(eq(slides.masjidId, masjidId))
        .orderBy(desc(slides.orderIndex))
        .limit(PAGE_SIZE).offset((pageSlide - 1) * PAGE_SIZE),
      db.select({ total: count() }).from(slides)
        .where(eq(slides.masjidId, masjidId)),
    ]);
    slideRows  = rawSlides;
    slideTotal = total;
  }

  if (section === SECTION_JUMBOTRON) {
    [jumbotronRows, [{ total: jumbotronTotal }]] = await Promise.all([
      db.select().from(jumbotrons)
        .where(eq(jumbotrons.masjidId, masjidId))
        .orderBy(desc(jumbotrons.createdAt))
        .limit(PAGE_SIZE).offset((pageJumbotron - 1) * PAGE_SIZE),
      db.select({ total: count() }).from(jumbotrons)
        .where(eq(jumbotrons.masjidId, masjidId)),
    ]);
  }

  if (section === SECTION_YOUTUBE) {
    [youtubeRows, [{ total: youtubeTotal }]] = await Promise.all([
      db.select().from(youtubeItems)
        .where(eq(youtubeItems.masjidId, masjidId))
        .orderBy(youtubeItems.orderIndex)
        .limit(PAGE_SIZE).offset((pageYoutube - 1) * PAGE_SIZE),
      db.select({ total: count() }).from(youtubeItems)
        .where(eq(youtubeItems.masjidId, masjidId)),
    ]);
  }

  if (section === SECTION_SCHEDULE) {
    [prayerRows, [{ total: prayerTotal }], prayerCorrectionsRows] = await Promise.all([
      db.select().from(prayerSchedules)
        .where(eq(prayerSchedules.masjidId, masjidId))
        .orderBy(desc(prayerSchedules.scheduleDate))
        .limit(PAGE_SIZE).offset((pagePrayer - 1) * PAGE_SIZE),
      db.select({ total: count() }).from(prayerSchedules)
        .where(eq(prayerSchedules.masjidId, masjidId)),
      db.select().from(prayerCorrections)
        .where(eq(prayerCorrections.masjidId, masjidId))
        .orderBy(desc(prayerCorrections.createdAt)),
    ]);
  }

  if (section === SECTION_IQAMAH) {
    iqamahRows = await db.select().from(iqamahSettings)
      .where(eq(iqamahSettings.masjidId, masjidId));
  }

  if (section === SECTION_EVENTS) {
    [eventRows, [{ total: eventTotal }]] = await Promise.all([
      db.select().from(events)
        .where(and(eq(events.masjidId, masjidId), eq(events.isActive, 1)))
        .orderBy(desc(events.eventDate))
        .limit(PAGE_SIZE).offset((pageEvent - 1) * PAGE_SIZE),
      db.select({ total: count() }).from(events)
        .where(and(eq(events.masjidId, masjidId), eq(events.isActive, 1))),
    ]);
  }

  if (section === SECTION_TEMA) {
    themeRows = await db.select().from(themes)
      .where(eq(themes.isActive, 1))
      .orderBy(desc(themes.isGlobal), desc(themes.createdAt));
  }

  // dashboard butuh iqamah + count semua konten untuk stats cards
  if (section === SECTION_DASHBOARD) {
    const [
      iqamah,
      [{ total: rtTotal }],
      [{ total: devTotal }],
      [{ total: slTotal }],
      [{ total: jbTotal }],
      [{ total: ytTotal }],
      [{ total: evTotal }],
    ] = await Promise.all([
      db.select().from(iqamahSettings).where(eq(iqamahSettings.masjidId, masjidId)),
      db.select({ total: count() }).from(runningTexts).where(eq(runningTexts.masjidId, masjidId)),
      db.select({ total: count() }).from(devices).where(eq(devices.masjidId, masjidId)),
      db.select({ total: count() }).from(slides).where(eq(slides.masjidId, masjidId)),
      db.select({ total: count() }).from(jumbotrons).where(eq(jumbotrons.masjidId, masjidId)),
      db.select({ total: count() }).from(youtubeItems).where(eq(youtubeItems.masjidId, masjidId)),
      db.select({ total: count() }).from(events).where(and(eq(events.masjidId, masjidId), eq(events.isActive, 1))),
    ]);
    iqamahRows     = iqamah;
    runningTextTotal = rtTotal;
    deviceTotal    = devTotal;
    slideTotal     = slTotal;
    jumbotronTotal = jbTotal;
    youtubeTotal   = ytTotal;
    eventTotal     = evTotal;
  }

  return {
    masjid,
    user: locals.user,
    section,
    runningTexts: runningTextRows,
    runningTextTotal,
    runningTextPage: pageRunningText,
    runningTextTotalPages: Math.max(1, Math.ceil(runningTextTotal / PAGE_SIZE)),
    devices: deviceRows,
    deviceTotal,
    devicePage: pageDevice,
    deviceTotalPages: Math.max(1, Math.ceil(deviceTotal / PAGE_SIZE)),
    slides: slideRows.map((row) => ({
      id: row.id, masjidId: row.masjidId, mediaAssetId: row.mediaAssetId,
      title: row.title, orderIndex: row.orderIndex, startAt: row.startAt,
      endAt: row.endAt, isActive: row.isActive, createdAt: row.createdAt,
      updatedAt: row.updatedAt, fileUrl: row.fileUrl,
    })),
    slideTotal,
    slidePage: pageSlide,
    slideTotalPages: Math.max(1, Math.ceil(slideTotal / PAGE_SIZE)),
    jumbotrons: jumbotronRows,
    jumbotronTotal,
    jumbotronPage: pageJumbotron,
    jumbotronTotalPages: Math.max(1, Math.ceil(jumbotronTotal / PAGE_SIZE)),
    events: eventRows,
    eventTotal,
    eventPage: pageEvent,
    eventTotalPages: Math.max(1, Math.ceil(eventTotal / PAGE_SIZE)),
    youtubeItems: youtubeRows,
    youtubeTotal,
    youtubePage: pageYoutube,
    youtubeTotalPages: Math.max(1, Math.ceil(youtubeTotal / PAGE_SIZE)),
    prayerScheduleList: prayerRows,
    prayerTotal,
    prayerPage: pagePrayer,
    prayerTotalPages: Math.max(1, Math.ceil(prayerTotal / PAGE_SIZE)),
    prayerCorrections: prayerCorrectionsRows,
    todaySchedule,
    iqamahSettings: iqamahRows,
    themes: themeRows.map((t) => ({
      id: t.id,
      themeKey: t.themeKey,
      name: t.name,
      isGlobal: t.isGlobal === 1,
    })),
    subscription: subscriptionRow ?? null,
    maxDevices: subscriptionRow?.maxDevices ?? 1,
    prayerProviderInfo,
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
      // Enforce max_devices limit based on subscription
      const [sub] = await db
        .select({
          status: subscriptions.status,
          maxDevices: subscriptions.maxDevices,
        })
        .from(subscriptions)
        .where(eq(subscriptions.masjidId, masjidId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      const maxDevices = sub?.maxDevices ?? 1;
      const [{ total }] = await db
        .select({ total: count() })
        .from(devices)
        .where(eq(devices.masjidId, masjidId));

      if (total >= maxDevices) {
        return fail(403, {
          error: `Batas maksimal device (${maxDevices}) telah tercapai. Upgrade langganan untuk menambah lebih banyak device.`,
        });
      }

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

  dragReorderYoutube: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    const orderedIdsRaw = String(form.get("ordered_ids") ?? "").trim();
    const pageOffset = Math.max(0, Number(form.get("page_offset") ?? 0));
    if (!masjidId || !orderedIdsRaw) return;

    const orderedIds = orderedIdsRaw.split(",").map(Number).filter(Boolean);
    if (orderedIds.length === 0) return;

    // Update orderIndex sesuai posisi baru + offset halaman
    // Contoh: halaman 2 (PAGE_SIZE=10) → pageOffset=10, item pertama dapat orderIndex=10
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(youtubeItems)
          .set({ orderIndex: pageOffset + index })
          .where(and(eq(youtubeItems.id, id), eq(youtubeItems.masjidId, masjidId)))
      )
    );
  },

  reorderYoutube: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    const direction = String(form.get("direction") ?? ""); // "up" | "down"
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    if (!id || !masjidId || !['up', 'down'].includes(direction)) return;

    // Ambil semua item milik masjid, urut ascending orderIndex
    const items = await db
      .select()
      .from(youtubeItems)
      .where(eq(youtubeItems.masjidId, masjidId))
      .orderBy(youtubeItems.orderIndex);

    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    // Tukar orderIndex antara dua item
    const currentOrder = items[idx].orderIndex;
    const swapOrder = items[swapIdx].orderIndex;

    await db
      .update(youtubeItems)
      .set({ orderIndex: swapOrder })
      .where(eq(youtubeItems.id, items[idx].id));
    await db
      .update(youtubeItems)
      .set({ orderIndex: currentOrder })
      .where(eq(youtubeItems.id, items[swapIdx].id));
  },

  addEvent: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const eventDateStr = String(form.get("event_date") ?? "").trim();
    const eventTime = String(form.get("event_time") ?? "").trim();
    const countdownEnabled = Number(form.get("countdown_enabled") ?? 1);

    if (masjidId && title && eventDateStr) {
      const eventDate = new Date(eventDateStr);
      await db.insert(events).values({
        masjidId,
        title,
        description: description || null,
        eventDate,
        eventTime: eventTime || null,
        countdownEnabled: countdownEnabled ? 1 : 0,
      });
    }
  },

  deleteEvent: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    if (id)
      await db.update(events).set({ isActive: 0 }).where(eq(events.id, id));
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
      // Hitung jumlah item yang sudah ada untuk auto-increment orderIndex
      const [{ total }] = await db
        .select({ total: count() })
        .from(youtubeItems)
        .where(eq(youtubeItems.masjidId, masjidId));
      await db.insert(youtubeItems).values({
        masjidId,
        youtubeUrl,
        title: title || null,
        orderIndex: Number(total),
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

    // Auto-hapus dulu jadwal >14 hari lalu biar data nggak menumpuk
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);
    await db
      .delete(prayerSchedules)
      .where(
        and(
          eq(prayerSchedules.masjidId, masjidId),
          sql`${prayerSchedules.scheduleDate} < ${cutoffStr}`,
        ),
      );

    // Baca global config untuk tahu provider dan method yang dipakai
    const [config] = await db
      .select()
      .from(globalPrayerConfig)
      .where(eq(globalPrayerConfig.id, 1))
      .limit(1);

    let sourceProvider = "myquran"; // default fallback
    let calculationMethod = "myquran-api"; // default fallback

    if (config?.primaryProviderId) {
      const provider = await getProviderInfo(config.primaryProviderId);
      if (provider) {
        sourceProvider = provider.providerKey;
      }
    }

    if (config?.defaultMethodId) {
      const method = await getMethodInfo(config.defaultMethodId);
      if (method) {
        calculationMethod = method.methodName;
      }
    }

    for (const s of schedules) {
      // Validasi format tanggal YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) continue;

      // Validasi format jam HH:MM untuk semua field waktu
      const timeFields = [
        "imsakTime",
        "subuhTime",
        "sunriseTime",
        "dhuhaTime",
        "dzuhurTime",
        "asharTime",
        "maghribTime",
        "isyaTime",
      ];
      for (const field of timeFields) {
        if (
          typeof (s as Record<string, string>)[field] !== "string" ||
          !/^\d{2}:\d{2}$/.test((s as Record<string, string>)[field])
        ) {
          return fail(400, { error: "Format waktu tidak valid: " + field });
        }
      }

      const dateStr = s.date;

      const [existing] = await db
        .select({ id: prayerSchedules.id })
        .from(prayerSchedules)
        .where(
          and(
            eq(prayerSchedules.masjidId, masjidId),
            sql`${prayerSchedules.scheduleDate} = ${dateStr}`,
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
            sourceProvider,
            calculationMethod,
            isManualOverride: 0,
          })
          .where(eq(prayerSchedules.id, existing.id));
      } else {
        await db.insert(prayerSchedules).values({
          masjidId,
          scheduleDate: sql`${dateStr}`,
          imsakTime: s.imsakTime,
          subuhTime: s.subuhTime,
          sunriseTime: s.sunriseTime,
          dhuhaTime: s.dhuhaTime,
          dzuhurTime: s.dzuhurTime,
          asharTime: s.asharTime,
          maghribTime: s.maghribTime,
          isyaTime: s.isyaTime,
          sourceProvider,
          calculationMethod,
          isManualOverride: 0,
        });
      }
      saved++;
    }

    // Clear cache untuk semua tanggal yang diimport
    for (const s of schedules) {
      invalidateCache(masjidId, s.date);
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

  deletePrayerSchedule: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const scheduleId = Number(form.get("schedule_id") ?? 0);
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    if (!scheduleId || !masjidId) {
      return fail(400, { error: "Data tidak lengkap" });
    }
    await db
      .delete(prayerSchedules)
      .where(
        and(
          eq(prayerSchedules.id, scheduleId),
          eq(prayerSchedules.masjidId, masjidId),
        ),
      );
    invalidateCache(masjidId, "*");
    return { deleteSuccess: true };
  },

  resetPrayerSchedules: async ({ locals, request }) => {
    if (!locals.user) throw redirect(302, "/auth/login");
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();
    if (!masjidId) {
      return fail(400, { error: "masjid_id tidak ditemukan" });
    }
    await db
      .delete(prayerSchedules)
      .where(eq(prayerSchedules.masjidId, masjidId));
    invalidateCache(masjidId, "*");
    return { resetSuccess: true };
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
          sql`${prayerSchedules.scheduleDate} = ${dateStr}`,
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
        scheduleDate: sql`${dateStr}`,
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

    // Clear cache supaya display langsung kebaca
    invalidateCache(masjidId, dateStr);

    // Auto-hapus jadwal >14 hari lalu
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);
    await db
      .delete(prayerSchedules)
      .where(
        and(
          eq(prayerSchedules.masjidId, masjidId),
          sql`${prayerSchedules.scheduleDate} < ${cutoffStr}`,
        ),
      );
  },

  createMasjid: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }

    if (
      !locals.user.roles.includes("admin_masjid") &&
      !locals.user.roles.includes("superadmin")
    ) {
      return fail(403, { message: "Tidak punya akses" });
    }

    // Cek user sudah punya masjid atau belum
    const [existing] = await db
      .select({ id: masjidUsers.id })
      .from(masjidUsers)
      .where(
        and(
          eq(masjidUsers.userId, locals.user.id),
          eq(masjidUsers.isActive, 1),
        ),
      )
      .limit(1);

    if (existing) {
      return fail(400, {
        message: "Akun ini sudah terhubung dengan sebuah masjid",
      });
    }

    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    const province = String(form.get("province") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();
    const timezone = String(form.get("timezone") ?? "Asia/Jakarta").trim();

    if (!name) {
      return fail(400, { message: "Nama masjid wajib diisi" });
    }

    const masjidId = randomUUID();
    await db.insert(masjids).values({
      id: masjidId,
      name,
      city: city || null,
      province: province || null,
      address: address || null,
      timezone,
      isActive: 1,
    });

    await db.insert(masjidUsers).values({
      masjidId,
      userId: locals.user.id,
      roleScope: "owner",
      isActive: 1,
    });

    // Auto-create 14-day trial subscription
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);

    await db.insert(subscriptions).values({
      masjidId,
      packageName: "Trial",
      billingCycle: "monthly",
      status: "trial",
      startDate: today,
      endDate: endDate,
      price: "0.00",
      autoRenew: 0,
    });

    return { success: true };
  },

  updateDeviceTheme: async ({ request }) => {
    const form = await request.formData();
    const deviceId = form.get("device_id")?.toString() ?? "";
    const themeIdRaw = form.get("theme_id")?.toString() ?? "";

    if (!deviceId) {
      return fail(400, { message: "device_id wajib diisi" });
    }

    const themeId = themeIdRaw ? Number(themeIdRaw) : null;

    if (themeId !== null) {
      // Verify theme exists
      const [theme] = await db
        .select({ id: themes.id })
        .from(themes)
        .where(eq(themes.id, themeId))
        .limit(1);
      if (!theme) {
        return fail(400, { message: "Tema tidak ditemukan" });
      }
    }

    await db.update(devices).set({ themeId }).where(eq(devices.id, deviceId));

    return { success: true };
  },

  deleteMasjid: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }
    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "").trim();

    if (!masjidId) {
      return fail(400, { error: "ID masjid tidak ditemukan" });
    }

    // Verify user owns this masjid
    const [membership] = await db
      .select({ id: masjidUsers.id })
      .from(masjidUsers)
      .where(
        and(
          eq(masjidUsers.masjidId, masjidId),
          eq(masjidUsers.userId, locals.user.id),
          eq(masjidUsers.isActive, 1),
        ),
      )
      .limit(1);

    if (!membership) {
      return fail(403, { error: "Anda tidak memiliki akses ke masjid ini" });
    }

    // Hapus masjid — MySQL cascade hapus semua data terkait
    // (devices, jadwal, slide, jumbotron, running text, youtube, dll)
    await db.delete(masjids).where(eq(masjids.id, masjidId));

    invalidateCache(masjidId, "*");

    throw redirect(302, "/admin");
  },

  savePrayerCorrection: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }

    const form = await request.formData();
    const masjidId = String(form.get("masjid_id") ?? "");
    const prayerName = String(form.get("prayerName") ?? "").trim();
    const offsetMinutes = Number(form.get("offsetMinutes") ?? 0);
    const reason = String(form.get("reason") ?? "").trim();
    const activeFromStr = String(form.get("activeFrom") ?? "").trim();
    const activeUntilStr = String(form.get("activeUntil") ?? "").trim();
    const isActive = form.get("isActive") ? 1 : 0;

    if (!masjidId || !prayerName || !activeFromStr || !activeUntilStr) {
      return fail(400, { error: "Data tidak lengkap" });
    }

    const [membership] = await db
      .select({ id: masjidUsers.id })
      .from(masjidUsers)
      .where(
        and(
          eq(masjidUsers.masjidId, masjidId),
          eq(masjidUsers.userId, locals.user.id),
          eq(masjidUsers.isActive, 1),
        ),
      )
      .limit(1);

    if (!membership) {
      return fail(403, { error: "Anda tidak memiliki akses ke masjid ini" });
    }

    try {
      await db.insert(prayerCorrections).values({
        masjidId,
        prayerName: prayerName as any,
        offsetMinutes,
        reason,
        activeFrom: new Date(activeFromStr),
        activeUntil: new Date(activeUntilStr),
        isActive,
      });

      invalidateCache(masjidId, "*");
      return { success: true };
    } catch (error) {
      console.error("Error saving prayer correction:", error);
      return fail(500, { error: "Gagal menyimpan koreksi" });
    }
  },

  updatePrayerCorrection: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }

    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);
    const masjidId = String(form.get("masjid_id") ?? "");
    const prayerName = String(form.get("prayerName") ?? "").trim();
    const offsetMinutes = Number(form.get("offsetMinutes") ?? 0);
    const reason = String(form.get("reason") ?? "").trim();
    const activeFromStr = String(form.get("activeFrom") ?? "").trim();
    const activeUntilStr = String(form.get("activeUntil") ?? "").trim();
    const isActive = form.get("isActive") ? 1 : 0;

    if (!id || !masjidId || !prayerName || !activeFromStr || !activeUntilStr) {
      return fail(400, { error: "Data tidak lengkap" });
    }

    const [membership] = await db
      .select({ id: masjidUsers.id })
      .from(masjidUsers)
      .where(
        and(
          eq(masjidUsers.masjidId, masjidId),
          eq(masjidUsers.userId, locals.user.id),
          eq(masjidUsers.isActive, 1),
        ),
      )
      .limit(1);

    if (!membership) {
      return fail(403, { error: "Anda tidak memiliki akses ke masjid ini" });
    }

    try {
      await db
        .update(prayerCorrections)
        .set({
          prayerName: prayerName as any,
          offsetMinutes,
          reason,
          activeFrom: new Date(activeFromStr),
          activeUntil: new Date(activeUntilStr),
          isActive,
        })
        .where(eq(prayerCorrections.id, id));

      invalidateCache(masjidId, "*");
      return { success: true };
    } catch (error) {
      console.error("Error updating prayer correction:", error);
      return fail(500, { error: "Gagal memperbarui koreksi" });
    }
  },

  deletePrayerCorrection: async ({ locals, request }) => {
    if (!locals.user) {
      throw redirect(302, "/auth/login");
    }

    const form = await request.formData();
    const id = Number(form.get("id") ?? 0);

    if (!id) {
      return fail(400, { error: "ID koreksi tidak ditemukan" });
    }

    // Get the correction to verify ownership
    const [correction] = await db
      .select()
      .from(prayerCorrections)
      .where(eq(prayerCorrections.id, id))
      .limit(1);

    if (!correction) {
      return fail(404, { error: "Koreksi tidak ditemukan" });
    }

    // Verify user owns this masjid
    const [membership] = await db
      .select({ id: masjidUsers.id })
      .from(masjidUsers)
      .where(
        and(
          eq(masjidUsers.masjidId, correction.masjidId),
          eq(masjidUsers.userId, locals.user.id),
          eq(masjidUsers.isActive, 1),
        ),
      )
      .limit(1);

    if (!membership) {
      return fail(403, { error: "Anda tidak memiliki akses ke masjid ini" });
    }

    try {
      await db.delete(prayerCorrections).where(eq(prayerCorrections.id, id));

      invalidateCache(correction.masjidId, "*");
      return { success: true };
    } catch (error) {
      console.error("Error deleting prayer correction:", error);
      return fail(500, { error: "Gagal menghapus koreksi" });
    }
  },
};
