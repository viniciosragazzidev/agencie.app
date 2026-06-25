# Pós-Venda: 10 Funcionalidades Estratégicas — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar 10 funcionalidades estratégicas de pós-venda e sucesso do cliente no agencie.app, incluindo portal do cliente, kanban persistido, aprovações, onboarding, NPS, escopo, verba de ads, anti-churn, entregáveis, anotações e quicklinks.

**Architecture:** Nova seção `(app)/client-portal/` para o portal do cliente com autenticação dedicada. Schema Drizzle expandido com ~10 novas tabelas. API routes padronizadas em `/api/client-portal/*`. Dashboard da agência expandida com widgets de saúde, churn e escopo. Utiliza as skills `gpt-taste`, `design-spells`, `database-design`, `api-patterns` e `nextjs-best-practices`.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, PostgreSQL, better-auth, shadcn/ui, GSAP, Recharts, Hugeicons, Tailwind v4, Zod v4.

**Conventions:**
- Double-bezel cards: `p-1.5 rounded-[1.5rem]` outer + `bg-card rounded-[calc(1.5rem-0.375rem)]` inner
- Motion: `cubic-bezier(0.32,0.72,0,1)`, `active:scale-[0.98]`, GSAP staggers
- Colors: semantic tokens only (`bg-background`, `text-muted-foreground`, etc.)
- Icons: `strokeWidth={1.5}`, Hugeicons
- Badges: `text-[9px] font-bold tracking-widest bg-[color]/10 text-[color] ring-1 ring-[color]/20 rounded-full px-2 py-0.5 uppercase`
- IDs: `text("id").primaryKey()` via crypto.randomUUID()

---

## FASE 0 — Database Schema (Foundation)

### Task 0.1: Expandir schema Drizzle com 10 novas tabelas

**Files:**
- Modify: `lib/db/schema.ts`

**Step 1: Adicionar imports necessários**

```ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, jsonb, integer } from "drizzle-orm/pg-core";
```

**Step 2: Adicionar tabela `project_task` (Feature 1 — Kanban persistido)**

```ts
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
```

**Step 3: Adicionar tabela `approval` (Feature 2 — Aprovações)**

```ts
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
```

**Step 4: Adicionar tabela `client_interaction` (Feature 3 — Anti-Churn)**

```ts
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
```

**Step 5: Adicionar tabela `client_asset` (Feature 4 — Assets Hub)**

```ts
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
```

**Step 6: Adicionar tabela `client_note` (Feature 5 — Context Shadow)**

```ts
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
```

**Step 7: Adicionar tabela `onboarding_task` (Feature 6 — Onboarding)**

```ts
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
```

**Step 8: Adicionar tabela `client_satisfaction` (Feature 7 — NPS Express)**

```ts
export const clientSatisfaction = pgTable("client_satisfaction", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // 1-5
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("client_satisfaction_clientId_idx").on(t.clientId),
]);
```

**Step 9: Adicionar tabela `client_quicklink` (Feature 8 — Quicklinks)**

```ts
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
```

**Step 10: Adicionar tabela `client_scope` (Feature 9 — Scope Wall)**

```ts
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
```

**Step 11: Adicionar tabela `ad_spend_tracker` (Feature 10 — Ad Spend)**

```ts
export const adSpendTracker = pgTable("ad_spend_tracker", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // "2026-06"
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
```

**Step 12: Adicionar relações para todas as novas tabelas**

Adicionar no final do arquivo:

```ts
// Novas relações
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
```

**Step 13: Atualizar relações do `client` para incluir as novas tabelas**

No bloco `clientRelations`, adicionar:

```ts
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
}));
```

**Step 14: Gerar migração e aplicar**

Run: `npm run db:generate && npm run db:push`

---

## FASE 1 — API Routes

### Task 1.1: API para Kanban de Projetos (Feature 1)

**Files:**
- Create: `app/api/client-portal/tasks/route.ts`
- Create: `app/api/client-portal/tasks/[id]/route.ts`

**Step 1: Criar GET/POST route para tasks**

```ts
// app/api/client-portal/tasks/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projectTask } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const tasks = await db.select().from(projectTask).where(eq(projectTask.clientId, clientId))
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, title, description, status } = body

  const [task] = await db.insert(projectTask).values({
    id: crypto.randomUUID(),
    clientId,
    userId,
    title,
    description,
    status: status || "todo",
  }).returning()

  return NextResponse.json(task)
}
```

**Step 2: Criar PATCH/DELETE route para task individual**

```ts
// app/api/client-portal/tasks/[id]/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projectTask } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const [updated] = await db.update(projectTask).set(body).where(eq(projectTask.id, params.id)).returning()
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await db.delete(projectTask).where(eq(projectTask.id, params.id))
  return NextResponse.json({ ok: true })
}
```

### Task 1.2: API para Aprovações (Feature 2)

**Files:**
- Create: `app/api/client-portal/approvals/route.ts`
- Create: `app/api/client-portal/approvals/[id]/route.ts`

**Step 1: Criar GET/POST para approvals**

```ts
// app/api/client-portal/approvals/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { approval } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const approvals = await db.select().from(approval).where(eq(approval.clientId, clientId))
  return NextResponse.json(approvals)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, title, description, fileUrl, fileType } = body

  const [item] = await db.insert(approval).values({
    id: crypto.randomUUID(),
    clientId,
    userId,
    title,
    description,
    fileUrl,
    fileType,
  }).returning()

  return NextResponse.json(item)
}
```

