CREATE TABLE `site_plugins` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`plugin_id` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`modules` text DEFAULT '{}' NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`license_key` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `site_plugins_site_id_idx` ON `site_plugins` (`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `site_plugins_site_plugin_uidx` ON `site_plugins` (`site_id`,`plugin_id`);