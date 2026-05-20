// Konstanta dan helper untuk waktu sholat — dipakai di server dan client

export const PRAYER_ORDER = [
  "subuh",
  "dzuhur",
  "ashar",
  "maghrib",
  "isya",
] as const;

export type PrayerKey = (typeof PRAYER_ORDER)[number];

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  subuh: "SUBUH",
  dzuhur: "DZUHUR",
  ashar: "ASHAR",
  maghrib: "MAGHRIB",
  isya: "ISYA",
};

export const PRAYER_ICONS: Record<PrayerKey, string> = {
  subuh: "🌙",
  dzuhur: "☀️",
  ashar: "🌤️",
  maghrib: "🌅",
  isya: "🌃",
};

// Konversi "HH:MM" atau "HH:MM:SS" ke total menit
export function timeToMinutes(time: string): number {
  const [hh, mm] = time.split(":").map((v) => Number(v));
  return hh * 60 + mm;
}

// Format detik ke "HH : MM : SS"
export function secondsToCountdown(seconds: number): string {
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return `${String(hh).padStart(2, "0")} : ${String(mm).padStart(2, "0")} : ${String(ss).padStart(2, "0")}`;
}

// Konversi kalender Masehi ke Hijriyah
const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi'ul Awal",
  "Rabi'ul Akhir",
  "Jumadil Awal",
  "Jumadil Akhir",
  "Rajab",
  "Sya'ban",
  "Ramadhan",
  "Syawal",
  "Dzulqa'dah",
  "Dzulhijjah",
];

export function toHijriyah(
  year: number,
  month1based: number,
  day: number,
  offset = 0,
): string {
  const a = Math.floor((14 - month1based) / 12);
  const yr = year + 4800 - a;
  const mr = month1based + 12 * a - 3;
  let jdn =
    day +
    Math.floor((153 * mr + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045;
  jdn += offset;
  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hMonth = Math.floor((24 * l3) / 709);
  const hDay = l3 - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;
  return `${hDay} ${HIJRI_MONTHS[hMonth - 1]} ${hYear} H`;
}

// Default slides (ayat Al-Quran) untuk tampilan saat tidak ada slide dari DB
export const DEFAULT_SLIDES = [
  {
    arabic:
      "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ",
    trans:
      '"Dan dirikanlah shalat, tunaikanlah zakat, dan rukuklah beserta orang-orang yang rukuk."',
    src: "QS. Al-Baqarah: 43",
  },
  {
    arabic:
      "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
    trans:
      '"Sesungguhnya shalat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman."',
    src: "QS. An-Nisa: 103",
  },
  {
    arabic: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ",
    trans:
      '"Peliharalah semua shalat dan shalat wustha. Dan laksanakanlah (shalat) karena Allah dengan khusyuk."',
    src: "QS. Al-Baqarah: 238",
  },
];
