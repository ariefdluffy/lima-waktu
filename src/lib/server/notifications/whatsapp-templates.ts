export type DisplayOfflineTemplateInput = {
  masjidName: string;
  deviceName: string;
  lastSeenAt?: string;
};

export type SubscriptionReminderTemplateInput = {
  masjidName: string;
  packageName: string;
  expiresAt: string;
  amount: string;
};

export type PrayerSyncFailedTemplateInput = {
  masjidName: string;
  providerName: string;
  failedAt: string;
  fallbackUsed?: string;
};

export function displayOfflineMessage(input: DisplayOfflineTemplateInput) {
  return [
    `Display TV ${input.masjidName} terdeteksi offline.`,
    `Perangkat: ${input.deviceName}`,
    input.lastSeenAt ? `Terakhir online: ${input.lastSeenAt}` : undefined,
    'Silakan cek koneksi internet, listrik, atau perangkat TV.'
  ]
    .filter(Boolean)
    .join('\n');
}

export function subscriptionReminderMessage(input: SubscriptionReminderTemplateInput) {
  return [
    `Paket Lima Waktu untuk ${input.masjidName} akan segera berakhir.`,
    `Paket: ${input.packageName}`,
    `Masa aktif sampai: ${input.expiresAt}`,
    `Biaya perpanjangan: ${input.amount}`,
    'Silakan lakukan perpanjangan agar Display TV tetap aktif.'
  ].join('\n');
}

export function prayerSyncFailedMessage(input: PrayerSyncFailedTemplateInput) {
  return [
    `Sinkronisasi jadwal sholat ${input.masjidName} gagal.`,
    `Provider: ${input.providerName}`,
    `Waktu gagal: ${input.failedAt}`,
    input.fallbackUsed ? `Fallback digunakan: ${input.fallbackUsed}` : 'Sistem akan menggunakan cache jadwal terakhir jika tersedia.',
    'Mohon cek konfigurasi provider/lokasi jadwal sholat.'
  ]
    .filter(Boolean)
    .join('\n');
}
