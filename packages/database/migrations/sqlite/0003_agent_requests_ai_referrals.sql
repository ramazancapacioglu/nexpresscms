CREATE TABLE `agent_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`product_slug` text DEFAULT '' NOT NULL,
	`agent` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `agent_requests_site_id_idx` ON `agent_requests` (`site_id`);--> statement-breakpoint
CREATE INDEX `agent_requests_status_idx` ON `agent_requests` (`site_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `ai_referral_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`day` text NOT NULL,
	`source` text NOT NULL,
	`path` text DEFAULT '/' NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ai_referral_daily_site_id_idx` ON `ai_referral_daily` (`site_id`);--> statement-breakpoint
CREATE INDEX `ai_referral_daily_day_idx` ON `ai_referral_daily` (`site_id`,`day`);