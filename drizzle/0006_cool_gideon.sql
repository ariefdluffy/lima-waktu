CREATE TABLE IF NOT EXISTS `password_resets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` char(36) NOT NULL,
	`token` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`)
);

-- Cek & tambah kolom screensaver_morning_delay_minutes
SET @col1 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='masjids' AND COLUMN_NAME='screensaver_morning_delay_minutes' AND TABLE_SCHEMA=DATABASE());
SET @sql1 = IF(@col1 = 0, 'ALTER TABLE `masjids` ADD `screensaver_morning_delay_minutes` int DEFAULT 60 NOT NULL', 'SELECT 1');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Cek & tambah kolom screensaver_morning_wake_minutes
SET @col2 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='masjids' AND COLUMN_NAME='screensaver_morning_wake_minutes' AND TABLE_SCHEMA=DATABASE());
SET @sql2 = IF(@col2 = 0, 'ALTER TABLE `masjids` ADD `screensaver_morning_wake_minutes` int DEFAULT 120 NOT NULL', 'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Cek & tambah kolom max_devices di pricing_plans
SET @col3 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='pricing_plans' AND COLUMN_NAME='max_devices' AND TABLE_SCHEMA=DATABASE());
SET @sql3 = IF(@col3 = 0, 'ALTER TABLE `pricing_plans` ADD `max_devices` int DEFAULT 1 NOT NULL', 'SELECT 1');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Cek & tambah kolom max_devices di subscriptions
SET @col4 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME='subscriptions' AND COLUMN_NAME='max_devices' AND TABLE_SCHEMA=DATABASE());
SET @sql4 = IF(@col4 = 0, 'ALTER TABLE `subscriptions` ADD `max_devices` int DEFAULT 1 NOT NULL', 'SELECT 1');
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- Cek & tambah FK password_resets
SET @fk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME='password_resets' AND CONSTRAINT_NAME='password_resets_user_id_users_id_fk' AND TABLE_SCHEMA=DATABASE());
SET @sql5 = IF(@fk = 0, 'ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action', 'SELECT 1');
PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;
