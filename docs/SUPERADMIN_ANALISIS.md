# Analisis & Rekomendasi Menu Superadmin Lima Waktu

> **Dibuat:** 2026-05-23
> **Berdasarkan:** `DISPLAY_TV_MASJID_SPEC.md` (Section 7) vs Implementasi Aktual di `/superadmin`

---

## 1. Ringkasan Status

| Area | Status | Keterangan |
|------|--------|------------|
| **Halaman superadmin** | ⚠️ 1 halaman all-in-one | Belum ada sidebar/routing multi-halaman |
| **Dashboard stats** | ⚠️ Sebagian | Hanya count masjid, users, subscriptions — tanpa display stats atau revenue |
| **7.2 Manajemen Masjid** | ⚠️ Sebagian | Create ada, edit/hapus/suspend tidak |
| **7.3 Manajemen Admin** | ❌ Hampir tidak ada | Tidak bisa manage admin masjid |
| **7.4 Paket & Pembayaran** | ⚠️ Sebagian | Create subscription ada, invoice/plan CRUD tidak |
| **7.5 Template Global** | ❌ Tidak ada | Tidak ada UI untuk global theme/template |
| **7.6 Konten Global** | ❌ Tidak ada | Tidak ada UI untuk konten platform-wide |
| **7.7 Monitoring Sistem** | ❌ Tidak ada | Tidak ada monitoring display/health |
| **7.8 Konfigurasi Global Jadwal** | ❌ Tidak ada | Tidak ada UI untuk config provider jadwal sholat |

### Tabel DB yang sudah siap tapi belum ada UI superadmin

| Tabel | Untuk Menu | Kolom Penting |
|-------|-----------|---------------|
| `invoices` | 7.4 | subscriptionId, invoiceNo, amount, status (draft/pending/paid/failed/cancelled), dueDate, paidAt, paymentMethod, externalRef |
| `pricingPlans` | 7.4 | name, badge, priceMonthly, priceYearly, priceNote, featuresJson, isHighlight, isActive, sortOrder |
| `auditLogs` | 7.3 | masjidId, userId, action, entity, entityId, createdAt |
| `prayerProviders` | 7.8 | providerKey, name, baseUrl, isActive |
| `prayerProviderLogs` | 7.7, 7.8 | providerId, requestPath, responseStatus, responseBody, errorMessage |
| `prayerCalculationMethods` | 7.8 | providerId, methodCode, name |
| `themes` | 7.5 | themeKey, name, paletteJson, layoutJson, isGlobal |
| `devices` (field heartbeat) | 7.7 | lastHeartbeatAt, status (online/offline) |

---

## 2. Rekomendasi Arsitektur Routing

Ganti dari 1 halaman monolithic → multi-halaman dengan layout bersama.

```
/superadmin/
├── +layout.svelte          ← Sidebar + header, child route render
├── +layout.server.ts       ← Load user session + role check
├── +page.svelte            ← Redirect ke /superadmin/dashboard
│
├── dashboard/
│   └── +page.svelte        ← 7.1 Dashboard
│
├── masjids/
│   ├── +page.svelte        ← 7.2 Daftar masjid + create
│   └── [id]/
│       └── +page.svelte    ← 7.2 Detail/edit/suspend masjid
│
├── admins/
│   └── +page.svelte        ← 7.3 Manajemen admin masjid
│
├── subscriptions/
│   ├── +page.svelte        ← 7.4 Paket & subscription list
│   ├── plans/
│   │   └── +page.svelte    ← 7.4 CRUD pricing plans
│   └── invoices/
│       └── +page.svelte    ← 7.4 Daftar invoice
│
├── templates/
│   └── +page.svelte        ← 7.5 Template global
│
├── konten-global/
│   └── +page.svelte        ← 7.6 Konten global platform
│
├── monitoring/
│   └── +page.svelte        ← 7.7 Monitoring sistem & device
│
└── jadwal-global/
    └── +page.svelte        ← 7.8 Konfigurasi global jadwal sholat
```

---

