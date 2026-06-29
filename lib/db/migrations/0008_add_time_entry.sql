-- 0008_add_time_entry.sql

CREATE TABLE "time_entry" (
  "id" text PRIMARY KEY,
  "task_id" text NOT NULL REFERENCES "project_task"("id") ON DELETE CASCADE,
  "team_member_id" text NOT NULL REFERENCES "team_member"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp,
  "duration" integer,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "time_entry_taskId_idx" ON "time_entry" ("task_id");
CREATE INDEX "time_entry_teamMemberId_idx" ON "time_entry" ("team_member_id");
CREATE INDEX "time_entry_userId_idx" ON "time_entry" ("user_id");
