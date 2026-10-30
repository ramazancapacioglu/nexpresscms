CREATE TABLE `design_library` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text DEFAULT 'default' NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'text' NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`prompt` text DEFAULT '' NOT NULL,
	`report` text DEFAULT '{}' NOT NULL,
	`placeholder_data` integer DEFAULT false NOT NULL,
	`created_by` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `design_library_site_id_idx` ON `design_library` (`site_id`);--> statement-breakpoint
CREATE INDEX `design_library_kind_idx` ON `design_library` (`site_id`,`kind`,`updated_at`);