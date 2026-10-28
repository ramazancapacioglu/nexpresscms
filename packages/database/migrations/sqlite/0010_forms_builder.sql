CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`template_id` text,
	`spec` text DEFAULT '{}' NOT NULL,
	`notify` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `forms_site_id_idx` ON `forms` (`site_id`);--> statement-breakpoint
CREATE INDEX `forms_site_status_idx` ON `forms` (`site_id`,`status`);--> statement-breakpoint
ALTER TABLE `form_submissions` ADD `notify_status` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `form_submissions` ADD `notify_error` text DEFAULT '' NOT NULL;