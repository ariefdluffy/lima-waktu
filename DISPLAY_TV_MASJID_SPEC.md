# Spesifikasi Produk Display TV Masjid - Lima Waktu

Dokumen ini berisi rancangan fitur, template UI Display TV Horizontal, skema harga, saran fitur tambahan, keamanan website, dan kebutuhan menu admin/superadmin untuk project **Lima Waktu**.

> Catatan keamanan: referensi publik dari `masaj.id` dapat dijadikan inspirasi dari sisi konsep, namun cookie/session yang dibagikan tidak boleh digunakan untuk mengakses akun, dashboard, atau area privat. Token/session sebaiknya segera dihapus/dirotasi dari browser jika pernah dibagikan ke pihak lain.

---

## 0. Panduan Eksekusi untuk Model AI Lain

Bagian ini dibuat agar dokumen dapat dibaca dengan jelas dan dieksekusi oleh model AI lain sebagai instruksi pengembangan project.

### 0.1 Peran AI yang Mengeksekusi

Model AI yang membaca dokumen ini harus berperan sebagai **software engineer fullstack SvelteKit + MySQL** yang bertugas membangun aplikasi Display TV Masjid bernama **Lima Waktu**.

AI harus:

- Membaca dokumen ini sebagai product requirement document, technical specification, dan implementation roadmap.
- Mengutamakan implementasi bertahap berdasarkan bagian **Prioritas Pengembangan MVP**.
- Menjaga agar seluruh fitur multi-tenant aman dan tidak bocor antar masjid.
- Menggunakan Svelte/SvelteKit untuk frontend dan backend.
- Menggunakan MySQL sebagai database utama.
- Menghasilkan kode yang rapi, modular, mudah diuji, dan mudah dikembangkan.

### 0.2 Target Akhir Project

Target akhir project adalah aplikasi SaaS Display TV Masjid yang memiliki:

1. Halaman Display TV horizontal modern untuk jamaah.
2. Dashboard admin masjid untuk mengatur profil, jadwal sholat, konten, perangkat, tema, dan pengumuman.
3. Dashboard superadmin untuk mengatur tenant/masjid, admin, paket harga, konfigurasi global, dan monitoring.
4. Backend SvelteKit yang menangani API, auth, session, device pairing, jadwal sholat, media, dan billing.
5. Database MySQL dengan schema multi-tenant yang aman.

### 0.3 Stack Wajib

AI tidak perlu mengganti stack kecuali diminta secara eksplisit.

| Kebutuhan | Stack |
|---|---|
| Frontend | Svelte / SvelteKit |
| Backend | SvelteKit server routes, server actions, hooks |
| Database | MySQL |
| Styling | Tailwind CSS dan/atau CSS scoped Svelte |
| Runtime | Node.js |
| ORM/query | Drizzle ORM atau `mysql2` dengan prepared statement |
| Deployment target | Node adapter, VPS |

### 0.4 Prinsip Eksekusi

AI harus mengikuti prinsip berikut:

- Jangan langsung membuat semua fitur sekaligus.
- Kerjakan dari foundation: database, auth, tenant, lalu display.
- Setiap fitur harus punya backend, database, validasi, UI admin jika diperlukan, dan acceptance criteria.
- Hindari hardcode data penting kecuali untuk seed/demo.
- Simpan credential di environment variable.
- Jangan menyimpan API key, password, cookie, atau session token di repository.
- Semua query tenant harus memakai filter `masjid_id` atau `tenant_id`.
- Display TV harus tetap bisa menampilkan data dari cache/backend walaupun provider jadwal sholat bermasalah.

### 0.5 Urutan Implementasi yang Direkomendasikan

AI yang mengeksekusi project ini harus mengerjakan dalam urutan berikut:

1. **Project foundation**
   - Pastikan SvelteKit berjalan.
   - Pastikan Tailwind aktif.
   - Pastikan koneksi MySQL berjalan.
   - Buat struktur folder server/client yang rapi.

2. **Database schema dan migration**
   - Buat tabel user, role, permission, masjid, device, jadwal sholat, konten, subscription, dan audit log.
   - Tambahkan foreign key dan index penting.
   - Tambahkan seed minimal untuk superadmin dan satu masjid demo.

3. **Auth dan authorization**
   - Login/logout.
   - Session aman.
   - Role superadmin/admin/operator/viewer.
   - Tenant scoping.

4. **Modul masjid dan tenant**
   - CRUD masjid.
   - Assign admin ke masjid.
   - Profil masjid, lokasi, timezone, logo.

5. **Modul jadwal sholat**
   - Provider/API/perhitungan koordinat/manual input.
   - Koreksi global/per waktu.
   - Override per tanggal.
   - Cache jadwal di MySQL.
   - Scheduler update otomatis.

6. **Display TV horizontal**
   - Konversi referensi `masjid_display_tv_horizontal_template.html` ke komponen Svelte.
   - Gunakan data dinamis dari backend.
   - Buat countdown adzan/iqamah client-side.
   - Pastikan responsive untuk TV 32, 43, 55 inch.

7. **Admin konten**
   - Running text.
   - Slide gambar.
   - Jumbotron.
   - Upload media.
   - Pengaturan tema.

8. **Device management**
   - Pairing device.
   - Token display.
   - Heartbeat.
   - Status online/offline.

9. **Superadmin dan billing**
   - Paket bulanan/tahunan.
   - Subscription manual terlebih dahulu.
   - Monitoring tenant dan device.

10. **Hardening production**
    - Security headers.
    - Audit log.
    - Backup.
    - Rate limit.
    - Validasi upload.
    - Error monitoring.

### 0.6 Definisi Selesai / Definition of Done

Sebuah fitur dianggap selesai jika memenuhi syarat berikut:

- Database schema tersedia dan aman untuk multi-tenant.
- Backend/API/server action tersedia.
- Validasi input tersedia di server.
- UI admin/superadmin tersedia jika fitur perlu dikontrol user.
- Display TV membaca data dinamis dari backend, bukan data dummy.
- Error handling tersedia.
- Akses dibatasi berdasarkan role dan tenant.
- Minimal diuji manual dengan data demo.
- Tidak ada secret di source code.

### 0.7 Format Task untuk AI Executor

Jika AI lain ingin mengeksekusi dokumen ini, pecah pekerjaan ke task kecil seperti format berikut:

```/dev/null/ai-task-format.md#L1-17
Task ID: LW-MVP-001
Judul: Setup koneksi MySQL di SvelteKit
Tujuan: Aplikasi dapat terhubung ke database MySQL melalui server-only module.
File/Folder Terkait:
- src/lib/server/db
- .env.example
- drizzle atau migrations
Acceptance Criteria:
- Environment variable database terdokumentasi.
- Connection pool berjalan.
- Query test sederhana berhasil.
- Credential tidak masuk bundle browser.
Catatan Security:
- Jangan hardcode password database.
- Gunakan prepared statement atau ORM.
```

### 0.8 Task Breakdown MVP untuk AI Executor

Gunakan daftar task berikut sebagai panduan eksekusi awal.

| Task ID | Prioritas | Nama Task | Output Utama |
|---|---:|---|---|
| LW-MVP-001 | P0 | Setup struktur SvelteKit + MySQL | Koneksi DB, env, struktur folder |
| LW-MVP-002 | P0 | Buat schema database awal | Migration/DDL tabel utama |
| LW-MVP-003 | P0 | Seed superadmin dan masjid demo | Data awal untuk login dan testing |
| LW-MVP-004 | P0 | Auth session | Login, logout, session aman |
| LW-MVP-005 | P0 | Role dan tenant scoping | Superadmin/admin terpisah aman |
| LW-MVP-006 | P0 | CRUD masjid | Superadmin bisa kelola tenant |
| LW-MVP-007 | P0 | Profil masjid admin | Admin bisa edit profil masjid sendiri |
| LW-MVP-008 | P0 | Config provider jadwal sholat | Admin/superadmin bisa memilih sumber jadwal |
| LW-MVP-009 | P0 | Jadwal sholat cache MySQL | Jadwal harian/bulanan tersimpan |
| LW-MVP-010 | P0 | Koreksi dan override jadwal | Koreksi global/per waktu/per tanggal |
| LW-MVP-011 | P0 | Display TV horizontal Svelte | Template HTML menjadi UI Svelte dinamis |
| LW-MVP-012 | P0 | Countdown adzan dan iqamah | Countdown real-time berjalan |
| LW-MVP-013 | P1 | Running text admin | CRUD running text dan tampil di TV |
| LW-MVP-014 | P1 | Slide gambar admin | Upload slide dan tampil di jumbotron |
| LW-MVP-015 | P1 | Device pairing | Device display terhubung ke masjid |
| LW-MVP-016 | P1 | Superadmin subscription manual | Paket bulanan/tahunan aktif/expired |
| LW-MVP-017 | P1 | Audit log dasar | Perubahan penting tercatat |
| LW-MVP-018 | P1 | Security hardening awal | CSRF, upload validation, headers |

