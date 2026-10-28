CREATE TABLE `media_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `media_folders_site_id_idx` ON `media_folders` (`site_id`);--> statement-breakpoint
CREATE INDEX `media_folders_parent_idx` ON `media_folders` (`site_id`,`parent_id`);--> statement-breakpoint
ALTER TABLE `media_assets` ADD `folder_id` text;--> statement-breakpoint
CREATE INDEX `media_assets_folder_idx` ON `media_assets` (`site_id`,`folder_id`);