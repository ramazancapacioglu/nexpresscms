CREATE TABLE "forms" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"template_id" text,
	"spec" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notify" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN "notify_status" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN "notify_error" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "forms_site_id_idx" ON "forms" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "forms_site_status_idx" ON "forms" USING btree ("site_id","status");