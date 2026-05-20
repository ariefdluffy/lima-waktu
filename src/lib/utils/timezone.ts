// Timezone offset dalam jam berdasarkan timezone string
export function getTZOffsetHours(timezone: string): number {
  const offsets: Record<string, number> = {
    "Asia/Jakarta": 7, // WIB
    "Asia/Pontianak": 7, // WIB
    "Asia/Makassar": 8, // WITA
    "Asia/Ujung_Pandang": 8, // WITA (alias)
    "Asia/Jayapura": 9, // WIT
  };
  return offsets[timezone] ?? 7; // default WIB
}

// Ambil komponen waktu dalam timezone tertentu (tanpa bergantung pada timezone browser)
export function getTZParts(date: Date, offsetHours: number) {
  const tzMs = date.getTime() + offsetHours * 60 * 60 * 1000;
  const tz = new Date(tzMs);
  return {
    hours: tz.getUTCHours(),
    minutes: tz.getUTCMinutes(),
    seconds: tz.getUTCSeconds(),
    day: tz.getUTCDay(),
    date: tz.getUTCDate(),
    month: tz.getUTCMonth(),
    year: tz.getUTCFullYear(),
  };
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Format jam:menit:detik dalam timezone tertentu
export function formatTimeTZ(date: Date, offsetHours: number): string {
  const { hours, minutes, seconds } = getTZParts(date, offsetHours);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Format tanggal dalam timezone tertentu
export function formatDateTZ(date: Date, offsetHours: number): string {
  const { day, date: d, month, year } = getTZParts(date, offsetHours);
  return `${DAYS[day]}, ${d} ${MONTHS[month]} ${year} M`;
}

// Dapatkan tanggal YYYY-MM-DD dalam timezone tertentu
export function todayYmdTZ(offsetHours: number, now = new Date()): string {
  const { year, month, date } = getTZParts(now, offsetHours);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}
