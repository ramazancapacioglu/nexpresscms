ALTER TABLE `content_translations` ADD `translation_status` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `content_translations` ADD `source_locale` text;--> statement-breakpoint
ALTER TABLE `content_translations` ADD `source_hash` text;