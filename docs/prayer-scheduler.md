# Prayer Scheduler

Dokumentasi mekanisme sinkronisasi jadwal sholat di project Lima Waktu.

---

## Status

> **⚠️ Scheduler otomatis saat ini DIMATIKAN sementara.**
> Dimatikan pada: 2026-05-24
> Alasan: investigasi error sync di production (MyQuran HTTP 400, display hang).

---

## Dua Mekanisme Pengisian Jadwal

### 1. Otomatis — PrayerScheduler (saat ini nonaktif)

Scheduler berjalan di background setiap 15 menit sejak server start.

**File terkait:**
- `src/hooks.server.ts` — tempat scheduler dijalankan saat server start
- `src/lib/server/prayer/scheduler.ts` — logika interval dan guard `isRunning`
- `src/lib/server/prayer/sync.ts` — implementasi `syncAllMasjids()`

**Cara kerja:**
1. Baca `globalPrayerConfig` dari DB (provider, method, API key)
2. Ambil semua masjid aktif (`is_active = 1`)
3. Untuk setiap masjid, fetch jadwal 7 hari ke depan (hari ini + H+6)
4. Simpan ke tabel `prayer_schedules` (upsert — skip jika `is_manual_override = 1`)
5. Simpan raw response ke `prayer_schedule_raw_sources` (upsert)
6. Invalidate in-memory cache untuk tanggal yang diupdate

**Cara mengaktifkan kembali:**

Buka `src/hooks.server.ts`, uncomment baris berikut:

```ts
import { startPrayerScheduler } from "$lib/server/prayer/scheduler";

// Jalankan cron job prayer scheduler saat server start
try {
  startPrayerScheduler();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("[Hooks] Failed to start prayer scheduler:", msg);
}
```

Dan hapus/comment baris pengganti yang ada sekarang.

---

### 2. Manual — Bulk Import oleh Admin

Admin dapat mengambil jadwal secara manual melalui `/admin?section=schedule`.

**File terkait:**
- `src/routes/admin/+page.svelte` — UI bulk import (tab "Bulk")
- `src/routes/api/v1/prayer-fetch/+server.ts` — API endpoint fetch jadwal
- `src/routes/admin/+page.server.ts` — action `bulkImportPrayerSchedule`

**Cara kerja:**
1. Admin pilih bulan dan tahun
2. Klik "Ambil Jadwal" — frontend hit `/api/v1/prayer-fetch?action=bulk`
3. Untuk provider **Aladhan**: satu request ke endpoint `/calendar/{year}/{month}` (efisien, 1 request = 1 bulan)
4. Untuk provider **MyQuran**: satu request ke endpoint `/sholat/jadwal/{cityId}/{year}/{month}`
5. Preview jadwal ditampilkan, admin klik "Simpan" untuk menyimpan ke DB

---

## Provider yang Didukung

| Provider | Key | Endpoint | Parameter |
|----------|-----|----------|-----------|
| Aladhan | `aladhan` | `https://api.aladhan.com/v1` | latitude, longitude, timezone, method |
| MyQuran | `myquran` | `https://api.myquran.com/v2` | city ID (bukan lat/lng) |
| Generic | `generic` | custom baseUrl | lat/lng atau placeholder `{date}`, `{latitude}`, dll |

**Catatan MyQuran:** Field "Method Code" di konfigurasi global harus diisi dengan **city ID** MyQuran (3+ digit angka), bukan kode metode Aladhan. Cek daftar city ID di:
`https://api.myquran.com/v2/sholat/kota/semua`

---

## Tabel Database

| Tabel | Fungsi |
|-------|--------|
| `prayer_schedules` | Jadwal final yang dipakai display (dengan koreksi & override) |
| `prayer_schedule_raw_sources` | Raw response dari provider (untuk audit/debug) |
| `prayer_sync_jobs` | Log setiap job sync per masjid per tanggal |
| `prayer_provider_logs` | Log HTTP request/response ke provider |
| `prayer_corrections` | Koreksi offset menit per waktu sholat (aktif per rentang tanggal) |
| `prayer_overrides` | Override manual satu waktu sholat untuk tanggal tertentu |
| `global_prayer_config` | Konfigurasi global: provider, method, timezone default |

---

## Fitur Hapus Jadwal (Admin)

Tersedia di `/admin?section=schedule`:

- **Hapus per baris** — hapus jadwal satu tanggal, dengan konfirmasi dialog
- **Reset Semua** — hapus seluruh jadwal masjid, dengan konfirmasi dialog

Setelah reset, jadwal perlu diisi ulang secara manual (bulk import) atau dengan mengaktifkan kembali scheduler otomatis.

---

## Known Issues & Perbaikan (2026-05-24)

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `MyQuran HTTP 400` | `methodCode = "20"` (kode Aladhan) dipakai sebagai city ID MyQuran | Validasi di `provider.ts` — tolak jika bukan 3+ digit angka |
| Display public hang | Bulk fetch 31 request sequential (~31 detik) memblokir koneksi | Ganti ke endpoint `/calendar` Aladhan (1 request/bulan) |
| Timezone bug pada `scheduleDate` | `dateYmd as unknown as Date` menyebabkan MySQL konversi UTC, tanggal off-by-one | Ganti semua ke `sql\`${dateYmd}\`` di `sync.ts`, `resolver.ts`, `admin/+page.server.ts` |
| Duplicate raw source insert | Tidak ada upsert, setiap sync insert baru | Tambah check existing sebelum insert di `sync.ts` |
| Error log tidak detail | Catch block tidak log ke console | Tambah `console.error` dan `console.warn` per tanggal di `sync.ts` |
