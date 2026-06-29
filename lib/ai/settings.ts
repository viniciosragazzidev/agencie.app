import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiSettings } from "@/lib/db/schema";

export type AiSettingsRow = typeof aiSettings.$inferSelect;
export type AiSettingsInsert = typeof aiSettings.$inferInsert;

/**
 * Get AI settings for a user. Auto-creates a default row on first access.
 */
export async function getAiSettings(userId: string): Promise<AiSettingsRow> {
  const existing = await db
    .select()
    .from(aiSettings)
    .where(eq(aiSettings.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  // Auto-create default row
  const [created] = await db
    .insert(aiSettings)
    .values({ id: crypto.randomUUID(), userId })
    .returning();

  return created;
}

/**
 * Update AI settings for a user. Creates the row if it doesn't exist.
 */
export async function upsertAiSettings(
  userId: string,
  data: Partial<Omit<AiSettingsInsert, "id" | "userId">>
): Promise<AiSettingsRow> {
  const existing = await getAiSettings(userId);

  const [updated] = await db
    .update(aiSettings)
    .set(data)
    .where(eq(aiSettings.id, existing.id))
    .returning();

  return updated;
}
