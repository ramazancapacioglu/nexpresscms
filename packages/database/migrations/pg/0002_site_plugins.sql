CREATE TABLE "site_plugins" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"plugin_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"modules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"license_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "site_plugins_site_id_idx" ON "site_plugins" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "site_plugins_site_plugin_uidx" ON "site_plugins" USING btree ("site_id","plugin_id");