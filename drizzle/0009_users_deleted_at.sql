-- Tambah kolom deleted_at di tabel users (soft delete)
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='deleted_at' AND TABLE_SCHEMA=DATABASE());
SET @sql = IF(@col = 0, 'ALTER TABLE `users` ADD `deleted_at` datetime NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
