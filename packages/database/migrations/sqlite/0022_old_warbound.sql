CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`email` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`email_verified_at` integer,
	`link_seq` integer DEFAULT 0 NOT NULL,
	`session_version` integer DEFAULT 0 NOT NULL,
	`consent_at` integer,
	`created_at` integer NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE INDEX `members_site_id_idx` ON `members` (`site_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_site_email_uidx` ON `members` (`site_id`,`email`);