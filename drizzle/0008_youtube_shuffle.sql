-- Tambah kolom youtube_shuffle di tabel masjids (default 0 = nonaktif / urutan sesuai admin)
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='masjids' AND COLUMN_NAME='youtube_shuffle' AND TABLE_SCHEMA=DATABASE());
SET @sql = IF(@col = 0, 'ALTER TABLE `masjids` ADD `youtube_shuffle` int DEFAULT 0 NOT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
