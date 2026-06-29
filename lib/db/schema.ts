import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, uniqueIndex, jsonb, integer, real } from "drizzle-orm/pg-core";

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
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  onboardingStep: integer("onboarding_step").default(0).notNull(),
  setupProgress: jsonb("setup_progress").$type<{
    agencyConfigured: boolean
    firstClientCreated: boolean
    firstServiceCreated: boolean
    integrationConnected: boolean
    contractGenerated: boolean
  }>().default({
    agencyConfigured: false,
    firstClientCreated: false,
    firstServiceCreated: false,
    integrationConnected: false,
    contractGenerated: false
  }),
  tutorialCompleted: boolean("tutorial_completed").default(false).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  loginCount: integer("login_count").default(0).notNull(),
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
    document: text("document"),
    portalEnabled: boolean("portal_enabled").default(false).notNull(),
    socials: jsonb("socials"),
    websites: jsonb("websites"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("client_userId_idx").on(table.userId),
    index("client_userId_document_idx").on(table.userId, table.document),
  ],
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
    uniqueIndex("conversation_integrationId_externalChatId_idx").on(t.integrationId, t.externalChatId),
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
    index("message_externalMessageId_idx").on(t.externalMessageId),
  ]
);

// ============================================================
// ANOTAÇÕES DE MENSAGEM (AI-powered)
// ============================================================

export const messageAnnotation = pgTable("message_annotation", {
  id: text("id").primaryKey(),
  messageId: text("message_id")
    .notNull()
    .references(() => message.id, { onDelete: "cascade" }),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  explanation: text("explanation").notNull(),
  tag: text("tag", { enum: ["important", "action_required", "decision", "info"] }).default("important").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("message_annotation_messageId_idx").on(t.messageId),
  index("message_annotation_conversationId_idx").on(t.conversationId),
]);

// ============================================================
// PÓS-VENDA — 10 Funcionalidades Estratégicas
// ============================================================

export const projectTask = pgTable("project_task", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .references(() => project.id, { onDelete: "set null" }),
  milestoneId: text("milestone_id")
    .references(() => milestone.id, { onDelete: "set null" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  assignedTo: text("assigned_to")
    .references(() => teamMember.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in_progress", "done"] }).default("todo").notNull(),
  position: integer("position").default(0).notNull(),
  estimatedHours: integer("estimated_hours"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("project_task_clientId_idx").on(t.clientId),
  index("project_task_userId_idx").on(t.userId),
  index("project_task_projectId_idx").on(t.projectId),
  index("project_task_milestoneId_idx").on(t.milestoneId),
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
  response: jsonb("response"),
  responseType: text("response_type", {
    enum: ["text", "textarea", "file", "select", "date", "boolean"]
  }),
  responseOptions: jsonb("response_options"),
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
  price: text("price").default("0").notNull(),
  billing: text("billing", { enum: ["mensal", "anual", "unico"] }).default("mensal").notNull(),
  status: text("status", { enum: ["active", "closed"] }).default("active").notNull(),
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

export const clientMeeting = pgTable("client_meeting", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  meetingDate: timestamp("meeting_date").notNull(),
  platform: text("platform").default("Google Meet").notNull(),
  meetingLink: text("meeting_link"),
  status: text("status", { enum: ["pending", "confirmed", "declined"] }).default("pending").notNull(),
  clientSuggestedDate: timestamp("client_suggested_date"),
  clientComment: text("client_comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("client_meeting_clientId_idx").on(t.clientId),
]);

export const clientContract = pgTable("client_contract", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["pending", "signed", "expired", "cancelled"] }).default("pending").notNull(),
  signedAt: timestamp("signed_at"),
  signerName: text("signer_name"),
  signerIp: text("signer_ip"),
  signerDocument: text("signer_document"),
  contractType: text("contract_type").default("prestacao_servicos"),
  validityDays: integer("validity_days").default(30),
  projectId: text("project_id"),
  totalValue: text("total_value"),
  paymentConditions: text("payment_conditions"),
  lateFee: text("late_fee"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("client_contract_clientId_idx").on(t.clientId),
]);

export const clientBriefing = pgTable("client_briefing", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  projectName: text("project_name"),
  businessGoal: text("business_goal"),
  targetAudience: text("target_audience"),
  targetAge: text("target_age"),
  targetLocation: text("target_location"),
  competitors: text("competitors"),
  projectScope: text("project_scope"),
  estimatedBudget: text("estimated_budget"),
  desiredDeadline: text("desired_deadline"),
  visualReferences: text("visual_references"),
  additionalInfo: text("additional_info"),
  status: text("status", { enum: ["draft", "submitted"] }).default("draft").notNull(),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("client_briefing_clientId_idx").on(t.clientId),
]);

export const clientPoll = pgTable("client_poll", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  messageId: text("message_id"),
  externalMessageId: text("external_message_id"),
  pollName: text("poll_name").notNull(),
  type: text("type", { enum: ["meeting_confirmation", "material_approval", "nps", "lead_qualification", "payment_method"] }).notNull(),
  referenceId: text("reference_id"),
  options: jsonb("options").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("client_poll_externalMessageId_idx").on(t.externalMessageId),
]);

// ============================================================
// GOOGLE CALENDAR — Credenciais OAuth2
// ============================================================

export const googleCalendarCredential = pgTable("google_calendar_credential", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  scope: text("scope"),
  tokenType: text("token_type").default("Bearer").notNull(),
  expiryDate: timestamp("expiry_date"),
  calendarEmail: text("calendar_email"),
  calendarName: text("calendar_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("google_calendar_credential_userId_idx").on(t.userId),
]);

// ============================================================
// AI SETTINGS — Configurações do motor de IA centralizado
// ============================================================

export const aiSettings = pgTable("ai_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),

  // Provider configuration
  primaryProvider: text("primary_provider", {
    enum: ["groq", "openai", "anthropic", "google", "openrouter"],
  }).default("groq").notNull(),
  fallbackProvider: text("fallback_provider", {
    enum: ["groq", "openai", "anthropic", "google", "openrouter"],
  }),
  modelPrimary: text("model_primary").default("llama-3.3-70b-versatile"),
  modelFallback: text("model_fallback").default("gpt-4o-mini"),
  temperature: real("temperature").default(0.7).notNull(),
  maxTokens: integer("max_tokens").default(2048).notNull(),

  // System prompt / persona (the "central brain instructions")
  botName: text("bot_name").default("Agencie AI"),
  systemPrompt: text("system_prompt").notNull().default(
    "Voce e um assistente inteligente de uma agencia de marketing digital e tecnologia."
  ),
  persona: text("persona"),
  guidelines: text("guidelines"),

  // Feature flags
  autoPilot: boolean("auto_pilot").default(true),
  humanHandoff: boolean("human_handoff").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("ai_settings_userId_idx").on(t.userId),
]);

