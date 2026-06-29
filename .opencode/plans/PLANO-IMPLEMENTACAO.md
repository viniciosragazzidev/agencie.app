# PLANO DE IMPLEMENTACAO - De CRM para Gestor de Agencias

> **Data:** 25/06/2026
> **Base:** RAIO-X-MATURIDADE-SISTEMA.md
> **Tech Stack:** Next.js App Router, Drizzle ORM (PostgreSQL), OpenWA, SSE, better-auth

---

## FASE 1: Reestruturacao do Core de Projetos e Multi-User

### 1.1 Nova Tabela `project`

A tabela `client` atual tem um campo `projects` (text, default "1") que e apenas um numero editavel. Precisamos de uma entidade real.

```ts
// Adicionar em lib/db/schema.ts

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
```

### 1.2 Nova Tabela `milestone`

```ts
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
```

### 1.3 Refatoracao de `project_task`

**Mudanca:** Adicionar `projectId` como FK, manter `clientId` para compatibilidade retroativa.

```ts
// ADICIONAR ao projectTask existente:
export const projectTask = pgTable("project_task", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),
  projectId: text("project_id")  // NOVO CAMPO
    .references(() => project.id, { onDelete: "set null" }),
  milestoneId: text("milestone_id")  // NOVO CAMPO
    .references(() => milestone.id, { onDelete: "set null" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  assignedTo: text("assigned_to")  // NOVO: team_member_id
    .references(() => teamMember.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in_progress", "done"] }).default("todo").notNull(),
  position: integer("position").default(0).notNull(),
  estimatedHours: integer("estimated_hours"),  // NOVO
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
```

**Decisao de design:** Manter `clientId` em `project_task` (denormalizado) para:
- Compatibilidade retroativa com queries existentes no frontend
- Performance em queries que listam todas as tarefas de um client (sem JOIN em project)
- O `projectId` e opcional (nullable) para nao quebrar dados existentes durante a migracao

### 1.4 Tabela `team_member` (Transicao Single-User para Equipe)

```ts
export const teamMember = pgTable("team_member", {
  id: text("id").primaryKey(),
  userId: text("user_id")  // owner/agency master
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
```

**Isolamento de dados:** `teamMember.userId` aponta para o `user.id` do owner (a agencia). Cada agencia ve apenas seus team members.

### 1.5 Relations atualizadas

```ts
export const projectRelations = relations(project, ({ one, many }) => ({
  client: one(client, { fields: [project.clientId], references: [client.id] }),
  user: one(user, { fields: [project.userId], references: [user.id] }),
  milestones: many(milestone),
  tasks: many(projectTask),
}));

export const milestoneRelations = relations(milestone, ({ one, many }) => ({
  project: one(project, { fields: [milestone.projectId], references: [project.id] }),
  tasks: many(projectTask),
}));

export const projectTaskRelations = relations(projectTask, ({ one }) => ({
  client: one(client, { fields: [projectTask.clientId], references: [client.id] }),
  project: one(project, { fields: [projectTask.projectId], references: [project.id] }),
  milestone: one(milestone, { fields: [projectTask.milestoneId], references: [milestone.id] }),
  user: one(user, { fields: [projectTask.userId], references: [user.id] }),
  assignee: one(teamMember, { fields: [projectTask.assignedTo], references: [teamMember.id] }),
}));

export const teamMemberRelations = relations(teamMember, ({ one, many }) => ({
  user: one(user, { fields: [teamMember.userId], references: [user.id] }),
  assignedTasks: many(projectTask),
}));

// Atualizar clientRelations (adicionar projects):
export const clientRelations = relations(client, ({ one, many }) => ({
  user: one(user, { fields: [client.userId], references: [user.id] }),
  projects: many(project),
  projectTasks: many(projectTask),
  // ... manter todas as relacoes existentes
}));
```

### 1.6 Rotas de API - Projetos

```
GET    /api/projects?clientId=xxx          -> Lista projetos (filtravel por client)
POST   /api/projects                       -> Cria projeto
GET    /api/projects/[id]                  -> Detalhe do projeto + milestones + tasks
PATCH  /api/projects/[id]                  -> Atualiza projeto
DELETE /api/projects/[id]                  -> Deleta projeto

GET    /api/projects/[id]/milestones       -> Lista milestones do projeto
POST   /api/projects/[id]/milestones       -> Cria milestone
PATCH  /api/milestones/[id]                -> Atualiza milestone
DELETE /api/milestones/[id]                -> Deleta milestone

POST   /api/projects/[id]/complete         -> Handover automatico (ver Fase 3)
```

