import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL belum terisi. Jalankan: node --env-file=.env.local scripts/db-seed.mjs",
  );
}

const conn = await mysql.createConnection(databaseUrl);

const superadminId = "00000000-0000-0000-0000-000000000001";
const adminMasjidId = "00000000-0000-0000-0000-000000000002";
const masjidId = "10000000-0000-0000-0000-000000000001";
const deviceId = "20000000-0000-0000-0000-000000000001";

await conn.beginTransaction();

try {
  await conn.query(`
		INSERT INTO roles (code, name, description)
		VALUES
			('superadmin', 'Superadmin', 'Pengelola platform global'),
			('admin_masjid', 'Admin Masjid', 'Pengelola operasional masjid')
		ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
	`);

  await conn.query(`
		INSERT INTO permissions (code, name, description)
		VALUES
			('masjid.manage', 'Kelola Masjid', 'Mengelola profil dan pengaturan masjid'),
			('display.manage', 'Kelola Display', 'Mengelola device, slide, dan running text'),
			('schedule.manage', 'Kelola Jadwal', 'Mengelola jadwal sholat dan koreksi'),
			('billing.manage', 'Kelola Billing', 'Mengelola subscription dan invoice')
		ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
	`);

  await conn.query(`
		INSERT IGNORE INTO role_permissions (role_id, permission_id)
		SELECT r.id, p.id
		FROM roles r
		JOIN permissions p
		WHERE r.code = 'superadmin'
	`);

  await conn.query(`
		INSERT IGNORE INTO role_permissions (role_id, permission_id)
		SELECT r.id, p.id
		FROM roles r
		JOIN permissions p ON p.code IN ('masjid.manage', 'display.manage', 'schedule.manage')
		WHERE r.code = 'admin_masjid'
	`);

  await conn.query(
    `
		INSERT INTO users (id, email, password_hash, full_name, phone, is_active)
		VALUES
			(?, 'superadmin@limawaktu.local', 'change_me', 'Superadmin Lima Waktu', '628111111111', 1),
			(?, 'admin@masjid.local', 'change_me', 'Admin Masjid Contoh', '628222222222', 1)
		ON DUPLICATE KEY UPDATE
			email = VALUES(email),
			full_name = VALUES(full_name),
			phone = VALUES(phone),
			is_active = VALUES(is_active)
	`,
    [superadminId, adminMasjidId],
  );

  await conn.query(
    `
		INSERT IGNORE INTO user_roles (user_id, role_id)
		SELECT ?, id FROM roles WHERE code = 'superadmin'
	`,
    [superadminId],
  );

  await conn.query(
    `
		INSERT IGNORE INTO user_roles (user_id, role_id)
		SELECT ?, id FROM roles WHERE code = 'admin_masjid'
	`,
    [adminMasjidId],
  );

  await conn.query(
    `
		INSERT INTO masjids (id, name, address, city, district, province, latitude, longitude, timezone, is_active)
		VALUES (?, 'Masjid Raya Lima Waktu', 'Jl. Contoh No. 1', 'Jakarta Selatan', 'Kebayoran', 'DKI Jakarta', -6.2446691, 106.8001459, 'Asia/Jakarta', 1)
		ON DUPLICATE KEY UPDATE
			name = VALUES(name),
			address = VALUES(address),
			city = VALUES(city),
			district = VALUES(district),
			province = VALUES(province),
			latitude = VALUES(latitude),
			longitude = VALUES(longitude),
			timezone = VALUES(timezone),
			is_active = VALUES(is_active)
	`,
    [masjidId],
  );

  await conn.query(
    `
		INSERT INTO masjid_users (masjid_id, user_id, role_scope, is_active)
		VALUES (?, ?, 'owner', 1)
		ON DUPLICATE KEY UPDATE role_scope = VALUES(role_scope), is_active = VALUES(is_active)
	`,
    [masjidId, adminMasjidId],
  );

  await conn.query(
    `
		INSERT INTO devices (id, masjid_id, device_code, name, orientation, status, paired_at, is_active)
		VALUES (?, ?, 'LWTV-001', 'TV Utama Ruang Sholat', 'horizontal', 'unknown', NOW(), 1)
		ON DUPLICATE KEY UPDATE
			name = VALUES(name),
			orientation = VALUES(orientation),
			status = VALUES(status),
			paired_at = VALUES(paired_at),
			is_active = VALUES(is_active)
	`,
    [deviceId, masjidId],
  );

  await conn.query(
    `
		INSERT INTO running_texts (masjid_id, content, speed, is_active)
		VALUES (?, 'Selamat datang di Masjid Raya Lima Waktu. Mohon menonaktifkan nada dering ponsel.', 60, 1)
	`,
    [masjidId],
  );

  await conn.query(
    `
		INSERT INTO subscriptions (masjid_id, package_name, billing_cycle, status, start_date, end_date, price, auto_renew)
		VALUES (?, 'MVP Manual', 'monthly', 'active', CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY), 0.00, 0)
	`,
    [masjidId],
  );

  await conn.query(`
		INSERT INTO pricing_plans (name, badge, price_monthly, price_yearly, price_note, features_json, cta_label, cta_href, is_highlight, is_active, sort_order)
		VALUES
			('Starter', NULL, 0.00, 0.00, 'selamanya', JSON_ARRAY('1 device display','Jadwal sholat manual','Running text dasar','Support komunitas'), 'Mulai Gratis', '/auth/login', 0, 1, 1),
			('Masjid', 'POPULER', 99000.00, 990000.00, '/ bulan atau Rp 990.000 / tahun', JSON_ARRAY('3 device display','Jadwal sholat otomatis','Slide gambar & jumbotron','Running text unlimited','Mode Sholat Jumat','Event countdown','Support prioritas'), 'Pilih Paket Ini', '/auth/login', 1, 1, 2),
			('Premium', NULL, 199000.00, 1990000.00, '/ bulan atau Rp 1.990.000 / tahun', JSON_ARRAY('Unlimited device','Semua fitur Masjid','Upload media','YouTube integration','Tema custom','Laporan & statistik','Dedicated support'), 'Hubungi Kami', '/auth/login', 0, 1, 3)
		ON DUPLICATE KEY UPDATE
			badge = VALUES(badge),
			price_monthly = VALUES(price_monthly),
			price_yearly = VALUES(price_yearly),
			price_note = VALUES(price_note),
			features_json = VALUES(features_json),
			cta_label = VALUES(cta_label),
			cta_href = VALUES(cta_href),
			is_highlight = VALUES(is_highlight),
			is_active = VALUES(is_active),
			sort_order = VALUES(sort_order)
	`);

  await conn.query(`
		INSERT INTO prayer_providers (provider_key, name, base_url, is_active)
		VALUES ('manual', 'Manual Input', NULL, 1)
		ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active)
	`);

  await conn.query(`
		INSERT INTO prayer_calculation_methods (provider_id, method_code, method_name, params, is_active)
		SELECT id, 'manual-default', 'Manual Default', JSON_OBJECT('timezone', 'Asia/Jakarta'), 1
		FROM prayer_providers
		WHERE provider_key = 'manual'
		ON DUPLICATE KEY UPDATE method_name = VALUES(method_name), params = VALUES(params), is_active = VALUES(is_active)
	`);

  await conn.query(
    `
		INSERT INTO iqamah_settings (masjid_id, prayer_name, delay_minutes, enabled, updated_by)
		VALUES
			(?, 'subuh', 15, 1, ?),
			(?, 'dzuhur', 10, 1, ?),
			(?, 'ashar', 10, 1, ?),
			(?, 'maghrib', 7, 1, ?),
			(?, 'isya', 10, 1, ?),
			(?, 'jumat', 20, 1, ?)
		ON DUPLICATE KEY UPDATE delay_minutes = VALUES(delay_minutes), enabled = VALUES(enabled), updated_by = VALUES(updated_by)
	`,
    [
      masjidId,
      adminMasjidId,
      masjidId,
      adminMasjidId,
      masjidId,
      adminMasjidId,
      masjidId,
      adminMasjidId,
      masjidId,
      adminMasjidId,
      masjidId,
      adminMasjidId,
    ],
  );

  // Seed default themes (global)
  const themesPalettes = {
    "modern-minimalis": JSON.stringify({
      bgPrimary: "#0a0f1e",
      bgSecondary: "rgba(0,0,0,0.2)",
      bgOverlay: "rgba(0,0,0,0.35)",
      textPrimary: "#fff",
      textSecondary: "rgba(255,255,255,0.55)",
      textMuted: "rgba(255,255,255,0.35)",
      accentPrimary: "#f0d080",
      accentSecondary: "#c8a84b",
      accentMuted: "rgba(200,168,75,0.6)",
      borderColor: "rgba(255,255,255,0.08)",
      borderAccent: "rgba(200,168,75,0.2)",
      fontHeading: "'Cinzel',serif",
      fontBody: "'Inter',sans-serif",
      fontArabic: "'Noto Naskh Arabic',serif",
      borderRadius: "10px",
      cardBg: "rgba(255,255,255,0.04)",
      cardBorder: "rgba(255,255,255,0.1)",
      prayerActiveBg: "rgba(200,168,75,0.12)",
      prayerActiveBorder: "rgba(200,168,75,0.6)",
      prayerActiveGlow: "rgba(200,168,75,0.25)",
      headerBg: "transparent",
      runningBarBg: "rgba(200,168,75,0.12)",
      runningBarBorder: "rgba(200,168,75,0.3)",
      progressFill: "linear-gradient(90deg,#c8a84b,#f0d080)",
      screensaverBg:
        "radial-gradient(ellipse at center,rgba(0,30,20,0.95) 0%,rgba(0,10,5,0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center,rgba(5,5,30,0.97) 0%,rgba(0,0,10,0.99) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center,rgba(0,70,35,0.96) 0%,rgba(0,20,8,0.99) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center,rgba(10,5,30,0.97) 0%,rgba(0,0,0,0.99) 100%)",
      topBarColor: "transparent",
      bgStars: "#fff",
      bgGrid: "rgba(200,168,75,0.06)",
    }),
    "classic-islamic": JSON.stringify({
      bgPrimary: "#1a3c2a",
      bgSecondary: "rgba(0,0,0,0.15)",
      bgOverlay: "rgba(0,0,0,0.3)",
      textPrimary: "#f5efe6",
      textSecondary: "rgba(245,239,230,0.65)",
      textMuted: "rgba(245,239,230,0.4)",
      accentPrimary: "#d4a853",
      accentSecondary: "#b8943e",
      accentMuted: "rgba(212,168,83,0.5)",
      borderColor: "rgba(212,168,83,0.12)",
      borderAccent: "rgba(212,168,83,0.25)",
      fontHeading: "'Amiri',serif",
      fontBody: "'IBM Plex Sans',sans-serif",
      fontArabic: "'Amiri',serif",
      borderRadius: "6px",
      cardBg: "rgba(245,239,230,0.04)",
      cardBorder: "rgba(212,168,83,0.15)",
      prayerActiveBg: "rgba(212,168,83,0.15)",
      prayerActiveBorder: "rgba(212,168,83,0.5)",
      prayerActiveGlow: "rgba(212,168,83,0.2)",
      headerBg: "rgba(0,0,0,0.25)",
      runningBarBg: "rgba(212,168,83,0.1)",
      runningBarBorder: "rgba(212,168,83,0.25)",
      progressFill: "linear-gradient(90deg,#b8943e,#d4a853)",
      screensaverBg:
        "radial-gradient(ellipse at center,rgba(26,60,42,0.95) 0%,rgba(10,30,15,0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center,rgba(15,30,25,0.97) 0%,rgba(5,15,10,0.99) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center,rgba(0,60,40,0.96) 0%,rgba(0,20,10,0.99) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center,rgba(8,5,25,0.97) 0%,rgba(0,0,0,0.99) 100%)",
      topBarColor: "#d4a853",
      bgStars: "rgba(212,168,83,0.3)",
      bgGrid: "rgba(212,168,83,0.04)",
    }),
    "dark-premium": JSON.stringify({
      bgPrimary: "#080c14",
      bgSecondary: "rgba(255,255,255,0.02)",
      bgOverlay: "rgba(0,0,0,0.4)",
      textPrimary: "#e8ecf1",
      textSecondary: "rgba(232,236,241,0.5)",
      textMuted: "rgba(232,236,241,0.3)",
      accentPrimary: "#5dade2",
      accentSecondary: "#2e86c1",
      accentMuted: "rgba(93,173,226,0.5)",
      borderColor: "rgba(232,236,241,0.06)",
      borderAccent: "rgba(93,173,226,0.2)",
      fontHeading: "'Montserrat',sans-serif",
      fontBody: "'Inter',sans-serif",
      fontArabic: "'Noto Naskh Arabic',serif",
      borderRadius: "12px",
      cardBg: "rgba(255,255,255,0.03)",
      cardBorder: "rgba(255,255,255,0.06)",
      prayerActiveBg: "rgba(93,173,226,0.1)",
      prayerActiveBorder: "rgba(93,173,226,0.5)",
      prayerActiveGlow: "rgba(93,173,226,0.2)",
      headerBg: "rgba(255,255,255,0.02)",
      runningBarBg: "rgba(93,173,226,0.08)",
      runningBarBorder: "rgba(93,173,226,0.25)",
      progressFill: "linear-gradient(90deg,#2e86c1,#5dade2)",
      screensaverBg:
        "radial-gradient(ellipse at center,rgba(8,12,20,0.97) 0%,rgba(0,0,0,0.99) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center,rgba(10,8,25,0.97) 0%,rgba(0,0,10,0.99) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center,rgba(0,30,60,0.96) 0%,rgba(0,10,20,0.99) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center,rgba(5,3,25,0.97) 0%,rgba(0,0,0,0.99) 100%)",
      topBarColor: "#2e86c1",
      bgStars: "rgba(93,173,226,0.3)",
      bgGrid: "rgba(93,173,226,0.04)",
    }),
    "green-mosque": JSON.stringify({
      bgPrimary: "#0d2818",
      bgSecondary: "rgba(0,0,0,0.1)",
      bgOverlay: "rgba(0,0,0,0.3)",
      textPrimary: "#e8f5e9",
      textSecondary: "rgba(232,245,233,0.6)",
      textMuted: "rgba(232,245,233,0.35)",
      accentPrimary: "#66bb6a",
      accentSecondary: "#43a047",
      accentMuted: "rgba(102,187,106,0.5)",
      borderColor: "rgba(102,187,106,0.1)",
      borderAccent: "rgba(102,187,106,0.25)",
      fontHeading: "'Poppins',sans-serif",
      fontBody: "'Inter',sans-serif",
      fontArabic: "'Noto Naskh Arabic',serif",
      borderRadius: "8px",
      cardBg: "rgba(232,245,233,0.05)",
      cardBorder: "rgba(102,187,106,0.12)",
      prayerActiveBg: "rgba(102,187,106,0.15)",
      prayerActiveBorder: "rgba(102,187,106,0.5)",
      prayerActiveGlow: "rgba(102,187,106,0.2)",
      headerBg: "rgba(0,0,0,0.2)",
      runningBarBg: "rgba(102,187,106,0.1)",
      runningBarBorder: "rgba(102,187,106,0.3)",
      progressFill: "linear-gradient(90deg,#43a047,#66bb6a)",
      screensaverBg:
        "radial-gradient(ellipse at center,rgba(13,40,24,0.95) 0%,rgba(5,15,8,0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center,rgba(10,25,18,0.97) 0%,rgba(3,10,5,0.99) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center,rgba(0,60,30,0.96) 0%,rgba(0,20,8,0.99) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center,rgba(8,5,20,0.97) 0%,rgba(0,0,0,0.99) 100%)",
      topBarColor: "#66bb6a",
      bgStars: "rgba(102,187,106,0.3)",
      bgGrid: "rgba(102,187,106,0.04)",
    }),
    ramadan: JSON.stringify({
      bgPrimary: "#1a1030",
      bgSecondary: "rgba(0,0,0,0.2)",
      bgOverlay: "rgba(0,0,0,0.35)",
      textPrimary: "#faf5e8",
      textSecondary: "rgba(250,245,232,0.6)",
      textMuted: "rgba(250,245,232,0.35)",
      accentPrimary: "#daa520",
      accentSecondary: "#c5941a",
      accentMuted: "rgba(218,165,32,0.5)",
      borderColor: "rgba(218,165,32,0.12)",
      borderAccent: "rgba(218,165,32,0.25)",
      fontHeading: "'Cinzel',serif",
      fontBody: "'Inter',sans-serif",
      fontArabic: "'Noto Naskh Arabic',serif",
      borderRadius: "10px",
      cardBg: "rgba(250,245,232,0.04)",
      cardBorder: "rgba(218,165,32,0.15)",
      prayerActiveBg: "rgba(218,165,32,0.15)",
      prayerActiveBorder: "rgba(218,165,32,0.55)",
      prayerActiveGlow: "rgba(218,165,32,0.3)",
      headerBg: "rgba(0,0,0,0.3)",
      runningBarBg: "rgba(218,165,32,0.12)",
      runningBarBorder: "rgba(218,165,32,0.35)",
      progressFill: "linear-gradient(90deg,#c5941a,#daa520)",
      screensaverBg:
        "radial-gradient(ellipse at center,rgba(26,16,48,0.95) 0%,rgba(8,5,15,0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center,rgba(20,10,40,0.97) 0%,rgba(5,2,15,0.99) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center,rgba(40,20,60,0.96) 0%,rgba(10,5,20,0.99) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center,rgba(15,5,35,0.97) 0%,rgba(0,0,0,0.99) 100%)",
      topBarColor: "#daa520",
      bgStars: "rgba(218,165,32,0.35)",
      bgGrid: "rgba(218,165,32,0.05)",
    }),
    jumat: JSON.stringify({
      bgPrimary: "#0d1f2d",
      bgSecondary: "rgba(0,0,0,0.2)",
      bgOverlay: "rgba(0,0,0,0.35)",
      textPrimary: "#ecf0f1",
      textSecondary: "rgba(236,240,241,0.6)",
      textMuted: "rgba(236,240,241,0.35)",
      accentPrimary: "#e8c95a",
      accentSecondary: "#d4a843",
      accentMuted: "rgba(232,201,90,0.5)",
      borderColor: "rgba(232,201,90,0.1)",
      borderAccent: "rgba(232,201,90,0.2)",
      fontHeading: "'Scheherazade New',serif",
      fontBody: "'IBM Plex Sans',sans-serif",
      fontArabic: "'Scheherazade New',serif",
      borderRadius: "6px",
      cardBg: "rgba(236,240,241,0.04)",
      cardBorder: "rgba(232,201,90,0.12)",
      prayerActiveBg: "rgba(232,201,90,0.12)",
      prayerActiveBorder: "rgba(232,201,90,0.5)",
      prayerActiveGlow: "rgba(232,201,90,0.2)",
      headerBg: "rgba(0,0,0,0.2)",
      runningBarBg: "rgba(232,201,90,0.1)",
      runningBarBorder: "rgba(232,201,90,0.25)",
      progressFill: "linear-gradient(90deg,#d4a843,#e8c95a)",
      screensaverBg:
        "radial-gradient(ellipse at center,rgba(13,31,45,0.95) 0%,rgba(5,10,15,0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center,rgba(10,20,30,0.97) 0%,rgba(3,8,12,0.99) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center,rgba(0,40,50,0.96) 0%,rgba(0,15,18,0.99) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center,rgba(5,5,20,0.97) 0%,rgba(0,0,0,0.99) 100%)",
      topBarColor: "#e8c95a",
      bgStars: "rgba(232,201,90,0.3)",
      bgGrid: "rgba(232,201,90,0.04)",
    }),
    eid: JSON.stringify({
      bgPrimary: "#1b0a2e",
      bgSecondary: "rgba(0,0,0,0.15)",
      bgOverlay: "rgba(0,0,0,0.3)",
      textPrimary: "#fdf5e6",
      textSecondary: "rgba(253,245,230,0.6)",
      textMuted: "rgba(253,245,230,0.35)",
      accentPrimary: "#f39c12",
      accentSecondary: "#e67e22",
      accentMuted: "rgba(243,156,18,0.5)",
      borderColor: "rgba(243,156,18,0.1)",
      borderAccent: "rgba(243,156,18,0.2)",
      fontHeading: "'Playfair Display',serif",
      fontBody: "'Inter',sans-serif",
      fontArabic: "'Amiri',serif",
      borderRadius: "14px",
      cardBg: "rgba(253,245,230,0.04)",
      cardBorder: "rgba(243,156,18,0.15)",
      prayerActiveBg: "rgba(243,156,18,0.15)",
      prayerActiveBorder: "rgba(243,156,18,0.5)",
      prayerActiveGlow: "rgba(243,156,18,0.25)",
      headerBg: "rgba(0,0,0,0.25)",
      runningBarBg: "rgba(243,156,18,0.1)",
      runningBarBorder: "rgba(243,156,18,0.3)",
      progressFill: "linear-gradient(90deg,#e67e22,#f39c12)",
      screensaverBg:
        "radial-gradient(ellipse at center,rgba(27,10,46,0.95) 0%,rgba(8,3,15,0.98) 100%)",
      tahajudBg:
        "radial-gradient(ellipse at center,rgba(20,10,35,0.97) 0%,rgba(5,2,10,0.99) 100%)",
      moodIqamahBg:
        "radial-gradient(ellipse at center,rgba(30,15,50,0.96) 0%,rgba(8,5,15,0.99) 100%)",
      moodKhusukBg:
        "radial-gradient(ellipse at center,rgba(12,5,25,0.97) 0%,rgba(0,0,0,0.99) 100%)",
      topBarColor: "#f39c12",
      bgStars: "rgba(243,156,18,0.35)",
      bgGrid: "rgba(243,156,18,0.05)",
    }),
  };
  const defaultLayout = JSON.stringify({
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
  });
  for (const [key, name] of Object.entries({
    "modern-minimalis": "Modern Minimalis",
    "classic-islamic": "Classic Islamic",
    "dark-premium": "Dark Premium",
    "green-mosque": "Green Mosque",
    ramadan: "Ramadan",
    jumat: "Jumat",
    eid: "Eid",
  })) {
    await conn.query(
      `INSERT INTO themes (theme_key, name, palette_json, layout_json, is_global, is_active)
       VALUES (?, ?, ?, ?, 1, 1)
       ON DUPLICATE KEY UPDATE name = VALUES(name), palette_json = VALUES(palette_json), layout_json = VALUES(layout_json), is_global = VALUES(is_global), is_active = VALUES(is_active)`,
      [key, name, themesPalettes[key], defaultLayout],
    );
  }

  await conn.commit();
  console.log("Seed database selesai.");
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  await conn.end();
}