// ============================================================
// AGENCY SETTINGS — Configuracoes e branding da agencia
// ============================================================

export const agencySettings = pgTable("agency_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  agencyName: text("agency_name"),
  agencyLogo: text("agency_logo"),
  agencySlogan: text("agency_slogan"),
  primaryColor: text("primary_color").default("#111827"),
  secondaryColor: text("secondary_color").default("#6b7280"),
  accentColor: text("accent_color").default("#3b82f6"),
  cnpj: text("cnpj"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  defaultContractTemplate: text("default_contract_template").default("prestacao_servicos"),
  contractFooter: text("contract_footer"),
  clauseBank: jsonb("clause_bank"),
  portalWelcomeMessage: text("portal_welcome_message"),
  portalPrimaryAction: text("portal_primary_action"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================================
// GESTAO DE PROJETOS — Projeto, Milestones, Equipe, Tempo
// ============================================================

export const project = pgTable("project", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["planning", "in_progress", "review", "done", "cancelled"]
  }).default("planning").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: text("budget").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("project_clientId_idx").on(t.clientId),
  index("project_userId_idx").on(t.userId),
  index("project_status_idx").on(t.status),
]);

export const milestone = pgTable("milestone", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["pending", "in_progress", "completed"]
  }).default("pending").notNull(),
  dueDate: timestamp("due_date"),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("milestone_projectId_idx").on(t.projectId),
]);

export const teamMember = pgTable("team_member", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role", {
    enum: ["owner", "manager", "designer", "developer", "copywriter", "other"]
  }).default("other").notNull(),
  hourlyCost: text("hourly_cost").default("0").notNull(),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (t) => [
  index("team_member_userId_idx").on(t.userId),
]);

