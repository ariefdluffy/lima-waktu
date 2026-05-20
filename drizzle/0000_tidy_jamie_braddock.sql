CREATE TABLE `audit_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36),
	`user_id` char(36),
	`action` varchar(120) NOT NULL,
	`entity` varchar(120) NOT NULL,
	`entity_id` varchar(64),
	`changes_json` json,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` char(36) NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`device_code` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`orientation` enum('horizontal','vertical') NOT NULL DEFAULT 'horizontal',
	`status` enum('online','offline','unknown') NOT NULL DEFAULT 'unknown',
	`last_seen_at` datetime,
	`paired_at` datetime,
	`is_active` int NOT NULL DEFAULT 1,
	`layout_mode` enum('default','youtube') NOT NULL DEFAULT 'default',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_code_uq` UNIQUE(`device_code`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`event_date` date NOT NULL,
	`event_time` time,
	`countdown_enabled` int NOT NULL DEFAULT 1,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`subscription_id` bigint unsigned NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`invoice_no` varchar(80) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`status` enum('draft','pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
	`due_date` date,
	`paid_at` datetime,
	`payment_method` varchar(64),
	`external_ref` varchar(120),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoice_no_uq` UNIQUE(`invoice_no`)
);
--> statement-breakpoint
CREATE TABLE `iqamah_settings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`prayer_name` enum('subuh','dzuhur','ashar','maghrib','isya','jumat') NOT NULL,
	`delay_minutes` int NOT NULL DEFAULT 10,
	`enabled` int NOT NULL DEFAULT 1,
	`updated_by` char(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `iqamah_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `iqamah_settings_masjid_prayer_uq` UNIQUE(`masjid_id`,`prayer_name`)
);
--> statement-breakpoint
CREATE TABLE `jumbotrons` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`title` varchar(160),
	`content` text,
	`background_url` varchar(255),
	`is_active` int NOT NULL DEFAULT 1,
	`start_at` datetime,
	`end_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jumbotrons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `masjid_users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`role_scope` enum('owner','admin','editor','operator','viewer') NOT NULL DEFAULT 'admin',
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `masjid_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `masjid_users_unique` UNIQUE(`masjid_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `masjids` (
	`id` char(36) NOT NULL,
	`name` varchar(200) NOT NULL,
	`address` text,
	`city` varchar(120),
	`district` varchar(120),
	`province` varchar(120),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Jakarta',
	`hijri_offset` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `masjids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`file_url` varchar(255) NOT NULL,
	`file_type` enum('image','video') NOT NULL DEFAULT 'image',
	`mime_type` varchar(120),
	`size_bytes` bigint unsigned,
	`title` varchar(160),
	`uploaded_by` char(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_code_uq` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `prayer_calculation_methods` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`provider_id` bigint unsigned,
	`method_code` varchar(64) NOT NULL,
	`method_name` varchar(120) NOT NULL,
	`params` json,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prayer_calculation_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `prayer_method_code_uq` UNIQUE(`method_code`)
);
--> statement-breakpoint
CREATE TABLE `prayer_corrections` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`prayer_name` enum('imsak','subuh','sunrise','dhuha','dzuhur','ashar','maghrib','isya') NOT NULL,
	`offset_minutes` int NOT NULL DEFAULT 0,
	`reason` text,
	`active_from` date,
	`active_until` date,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prayer_corrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prayer_overrides` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`schedule_date` date NOT NULL,
	`prayer_name` enum('imsak','subuh','sunrise','dhuha','dzuhur','ashar','maghrib','isya') NOT NULL,
	`override_time` time NOT NULL,
	`reason` text,
	`created_by` char(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prayer_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `prayer_override_unique` UNIQUE(`masjid_id`,`schedule_date`,`prayer_name`)
);
--> statement-breakpoint
CREATE TABLE `prayer_provider_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`provider_id` bigint unsigned,
	`request_path` varchar(255),
	`request_payload` json,
	`response_status` int,
	`response_payload` json,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prayer_provider_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prayer_providers` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`provider_key` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`base_url` varchar(255),
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prayer_providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `prayer_providers_key_uq` UNIQUE(`provider_key`)
);
--> statement-breakpoint
CREATE TABLE `prayer_schedule_raw_sources` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`schedule_date` date NOT NULL,
	`provider_key` varchar(64) NOT NULL,
	`payload` json,
	`fetched_at` datetime NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prayer_schedule_raw_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prayer_schedules` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`schedule_date` date NOT NULL,
	`imsak_time` time NOT NULL,
	`subuh_time` time NOT NULL,
	`sunrise_time` time NOT NULL,
	`dhuha_time` time NOT NULL,
	`dzuhur_time` time NOT NULL,
	`ashar_time` time NOT NULL,
	`maghrib_time` time NOT NULL,
	`isya_time` time NOT NULL,
	`source_provider` varchar(64),
	`calculation_method` varchar(64),
	`correction_applied` int NOT NULL DEFAULT 0,
	`is_manual_override` int NOT NULL DEFAULT 0,
	`synced_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prayer_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `prayer_schedules_masjid_date_uq` UNIQUE(`masjid_id`,`schedule_date`)
);
--> statement-breakpoint
CREATE TABLE `prayer_sync_jobs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36),
	`provider_key` varchar(64) NOT NULL,
	`status` enum('pending','running','success','failed') NOT NULL DEFAULT 'pending',
	`started_at` datetime,
	`finished_at` datetime,
	`error_message` text,
	`next_retry_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prayer_sync_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_plans` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`badge` varchar(64),
	`price_monthly` decimal(12,2) NOT NULL DEFAULT '0.00',
	`price_yearly` decimal(12,2) NOT NULL DEFAULT '0.00',
	`price_note` varchar(255),
	`features_json` json,
	`cta_label` varchar(120) NOT NULL DEFAULT 'Mulai Gratis',
	`cta_href` varchar(255) NOT NULL DEFAULT '/auth/login',
	`is_highlight` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricing_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricing_plans_name_uq` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` bigint unsigned NOT NULL,
	`permission_id` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `role_permissions_pk` PRIMARY KEY(`role_id`,`permission_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_code_uq` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `running_texts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`content` text NOT NULL,
	`speed` int NOT NULL DEFAULT 60,
	`is_active` int NOT NULL DEFAULT 1,
	`start_at` datetime,
	`end_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `running_texts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slides` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`media_asset_id` bigint unsigned,
	`title` varchar(160),
	`order_index` int NOT NULL DEFAULT 0,
	`start_at` datetime,
	`end_at` datetime,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`package_name` varchar(120) NOT NULL,
	`billing_cycle` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`status` enum('trial','active','grace','expired','cancelled') NOT NULL DEFAULT 'trial',
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`price` decimal(12,2) NOT NULL DEFAULT '0.00',
	`auto_renew` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36),
	`theme_key` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`palette_json` json,
	`layout_json` json,
	`is_global` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `themes_id` PRIMARY KEY(`id`),
	CONSTRAINT `themes_theme_key_uq` UNIQUE(`theme_key`)
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` char(36) NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_roles_pk` PRIMARY KEY(`user_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` char(36) NOT NULL,
	`token` varchar(128) NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`expires_at` datetime NOT NULL,
	`revoked_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_token_uq` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`full_name` varchar(120) NOT NULL,
	`phone` varchar(24),
	`is_active` int NOT NULL DEFAULT 1,
	`last_login_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `youtube_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`masjid_id` char(36) NOT NULL,
	`youtube_url` varchar(255) NOT NULL,
	`title` varchar(160),
	`order_index` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`start_at` datetime,
	`end_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `youtube_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `devices` ADD CONSTRAINT `devices_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iqamah_settings` ADD CONSTRAINT `iqamah_settings_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `iqamah_settings` ADD CONSTRAINT `iqamah_settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jumbotrons` ADD CONSTRAINT `jumbotrons_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masjid_users` ADD CONSTRAINT `masjid_users_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `masjid_users` ADD CONSTRAINT `masjid_users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_assets` ADD CONSTRAINT `media_assets_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prayer_calculation_methods` ADD CONSTRAINT `prayer_calculation_methods_provider_id_prayer_providers_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `prayer_providers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prayer_corrections` ADD CONSTRAINT `prayer_corrections_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prayer_overrides` ADD CONSTRAINT `prayer_overrides_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prayer_overrides` ADD CONSTRAINT `prayer_overrides_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prayer_provider_logs` ADD CONSTRAINT `prayer_provider_logs_provider_id_prayer_providers_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `prayer_providers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prayer_schedule_raw_sources` ADD CONSTRAINT `prayer_schedule_raw_sources_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prayer_schedules` ADD CONSTRAINT `prayer_schedules_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prayer_sync_jobs` ADD CONSTRAINT `prayer_sync_jobs_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_permissions_id_fk` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `running_texts` ADD CONSTRAINT `running_texts_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slides` ADD CONSTRAINT `slides_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slides` ADD CONSTRAINT `slides_media_asset_id_media_assets_id_fk` FOREIGN KEY (`media_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `themes` ADD CONSTRAINT `themes_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `youtube_items` ADD CONSTRAINT `youtube_items_masjid_id_masjids_id_fk` FOREIGN KEY (`masjid_id`) REFERENCES `masjids`(`id`) ON DELETE cascade ON UPDATE no action;