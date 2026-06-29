# 📊 RAIO-X DE MATURIDADE DO SISTEMA

> **Data da Auditoria:** 25/06/2026
> **Escopo:** Código-fonte, banco de dados, rotas API e componentes de interface
> **Referencial:** Fluxo Ideal de Operação de Ponta a Ponta para Gestão de Agências

---

## 1. Mapeamento de Status por Etapa

---

### ETAPA 1: ONBOARDING E CONEXÃO

| Recurso | Status | Evidência no Código |
|---------|--------|---------------------|
| **Cofre de Acessos** | ❌ [AUSENTE] | Não existe tabela nem rotas para armazenar credenciais de clientes (API keys, senhas, tokens). A tabela `client` guarda dados cadastrais, não credenciais sensíveis. |
| **Briefing Nativo** | 🟡 [PARCIAL] | Tabela `onboarding_task` existe com CRUD completo (`/api/client-portal/onboarding`), mas é apenas um checklist genérico — não há formulários dinâmicos de coleta de dados vinculados ao projeto. Falta: templates de briefing, campos dinâmicos, vinculação a projetos específicos. |
| **Disparo Automático de Boas-Vindas via WhatsApp** | ❌ [AUSENTE] | A infraestrutura WhatsApp (OpenWA) está fully operational com envio de mensagens, polls e webhooks. Porém, não existe nenhum gatilho automático de boas-vindas ao criar um client ou habilitar o portal. O `convert-lead` cria a interação mas não dispara mensagem. |
| **Conexão WhatsApp (OpenWA)** | ✅ [IMPLEMENTADO] | Pipeline completo: `/api/integrations/whatsapp/connect` → QR code via SSE → webhook receiver → sync. Tabelas: `channel_integration`, `conversation`, `message`. Status: connected/disconnected/active/error. |
| **Portal do Cliente (Login CPF/CNPJ)** | ✅ [IMPLEMENTADO] | `/api/portal/[agency]/auth` com JWT customizado, cookie httpOnly. Login por CPF/CNPJ + email. Tabela `client` com `portal_enabled`. |
| **Conversão Lead → Client** | ✅ [IMPLEMENTADO] | `/api/inbox/quick-actions/convert-lead` — transação completa: cria client, atualiza lead para "won", vincula conversa, cria interação automática. |

---

### ETAPA 2: PLANEJAMENTO E ESTRATÉGIA

| Recurso | Status | Evidência no Código |
|---------|--------|---------------------|
| **Estrutura de Marcos (Milestones)** | ❌ [AUSENTE] | Não existe tabela `milestone` nem `project`. A tabela `project_task` é um Kanban genérico por client sem conceito de fases/marcos dependentes. |
| **Templates de Projetos** | ❌ [AUSENTE] | Sem nenhuma tabela ou rota para templates de projeto. Não há como criar um projeto com tarefas pré-definidas com 1 clique. |
| **Painel de Capacidade (Resource Management)** | ❌ [AUSENTE] | Não existe tabela de team members, atribuição de tarefas a pessoas, nem cálculo de carga de trabalho. O sistema é single-user (cada usuário gerencia seus próprios clients). |
| **Pipeline de Vendas (Kanban)** | ✅ [IMPLEMENTADO] | `/pipeline` com 4 estágios (Novo Lead → Qualificado → Ganho → Perdido), drag-and-drop, CRUD completo via `/api/leads`. |
| **Catálogo de Serviços** | ✅ [IMPLEMENTADO] | `/services` com CRUD, preços, billing (mensal/anual/único), geração de pitch por IA. Tabela `service`. |

---

### ETAPA 3: EXECUÇÃO E PRODUÇÃO

