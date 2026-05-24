-- Add max_devices column to subscriptions and pricing_plans
ALTER TABLE `subscriptions` ADD COLUMN `max_devices` int NOT NULL DEFAULT 1;
ALTER TABLE `pricing_plans` ADD COLUMN `max_devices` int NOT NULL DEFAULT 1;

-- Update trial subscriptions to keep limit of 1
UPDATE `subscriptions` SET `max_devices` = 1 WHERE `status` = 'trial';
-- Update active/grace subscriptions to unlimited (99) by default
UPDATE `subscriptions` SET `max_devices` = 99 WHERE `status` IN ('active', 'grace');
