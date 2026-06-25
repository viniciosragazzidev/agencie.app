CREATE TABLE "client_financial_record" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"month" text NOT NULL,
	"revenue" integer DEFAULT 0 NOT NULL,
	"spend" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'lead' NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_financial_record" ADD CONSTRAINT "client_financial_record_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_financial_record_clientId_idx" ON "client_financial_record" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "lead_userId_idx" ON "lead" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lead_status_idx" ON "lead" USING btree ("status");