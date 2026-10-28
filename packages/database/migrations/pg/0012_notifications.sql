CREATE TABLE "notification_reads" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"notification_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"kind" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"href" text DEFAULT '' NOT NULL,
	"dedupe_key" text,
	"count" integer DEFAULT 1 NOT NULL,
	"audience" text DEFAULT 'admin' NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notification_reads_site_id_idx" ON "notification_reads" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "notification_reads_user_idx" ON "notification_reads" USING btree ("site_id","user_id");--> statement-breakpoint
CREATE INDEX "notifications_site_id_idx" ON "notifications" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "notifications_updated_idx" ON "notifications" USING btree ("site_id","updated_at");--> statement-breakpoint
CREATE INDEX "notifications_dedupe_idx" ON "notifications" USING btree ("site_id","dedupe_key");