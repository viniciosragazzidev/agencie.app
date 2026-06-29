# 🔍 Raio-X Completo: Plataforma Agencie

> **Data:** 25 de Junho de 2026
> **Versão:** Beta
> **Stack:** Next.js 15 (App Router), Tailwind CSS, Drizzle ORM (PostgreSQL), shadcn/ui, better-auth, GSAP, Recharts

---

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Análise de Features Existentes](#2-análise-de-features-existentes)
3. [Pontos Fracos e Oportunidades de Melhoria](#3-pontos-fracos-e-oportunidades-de-melhoria)
4. [Recomendações de Clean UX](#4-recomendações-de-clean-ux)
5. [Funcionalidades Novas Sugeridas](#5-funcionalidades-novas-sugeridas)
6. [Roadmap Sugerido](#6-roadmap-sugerido)

---

## 1. Visão Geral do Sistema

### Arquitetura

```
agencie.app/
├── app/                    # Next.js App Router
│   ├── (app)/             # Área logada (dashboard, clients, inbox)
│   │   ├── dashboard/     # Control Center (MRR, NPS, Pipeline, Churn)
│   │   ├── clients/       # CRM: listagem + bancada individual
│   │   ├── inbox/         # Central de Mensagens Omnichannel
│   │   ├── pipeline/      # Funil Comercial
│   │   ├── prospects/     # Prospecção com IA (BETA)
│   │   ├── services/      # Catálogo de Serviços
│   │   ├── client-portal/ # Gerenciamento do Portal do Cliente
│   │   ├── settings/      # Integrações, Configurações e IA
│   │   └── help/          # Dicionário de Termos
│   ├── portal/            # Portal do Cliente (side público/autenticado)
│   ├── api/               # ~50+ API Routes (REST)
│   └── ...                # Auth (login, register)
├── components/            # UI Components (shadcn/ui + custom)
├── lib/                   # DB schema, auth, integrações
│   ├── db/               # Drizzle schema + migrations
│   └── integrations/     # OpenWA (WhatsApp), Google Calendar
└── data/                 # Dicionário de termos
```

### Features Implementadas (55+ APIs, 20+ Páginas)

| Área | Features |
|------|----------|
| **Dashboard** | MRR, NPS, Pipeline, Churn Alerts, Campanhas, LTV/CAC |
| **CRM** | CRUD clientes, Kanban, Escopo, Aprovações, Ativos, Notas |
| **Inbox** | Chat Omnichannel, Ações Rápidas (Lead→Cliente, Proposta, Aprovação) |
| **Pós-Venda** | Onboarding, Briefing, Contratos, Reuniões, NPS, Ad Spend |
| **Portal** | Briefing, Contrato, Projetos, NPS, Escopo, Checklist |
| **Integrações** | WhatsApp (OpenWA), Google Calendar, Google OAuth |
| **Financeiro** | MRR tracking, Ad Spend, Propostas, Margem Lucro, Relatórios |
| **Gestão** | Projetos, Milestones, Team Members, Time Tracking |

---

## 2. Análise de Features Existentes

### ✅ O que já funciona bem

#### Design System e UI/UX
- **Identidade visual consistente** — Padrão "Double Bezel Card" unifica cards modais e seções
- **GSAP animações** — Staggers de entrada, transições entre tabs, micro-interações
- **Tipografia** — Uso de font-display para títulos, escalas pequenas para dados densos
- **Responsividade limitada mas funcional** — Grid layouts com `xl:grid-cols-12`

#### Dashboard (Control Center)
- KPIs visuais com **NumberTicker** (animação de contagem)
- Pipeline de clientes + feed de atividade recente
- Gráfico NPS por cliente (Recharts)
- Card de alertas de churn com ação direta
- Modal de criação de campanha integrado

#### CRM de Clientes
- Listagem com busca, filtro por status, ações em massa
- Bancada individual com **6 abas**: Início, CRM, Financeiro, Entregas, Calendário, Anotações
- Kanban de tarefas (A Fazer / Execução / Concluído)
- Gestão de **escopo contratado** com quotas mensais
- **Aprovações** com ciclo cliente↔agência
- **Assets Hub** para centralizar entregáveis (links, logos, relatórios)
- **Ad Spend Tracker** com orçamento planejado vs gasto
- **Quick Actions** (tarefa rápida, nota, reunião)

#### Inbox Omnichannel
- Mensagens em tempo real via SSE (`/api/inbox-stream`)
- Suporte a WhatsApp, Instagram, Facebook
- Ações rápidas no chat: converter lead, criar proposta, solicitar aprovação, enviar enquete
- Detecção de cliente vs lead no contato
- Indicador de status da conversa

#### Google Calendar
- OAuth2 completo com refresh token
- Criação de eventos com Google Meet
- Listagem de eventos combinados (meetings locais + Google Calendar)
- Componente de calendário mensal na dashboard

### ⚠️ O que tem problemas ou está incompleto

#### Dashboard
- **Cards usam `max-h-[280px]`** — Altura fixa pode cortar conteúdo em telas menores
- **Gráfico NPS com `<rect>` solto** — O `<Bar>` está sem `shape` prop, o que pode gerar warning no Recharts
- **Modal de campanha usa `select` nativo** — Inconsistente com o resto do design que usa selects estilizados
- **Toast usa div fixa** — Inconsistente com o `sonner` usado no Inbox

#### CRM / Bancada do Cliente
- **Arquivo monstruoso** — `page.tsx` com **+136k caracteres** (~2500+ linhas). Refatoração urgente necessária.
- **Modais inline** — Todos os modais estão no mesmo arquivo. Deveriam ser componentes separados.
- **Propostas são mockadas** — O gerador de propostas por IA é um `setTimeout` simulando, não uma API real
- **Edição de cliente usa modal pesado** — Todas as informações em um único modal com 20+ campos
- **Onboarding checklist não persiste resposta** — O campo `response` existe no schema mas não é usado no frontend
- **Interações reais implementadas recentemente** — Antes usava `clientNotes` mapeado como interação

#### Portal do Cliente
- **Design separado do sistema principal** — Layout diferente, menos polido
- **Briefing sem preview** — Cliente preenche mas não vê o resultado estruturado
- **Contrato com conteúdo inline** — Geração de contrato é inline na API, sem template visual

#### Inbox
- **Dedup de mensagens frágil** — Lógica de dedup por `content+direction` com janela de 2s pode falhar
- **Scroll para baixo em mensagens novas** — Às vezes não rola automaticamente
- **Ações rápidas com modals enormes** — `quick-action-modals.tsx` tem +1400 linhas

---

## 3. Pontos Fracos e Oportunidades de Melhoria

### 🔴 Críticos (Impactam diretamente a experiência)

| # | Problema | Impacto | Solução |
|---|----------|---------|---------|
| 1 | **Page.tsx gigantes** (clients/[id] = 2500+ linhas) | Manutenção impossível, bugs difíceis de rastrear | Extrair modais, tabs e componentes para arquivos separados. Cada aba deve ser um componente |
| 2 | **Sem loading states visuais** nas tabs da bancada | Usuário não vê feedback ao trocar de aba | Adicionar skeleton loaders específicos para cada aba |
| 3 | **Error handling genérico** — `.catch(() => {})` silencia erros | Usuário nunca vê quando algo falha | Logar erros no console e mostrar toast amigável |
| 4 | **Modais inline sem componente separado** | Duplicação de código, inconsistência visual | Extrair para `components/modals/` |
| 5 | **Propostas comerciais são simuladas** | Funcionalidade principal não entrega valor real | Implementar geração via LLM real ou template engine |

### 🟡 Médios (Melhorariam significativamente a experiência)

| # | Problema | Impacto | Solução |
|---|----------|---------|---------|
| 6 | **Formulários sem validação visual** | Usuário só descobre erro após submit | Adicionar validação inline com `react-hook-form` + `zod` |
| 7 | **Toast notification inconsciente** — 3 estilos diferentes (div fixa, sonner, inline) | Experiência quebrada | Padronizar tudo para `sonner` |
| 8 | **Sem scroll infinito ou paginação** nas listas | Performance degrada com muitos dados | Adicionar paginação nas APIs e frontend |
| 9 | **Select nativos vs estilizados** | Inconsistência visual | Padronizar para `select` estilizado ou `react-select` |
| 10 | **Portal do Cliente com design defasado** | Marca da agência não brilha | Aplicar mesmo design system do admin |
| 11 | **Sem feedback tátil em vários botões** | Falta sensação de interação premium | Adicionar `active:scale-[0.98]` em todos os botões |
| 12 | **Contratos gerados inline na API** | Difícil de manter template | Extrair para arquivo de template separado |

### 🟢 Leves (Polimento)

| # | Problema | Impacto | Solução |
|---|----------|---------|---------|
| 13 | **Nenhum empty state visual** | Telas vazias mostram texto genérico | Adicionar ilustrações ou ícones nos empty states |
| 14 | **Sem shortcuts de teclado** | Usuário avançado perde produtividade | Adicionar `Ctrl+K` para comando, `N` para novo cliente |
| 15 | **Favicon padrão Next.js** | Marca não aparece na aba do navegador | Adicionar favicon personalizado |
| 16 | **Título da página genérico** | "New Tab" aparece no navegador | Configurar metadata por página |
| 17 | **Sem PWA / offline** | Não funciona sem internet | Adicionar service worker básico |
| 18 | **Cores hardcoded em vários lugares** | Dificulta theming | Extrair para variáveis CSS |

---

## 4. Recomendações de Clean UX

### 4.1 Simplificação da Navegação

**Problema:** Sidebar tem 4 seções com 14 itens. Muitas opções para um usuário comum.

**Solução:**
- Colapsar "Workspace" em atalhos no topo
- Mover "Ajuda" para footer do sidebar
- Combinar "Faturamento" + "Serviços" + "Financeiro" em um hub "Financeiro"

### 4.2 Padronização Visual

**Regras de ouro:**
1. **Um estilo de Toast** — Usar `sonner` em todo lugar (já está no package.json)
2. **Um estilo de Modal** — Double Bezel Card padronizado em toda a aplicação
3. **Selects consistentes** — Substituir todos `<select>` nativos por versões estilizadas
4. **Botões com feedback tátil** — `active:scale-[0.98]` em TODOS os botões clicáveis
5. **Animações consistentes** — Usar `cubic-bezier(0.32,0.72,0,1)` como easing padrão

### 4.3 Estados de UI Completos

Para cada componente de dados, implementar:
- **Loading:** Skeleton loader com formato correspondente ao conteúdo
- **Empty:** Ilustração + texto + call-to-action
- **Error:** Mensagem amigável + botão de retry
- **Success:** Feedback visual com toast + transição suave

### 4.4 Responsividade Mobile

- Sidebar colapsável já existe (shadcn sidebar) mas conteúdo interno não quebra bem
- Tabelas em viewport mobile precisam de scroll horizontal ou cards empilhados
- Modais em mobile devem ocupar 95% da largura com padding adequado

---

## 5. Funcionalidades Novas Sugeridas

### 🔥 Prioridade Alta

#### 1. Assistente de IA no Dashboard
- Campo de pergunta no topo do dashboard
- RAG com base nos dados do cliente
- Respostas contextuais tipo "Qual cliente está com maior risco de churn?"

#### 2. Relatório Executivo Automático
- Botão "Gerar PDF" no dashboard que compila KPIs, gráficos e alertas
- Envio automático por email semanal

#### 3. Onboarding Inteligente
- Checklist com `responseType` e `responseOptions` já existentes no schema
- Formulário dinâmico que muda conforme as respostas
- Briefing integrado ao onboarding (já existe rota de briefing!)

#### 4. Notificações em Tempo Real
- Substituir polling por WebSocket/SSE
- Notificações de: novo lead, aprovação pendente, reunião confirmada, churn alert
- Badge no sidebar com contagem de notificações não lidas

### 📊 Prioridade Média

#### 5. Dashboard de Equipe
- Produtividade por membro, tarefas concluídas, horas registradas
- Time tracking já existe no schema (`timeEntry`)

#### 6. Automação de Follow-up
- Regras do tipo: "Se cliente não interage há 7 dias → enviar WhatsApp automático"
- Baseado no `clientInteraction` já implementado

#### 7. Biblioteca de Assets Global
- Assets não precisam ser por cliente — criar biblioteca reutilizável
- Categorias: logos, relatórios, templates, contratos

#### 8. Histórico de Propostas
- Propostas com pipeline próprio (rascunho → enviado → visualizado → aceito → recusado)
- Template editor com variáveis do cliente

### 💡 Prioridade Baixa (Diferenciais)

#### 9. Modo Escuro / Tema Customizado
- Já existe `theme-provider.tsx` — só falta ativar o toggle
- Permitir que cada usuário escolha entre light/dark/system

#### 10. Integração com N8N / Zapier
- Webhooks para eventos: novo cliente, aprovação, churn, reunião
- Permitir que a agência conecte com ERP próprio

#### 11. Insights de Crescimento
- "Este cliente cresceu 20% no MRR nos últimos 3 meses"
- "Sugerir upgrade baseado no uso de escopo"
- Comparativo mês a mês de receita por cliente

#### 12. App Mobile (PWA)
- Notificações push no celular
- Ações rápidas: responder WhatsApp, ver próximo evento
- Visualização de dashboard resumido

---

## 6. Roadmap Sugerido

### Fase 1 — Fundação (2-3 semanas)
- [ ] Refatorar `clients/[id]/page.tsx` em componentes modulares
- [ ] Padronizar toast notifications para `sonner`
- [ ] Adicionar validação de formulários
- [ ] Substituir selects nativos por estilizados
- [ ] Adicionar empty states e skeletons

### Fase 2 — Experiência (2-3 semanas)
- [ ] Implementar geração real de propostas
- [ ] Portal do Cliente com novo design
- [ ] Onboarding inteligente com formulário dinâmico
- [ ] Notificações em tempo real
- [ ] Feedback tátil em todos os elementos clicáveis

### Fase 3 — Escala (3-4 semanas)
- [ ] Assistente de IA no dashboard
- [ ] Relatório executivo automático
- [ ] Automação de follow-up
- [ ] Dashboard de equipe
- [ ] Paginação/scroll infinito

### Fase 4 — Diferenciais (4-6 semanas)
- [ ] App Mobile (PWA)
- [ ] Integração N8N/Zapier
- [ ] Insights de crescimento com IA
- [ ] Modo escuro
- [ ] Biblioteca de assets global

---

## Conclusão

O **Agencie** é uma plataforma surpreendentemente completa para uma versão Beta. O core de CRM, Pós-Venda e Omnichannel Inbox já entrega valor real para agências de marketing digital.

Os maiores gargalos hoje são:

1. **Arquitetura monolítica** — A página da bancada do cliente precisa ser refatorada URGENTEMENTE
2. **Inconsistência de componentes** — Toasts, selects, modais em estilos diferentes
3. **Simulações que deveriam ser reais** — Propostas, briefing, sugestões de IA
4. **Falta de feedback visual** — Loading, empty e error states incompletos
5. **Portal do Cliente defasado** — Experiência inferior ao admin

Com essas melhorias, o sistema pode passar de "ótima ferramenta interna" para "produto comercializável de alto valor".

---

*Documento gerado em 25/06/2026 por análise do código-fonte.*