**Exemplo de handler - POST /api/projects:**

```ts
// app/api/projects/route.ts

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { project, client } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { clientId, name, description, budget, startDate, endDate } = body

  if (!clientId || !name) {
    return NextResponse.json(
      { error: "clientId e name sao obrigatorios" },
      { status: 400 }
    )
  }

  // Verificar que o client pertence ao usuario
  const [existingClient] = await db
    .select({ id: client.id })
    .from(client)
    .where(and(eq(client.id, clientId), eq(client.userId, session.user.id)))
    .limit(1)

  if (!existingClient) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  const [newProject] = await db
    .insert(project)
    .values({
      id: crypto.randomUUID(),
      clientId,
      userId: session.user.id,
      name,
      description: description || null,
      budget: budget || "0",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    })
    .returning()

  return NextResponse.json(newProject)
}
```

### 1.7 Migration SQL

```sql
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
```

---

## FASE 2: Engenharia do Timesheet e Motor Financeiro

### 2.1 Tabela `time_entry`

```ts
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
  endTime: timestamp("end_time"),  // null = cronometro rodando
  duration: integer("duration"),  // em segundos, calculado ao finalizar
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("time_entry_taskId_idx").on(t.taskId),
  index("time_entry_teamMemberId_idx").on(t.teamMemberId),
  index("time_entry_userId_idx").on(t.userId),
]);
```

### 2.2 Rotas de API - Play/Pause

```
POST   /api/tasks/[id]/track/start        -> Inicia cronometro (cria time_entry com endTime=null)
POST   /api/tasks/[id]/track/stop         -> Para cronometro (calcula duration, seta endTime)
GET    /api/tasks/[id]/track              -> Retorna entries da tarefa + entry ativa (se houver)
GET    /api/reports/time?period=monthly   -> Relatorio de horas por team member
```

**Exemplo - POST /api/tasks/[id]/track/start:**

```ts
// app/api/tasks/[id]/track/start/route.ts

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { timeEntry } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import crypto from "crypto"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: taskId } = await params
  const body = await req.json()
  const { teamMemberId } = body

  if (!teamMemberId) {
    return NextResponse.json({ error: "teamMemberId obrigatorio" }, { status: 400 })
  }

  // 1. Verificar se ja existe um timer aberto para esta task + member
  const [activeEntry] = await db
    .select()
    .from(timeEntry)
    .where(
      and(
        eq(timeEntry.taskId, taskId),
        eq(timeEntry.teamMemberId, teamMemberId),
        isNull(timeEntry.endTime)
      )
    )
    .limit(1)

  if (activeEntry) {
    return NextResponse.json(
      { error: "Timer ja esta rodando", activeEntry },
      { status: 409 }
    )
  }

  // 2. Criar novo time_entry
  const [entry] = await db
    .insert(timeEntry)
    .values({
      id: crypto.randomUUID(),
      taskId,
      teamMemberId,
      userId: session.user.id,
      startTime: new Date(),
    })
    .returning()

  return NextResponse.json(entry)
}
```

**Exemplo - POST /api/tasks/[id]/track/stop:**

```ts
// app/api/tasks/[id]/track/stop/route.ts

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: taskId } = await params
  const body = await req.json()
  const { teamMemberId } = body

  // 1. Encontrar timer aberto
  const [activeEntry] = await db
    .select()
    .from(timeEntry)
    .where(
      and(
        eq(timeEntry.taskId, taskId),
        eq(timeEntry.teamMemberId, teamMemberId),
        isNull(timeEntry.endTime)
      )
    )
    .limit(1)

  if (!activeEntry) {
    return NextResponse.json({ error: "Nenhum timer ativo encontrado" }, { status: 404 })
  }

  // 2. Calcular duracao
  const now = new Date()
  const duration = Math.floor((now.getTime() - activeEntry.startTime.getTime()) / 1000)

  // 3. Atualizar entry
  const [updated] = await db
    .update(timeEntry)
    .set({ endTime: now, duration })
    .where(eq(timeEntry.id, activeEntry.id))
    .returning()

  return NextResponse.json(updated)
}
```

