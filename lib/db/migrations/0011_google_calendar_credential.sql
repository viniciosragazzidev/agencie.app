CREATE TABLE IF NOT EXISTS "google_calendar_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"scope" text,
	"token_type" text DEFAULT 'Bearer' NOT NULL,
	"expiry_date" timestamp,
	"calendar_email" text,
	"calendar_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "google_calendar_credential_userId_idx" ON "google_calendar_credential" ("user_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "google_calendar_credential" ADD CONSTRAINT "google_calendar_credential_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
