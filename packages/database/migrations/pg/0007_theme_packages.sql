ALTER TABLE "installed_themes" ADD COLUMN "source" text DEFAULT 'official' NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "version" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "author" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "tagline" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "recommended_profile" text DEFAULT 'corporate' NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "package_tokens" jsonb;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "raw_css" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "css" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "header" jsonb;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "footer" jsonb;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "pages" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "screenshot" text;--> statement-breakpoint
ALTER TABLE "installed_themes" ADD COLUMN "checksum" text DEFAULT '' NOT NULL;