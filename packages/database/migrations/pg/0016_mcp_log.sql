CREATE TABLE "mcp_request_log" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text DEFAULT 'default' NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"tool" text NOT NULL,
	"agent" text DEFAULT '' NOT NULL,
	"ok" boolean DEFAULT true NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "mcp_request_log_site_at_idx" ON "mcp_request_log" USING btree ("site_id","at");