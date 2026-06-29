-- 0009_add_onboarding_briefing.sql

ALTER TABLE "onboarding_task" ADD COLUMN "response" jsonb;
ALTER TABLE "onboarding_task" ADD COLUMN "response_type" text;
ALTER TABLE "onboarding_task" ADD COLUMN "response_options" jsonb;