**Step 2: Criar PATCH para aprovar/rejeitar**

```ts
// app/api/client-portal/approvals/[id]/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { approval, clientInteraction } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { status, clientComment } = body

  const [updated] = await db.update(approval).set({
    status,
    clientComment,
    approvedAt: status === "approved" ? new Date() : null,
  }).where(eq(approval.id, params.id)).returning()

  // Registrar interação para anti-churn
  if (updated) {
    await db.insert(clientInteraction).values({
      id: crypto.randomUUID(),
      clientId: updated.clientId,
      userId: updated.userId,
      type: "note",
      description: `Aprovação "${updated.title}" marcada como ${status}`,
      isAutomatic: true,
    })
  }

  return NextResponse.json(updated)
}
```

### Task 1.3: API para Anti-Churn (Feature 3)

**Files:**
- Create: `app/api/client-portal/interactions/route.ts`
- Create: `app/api/client-portal/churn-alerts/route.ts`

**Step 1: Criar route de interações**

```ts
// app/api/client-portal/interactions/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientInteraction } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const interactions = await db.select().from(clientInteraction)
    .where(eq(clientInteraction.clientId, clientId))
    .orderBy(desc(clientInteraction.createdAt))
    .limit(50)

  return NextResponse.json(interactions)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, type, description } = body

  const [interaction] = await db.insert(clientInteraction).values({
    id: crypto.randomUUID(),
    clientId,
    userId,
    type,
    description,
  }).returning()

  return NextResponse.json(interaction)
}
```

**Step 2: Criar route de alertas de churn**

```ts
// app/api/client-portal/churn-alerts/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { client, clientInteraction } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const clients = await db.select().from(client).where(eq(client.userId, userId))
  const alerts = []

  for (const c of clients) {
    const lastInteraction = await db.select().from(clientInteraction)
      .where(eq(clientInteraction.clientId, c.id))
      .orderBy(desc(clientInteraction.createdAt))
      .limit(1)

    const lastDate = lastInteraction[0]?.createdAt || c.updatedAt
    const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince >= 7) {
      alerts.push({
        clientId: c.id,
        clientName: c.name,
        daysSinceContact: daysSince,
        severity: daysSince >= 14 ? "critical" : "warning",
      })
    }
  }

  return NextResponse.json(alerts)
}
```

### Task 1.4: API para Assets Hub (Feature 4)

**Files:**
- Create: `app/api/client-portal/assets/route.ts`
- Create: `app/api/client-portal/assets/[id]/route.ts`

**Step 1: CRUD de assets**

```ts
// app/api/client-portal/assets/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientAsset } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const assets = await db.select().from(clientAsset).where(eq(clientAsset.clientId, clientId))
  return NextResponse.json(assets)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, name, category, fileUrl, linkUrl, notes } = body

  const [asset] = await db.insert(clientAsset).values({
    id: crypto.randomUUID(),
    clientId, userId, name, category, fileUrl, linkUrl, notes,
  }).returning()

  return NextResponse.json(asset)
}
```

**Step 2: DELETE asset**

```ts
// app/api/client-portal/assets/[id]/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientAsset } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await db.delete(clientAsset).where(eq(clientAsset.id, params.id))
  return NextResponse.json({ ok: true })
}
```

### Task 1.5: API para Context Shadow (Feature 5)

**Files:**
- Create: `app/api/client-portal/notes/route.ts`
- Create: `app/api/client-portal/notes/[id]/route.ts`

**Step 1: GET/POST notes**

```ts
// app/api/client-portal/notes/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientNote } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const notes = await db.select().from(clientNote)
    .where(eq(clientNote.clientId, clientId))
    .orderBy(desc(clientNote.createdAt))
  return NextResponse.json(notes)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, content, tag } = body

  const [note] = await db.insert(clientNote).values({
    id: crypto.randomUUID(),
    clientId, userId, content, tag,
  }).returning()

  return NextResponse.json(note)
}
```

### Task 1.6: API para Onboarding (Feature 6)

**Files:**
- Create: `app/api/client-portal/onboarding/route.ts`
- Create: `app/api/client-portal/onboarding/[id]/route.ts`

**Step 1: GET/POST onboarding tasks**

```ts
// app/api/client-portal/onboarding/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { onboardingTask } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const tasks = await db.select().from(onboardingTask)
    .where(eq(onboardingTask.clientId, clientId))
    .orderBy(asc(onboardingTask.position))
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, title, description, isRequired, position } = body

  const [task] = await db.insert(onboardingTask).values({
    id: crypto.randomUUID(),
    clientId, userId, title, description, isRequired, position,
  }).returning()

  return NextResponse.json(task)
}
```

**Step 2: PATCH toggle completion**

```ts
// app/api/client-portal/onboarding/[id]/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { onboardingTask } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const [updated] = await db.update(onboardingTask).set({
    ...body,
    completedAt: body.isCompleted ? new Date() : null,
  }).where(eq(onboardingTask.id, params.id)).returning()

  return NextResponse.json(updated)
}
```

### Task 1.7: API para NPS Express (Feature 7)

**Files:**
- Create: `app/api/client-portal/satisfaction/route.ts`

