# Lima Waktu - Display TV Masjid (MVP)

Project ini menggunakan:

- `SvelteKit` (fullstack)
- `MySQL`
- `Drizzle ORM`
- `Tailwind`

## Setup cepat

1. Install dependency:
   - `npm install`
2. Siapkan `.env.local` (sudah ada di project).
3. Rebuild database lokal (reset + schema + seed):
   - `npm run db:rebuild:local`
4. Jalankan validasi:
   - `npm run check`
   - `npm run build`

## Database scripts

- `npm run db:reset:local` → drop/create database dari `DATABASE_URL`
- `npm run db:push:local` → push schema Drizzle ke MySQL
- `npm run db:seed:local` → isi data awal
- `npm run db:rebuild:local` → reset + push + seed

## Akun seed (development)

> Akun ini untuk development lokal. Ganti password sebelum produksi.

- Superadmin
  - Email: `superadmin@limawaktu.local`
  - Password: `change_me`
- Admin Masjid
  - Email: `admin@masjid.local`
  - Password: `change_me`

## API MVP (Basic Auth)

Saat ini API menggunakan `Authorization: Basic base64(email:password)`.

Endpoint yang sudah tersedia:

- `GET /api/v1/auth/me`
- `GET /api/v1/masjid/profile?masjid_id=`
- `PUT /api/v1/masjid/profile?masjid_id=`
- `GET /api/v1/masjid/running-texts?masjid_id=`
- `POST /api/v1/masjid/running-texts?masjid_id=`
- `GET /api/v1/masjid/devices?masjid_id=`
- `POST /api/v1/masjid/devices?masjid_id=`
- `GET /api/v1/masjid/prayer-schedules?masjid_id=&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/v1/masjid/prayer-schedules?masjid_id=`
- `GET /api/v1/masjid/prayer-corrections?masjid_id=`
- `POST /api/v1/masjid/prayer-corrections?masjid_id=`
- `GET /api/v1/masjid/slides?masjid_id=`
- `POST /api/v1/masjid/slides?masjid_id=`
- `GET /api/v1/masjid/jumbotrons?masjid_id=`
- `POST /api/v1/masjid/jumbotrons?masjid_id=`
- `GET /api/v1/masjid/youtube-items?masjid_id=`
- `POST /api/v1/masjid/youtube-items?masjid_id=`

## Display TV

Route display TV tersedia di:

- `/display/[deviceCode]` — Halaman display TV horizontal full-screen
  - Contoh: `/display/LWTV-001`
  - Tidak memerlukan login
  - Data diambil otomatis dari `/api/v1/display/[deviceCode]`
  - Auto-refresh setiap 60 detik
  - Countdown adzan & iqamah real-time

## API Display (Public)

- `GET /api/v1/display/[deviceCode]` — Data lengkap untuk display TV (jadwal, running text, slides, events)

## API Prayer Overrides

- `GET /api/v1/masjid/prayer-overrides?masjid_id=&date=YYYY-MM-DD`
- `POST /api/v1/masjid/prayer-overrides?masjid_id=`
- `DELETE /api/v1/masjid/prayer-overrides?masjid_id=&id=`

Catatan role:

- `superadmin` wajib kirim `masjid_id`
- `admin_masjid` otomatis pakai masjid miliknya bila `masjid_id` tidak dikirim

## UI/UX saat ini

- Halaman dashboard admin modern minimalis hijau ada di `/`
- Fully responsive untuk smartphone, tablet, laptop
- Mendukung operasi cepat: lihat profil, tambah running text, tambah device, dan simpan jadwal sholat

## Struktur data utama yang sudah disiapkan

- multi-tenant: `masjids`, `masjid_users`, `users`, `roles`, `permissions`
- display: `devices`, `running_texts`, `slides`, `jumbotrons`, `youtube_items`, `themes`, `media_assets`
- jadwal sholat: `prayer_providers`, `prayer_calculation_methods`, `prayer_schedules`, `prayer_corrections`, `prayer_overrides`, `prayer_sync_jobs`, `prayer_provider_logs`, `prayer_schedule_raw_sources`, `iqamah_settings`
- operasional: `events`, `audit_logs`
- billing: `subscriptions`, `invoices`
