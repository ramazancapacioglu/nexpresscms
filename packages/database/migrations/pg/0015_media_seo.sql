ALTER TABLE "media_assets" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "kind" text DEFAULT 'image' NOT NULL;