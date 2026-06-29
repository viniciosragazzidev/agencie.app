-- Deduplicate existing conversations: keep only the oldest conversation per (integration_id, external_chat_id)

-- 1. Clean up orphaned clientPoll records referencing messages from duplicate conversations
DELETE FROM client_poll
WHERE message_id IN (
  SELECT m.id FROM message m
  INNER JOIN conversation c ON m.conversation_id = c.id
  WHERE c.id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY integration_id, external_chat_id
               ORDER BY created_at ASC
             ) AS rn
      FROM conversation
    ) sub
    WHERE rn > 1
  )
);

-- 2. Delete messages from duplicate conversations
DELETE FROM message
WHERE conversation_id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY integration_id, external_chat_id
             ORDER BY created_at ASC
           ) AS rn
    FROM conversation
  ) sub
  WHERE rn > 1
);

-- 3. Delete duplicate conversations (keeping the oldest)
DELETE FROM conversation
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY integration_id, external_chat_id
             ORDER BY created_at ASC
           ) AS rn
    FROM conversation
  ) sub
  WHERE rn > 1
);

-- Add unique constraint on (integration_id, external_chat_id) to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "conversation_integrationId_externalChatId_idx"
  ON "conversation" ("integration_id", "external_chat_id");

-- Add index on message.external_message_id for faster dedup lookups
CREATE INDEX IF NOT EXISTS "message_externalMessageId_idx"
  ON "message" ("external_message_id");
