-- 0010_add_client_briefing.sql
-- Briefing de projetos para clientes

CREATE TABLE IF NOT EXISTS "client_briefing" (
  "id" text PRIMARY KEY,
  "client_id" text NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
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
  "status" text DEFAULT 'draft',
  "submitted_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "client_briefing_clientId_idx" ON "client_briefing" ("client_id");
