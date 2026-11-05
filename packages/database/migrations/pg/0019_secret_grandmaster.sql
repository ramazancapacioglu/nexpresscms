ALTER TABLE "content_imports" ADD COLUMN "body_hash" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "seo_intel_signals" ADD COLUMN "prev_position10" integer DEFAULT 0 NOT NULL;