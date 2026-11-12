CREATE TABLE "data_plugins" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"plugin_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"version" text DEFAULT '' NOT NULL,
	"vendor" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"manifest" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"webhooks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signature" text DEFAULT 'unsigned' NOT NULL,
	"publisher_key" text DEFAULT '' NOT NULL,
	"checksum" text DEFAULT '' NOT NULL,
	"webhook_secret" text DEFAULT '' NOT NULL,
	"last_delivery" jsonb,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "data_plugins_site_id_idx" ON "data_plugins" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "data_plugins_site_plugin_uidx" ON "data_plugins" USING btree ("site_id","plugin_id");