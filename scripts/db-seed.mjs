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

  await conn.commit();
  console.log("Seed database selesai.");
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  await conn.end();
}
