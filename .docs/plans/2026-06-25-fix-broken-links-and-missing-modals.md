# Plano de Implementação: Correção de Links Quebrados e Modais Faltantes

## 🔍 Diagnóstico Completo

### 1. Links Quebrados nas Ações Rápidas do Chat (Inbox)

**Arquivo:** `components/inbox/quick-action-modals.tsx`

| Ação | Problema | Gravidade |
|------|----------|-----------|
| **send_contract** | Link hardcoded como `http://localhost:3000${portalLink}` — não funciona em produção. Deve usar `window.location.origin` como o briefing já faz. | 🔴 Crítico |
| **send_briefing** | Link usa `window.location.origin` ✅, mas `conversation?.userId` pode ser undefined. O fallback `"agencia"` não corresponde a nenhum agency real. | 🟡 Médio |
| **send_pitch** | Link hardcoded `https://kyper.app/pitch-kyper` — funciona mas deve ser configurável. | 🟢 Leve |
| **schedule_discovery** | Link hardcoded `https://cal.com/kyper/discovery` — deve ser configurável. | 🟢 Leve |

### 2. Handlers Faltantes no Client Overview Tab (`onModalAction`)

**Arquivo:** `app/(app)/clients/[id]/page.tsx`

Atualmente implementados: `task`, `scope`, `approval`, `meeting`, `portal`

**Faltam:**

| Ação | Origem (Overview Tab) | O que deveria fazer |
|------|----------------------|---------------------|
| **`briefing`** | Botão "Coletar Briefing" (Onboarding) | Abrir modal de criação rápida de briefing + copiar link do portal |
| **`contract`** | Botão "Enviar Contrato" (Ativo) | Abrir modal de criação de contrato + copiar link do portal |
| **`proposal`** | Botão "Nova Proposta" (Ativo) | Navegar para tab Financeiro ou abrir modal de proposta |
| **`interactions`** | Botão "Ver Último Contato" (Em Risco) | Abrir modal com últimas interações ou navegar para o inbox |
| **`satisfaction`** | Botão "Ver Scores" (Em Risco) | Abrir modal com scores NPS recentes |

### 3. Modais Faltantes na Página do Cliente

**Arquivo:** `app/(app)/clients/[id]/page.tsx`

Precisam ser criados:

| Modal | Função | Gatilho |
|-------|--------|---------|
| **Quick Briefing Modal** | Criar briefing no backend + mostrar link do portal para copiar | `onModalAction("briefing")` |
| **Quick Contract Modal** | Criar contrato via API + mostrar link do portal para copiar | `onModalAction("contract")` |
| **Interactions Modal** | Exibir últimas interações do cliente | `onModalAction("interactions")` |
| **Satisfaction Modal** | Exibir scores NPS recentes | `onModalAction("satisfaction")` |

---

## 🛠️ Plano de Implementação

### Fase 1: Corrigir Links Quebrados (Inbox)

**Arquivo:** `components/inbox/quick-action-modals.tsx`

1. `handleSendContract`:
   - Substituir `http://localhost:3000${portalLink}` por `${window.location.origin}${portalLink}`
   - Garantir fallback do `conversation?.userId` para string vazia ou um valor válido

2. `handleSendBriefing`:
   - O link já usa `window.location.origin` ✅
   - Melhorar fallback do `conversation?.userId` → buscar agency slug do usuário logado

3. `briefingPortalLink`:
   - O state inicial já é correto ✅
   - O usuário pode editar o link manualmente no campo de input

### Fase 2: Adicionar Handlers no onModalAction

**Arquivo:** `app/(app)/clients/[id]/page.tsx`

Adicionar no handler `onModalAction`:
```ts
if (action === "briefing") setShowQuickBriefingModal(true)
if (action === "contract") setShowQuickContractModal(true)  
if (action === "proposal") setShowProposalModal(true)
if (action === "interactions") setActiveTab("notes")
if (action === "satisfaction") setShowSatisfactionModal(true)
```

### Fase 3: Criar Modais

**Arquivo:** `app/(app)/clients/[id]/page.tsx`

1. **Quick Briefing Modal** (baseado no `handleSendBriefing` do inbox):
   - Formulário: Nome do Projeto, Objetivo, Observações
   - Action: Criar briefing via `POST /api/client-portal/briefing`
   - Resultado: Mostrar link do portal para copiar + mensagem de sucesso
   - Botão "Copiar Link" e "Enviar no WhatsApp" (navega para inbox)

2. **Quick Contract Modal** (baseado no `handleSendContract` do inbox):
   - Formulário: Nome do Contrato, Conteúdo customizado (opcional)
   - Action: Criar contrato via `POST /api/client-portal/contracts`
   - Resultado: Mostrar link do portal para copiar
   - Botão "Copiar Link" e "Enviar no WhatsApp"

3. **Satisfaction Modal**:
   - Lista de scores NPS com data e nota
   - Média dos scores
   - Botão "Enviar Pesquisa NPS" (abre inbox)

---

## 📦 Resumo dos Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `components/inbox/quick-action-modals.tsx` | Fix `handleSendContract` localhost → `window.location.origin` |
| `app/(app)/clients/[id]/page.tsx` | Add 3 states, 4 handlers, 3 modais + imports |