## 3. Detail Rekomendasi per Menu

### 3.1 — Dashboard Superadmin (`/superadmin/dashboard`)

**Goal:** Ringkasan visual platform untuk superadmin.

**Komponen:**

```
┌──────────────────────────────────────────────┐
│  Kontrol Pusat Platform Lima Waktu           │
│  Kelola tenant masjid, user, subscription    │
├──────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───┐│
│ │ Masjid   │ │ Display  │ │ Admin    │ │ ...││
│ │ 12       │ │ 8/10 on  │ │ 15       │ │    ││
│ └──────────┘ └──────────┘ └──────────┘ └───┘│
│ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ Subsc    │ │ Revenue  │ │ Revenue  │       │
│ │ Active:8 │ │ Bln: Rp  │ │ Thn: Rp  │       │
│ └──────────┘ └──────────┘ └──────────┘       │
├──────────────────────────────────────────────┤
│ Grafik: Pendapatan 6 bulan terakhir          │
│ Grafik: Display online/offline               │
├──────────────────────────────────────────────┤
│ Subscription upcoming expired (7 hari)       │
│ Device offline terakhir                      │
└──────────────────────────────────────────────┘
```

**Data yang perlu di-load:**

```typescript
interface DashboardData {
  // Stats
  totalMasjid: number;
  masjidActive: number;
  masjidSuspended: number;
  totalAdmin: number;
  totalDisplay: number;
  displayOnline: number;
  displayOffline: number;

  // Subscription
  subscriptionActive: number;
  subscriptionExpired: number;
  subscriptionTrial: number;
  subscriptionGrace: number;

  // Revenue
  revenueMonthly: number;
  revenueYearly: number;

  // Lists (limited)
  recentMasjids: Masjid[];
  recentSubscriptions: Subscription[];
  offlineDevices: Device[];
  expiringSoon: Subscription[]; // next 7 days
}
```

---

### 3.2 — Manajemen Masjid/Tenant (`/superadmin/masjids`)

#### Daftar Masjid (`/superadmin/masjids`)

```
┌──────────────────────────────────────────────┐
│  Manajemen Masjid                [+ Tambah]  │
├──────────────────────────────────────────────┤
│ 🔍 [Search...]     [Filter: All/Suspend]     │
├──────────┬────────┬──────┬──────┬──────┬─────┤
│ Nama     │ Kota   │ TZ   │ Subsc│ Disp │ Aksi│
│──────────┼────────┼──────┼──────┼──────┼─────┤
│ Masjid A │ Jakarta│ WIB  │ Active│ 3/3  │ ✎ ⏸ │
│ Masjid B │ Surab.│ WIB  │ Expire│ 0/1  │ ✎ ▶ │
│ ...      │        │      │       │      │     │
└──────────┴────────┴──────┴──────┴──────┴─────┘
┌──────────────────────────────────────────────┐
│  Pagination: ◀ 1 2 3 ... 10 ▶               │
└──────────────────────────────────────────────┘
```

**Fitur:**
- Table/list semua masjid dengan search + filter status
- Kolom: nama, kota, timezone, subscription status, device count (online/total)
- Aksi per baris: edit, suspend/activate, reset device, delete
- Pagination + search by name/city

#### Tambah Masjid (modal atau halaman terpisah)

Sudah ada di halaman saat ini — pindahkan ke modal/dialog.

**Field:**
- Nama masjid (required)
- Kota, Provinsi, Alamat
- Timezone (WIB/WITA/WIT)
- Admin user (dropdown dari users)
- Paket awal (optional — langsung assign subscription)

#### Detail/Edit Masjid (`/superadmin/masjids/[id]`)