**Step 1: GET/POST satisfaction scores**

```ts
// app/api/client-portal/satisfaction/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientSatisfaction } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const scores = await db.select().from(clientSatisfaction)
    .where(eq(clientSatisfaction.clientId, clientId))
    .orderBy(desc(clientSatisfaction.createdAt))
  return NextResponse.json(scores)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, score, note } = body

  const [item] = await db.insert(clientSatisfaction).values({
    id: crypto.randomUUID(),
    clientId, score, note,
  }).returning()

  return NextResponse.json(item)
}
```

### Task 1.8: API para Quicklinks (Feature 8)

**Files:**
- Create: `app/api/client-portal/quicklinks/route.ts`
- Create: `app/api/client-portal/quicklinks/[id]/route.ts`

**Step 1: CRUD quicklinks**

```ts
// app/api/client-portal/quicklinks/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientQuicklink } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const links = await db.select().from(clientQuicklink)
    .where(eq(clientQuicklink.clientId, clientId))
    .orderBy(asc(clientQuicklink.position))
  return NextResponse.json(links)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, label, url, icon, position } = body

  const [link] = await db.insert(clientQuicklink).values({
    id: crypto.randomUUID(),
    clientId, userId, label, url, icon, position,
  }).returning()

  return NextResponse.json(link)
}
```

### Task 1.9: API para Scope Wall (Feature 9)

**Files:**
- Create: `app/api/client-portal/scope/route.ts`
- Create: `app/api/client-portal/scope/[id]/route.ts`

**Step 1: GET/POST/PATCH scopes**

```ts
// app/api/client-portal/scope/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientScope } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const scopes = await db.select().from(clientScope).where(eq(clientScope.clientId, clientId))
  return NextResponse.json(scopes)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, label, totalQuota, period } = body

  const [scope] = await db.insert(clientScope).values({
    id: crypto.randomUUID(),
    clientId, userId, label, totalQuota, period,
  }).returning()

  return NextResponse.json(scope)
}
```

**Step 2: PATCH para consumo de quota**

```ts
// app/api/client-portal/scope/[id]/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientScope } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const [updated] = await db.update(clientScope).set(body).where(eq(clientScope.id, params.id)).returning()
  return NextResponse.json(updated)
}
```

### Task 1.10: API para Ad Spend Tracker (Feature 10)

**Files:**
- Create: `app/api/client-portal/ad-spend/route.ts`
- Create: `app/api/client-portal/ad-spend/[id]/route.ts`

**Step 1: GET/POST/PATCH ad spend**

```ts
// app/api/client-portal/ad-spend/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { adSpendTracker } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const trackers = await db.select().from(adSpendTracker).where(eq(adSpendTracker.clientId, clientId))
  return NextResponse.json(trackers)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { clientId, userId, month, plannedBudget, platform, dailyPace } = body

  const [tracker] = await db.insert(adSpendTracker).values({
    id: crypto.randomUUID(),
    clientId, userId, month, plannedBudget, platform, dailyPace,
  }).returning()

  return NextResponse.json(tracker)
}
```

**Step 2: PATCH para atualizar gasto**

```ts
// app/api/client-portal/ad-spend/[id]/route.ts
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { adSpendTracker } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const [updated] = await db.update(adSpendTracker).set(body).where(eq(adSpendTracker.id, params.id)).returning()
  return NextResponse.json(updated)
}
```

---

## FASE 2 — Kanban Persistido (Feature 1 — Refatoração)

### Task 2.1: Refatorar Kanban existente para usar DB

**Files:**
- Modify: `app/(app)/clients/[id]/page.tsx` (seção Kanban)

**Step 1: Substituir estados locais do Kanban por fetch/POST**

No componente `ClientDashboardPage`, substituir:

```ts
// ANTES (client-side only)
const [tasks, setTasks] = useState<KanbanTask[]>([])

// DEPOIS (persistido)
const [tasks, setTasks] = useState<KanbanTask[]>([])

useEffect(() => {
  if (id) {
    fetch(`/api/client-portal/tasks?clientId=${id}`)
      .then(r => r.json())
      .then(data => setTasks(data))
  }
}, [id])
```

**Step 2: Atualizar `addTask` para persistir**

```ts
const addTask = async (status: "todo" | "in_progress" | "done") => {
  if (!newTaskTitle.trim()) return
  const res = await fetch("/api/client-portal/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: id, userId: "current-user-id", title: newTaskTitle, status }),
  })
  const task = await res.json()
  setTasks(prev => [...prev, task])
  setNewTaskTitle("")
  triggerToast("Tarefa adicionada!")
}
```

**Step 3: Atualizar `moveTask` para persistir**

```ts
const moveTask = async (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
  await fetch(`/api/client-portal/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  })
  setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  triggerToast("Tarefa movida!")
}
```

**Step 4: Adicionar `deleteTask`**

```ts
const deleteTask = async (taskId: string) => {
  await fetch(`/api/client-portal/tasks/${taskId}`, { method: "DELETE" })
  setTasks(prev => prev.filter(t => t.id !== taskId))
  triggerToast("Tarefa removida!")
}
```

**Step 5: Buscar `userId` da sessão**

No topo do componente, usar `authClient.useSession()` para obter o `userId` e passar nas chamadas de API.

---

## FASE 3 — Novos Componentes UI

### Task 3.1: Componente `ProjectStatusPipeline` (Feature 1)

**Files:**
- Create: `components/project-status-pipeline.tsx`

**Step 1: Criar componente Kanban refinado**

```tsx
"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, TimeQuarterPassIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface Task {
  id: string
  title: string
  status: "todo" | "in_progress" | "done"
}