export const timeEntry = pgTable("time_entry", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => projectTask.id, { onDelete: "cascade" }),
  teamMemberId: text("team_member_id")
    .notNull()
    .references(() => teamMember.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("time_entry_taskId_idx").on(t.taskId),
  index("time_entry_teamMemberId_idx").on(t.teamMemberId),
  index("time_entry_userId_idx").on(t.userId),
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
  clientMeetings: many(clientMeeting),
  clientContracts: many(clientContract),
  clientBriefings: many(clientBriefing),
  clientPolls: many(clientPoll),
  projects: many(project),
  milestones: many(milestone),
  teamMembers: many(teamMember),
  timeEntries: many(timeEntry),
  googleCalendarCredentials: many(googleCalendarCredential),
  agencySettings: many(agencySettings),
  aiSettings: many(aiSettings),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const clientRelations = relations(client, ({ one, many }) => ({
  user: one(user, { fields: [client.userId], references: [user.id] }),
  projects: many(project),
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
  meetings: many(clientMeeting),
  contracts: many(clientContract),
  briefings: many(clientBriefing),
  polls: many(clientPoll),
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
  annotations: many(messageAnnotation),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  user: one(user, { fields: [message.userId], references: [user.id] }),
  annotations: many(messageAnnotation),
}));

export const messageAnnotationRelations = relations(messageAnnotation, ({ one }) => ({
  message: one(message, {
    fields: [messageAnnotation.messageId],
    references: [message.id],
  }),
  conversation: one(conversation, {
    fields: [messageAnnotation.conversationId],
    references: [conversation.id],
  }),
  user: one(user, { fields: [messageAnnotation.userId], references: [user.id] }),
}));

// ============================================================
// PÓS-VENDA — Relations
// ============================================================

export const projectTaskRelations = relations(projectTask, ({ one }) => ({
  client: one(client, { fields: [projectTask.clientId], references: [client.id] }),
  project: one(project, { fields: [projectTask.projectId], references: [project.id] }),
  milestone: one(milestone, { fields: [projectTask.milestoneId], references: [milestone.id] }),
  user: one(user, { fields: [projectTask.userId], references: [user.id] }),
  assignee: one(teamMember, { fields: [projectTask.assignedTo], references: [teamMember.id] }),
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

export const clientMeetingRelations = relations(clientMeeting, ({ one }) => ({
  client: one(client, { fields: [clientMeeting.clientId], references: [client.id] }),
  user: one(user, { fields: [clientMeeting.userId], references: [user.id] }),
}));

export const clientContractRelations = relations(clientContract, ({ one }) => ({
  client: one(client, { fields: [clientContract.clientId], references: [client.id] }),
  user: one(user, { fields: [clientContract.userId], references: [user.id] }),
}));

export const clientBriefingRelations = relations(clientBriefing, ({ one }) => ({
  client: one(client, { fields: [clientBriefing.clientId], references: [client.id] }),
  user: one(user, { fields: [clientBriefing.userId], references: [user.id] }),
}));

export const clientPollRelations = relations(clientPoll, ({ one }) => ({
  client: one(client, { fields: [clientPoll.clientId], references: [client.id] }),
  user: one(user, { fields: [clientPoll.userId], references: [user.id] }),
}));

export const googleCalendarCredentialRelations = relations(googleCalendarCredential, ({ one }) => ({
  user: one(user, { fields: [googleCalendarCredential.userId], references: [user.id] }),
}));

export const agencySettingsRelations = relations(agencySettings, ({ one }) => ({
  user: one(user, { fields: [agencySettings.userId], references: [user.id] }),
}));

export const aiSettingsRelations = relations(aiSettings, ({ one }) => ({
  user: one(user, { fields: [aiSettings.userId], references: [user.id] }),
}));

// ============================================================
// GESTAO DE PROJETOS — Relations
// ============================================================

export const projectRelations = relations(project, ({ one, many }) => ({
  client: one(client, { fields: [project.clientId], references: [client.id] }),
  user: one(user, { fields: [project.userId], references: [user.id] }),
  milestones: many(milestone),
  tasks: many(projectTask),
}));

export const milestoneRelations = relations(milestone, ({ one, many }) => ({
  project: one(project, { fields: [milestone.projectId], references: [project.id] }),
  user: one(user, { fields: [milestone.userId], references: [user.id] }),
  tasks: many(projectTask),
}));

export const teamMemberRelations = relations(teamMember, ({ one, many }) => ({
  user: one(user, { fields: [teamMember.userId], references: [user.id] }),
  assignedTasks: many(projectTask),
  timeEntries: many(timeEntry),
}));

export const timeEntryRelations = relations(timeEntry, ({ one }) => ({
  task: one(projectTask, { fields: [timeEntry.taskId], references: [projectTask.id] }),
  teamMember: one(teamMember, { fields: [timeEntry.teamMemberId], references: [teamMember.id] }),
  user: one(user, { fields: [timeEntry.userId], references: [user.id] }),
}));
