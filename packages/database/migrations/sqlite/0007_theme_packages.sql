ALTER TABLE `installed_themes` ADD `source` text DEFAULT 'official' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `version` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `author` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `tagline` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `recommended_profile` text DEFAULT 'corporate' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `package_tokens` text;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `css` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `raw_css` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `header` text;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `footer` text;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `pages` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `screenshot` text;--> statement-breakpoint
ALTER TABLE `installed_themes` ADD `checksum` text DEFAULT '' NOT NULL;