| Recurso | Status | Evidência no Código |
|---------|--------|---------------------|
| **Visualização Kanban** | ✅ [IMPLEMENTADO] | Kanban de tarefas por client em `/clients/[id]` (To Do / In Progress / Done) + Kanban de pipeline de vendas. |
| **Visualização Lista** | 🟡 [PARCIAL] | A lista de clients em `/clients` é uma tabela, mas as tarefas do projeto só têm visualização Kanban. Não há toggle Kanban/Lista para tarefas. |
| **Visualização Gantt (Linha do Tempo)** | ❌ [AUSENTE] | Nenhuma visualização Gantt ou timeline. O service builder tem um "timeline vertical" com fases, mas é apenas indicador visual estático — não é um Gantt interativo. |
| **Timesheet Nativo (Play/Pause)** | ❌ [AUSENTE] | Não existe nenhuma tabela de time tracking, nem UI de cronômetro, nem cálculo de custo por horas. |
| **Webhooks de Notificação Interna** | 🟡 [PARCIAL] | O sistema SSE (`/api/inbox-stream`) transmite eventos em real-time para o frontend. Webhooks externos existem para OpenWA. Mas não há notificações para Slack/WhatsApp interno do time — o SSE é apenas para o browser do usuário atual. |
| **Inbox Omnichannel (WhatsApp)** | ✅ [IMPLEMENTADO] | Pipeline completo: conversas, mensagens, envio/recebimento, status de entrega, SSE real-time, sync, midia, ignorar/spam. |
| **Gestão de Escopo (Scope Wall)** | ✅ [IMPLEMENTADO] | Tabela `client_scope` com quota total/usada, período, preço, billing. CRUD completo. UI `ScopeWall` no client detail e portal. |

---

### ETAPA 4: VALIDAÇÃO E AJUSTES

| Recurso | Status | Evidência no Código |
|---------|--------|---------------------|
| **Portal do Cliente White-label** | ✅ [IMPLEMENTADO] | `/portal/[agency]/projetos` — visualização completa: Kanban, aprovações, onboarding, escopo, deliverables, ad spend, NPS. Autenticação por CPF/CNPJ. |
| **Sistema de Aprovação** | ✅ [IMPLEMENTADO] | Tabela `approval` com status pending/approved/revision. API completa incluindo envio automático de notificação WhatsApp ao cliente. UI `ApprovalPanel` com comentários. |
| **Feedback Visual na Tela** | 🟡 [PARCIAL] | O `ApprovalPanel` permite comentários e anexos, mas não é "direto sobre o entregável" — é um painel lateral. Falta: anotações visuais sobre imagens/designs, inline comments. |
| **Trava de Escopo (Log Imutável)** | 🟡 [PARCIAL] | A tabela `client_interaction` registra mudanças de aprovação automaticamente. Porém não é um log imutável — as interactions podem ser deletadas via API. Falta: audit trail append-only, controle de versão. |
| **Reuniões com Confirmação via WhatsApp** | ✅ [IMPLEMENTADO] | Tabela `client_meeting` com polls de confirmação via WhatsApp. Webhook processa respostas (confirmar/alterar). CRUD completo. |
| **NPS / Satisfação** | ✅ [IMPLEMENTADO] | Tabela `client_satisfaction` + `client_poll` (type: nps). UI `NPSSurvey` no portal. Dashboard exibe scores por client. |
| **Contratos com Assinatura Digital** | ✅ [IMPLEMENTADO] | Tabela `client_contract` com geração automática de conteúdo, assinatura digital (nome, CPF, IP). API `/api/client-portal/contracts/[id]/sign`. |

---

### ETAPA 5: ENTREGA E OPERAÇÃO FINANCEIRA

| Recurso | Status | Evidência no Código |
|---------|--------|---------------------|
| **Relatório de Margem de Lucro por Projeto** | ❌ [AUSENTE] | O dashboard mostra MRR, LTV/CAC e taxa de conversão. A tabela `client_financial_record` existe mas tem apenas revenue/spend mensal. Não há cruzamento automático de valor do projeto vs. custo de horas. |
| **Automação de Handover** | ❌ [AUSENTE] | Não existe automação de entrega final, compactação de arquivos, disparo de link, ou movimentação de funil ao concluir projeto. |
| **Relatório CSV de Clients** | ✅ [IMPLEMENTADO] | `/api/reports` gera CSV com BOM UTF-8 (ID, Cliente, Segmento, Status, Projetos, MRR, Data de Criação). |
| **Tracking de Ad Spend** | ✅ [IMPLEMENTADO] | Tabela `ad_spend_tracker` com orçamento planejado, gasto real, plataforma (Meta/Google/TikTok), pace diário. UI `AdSpendMeter`. |
| **Gestão de Ativos/Entregáveis** | ✅ [IMPLEMENTADO] | Tabela `client_asset` com categorias (logo, report, art, contract, etc.). CRUD completo. UI `AssetsHub`. |
| **Propostas Comerciais** | ✅ [IMPLEMENTADO] | Quick action `/api/inbox/quick-actions/create-proposal` gera proposta a partir de serviços selecionados. Geração por IA simulada. |