const columns = [
  { key: "todo" as const, label: "A Fazer", icon: Cancel01Icon, color: "muted" },
  { key: "in_progress" as const, label: "Em Execução", icon: TimeQuarterPassIcon, color: "primary" },
  { key: "done" as const, label: "Concluído", icon: CheckmarkCircle02Icon, color: "green-500" },
]

export function ProjectStatusPipeline({ tasks, onMove, onDelete }: {
  tasks: Task[]
  onMove: (id: string, status: Task["status"]) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)
        return (
          <div key={col.key} className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] flex flex-col h-[400px]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={col.icon} strokeWidth={1.5} className={`size-4 text-${col.color}`} />
                  <h3 className="font-semibold text-xs text-foreground font-display">{col.label}</h3>
                </div>
                <span className={`text-[9px] font-bold bg-${col.color}/10 text-${col.color} rounded px-1.5 py-0.5`}>
                  {colTasks.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-2.5">
                {colTasks.map(task => (
                  <div key={task.id} className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-2 group">
                    <p className="text-xs text-foreground font-semibold">{task.title}</p>
                    <div className="flex justify-end gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.key !== "done" && (
                        <Button variant="outline" size="xs" onClick={() => onMove(task.id, col.key === "todo" ? "in_progress" : "done")} className="text-[9px] h-6 px-2 font-bold uppercase tracking-wider">
                          Avançar
                        </Button>
                      )}
                      {col.key !== "todo" && (
                        <Button variant="outline" size="xs" onClick={() => onMove(task.id, col.key === "done" ? "in_progress" : "todo")} className="text-[9px] h-6 px-2 font-bold uppercase tracking-wider">
                          Reverter
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### Task 3.2: Componente `ApprovalPanel` (Feature 2)

**Files:**
- Create: `components/approval-panel.tsx`

**Step 1: Criar painel de aprovações com um clique**

```tsx
"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Edit02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface ApprovalItem {
  id: string
  title: string
  description?: string
  fileUrl?: string
  fileType: string
  status: "pending" | "approved" | "revision"
  clientComment?: string
}

const statusConfig = {
  pending: { label: "Aguardando", color: "amber-500", ring: "ring-amber-500/20" },
  approved: { label: "Aprovado", color: "green-500", ring: "ring-green-500/20" },
  revision: { label: "Revisão", color: "destructive", ring: "ring-destructive/20" },
}

export function ApprovalPanel({ items, onApprove, onRevision }: {
  items: ApprovalItem[]
  onApprove: (id: string) => void
  onRevision: (id: string, comment: string) => void
}) {
  return (
    <div className="space-y-3">
      {items.map(item => {
        const st = statusConfig[item.status]
        return (
          <div key={item.id} className="p-4 bg-muted/10 border border-border/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.fileType.toUpperCase()}</p>
              </div>
              <span className={`text-[9px] font-bold tracking-widest bg-${st.color}/10 text-${st.color} ring-1 ${st.ring} rounded-full px-2 py-0.5 uppercase`}>
                {st.label}
              </span>
            </div>
            {item.description && <p className="text-[10px] text-muted-foreground">{item.description}</p>}
            {item.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <Button size="xs" onClick={() => onApprove(item.id)} className="text-[9px] h-7 px-3 font-bold uppercase tracking-wider gap-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className="size-3" /> Aprovar
                </Button>
                <Button size="xs" variant="outline" onClick={() => onRevision(item.id, "")} className="text-[9px] h-7 px-3 font-bold uppercase tracking-wider gap-1 border-destructive/20 text-destructive hover:bg-destructive/10">
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.5} className="size-3" /> Solicitar Ajuste
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

### Task 3.3: Componente `ChurnAlertCard` (Feature 3)

**Files:**
- Create: `components/churn-alert-card.tsx`

**Step 1: Card de alerta de churn com shake animation**

```tsx
"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, PhoneIcon, Message01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface ChurnAlert {
  clientId: string
  clientName: string
  daysSinceContact: number
  severity: "warning" | "critical"
}

export function ChurnAlertCard({ alerts, onCall, onMessage }: {
  alerts: ChurnAlert[]
  onCall: (clientId: string) => void
  onMessage: (clientId: string) => void
}) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div
          key={alert.clientId}
          className={`p-4 border rounded-2xl flex items-center justify-between gap-4 ${
            alert.severity === "critical"
              ? "bg-destructive/5 border-destructive/20 animate-[shake_0.5s_ease-in-out]"
              : "bg-amber-500/5 border-amber-500/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center ${
              alert.severity === "critical" ? "bg-destructive/10" : "bg-amber-500/10"
            }`}>
              <HugeiconsIcon icon={Alert01Icon} strokeWidth={1.5} className={`size-5 ${
                alert.severity === "critical" ? "text-destructive" : "text-amber-500"
              }`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{alert.clientName}</p>
              <p className="text-[10px] text-muted-foreground">
                {alert.daysSinceContact} dias sem contato
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="xs" variant="outline" onClick={() => onCall(alert.clientId)} className="h-7 text-[9px] font-bold uppercase tracking-wider gap-1">
              <HugeiconsIcon icon={PhoneIcon} strokeWidth={1.5} className="size-3" /> Ligação
            </Button>
            <Button size="xs" onClick={() => onMessage(alert.clientId)} className="h-7 text-[9px] font-bold uppercase tracking-wider gap-1">
              <HugeiconsIcon icon={Message01Icon} strokeWidth={1.5} className="size-3" /> Mensagem
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Task 3.4: Componente `AssetsHub` (Feature 4)

**Files:**
- Create: `components/assets-hub.tsx`

**Step 1: Criar hub de entregáveis com categorias**

```tsx
"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FolderOpenIcon, Download01Icon, Link01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface Asset {
  id: string
  name: string
  category: string
  fileUrl?: string
  linkUrl?: string
  notes?: string
}

const categoryIcons: Record<string, string> = {
  logo: "Identidade",
  report: "Relatório",
  access: "Acesso",
  art: "Arte",
  contract: "Contrato",
  other: "Outro",
}

export function AssetsHub({ assets, onDelete }: {
  assets: Asset[]
  onDelete?: (id: string) => void
}) {
  const grouped = assets.reduce((acc, asset) => {
    const cat = asset.category || "other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(asset)
    return acc
  }, {} as Record<string, Asset[]>)

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2">
            {categoryIcons[cat] || cat}
          </p>
          <div className="space-y-2">
            {items.map(asset => (
              <div key={asset.id} className="p-3 bg-muted/10 border border-border/30 rounded-xl flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={1.5} className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{asset.name}</p>
                    {asset.notes && <p className="text-[10px] text-muted-foreground truncate">{asset.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {asset.linkUrl && (
                    <a href={asset.linkUrl} target="_blank" rel="noreferrer" className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-border/40 flex items-center gap-1 hover:bg-muted">
                      <HugeiconsIcon icon={Link01Icon} strokeWidth={1.5} className="size-3" /> Abrir
                    </a>
                  )}
                  {asset.fileUrl && (
                    <a href={asset.fileUrl} download className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider rounded-lg bg-primary/10 text-primary flex items-center gap-1 hover:bg-primary/20">
                      <HugeiconsIcon icon={Download01Icon} strokeWidth={1.5} className="size-3" /> Baixar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Task 3.5: Componente `OnboardingChecklist` (Feature 6)

**Files:**
- Create: `components/onboarding-checklist.tsx`

**Step 1: Checklist gamificado com progresso**

```tsx
"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

interface OnboardingTask {
  id: string
  title: string
  description?: string
  isRequired: boolean
  isCompleted: boolean
}

export function OnboardingChecklist({ tasks, onToggle }: {
  tasks: OnboardingTask[]
  onToggle: (id: string, completed: boolean) => void
}) {
  const completed = tasks.filter(t => t.isCompleted).length
  const total = tasks.length
  const progress = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Progresso do Onboarding
        </p>
        <p className="text-xs font-semibold text-foreground">{completed}/{total}</p>
      </div>
      <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => onToggle(task.id, !task.isCompleted)}
            className={`p-3 border rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
              task.isCompleted
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/10 border-border/30 hover:border-border/50"
            }`}
          >
            <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
              task.isCompleted ? "bg-primary/20" : "bg-muted/20"
            }`}>
              <HugeiconsIcon
                icon={task.isCompleted ? CheckmarkCircle02Icon : Cancel01Icon}
                strokeWidth={1.5}
                className={`size-4 ${task.isCompleted ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${task.isCompleted ? "text-primary line-through" : "text-foreground"}`}>
                {task.title}
              </p>
              {task.description && <p className="text-[10px] text-muted-foreground">{task.description}</p>}
            </div>
            {task.isRequired && (
              <span className="text-[8px] font-bold tracking-widest bg-destructive/10 text-destructive ring-1 ring-destructive/20 rounded-full px-1.5 py-0.5 uppercase shrink-0">
                Obrigatório
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Task 3.6: Componente `NPSSurvey` (Feature 7)

**Files:**
- Create: `components/nps-survey.tsx`

**Step 1: Micro-formulário NPS com emojis/notas**

```tsx
"use client"

import React, { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FavouriteIcon } from "@hugeicons/core-free-icons"

interface NPSSurveyProps {
  onSubmit: (score: number) => void
}

const scoreLabels = [
  "", // 0 index
  "Muito Insatisfeito",
  "Insatisfeito",
  "Neutro",
  "Satisfeito",
  "Muito Satisfeito",
]

const scoreColors = [
  "",
  "text-destructive",
  "text-orange-500",
  "text-amber-500",
  "text-green-500",
  "text-emerald-500",
]

export function NPSSurvey({ onSubmit }: NPSSurveyProps) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="p-5 bg-muted/10 border border-border/30 rounded-2xl space-y-4">
      <div className="text-center">
        <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="size-6 text-primary mx-auto mb-2" />
        <p className="text-xs font-semibold text-foreground">Qual seu nível de satisfação com os resultados?</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Avaliação mensal — leva 5 segundos</p>
      </div>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map(score => (
          <button
            key={score}
            onClick={() => setSelected(score)}
            className={`size-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 active:scale-[0.95] ${
              selected === score
                ? `bg-primary/20 text-primary ring-2 ring-primary/40`
                : "bg-muted/20 text-muted-foreground hover:bg-muted/30 ring-1 ring-border/30"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="text-center space-y-3 animate-in fade-in duration-200">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${scoreColors[selected]}`}>
            {scoreLabels[selected]}
          </p>
          <button
            onClick={() => onSubmit(selected)}
            className="h-8 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Enviar Avaliação
          </button>
        </div>
      )}
    </div>
  )
}
```

### Task 3.7: Componente `ScopeWall` (Feature 9)

**Files:**
- Create: `components/scope-wall.tsx`

**Step 1: Visualização de escopo com barras de progresso**

```tsx
"use client"

import React from "react"

interface ScopeItem {
  id: string
  label: string
  totalQuota: number
  usedQuota: number
  period: string
}

export function ScopeWall({ scopes }: { scopes: ScopeItem[] }) {
  return (
    <div className="space-y-4">
      {scopes.map(scope => {
        const remaining = scope.totalQuota - scope.usedQuota
        const percentage = (scope.usedQuota / scope.totalQuota) * 100
        const isOver = remaining <= 0

        return (
          <div key={scope.id} className="p-3.5 bg-muted/10 border border-border/30 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">{scope.label}</p>
              <span className={`text-[9px] font-bold tracking-widest rounded-full px-2 py-0.5 uppercase ${
                isOver
                  ? "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
                  : percentage > 80
                  ? "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20"
                  : "bg-green-500/10 text-green-500 ring-1 ring-green-500/20"
              }`}>
                {remaining} restante{remaining !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isOver ? "bg-destructive" : percentage > 80 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{scope.usedQuota} / {scope.totalQuota} consumidos</span>
              <span className="capitalize">{scope.period === "monthly" ? "Mensal" : scope.period === "quarterly" ? "Trimestral" : "Único"}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### Task 3.8: Componente `AdSpendMeter` (Feature 10)

**Files:**
- Create: `components/ad-spend-meter.tsx`

**Step 1: Termômetro visual de verba de ads com Recharts**

```tsx
"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"

interface AdSpend {
  id: string
  month: string
  plannedBudget: string
  spentAmount: string
  platform: string
}

export function AdSpendMeter({ trackers }: { trackers: AdSpend[] }) {
  const data = trackers.map(t => {
    const planned = parseFloat(t.plannedBudget)
    const spent = parseFloat(t.spentAmount)
    const percentage = planned > 0 ? (spent / planned) * 100 : 0
    return {
      name: t.platform.toUpperCase(),
      planejado: planned,
      gasto: spent,
      percentage,
      color: percentage > 100 ? "hsl(var(--destructive))" : percentage > 80 ? "hsl(38,92%,50%)" : "hsl(var(--primary))",
    }
  })

  return (
    <div className="space-y-4">
      {data.map((item, i) => (
        <div key={i} className="p-3.5 bg-muted/10 border border-border/30 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">{item.name}</p>
            <span className={`text-[9px] font-bold tracking-widest rounded-full px-2 py-0.5 uppercase ${
              item.percentage > 100 ? "bg-destructive/10 text-destructive ring-1 ring-destructive/20" :
              item.percentage > 80 ? "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20" :
              "bg-green-500/10 text-green-500 ring-1 ring-green-500/20"
            }`}>
              {item.percentage.toFixed(0)}%
            </span>
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: "planejado", value: item.planejado }, { name: "gasto", value: item.gasto }]} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={12}>
                  <Cell fill="hsl(var(--muted))" />
                  <Cell fill={item.color} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Gasto: R$ {item.gasto.toLocaleString()}</span>
            <span>Planejado: R$ {item.planejado.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Task 3.9: Componente `QuicklinksHub` (Feature 8)

**Files:**
- Create: `components/quicklinks-hub.tsx`

**Step 1: Card de links rápidos fixos**

```tsx
"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link01Icon, Video01Icon, File01Icon, ContractIcon } from "@hugeicons/core-free-icons"

interface Quicklink {
  id: string
  label: string
  url: string
  icon?: string
}

const iconMap: Record<string, typeof Link01Icon> = {
  meet: Video01Icon,
  dashboard: File01Icon,
  contrato: ContractIcon,
  default: Link01Icon,
}

export function QuicklinksHub({ links }: { links: Quicklink[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(link => {
        const Icon = iconMap[link.icon || "default"] || Link01Icon
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-primary/5 border border-primary/20 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
          >
            <HugeiconsIcon icon={Icon} strokeWidth={1.5} className="size-4" />
            {link.label}
          </a>
        )
      })}
    </div>
  )
}
```

### Task 3.10: Componente `ClientNotesPanel` (Feature 5)

**Files:**
- Create: `components/client-notes-panel.tsx`

**Step 1: Painel de anotações internas**

```tsx
"use client"

import React, { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon, Calendar03Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Note {
  id: string
  content: string
  tag: string
  createdAt: string
}

const tagColors: Record<string, string> = {
  meeting: "bg-blue-500/10 text-blue-500 ring-blue-500/20",
  briefing: "bg-purple-500/10 text-purple-500 ring-purple-500/20",
  strategy: "bg-primary/10 text-primary ring-primary/20",
  general: "bg-muted text-muted-foreground ring-border/30",
}

export function ClientNotesPanel({ notes, onAdd }: {
  notes: Note[]
  onAdd: (content: string, tag: string) => void
}) {
  const [newNote, setNewNote] = useState("")
  const [selectedTag, setSelectedTag] = useState("general")

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Adicionar nota de reunião, briefing ou alinhamento..."
          className="bg-muted/10 border-border/40 text-xs min-h-[80px]"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {["meeting", "briefing", "strategy", "general"].map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ring-1 transition-all ${
                  selectedTag === tag ? tagColors[tag] : "bg-muted/20 text-muted-foreground ring-border/20"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <Button
            size="xs"
            onClick={() => { if (newNote.trim()) { onAdd(newNote, selectedTag); setNewNote("") } }}
            className="h-6 text-[9px] font-bold uppercase tracking-wider"
          >
            Salvar
          </Button>
        </div>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
        {notes.map(note => (
          <div key={note.id} className="p-3 bg-muted/10 border border-border/30 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full ring-1 ${tagColors[note.tag] || tagColors.general}`}>
                {note.tag}
              </span>
              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="size-2.5" />
                {new Date(note.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-[11px] text-foreground font-medium leading-relaxed">{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## FASE 4 — Dashboard da Agência (Widgets Anti-Churn e NPS)

### Task 4.1: Expandir Dashboard com widgets de retenção

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

**Step 1: Adicionar seção "Saúde dos Clientes" no dashboard**

No dashboard, adicionar após os KPIs existentes:

```tsx
// Nova seção: Health Overview
<section className="grid grid-cols-1 lg:grid-cols-2 gap-5 bento-detail-item">
  {/* Churn Alerts */}
  <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
    <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <HugeiconsIcon icon={Alert01Icon} strokeWidth={1.5} className="size-4 text-destructive" />
        <h3 className="font-semibold text-xs text-foreground font-display">Alertas de Churn</h3>
      </div>
      <ChurnAlertCard alerts={churnAlerts} onCall={handleCall} onMessage={handleMessage} />
    </div>
  </div>

  {/* NPS Overview */}
  <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
    <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="size-4 text-primary" />
        <h3 className="font-semibold text-xs text-foreground font-display">NPS dos Clientes</h3>
      </div>
      {/* Barra de progresso colorida com score médio */}
      <div className="space-y-3">
        {clientsWithScores.map(c => (
          <div key={c.id} className="flex items-center gap-3">
            <span className="text-[10px] font-semibold text-foreground w-24 truncate">{c.name}</span>
            <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${c.score >= 4 ? "bg-green-500" : c.score >= 3 ? "bg-amber-500" : "bg-destructive"}`}
                style={{ width: `${(c.score / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-foreground">{c.score}/5</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
```

**Step 2: Buscar dados de churn e NPS no dashboard**

Adicionar useEffects para buscar `/api/client-portal/churn-alerts` e scores de satisfação.

---

## FASE 5 — Integração com Existing Client Detail Page

### Task 5.1: Expandir `/clients/[id]` com novos painéis

**Files:**
- Modify: `app/(app)/clients/[id]/page.tsx`

**Step 1: Adicionar abas/seções para features novas**

No final da página, após os modais existentes, adicionar seções:

- **Context Shadow (Notas)** — colapsável com `ClientNotesPanel`
- **Assets Hub** — colapsável com `AssetsHub`
- **Onboarding Checklist** — condicional (visível se status === "Onboarding")
- **Aprovações** — painel `ApprovalPanel`
- **Quicklinks** — `QuicklinksHub` no header
- **Scope Wall** — `ScopeWall` na sidebar
- **Ad Spend** — `AdSpendMeter` na sidebar

**Step 2: Fetch dados das novas tabelas**

Adicionar useEffects para buscar:
```ts
fetch(`/api/client-portal/notes?clientId=${id}`)
fetch(`/api/client-portal/assets?clientId=${id}`)
fetch(`/api/client-portal/approvals?clientId=${id}`)
fetch(`/api/client-portal/onboarding?clientId=${id}`)
fetch(`/api/client-portal/quicklinks?clientId=${id}`)
fetch(`/api/client-portal/scope?clientId=${id}`)
fetch(`/api/client-portal/ad-spend?clientId=${id}`)
```

**Step 3: Substituir Kanban existente pelo `ProjectStatusPipeline`**

Trocar a seção de Kanban inline pelo componente `ProjectStatusPipeline` importado.

---

## FASE 6 — Portal do Cliente (Client-Facing)

### Task 6.1: Criar layout do portal do cliente

**Files:**
- Create: `app/(client-portal)/layout.tsx`
- Create: `app/(client-portal)/page.tsx`

**Step 1: Criar route group `(client-portal)`**

O portal do cliente será uma seção separada com layout minimalista, sem sidebar da agência.

```tsx
// app/(client-portal)/layout.tsx
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-screen bg-background ${inter.className}`}>
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-md px-6 py-3 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">AP</span>
            </div>
            <span className="text-xs font-semibold text-foreground">Área do Cliente</span>
          </div>
          <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
            Agencie.App
          </span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

### Task 6.2: Criar página principal do portal do cliente

**Files:**
- Create: `app/(client-portal)/page.tsx`

**Step 1: Dashboard do cliente com todas as funcionalidades**

A página do portal conterá:
- QuicklinksHub (links úteis)
- ProjectStatusPipeline (kanban de status)
- ApprovalPanel (aprovações pendentes)
- OnboardingChecklist (se em onboarding)
- AssetsHub (entregáveis)
- NPSSurvey (avaliação mensal)
- ScopeWall (escopo contratado)
- AdSpendMeter (verba de ads)

**Step 2: Layout grid bento**

```tsx
"use client"

import React, { useEffect, useState } from "react"

export default function ClientPortalPage() {
  // Buscar clientId da sessão do cliente
  // Fetch todas as features
  // Renderizar grid bento com todos os componentes

  return (
    <div className="space-y-6">
      {/* Quicklinks */}
      <section className="bento-detail-item">
        <QuicklinksHub links={quicklinks} />
      </section>

      {/* Pipeline de Status */}
      <section className="bento-detail-item">
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Status dos Projetos</h3>
            <ProjectStatusPipeline tasks={tasks} onMove={handleMoveTask} onDelete={handleDeleteTask} />
          </div>
        </div>
      </section>

      {/* Grid 2 colunas: Aprovações + Escopo */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bento-detail-item double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Aprovações Pendentes</h3>
            <ApprovalPanel items={approvals} onApprove={handleApprove} onRevision={handleRevision} />
          </div>
        </div>
        <div className="bento-detail-item double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Escopo Contratado</h3>
            <ScopeWall scopes={scopes} />
          </div>
        </div>
      </section>

      {/* Onboarding (condicional) */}
      {isOnboarding && (
        <section className="bento-detail-item double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Onboarding</h3>
            <OnboardingChecklist tasks={onboardingTasks} onToggle={handleToggleOnboarding} />
          </div>
        </section>
      )}

      {/* Grid 2 colunas: Entregáveis + Verba */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bento-detail-item double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Entregáveis</h3>
            <AssetsHub assets={assets} />
          </div>
        </div>
        <div className="bento-detail-item double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Verba de Anúncios</h3>
            <AdSpendMeter trackers={adSpendTrackers} />
          </div>
        </div>
      </section>

      {/* NPS */}
      <section className="bento-detail-item">
        <NPSSurvey onSubmit={handleNPS} />
      </section>
    </div>
  )
}
```

---

## FASE 7 — Sidebar e Navegação

### Task 7.1: Adicionar "Área do Cliente" na sidebar

**Files:**
- Modify: `components/app-sidebar.tsx`

**Step 1: Adicionar item de navegação para portal do cliente**

No array `sectionsData`, adicionar na seção "Crescimento":

```ts
{
  name: "Área do Cliente",
  url: "/client-portal",
  icon: <HugeiconsIcon icon={UserIcon} strokeWidth={1.5} className="size-4" />,
  badge: "NEW",
},
```

**Step 2: Atualizar breadcrumbs**

Em `app/(app)/layout.tsx`, adicionar case para `client-portal`:

```ts
} else if (firstPath === "client-portal") {
  breadcrumbs.push({
    label: "Área do Cliente",
    href: "/client-portal",
    isLast: true,
  })
}
```

---

## Resumo das Features

| # | Feature | Tabela(s) Nova(s) | API Route(s) | Componente(s) |
|---|---------|-------------------|--------------|---------------|
| 1 | Central de Status Visual | `project_task` | `/api/client-portal/tasks` | `ProjectStatusPipeline` |
| 2 | Painel de Aprovações | `approval` | `/api/client-portal/approvals` | `ApprovalPanel` |
| 3 | Anti-Churn Beacon | `client_interaction` | `/api/client-portal/interactions`, `/api/client-portal/churn-alerts` | `ChurnAlertCard` |
| 4 | Assets Hub | `client_asset` | `/api/client-portal/assets` | `AssetsHub` |
| 5 | Context Shadow | `client_note` | `/api/client-portal/notes` | `ClientNotesPanel` |
| 6 | Onboarding Guiado | `onboarding_task` | `/api/client-portal/onboarding` | `OnboardingChecklist` |
| 7 | NPS Express | `client_satisfaction` | `/api/client-portal/satisfaction` | `NPSSurvey` |
| 8 | Quicklinks | `client_quicklink` | `/api/client-portal/quicklinks` | `QuicklinksHub` |
| 9 | Scope Wall | `client_scope` | `/api/client-portal/scope` | `ScopeWall` |
| 10 | Ad Spend Tracker | `ad_spend_tracker` | `/api/client-portal/ad-spend` | `AdSpendMeter` |

## Ordem de Execução Recomendada

1. **Fase 0** → Schema (todas as tabelas de uma vez)
2. **Fase 1** → API Routes (todas as rotas)
3. **Fase 2** → Kanban persistido (Feature 1)
4. **Fase 3** → Todos os componentes UI
5. **Fase 4** → Dashboard da agência (anti-churn + NPS)
6. **Fase 5** → Integração no `/clients/[id]`
7. **Fase 6** → Portal do cliente completo
8. **Fase 7** → Sidebar e navegação

## Skills Relacionadas

- `@gpt-taste` → Design de altíssima qualidade, double-bezel, motion
- `@design-spells` → Hover states, haptic feedback, animações
- `@database-design` → Schema Drizzle, migrações
- `@api-patterns` → Padronização de endpoints
- `@nextjs-best-practices` → App Router, Server Components, rotas
