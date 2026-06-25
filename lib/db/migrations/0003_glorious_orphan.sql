CREATE TABLE "ad_spend_tracker" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"month" text NOT NULL,
	"planned_budget" text NOT NULL,
	"spent_amount" text DEFAULT '0' NOT NULL,
	"platform" text DEFAULT 'meta' NOT NULL,
	"daily_pace" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text,
	"file_type" text DEFAULT 'other',
	"status" text DEFAULT 'pending' NOT NULL,
	"client_comment" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_integration" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"channel" text NOT NULL,
	"external_id" text NOT NULL,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"qr_code" text,
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_name" text,
	"account_avatar" text,
	"webhook_registered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"file_url" text,
	"link_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_interaction" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"is_automatic" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_note" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"tag" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_quicklink" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"icon" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_satisfaction" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"score" integer NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_scope" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"total_quota" integer NOT NULL,
	"used_quota" integer DEFAULT 0 NOT NULL,
	"period" text DEFAULT 'monthly' NOT NULL,
	"reset_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"channel" text NOT NULL,
	"external_chat_id" text NOT NULL,
	"contact_name" text,
	"contact_identifier" text,
	"contact_avatar" text,
	"last_message_at" timestamp,
	"last_message_preview" text,
	"unread_count" text DEFAULT '0',
	"is_ignored" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"direction" text NOT NULL,
	"external_message_id" text,
	"content" text NOT NULL,
	"media_url" text,
	"media_type" text,
	"status" text DEFAULT 'sent',
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_task" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_task" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "socials" jsonb;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "websites" jsonb;--> statement-breakpoint
ALTER TABLE "ad_spend_tracker" ADD CONSTRAINT "ad_spend_tracker_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_spend_tracker" ADD CONSTRAINT "ad_spend_tracker_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval" ADD CONSTRAINT "approval_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval" ADD CONSTRAINT "approval_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_integration" ADD CONSTRAINT "channel_integration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_asset" ADD CONSTRAINT "client_asset_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_asset" ADD CONSTRAINT "client_asset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_interaction" ADD CONSTRAINT "client_interaction_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_interaction" ADD CONSTRAINT "client_interaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_note" ADD CONSTRAINT "client_note_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_note" ADD CONSTRAINT "client_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_quicklink" ADD CONSTRAINT "client_quicklink_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_quicklink" ADD CONSTRAINT "client_quicklink_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_satisfaction" ADD CONSTRAINT "client_satisfaction_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_scope" ADD CONSTRAINT "client_scope_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_scope" ADD CONSTRAINT "client_scope_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_integration_id_channel_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."channel_integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_task" ADD CONSTRAINT "onboarding_task_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_task" ADD CONSTRAINT "onboarding_task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task" ADD CONSTRAINT "project_task_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_task" ADD CONSTRAINT "project_task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_spend_tracker_clientId_idx" ON "ad_spend_tracker" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "approval_clientId_idx" ON "approval" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "approval_userId_idx" ON "approval" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "channel_integration_userId_idx" ON "channel_integration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "channel_integration_channel_idx" ON "channel_integration" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "client_asset_clientId_idx" ON "client_asset" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_interaction_clientId_idx" ON "client_interaction" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_interaction_createdAt_idx" ON "client_interaction" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "client_note_clientId_idx" ON "client_note" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_quicklink_clientId_idx" ON "client_quicklink" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_satisfaction_clientId_idx" ON "client_satisfaction" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "client_scope_clientId_idx" ON "client_scope" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "conversation_userId_idx" ON "conversation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversation_integrationId_idx" ON "conversation" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "conversation_lastMessageAt_idx" ON "conversation" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "message_conversationId_idx" ON "message" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "message_userId_idx" ON "message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_sentAt_idx" ON "message" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "onboarding_task_clientId_idx" ON "onboarding_task" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "project_task_clientId_idx" ON "project_task" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "project_task_userId_idx" ON "project_task" USING btree ("user_id");