---

## 2. Análise do Fluxo e Gargalos

### Onde o fluxo está ROMPIDO

1. **Não existe conceito de "Projeto"**: O sistema tem `project_task` mas não tem uma tabela `project`. As tarefas estão diretamente vinculadas ao `client`. Impossível ter múltiplos projetos distintos por client com milestones independentes.

2. **Sem timesheet, sem custo de horas**: O relatório de margem de lucro é impossível de implementar porque não existe rastreamento de tempo. A tabela `client_financial_record` tem revenue/spend, mas não há input de custo de horas para cruzar.

3. **Sem milestones, sem dependências**: O Kanban de tarefas é plano — não há sequência, dependências, nem bloqueios entre fases. Um projeto complexo não pode ser gerenciado.

4. **Single-user por design**: Todas as tabelas têm `user_id` como owner. Não há conceito de equipe, permissões, ou trabalho colaborativo. O "Painel de Capacidade" é inviável sem isso.

5. **Briefing é apenas checklist**: O `onboarding_task` é um checklist estático. Um briefing dinâmico precisaria de campos customizáveis por tipo de projeto/serviço.

### Pontos de integração que funcionam bem

- WhatsApp ↔ Conversas ↔ Webhooks ↔ SSE está solidamente implementado
- Portal do cliente ↔ Aprovações ↔ Interações ↔ Polls está coeso
- Pipeline de vendas ↔ Conversão para client funciona em transação

### Débito técnico explícito

- `app/api/clients/[id]/get.ts` é um arquivo morto (não é route.ts, nunca é servido)
- A tabela `client_financial_record` existe mas NENHUM endpoint a utiliza diretamente (apenas dashboard faz query)
- Os dados de "projetos" no dashboard são meramente `client.projects` (um número editável), não entidades reais
- A IA no `/prospects` e `/settings/ai` é 100% simulada (client-side, sem backend real)

---

## 3. Lista de Prioridades (Backlog Técnico)

### Prioridade CRÍTICA (Core — sem isso o produto não é um gestor de agências)

| # | Item | Impacto | Esforço |
|---|------|---------|---------|
| 1 | **Criar entidade `project`** com milestones, dependências e status — separar de `client` | 🔴 Alto | 🔴 Alto |
| 2 | **Timesheet nativo** (play/pause por tarefa) com tabela `time_entry` vinculada a `project_task` | 🔴 Alto | 🔴 Alto |
| 3 | **Relatório de margem de lucro** — cruzar valor do projeto vs. custo de horas registradas | 🔴 Alto | 🟡 Médio |
| 4 | **Templates de projeto** — tabela `project_template` com tarefas pré-definidas para injetar com 1 clique | 🔴 Alto | 🟡 Médio |
| 5 | **Briefing dinâmico** — transformar `onboarding_task` em formulário de coleta com campos customizáveis | 🟡 Médio | 🟡 Médio |

### Prioridade ALTA (Diferenciação competitiva)

| # | Item | Impacto | Esforço |
|---|------|---------|---------|
| 6 | **Visualização Gantt** — componente de timeline com dependências entre tarefas | 🟡 Médio | 🔴 Alto |
| 7 | **Notificações internas** — WhatsApp/Slack webhooks para atualizações de cards (além do SSE browser) | 🟡 Médio | 🟡 Médio |
| 8 | **Automação de handover** — ao mover projeto para "Done": compactar entregáveis, enviar link, atualizar funil | 🟡 Médio | 🟡 Médio |
| 9 | **Log imutável de aprovações** — tabela append-only `approval_audit_log` | 🟡 Médio | 🟢 Baixo |
| 10 | **Disparo automático de boas-vindas** — gatilho ao criar client ou habilitar portal | 🟡 Médio | 🟢 Baixo |