### 0.9 Acceptance Criteria Global MVP

MVP dianggap siap dipakai masjid pertama jika:

- Superadmin bisa login.
- Superadmin bisa membuat masjid dan admin masjid.
- Admin masjid bisa login.
- Admin hanya bisa melihat dan mengubah data masjid miliknya.
- Admin bisa mengatur profil masjid dan lokasi.
- Admin bisa mengatur provider jadwal sholat, koreksi waktu, dan override tanggal tertentu.
- Jadwal sholat tersimpan di MySQL dan dapat ditampilkan tanpa memanggil provider langsung dari display.
- Display TV horizontal berjalan dari route SvelteKit.
- Display menampilkan nama masjid, lokasi, jam, tanggal, jadwal sholat, countdown, running text, dan slide.
- Device display bisa dipasangkan ke masjid.
- Data dummy sudah diganti data dinamis.
- Paket harga bulanan/tahunan bisa diatur minimal secara manual.

### 0.10 Instruksi Khusus untuk Jadwal Sholat

Modul jadwal sholat adalah fitur inti. AI harus memastikan:

- Sumber jadwal dapat dikonfigurasi.
- Ada fallback jika provider gagal.
- Ada cache jadwal di MySQL.
- Ada koreksi manual oleh admin.
- Ada override per tanggal.
- Ada konfigurasi global superadmin.
- Display tidak mengambil data langsung dari provider eksternal.
- Jadwal final yang tampil ke jamaah adalah hasil dari provider/perhitungan + koreksi + override.

### 0.11 Instruksi Khusus untuk Display TV

Display TV harus:

- Menggunakan referensi visual dari `masjid_display_tv_horizontal_template.html`.
- Dipecah menjadi komponen Svelte reusable.
- Fokus pada keterbacaan jamaah.
- Memiliki font besar dan kontras tinggi.
- Responsif untuk TV 32, 43, dan 55 inch.
- Tetap stabil jika dibuka 24 jam.
- Menangani state normal, menjelang adzan, adzan, iqamah, sholat, Jumat, dan hemat energi.

### 0.12 Hal yang Tidak Boleh Dilakukan AI Executor

AI executor tidak boleh:

- Menggunakan cookie/session dari referensi eksternal.
- Menyalin aset berhak cipta dari website referensi.
- Membuat query multi-tenant tanpa filter `masjid_id`/`tenant_id`.
- Menyimpan password dalam bentuk plain text.
- Mengambil jadwal sholat langsung dari browser display tanpa cache backend.
- Menaruh API key di frontend.
- Mengabaikan validasi upload media.
- Menghapus fitur penting dari dokumen hanya untuk menghindari error.

---

## 1. Ringkasan Produk

**Lima Waktu Display TV Masjid** adalah sistem digital signage berbasis web untuk menampilkan informasi waktu sholat, adzan, iqamah, pengumuman, media visual, video, agenda masjid, dan mode khusus ibadah. Sistem ditujukan untuk TV masjid ukuran **32 inch, 43 inch, dan 55 inch** dengan tampilan yang jelas terlihat oleh jamaah dari jarak jauh.

Project ini menggunakan **Svelte/SvelteKit** sebagai frontend sekaligus backend aplikasi, dengan koneksi database menggunakan **MySQL**. Dengan pendekatan fullstack SvelteKit, halaman display TV, dashboard admin, superadmin, API server, validasi form, autentikasi, dan integrasi database dapat berada dalam satu codebase yang terstruktur.

### Tujuan Utama

1. Menampilkan jadwal sholat 5 waktu secara jelas dan real-time.
2. Membantu pengurus masjid mengatur adzan, iqamah, pengumuman, dan konten TV dari dashboard admin.
3. Mendukung berbagai ukuran dan orientasi TV.
4. Menyediakan sistem multi-tenant agar superadmin dapat mengelola banyak masjid/admin.
5. Memberikan pengalaman visual modern, stabil, dan mudah digunakan.

---

## 2. Target Pengguna

### 2.1 Jamaah Masjid

- Melihat waktu sholat berikutnya secara cepat.
- Melihat countdown menuju adzan/iqamah.
- Membaca pengumuman, running text, poster, kajian, agenda, dan informasi penting.

### 2.2 Admin Masjid

- Mengatur profil masjid.
- Mengatur lokasi jadwal sholat berdasarkan kota/kabupaten/kecamatan/kelurahan.
- Mengoreksi jadwal sholat.
- Mengatur alarm adzan dan iqamah.
- Mengelola konten slide, jumbotron, YouTube, running text, event, dan tema.

### 2.3 Superadmin Platform

- Mengelola semua tenant/masjid.
- Mengelola admin masjid.
- Mengelola paket berlangganan.
- Monitoring status perangkat/display.
- Mengatur template global dan konfigurasi sistem.

---

## 3. Fitur Utama Display TV

### 3.1 Informasi Waktu Sholat 5 Waktu

Menampilkan waktu:

- Subuh
- Dzuhur
- Ashar
- Maghrib
- Isya

Opsional tambahan:

- Imsak
- Terbit/Syuruq
- Dhuha
- Waktu Jumat khusus

Informasi wajib terlihat jelas:

- Waktu sekarang
- Tanggal Masehi
- Tanggal Hijriyah
- Nama masjid
- Lokasi masjid
- Waktu sholat berikutnya
- Countdown menuju adzan/iqamah

### 3.2 Alarm Waktu Adzan

Fitur:

- Alarm otomatis saat masuk waktu sholat.
- Audio adzan berbeda untuk Subuh dan waktu selain Subuh.
- Volume dapat diatur per TV/per masjid.
- Opsi mute otomatis setelah durasi tertentu.
- Opsi hanya tampil visual tanpa audio.
- Overlay layar masuk waktu sholat.

### 3.3 Alarm Iqamah

Fitur:

- Countdown iqamah setelah adzan.
- Durasi iqamah berbeda per waktu sholat.
- Tampilan full screen menjelang iqamah.
- Alarm pendek sebelum iqamah.
- Opsi lanjut ke mode sholat setelah iqamah.

Contoh durasi default:

| Waktu | Durasi Iqamah Default |
|---|---:|
| Subuh | 10 menit |
| Dzuhur | 10 menit |
| Ashar | 10 menit |
| Maghrib | 5 menit |
| Isya | 10 menit |
| Jumat | 15 menit atau sesuai admin |

### 3.4 Jadwal Sholat Berdasarkan Kota atau Kelurahan

Sumber data dapat mendukung:

- Kota/kabupaten
- Kecamatan
- Kelurahan/desa
- Koordinat latitude/longitude
- API jadwal sholat eksternal
- Perhitungan lokal berdasarkan koordinat dan metode hisab

Rekomendasi metode:

- Sediakan pilihan sumber dari API resmi/tepercaya.
- Simpan cache jadwal bulanan agar TV tetap berjalan saat internet terputus.
- Izinkan admin melakukan koreksi manual.

### 3.5 Koreksi Waktu Sholat

Admin dapat melakukan koreksi:

