import type { PageServerLoad } from "./$types";
import type {
  DisplayPayload,
  ThemePalette,
  ThemeData,
} from "$lib/types/display";

// Palette tema hijau zamrud — selaras dengan tailwind.config.js
const previewPalette: ThemePalette = {
  bgPrimary: "#0a0f1e",
  bgSecondary: "#0f172a",
  bgOverlay: "#020617",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  accentPrimary: "#34d399",
  accentSecondary: "#fbbf24",
  accentMuted: "#10b981",
  borderColor: "rgba(255, 255, 255, 0.08)",
  borderAccent: "rgba(52, 211, 153, 0.15)",
  fontHeading: "'Cinzel', serif",
  fontBody: "'Exo 2', sans-serif",
  fontArabic: "'Noto Naskh Arabic', serif",
  borderRadius: "12px",
  cardBg: "rgba(255, 255, 255, 0.04)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  prayerActiveBg: "rgba(52, 211, 153, 0.12)",
  prayerActiveBorder: "rgba(52, 211, 153, 0.3)",
  prayerActiveGlow: "rgba(52, 211, 153, 0.25)",
  headerBg:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 30, 0) 100%)",
  runningBarBg: "rgba(15, 23, 42, 0.85)",
  runningBarBorder: "rgba(52, 211, 153, 0.2)",
  progressFill: "linear-gradient(90deg, #10b981, #34d399)",
  screensaverBg: "radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)",
  tahajudBg: "radial-gradient(ellipse at center, #0a0f2e 0%, #020617 100%)",
  moodAdzanBg:
    "radial-gradient(ellipse at center, rgba(60,40,5,1) 0%, rgba(20,10,2,1) 100%)",
  moodIqamahBg:
    "radial-gradient(ellipse at center, rgba(0,70,35,1) 0%, rgba(0,20,8,1) 100%)",
  moodKhusukBg:
    "radial-gradient(ellipse at center, rgba(10,5,30,1) 0%, rgba(0,0,0,1) 100%)",
  topBarColor: "#34d399",
  bgStars: "rgba(255, 255, 255, 0.02)",
  bgGrid: "rgba(255, 255, 255, 0.02)",
};

const previewTheme: ThemeData = {
  id: 0,
  themeKey: "preview-default",
  name: "Preview Default",
  palette: previewPalette,
  layout: {
    panelOrder: ["left", "center", "right"],
    leftWidth: 23,
    centerWidth: 57,
    rightWidth: 20,
    showHeader: true,
    showRunningBar: true,
    prayerCardStyle: "default",
    headerLayout: "logo-left",
    fontSizeScale: "normal",
    borderRadiusScale: "normal",
  },
  isGlobal: true,
};

function makeMockPayload(): DisplayPayload {
  return {
    generatedAt: new Date().toISOString(),
    device: {
      id: "preview",
      deviceCode: "preview",
      name: "Preview Display",
      orientation: "horizontal",
      layoutMode: "default",
    },
    theme: previewTheme,
    masjid: {
      id: "preview",
      name: "Masjid Jami' Asy-Syukur",
      address: "Jl. Masjid No. 1",
      city: "Makassar",
      district: "Panakkukang",
      province: "Sulawesi Selatan",
      timezone: "Asia/Makassar",
      latitude: "-5.1477",
      longitude: "119.4322",
      hijriOffset: 0,
      adzanScreenDuration: 2,
      khusukScreenDuration: 10,
      screensaverDelayMinutes: 120,
      screensaverWakeMinutes: 60,
      logoUrl: null,
    },
    schedule: {
      scheduleDate: new Date().toISOString().slice(0, 10),
      base: {
        imsak: "04:30",
        subuh: "04:45",
        sunrise: "06:00",
        dhuha: "06:30",
        dzuhur: "12:00",
        ashar: "15:15",
        maghrib: "18:00",
        isya: "19:15",
      },
      resolved: {
        imsak: "04:30",
        subuh: "04:45",
        sunrise: "06:00",
        dhuha: "06:30",
        dzuhur: "12:00",
        ashar: "15:15",
        maghrib: "18:00",
        isya: "19:15",
      },
      iqamah: {
        subuh: { time: "04:55", delayMinutes: 10, enabled: true },
        dzuhur: { time: "12:10", delayMinutes: 10, enabled: true },
        ashar: { time: "15:25", delayMinutes: 10, enabled: true },
        maghrib: { time: "18:05", delayMinutes: 5, enabled: true },
        isya: { time: "19:25", delayMinutes: 10, enabled: true },
        jumat: { time: "12:05", delayMinutes: 5, enabled: true },
      },
      source: {
        provider: "preview",
        method: "static",
        isManualOverride: false,
        correctionsApplied: 0,
        overridesApplied: 0,
      },
    },
    runningTexts: [
      {
        id: 1,
        content:
          "Selamat datang di Masjid Jami' Asy-Syukur • Mohon menjaga kebersihan dan kekhusyukan",
        speed: 70,
      },
    ],
    slides: [],
    jumbotrons: [
      {
        id: 1,
        title: "Jadwal Kajian",
        content:
          "Kajian Ahad Pagi • Setiap pekan jam 07.00 – 08.30 WITA\nKajian Ba'da Maghrib • Setiap Selasa & Kamis",
        backgroundUrl: null,
      },
    ],
    youtubeItems: [],
    events: [
      {
        id: 1,
        title: "Idul Adha",
        description: "Sholat Ied & Qurban",
        eventDate: "2026-06-28",
        eventTime: "07:00",
        countdownEnabled: true,
      },
    ],
  };
}

export const load: PageServerLoad = () => {
  return {
    displayPayload: makeMockPayload(),
  };
};