**Logica de timer "esquecido aberto":**
- Ao buscar entries, qualquer entry com `endTime = null` e considerada "em andamento"
- O frontend exibe o cronometro corretamente ao carregar a pagina
- Se um timer ficou aberto por mais de 24h, o frontend pode oferecer opcao de "encerrar automaticamente"
- O `/api/reports/time` trata entries sem `endTime` usando `now()` como fallback

### 2.3 Calculo da Margem de Lucro

**Regra de negocio exata:**

```ts
// app/api/reports/profit-margin/route.ts (novo endpoint)

// Para cada projeto ativo:
// 1. Buscar todas as time_entries do projeto (agregadas por team_member)
// 2. Para cada team_member: duration_seconds / 3600 * hourlyCost = custo parcial
// 3. Somar todos os custos = custo_total_horas
// 4. project.budget = valor_fechado
// 5. margem = ((valor_fechado - custo_total_horas) / valor_fechado) * 100

interface ProjectMargin {
  projectId: string
  projectName: string
  clientName: string
  budget: number
  totalHours: number
  costByMember: Array<{
    memberName: string
    hours: number
    hourlyCost: number
    totalCost: number
  }>
  totalCost: number
  profitMargin: number
  profitValue: number
}

// Query principal:
const margins = await db
  .select({
    projectId: project.id,
    projectName: project.name,
    clientName: client.name,
    budget: project.budget,
    memberId: teamMember.id,
    memberName: teamMember.name,
    hourlyCost: teamMember.hourlyCost,
    totalDuration: sql`COALESCE(SUM(${timeEntry.duration}), 0)`,
  })
  .from(project)
  .innerJoin(client, eq(project.clientId, client.id))
  .leftJoin(projectTask, eq(projectTask.projectId, project.id))
  .leftJoin(timeEntry, eq(timeEntry.taskId, projectTask.id))
  .leftJoin(teamMember, eq(timeEntry.teamMemberId, teamMember.id))
  .where(eq(project.userId, userId))
  .groupBy(project.id, project.name, client.name, project.budget, teamMember.id, teamMember.name, teamMember.hourlyCost)

// Processamento:
// Agrupar por projectId, somar custos por membro, calcular margem
```

### 2.4 Atualizacao do Dashboard

Adicionar ao response do `/api/dashboard`:

```ts
// 10. Margem de lucro por projeto (top 5)
const projectMargins = await calculateProjectMargins(userId)
const avgMargin = projectMargins.length > 0
  ? projectMargins.reduce((sum, p) => sum + p.profitMargin, 0) / projectMargins.length
  : 0

// Retornar adicionalmente:
return NextResponse.json({
  // ... dados existentes ...
  projectMargins: projectMargins.slice(0, 5),
  avgProfitMargin: Math.round(avgMargin * 10) / 10,
  totalHoursTracked: projectMargins.reduce((sum, p) => sum + p.totalHours, 0),
})
```

### 2.5 Migration SQL

```sql
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
```

---

## FASE 3: Automacoes de Onboarding e Handover

### 3.1 Briefing Dinamico - Evolucao de `onboarding_task`

**Estrategia:** Adicionar coluna `response` (jsonb) ao `onboarding_task` existente para armazenar respostas dinamicas, sem criar tabela nova.

```ts
// Alteracao no schema de onboardingTask:

export const onboardingTask = pgTable("onboarding_task", {
  // ... campos existentes ...
  response: jsonb("response"),  // NOVO: { questionType, answer, answeredAt }
  responseType: text("response_type", {
    enum: ["text", "textarea", "file", "select", "date", "boolean"]
  }),  // NOVO: tipo de campo esperado
  responseOptions: jsonb("response_options"),  // NOVO: opcoes para select
});
```

**Estrutura do `response` (jsonb):**

```json
{
  "questionType": "file",
  "label": "Envie o logo da empresa",
  "answer": "https://storage.example.com/logo.png",
  "answeredAt": "2026-06-25T10:00:00Z",
  "answeredBy": "client_abc123"
}
```

**Estrutura do `responseOptions` (jsonb, para select):**

```json
[
  { "label": "Sim", "value": "yes" },
  { "label": "Nao", "value": "no" },
  { "label": "Parcialmente", "value": "partial" }
]
```

**Migration:**

```sql
ALTER TABLE "onboarding_task" ADD COLUMN "response" jsonb;
ALTER TABLE "onboarding_task" ADD COLUMN "response_type" text;
ALTER TABLE "onboarding_task" ADD COLUMN "response_options" jsonb;
```