- Global semua waktu, misalnya `+2 menit`.
- Per waktu sholat, misalnya Subuh `+1`, Dzuhur `+2`, Ashar `+2`, Maghrib `+1`, Isya `+2`.
- Per tanggal khusus, misalnya Ramadan atau jadwal lokal masjid.

Rekomendasi UI admin:

- Input angka menit dengan tombol plus/minus.
- Preview jadwal sebelum disimpan.
- Riwayat perubahan koreksi.

### 3.6 Slide Gambar/Foto

Fitur:

- Upload gambar poster masjid.
- Urutan slide dapat diatur drag-and-drop.
- Durasi tampil per slide.
- Jadwal aktif/tidak aktif.
- Crop/fit otomatis untuk TV horizontal dan vertikal.
- Kompresi gambar otomatis.

Format rekomendasi:

- Horizontal: `1920x1080` atau `3840x2160`.
- Vertikal: `1080x1920`.
- Format: JPG, PNG, WebP.

### 3.7 Running Text Informasi

Fitur:

- Teks berjalan di bagian bawah layar.
- Bisa mengatur prioritas informasi.
- Bisa mengatur jadwal aktif.
- Bisa memilih warna, kecepatan, dan ikon.
- Bisa tampil sebagai ticker berita masjid.

Contoh konten:

- Pengumuman kajian.
- Informasi infaq.
- Jadwal imam/khatib.
- Informasi kebersihan dan parkir.
- Ucapan selamat hari besar Islam.

### 3.8 Slide Jumbotron

Jumbotron adalah area besar untuk konten unggulan.

Fitur:

- Poster kegiatan.
- Pengumuman penting.
- Quote/hadits pendek.
- Countdown event.
- Highlight donasi/progres pembangunan.
- Jadwal kajian pekanan.

### 3.9 Video YouTube

Fitur:

- Input URL YouTube.
- Playlist YouTube.
- Jadwal tayang video.
- Mute otomatis.
- Batas durasi video.
- Fallback ke slide gambar jika internet gagal.

Rekomendasi:

- Hindari autoplay video bersuara saat waktu sholat.
- Video otomatis berhenti saat adzan, iqamah, dan mode sholat.
- Gunakan YouTube embed dengan pembatasan domain jika memungkinkan.

### 3.10 Mode TV Vertikal dan Horizontal

Orientasi:

- **Horizontal 16:9** untuk TV 32, 43, 55 inch.
- **Vertikal 9:16** untuk signage berdiri.

Admin dapat memilih orientasi per perangkat.

### 3.11 Template/Tema Display TV

Admin dapat memilih template:

- Modern Minimalis
- Classic Islamic
- Dark Premium
- Green Mosque
- Ramadan Theme
- Jumat Theme
- Eid Theme

Setiap template sebaiknya mendukung:

- Warna utama.
- Font.
- Background.
- Posisi jadwal sholat.
- Mode hemat energi.
- Logo masjid.

### 3.12 Mode Sholat Jumat

Fitur khusus hari Jumat:

- Jadwal khatib dan imam.
- Countdown menuju khutbah.
- Running text khusus adab Jumat.
- Mode diam saat khutbah.
- Tampilan full screen: “Mohon matikan/heningkan HP”.
- Pengalihan Dzuhur menjadi Jumat untuk masjid yang mengadakan sholat Jumat.
- Jadwal muadzin/bilal.

### 3.13 Pengingat Hari Besar / Event Countdown

Fitur:

- Countdown menuju Ramadan.
- Countdown Idul Fitri.
- Countdown Idul Adha.
- Maulid Nabi.
- Isra Miraj.
- Tahun Baru Hijriyah.
- Event internal masjid seperti kajian akbar, tabligh akbar, santunan, donor darah.

Tampilan dapat berupa:

- Widget kecil di dashboard TV.
- Slide jumbotron.
- Full screen menjelang event.

### 3.14 Mode Hemat Energi

Fitur:

- Jadwal layar redup otomatis.
- Jadwal sleep mode malam hari.
- Tampilan minimal saat tidak ada aktivitas.
- Background gelap untuk mengurangi konsumsi daya.
- Auto wake sebelum Subuh atau waktu yang ditentukan.
- Deteksi jam operasional masjid.

Catatan teknis:

- Browser web tidak selalu bisa mematikan TV langsung.
- Untuk perangkat Android TV/mini PC, dapat dibuat companion app atau instruksi CEC/OS-level jika didukung.

---

## 4. Template Display TV Horizontal - Modern Mosque Premium

### 4.1 Konsep Visual

Nama template: **Modern Mosque Premium Horizontal**

Karakter desain:

- Modern, bersih, kontras tinggi.
- Fokus utama pada waktu sholat dan countdown.
- Menggunakan layout 16:9 untuk TV horizontal.
- Cocok untuk TV 32 inch, 43 inch, dan 55 inch.
- Font besar agar terbaca dari jarak jauh.
- Warna islami modern: hijau emerald, navy gelap, putih, aksen emas.

### 4.2 Rekomendasi Palet Warna

| Elemen | Warna | Hex |
|---|---|---:|
| Background utama | Navy gelap | `#071A24` |
| Card utama | Dark teal | `#0B2A33` |
| Aksen utama | Emerald | `#10B981` |
| Aksen premium | Gold | `#FBBF24` |
| Teks utama | Putih | `#F8FAFC` |
| Teks sekunder | Slate muda | `#CBD5E1` |
| Status warning | Amber | `#F59E0B` |
| Status urgent | Red | `#EF4444` |

### 4.3 Rekomendasi Font

- Judul/nama masjid: `Inter`, `Poppins`, atau `Plus Jakarta Sans`.
- Angka jam: `Inter Tight`, `Roboto Condensed`, atau `Digital-7` jika ingin gaya jam digital.
- Teks Arab/Islamic quote: `Noto Naskh Arabic` atau `Amiri`.

### 4.4 Layout 16:9

Resolusi dasar desain: **1920 x 1080 px**.

Struktur layar:

1. **Header atas**
   - Logo masjid
   - Nama masjid
   - Lokasi
   - Tanggal Masehi dan Hijriyah
   - Status koneksi kecil

2. **Area utama kiri**
   - Jam digital sangat besar
   - Waktu sholat berikutnya
   - Countdown adzan/iqamah
   - Status mode saat ini: Normal, Adzan, Iqamah, Sholat, Jumat, Hemat Energi

3. **Area utama kanan**
   - Jumbotron slide gambar/video/quote/event
   - Progress countdown event jika aktif

4. **Bar jadwal sholat bawah**
   - 5 waktu sholat dalam card besar
   - Highlight waktu berikutnya
   - Indikator sudah lewat/belum

5. **Running text paling bawah**
   - Pengumuman berjalan
   - Tinggi cukup agar terbaca dari jarak jauh

### 4.5 Komposisi Ukuran Elemen

Untuk rasio 1920x1080:

| Area | Perkiraan Ukuran | Prioritas |
|---|---:|---:|
| Header | 110 px | Sedang |
| Jam utama | 260-320 px tinggi area | Sangat tinggi |
| Countdown | 120-160 px tinggi area | Sangat tinggi |
| Jumbotron | 760x520 px | Tinggi |
| Card jadwal sholat | 150-180 px | Sangat tinggi |
| Running text | 55-75 px | Sedang |

### 4.6 Responsive dan Adaptif per Ukuran TV

#### TV 32 Inch

Prioritas:

- Perbesar jam dan jadwal sholat.
- Kurangi teks kecil.
- Running text lebih lambat.
- Tampilkan maksimal 1 pesan utama di jumbotron.

Rekomendasi ukuran font:

| Elemen | Font Size |
|---|---:|
| Jam utama | 120-150 px |
| Countdown | 52-72 px |
| Nama masjid | 32-42 px |
| Jadwal sholat | 32-42 px |
| Running text | 26-34 px |

#### TV 43 Inch

Prioritas:

- Layout seimbang antara informasi sholat dan jumbotron.
- Font tetap besar.
- Cocok untuk jarak pandang sedang.

Rekomendasi ukuran font:

