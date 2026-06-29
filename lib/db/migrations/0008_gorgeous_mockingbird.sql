CREATE TABLE "agency_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"agency_name" text,
	"agency_logo" text,
	"agency_slogan" text,
	"primary_color" text DEFAULT '#111827',
	"secondary_color" text DEFAULT '#6b7280',
	"accent_color" text DEFAULT '#3b82f6',
	"cnpj" text,
	"address" text,
	"phone" text,
	"email" text,
	"website" text,
	"default_contract_template" text DEFAULT 'prestacao_servicos',
	"contract_footer" text,
	"clause_bank" jsonb,
	"portal_welcome_message" text,
	"portal_primary_action" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agency_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "ai_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"primary_provider" text DEFAULT 'groq' NOT NULL,
	"fallback_provider" text,
	"model_primary" text DEFAULT 'llama-3.3-70b-versatile',
	"model_fallback" text DEFAULT 'gpt-4o-mini',
	"temperature" real DEFAULT 0.7 NOT NULL,
	"max_tokens" integer DEFAULT 2048 NOT NULL,
	"bot_name" text DEFAULT 'Agencie AI',
	"system_prompt" text DEFAULT 'Voce e um assistente inteligente de uma agencia de marketing digital e tecnologia.' NOT NULL,
	"persona" text,
	"guidelines" text,
	"auto_pilot" boolean DEFAULT true,
	"human_handoff" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "client_briefing" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"project_name" text,
	"business_goal" text,
	"target_audience" text,
	"target_age" text,
	"target_location" text,
	"competitors" text,
	"project_scope" text,
	"estimated_budget" text,
	"desired_deadline" text,
	"visual_references" text,
	"additional_info" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_calendar_credential" (
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
ALTER TABLE "client_contract" ADD COLUMN "contract_type" text DEFAULT 'prestacao_servicos';--> statement-breakpoint
ALTER TABLE "client_contract" ADD COLUMN "validity_days" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "client_contract" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "client_contract" ADD COLUMN "total_value" text;--> statement-breakpoint
ALTER TABLE "client_contract" ADD COLUMN "payment_conditions" text;--> statement-breakpoint
ALTER TABLE "client_contract" ADD COLUMN "late_fee" text;--> statement-breakpoint
ALTER TABLE "client_contract" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "setup_progress" jsonb DEFAULT '{"agencyConfigured":false,"firstClientCreated":false,"firstServiceCreated":false,"integrationConnected":false,"contractGenerated":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tutorial_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "login_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agency_settings" ADD CONSTRAINT "agency_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_briefing" ADD CONSTRAINT "client_briefing_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_briefing" ADD CONSTRAINT "client_briefing_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_calendar_credential" ADD CONSTRAINT "google_calendar_credential_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_settings_userId_idx" ON "ai_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "client_briefing_clientId_idx" ON "client_briefing" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "google_calendar_credential_userId_idx" ON "google_calendar_credential" USING btree ("user_id");