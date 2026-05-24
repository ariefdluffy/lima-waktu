import { and, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "$lib/server/db";
import {
  iqamahSettings,
  prayerCorrections,
  prayerOverrides,
  prayerSchedules,
} from "$lib/server/db/schema";

export type PrayerName =
  | "imsak"
  | "subuh"
  | "sunrise"
  | "dhuha"
  | "dzuhur"
  | "ashar"
  | "maghrib"
  | "isya";

export type IqamahPrayerName =
  | "subuh"
  | "dzuhur"
  | "ashar"
  | "maghrib"
  | "isya"
  | "jumat";

export type ResolvedPrayerTimes = {
  imsak: string;
  subuh: string;
  sunrise: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
};

export type ResolvedPrayerSchedule = {
  scheduleDate: string;
  base: ResolvedPrayerTimes | null;
  resolved: ResolvedPrayerTimes | null;
  iqamah: Record<
    IqamahPrayerName,
    { time: string; delayMinutes: number; enabled: boolean }
  >;
  source: {
    provider: string | null;
    method: string | null;
    isManualOverride: boolean;
    correctionsApplied: number;
    overridesApplied: number;
  };
};

const PRAYER_KEYS: PrayerName[] = [
  "imsak",
  "subuh",
  "sunrise",
  "dhuha",
  "dzuhur",
  "ashar",
  "maghrib",
  "isya",
];

const IQAMAH_PRAYERS: IqamahPrayerName[] = [
  "subuh",
  "dzuhur",
  "ashar",
  "maghrib",
  "isya",
  "jumat",
];

const DEFAULT_IQAMAH_DELAYS: Record<IqamahPrayerName, number> = {
  subuh: 15,
  dzuhur: 10,
  ashar: 10,
  maghrib: 7,
  isya: 10,
  jumat: 20,
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function timeToMinutes(time: string): number {
  const [hh, mm] = time.split(":").map((v) => Number(v));
  return hh * 60 + mm;
}

function minutesToTime(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  // Drizzle MySQL "time" returns "HH:MM:SS" string. Trim seconds.
  const parts = value.split(":");
  if (parts.length < 2) return null;
  return `${pad2(Number(parts[0]))}:${pad2(Number(parts[1]))}`;
}

function applyOffset(time: string, offsetMinutes: number): string {
  return minutesToTime(timeToMinutes(time) + offsetMinutes);
}

function isCorrectionActive(
  correction: {
    activeFrom: Date | null;
    activeUntil: Date | null;
    isActive: number;
  },
  date: Date,
): boolean {
  if (correction.isActive !== 1) return false;
  const dateOnly = new Date(date.toDateString()); // Midnight of the date
  if (correction.activeFrom) {
    const fromDateOnly = new Date(correction.activeFrom.toDateString());
    if (fromDateOnly > dateOnly) return false;
  }
  if (correction.activeUntil) {
    const untilDateOnly = new Date(correction.activeUntil.toDateString());
    if (untilDateOnly < dateOnly) return false;
  }
  return true;
}

function dateToYmd(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate(),
  )}`;
}

function ymdToUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export async function resolvePrayerScheduleForMasjid(
  masjidId: string,
  scheduleDateYmd: string,
): Promise<ResolvedPrayerSchedule> {
  const [scheduleRow] = await db
    .select()
    .from(prayerSchedules)
    .where(
      and(
        eq(prayerSchedules.masjidId, masjidId),
        sql`${prayerSchedules.scheduleDate} = ${scheduleDateYmd}`,
      ),
    )
    .limit(1);

  const correctionRows = await db
    .select()
    .from(prayerCorrections)
    .where(
      and(
        eq(prayerCorrections.masjidId, masjidId),
        eq(prayerCorrections.isActive, 1),
        or(
          isNull(prayerCorrections.activeFrom),
          lte(prayerCorrections.activeFrom, new Date()),
        ),
        or(
          isNull(prayerCorrections.activeUntil),
          // Compare end-of-day: activeUntil should be >= today at 23:59:59
          gte(
            prayerCorrections.activeUntil,
            new Date(new Date().toDateString()),
          ),
        ),
      ),
    );

  const overrideRows = await db
    .select()
    .from(prayerOverrides)
    .where(
      and(
        eq(prayerOverrides.masjidId, masjidId),
        sql`${prayerOverrides.scheduleDate} = ${scheduleDateYmd}`,
      ),
    );

  const iqamahRows = await db
    .select()
    .from(iqamahSettings)
    .where(eq(iqamahSettings.masjidId, masjidId));

  const base: ResolvedPrayerTimes | null = scheduleRow
    ? {
        imsak: normalizeTime(scheduleRow.imsakTime) ?? "00:00",
        subuh: normalizeTime(scheduleRow.subuhTime) ?? "00:00",
        sunrise: normalizeTime(scheduleRow.sunriseTime) ?? "00:00",
        dhuha: normalizeTime(scheduleRow.dhuhaTime) ?? "00:00",
        dzuhur: normalizeTime(scheduleRow.dzuhurTime) ?? "00:00",
        ashar: normalizeTime(scheduleRow.asharTime) ?? "00:00",
        maghrib: normalizeTime(scheduleRow.maghribTime) ?? "00:00",
        isya: normalizeTime(scheduleRow.isyaTime) ?? "00:00",
      }
    : null;

  let correctionsApplied = 0;
  let overridesApplied = 0;
  let resolved: ResolvedPrayerTimes | null = base ? { ...base } : null;

  if (resolved) {
    for (const key of PRAYER_KEYS) {
      const matching = correctionRows.filter(
        (row) => row.prayerName === key && isCorrectionActive(row, new Date()),
      );
      if (matching.length === 0) continue;
      const totalOffset = matching.reduce(
        (sum, row) => sum + (row.offsetMinutes ?? 0),
        0,
      );
      if (totalOffset !== 0) {
        resolved[key] = applyOffset(resolved[key], totalOffset);
        correctionsApplied++;
      }
    }

    for (const override of overrideRows) {
      const overrideTime = normalizeTime(override.overrideTime);
      if (!overrideTime) continue;
      const key = override.prayerName as PrayerName;
      if (resolved[key] !== undefined) {
        resolved[key] = overrideTime;
        overridesApplied++;
      }
    }
  }

  const iqamahMap = new Map(
    iqamahRows.map((row) => [row.prayerName as IqamahPrayerName, row]),
  );

  const iqamah: ResolvedPrayerSchedule["iqamah"] =
    {} as ResolvedPrayerSchedule["iqamah"];

  for (const prayer of IQAMAH_PRAYERS) {
    const setting = iqamahMap.get(prayer);
    const delayMinutes = setting?.delayMinutes ?? DEFAULT_IQAMAH_DELAYS[prayer];
    const enabled = setting ? setting.enabled === 1 : true;

    let baseTime: string | null = null;
    if (resolved) {
      if (prayer === "jumat") {
        baseTime = resolved.dzuhur;
      } else {
        baseTime = resolved[prayer as PrayerName];
      }
    }

    iqamah[prayer] = {
      time: baseTime ? applyOffset(baseTime, delayMinutes) : "00:00",
      delayMinutes,
      enabled,
    };
  }

  return {
    scheduleDate: scheduleDateYmd,
    base,
    resolved,
    iqamah,
    source: {
      provider: scheduleRow?.sourceProvider ?? null,
      method: scheduleRow?.calculationMethod ?? null,
      isManualOverride: scheduleRow?.isManualOverride === 1,
      correctionsApplied,
      overridesApplied,
    },
  };
}

// Map timezone string → UTC offset jam
const TZ_OFFSETS: Record<string, number> = {
  "Asia/Jakarta": 7, // WIB
  "Asia/Pontianak": 7, // WIB
  "Asia/Makassar": 8, // WITA
  "Asia/Ujung_Pandang": 8, // WITA
  "Asia/Jayapura": 9, // WIT
};

function getTZOffsetHours(timezone: string): number {
  return TZ_OFFSETS[timezone] ?? 7; // default WIB
}

// Dapatkan tanggal YYYY-MM-DD dalam timezone tertentu
export function todayYmdInTimezone(timezone: string, now = new Date()): string {
  const offsetHours = getTZOffsetHours(timezone);
  const offsetMs = offsetHours * 60 * 60 * 1000;
  const localTime = new Date(now.getTime() + offsetMs);
  return dateToYmd(localTime);
}

// Deprecated — jangan pakai untuk masjid-specific. Gunakan todayYmdInTimezone(timezone).
export function todayYmdInJakarta(now = new Date()): string {
  const timezoneOffsetMs = 8 * 60 * 60 * 1000; // WITA (UTC+8)
  const localTime = new Date(now.getTime() + timezoneOffsetMs);
  return dateToYmd(localTime);
}

export { PRAYER_KEYS, IQAMAH_PRAYERS };
