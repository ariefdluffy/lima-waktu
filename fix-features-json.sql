-- Fix: pricing_plans.features_json
-- Mengubah nilai string CSV menjadi JSON array yang benar
-- Generated: 2026-05-27
-- Jalankan di server production sebelum deploy kode terbaru

UPDATE `pricing_plans`
SET `features_json` = '["1 device display","Jadwal sholat manual","Running text dasar","Support Admin"]'
WHERE `id` = 1;

UPDATE `pricing_plans`
SET `features_json` = '["3 device display","Jadwal sholat otomatis","Slide gambar & jumbotron","Running text unlimited","Mode Sholat Jumat","Event countdown","Support prioritas"]'
WHERE `id` = 2;

UPDATE `pricing_plans`
SET `features_json` = '["Unlimited device","Semua fitur Masjid","Upload media","YouTube integration","Tema custom","Laporan & statistik","Dedicated support"]'
WHERE `id` = 3;

-- Verifikasi (opsional, jalankan setelah UPDATE):
-- SELECT id, name, features_json FROM pricing_plans ORDER BY id;
