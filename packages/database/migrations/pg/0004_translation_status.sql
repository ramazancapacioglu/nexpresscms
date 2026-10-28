ALTER TABLE "content_translations" ADD COLUMN "translation_status" text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "content_translations" ADD COLUMN "source_locale" text;--> statement-breakpoint
ALTER TABLE "content_translations" ADD COLUMN "source_hash" text;