CREATE TABLE `not_found_log` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`path` text NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`last_referrer` text DEFAULT '' NOT NULL,
	`ignored` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `not_found_log_site_id_idx` ON `not_found_log` (`site_id`);--> statement-breakpoint
CREATE INDEX `not_found_log_hits_idx` ON `not_found_log` (`site_id`,`hits`);--> statement-breakpoint
CREATE TABLE `redirects` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`from_path` text NOT NULL,
	`to_path` text NOT NULL,
	`code` integer DEFAULT 301 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_hit_at` integer
);
--> statement-breakpoint
CREATE INDEX `redirects_site_id_idx` ON `redirects` (`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `redirects_site_from_uidx` ON `redirects` (`site_id`,`from_path`);