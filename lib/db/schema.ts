import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, jsonb, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const client = pgTable(
  "client",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    industry: text("industry"),
    status: text("status", { enum: ["Ativo", "Em Risco", "Onboarding"] }).default("Ativo").notNull(),
    projects: text("projects").default("1").notNull(),
    mrr: text("mrr").default("0").notNull(),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    street: text("street"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    notes: text("notes"),
    socials: jsonb("socials"),
    websites: jsonb("websites"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("client_userId_idx").on(table.userId)],
);

export const service = pgTable(
  "service",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: text("price").notNull(),
    billing: text("billing", { enum: ["mensal", "anual", "unico"] }).default("mensal").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("service_userId_idx").on(table.userId)],
);

// ============================================================
// INBOX OMNICHANNEL — Integrações, Conversas e Mensagens
// ============================================================

export const channelIntegration = pgTable(
  "channel_integration",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    channel: text("channel", { enum: ["whatsapp", "instagram", "facebook"] }).notNull(),
    // WPP: sessionId do OpenWA | IG/FB: pageId da conta conectada
    externalId: text("external_id").notNull(),
    status: text("status", {
      enum: ["disconnected", "connecting", "qr_pending", "active", "error"],
    }).default("disconnected").notNull(),
    // QR code base64 temporário (somente WPP, limpo após conexão)
    qrCode: text("qr_code"),
    // Tokens OAuth (IG/FB)
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    // Dados da conta conectada
    accountName: text("account_name"),
    accountAvatar: text("account_avatar"),
    webhookRegisteredAt: timestamp("webhook_registered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index("channel_integration_userId_idx").on(t.userId),
    index("channel_integration_channel_idx").on(t.channel),
  ]
);

export const conversation = pgTable(
  "conversation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    integrationId: text("integration_id")
      .notNull()
      .references(() => channelIntegration.id, { onDelete: "cascade" }),
    channel: text("channel", { enum: ["whatsapp", "instagram", "facebook"] }).notNull(),
    // ID externo no canal (número WPP, thread_id IG, etc.)
    externalChatId: text("external_chat_id").notNull(),
    contactName: text("contact_name"),
    contactIdentifier: text("contact_identifier"),
    contactAvatar: text("contact_avatar"),
    lastMessageAt: timestamp("last_message_at"),
    lastMessagePreview: text("last_message_preview"),
    unreadCount: text("unread_count").default("0"),
    isIgnored: boolean("is_ignored").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index("conversation_userId_idx").on(t.userId),
    index("conversation_integrationId_idx").on(t.integrationId),
    index("conversation_lastMessageAt_idx").on(t.lastMessageAt),
  ]
);

export const message = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // inbound = veio do cliente | outbound = enviado pela agência
    direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
    externalMessageId: text("external_message_id"),
    content: text("content").notNull(),
    mediaUrl: text("media_url"),
    mediaType: text("media_type"),
    status: text("status", {
      enum: ["sending", "sent", "delivered", "read", "failed"],
    }).default("sent"),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (t) => [
    index("message_conversationId_idx").on(t.conversationId),
    index("message_userId_idx").on(t.userId),
    index("message_sentAt_idx").on(t.sentAt),
  ]
);

// ============================================================
// PÓS-VENDA — 10 Funcionalidades Estratégicas
// ============================================================

export const projectTask = pgTable("project_task", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in_progress", "done"] }).default("todo").notNull(),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("project_task_clientId_idx").on(t.clientId),
  index("project_task_userId_idx").on(t.userId),
]);

export const approval = pgTable("approval", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  fileType: text("file_type", { enum: ["design", "copy", "page", "other"] }).default("other"),
  status: text("status", { enum: ["pending", "approved", "revision"] }).default("pending").notNull(),
  clientComment: text("client_comment"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("approval_clientId_idx").on(t.clientId),
  index("approval_userId_idx").on(t.userId),
]);

export const clientInteraction = pgTable("client_interaction", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["message", "call", "meeting", "delivery", "note", "email"] }).notNull(),
  description: text("description"),
  isAutomatic: boolean("is_automatic").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("client_interaction_clientId_idx").on(t.clientId),
  index("client_interaction_createdAt_idx").on(t.createdAt),
]);

export const clientAsset = pgTable("client_asset", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category", { enum: ["logo", "report", "access", "art", "contract", "other"] }).default("other").notNull(),
  fileUrl: text("file_url"),
  linkUrl: text("link_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("client_asset_clientId_idx").on(t.clientId),
]);

export const clientNote = pgTable("client_note", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  tag: text("tag", { enum: ["meeting", "briefing", "strategy", "general"] }).default("general").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("client_note_clientId_idx").on(t.clientId),
]);

export const onboardingTask = pgTable("onboarding_task", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("onboarding_task_clientId_idx").on(t.clientId),
]);

export const clientSatisfaction = pgTable("client_satisfaction", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("client_satisfaction_clientId_idx").on(t.clientId),
]);

export const clientQuicklink = pgTable("client_quicklink", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("client_quicklink_clientId_idx").on(t.clientId),
]);