| Elemen | Font Size |
|---|---:|
| Jam utama | 150-190 px |
| Countdown | 64-84 px |
| Nama masjid | 40-52 px |
| Jadwal sholat | 38-50 px |
| Running text | 30-38 px |

#### TV 55 Inch

Prioritas:

- Tampilkan lebih banyak detail tanpa mengurangi keterbacaan.
- Jumbotron dapat menampilkan poster HD.
- Tambahkan widget event atau quote.

Rekomendasi ukuran font:

| Elemen | Font Size |
|---|---:|
| Jam utama | 180-230 px |
| Countdown | 76-96 px |
| Nama masjid | 48-64 px |
| Jadwal sholat | 44-58 px |
| Running text | 34-44 px |

### 4.7 State Tampilan

#### State Normal

- Menampilkan jam besar.
- Menampilkan countdown ke sholat berikutnya.
- Menampilkan jumbotron aktif.
- Jadwal sholat bawah selalu terlihat.

#### State Menjelang Adzan

Aktif misalnya 5 menit sebelum adzan.

Tampilan:

- Countdown menjadi lebih menonjol.
- Card waktu sholat berikutnya menyala.
- Jumbotron dapat berubah menjadi pesan persiapan sholat.
- Running text dapat menampilkan adab masjid.

#### State Adzan

Tampilan full/semifull screen:

- Tulisan: “Telah Masuk Waktu Sholat [Nama Sholat]”.
- Jam tetap tampil.
- Audio adzan berjalan jika diaktifkan.
- Video/slide otomatis pause.
- Running text disembunyikan atau dibuat tenang.

#### State Iqamah

Tampilan:

- Countdown iqamah sangat besar.
- Pesan: “Iqamah dalam 05:00”.
- Background lebih tenang.
- Jadwal sholat bawah dapat disembunyikan agar fokus.

#### State Sholat

Tampilan:

- Layar minimalis/gelap.
- Pesan: “Sholat sedang berlangsung”.
- Jam kecil.
- Tidak ada video/audio/running text.

#### State Jumat

Tampilan:

- Informasi khatib, imam, bilal.
- Pesan heningkan HP.
- Countdown khutbah atau iqamah Jumat.
- Setelah khutbah mulai, masuk mode tenang.

#### State Hemat Energi

Tampilan:

- Background hitam/dark.
- Jam kecil.
- Brightness visual rendah.
- Hanya informasi penting.

### 4.8 Referensi Desain HTML

File referensi desain horizontal:

- `masjid_display_tv_horizontal_template.html`

Template HTML tersebut dapat dijadikan baseline desain untuk implementasi Display TV Horizontal di Svelte. Elemen desain yang perlu dipertahankan:

- Wrapper utama layar TV melalui konsep `tv-wrap`.
- Background modern dengan aksen bintang/grid melalui konsep `bg-stars` dan `bg-grid`.
- Header atas berisi logo, nama masjid, lokasi, jam, tanggal Masehi, dan tanggal Hijriyah.
- Panel kiri untuk informasi sholat berikutnya, jam sholat berikutnya, countdown adzan, dan countdown iqamah.
- Panel tengah untuk grid jadwal sholat 5 waktu dengan card aktif/highlight.
- Area slide/jumbotron untuk ayat, hadits, quote, pengumuman, poster, atau konten event.
- Panel kanan untuk informasi tambahan seperti event countdown, info kajian, infaq, atau QRIS.
- Running bar di bagian bawah untuk informasi berjalan.
- Indikator slide/dot untuk konten jumbotron.

Rekomendasi konversi ke Svelte:

- Pecah template HTML menjadi komponen kecil agar mudah dirawat.
- Semua data dummy di HTML harus diganti dengan data dari backend SvelteKit/MySQL.
- Jam digital dan countdown tetap berjalan di client-side agar real-time.
- Data jadwal sholat, iqamah, running text, slide, dan event di-load dari backend/cache.
- CSS template dapat dikonversi ke Tailwind CSS atau tetap memakai CSS scoped di komponen Svelte.
- Pastikan layout tetap responsive untuk TV 32, 43, dan 55 inch.

Komponen Svelte yang disarankan dari referensi HTML:

| Komponen | Fungsi |
|---|---|
| `DisplayTvHorizontal.svelte` | Layout utama display TV horizontal |
| `DisplayHeader.svelte` | Logo, nama masjid, lokasi, jam, tanggal |
| `NextPrayerPanel.svelte` | Sholat berikutnya, waktu, countdown adzan, iqamah |
| `PrayerTimeGrid.svelte` | Card jadwal Subuh-Dzuhur-Ashar-Maghrib-Isya |
| `JumbotronSlider.svelte` | Slide ayat/hadits/poster/event/video |
| `InfoSidebar.svelte` | Info tambahan, event countdown, QRIS/infaq |
| `RunningTextBar.svelte` | Running text bawah layar |
| `DisplayStateOverlay.svelte` | Overlay adzan, iqamah, sholat, Jumat, hemat energi |

---

## 5. Skema Harga

### 5.1 Paket Bulanan

**Rp109.000 / bulan**

Cocok untuk masjid yang ingin mencoba sistem dengan pembayaran fleksibel.

Fitur yang disarankan masuk paket bulanan:

- 1 akun admin masjid.
- 1 display TV aktif.
- Jadwal sholat otomatis berdasarkan lokasi.
- Koreksi waktu sholat.
- Alarm adzan dan iqamah.
- Running text.
- Slide gambar.
- 1-3 template dasar.
- Mode Jumat.
- Event countdown.
- Support standar.

### 5.2 Paket Tahunan

**Rp1.200.000 / tahun**

Setara Rp100.000/bulan, lebih hemat dibanding bulanan.

Fitur yang disarankan masuk paket tahunan:

- Semua fitur paket bulanan.
- Prioritas support.
- Backup konten berkala.
- Akses template premium.
- Statistik penggunaan display.
- Jadwal konten lebih fleksibel.
- Diskon tambahan untuk TV/perangkat kedua.

### 5.3 Rekomendasi Add-on Opsional

| Add-on | Deskripsi | Saran Harga |
|---|---|---:|
| Display tambahan | Tambah 1 TV/device | Rp25.000-Rp50.000/bulan |
| Storage ekstra | Untuk gambar/video lebih banyak | Rp20.000-Rp50.000/bulan |
| Setup onsite | Instalasi di lokasi | Sesuai kota |
| Custom template | Desain tema khusus masjid | Mulai Rp500.000 |
| Running text donatur | Modul donatur/infaq | Add-on premium |

---

## 6. Menu Admin Masjid

### 6.1 Dashboard Admin

Konten utama:

- Status display online/offline.
- Waktu sholat hari ini.
- Countdown sholat berikutnya.
- Preview tampilan TV.
- Notifikasi konten aktif.
- Status subscription.

### 6.2 Profil Masjid

Field:

- Nama masjid.
- Alamat lengkap.
- Kota/kecamatan/kelurahan.
- Koordinat GPS.
- Logo masjid.
- Kontak pengurus.
- Zona waktu.
- Metode perhitungan jadwal sholat.

### 6.3 Pengaturan Jadwal Sholat

Fitur:

- Pilih lokasi berdasarkan provinsi/kota/kecamatan/kelurahan atau koordinat GPS.
- Pilih sumber jadwal sholat: API eksternal, jadwal Kemenag/Bimas Islam jika tersedia, perhitungan koordinat, atau input manual.
- Pilih metode perhitungan jika menggunakan kalkulasi koordinat.
- Sinkronisasi jadwal harian, bulanan, atau tahunan.
- Auto update jadwal sholat secara berkala agar tetap up-to-date.
- Koreksi menit per waktu.
- Koreksi global semua waktu.
- Manual override jadwal per tanggal.
- Preview bulanan sebelum publish ke display.
- Import/export jadwal.
- Riwayat sinkronisasi dan riwayat perubahan jadwal.
- Fallback ke cache jadwal lokal jika API eksternal gagal.

### 6.4 Pengaturan Adzan dan Iqamah

Fitur:

