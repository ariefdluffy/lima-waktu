-- ============================================================
-- Seed: Prayer Providers & Calculation Methods
-- Jalankan di database server:
--   mysql -u user -p nama_database < scripts/seed-prayer-providers.sql
-- ============================================================

-- 1. Provider
INSERT IGNORE INTO prayer_providers (provider_key, name, base_url, is_active)
VALUES
    ('manual',  'Manual Input', NULL,                               1),
    ('aladhan', 'Aladhan',      'https://api.aladhan.com/v1',       1),
    ('myquran', 'MyQuran',      'https://api.myquran.com/v2',       1);

-- 2. Metode untuk Manual Input
INSERT IGNORE INTO prayer_calculation_methods (provider_id, method_code, method_name, params, is_active)
SELECT id, 'manual-default', 'Manual Default', JSON_OBJECT('timezone', 'Asia/Jakarta'), 1
FROM prayer_providers
WHERE provider_key = 'manual';

-- 3. Metode untuk Aladhan
INSERT IGNORE INTO prayer_calculation_methods (provider_id, method_code, method_name, params, is_active)
SELECT id, '3',  'Muslim World League (MWL)',                  JSON_OBJECT('fajr_angle', 18,   'isha_angle', 17), 1
FROM prayer_providers WHERE provider_key = 'aladhan';

INSERT IGNORE INTO prayer_calculation_methods (provider_id, method_code, method_name, params, is_active)
SELECT id, '1',  'University of Islamic Sciences, Karachi',    JSON_OBJECT('fajr_angle', 18,   'isha_angle', 18), 1
FROM prayer_providers WHERE provider_key = 'aladhan';

INSERT IGNORE INTO prayer_calculation_methods (provider_id, method_code, method_name, params, is_active)
SELECT id, '2',  'ISNA (Islamic Society of North America)',    JSON_OBJECT('fajr_angle', 15,   'isha_angle', 15), 1
FROM prayer_providers WHERE provider_key = 'aladhan';

INSERT IGNORE INTO prayer_calculation_methods (provider_id, method_code, method_name, params, is_active)
SELECT id, '15', 'Moonsighting Committee (Kemenag/MUI)',       JSON_OBJECT('fajr_angle', 18,   'isha_angle', 18), 1
FROM prayer_providers WHERE provider_key = 'aladhan';

INSERT IGNORE INTO prayer_calculation_methods (provider_id, method_code, method_name, params, is_active)
SELECT id, '20', 'MWL 18/17 (Kemenag)',                       JSON_OBJECT('fajr_angle', 18,   'isha_angle', 17), 1
FROM prayer_providers WHERE provider_key = 'aladhan';

INSERT IGNORE INTO prayer_calculation_methods (provider_id, method_code, method_name, params, is_active)
SELECT id, '5',  'Egyptian General Authority of Survey',       JSON_OBJECT('fajr_angle', 19.5, 'isha_angle', 17.5), 1
FROM prayer_providers WHERE provider_key = 'aladhan';

INSERT IGNORE INTO prayer_calculation_methods (provider_id, method_code, method_name, params, is_active)
SELECT id, '4',  'Umm Al-Qura (Mekkah)',                      JSON_OBJECT('fajr_angle', 18.5), 1
FROM prayer_providers WHERE provider_key = 'aladhan';
