import type { DisplayPayload } from "$lib/types/display";
import { PRAYER_ORDER, PRAYER_LABELS, timeToMinutes } from "$lib/utils/prayer";
import { getTZOffsetHours, getTZParts } from "$lib/utils/timezone";
import { playAdzanBeep, playIqamahBeep } from "./audio.svelte";

// ── Reactive Prayer State ─────────────────────────────────────────
export const prayer = $state({
  nextPrayerName: "",
  nextPrayerTime: "",
  countdown: "00 : 00 : 00",
  countdownProgress: 0,
  iqamahTime: "",
  activePrayerIndex: -1,
  mood: "normal" as "normal" | "adzan" | "iqamah" | "khusuk",
  moodPrayerName: "",
  moodPrayerKey: "",
  moodCountdown: "",
  moodCountdownLabel: "",
  screensaver: false,
  tahajudMode: false,
  flash: false,
  flashType: "adzan" as "adzan" | "iqamah",
});

// Internal: trigger only once per prayer/iqamah
let lastTriggeredPrayer = $state("");
let lastTriggeredIqamahEnd = $state("");

// ── Flash Screen ─────────────────────────────────────────────────
const FLASH_DURATION_MS = 2500;
let flashTimer: ReturnType<typeof setTimeout> | null = null;

export function triggerFlash(type: "adzan" | "iqamah" = "adzan") {
  prayer.flash = true;
  prayer.flashType = type;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    prayer.flash = false;
    flashTimer = null;
  }, FLASH_DURATION_MS);
}

// ── Helpers ───────────────────────────────────────────────────────
function getCurrentTimeMinutes(now: Date, timezone: string): number {
  const offset = getTZOffsetHours(timezone);
  const { hours, minutes } = getTZParts(now, offset);
  return hours * 60 + minutes;
}

function getCurrentTotalSeconds(now: Date, timezone: string): number {
  const offset = getTZOffsetHours(timezone);
  const { hours, minutes, seconds } = getTZParts(now, offset);
  return hours * 3600 + minutes * 60 + seconds;
}