- Audio adzan.
- Audio adzan Subuh.
- Volume.
- Durasi adzan.
- Durasi iqamah per waktu.
- Mode silent untuk waktu tertentu.
- Preview alarm.

### 6.5 Manajemen Slide Gambar

Fitur:

- Upload gambar.
- Atur urutan.
- Atur durasi.
- Atur jadwal tampil.
- Aktif/nonaktif.
- Kategori: pengumuman, kajian, donasi, umum.

### 6.6 Manajemen Jumbotron

Fitur:

- Buat slide utama.
- Pilih tipe: gambar, teks, quote, event, donasi, video.
- Jadwal aktif.
- Prioritas tampil.

### 6.7 Manajemen Running Text

Fitur:

- Tambah/edit/hapus teks.
- Jadwal aktif.
- Kecepatan teks.
- Prioritas.
- Warna dan ikon.
- Mode darurat untuk pengumuman penting.

### 6.8 Manajemen YouTube

Fitur:

- Tambah URL video/playlist.
- Jadwal tayang.
- Durasi maksimal.
- Mute otomatis.
- Stop otomatis saat adzan/iqamah.

### 6.9 Tema dan Template

Fitur:

- Pilih template.
- Pilih warna utama.
- Upload background.
- Preview TV 32/43/55 inch.
- Pilih orientasi horizontal/vertikal.
- Simpan preset.

### 6.10 Mode Jumat

Fitur:

- Aktif/nonaktif mode Jumat.
- Jadwal khatib.
- Jadwal imam.
- Jadwal bilal/muadzin.
- Pesan khutbah.
- Durasi mode tenang.

### 6.11 Event dan Hari Besar

Fitur:

- Kalender Islam otomatis.
- Event custom masjid.
- Countdown event.
- Poster event.
- Notifikasi menjelang event.

### 6.12 Perangkat Display

Fitur:

- Daftar TV/perangkat.
- Pairing device via kode.
- Status online/offline.
- Last seen.
- Orientasi perangkat.
- Resolusi layar.
- Reload display jarak jauh.
- Assign template per perangkat.

### 6.13 Laporan dan Statistik

Fitur:

- Riwayat konten tampil.
- Uptime perangkat.
- Error log.
- Penggunaan storage.
- Aktivitas admin.

---

## 7. Menu Superadmin

### 7.1 Dashboard Superadmin

Fitur:

- Total masjid terdaftar.
- Total admin.
- Total display aktif.
- Display online/offline.
- Pendapatan bulanan/tahunan.
- Subscription aktif/expired.

### 7.2 Manajemen Masjid/Tenant

Fitur:

- Tambah/edit/hapus masjid.
- Suspend/aktifkan masjid.
- Assign paket langganan.
- Lihat konfigurasi masjid.
- Reset perangkat.

### 7.3 Manajemen Admin Masjid

Fitur:

- Tambah admin.
- Role dan permission.
- Reset password.
- Aktif/nonaktif akun.
- Audit aktivitas.

### 7.4 Manajemen Paket dan Pembayaran

Fitur:

- Paket bulanan/tahunan.
- Invoice.
- Payment gateway.
- Status pembayaran.
- Reminder perpanjangan.
- Grace period.
- Kupon/diskon.

### 7.5 Manajemen Template Global

Fitur:

- Upload template baru.
- Tandai template premium/free.
- Preview template.
- Assign template ke paket tertentu.

### 7.6 Manajemen Konten Global

Fitur:

- Pengumuman platform.
- Template event hari besar Islam.
- Library audio adzan.
- Library background islami.

### 7.7 Monitoring Sistem

Fitur:

- Health check server.
- Queue job status.
- API jadwal sholat status.
- Storage usage.
- Error log global.
- Device heartbeat.

### 7.8 Konfigurasi Global Jadwal Sholat

Fitur:

- Mengatur provider/sumber jadwal sholat default platform.
- Mengatur API endpoint dan API key provider jadwal sholat jika diperlukan.
- Mengatur prioritas provider, misalnya provider utama, provider cadangan, lalu cache lokal.
- Mengatur metode hisab default.
- Mengatur timezone default Indonesia.
- Mengatur jadwal sinkronisasi otomatis harian/bulanan.
- Melihat log kegagalan sinkronisasi jadwal.
- Melakukan refresh jadwal massal untuk tenant tertentu atau semua tenant.
- Mengunci konfigurasi tertentu agar tidak bisa diubah admin masjid jika diperlukan.

---

## 8. Saran Fitur Tambahan yang Penting

### 8.1 Offline Mode / Cache Lokal

Display TV harus tetap menampilkan jadwal sholat walaupun internet putus.

Rekomendasi:

- Cache jadwal sholat minimal 30 hari.
- Cache konten slide aktif.
- Tampilkan indikator offline kecil.
- Sinkron ulang otomatis saat internet kembali.

### 8.2 Device Pairing Aman

Agar TV mudah dipasang:

1. TV membuka URL display.
2. Sistem menampilkan kode pairing 6 digit.
3. Admin memasukkan kode di dashboard.
4. Perangkat otomatis terhubung ke masjid tersebut.

Keamanan:

- Kode pairing expired dalam 5-10 menit.
- Satu kode hanya untuk satu perangkat.
- Admin bisa revoke perangkat.

### 8.3 Preview TV Real-time

Admin bisa melihat preview tampilan TV dari dashboard sebelum konten dipublish.

### 8.4 Jadwal Konten

Setiap konten sebaiknya punya:

- Tanggal mulai.
- Tanggal selesai.
- Jam tampil.
- Hari tampil.
- Prioritas.
- Target perangkat.

### 8.5 Approval Konten

Untuk masjid besar, konten dari operator perlu disetujui ketua DKM/admin utama sebelum tampil.

### 8.6 Multi-role Admin

Contoh role:

- Owner masjid
- Admin utama
- Operator konten
- Bendahara/donasi
- Viewer/read-only

### 8.7 Modul Donasi/Infaq

Fitur opsional:

- QRIS masjid.
- Target donasi.
- Progress pembangunan.
- Laporan donasi manual.
- Running text ucapan terima kasih donatur.

### 8.8 Modul Jadwal Imam, Muadzin, Khatib

Fitur:

- Jadwal imam harian.
- Jadwal muadzin.
- Jadwal khatib Jumat.
- Riwayat petugas.

### 8.9 Notifikasi WhatsApp/Email

Notifikasi untuk:

- Subscription hampir habis.
- Display offline.
- Jadwal sholat gagal sinkron.
- Konten akan expired.
- Pembayaran berhasil/gagal.

Untuk WhatsApp notification, backend menggunakan **Fonnte** sebagai provider pengiriman pesan.

Kebutuhan backend Fonnte:

- Token Fonnte disimpan di environment variable, bukan di source code.
- Pengiriman pesan hanya dilakukan dari server/backend SvelteKit.
- Frontend tidak boleh mengetahui token Fonnte.
- Setiap pengiriman notifikasi sebaiknya dicatat ke tabel log.
- Admin/superadmin dapat mengatur nomor WhatsApp penerima dan preferensi notifikasi.
- Notifikasi yang disarankan untuk tahap awal: display offline, subscription reminder, dan jadwal sholat gagal sinkron.

### 8.10 Emergency Announcement

Fitur pengumuman darurat yang langsung tampil di semua display.

Contoh:

- Kehilangan barang.
- Info kendaraan menghalangi.
- Pengumuman penting dari DKM.

### 8.11 Akses Remote Display

Admin dapat:

- Reload display.
- Clear cache.
- Ubah orientasi.
- Ubah template.
- Cek status resolusi dan browser.

### 8.12 PWA untuk Display

Jadikan display sebagai PWA agar:

- Bisa fullscreen.
- Bisa cache offline.
- Lebih mudah dipasang di Android TV/Chrome.
- Auto-update lebih rapi.

---

## 9. Rekomendasi Security Website

### 9.1 Autentikasi

Wajib:

