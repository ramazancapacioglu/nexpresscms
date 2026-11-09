ALTER TABLE `comments_reviews` ADD `parent_id` text;--> statement-breakpoint
ALTER TABLE `comments_reviews` ADD `tags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
CREATE INDEX `comments_reviews_parent_idx` ON `comments_reviews` (`site_id`,`parent_id`);