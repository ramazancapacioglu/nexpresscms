CREATE TABLE "design_library" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'text' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"prompt" text DEFAULT '' NOT NULL,
	"report" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"placeholder_data" boolean DEFAULT false NOT NULL,
	"created_by" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "design_library_site_id_idx" ON "design_library" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "design_library_kind_idx" ON "design_library" USING btree ("site_id","kind","updated_at");