### 3.2 Gatilhos de Automacao - Boas-Vindas via WhatsApp

**Onde injetar:** No final do handler `POST /api/inbox/quick-actions/convert-lead`, apos a transacao bem-sucedida.

```ts
// app/api/inbox/quick-actions/convert-lead/route.ts

// ADICIONAR apos a transacao (linha 89):

// 5. Enviar mensagem de boas-vindas via WhatsApp (se conversa existe)
if (conversationId && result.contactPhone) {
  try {
    // Buscar integracao WhatsApp ativa do usuario
    const [integration] = await db
      .select()
      .from(channelIntegration)
      .where(
        and(
          eq(channelIntegration.userId, session.user.id),
          eq(channelIntegration.channel, "whatsapp"),
          eq(channelIntegration.status, "active")
        )
      )
      .limit(1)

    if (integration) {
      // Normalizar telefone
      const phone = result.contactPhone.replace(/\D/g, "")
      const chatId = phone.startsWith("55")
        ? `${phone}@c.us`
        : `55${phone}@c.us`

      // Enviar texto de boas-vindas
      const welcomeMessage =
        `Ola ${result.name || result.contactName || "equipe"}! \n\n` +
        `Foi um prazer fecharmos parceria. Estamos muito felizes em trabalhar juntos!\n\n` +
        `Voce recebera aqui atualizacoes dos seus projetos e podera acompanhar tudo pelo nosso portal.\n\n` +
        `Se tiver qualquer duvida, e so responder esta mensagem.`

      await fetch(
        `${process.env.OPENWA_API_URL}/message/sendText/${integration.externalId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, text: welcomeMessage }),
        }
      )

      // Registrar a interacao
      await db.insert(clientInteraction).values({
        id: crypto.randomUUID(),
        clientId,
        userId: session.user.id,
        type: "message",
        description: "Mensagem automatica de boas-vindas enviada via WhatsApp.",
        isAutomatic: true,
      })
    }
  } catch (err) {
    // Log silencioso - nao falhar a conversao por causa da mensagem
    console.error("Erro ao enviar boas-vindas:", err)
  }
}
```

### 3.3 Fluxo de Handover Automatizado

**Endpoint:** `POST /api/projects/[id]/complete`

```ts
// app/api/projects/[id]/complete/route.ts

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: projectId } = await params

  const result = await db.transaction(async (tx) => {
    // 1. Buscar projeto
    const [proj] = await tx
      .select()
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.userId, session.user.id)))
      .limit(1)

    if (!proj) throw new Error("Projeto nao encontrado")

    // 2. Buscar todos os assets/entregaveis do projeto
    const assets = await tx
      .select()
      .from(clientAsset)
      .where(eq(clientAsset.clientId, proj.clientId))

    // 3. Buscar escopo ativo do client
    const scopes = await tx
      .select()
      .from(clientScope)
      .where(and(
        eq(clientScope.clientId, proj.clientId),
        eq(clientScope.status, "active")
      ))

    // 4. Gerar resumo de entrega
    const lines: string[] = []
    lines.push(`*Handover do Projeto: ${proj.name}*`)
    lines.push(``)
    lines.push(`Status: Concluido`)
    lines.push(`Data: ${new Date().toLocaleDateString("pt-BR")}`)
    lines.push(``)
    lines.push(`*Entregaveis:*`)
    for (const a of assets) {
      lines.push(`- ${a.name} (${a.category}) - ${a.fileUrl || a.linkUrl || "sem link"}`)
    }
    lines.push(``)
    lines.push(`*Escopo Contratado:*`)
    for (const s of scopes) {
      lines.push(`- ${s.label}: ${s.usedQuota}/${s.totalQuota} (${s.period})`)
    }
    const handoverSummary = lines.join("\n")

    // 5. Enviar via WhatsApp se integracao ativa
    const [integration] = await tx
      .select()
      .from(channelIntegration)
      .where(and(
        eq(channelIntegration.userId, session.user.id),
        eq(channelIntegration.channel, "whatsapp"),
        eq(channelIntegration.status, "active")
      ))
      .limit(1)

    // Buscar telefone do client
    const [clientData] = await tx
      .select({ contactPhone: client.contactPhone, name: client.name })
      .from(client)
      .where(eq(client.id, proj.clientId))
      .limit(1)

    if (integration && clientData?.contactPhone) {
      const phone = clientData.contactPhone.replace(/\D/g, "")
      const chatId = phone.startsWith("55")
        ? `${phone}@c.us`
        : `55${phone}@c.us`

      await fetch(
        `${process.env.OPENWA_API_URL}/message/sendText/${integration.externalId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, text: handoverSummary }),
        }
      )
    }

    // 6. Mover projeto para "done"
    await tx
      .update(project)
      .set({ status: "done", updatedAt: new Date() })
      .where(eq(project.id, projectId))

    // 7. Criar interacao de registro
    await tx.insert(clientInteraction).values({
      id: crypto.randomUUID(),
      clientId: proj.clientId,
      userId: session.user.id,
      type: "delivery",
      description: `Projeto "${proj.name}" concluido. Handover automatico enviado.`,
      isAutomatic: true,
    })

    return { success: true, handoverSummary }
  })

  return NextResponse.json(result)
}
```

---

## FASE 4: Refatoracao, Limpeza de Codigo e QA

### 4.1 Remocao de Debito Tecnico

| Item | Acao |
|------|------|
| `app/api/clients/[id]/get.ts` | **Deletar** - arquivo morto, nao e route.ts, nunca e servido pelo Next.js |
| IA simulada em `/prospects` | **Substituir** por chamada real a `/api/prospects` que usa Firecrawl ou scraping real |
| IA simulada em `/settings/ai` | **Substituir** por integracao com RAG real (embeddings + vector store) |
| Campo `client.projects` (text) | **Manter por compatibilidade** mas preencher automaticamente via trigger ao criar/deletar projetos |

### 4.2 Migration Script - Dados Orfaos

O script na secao 1.7 ja cobre a migracao de `project_task` orfas. Logica adicional:

```sql
-- 1. Criar "Projeto Padrao" para cada client que tem tasks
-- (ja coberto na migration 0007)

-- 2. Opcionalmente, atualizar client.projects com a contagem real
UPDATE "client" SET "projects" = (
  SELECT COUNT(*)::text FROM "project" WHERE "project"."client_id" = "client"."id"
);
```

### 4.3 Checklist de Validacao Pos-Migracao

```sql
-- Verificar integridade:
-- 1. Toda project_task deve ter projectId nao-null apos migracao
SELECT COUNT(*) FROM "project_task" WHERE "project_id" IS NULL;
-- Esperado: 0

-- 2. Todo projeto deve ter um client valido
SELECT p.id FROM "project" p
LEFT JOIN "client" c ON p.client_id = c.id
WHERE c.id IS NULL;
-- Esperado: vazio

-- 3. Toda migration deve ter corresponding schema update
-- Verificar que drizzle-kit generate produce SQL equivalente
```

### 4.4 Ordem de Deploy

```
1. Rodar migration 0007 (project, milestone, team_member + refactor project_task)
2. Rodar migration 0008 (time_entry)
3. Rodar migration 0009 (onboarding_task response fields)
4. Deploy da aplicacao (rotas novas + frontend atualizado)
5. Verificar logs de erro por 24h
6. Limpar campo client.projects (deixar de ser usado no frontend)
```

---

## Resumo de Tabelas Novas

| Tabela | Motivo | FKs |
|--------|--------|-----|
| `project` | Entidade core - separar projetos de clients | client_id, user_id |
| `milestone` | Dividir projetos em fases com dependencias | project_id, user_id |
| `team_member` | Equipe da agencia + custo-hora | user_id |
| `time_entry` | Rastreamento de tempo por tarefa | task_id, team_member_id, user_id |

## Resumo de Tabelas Modificadas

| Tabela | Colunas Novas |
|--------|---------------|
| `project_task` | project_id, milestone_id, assigned_to, estimated_hours |
| `onboarding_task` | response (jsonb), response_type, response_options (jsonb) |

## Resumo de Endpoints Novos

| Metodo | Rota | Fase |
|--------|------|------|
| GET/POST | `/api/projects` | 1 |
| GET/PATCH/DELETE | `/api/projects/[id]` | 1 |
| GET/POST | `/api/projects/[id]/milestones` | 1 |
| PATCH/DELETE | `/api/milestones/[id]` | 1 |
| POST | `/api/projects/[id]/complete` | 3 |
| POST | `/api/tasks/[id]/track/start` | 2 |
| POST | `/api/tasks/[id]/track/stop` | 2 |
| GET | `/api/tasks/[id]/track` | 2 |
| GET | `/api/reports/time` | 2 |
| GET | `/api/reports/profit-margin` | 2 |