### Prioridade MÉDIA (Evolução)

| # | Item | Impacto | Esforço |
|---|------|---------|---------|
| 11 | **Gestão de equipe / Resource Management** — tabela `team_member`, atribuição de tarefas, capacidade | 🟢 Baixo | 🔴 Alto |
| 12 | **Cofre de acessos** — vault criptografado para credenciais de clientes | 🟢 Baixo | 🟡 Médio |
| 13 | **Visualização Lista para tarefas** — toggle Kanban/Lista no client detail | 🟢 Baixo | 🟢 Baixo |
| 14 | **Página de relatórios/analytics** — dashboard com gráficos interativos (além do CSV) | 🟢 Baixo | 🟡 Médio |
| 15 | **IA real (RAG)** — integrar backend de embeddings + LLM para prospects e auto-pilot | 🟡 Médio | 🔴 Alto |
| 16 | **Página de configurações gerais** — o sidebar link aponta para `#` (placeholder) | 🟢 Baixo | 🟢 Baixo |

---

## Resumo Executivo

O sistema tem uma base sólida em **comunicação** (WhatsApp/inbox), **relacionamento** (CRM, portal, aprovações) e **vendas** (pipeline, conversão). O gap principal está na **gestão de projetos** — não existe projeto como entidade, não existe time tracking, não existe milestones, e não existe cálculo financeiro por horas. Sem esses 4 pilares, o produto é um CRM com chat, não um gestor de agências.

---

### Inventário de Tabelas do Banco de Dados

| Database | Tabelas |
|----------|---------|
| Drizzle (PostgreSQL) — App Principal | 22 tabelas: `user`, `session`, `account`, `verification`, `client`, `service`, `channel_integration`, `conversation`, `message`, `project_task`, `approval`, `client_interaction`, `client_asset`, `client_note`, `onboarding_task`, `client_satisfaction`, `client_quicklink`, `client_scope`, `ad_spend_tracker`, `lead`, `client_financial_record`, `client_meeting`, `client_contract`, `client_poll` |
| TypeORM "data" (SQLite/Postgres) — OpenWA | 7 tabelas: `sessions`, `webhooks`, `messages`, `message_batches`, `templates`, `baileys_stored_messages`, `lid_mappings` |
| TypeORM "main" (SQLite) — Auth/Audit | 2 tabelas: `api_keys`, `audit_logs` |
| **Total** | **31 tabelas** |

### Inventário de Endpoints API

| Categoria | Endpoints |
|-----------|-----------|
| Autenticação | `/api/auth/[...all]` |
| Clients (CRM) | `/api/clients` (GET, POST), `/api/clients/[id]` (GET, PATCH, DELETE) |
| Serviços | `/api/services` (GET, POST), `/api/services/[id]` (GET, PUT, DELETE) |
| Leads (Pipeline) | `/api/leads` (GET, POST), `/api/leads/[id]` (PATCH, DELETE) |
| Conversas (Inbox) | `/api/conversations` (GET, POST), `/api/conversations/[id]` (DELETE), messages (GET, POST, PATCH), ignore (PATCH) |
| Integrações | `/api/integrations` (GET), `[id]` (GET, PATCH, DELETE), status-stream (GET SSE), whatsapp/connect (POST), whatsapp/test (POST), whatsapp/sync (POST) |
| Webhooks | `/api/webhooks/whatsapp` (POST) |
| SSE | `/api/inbox-stream` (GET) |
| Quick Actions | send-poll, create-proposal, create-approval, convert-lead (POST) |
| Dashboard/Reports | `/api/dashboard` (GET), `/api/reports` (GET) |
| Portal Auth | `/api/portal/[agency]/auth` (POST, DELETE) |
| Client Portal | tasks, approvals, assets, notes, onboarding, quicklinks, scope, ad-spend, churn-alerts, satisfaction, interactions, contracts, meetings — todos com GET/POST e sub-rotas PATCH/DELETE |
| **Total** | **49 arquivos de rota, 82 handlers HTTP** |
