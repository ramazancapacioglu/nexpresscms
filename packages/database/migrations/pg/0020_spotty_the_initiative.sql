ALTER TABLE "comments_reviews" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "comments_reviews" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "comments_reviews_parent_idx" ON "comments_reviews" USING btree ("site_id","parent_id");