- Password hashing menggunakan Argon2id atau bcrypt.
- Minimum panjang password 8-12 karakter.
- Rate limit login.
- Lock sementara setelah percobaan gagal.
- Reset password aman via token sekali pakai.
- Session expiration.

Disarankan:

- Two-Factor Authentication untuk superadmin.
- Login alert via email/WhatsApp.

### 9.2 Authorization / Role-Based Access Control

Wajib:

- Superadmin tidak sama dengan admin masjid.
- Admin hanya bisa mengakses tenant/masjid miliknya.
- Permission granular untuk konten, perangkat, billing, dan user.
- Validasi authorization di server, bukan hanya di UI.

### 9.3 Multi-Tenant Security

Penting:

- Semua query data harus difilter berdasarkan `tenant_id`/`masjid_id`.
- Gunakan middleware/server hook untuk memastikan scope tenant.
- Audit endpoint yang berpotensi bocor antar tenant.
- Jangan percaya `masjid_id` dari client tanpa verifikasi hak akses.

### 9.4 Keamanan Session dan Cookie

Rekomendasi cookie:

- `HttpOnly: true`
- `Secure: true`
- `SameSite: Lax` atau `Strict` untuk dashboard
- Session rotation setelah login
- Logout menghapus session server-side
- Jangan menyimpan token sensitif di `localStorage`

### 9.5 CSRF Protection

Wajib untuk action dashboard:

- Tambah/edit/hapus konten.
- Upload media.
- Update billing.
- Pairing device.
- Reset password.

### 9.6 XSS Protection

Karena ada running text dan konten HTML/teks dari admin:

- Escape output teks.
- Sanitasi input jika mendukung rich text.
- Jangan render HTML mentah tanpa sanitizer.
- Gunakan Content Security Policy.

### 9.7 Upload Security

Untuk slide gambar/media:

- Validasi MIME type dan ekstensi.
- Batasi ukuran file.
- Rename file upload.
- Simpan di storage terpisah/public object storage.
- Scan file jika memungkinkan.
- Jangan izinkan upload SVG mentah kecuali disanitasi.

### 9.8 API Security

- Rate limit endpoint publik.
- API key untuk perangkat display jika perlu.
- Token pairing perangkat harus pendek masa aktifnya.
- Validasi input dengan schema validation.
- Gunakan HTTPS wajib.
- Jangan expose stack trace di production.

### 9.9 Audit Log

Simpan log untuk:

- Login/logout.
- Gagal login.
- Perubahan jadwal sholat.
- Perubahan koreksi waktu.
- Upload/hapus konten.
- Perubahan role admin.
- Pair/revoke device.
- Perubahan billing.

### 9.10 Backup dan Disaster Recovery

- Backup database harian.
- Backup storage media.
- Retensi backup minimal 14-30 hari.
- Uji restore berkala.
- Monitoring error dan uptime.

### 9.11 Header Security

Rekomendasi header:

