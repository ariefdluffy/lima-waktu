import type { DisplayPayload } from "$lib/types/display";
import { DEFAULT_SLIDES } from "$lib/utils/prayer";
import {
  getTZOffsetHours,
  getTZLabel,
  getTZParts,
  formatTimeTZ,
  formatDateTZ,
} from "$lib/utils/timezone";
import { toHijriyah } from "$lib/utils/prayer";

// ── Theme ─────────────────────────────────────────────────────────
export function themeCssVars(palette: Record<string, string> | null): string {
  if (!palette) return "";
  return Object.entries(palette)
    .map(
      ([k, v]) =>
        `--${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}: ${v}`,
    )
    .join("; ");
}

// ── Timezone ──────────────────────────────────────────────────────
export function getTZOffset(timezone: string): number {
  return getTZOffsetHours(timezone);
}

export function getTZLabelText(timezone: string, city?: string | null): string {
  const label = getTZLabel(timezone);
  return city ? `${label} \u2022 ${city}` : label;
}

export function getWIBParts(date: Date, timezone: string) {
  return getTZParts(date, getTZOffsetHours(timezone));
}

export function formatTime(date: Date, timezone: string): string {
  return formatTimeTZ(date, getTZOffsetHours(timezone));
}

export function formatDate(date: Date, timezone: string): string {
  return formatDateTZ(date, getTZOffsetHours(timezone));
}

// ── Hijriyah ──────────────────────────────────────────────────────
export function computeHijriyah(
  date: Date,
  timezone: string,
  hijriOffset: number,
): string {
  const offset = hijriOffset ?? 0;
  const {
    year,
    month,
    date: day,
  } = getTZParts(date, getTZOffsetHours(timezone));
  return toHijriyah(year, month + 1, day, offset);
}

// ── Location ──────────────────────────────────────────────────────
export function getLocationText(
  masjid: DisplayPayload["masjid"] | null,
): string {
  if (!masjid) return "";
  const parts = [masjid.address, masjid.city, masjid.province].filter(Boolean);
  return parts.join(", ");
}

// ── YouTube ───────────────────────────────────────────────────────
export function getYoutubeEmbedUrl(url: string): string {
  let videoId = "";
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      videoId = u.searchParams.get("v") ?? u.pathname.split("/").pop() ?? "";
    }
  } catch {
    videoId = url;
  }
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&enablejsapi=1&playsinline=1&iv_load_policy=3`;
}

// ── Running Text ──────────────────────────────────────────────────
export const DEFAULT_RUNNING_TEXT =
  "Selamat datang di Masjid. Mohon menonaktifkan nada dering ponsel.";

export function getRunningTextContent(
  runningTexts: DisplayPayload["runningTexts"],
): string {
  if (!runningTexts?.length) {
    return DEFAULT_RUNNING_TEXT;
  }
  return runningTexts.map((rt) => rt.content).join("  |  ");
}

// ── Slides ────────────────────────────────────────────────────────
export function getCurrentSlideContent(
  slides: DisplayPayload["slides"],
  currentSlide: number,
) {
  if (slides.length === 0) {
    return DEFAULT_SLIDES[currentSlide % DEFAULT_SLIDES.length];
  }
  const slide = slides[currentSlide % slides.length];
  return slide?.fileUrl
    ? null
    : DEFAULT_SLIDES[currentSlide % DEFAULT_SLIDES.length];
}
