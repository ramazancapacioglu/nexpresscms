CREATE TABLE `notification_reads` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`notification_id` text NOT NULL,
	`user_id` text NOT NULL,
	`read_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notification_reads_site_id_idx` ON `notification_reads` (`site_id`);--> statement-breakpoint
CREATE INDEX `notification_reads_user_idx` ON `notification_reads` (`site_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`kind` text NOT NULL,
	`severity` text DEFAULT 'info' NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`href` text DEFAULT '' NOT NULL,
	`dedupe_key` text,
	`count` integer DEFAULT 1 NOT NULL,
	`audience` text DEFAULT 'admin' NOT NULL,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notifications_site_id_idx` ON `notifications` (`site_id`);--> statement-breakpoint
CREATE INDEX `notifications_updated_idx` ON `notifications` (`site_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `notifications_dedupe_idx` ON `notifications` (`site_id`,`dedupe_key`);