- `Content-Security-Policy`
- `X-Frame-Options` atau `frame-ancestors`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security`

### 9.12 Perlindungan Data Pribadi

- Minimalkan data pribadi admin.
- Jangan tampilkan email/no HP ke publik tanpa kebutuhan.
- Enkripsi data sensitif jika diperlukan.
- Sediakan penghapusan akun/data sesuai kebijakan.

---

## 10. Rekomendasi Teknis Implementasi

### 10.1 Stack Teknologi Project

Project ini direkomendasikan memakai stack berikut:

| Layer | Teknologi | Fungsi |
|---|---|---|
| Frontend | Svelte / SvelteKit | UI display TV, dashboard admin, dashboard superadmin |
| Backend | SvelteKit server routes/actions | API, autentikasi, validasi data, proses CRUD, pairing device |
| Database | MySQL | Penyimpanan data masjid, user, jadwal sholat, konten, device, subscription |
| Styling | Tailwind CSS | Desain responsive dan adaptif untuk TV serta dashboard |
| ORM/Query Builder | Drizzle ORM atau query MySQL terstruktur | Migrasi schema dan query database yang aman |
| Runtime | Node.js | Menjalankan aplikasi SvelteKit backend/frontend |
| Deployment | Node adapter / VPS | Production deployment |

Catatan implementasi:

- Gunakan SvelteKit sebagai fullstack framework agar route UI dan route API berada dalam satu project.
- Gunakan server-side validation untuk semua form admin/superadmin.
- Gunakan MySQL connection pool agar koneksi database stabil.
- Gunakan environment variable untuk konfigurasi database dan secret aplikasi.
- Jangan menyimpan credential database di repository.

### 10.2 Arsitektur Modul

Modul utama:

- Auth dan user management.
- Tenant/masjid management.
- Prayer time service.
- Display renderer.
- Content management.
- Device management.
- Billing/subscription.
- Notification service.
- Audit logging.

### 10.3 Data Model Utama MySQL

Entitas/tabel MySQL yang disarankan:

- `users`
- `roles`
- `permissions`
- `masjids`
- `masjid_users`
- `devices`
- `prayer_schedules`
- `prayer_corrections`
- `iqamah_settings`
- `media_assets`
- `slides`
- `running_texts`
- `jumbotrons`
- `youtube_items`
- `events`
- `themes`
- `subscriptions`
- `invoices`
- `audit_logs`

Rekomendasi standar tabel MySQL:

- Gunakan primary key `BIGINT UNSIGNED AUTO_INCREMENT` atau `CHAR(36)`/`VARCHAR(36)` jika memakai UUID.
- Semua tabel tenant wajib memiliki `masjid_id` atau `tenant_id`.
- Gunakan `created_at`, `updated_at`, dan jika perlu `deleted_at` untuk soft delete.
- Gunakan index pada kolom yang sering dicari seperti `masjid_id`, `device_id`, `user_id`, `date`, `status`, dan `subscription_status`.
- Gunakan foreign key untuk menjaga relasi data penting.
- Simpan waktu dalam timezone konsisten, lalu render sesuai zona waktu masjid.

### 10.4 Rekomendasi Struktur Folder SvelteKit

Struktur folder yang disarankan:

- `src/routes/` untuk halaman frontend dan backend route.
- `src/routes/display/` untuk tampilan TV publik/device.
- `src/routes/admin/` untuk dashboard admin masjid.
- `src/routes/superadmin/` untuk dashboard superadmin.
- `src/routes/api/` untuk API endpoint jika diperlukan.
- `src/lib/server/` untuk kode server-only seperti koneksi database, auth, repository, service.
- `src/lib/components/` untuk komponen UI reusable.
- `src/lib/components/display/` untuk komponen khusus Display TV, termasuk hasil konversi dari `masjid_display_tv_horizontal_template.html`.
- `src/lib/components/admin/` untuk komponen dashboard admin.
- `src/lib/stores/` untuk store client-side.
- `src/lib/utils/` untuk helper umum.
- `src/lib/validators/` untuk schema validasi form/API.
- `src/lib/display/` untuk helper kalkulasi countdown, state display, dan formatter waktu.
- `drizzle/` atau `migrations/` untuk migrasi database MySQL.
- `static/` untuk asset publik non-upload.

Struktur komponen display horizontal dari referensi HTML:

- `src/routes/display/[deviceToken]/+page.svelte`
- `src/routes/display/[deviceToken]/+page.server.ts`
- `src/lib/components/display/DisplayTvHorizontal.svelte`
- `src/lib/components/display/DisplayHeader.svelte`
- `src/lib/components/display/NextPrayerPanel.svelte`
- `src/lib/components/display/PrayerTimeGrid.svelte`
- `src/lib/components/display/JumbotronSlider.svelte`
- `src/lib/components/display/InfoSidebar.svelte`
- `src/lib/components/display/RunningTextBar.svelte`
- `src/lib/components/display/DisplayStateOverlay.svelte`

### 10.5 Backend SvelteKit

Backend dapat dibangun memakai fitur SvelteKit berikut:

- `+page.server.ts` untuk load data dashboard dari MySQL secara server-side.
- `+server.ts` untuk API endpoint seperti device heartbeat, sync display, pairing device, dan webhook pembayaran.
- Form actions untuk proses create/update/delete data admin.
- Hooks server untuk autentikasi, session, dan tenant scoping.
- Server-only module di `src/lib/server` agar credential database tidak masuk bundle browser.

Endpoint backend penting:

- `POST /api/device/pairing/request`
- `POST /api/device/pairing/confirm`
- `GET /api/display/{deviceToken}/config`
- `POST /api/display/{deviceToken}/heartbeat`
- `GET /api/prayer-schedules/today`
- `POST /api/admin/media/upload`
- `POST /api/billing/webhook`

### 10.6 Koneksi Database MySQL

Rekomendasi konfigurasi MySQL:

- Gunakan `mysql2` atau ORM seperti Drizzle ORM dengan driver MySQL.
- Gunakan connection pool, bukan koneksi tunggal.
- Konfigurasi database melalui `.env`.
- Pisahkan database development, staging, dan production.
- Gunakan migrasi schema agar perubahan tabel terdokumentasi.
- Hindari query string manual yang rawan SQL injection.
- Semua input dari admin harus divalidasi sebelum masuk query.

Contoh environment variable yang disarankan:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `DATABASE_SSL`
- `SESSION_SECRET`

### 10.7 Backend Feature Coverage

Agar semua fitur produk benar-benar tercover di backend, minimal backend perlu menyediakan modul berikut:

| Modul Backend | Status Kebutuhan | Fungsi |
|---|---|---|
| Auth dan session | Wajib | Login admin/superadmin, session, logout, reset password |
| RBAC/permission | Wajib | Membatasi akses superadmin, admin masjid, operator, viewer |
| Tenant/masjid | Wajib | Multi-tenant, profil masjid, lokasi, timezone |
| Prayer schedule | Wajib | Ambil, hitung, koreksi, cache, override jadwal sholat |
| Iqamah settings | Wajib | Durasi iqamah per waktu sholat dan mode Jumat |
| Alarm settings | Wajib | Audio adzan, volume, mode silent, durasi alarm |
| Display device | Wajib | Pairing perangkat, token display, heartbeat, status online/offline |
| Theme/template | Wajib | Pilih tema, orientasi TV, konfigurasi layout |
| Media manager | Wajib | Upload, validasi, optimasi, hapus gambar/audio |
| Slide/jumbotron | Wajib | CRUD slide, jadwal tampil, prioritas, status aktif |
| Running text | Wajib | CRUD running text, jadwal, prioritas, emergency text |
| YouTube content | Wajib fase 2 | URL video/playlist, jadwal tayang, fallback |
| Jumat mode | Wajib fase 2 | Jadwal khatib/imam/bilal dan tampilan khusus Jumat |
| Event countdown | Wajib fase 2 | Hari besar Islam dan event custom masjid |
| Offline cache config | Wajib | Cache jadwal dan konten aktif untuk display |
| Billing/subscription | Wajib monetisasi | Paket bulanan/tahunan, invoice, status aktif/expired |
| Notification | Disarankan | Email/WhatsApp via Fonnte untuk display offline, billing, sync gagal |
| Audit log | Wajib security | Mencatat perubahan data penting |
| Backup/maintenance | Wajib production | Backup database, cleanup media, monitoring error |

### 10.8 Config Jadwal Waktu Sholat Up-to-date

Backend wajib memiliki konfigurasi khusus untuk memastikan jadwal waktu sholat selalu up-to-date, tetap bisa dikoreksi manual, dan tetap berjalan saat provider/API bermasalah.

#### Sumber Jadwal Sholat

Sumber data yang sebaiknya didukung:

1. **API eksternal jadwal sholat** berdasarkan kota/kabupaten/kecamatan.
2. **API resmi/tepercaya** seperti sumber Kemenag/Bimas Islam jika tersedia dan stabil.
3. **Perhitungan koordinat** berdasarkan latitude/longitude masjid.
4. **Import manual** dari file CSV/Excel.
5. **Input manual** langsung dari admin.
6. **Cache lokal MySQL** sebagai fallback.

#### Konfigurasi di Admin Masjid

Admin masjid perlu bisa mengatur:

- Lokasi jadwal: kota/kecamatan/kelurahan atau latitude/longitude.
- Provider jadwal yang digunakan untuk masjidnya jika diizinkan superadmin.
- Metode hisab/perhitungan jika memakai koordinat.
- Zona waktu masjid.
- Koreksi global semua waktu, misalnya semua jadwal `+2 menit`.
- Koreksi per waktu: Subuh, Dzuhur, Ashar, Maghrib, Isya.
- Koreksi khusus Ramadan.
- Override jadwal per tanggal.
- Sinkronisasi ulang jadwal hari ini/bulan ini/tahun ini.
- Preview jadwal sebelum dipublish ke display.

#### Konfigurasi di Superadmin

Superadmin perlu bisa mengatur:

- Provider default platform.
- API endpoint provider.
- API key provider jika dibutuhkan.
- Prioritas fallback: provider utama → provider cadangan → kalkulasi koordinat → cache lokal.
- Jadwal cron/scheduler untuk update jadwal.
- Batas perubahan manual oleh admin masjid.
- Lock konfigurasi jadwal untuk tenant tertentu jika diperlukan.
- Refresh jadwal massal.
- Monitoring error sync provider.

#### Strategi Update dan Cache

Rekomendasi strategi backend:

- Generate/sync jadwal minimal 1 bulan ke depan untuk setiap masjid aktif.
- Jalankan scheduler harian untuk memastikan data hari ini dan besok tersedia.
- Jalankan scheduler bulanan untuk menarik jadwal bulan berikutnya.
- Simpan hasil jadwal final ke MySQL setelah koreksi diterapkan.
- Simpan raw response provider untuk audit/debug jika diperlukan.
- Jika API gagal, gunakan jadwal dari cache MySQL.
- Display TV tidak boleh bergantung langsung pada API eksternal; display membaca dari backend/cache project.

#### Prioritas Data Jadwal Final

Urutan prioritas jadwal yang ditampilkan ke TV:

1. Override manual per tanggal dari admin/superadmin.
2. Jadwal hasil provider yang sudah diberi koreksi manual.
3. Jadwal hasil kalkulasi koordinat yang sudah diberi koreksi manual.
4. Cache jadwal terakhir yang valid.
5. Fallback emergency dengan pesan error kecil ke admin, bukan ke jamaah.

#### Tabel MySQL yang Disarankan untuk Jadwal Sholat

Tabel tambahan/khusus yang disarankan:

- `prayer_providers`
- `prayer_provider_logs`
- `prayer_calculation_methods`
- `prayer_schedules`
- `prayer_schedule_raw_sources`
- `prayer_corrections`
- `prayer_overrides`
- `prayer_sync_jobs`

Kolom penting di `prayer_schedules`:

- `id`
- `masjid_id`
- `schedule_date`
- `imsak_time`
- `subuh_time`
- `sunrise_time`
- `dhuha_time`
- `dzuhur_time`
- `ashar_time`
- `maghrib_time`
- `isya_time`
- `source_provider`
- `calculation_method`
- `correction_applied`
- `is_manual_override`
- `synced_at`
- `created_at`
- `updated_at`

### 10.9 Config WhatsApp Notification via Fonnte

Backend WhatsApp notification menggunakan provider **Fonnte**. Implementasi awal sudah disiapkan sebagai server-only module dan endpoint test internal.

File backend yang disiapkan:

- `src/lib/server/notifications/fonnte.ts`
- `src/lib/server/notifications/whatsapp-templates.ts`
- `src/routes/api/internal/notifications/whatsapp/test/+server.ts`

Environment variable yang dibutuhkan:

| Variable | Wajib | Contoh | Keterangan |
|---|---|---|---|
| `FONNTE_ENABLED` | Ya | `true` | Mengaktifkan/mematikan pengiriman WhatsApp |
| `FONNTE_API_TOKEN` | Ya | `isi_token_fonnte` | Token API dari dashboard Fonnte |
| `FONNTE_API_URL` | Tidak | `https://api.fonnte.com/send` | Endpoint API Fonnte, default sudah disiapkan |
| `FONNTE_COUNTRY_CODE` | Tidak | `62` | Kode negara default Indonesia |
| `WHATSAPP_INTERNAL_SECRET` | Ya untuk endpoint test | `secret_random_panjang` | Secret untuk mengamankan endpoint test internal |