```
┌──────────────────────────────────────────────┐
│  Masjid A                      [Suspend] [Hps]│
├──────────────────────────────────────────────┤
│ Info Umum                                    │
│ ┌──────────┬──────────────────────────────┐  │
│ │ Nama     │ [______]                     │  │
│ │ Kota     │ [______]   Provinsi [______] │  │
│ │ Alamat   │ [textarea]                   │  │
│ │ Timezone │ [WIB ▼]                      │  │
│ │ Status   │ 🟢 Active                    │  │
│ └──────────┴──────────────────────────────┘  │
│                                              │
│ Admin Masjid                                 │
│ ┌──────────┬──────────┬──────────┬────────┐  │
│ │ Nama     │ Email    │ Role     │ Aksi   │  │
│ │ Admin A  │ a@b.com  │ owner    │ [Reset]│  │
│ │ Admin B  │ b@b.com  │ operator │ [Hapus]│  │
│ │                              [+Tambah] │  │
│ └──────────┴──────────┴──────────┴────────┘  │
│                                              │
│ Devices                                      │
│ ┌──────────┬──────────┬────────┬──────────┐  │
│ │ Nama     │ Kode     │ Status │ Aksi     │  │
│ │ TV Utama │ ABC123   │ 🟢 On  │ [Reset]  │  │
│ └──────────┴──────────┴────────┴──────────┘  │
│                                              │
│ Subscription Saat Ini                        │
│ ┌──────────┬──────────┬──────────┬────────┐  │
│ │ Paket    │ Status   │ Berakhir │ Aksi   │  │
│ │ Masjid   │ Active   │ 01-12-26 │ [Edit] │  │
│ └──────────┴──────────┴──────────┴────────┘  │
│                                              │
│ Konfigurasi Masjid                           │
│ ┌─────────────────────────────────────────┐  │
│ │ Jadwal Sholat Provider: [Internal ▼]    │  │
│ │ Metode Hisab: [Kemenag ▼]              │  │
│ │ Hijri Offset: [+0]                     │  │
│ │ Weather Location: Lat:__ Lon:__        │  │
│ └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Aksi tambahan:**
- Reset semua perangkat masjid (hapus pairing)
- Lihat audit log masjid
- Suspend → semua display mati, admin tidak bisa login
- Hapus masjid (soft delete atau hard delete dengan konfirmasi)

#### Actions Server

```typescript
export const actions = {
  createMasjid,       // ✅ sudah ada
  updateMasjid,       // ➕ baru
  deleteMasjid,       // ➕ baru (soft delete dengan isActive=0)
  suspendMasjid,      // ➕ baru
  activateMasjid,     // ➕ baru
  resetMasjidDevices, // ➕ baru
  assignSubscription, // ➕ baru (pilih dari subscription yg sudah ada)
};
```

---

### 3.3 — Manajemen Admin Masjid (`/superadmin/admins`)

**Goal:** CRUD admin untuk semua masjid, reset password, aktif/nonaktif.

```
┌──────────────────────────────────────────────┐
│  Manajemen Admin Masjid          [+ Tambah]  │
├──────────────────────────────────────────────┤
│ 🔍 [Search nama/email...]                    │
├──────────┬────────────┬──────────┬───────────┤
│ Nama     │ Email      │ Masjid   │ Status    │
│──────────┼────────────┼──────────┼───────────┤
│ Admin A  │ a@b.com    │ Masjid A │ 🟢 Active │
│ Admin B  │ b@b.com    │ Masjid B │ 🔴 Inact. │
└──────────┴────────────┴──────────┴───────────┘
┌──────────────────────────────────────────────┐
│  Pagination: ◀ 1 2 3 ... ▶                  │
└──────────────────────────────────────────────┘
```

**Fitur:**

#### Tambah Admin Masjid (modal)

| Field | Tipe | Required |
|-------|------|----------|
| Nama lengkap | text | ✅ |
| Email | email | ✅ |
| Password | password (generate/input) | ✅ |
| No. HP | text | ❌ |
| Masjid | dropdown masjid list | ✅ |
| Role | dropdown: owner / operator / viewer | ✅ |

#### Aksi per Admin

| Aksi | Keterangan |
|------|-----------|
| Edit profile | Nama, HP, email |
| Reset password | Generate random + tampilkan sekali |
| Aktifkan/Nonaktif | Toggle `isActive` |
| Lihat audit log | Redirect ke log aktivitas user tsb |
| Hapus | Soft delete atau unlink dari masjid |

#### Audit Log

```
┌──────────────────────────────────────────────┐
│  Audit Log — Admin A (admin@email.com)       │
├──────────┬──────────┬──────────┬─────────────┤
│ Waktu    │ Aksi     │ Entity   │ Detail      │
│──────────┼──────────┼──────────┼─────────────┤
│ 23-05-26 │ UPDATE   │ Jadwal   │ Subuh 04:30 │
│ 23-05-25 │ CREATE   │ Slide    │ "Kajian"    │
│ 23-05-24 │ LOGIN    │ Session  │ IP 192...   │
└──────────┴──────────┴──────────┴─────────────┘
┌──────────────────────────────────────────────┐
│  Filter: [Semua Aksi ▼] [7 Hari ▼] [Cari...]│
└──────────────────────────────────────────────┘
```

**Data dari tabel `auditLogs`** — sudah ada di schema.

#### Actions Server

```typescript
export const actions = {
  createAdmin,         // ➕ insert user + userRoles (masjid_admin role) + masjidUsers
  updateAdmin,         // ➕ update nama/email/phone
  resetAdminPassword,  // ➕ update passwordHash, return raw password sekali
  toggleAdminActive,   // ➕ toggle isActive
  deleteAdmin,         // ➕ soft delete / unlink
};
```

---

### 3.4 — Manajemen Paket & Pembayaran (`/superadmin/subscriptions`)

#### Pricing Plans (`/superadmin/subscriptions/plans`)

```
┌──────────────────────────────────────────────┐
│  Paket Harga                    [+ Tambah]   │
├──────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌────────┐│
│ │ 🟢 Gratis    │ │ ⭐ Masjid    │ │ 🏆 Pro ││
│ │ Rp 0/bln    │ │ Rp 50rb/bln  │ │ Rp...  ││
│ │ - 1 device  │ │ - 3 device   │ │ - ∞    ││
│ │ [Edit] [Hps]│ │ [Edit] [Hps] │ │ ...    ││
│ └──────────────┘ └──────────────┘ └────────┘│
│ ⚡ Highlight: tandai paket yg ditonjolkan    │
└──────────────────────────────────────────────┘
```

**Data dari tabel `pricingPlans`** — sudah ada di schema.

**Field form plan:**
- Nama paket, badge (label seperti "Populer", "Best Value")
- Harga bulanan, harga tahunan, catatan harga
- Fitur (JSON array of strings) — ditampilkan sebagai checklist
- CTA label & href
- Is highlight (tandai sebagai paket unggulan)
- Sort order, is active

#### Subscriptions List (`/superadmin/subscriptions`)

Sama seperti tabel subscription yg sudah ada, tapi ditambah:

| Kolom Tambahan | Sumber |
|----------------|--------|
| Nama masjid | JOIN masjids |
| Sisa hari | `DATEDIFF(end_date, NOW())` |
| Invoice terakhir | JOIN invoices |
| Aksi: edit, cancel, regenerate invoice | ➕ baru |

#### Invoices (`/superadmin/subscriptions/invoices`)

```
┌──────────────────────────────────────────────┐
│  Invoices                                     │
├──────────┬────────┬────────┬───────┬─────────┤
│ No.Inv   │ Masjid│ Amount │ Status│ Tanggal  │
│──────────┼────────┼────────┼───────┼─────────┤
│ INV-001  │ Msk A  │Rp50rb  │ Paid  │ 01-05-26│
│ INV-002  │ Msk B  │Rp50rb  │ Pending│ 01-06-26│
└──────────┴────────┴────────┴───────┴─────────┘
┌──────────────────────────────────────────────┐
│  Filter: [Semua Status ▼] [Masjid ▼]         │
└──────────────────────────────────────────────┘
```

**Fitur:**
- Generate invoice manual untuk subscription
- Tandai paid / failed / cancelled
- Lihat riwayat pembayaran per masjid

#### Actions Server

```typescript
export const actions = {
  // Pricing Plans
  createPlan,         // ➕ insert pricingPlans
  updatePlan,         // ➕ update pricingPlans
  deletePlan,         // ➕ soft delete (isActive=0)

  // Subscriptions
  createSubscription, // ✅ sudah ada
  updateSubscription, // ➕ ubah status, paket, dll
  cancelSubscription, // ➕ set status = cancelled
  regenerateInvoice,  // ➕ insert invoice baru

  // Invoices
  markInvoicePaid,    // ➕ update status + paidAt
  markInvoiceFailed,  // ➕ update status
};
```

---

### 3.5 — Manajemen Template Global (`/superadmin/templates`)

**Goal:** Upload, preview, dan assign template tema ke paket tertentu.

```
┌──────────────────────────────────────────────┐
│  Template Global              [+ Upload Baru]│
├──────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ 🖼️      │ │ 🖼️      │ │ 🖼️      │      │
│ │ Tema Hija│ │ Tema Biru│ │ Tema Emas│      │
│ │ ❤️ Free │ │ 💎 Premium│ │ 💎 Premium│   │
│ │ [Preview]│ │ [Preview]│ │ [Preview]│      │
│ │ [Edit]   │ │ [Edit]   │ │ [Edit]   │      │
│ └──────────┘ └──────────┘ └──────────┘      │
│                                              │
│ ⚙️ Assign ke Paket:                         │
│   ☑ Gratis — Tema Hijau                     │
│   ☑ Masjid — Tema Hijau, Biru               │
│   ☐ Pro — Semua                             │
└──────────────────────────────────────────────┘
```

**Detail:**

| Field | Tipe | Keterangan |
|-------|------|-----------|
| themeKey | varchar(64) | unique identifier |
| name | varchar(120) | Nama tampilan |
| paletteJson | json | Warna-warna tema |
| layoutJson | json | Layout config |
| isGlobal | int(1) | 1 = bisa dipakai semua masjid |
| isPremium | int(1) | **field baru** — 0=free, 1=premium |
| assignedPlans | json | **field baru** — array pricingPlan IDs |
| previewImage | varchar(255) | **field baru** — thumbnail/screenshot |
| fileUpload | file | **field baru** — zip template |


**Actions:**
```typescript
uploadTemplate;      // upload file zip template + parse config
updateTemplate;      // edit nama, tag premium/free
deleteTemplate;      // soft delete
assignToPlans;       // hubungkan template ke pricing plan tertentu
previewTemplate;     // render preview (iframe atau screenshot)
```

---

### 3.6 — Manajemen Konten Global (`/superadmin/konten-global`)

**Goal:** Konten yang bersifat platform-wide, bukan per masjid.

```
┌──────────────────────────────────────────────┐
│  Konten Global                               │
├──────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐         │
│ │ 📢 Pengumuman │ │ 🕌 Event Islam│         │
│ │ - Platform    │ │ - Idul Fitri  │         │
│ │ Belum ada     │ │ - Maulid      │         │
│ │ [+Tambah]     │ │ [+Tambah]    │         │
│ └───────────────┘ └───────────────┘         │
│                                              │
│ ┌───────────────┐ ┌───────────────┐         │
│ │ 🎵 Audio Adzan│ │ 🖼️ Background │         │
│ │ - 3 files     │ │ - 10 gambar   │         │
│ │ [+Upload]     │ │ [+Upload]    │         │
│ └───────────────┘ └───────────────┘         │
└──────────────────────────────────────────────┘
```

#### 3.6.1 Pengumuman Platform

Tabel baru: `platformAnnouncements`

| Field | Tipe | Keterangan |
|-------|------|-----------|
| id | bigint PK | |
| title | varchar(180) | Judul pengumuman |
| content | text | Isi pengumuman |
| severity | enum(info/warning/critical) | Tingkat urgensi |
| targetAudience | enum(all/admins/superadmins) | Siapa yang lihat |
| startAt | datetime | Mulai tampil |
| endAt | datetime | Berakhir tampil |
| isActive | int(1) | |

Ditampilkan di: dashboard admin (banner di atas), login page.

#### 3.6.2 Template Event Hari Besar Islam

Tabel baru: `holidayTemplates`

| Field | Tipe |
|-------|------|
| id | bigint PK |
| name | varchar(120) |
| eventType | varchar(64) — misal "idul_fitri", "maulid", "ramadhan" |
| slideConfigJson | json — konfigurasi slide khusus event |
| paletteJson | json |
| isActive | int(1) |

Admin masjid bisa memilih template ini saat membuat event.

#### 3.6.3 Library Audio Adzan

Gunakan tabel `mediaAssets` dengan kolom baru `assetScope` = "global".

| Field | Nilai |
|-------|-------|
| masjidId | NULL (global) |
| fileType | "audio" (tambah enum value) |
| fileUrl | path mp3 |
| title | "Adzan Subuh - Misyari Rasyid" |
| assetScope | "global" (field baru) |
| tags | json — ["adzan", "subuh", "misyari"] (field baru) |

Atau tabel baru: `globalAudioLibrary`

#### 3.6.4 Library Background Islami

Sama seperti audio, menggunakan `mediaAssets` dengan `assetScope = "global"` dan `fileType = "image"`.

---

### 3.7 — Monitoring Sistem (`/superadmin/monitoring`)

**Goal:** Pantau kesehatan server, device, dan layanan.

```
┌──────────────────────────────────────────────┐
│  Monitoring Sistem                           │
├──────────────────────────────────────────────┤
│ Server Health                                │
│ ┌───────────┐ ┌───────────┐ ┌──────────────┐│
│ │ 🟢 Status │ │ CPU: 23%  │ │ RAM: 1.2/4GB ││
│ │ OK        │ │ Disk: 45% │ │ Uptime: 12d  ││
│ └───────────┘ └───────────┘ └──────────────┘│
│                                              │
│ Services                                     │
│ ┌──────────┬──────┬──────────┬─────────────┐ │
│ │ Service  │ Status│ Response│ Last Check  │ │
│ │ DB       │ 🟢   │ 12ms    │ 1m ago      │ │
│ │ API Jadwal│ 🟢   │ 234ms   │ 5m ago      │ │
│ │ Storage  │ 🟢   │ -       │ 10m ago     │ │
│ └──────────┴──────┴──────────┴─────────────┘ │
│                                              │
│ Device Heartbeat (10 offline terbaru)        │
│ ┌──────────┬──────────┬──────────┬──────────┐│
│ │ Masjid   │ Device   │ Offline  │ Durasi   ││
│ │ Masjid A │ TV Depan │ 08:00    │ 2 jam    ││
│ │ Masjid B │ TV Samping│ 09:00   │ 1 jam    ││
│ └──────────┴──────────┴──────────┴──────────┘│
│                                              │
│ Prayer Provider Logs (10 error terbaru)      │
│ ┌──────────┬──────────┬──────────┬──────────┐│
│ │ Provider │ Waktu    │ Status   │ Error    ││
│ │ Kemenag  │ 08:00    │ 500      │ Timeout  ││
│ └──────────┴──────────┴──────────┴──────────┘│
└──────────────────────────────────────────────┘
```

#### Implementasi

**Server Health:**
- Endpoint `/api/health` — return status DB (query `SELECT 1`), uptime, CPU/memori (dari `process` atau package `systeminformation`)
- Storage: hitung total file di folder uploads

**Device Heartbeat:**
- Field `lastHeartbeatAt` di tabel `devices` — sudah ada di schema
- Filter: `WHERE lastHeartbeatAt < NOW() - INTERVAL 5 MINUTE` → offline
- Tampilkan counter online/offline di dashboard

**Provider Logs:**
- Tabel `prayerProviderLogs` sudah ada
- Tampilkan error terakhir, success rate

**Queue Jobs:**
- Tabel `prayerSyncJobs` sudah ada
- Tampilkan antrian pending/running/failed

#### Actions

```typescript
export const actions = {
  refreshServerStatus, // ➕ panggil /api/health + simpan cache
  clearErrorLogs,      // ➕ hapus log lama (opsional)
  retryFailedSync,     // ➕ retry prayer sync job
};
```

---

### 3.8 — Konfigurasi Global Jadwal Sholat (`/superadmin/jadwal-global`)

**Goal:** Superadmin mengontrol sumber jadwal sholat untuk seluruh platform.

```
┌──────────────────────────────────────────────┐
│  Konfigurasi Global Jadwal Sholat            │
├──────────────────────────────────────────────┤
│ Provider Jadwal Sholat                       │
│ ┌──────────┬──────────┬──────────┬─────────┐ │
│ │ Provider │ Base URL │ Active   │ Priority│ │
│ │ Kemenag  │ https... │ 🟢 Yes   │ 1       │ │
│ │ Aladhan  │ https... │ 🟢 Yes   │ 2       │ │
│ │ Manual   │ -        │ 🟢 Yes   │ 3       │ │
│ │                              [+Tambah]  │ │
│ └──────────┴──────────┴──────────┴─────────┘ │
│                                              │
│ ⚙️ Konfigurasi Global                       │
│ ┌──────────────────────────────────────────┐ │
│ │ Provider Utama: [Kemenag ▼]             │ │
│ │ Provider Cadangan: [Aladhan ▼]          │ │
│ │ Metode Hisab Default: [Kemenag ▼]       │ │
│ │ Timezone Default: [Asia/Jakarta ▼]      │ │
│ │                                          │ │
│ │ API Key Provider:                        │ │
│ │ [___________________________]            │ │
│ │                                          │ │
│ │ Sync Jadwal Otomatis: [Setiap Hari ▼]   │ │
│ │ Sync Time: [03:00] WIB                   │ │
│ │                                          │ │
│ │ ☑ Kunci provider agar tidak bisa diubah  │ │
│ │    oleh admin masjid                      │ │
│ │ ☑ Kunci metode hisab agar tidak bisa     │ │
│ │    diubah oleh admin masjid               │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ 🔄 Aksi Massal                              │
│ ┌──────────────────────────────────────────┐ │
│ │ [Refresh Semua Masjid]                    │ │
│ │ [Refresh Masjid Tertentu...] ▼           │ │
│ │                                          │ │
│ │ Log Sinkronisasi (10 error terakhir)     │ │
│ │ ┌────────┬──────────┬─────────────────┐  │ │
│ │ │ Waktu  │ Masjid   │ Error           │  │ │
│ │ │ 08:00  │ Masjid A │ Connection fail │  │ │
│ │ └────────┴──────────┴─────────────────┘  │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

