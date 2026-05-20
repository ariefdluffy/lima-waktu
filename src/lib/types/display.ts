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

export type DisplayPayload = {
  generatedAt: string;
  device: {
    id: string;
    deviceCode: string;
    name: string;
    orientation: "horizontal" | "vertical";
    layoutMode: "default" | "youtube";
  };
  masjid: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    district: string | null;
    province: string | null;
    timezone: string;
    latitude: string | null;
    longitude: string | null;
    hijriOffset: number;
    logoUrl: string | null;
  };
  schedule: {
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
  runningTexts: { id: number; content: string; speed: number }[];
  slides: {
    id: number;
    title: string | null;
    orderIndex: number;
    fileUrl: string | null;
    fileType: string | null;
  }[];
  jumbotrons: {
    id: number;
    title: string | null;
    content: string | null;
    backgroundUrl: string | null;
  }[];
  youtubeItems: {
    id: number;
    title: string | null;
    youtubeUrl: string;
    orderIndex: number;
  }[];
  events: {
    id: number;
    title: string;
    description: string | null;
    eventDate: string;
    eventTime: string | null;
    countdownEnabled: boolean;
  }[];
};
