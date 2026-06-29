CREATE TABLE IF NOT EXISTS "message_annotation" (
  "id" text PRIMARY KEY,
  "message_id" text NOT NULL REFERENCES "message"("id") ON DELETE CASCADE,
  "conversation_id" text NOT NULL REFERENCES "conversation"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "summary" text NOT NULL,
  "explanation" text NOT NULL,
  "tag" text DEFAULT 'important' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "message_annotation_messageId_idx" ON "message_annotation" ("message_id");
CREATE INDEX IF NOT EXISTS "message_annotation_conversationId_idx" ON "message_annotation" ("conversation_id");