#### Data yang digunakan

**Tabel existing:**
- `prayerProviders` — daftar provider (Kemenag, Aladhan, dll)
- `prayerProviderLogs` — log request/response
- `prayerCalculationMethods` — metode hisab per provider
- `prayerSyncJobs` — status sync job

**Tabel baru: `globalPrayerConfig`**

| Field | Tipe | Default | Keterangan |
|-------|------|---------|-----------|
| id | int PK | 1 | Singleton row |
| primaryProviderId | bigint FK | | Provider utama |
| fallbackProviderId | bigint FK | null | Provider cadangan |
| defaultMethodId | bigint FK | | Metode hisab default |
| defaultTimezone | varchar(64) | Asia/Jakarta | |
| apiKey | varchar(255) | null | API key provider |
| syncFrequency | enum(daily/weekly/manual) | daily | |
| syncTime | time | 03:00:00 | Jam sync otomatis |
| lockProvider | int(1) | 0 | Kunci agar admin tidak bisa ganti |
| lockMethod | int(1) | 0 | Kunci agar admin tidak bisa ganti |

#### Actions

```typescript
export const actions = {
  createProvider,         // ➕ insert prayerProviders
  updateProvider,         // ➕ update baseUrl, isActive
  deleteProvider,         // ➕ soft delete
  setProviderOrder,       // ➕ urutan prioritas

  updateGlobalConfig,     // ➕ update globalPrayerConfig
  refreshAllMasjids,      // ➕ trigger sync untuk semua masjid
  refreshSelectedMasjid,  // ➕ trigger sync untuk 1 masjid
  clearProviderLogs,      // ➕ hapus log lama
};
```