Contoh konfigurasi `.env` yang perlu dibuat secara lokal/production:

```/dev/null/.env.example#L1-5
FONNTE_ENABLED=false
FONNTE_API_TOKEN=replace_with_fonnte_token
FONNTE_API_URL=https://api.fonnte.com/send
FONNTE_COUNTRY_CODE=62
WHATSAPP_INTERNAL_SECRET=replace_with_random_internal_secret
```

Cara kerja backend:

1. Service `sendFonnteWhatsappMessage()` membaca konfigurasi dari environment variable.
2. Nomor WhatsApp dinormalisasi ke format Indonesia, misalnya `08123456789` menjadi `628123456789`.
3. Backend mengirim request `POST` ke Fonnte dengan header `Authorization` berisi token Fonnte.
4. Response Fonnte dikembalikan ke caller untuk dicatat ke log.
5. Jika `FONNTE_ENABLED` bukan `true`, pengiriman tidak dilakukan.

Endpoint test internal:

- Method: `POST`
- Path: `/api/internal/notifications/whatsapp/test`
- Header wajib: `x-internal-secret: <WHATSAPP_INTERNAL_SECRET>`
- Body JSON:

```/dev/null/fonnte-test-request.json#L1-4
{
  "target": "08123456789",
  "message": "Test notifikasi WhatsApp dari Lima Waktu"
}
```

Contoh integrasi backend:

```/dev/null/fonnte-usage.ts#L1-11
import { sendFonnteWhatsappMessage } from '$lib/server/notifications/fonnte';
import { displayOfflineMessage } from '$lib/server/notifications/whatsapp-templates';

await sendFonnteWhatsappMessage({
  target: '08123456789',
  message: displayOfflineMessage({
    masjidName: 'Masjid Al-Ikhlas',
    deviceName: 'TV Utama'
  })
});
```

Template pesan awal yang disiapkan:

- `displayOfflineMessage()` untuk notifikasi display offline.
- `subscriptionReminderMessage()` untuk reminder masa aktif paket.
- `prayerSyncFailedMessage()` untuk notifikasi jadwal sholat gagal sinkron.

Rekomendasi tabel MySQL untuk log notifikasi:

- `notification_logs`
- `notification_templates`
- `notification_preferences`

Kolom penting `notification_logs`:

- `id`
- `masjid_id`
- `channel` dengan nilai `whatsapp` atau `email`
- `provider` dengan nilai `fonnte`
- `recipient`
- `message`
- `status`
- `provider_response`
- `sent_at`
- `created_at`

Catatan security:

- Jangan expose endpoint test ini tanpa secret.
- Jangan commit token Fonnte.
- Endpoint production nantinya harus dipanggil dari job/backend internal, bukan dari browser umum.
- Tambahkan rate limit agar tidak terjadi spam.
- Simpan log pengiriman untuk audit dan troubleshooting.

### 10.10 Display Sync

Pilihan teknis:

- Polling setiap 30-60 detik untuk konfigurasi ringan.
- WebSocket/SSE untuk update real-time.
- Cache client-side untuk jadwal dan konten.
- Heartbeat perangkat setiap 1 menit.

### 10.11 Performance

- Optimasi gambar ke WebP.
- Lazy load konten media.
- Preload slide berikutnya.
- Hindari animasi berat.
- Gunakan CSS transform untuk running text.
- Batasi video autoplay.

### 10.12 Accessibility dan Keterbacaan TV

- Kontras tinggi.
- Hindari teks kecil.
- Hindari terlalu banyak elemen bergerak.
- Jangan gunakan warna mirip untuk status penting.
- Pastikan jadwal sholat tetap terlihat walau jumbotron berubah.

---

## 11. Prioritas Pengembangan MVP

### Phase 1 - MVP Wajib

1. Setup SvelteKit fullstack dengan koneksi MySQL.
2. Konversi referensi `masjid_display_tv_horizontal_template.html` menjadi komponen Svelte Display TV Horizontal.
3. Auth admin dan superadmin.
4. Multi-tenant masjid.
5. Profil masjid dan lokasi.
6. Jadwal sholat otomatis dari provider/API/perhitungan koordinat.
7. Config provider jadwal sholat dan scheduler update otomatis.
8. Koreksi waktu sholat dan manual override per tanggal.
9. Display TV horizontal modern.
10. Alarm adzan dan countdown iqamah.
11. Running text.
12. Slide gambar.
13. Device pairing sederhana.
14. Superadmin kelola masjid dan admin.
15. Paket harga bulanan/tahunan manual.

### Phase 2 - Konten dan Operasional

1. Jumbotron builder.
2. YouTube video.
3. Mode Jumat lengkap.
4. Event countdown.
5. Template/theme selector.
6. Offline cache.
7. Audit log.
8. Statistik device.

### Phase 3 - Monetisasi dan Premium

1. Payment gateway.
2. Invoice otomatis.
3. Reminder WhatsApp/email.
4. Template premium.
5. Donasi/QRIS.
6. Multi-display per masjid.
7. Custom branding.

---

## 12. Catatan Penting Terkait Referensi dan Cookie

Cookie/session yang pernah dibagikan dalam percakapan berisi token login WordPress/dashboard. Untuk keamanan:

1. Jangan pernah commit cookie/session ke repository.
2. Jangan gunakan cookie tersebut untuk scraping atau akses dashboard privat.
3. Logout dari akun terkait agar session lama invalid.
4. Jika memungkinkan, ganti password akun.
5. Pastikan cookie dashboard project ini memakai `HttpOnly`, `Secure`, dan `SameSite`.

Referensi `masaj.id` sebaiknya digunakan hanya untuk mempelajari pola fitur dan pengalaman pengguna secara legal dari halaman publik, bukan menyalin aset, data privat, atau konten berhak cipta.

---

## 13. Checklist Kualitas Sebelum Launching

### Display TV

- [ ] Jadwal sholat terlihat jelas di TV 32 inch.
- [ ] Countdown adzan dan iqamah akurat.
- [ ] Tampilan tetap stabil selama 24 jam.
- [ ] Offline mode berjalan.
- [ ] Slide tidak patah/terdistorsi.
- [ ] Running text terbaca jelas.
- [ ] Mode Jumat berjalan otomatis.
- [ ] Mode hemat energi sesuai jadwal.

### Admin

- [ ] Admin bisa mengatur lokasi masjid.
- [ ] Admin bisa koreksi waktu sholat.
- [ ] Admin bisa upload slide.
- [ ] Admin bisa mengatur running text.
- [ ] Admin bisa preview tampilan TV.
- [ ] Admin bisa pairing/revoke perangkat.

### Superadmin

- [ ] Bisa membuat tenant masjid.
- [ ] Bisa membuat admin masjid.
- [ ] Bisa mengatur paket berlangganan.
- [ ] Bisa melihat status perangkat.
- [ ] Bisa suspend/aktifkan masjid.

### Security

- [ ] HTTPS aktif.
- [ ] Password di-hash.
- [ ] RBAC berjalan.
- [ ] CSRF protection aktif.
- [ ] Upload tervalidasi.
- [ ] Audit log aktif.
- [ ] Backup database aktif.
- [ ] Cookie aman.

---

## 14. Kesimpulan

Project Display TV Masjid ini sangat layak dikembangkan sebagai SaaS untuk masjid karena kebutuhan informasinya jelas, rutin digunakan setiap hari, dan memiliki nilai manfaat tinggi bagi jamaah. Fokus awal terbaik adalah membuat **Display TV Horizontal Modern** yang sangat terbaca, stabil, dan mudah dikelola admin. Setelah MVP kuat, fitur premium seperti template tambahan, payment gateway, QRIS donasi, statistik display, dan WhatsApp notification dapat menjadi pembeda utama dari kompetitor.
