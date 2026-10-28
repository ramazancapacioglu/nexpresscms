CREATE TABLE "form_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"page_path" text NOT NULL,
	"locale" text DEFAULT 'tr' NOT NULL,
	"form_id" text NOT NULL,
	"form_title" text DEFAULT '' NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"ip_hash" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "form_submissions_site_id_idx" ON "form_submissions" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "form_submissions_status_idx" ON "form_submissions" USING btree ("site_id","status","created_at");--> statement-breakpoint
CREATE INDEX "form_submissions_ip_idx" ON "form_submissions" USING btree ("site_id","ip_hash","created_at");