---

## 4. Tabel Database — Ringkasan Kesiapan

| Tabel | Status | Untuk Menu | Butuh Migrasi? |
|-------|--------|-----------|----------------|
| `masjids` | ✅ Ada | 7.2 | Tidak |
| `masjidUsers` | ✅ Ada | 7.2, 7.3 | Tidak |
| `users` | ✅ Ada | 7.3 | Tidak |
| `userRoles` | ✅ Ada | 7.3 | Tidak |
| `roles` | ✅ Ada | 7.3 | Tidak |
| `subscriptions` | ✅ Ada | 7.4 | Tidak |
| `invoices` | ✅ Ada | 7.4 | Tidak |
| `pricingPlans` | ✅ Ada | 7.4 | Tidak |
| `auditLogs` | ✅ Ada | 7.3, 7.7 | Tidak |
| `themes` | ✅ Ada | 7.5 | Tidak |
| `prayerProviders` | ✅ Ada | 7.8 | Tidak |
| `prayerProviderLogs` | ✅ Ada | 7.7, 7.8 | Tidak |
| `prayerCalculationMethods` | ✅ Ada | 7.8 | Tidak |
| `prayerSyncJobs` | ✅ Ada | 7.7, 7.8 | Tidak |
| `devices` (field `lastHeartbeatAt`) | ✅ Ada | 7.7 | Tidak |
| `mediaAssets` | ✅ Ada | 7.6 | Tidak |
| **`platformAnnouncements`** | ❌ Baru | 7.6 | ✅ Ya |
| **`holidayTemplates`** | ❌ Baru | 7.6 | ✅ Ya |
| **`globalAudioLibrary`** | ❌ Baru | 7.6 | ✅ Ya |
| **`globalPrayerConfig`** | ❌ Baru | 7.8 | ✅ Ya |

