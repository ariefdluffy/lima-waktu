CREATE TABLE `password_resets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` char(36) NOT NULL,
	`token` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `masjids` ADD `screensaver_morning_delay_minutes` int DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE `masjids` ADD `screensaver_morning_wake_minutes` int DEFAULT 120 NOT NULL;--> statement-breakpoint
ALTER TABLE `pricing_plans` ADD `max_devices` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `max_devices` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;