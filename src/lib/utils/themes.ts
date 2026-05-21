import type { ThemePalette, ThemeLayout } from "$lib/types/display";

export type ThemePreset = {
  themeKey: string;
  name: string;
  palette: ThemePalette;
  layout: ThemeLayout;
  isGlobal: boolean;
};

/**
 * Default theme presets for Display TV Masjid.
 * Each has unique colors, fonts, and layout configuration.
 */
export const DEFAULT_THEMES: ThemePreset[] = [
  // ── 1. Modern Minimalis (Default) ──
  {
    themeKey: "modern-minimalis",
    name: "Modern Minimalis",
    isGlobal: true,
    palette: {
      bgPrimary: "#0a0f1e",
      bgSecondary: "rgba(0, 0, 0, 0.2)",
      bgOverlay: "rgba(0, 0, 0, 0.35)",
      textPrimary: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.55)",
      textMuted: "rgba(255, 255, 255, 0.35)",
      accentPrimary: "#f0d080",
      accentSecondary: "#c8a84b",
      accentMuted: "rgba(200, 168, 75, 0.6)",
      borderColor: "rgba(255, 255, 255, 0.08)",
      borderAccent: "rgba(200, 168, 75, 0.2)",
      fontHeading: "'Cinzel', serif",
      fontBody: "'Inter', sans-serif",
      fontArabic: "'Noto Naskh Arabic', serif",
      borderRadius: "10px",
      cardBg: "rgba(255, 255, 255, 0.04)",
      cardBorder: "rgba(255, 255, 255, 0.1)",
      prayerActiveBg: "rgba(200, 168, 75, 0.12)",
      prayerActiveBorder: "rgba(200, 168, 75, 0.6)",
      prayerActiveGlow: "rgba(200, 168, 75, 0.25)",
      headerBg: "transparent",
      runningBarBg: "rgba(200, 168, 75, 0.12)",
      runningBarBorder: "rgba(200, 168, 75, 0.3)",
      progressFill: "linear-gradient(90deg, #c8a84b, #f0d080)",
      screensaverBg:
        "radial-gradient(ellipse at center, rgba(0, 30, 20, 0.95) 0%, rgba(0, 10, 5, 0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center, rgba(5, 5, 30, 0.97) 0%, rgba(0, 0, 10, 0.99) 100%)",
      moodAdzanBg:
        "radial-gradient(ellipse at center, rgba(60, 40, 5, 1) 0%, rgba(20, 10, 2, 1) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center, rgba(0, 70, 35, 1) 0%, rgba(0, 20, 8, 1) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center, rgba(10, 5, 30, 1) 0%, rgba(0, 0, 0, 1) 100%)",
      topBarColor: "transparent",
      bgStars: "#ffffff",
      bgGrid: "rgba(200, 168, 75, 0.06)",
    },
    layout: {
      panelOrder: ["left", "center", "right"],
      leftWidth: 20,
      centerWidth: 60,
      rightWidth: 20,
      showHeader: true,
      showRunningBar: true,
      prayerCardStyle: "default",
      headerLayout: "logo-left",
      fontSizeScale: "normal",
      borderRadiusScale: "normal",
    },
  },

  // ── 2. Classic Islamic ──
  {
    themeKey: "classic-islamic",
    name: "Classic Islamic",
    isGlobal: true,
    palette: {
      bgPrimary: "#1a3c2a",
      bgSecondary: "rgba(0, 0, 0, 0.15)",
      bgOverlay: "rgba(0, 0, 0, 0.3)",
      textPrimary: "#f5efe6",
      textSecondary: "rgba(245, 239, 230, 0.65)",
      textMuted: "rgba(245, 239, 230, 0.4)",
      accentPrimary: "#d4a853",
      accentSecondary: "#b8943e",
      accentMuted: "rgba(212, 168, 83, 0.5)",
      borderColor: "rgba(212, 168, 83, 0.12)",
      borderAccent: "rgba(212, 168, 83, 0.25)",
      fontHeading: "'Amiri', serif",
      fontBody: "'IBM Plex Sans', sans-serif",
      fontArabic: "'Amiri', serif",
      borderRadius: "6px",
      cardBg: "rgba(245, 239, 230, 0.04)",
      cardBorder: "rgba(212, 168, 83, 0.15)",
      prayerActiveBg: "rgba(212, 168, 83, 0.15)",
      prayerActiveBorder: "rgba(212, 168, 83, 0.5)",
      prayerActiveGlow: "rgba(212, 168, 83, 0.2)",
      headerBg: "rgba(0, 0, 0, 0.25)",
      runningBarBg: "rgba(212, 168, 83, 0.1)",
      runningBarBorder: "rgba(212, 168, 83, 0.25)",
      progressFill: "linear-gradient(90deg, #b8943e, #d4a853)",
      screensaverBg:
        "radial-gradient(ellipse at center, rgba(26, 60, 42, 0.95) 0%, rgba(10, 30, 15, 0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center, rgba(15, 30, 25, 0.97) 0%, rgba(5, 15, 10, 0.99) 100%)",
      moodAdzanBg:
        "radial-gradient(ellipse at center, rgba(60, 35, 5, 1) 0%, rgba(25, 12, 2, 1) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center, rgba(0, 60, 40, 1) 0%, rgba(0, 20, 10, 1) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center, rgba(8, 5, 25, 1) 0%, rgba(0, 0, 0, 1) 100%)",
      topBarColor: "#d4a853",
      bgStars: "rgba(212, 168, 83, 0.3)",
      bgGrid: "rgba(212, 168, 83, 0.04)",
    },
    layout: {
      panelOrder: ["left", "center", "right"],
      leftWidth: 22,
      centerWidth: 56,
      rightWidth: 22,
      showHeader: true,
      showRunningBar: true,
      prayerCardStyle: "ornate",
      headerLayout: "logo-center",
      fontSizeScale: "normal",
      borderRadiusScale: "sharp",
    },
  },

  // ── 3. Dark Premium ──
  {
    themeKey: "dark-premium",
    name: "Dark Premium",
    isGlobal: true,
    palette: {
      bgPrimary: "#080c14",
      bgSecondary: "rgba(255, 255, 255, 0.02)",
      bgOverlay: "rgba(0, 0, 0, 0.4)",
      textPrimary: "#e8ecf1",
      textSecondary: "rgba(232, 236, 241, 0.5)",
      textMuted: "rgba(232, 236, 241, 0.3)",
      accentPrimary: "#5dade2",
      accentSecondary: "#2e86c1",
      accentMuted: "rgba(93, 173, 226, 0.5)",
      borderColor: "rgba(232, 236, 241, 0.06)",
      borderAccent: "rgba(93, 173, 226, 0.2)",
      fontHeading: "'Montserrat', sans-serif",
      fontBody: "'Inter', sans-serif",
      fontArabic: "'Noto Naskh Arabic', serif",
      borderRadius: "12px",
      cardBg: "rgba(255, 255, 255, 0.03)",
      cardBorder: "rgba(255, 255, 255, 0.06)",
      prayerActiveBg: "rgba(93, 173, 226, 0.1)",
      prayerActiveBorder: "rgba(93, 173, 226, 0.5)",
      prayerActiveGlow: "rgba(93, 173, 226, 0.2)",
      headerBg: "rgba(255, 255, 255, 0.02)",
      runningBarBg: "rgba(93, 173, 226, 0.08)",
      runningBarBorder: "rgba(93, 173, 226, 0.25)",
      progressFill: "linear-gradient(90deg, #2e86c1, #5dade2)",
      screensaverBg:
        "radial-gradient(ellipse at center, rgba(8, 12, 20, 0.97) 0%, rgba(0, 0, 0, 0.99) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center, rgba(10, 8, 25, 0.97) 0%, rgba(0, 0, 10, 0.99) 100%)",
      moodAdzanBg:
        "radial-gradient(ellipse at center, rgba(50, 35, 5, 1) 0%, rgba(20, 10, 2, 1) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center, rgba(0, 30, 60, 1) 0%, rgba(0, 10, 20, 1) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center, rgba(5, 3, 25, 1) 0%, rgba(0, 0, 0, 1) 100%)",
      topBarColor: "#2e86c1",
      bgStars: "rgba(93, 173, 226, 0.3)",
      bgGrid: "rgba(93, 173, 226, 0.04)",
    },
    layout: {
      panelOrder: ["left", "center", "right"],
      leftWidth: 18,
      centerWidth: 64,
      rightWidth: 18,
      showHeader: true,
      showRunningBar: true,
      prayerCardStyle: "default",
      headerLayout: "logo-left",
      fontSizeScale: "large",
      borderRadiusScale: "rounded",
    },
  },

  // ── 4. Green Mosque ──
  {
    themeKey: "green-mosque",
    name: "Green Mosque",
    isGlobal: true,
    palette: {
      bgPrimary: "#0d2818",
      bgSecondary: "rgba(0, 0, 0, 0.1)",
      bgOverlay: "rgba(0, 0, 0, 0.3)",
      textPrimary: "#e8f5e9",
      textSecondary: "rgba(232, 245, 233, 0.6)",
      textMuted: "rgba(232, 245, 233, 0.35)",
      accentPrimary: "#66bb6a",
      accentSecondary: "#43a047",
      accentMuted: "rgba(102, 187, 106, 0.5)",
      borderColor: "rgba(102, 187, 106, 0.1)",
      borderAccent: "rgba(102, 187, 106, 0.25)",
      fontHeading: "'Poppins', sans-serif",
      fontBody: "'Inter', sans-serif",
      fontArabic: "'Noto Naskh Arabic', serif",
      borderRadius: "8px",
      cardBg: "rgba(232, 245, 233, 0.05)",
      cardBorder: "rgba(102, 187, 106, 0.12)",
      prayerActiveBg: "rgba(102, 187, 106, 0.15)",
      prayerActiveBorder: "rgba(102, 187, 106, 0.5)",
      prayerActiveGlow: "rgba(102, 187, 106, 0.2)",
      headerBg: "rgba(0, 0, 0, 0.2)",
      runningBarBg: "rgba(102, 187, 106, 0.1)",
      runningBarBorder: "rgba(102, 187, 106, 0.3)",
      progressFill: "linear-gradient(90deg, #43a047, #66bb6a)",
      screensaverBg:
        "radial-gradient(ellipse at center, rgba(13, 40, 24, 0.95) 0%, rgba(5, 15, 8, 0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center, rgba(10, 25, 18, 0.97) 0%, rgba(3, 10, 5, 0.99) 100%)",
      moodAdzanBg:
        "radial-gradient(ellipse at center, rgba(50, 40, 5, 1) 0%, rgba(20, 12, 2, 1) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center, rgba(0, 60, 30, 1) 0%, rgba(0, 20, 8, 1) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center, rgba(8, 5, 20, 1) 0%, rgba(0, 0, 0, 1) 100%)",
      topBarColor: "#66bb6a",
      bgStars: "rgba(102, 187, 106, 0.3)",
      bgGrid: "rgba(102, 187, 106, 0.04)",
    },
    layout: {
      panelOrder: ["left", "center", "right"],
      leftWidth: 20,
      centerWidth: 60,
      rightWidth: 20,
      showHeader: true,
      showRunningBar: true,
      prayerCardStyle: "default",
      headerLayout: "logo-left",
      fontSizeScale: "normal",
      borderRadiusScale: "normal",
    },
  },

  // ── 5. Ramadan Theme ──
  {
    themeKey: "ramadan",
    name: "Ramadan",
    isGlobal: true,
    palette: {
      bgPrimary: "#1a1030",
      bgSecondary: "rgba(0, 0, 0, 0.2)",
      bgOverlay: "rgba(0, 0, 0, 0.35)",
      textPrimary: "#faf5e8",
      textSecondary: "rgba(250, 245, 232, 0.6)",
      textMuted: "rgba(250, 245, 232, 0.35)",
      accentPrimary: "#daa520",
      accentSecondary: "#c5941a",
      accentMuted: "rgba(218, 165, 32, 0.5)",
      borderColor: "rgba(218, 165, 32, 0.12)",
      borderAccent: "rgba(218, 165, 32, 0.25)",
      fontHeading: "'Cinzel', serif",
      fontBody: "'Inter', sans-serif",
      fontArabic: "'Noto Naskh Arabic', serif",
      borderRadius: "10px",
      cardBg: "rgba(250, 245, 232, 0.04)",
      cardBorder: "rgba(218, 165, 32, 0.15)",
      prayerActiveBg: "rgba(218, 165, 32, 0.15)",
      prayerActiveBorder: "rgba(218, 165, 32, 0.55)",
      prayerActiveGlow: "rgba(218, 165, 32, 0.3)",
      headerBg: "rgba(0, 0, 0, 0.3)",
      runningBarBg: "rgba(218, 165, 32, 0.12)",
      runningBarBorder: "rgba(218, 165, 32, 0.35)",
      progressFill: "linear-gradient(90deg, #c5941a, #daa520)",
      screensaverBg:
        "radial-gradient(ellipse at center, rgba(26, 16, 48, 0.95) 0%, rgba(8, 5, 15, 0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center, rgba(20, 10, 40, 0.97) 0%, rgba(5, 2, 15, 0.99) 100%)",
      moodAdzanBg:
        "radial-gradient(ellipse at center, rgba(60, 35, 5, 1) 0%, rgba(25, 10, 2, 1) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center, rgba(40, 20, 60, 1) 0%, rgba(10, 5, 20, 1) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center, rgba(15, 5, 35, 1) 0%, rgba(0, 0, 0, 1) 100%)",
      topBarColor: "#daa520",
      bgStars: "rgba(218, 165, 32, 0.35)",
      bgGrid: "rgba(218, 165, 32, 0.05)",
    },
    layout: {
      panelOrder: ["left", "center", "right"],
      leftWidth: 22,
      centerWidth: 56,
      rightWidth: 22,
      showHeader: true,
      showRunningBar: true,
      prayerCardStyle: "ornate",
      headerLayout: "logo-center",
      fontSizeScale: "large",
      borderRadiusScale: "normal",
    },
  },

  // ── 6. Jumat Theme ──
  {
    themeKey: "jumat",
    name: "Jumat",
    isGlobal: true,
    palette: {
      bgPrimary: "#0d1f2d",
      bgSecondary: "rgba(0, 0, 0, 0.2)",
      bgOverlay: "rgba(0, 0, 0, 0.35)",
      textPrimary: "#ecf0f1",
      textSecondary: "rgba(236, 240, 241, 0.6)",
      textMuted: "rgba(236, 240, 241, 0.35)",
      accentPrimary: "#e8c95a",
      accentSecondary: "#d4a843",
      accentMuted: "rgba(232, 201, 90, 0.5)",
      borderColor: "rgba(232, 201, 90, 0.1)",
      borderAccent: "rgba(232, 201, 90, 0.2)",
      fontHeading: "'Scheherazade New', serif",
      fontBody: "'IBM Plex Sans', sans-serif",
      fontArabic: "'Scheherazade New', serif",
      borderRadius: "6px",
      cardBg: "rgba(236, 240, 241, 0.04)",
      cardBorder: "rgba(232, 201, 90, 0.12)",
      prayerActiveBg: "rgba(232, 201, 90, 0.12)",
      prayerActiveBorder: "rgba(232, 201, 90, 0.5)",
      prayerActiveGlow: "rgba(232, 201, 90, 0.2)",
      headerBg: "rgba(0, 0, 0, 0.2)",
      runningBarBg: "rgba(232, 201, 90, 0.1)",
      runningBarBorder: "rgba(232, 201, 90, 0.25)",
      progressFill: "linear-gradient(90deg, #d4a843, #e8c95a)",
      screensaverBg:
        "radial-gradient(ellipse at center, rgba(13, 31, 45, 0.95) 0%, rgba(5, 10, 15, 0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center, rgba(10, 20, 30, 0.97) 0%, rgba(3, 8, 12, 0.99) 100%)",
      moodAdzanBg:
        "radial-gradient(ellipse at center, rgba(55, 35, 5, 1) 0%, rgba(20, 10, 2, 1) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center, rgba(0, 40, 50, 1) 0%, rgba(0, 15, 18, 1) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center, rgba(5, 5, 20, 1) 0%, rgba(0, 0, 0, 1) 100%)",
      topBarColor: "#e8c95a",
      bgStars: "rgba(232, 201, 90, 0.3)",
      bgGrid: "rgba(232, 201, 90, 0.04)",
    },
    layout: {
      panelOrder: ["center", "left", "right"],
      leftWidth: 18,
      centerWidth: 64,
      rightWidth: 18,
      showHeader: true,
      showRunningBar: true,
      prayerCardStyle: "default",
      headerLayout: "logo-center",
      fontSizeScale: "large",
      borderRadiusScale: "sharp",
    },
  },

  // ── 7. Eid Theme ──
  {
    themeKey: "eid",
    name: "Eid",
    isGlobal: true,
    palette: {
      bgPrimary: "#1b0a2e",
      bgSecondary: "rgba(0, 0, 0, 0.15)",
      bgOverlay: "rgba(0, 0, 0, 0.3)",
      textPrimary: "#fdf5e6",
      textSecondary: "rgba(253, 245, 230, 0.6)",
      textMuted: "rgba(253, 245, 230, 0.35)",
      accentPrimary: "#f39c12",
      accentSecondary: "#e67e22",
      accentMuted: "rgba(243, 156, 18, 0.5)",
      borderColor: "rgba(243, 156, 18, 0.1)",
      borderAccent: "rgba(243, 156, 18, 0.2)",
      fontHeading: "'Playfair Display', serif",
      fontBody: "'Inter', sans-serif",
      fontArabic: "'Amiri', serif",
      borderRadius: "14px",
      cardBg: "rgba(253, 245, 230, 0.04)",
      cardBorder: "rgba(243, 156, 18, 0.15)",
      prayerActiveBg: "rgba(243, 156, 18, 0.15)",
      prayerActiveBorder: "rgba(243, 156, 18, 0.5)",
      prayerActiveGlow: "rgba(243, 156, 18, 0.25)",
      headerBg: "rgba(0, 0, 0, 0.25)",
      runningBarBg: "rgba(243, 156, 18, 0.1)",
      runningBarBorder: "rgba(243, 156, 18, 0.3)",
      progressFill: "linear-gradient(90deg, #e67e22, #f39c12)",
      screensaverBg:
        "radial-gradient(ellipse at center, rgba(27, 10, 46, 0.95) 0%, rgba(8, 3, 15, 0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center, rgba(20, 10, 35, 0.97) 0%, rgba(5, 2, 10, 0.99) 100%)",
      moodAdzanBg:
        "radial-gradient(ellipse at center, rgba(60, 35, 5, 1) 0%, rgba(25, 10, 2, 1) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center, rgba(30, 15, 50, 1) 0%, rgba(8, 5, 15, 1) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center, rgba(12, 5, 25, 1) 0%, rgba(0, 0, 0, 1) 100%)",
      topBarColor: "#f39c12",
      bgStars: "rgba(243, 156, 18, 0.35)",
      bgGrid: "rgba(243, 156, 18, 0.05)",
    },
    layout: {
      panelOrder: ["left", "center", "right"],
      leftWidth: 20,
      centerWidth: 60,
      rightWidth: 20,
      showHeader: true,
      showRunningBar: true,
      prayerCardStyle: "ornate",
      headerLayout: "logo-center",
      fontSizeScale: "large",
      borderRadiusScale: "rounded",
    },
  },
];
