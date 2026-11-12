CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"email_verified_at" timestamp,
	"link_seq" integer DEFAULT 0 NOT NULL,
	"session_version" integer DEFAULT 0 NOT NULL,
	"consent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "members_site_id_idx" ON "members" USING btree ("site_id");--> statement-breakpoint
CREATE UNIQUE INDEX "members_site_email_uidx" ON "members" USING btree ("site_id","email");