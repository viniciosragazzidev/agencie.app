# Simplificação & Redesign UI - Agencie.App

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplificar o frontend removendo features complexas (Tarefas, Rastreamento de Tempo, Orçamento, Faturas, Relatórios) e modernizar o design estrutural, mantendo as cores atuais e aplicando o estilo visual das imagens de referência.

**Architecture:** Redesign do dashboard principal, sidebar e configurações seguindo o padrão visual das imagens: cards compactos com bordas suaves, grid layout com bento-style, tipografia limpa. Features desativadas ficam no código mas são removidas da UI.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, GSAP, shadcn/ui, Hugeicons

---

## Analysis Summary

### Image Reference Analysis

| Image | Key Pattern | Application |
|-------|-------------|-------------|
| Image 1 (LeadNest) | Sidebar fixa + cards de leads em grid, badges coloridos, progress bars, membro cards com avatar | Dashboard layout, client cards, stat cards |
| Image 2 (Projects) | Kanban board com colunas coloridas (To Do, In Progress, Review), cards de projeto com tags, progress bars, member avatars | Simplificado - remover Kanban complexo |
| Image 3 (Dark Dashboard) | Sidebar mini + cards empilhados, stat boxes, heatmap de atividade, bento grid | Layout geral, spacing, tipografia |

### Current App Structure

- **Sidebar:** 4 seções (Foco, Gestão, Ferramentas, Sistema) - Manter, simplificar
- **Dashboard:** 2 views (Foco do Dia + Visão Geral) - Simplificar Visão Geral
- **Settings:** Página com stats, quick actions, activity feed - Simplificar
- **Client Detail:** 15+ abas com features complexas - Reduzir

### Features to DESATIVAR (remover da UI, manter no código)

1. **Tarefas/Kanban** - `project-status-pipeline.tsx` → remover do client detail
2. **Rastreamento de Tempo** - `time_entry` table exists, no UI → não adicionar
3. **Acompanhamento de Orçamento** - `ad-spend-meter.tsx`, `budget-proposal-wizard.tsx` → esconder
4. **Faturas** - `/settings/billing` mock data → simplificar
5. **Relatórios** - `handleGenerateReport` no dashboard → remover botão

### Features MANTER (já implementadas)

1. **Central de Foco** - `focus-center.tsx` → manter como principal
2. **Inbox Chat** - `/inbox` → manter
3. **Clientes CRM** - `/clients` → manter
4. **Pipeline** - `/pipeline` → manter
5. **Área do Cliente** - `/client-portal` → manter
6. **Serviços** - `/services` → manter
7. **Prospecção AI** - `/prospects` → manter
8. **Configurações** - `/settings` → simplificar

---

## Task 1: Simplificar Sidebar

**Files:**
- Modify: `components/app-sidebar.tsx`
- Modify: `components/nav-main.tsx`

### Step 1: Remover itens de menu desnecessários

Remover "Assistente RAG" e "Dicionário" da sidebar (itens menos usados).

**Em `components/app-sidebar.tsx`:**

Remover da seção "Sistema":
- Assistente RAG (`/settings/ai`)
- Dicionário (`/help/dictionary`)

Manter apenas:
- Integrações (`/settings/integrations`)
- Configurações (`/settings/agency`)

### Step 2: Renomear seções para simplificar

Renomear "Ferramentas" → "Operações" e manter apenas Serviços + Prospecção AI.

### Step 3: Commit

```bash
git add components/app-sidebar.tsx components/nav-main.tsx
git commit -m "simplify: streamline sidebar navigation"
```

---

## Task 2: Modernizar Dashboard - Layout Principal

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `components/focus-center.tsx`

### Step 1: Simplificar a view "Visão Geral"

Remover do dashboard:
- Botão "Gerar Relatório" (linha 246-252)
- Botão "Nova Campanha" (linha 253-259)
- Modal "Nova Campanha" (linha 617-716)
- Card "Conversão Leads" (KPI 5, linhas 392-427)
- Card "Pipeline de Clientes" (linhas 431-484) - simplificar para apenas lista de atividades
- Seção "Retenção & Churn" (linhas 529-548) - manter mas simplificar

### Step 2: Reduzir KPIs de 5 para 3

Manter apenas:
1. Total de Clientes (com badges de status)
2. Exposição a Churn (simplificado)
3. Satisfação NPS

Remover:
4. LTV/CAC (muito técnico)
5. Conversão Leads (complexo)

