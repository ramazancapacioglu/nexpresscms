CREATE TABLE `content_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`content_id` text NOT NULL,
	`locale` text DEFAULT 'tr' NOT NULL,
	`created_at` integer NOT NULL,
	`author_id` text,
	`author_email` text DEFAULT '' NOT NULL,
	`status` text NOT NULL,
	`title` text NOT NULL,
	`snapshot` text NOT NULL,
	`snapshot_hash` text NOT NULL,
	`block_count` integer DEFAULT 0 NOT NULL,
	`word_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `content_revisions_site_id_idx` ON `content_revisions` (`site_id`);--> statement-breakpoint
CREATE INDEX `content_revisions_content_idx` ON `content_revisions` (`site_id`,`content_id`,`locale`,`created_at`);