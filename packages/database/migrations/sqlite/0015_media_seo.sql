ALTER TABLE `media_assets` ADD `description` text;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `kind` text DEFAULT 'image' NOT NULL;