export const clientScope = pgTable("client_scope", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  totalQuota: integer("total_quota").notNull(),
  usedQuota: integer("used_quota").default(0).notNull(),
  period: text("period", { enum: ["monthly", "quarterly", "one_time"] }).default("monthly").notNull(),
  resetDate: timestamp("reset_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("client_scope_clientId_idx").on(t.clientId),
]);

export const adSpendTracker = pgTable("ad_spend_tracker", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  plannedBudget: text("planned_budget").notNull(),
  spentAmount: text("spent_amount").default("0").notNull(),
  platform: text("platform", { enum: ["meta", "google", "tiktok", "other"] }).default("meta").notNull(),
  dailyPace: text("daily_pace"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("ad_spend_tracker_clientId_idx").on(t.clientId),
]);

export const lead = pgTable("lead", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status", { enum: ["lead", "qualified", "won", "lost"] }).default("lead").notNull(),
  value: integer("value").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("lead_userId_idx").on(t.userId),
  index("lead_status_idx").on(t.status),
]);

export const clientFinancialRecord = pgTable("client_financial_record", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  revenue: integer("revenue").default(0).notNull(),
  spend: integer("spend").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("client_financial_record_clientId_idx").on(t.clientId),
]);

// ============================================================
// RELATIONS
// ============================================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  clients: many(client),
  services: many(service),
  channelIntegrations: many(channelIntegration),
  conversations: many(conversation),
  messages: many(message),
  leads: many(lead),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const clientRelations = relations(client, ({ one, many }) => ({
  user: one(user, { fields: [client.userId], references: [user.id] }),
  projectTasks: many(projectTask),
  approvals: many(approval),
  interactions: many(clientInteraction),
  assets: many(clientAsset),
  notes: many(clientNote),
  onboardingTasks: many(onboardingTask),
  satisfactions: many(clientSatisfaction),
  quicklinks: many(clientQuicklink),
  scopes: many(clientScope),
  adSpendTrackers: many(adSpendTracker),
  financialRecords: many(clientFinancialRecord),
}));

export const serviceRelations = relations(service, ({ one }) => ({
  user: one(user, { fields: [service.userId], references: [user.id] }),
}));

export const channelIntegrationRelations = relations(channelIntegration, ({ one, many }) => ({
  user: one(user, { fields: [channelIntegration.userId], references: [user.id] }),
  conversations: many(conversation),
}));

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  user: one(user, { fields: [conversation.userId], references: [user.id] }),
  integration: one(channelIntegration, {
    fields: [conversation.integrationId],
    references: [channelIntegration.id],
  }),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  user: one(user, { fields: [message.userId], references: [user.id] }),
}));

// ============================================================
// PÓS-VENDA — Relations
// ============================================================

export const projectTaskRelations = relations(projectTask, ({ one }) => ({
  client: one(client, { fields: [projectTask.clientId], references: [client.id] }),
  user: one(user, { fields: [projectTask.userId], references: [user.id] }),
}));

export const approvalRelations = relations(approval, ({ one }) => ({
  client: one(client, { fields: [approval.clientId], references: [client.id] }),
  user: one(user, { fields: [approval.userId], references: [user.id] }),
}));

export const clientInteractionRelations = relations(clientInteraction, ({ one }) => ({
  client: one(client, { fields: [clientInteraction.clientId], references: [client.id] }),
  user: one(user, { fields: [clientInteraction.userId], references: [user.id] }),
}));

export const clientAssetRelations = relations(clientAsset, ({ one }) => ({
  client: one(client, { fields: [clientAsset.clientId], references: [client.id] }),
  user: one(user, { fields: [clientAsset.userId], references: [user.id] }),
}));

export const clientNoteRelations = relations(clientNote, ({ one }) => ({
  client: one(client, { fields: [clientNote.clientId], references: [client.id] }),
  user: one(user, { fields: [clientNote.userId], references: [user.id] }),
}));

export const onboardingTaskRelations = relations(onboardingTask, ({ one }) => ({
  client: one(client, { fields: [onboardingTask.clientId], references: [client.id] }),
  user: one(user, { fields: [onboardingTask.userId], references: [user.id] }),
}));

export const clientSatisfactionRelations = relations(clientSatisfaction, ({ one }) => ({
  client: one(client, { fields: [clientSatisfaction.clientId], references: [client.id] }),
}));

export const clientQuicklinkRelations = relations(clientQuicklink, ({ one }) => ({
  client: one(client, { fields: [clientQuicklink.clientId], references: [client.id] }),
  user: one(user, { fields: [clientQuicklink.userId], references: [user.id] }),
}));

export const clientScopeRelations = relations(clientScope, ({ one }) => ({
  client: one(client, { fields: [clientScope.clientId], references: [client.id] }),
  user: one(user, { fields: [clientScope.userId], references: [user.id] }),
}));

export const adSpendTrackerRelations = relations(adSpendTracker, ({ one }) => ({
  client: one(client, { fields: [adSpendTracker.clientId], references: [client.id] }),
  user: one(user, { fields: [adSpendTracker.userId], references: [user.id] }),
}));

export const leadRelations = relations(lead, ({ one }) => ({
  user: one(user, { fields: [lead.userId], references: [user.id] }),
}));

export const clientFinancialRecordRelations = relations(clientFinancialRecord, ({ one }) => ({
  client: one(client, { fields: [clientFinancialRecord.clientId], references: [client.id] }),
}));