### Step 3: Simplificar layout para grid 2 colunas

Mudar de grid 5 colunas para grid 3 colunas (2 rows):

```
[Total Clientes] [Churn Risk] [NPS]
[Atividade Recente ...........] [Alertas]
```

### Step 4: Atualizar estilos para padrão das imagens

Aplicar:
- Cards com `rounded-2xl` (mais arredondado como Image 1/3)
- Badge de status com `rounded-full` (pílula como Image 1)
- Tipografia `text-xs` para títulos, `text-[10px]` para labels
- Spacing `gap-3` entre cards

### Step 5: Commit

```bash
git add app/\(app\)/dashboard/page.tsx components/focus-center.tsx
git commit -m "redesign: modernize dashboard layout with simplified KPIs"
```

---

## Task 3: Modernizar FocusCenter (View Principal)

**Files:**
- Modify: `components/focus-center.tsx`

### Step 1: Redesign do greeting section

Mudar de heading grande para layout compacto estilo Image 3:

```tsx
// ANTES (grande)
<h1 className="text-base md:text-lg font-display font-semibold">
  {greeting()}, aqui esta o que precisa da sua atencao
</h1>

// DEPOIS (compacto)
<div className="flex items-center gap-3 mb-4">
  <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
    <HugeiconsIcon icon={ZapIcon} className="size-5 text-primary" />
  </div>
  <div>
    <h1 className="text-sm font-display font-semibold">{greeting()}</h1>
    <p className="text-[10px] text-muted-foreground">{data.priorityItems.length} ações pendentes</p>
  </div>
</div>
```

### Step 2: Redesign dos StatPills para cards horizontais

Mudar de pills inline para grid 2x2 de mini cards (estilo Image 1 stat cards):

```tsx
<div className="grid grid-cols-2 gap-2">
  <MiniStat icon={CheckmarkCircle02Icon} label="Tarefas" value={data.pendingTasksCount} />
  <MiniStat icon={FileAttachmentIcon} label="Aprovações" value={data.pendingApprovalsCount} />
  <MiniStat icon={Calendar03Icon} label="Reuniões" value={data.upcomingMeetingsCount} />
  <MiniStat icon={Alert01Icon} label="Risco" value={data.churnRiskCount} />
</div>
```

### Step 3: Simplificar PriorityCards

Remover:
- Tooltip de explicação (`TYPE_EXPLANATIONS`)
- Ícone de ação à direita
- Meeting date badge

Manter:
- Dot de prioridade
- Nome do cliente
- Label de prioridade
- Descrição do item

### Step 4: Commit

```bash
git add components/focus-center.tsx
git commit -m "redesign: modernize focus center with compact cards"
```

---

## Task 4: Simplificar Settings Page

**Files:**
- Modify: `app/(app)/settings/page.tsx`

### Step 1: Reduzir stats de 4 para 2

Manter apenas:
1. Integrações Ativas
2. Membros da Equipe

Remover:
3. Storage Utilizado (não relevante)
4. API TelephonyIcons (não relevante)

### Step 2: Simplificar Quick Actions

Manter apenas:
1. Convidar Membro
2. Nova Integração

Remover:
3. Atualizar Plano (ir para billing)
4. Ver Logs (ir para security)

### Step 3: Simplificar Activity & Integrations

Manter apenas "Status das Integrações" (coluna única).
Remover "Atividade Recente" (dados mockados).

### Step 4: Aplicar novo padrão visual

Usar `rounded-2xl` para cards, `gap-2` para grid, tipografia simplificada.

### Step 5: Commit

```bash
git add app/\(app\)/settings/page.tsx
git commit -m "simplify: streamline settings page"
```

---

## Task 5: Desabilitar Features no Client Detail

**Files:**
- Modify: `app/(app)/clients/[id]/page.tsx`

### Step 1: Remover abas desnecessárias

No client detail page, remover/colapsar:
- Aba "Tarefas" (Kanban) → usar view simplificada
- Aba "Orçamento" → esconder
- Aba "Contratos" → manter mas simplificar
- Aba "Aprovações" → manter

### Step 2: Simplificar tabs restantes

Manter apenas:
1. Visão Geral (`ClientOverviewTab`)
2. Atividade (`ClientTimeline`)
3. Notas (`ClientNotesPanel`)
4. Ativos (`AssetsHub`)

### Step 3: Remover componentes não usados