---

## 5. Prioritas Implementasi

| Priority | Menu | Effort | Impact | Alasan |
|----------|------|--------|--------|--------|
| **P0** | Restructure routing + sidebar | 1 hari | High | Enabler untuk semua menu lain |
| **P0** | 7.2 Manajemen Masjid (edit + detail) | 2 hari | High | Core tenant management |
| **P0** | 7.3 Manajemen Admin Masjid | 2 hari | High | Admins are users too |
| **P1** | 7.7 Monitoring (device heartbeat) | 1 hari | High | Lihat display online/offline |
| **P1** | 7.8 Konfigurasi Global Jadwal | 2 hari | Medium | Platform-wide prayer config |
| **P1** | 7.1 Dashboard (lengkapi stats) | 1 hari | Medium | Overview platform |
| **P2** | 7.4 Paket & Pembayaran | 2 hari | Medium | Revenue management |
| **P2** | 7.5 Template Global | 1 hari | Low | Nice to have |
| **P3** | 7.6 Konten Global | 2 hari | Low | Enhancement |

---

## 6. Catatan Teknis Tambahan

1. **Session/role check** — sudah ada di `+page.server.ts` (`locals.user.roles.includes("superadmin")`), pindahkan ke `hooks.server.ts` atau layout agar semua halaman superadmin terproteksi otomatis.

2. **Admin bisa create masjid sendiri** — sudah ada di admin page (action `createMasjid`). Superadmin perlu bisa lihat semua masjid, termasuk yang dibuat admin sendiri.

3. **Pagination** — komponen `Pagination` sudah ada di admin page. Bisa dipakai ulang untuk superadmin.

4. **UI consistency** — superadmin saat ini pakai palet emerald (`bg-emerald-*`), admin pakai slate/emerald. Konsistenkan.

5. **Data isolation** — superadmin query ALL data (tanpa filter masjidId), admin query hanya tenantnya. Pastikan query superadmin **tidak** terfilter oleh `masjidId` dari session.
