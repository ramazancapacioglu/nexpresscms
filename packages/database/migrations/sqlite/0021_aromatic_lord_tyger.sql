CREATE TABLE `data_plugins` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`plugin_id` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`version` text DEFAULT '' NOT NULL,
	`vendor` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`manifest` text DEFAULT '{}' NOT NULL,
	`content_types` text DEFAULT '[]' NOT NULL,
	`pages` text DEFAULT '[]' NOT NULL,
	`webhooks` text DEFAULT '[]' NOT NULL,
	`signature` text DEFAULT 'unsigned' NOT NULL,
	`publisher_key` text DEFAULT '' NOT NULL,
	`checksum` text DEFAULT '' NOT NULL,
	`webhook_secret` text DEFAULT '' NOT NULL,
	`last_delivery` text,
	`installed_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `data_plugins_site_id_idx` ON `data_plugins` (`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `data_plugins_site_plugin_uidx` ON `data_plugins` (`site_id`,`plugin_id`);