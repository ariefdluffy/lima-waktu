ALTER TABLE `devices` ADD `theme_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `masjids` ADD `adzan_screen_duration` int DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE `devices` ADD CONSTRAINT `devices_theme_id_themes_id_fk` FOREIGN KEY (`theme_id`) REFERENCES `themes`(`id`) ON DELETE set null ON UPDATE no action;