// ── Countdown Progress ────────────────────────────────────────────
function calcCountdownProgress(
  currentMinutes: number,
  resolved: Record<string, string>,
  nextIdx: number,
): number {
  let prevIdx = nextIdx - 1;
  if (prevIdx < 0) prevIdx = PRAYER_ORDER.length - 1;
  const prevPrayer = PRAYER_ORDER[prevIdx];
  const nextPrayer = PRAYER_ORDER[nextIdx];
  const prevMin = timeToMinutes(resolved[prevPrayer]);
  let nextMin = timeToMinutes(resolved[nextPrayer]);
  if (nextMin <= prevMin) nextMin += 1440;
  const currentAdjusted =
    currentMinutes < prevMin ? currentMinutes + 1440 : currentMinutes;
  const total = nextMin - prevMin;
  const elapsed = currentAdjusted - prevMin;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function calcCountdownProgressAfterIsya(
  currentMinutes: number,
  resolved: Record<string, string>,
): number {
  const isyaMin = timeToMinutes(resolved.isya);
  const subuhMin = timeToMinutes(resolved.subuh);
  const total = 1440 - isyaMin + subuhMin;
  const elapsed =
    currentMinutes >= isyaMin
      ? currentMinutes - isyaMin
      : 1440 - isyaMin + currentMinutes;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function formatCountdown(diffSeconds: number): string {
  const hh = Math.floor(diffSeconds / 3600);
  const mm = Math.floor((diffSeconds % 3600) / 60);
  const ss = diffSeconds % 60;
  return `${String(hh).padStart(2, "0")} : ${String(mm).padStart(2, "0")} : ${String(ss).padStart(2, "0")}`;
}

function formatMoodCountdown(remainingSec: number): string {
  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// ── Main Update ───────────────────────────────────────────────────
export function updatePrayerState(payload: DisplayPayload, now: Date) {
  if (!payload?.schedule?.resolved) return;

  const timezone = payload?.masjid?.timezone ?? "Asia/Makassar";
  const resolved = payload.schedule.resolved;
  const currentMinutes = getCurrentTimeMinutes(now, timezone);
  const currentTotalSeconds = getCurrentTotalSeconds(now, timezone);

  // ── Find next prayer ────────────────────────────────────────────
  let found = false;
  let nextIdx = -1;
  for (let i = 0; i < PRAYER_ORDER.length; i++) {
    const prayerName = PRAYER_ORDER[i];
    if (timeToMinutes(resolved[prayerName]) > currentMinutes) {
      nextIdx = i;
      found = true;
      break;
    }
  }
  if (!found) nextIdx = 0;

  prayer.activePrayerIndex = nextIdx;
  const activePrayer = PRAYER_ORDER[nextIdx];

  // Hari Jumat: label Dzuhur diganti "JUM'AT" di seluruh UI
  const { day: dayOfWeek } = getTZParts(now, getTZOffsetHours(timezone));
  const isJumat = dayOfWeek === 5;
  prayer.nextPrayerName =
    activePrayer === "dzuhur" && isJumat
      ? "JUM'AT"
      : PRAYER_LABELS[activePrayer];
  prayer.nextPrayerTime = resolved[activePrayer];

  // Iqamah
  const iqamahData = payload.schedule.iqamah[activePrayer];
  prayer.iqamahTime = iqamahData?.enabled ? iqamahData.time : "";

  // ── Countdown ────────────────────────────────────────────────────
  if (found) {
    const target = timeToMinutes(resolved[activePrayer]) * 60;
    let diff = target - currentTotalSeconds;
    if (diff < 0) diff += 86400;
    prayer.countdown = formatCountdown(diff);

    if (diff <= 1 && lastTriggeredPrayer !== activePrayer) {
      lastTriggeredPrayer = activePrayer;
      playAdzanBeep();
      triggerFlash("adzan");
    }
    prayer.countdownProgress = calcCountdownProgress(
      currentMinutes,
      resolved,
      nextIdx,
    );
  } else {
    // After Isya → countdown to tomorrow Subuh
    const subuhTarget = timeToMinutes(resolved.subuh) * 60;
    let diff = 86400 - currentTotalSeconds + subuhTarget;
    prayer.countdown = formatCountdown(diff);
    prayer.countdownProgress = calcCountdownProgressAfterIsya(
      currentMinutes,
      resolved,
    );
  }

  // ── Mood: Adzan / Iqamah / Khusuk ───────────────────────────────
  let newMood: "normal" | "adzan" | "iqamah" | "khusuk" = "normal";
  let newMoodPrayerName = "";
  const ADZAN_DURATION = payload?.masjid?.adzanScreenDuration ?? 2;
  const KHUSUK_DURATION = payload?.masjid?.khusukScreenDuration ?? 10;

  // Current (last passed) prayer
  let currentPrayerIdx = -1;
  for (let i = PRAYER_ORDER.length - 1; i >= 0; i--) {
    const p = PRAYER_ORDER[i];
    if (timeToMinutes(resolved[p]) <= currentMinutes) {
      currentPrayerIdx = i;
      break;
    }
  }

  if (currentPrayerIdx >= 0) {
    const cp = PRAYER_ORDER[currentPrayerIdx];
    const adzanMin = timeToMinutes(resolved[cp]);
    const adzanEndMin = adzanMin + ADZAN_DURATION;
    const iqData = payload.schedule.iqamah[cp];

    // Hari Jumat + waktu Dzuhur: fase iqamah dilewati, langsung khusuk
    const isJumatDzuhur = isJumat && cp === "dzuhur";

    let khusukEndMin: number;
    if (!isJumatDzuhur && iqData?.enabled && iqData?.time) {
      const iqamahMin = timeToMinutes(iqData.time);
      khusukEndMin = iqamahMin + KHUSUK_DURATION;
    } else {
      khusukEndMin = adzanEndMin + KHUSUK_DURATION;
    }

    if (currentMinutes >= adzanMin && currentMinutes < khusukEndMin) {
      if (currentMinutes < adzanEndMin) {
        newMood = "adzan";
      } else if (!isJumatDzuhur && iqData?.enabled && iqData?.time) {
        // Waktu sholat biasa: ada fase iqamah
        const iqamahMin = timeToMinutes(iqData.time);
        if (currentMinutes >= iqamahMin) {
          newMood = "khusuk";
          // Assign mood immediately so template hides MoodOverlay before flash renders
          prayer.mood = "khusuk";
          // Trigger alarm when iqamah ends (transitioning to khusuk)
          if (lastTriggeredIqamahEnd !== cp) {
            lastTriggeredIqamahEnd = cp;
            playIqamahBeep();
            triggerFlash("iqamah");
          }
        } else {
          newMood = "iqamah";
        }
      } else {
        // Hari Jumat Dzuhur atau tidak ada iqamah: langsung khusuk setelah adzan
        newMood = "khusuk";
        if (lastTriggeredIqamahEnd !== cp) {
          lastTriggeredIqamahEnd = cp;
          playIqamahBeep();
          triggerFlash("iqamah");
        }
      }
      newMoodPrayerName = isJumatDzuhur ? "JUM'AT" : PRAYER_LABELS[cp];
    }
  }

  if (newMood !== "khusuk" && lastTriggeredIqamahEnd) {
    lastTriggeredIqamahEnd = "";
  }

  prayer.mood = newMood;
  prayer.moodPrayerName = newMoodPrayerName;
  prayer.moodPrayerKey =
    currentPrayerIdx >= 0 ? PRAYER_ORDER[currentPrayerIdx] : "";

  // ── Mood Countdown ──────────────────────────────────────────────
  {
    let remainingSec = 0;
    let label = "";
    if (newMood === "adzan" && currentPrayerIdx >= 0) {
      const cp = PRAYER_ORDER[currentPrayerIdx];
      const adzanMin = timeToMinutes(resolved[cp]);
      const adzanEndMin = adzanMin + ADZAN_DURATION;
      remainingSec = adzanEndMin * 60 - currentTotalSeconds;
      label = "ADZAN BERAKHIR DALAM";
    } else if (newMood === "iqamah" && currentPrayerIdx >= 0) {
      // Fase iqamah tidak pernah aktif di Jumat Dzuhur, tapi guard tetap ada
      const cp = PRAYER_ORDER[currentPrayerIdx];
      const iqData = payload.schedule.iqamah[cp];
      if (iqData?.enabled && iqData?.time) {
        const iqamahMin = timeToMinutes(iqData.time);
        remainingSec = iqamahMin * 60 - currentTotalSeconds;
        label = "MENUJU IQAMAH";
      }
    } else if (newMood === "khusuk" && currentPrayerIdx >= 0) {
      const cp = PRAYER_ORDER[currentPrayerIdx];
      const isJumatDzuhurKhusuk = isJumat && cp === "dzuhur";
      const iqData = payload.schedule.iqamah[cp];
      let khusukEndMin: number;
      if (!isJumatDzuhurKhusuk && iqData?.enabled && iqData?.time) {
        // Sholat biasa dengan iqamah
        const iqamahMin = timeToMinutes(iqData.time);
        khusukEndMin = iqamahMin + KHUSUK_DURATION;
      } else {
        // Jumat Dzuhur atau tidak ada iqamah: hitung dari akhir adzan
        const adzanEndMin = timeToMinutes(resolved[cp]) + ADZAN_DURATION;
        khusukEndMin = adzanEndMin + KHUSUK_DURATION;
      }
      remainingSec = khusukEndMin * 60 - currentTotalSeconds;
      label = "WAKTU KHUSYUK TERSISA";
    }
    if (remainingSec > 0) {
      prayer.moodCountdown = formatMoodCountdown(remainingSec);
      prayer.moodCountdownLabel = label;
    } else {
      prayer.moodCountdown = "";
      prayer.moodCountdownLabel = "";
    }
  }

  // ── Screensaver & Tahajud ──────────────────────────────────────
  const isyaMin = timeToMinutes(resolved.isya);
  const subuhMin = timeToMinutes(resolved.subuh);
  const syuruqMin = timeToMinutes(resolved.sunrise);
  const dzuhurMin = timeToMinutes(resolved.dzuhur);
  const SCREENSAVER_DELAY = payload?.masjid?.screensaverDelayMinutes ?? 120;
  const SCREENSAVER_WAKE = payload?.masjid?.screensaverWakeMinutes ?? 60;
  const MORNING_DELAY = payload?.masjid?.screensaverMorningDelayMinutes ?? 60;
  const MORNING_WAKE = payload?.masjid?.screensaverMorningWakeMinutes ?? 120;

  const dalamJendelaMalam =
    currentMinutes >= isyaMin + SCREENSAVER_DELAY ||
    currentMinutes < subuhMin - SCREENSAVER_WAKE;
  const dalamJendelaPagi =
    MORNING_DELAY > 0 &&
    currentMinutes >= syuruqMin + MORNING_DELAY &&
    currentMinutes < dzuhurMin - (MORNING_WAKE > 0 ? MORNING_WAKE : 0);
  prayer.screensaver = dalamJendelaMalam || dalamJendelaPagi;
  // Hardcode: tahajud mode off 10 menit sebelum Subuh
  const TAHAJUD_END_OFFSET = 10;
  prayer.tahajudMode =
    currentMinutes >= subuhMin - SCREENSAVER_WAKE &&
    currentMinutes < subuhMin - TAHAJUD_END_OFFSET;
}

// Reset beep tracker (call when payload changes)
// Skip reset for active mood to prevent beep/flash re-triggering during fetch polling
export function resetBeepTriggers() {
  if (prayer.mood !== "adzan") {
    lastTriggeredPrayer = "";
  }
  if (prayer.mood !== "khusuk") {
    lastTriggeredIqamahEnd = "";
  }
}
