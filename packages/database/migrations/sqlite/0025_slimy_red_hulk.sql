CREATE TABLE `bot_page_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`day` text NOT NULL,
	`bot_id` text NOT NULL,
	`kind` text NOT NULL,
	`path` text NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bot_page_daily_site_day_idx` ON `bot_page_daily` (`site_id`,`day`);