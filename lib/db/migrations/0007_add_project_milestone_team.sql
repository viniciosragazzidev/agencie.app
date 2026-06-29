-- 0007_add_project_milestone_team.sql

-- 1. Criar tabela team_member
CREATE TABLE "team_member" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "email" text,
  "role" text DEFAULT 'other' NOT NULL,
  "hourly_cost" text DEFAULT '0' NOT NULL,
  "avatar" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "team_member_userId_idx" ON "team_member" ("user_id");

-- 2. Criar tabela project
CREATE TABLE "project" (
  "id" text PRIMARY KEY,
  "client_id" text NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'planning' NOT NULL,
  "start_date" timestamp,
  "end_date" timestamp,
  "budget" text DEFAULT '0' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "project_clientId_idx" ON "project" ("client_id");
CREATE INDEX "project_userId_idx" ON "project" ("user_id");
CREATE INDEX "project_status_idx" ON "project" ("status");

-- 3. Criar tabela milestone
CREATE TABLE "milestone" (
  "id" text PRIMARY KEY,
  "project_id" text NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "due_date" timestamp,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "milestone_projectId_idx" ON "milestone" ("project_id");

-- 4. Adicionar colunas em project_task
ALTER TABLE "project_task" ADD COLUMN "project_id" text REFERENCES "project"("id") ON DELETE SET NULL;
ALTER TABLE "project_task" ADD COLUMN "milestone_id" text REFERENCES "milestone"("id") ON DELETE SET NULL;
ALTER TABLE "project_task" ADD COLUMN "assigned_to" text REFERENCES "team_member"("id") ON DELETE SET NULL;
ALTER TABLE "project_task" ADD COLUMN "estimated_hours" integer;
CREATE INDEX "project_task_projectId_idx" ON "project_task" ("project_id");
CREATE INDEX "project_task_milestoneId_idx" ON "project_task" ("milestone_id");

-- 5. Migrar project_task orfas -> criar "Projeto Padrao" por client
DO $$
DECLARE
  r RECORD;
  default_project_id text;
BEGIN
  FOR r IN SELECT DISTINCT "client_id" FROM "project_task" WHERE "project_id" IS NULL
  LOOP
    default_project_id := gen_random_uuid()::text;
    INSERT INTO "project" ("id", "client_id", "user_id", "name", "status")
    VALUES (
      default_project_id,
      r."client_id",
      (SELECT "user_id" FROM "client" WHERE "id" = r."client_id" LIMIT 1),
      'Projeto Padrao',
      'in_progress'
    );
    UPDATE "project_task"
    SET "project_id" = default_project_id
    WHERE "client_id" = r."client_id" AND "project_id" IS NULL;
  END LOOP;
END $$;