Não importar:
- `ProjectStatusPipeline` (Kanban de tarefas)
- `AdSpendMeter` (rastreamento de orçamento)
- `BudgetProposalWizard` (wizard de orçamento)
- `ScopeWall` (gestão de escopo)

### Step 4: Commit

```bash
git add app/\(app\)/clients/\[id\]/page.tsx
git commit -m "simplify: reduce client detail tabs and remove complex features"
```

---

## Task 6: Modernizar Header/Layout

**Files:**
- Modify: `app/(app)/layout.tsx`

### Step 1: Simplificar header

Mudar header de `h-14` para `h-12` (mais compacto como Image 3).

Remover breadcrumb completo, manter apenas:
- Sidebar trigger
- Título da página (extrair do pathname)
- Theme toggle

### Step 2: Adicionar search global (opcional)

Adicionar um campo de busca sutil no header (estilo Image 1/3).

### Step 3: Commit

```bash
git add app/\(app\)/layout.tsx
git commit -m "redesign: modernize app header with compact layout"
```

---

## Task 7: Ajustes de Estilo Globais

**Files:**
- Modify: `app/globals.css`

### Step 1: Adicionar utility classes novas

Adicionar classes para o novo padrão visual:

```css
/* Modern card pattern */
.card-modern {
  @apply rounded-2xl border border-border/40 bg-card p-4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

/* Stat card pattern */
.stat-card {
  @apply rounded-2xl border border-border/40 bg-card p-3;
}

/* Badge pill pattern */
.badge-pill {
  @apply text-[9px] font-bold tracking-widest uppercase rounded-full px-2 py-0.5;
}
```

### Step 2: Ajustar border radius global

Mudar `--radius: 0.45rem` para `--radius: 0.75rem` (mais arredondado como imagens).

### Step 3: Commit

```bash
git add app/globals.css
git commit -m "style: update global styles with modern card patterns"
```

---

## Task 8: Verificação Final

### Step 1: Build do projeto

```bash
npm run build
```

Esperar: Build sem erros.

### Step 2: Verificar rotas

Verificar que todas as rotas funcionam:
- `/dashboard` - Dashboard simplificado
- `/clients` - Lista de clientes
- `/clients/[id]` - Detalhe simplificado
- `/inbox` - Inbox
- `/pipeline` - Pipeline
- `/settings` - Settings simplificado
- `/services` - Serviços
- `/prospects` - Prospecção AI

### Step 3: Verificar responsividade

Testar em:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x812)

### Step 4: Screenshot final

Tirar screenshot do dashboard principal para comparar com imagens de referência.

---

## Summary

| Task | Description | Status |
|------|-------------|--------|
| 1 | Simplificar Sidebar | Pending |
| 2 | Modernizar Dashboard Layout | Pending |
| 3 | Modernizar FocusCenter | Pending |
| 4 | Simplificar Settings Page | Pending |
| 5 | Desabilitar Features no Client Detail | Pending |
| 6 | Modernizar Header/Layout | Pending |
| 7 | Ajustes de Estilo Globais | Pending |
| 8 | Verificação Final | Pending |

---

## Design Tokens Manter (cores atuais)

```css
/* Light theme - manter */
--background: oklch(0.998 0 0);
--foreground: oklch(0.13 0.005 285.823);
--card: oklch(1 0 0);
--primary: oklch(0.18 0.006 285.885);
--muted: oklch(0.94 0.001 286.375);
--border: oklch(0.87 0.004 286.32);

/* Dark theme - manter */
--background: oklch(0.05 0.001 285.823);
--foreground: oklch(0.985 0 0);
--card: oklch(0% 0 0);
--primary: oklch(0.92 0.004 286.32);
--muted: oklch(0.12 0.003 286.033);
--border: oklch(1 0 0 / 6%);
```

## Referências Visuais

### Image 1 (LeadNest) - Aplicar:
- Sidebar fixa com navegação vertical
- Cards de lead/produto em grid 4 colunas
- Badges coloridos (New lead, Returning, Priority, Follow-up)
- Avatar de responsável em cada card
- Stats no topo (chart + activity heatmap)
- Botão "Add customer" no header

### Image 2 (Projects) - NÃO aplicar (complexo demais):
- Kanban board → remover
- Múltiplas colunas de status → simplificar
- Progress bars detalhadas → manter apenas números

### Image 3 (Dark Dashboard) - Aplicar:
- Layout de cards empilhados
- Stat boxes compactos
- Heatmap de atividade (simplificado)
- Bento grid para seções
- Tipografia limpa e espaçamento consistente
