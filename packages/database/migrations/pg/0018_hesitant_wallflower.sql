CREATE TABLE "content_imports" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"kind" text NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"content_id" text DEFAULT '' NOT NULL,
	"error" text DEFAULT '' NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_intel_clusters" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"label" text NOT NULL,
	"members" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"content_id" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_intel_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"source" text NOT NULL,
	"keyword" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"ctr100" integer DEFAULT 0 NOT NULL,
	"position10" integer DEFAULT 0 NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "content_imports_site_id_idx" ON "content_imports" USING btree ("site_id","fetched_at");--> statement-breakpoint
CREATE INDEX "seo_intel_clusters_site_id_idx" ON "seo_intel_clusters" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "seo_intel_signals_site_id_idx" ON "seo_intel_signals" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_intel_signals_site_source_kw_uidx" ON "seo_intel_signals" USING btree ("site_id","source","keyword");