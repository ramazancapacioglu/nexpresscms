CREATE TABLE "plugin_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"plugin_id" text NOT NULL,
	"webhook_id" text NOT NULL,
	"event" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp NOT NULL,
	"last_status" integer,
	"last_error" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "tier" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "plugin_deliveries_site_id_idx" ON "plugin_deliveries" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "plugin_deliveries_due_idx" ON "plugin_deliveries" USING btree ("site_id","status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "plugin_deliveries_plugin_idx" ON "plugin_deliveries" USING btree ("site_id","plugin_id","created_at");