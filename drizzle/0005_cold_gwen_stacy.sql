CREATE TABLE `global_prayer_config` (
	`id` int NOT NULL DEFAULT 1,
	`primary_provider_id` bigint unsigned,
	`fallback_provider_id` bigint unsigned,
	`default_method_id` bigint unsigned,
	`default_timezone` varchar(64) NOT NULL DEFAULT 'Asia/Jakarta',
	`api_key` varchar(255),
	`sync_frequency` enum('daily','weekly','manual') NOT NULL DEFAULT 'daily',
	`sync_time` time NOT NULL DEFAULT '03:00:00',
	`lock_provider` int NOT NULL DEFAULT 0,
	`lock_method` int NOT NULL DEFAULT 0,
	`updated_by` char(36),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `global_prayer_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holiday_templates` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`event_type` varchar(64) NOT NULL,
	`description` text,
	`slide_config_json` json,
	`palette_json` json,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `holiday_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platform_announcements` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`content` text,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`target_audience` enum('all','admins','superadmins') NOT NULL DEFAULT 'all',
	`start_at` datetime,
	`end_at` datetime,
	`is_active` int NOT NULL DEFAULT 1,
	`created_by` char(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `global_prayer_config` ADD CONSTRAINT `global_prayer_config_primary_provider_id_prayer_providers_id_fk` FOREIGN KEY (`primary_provider_id`) REFERENCES `prayer_providers`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `global_prayer_config` ADD CONSTRAINT `global_prayer_config_fallback_provider_id_prayer_providers_id_fk` FOREIGN KEY (`fallback_provider_id`) REFERENCES `prayer_providers`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `global_prayer_config` ADD CONSTRAINT `gpc_default_method_id_fk` FOREIGN KEY (`default_method_id`) REFERENCES `prayer_calculation_methods`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `global_prayer_config` ADD CONSTRAINT `global_prayer_config_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `platform_announcements` ADD CONSTRAINT `platform_announcements_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
