# RESUMO DE IMPLEMENTACOES - Casos de Uso

> **Data:** 25/06/2026
> **Escopo:** Transformacao de CRM/Inbox para Gestor de Agencias

---

## VISAO GERAL

| Fase | Status | Arquivos Criados | Arquivos Modificados |
|------|--------|------------------|---------------------|
| FASE 1: Core de Projetos | Concluida | 5 rotas, 1 migration | schema.ts |
| FASE 2: Timesheet + Financeiro | Concluida | 3 rotas, 1 migration | - |
| FASE 3: Automacoes | Concluida | 1 rota, 1 migration | convert-lead/route.ts |
| FASE 4: Limpeza | Concluida | - | - |

---

## NOVAS TABELAS CRIADAS

### 1. `project`
**Caso de Uso:** Gerenciar projetos distintos por cliente, com status, prazos e orcamento.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | text PK | Identificador unico |
| client_id | text FK | Referencia ao cliente |
| user_id | text FK | Referencia ao owner (agencia) |
| name | text | Nome do projeto |
| description | text | Descricao do projeto |
| status | enum | planning, in_progress, review, done, cancelled |
| start_date | timestamp | Data de inicio |
| end_date | timestamp | Data de conclusao |
| budget | text | Valor fechado com o cliente (BRL) |

**Fluxo:** Agency cria projeto -> vincula ao client -> adiciona milestones -> atribui tarefas -> conclui

---

### 2. `milestone`
**Caso de Uso:** Dividir projetos em fases com dependencias e prazos.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | text PK | Identificador unico |
| project_id | text FK | Referencia ao projeto |
| user_id | text FK | Referencia ao owner |
| title | text | Nome da fase/marco |
| description | text | Descricao da fase |
| status | enum | pending, in_progress, completed |
| due_date | timestamp | Prazo da fase |
| position | integer | Ordem de exibicao |

**Fluxo:** Agency cria milestones dentro do projeto -> move tarefas entre milestones -> acompanha progresso

---

### 3. `team_member`
**Caso de Uso:** Gerenciar equipe da agencia com custo-hora para calculo de margem.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | text PK | Identificador unico |
| user_id | text FK | Referencia ao owner (agencia) |
| name | text | Nome do membro |
| email | text | Email do membro |
| role | enum | owner, manager, designer, developer, copywriter, other |
| hourly_cost | text | Custo-hora em BRL |
| avatar | text | URL do avatar |
| is_active | boolean | Se esta ativo na equipe |

**Fluxo:** Agency cadastra equipe -> atribui tarefas -> registra horas -> calcula margem

---

### 4. `time_entry`
**Caso de Uso:** Rastrear tempo gasto em tarefas para calculo de custo e margem de lucro.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | text PK | Identificador unico |
| task_id | text FK | Referencia a tarefa |
| team_member_id | text FK | Referencia ao membro da equipe |
| user_id | text FK | Referencia ao owner |
| start_time | timestamp | Inicio do cronometro |
| end_time | timestamp | Fim do cronometro (null = rodando) |
| duration | integer | Duracao em segundos |
| note | text | Observacao sobre o trabalho |

**Fluxo:** Membro inicia timer -> trabalha -> para timer -> duracao calculada automaticamente

---

## TABELAS MODIFICADAS

### `project_task` (novas colunas)
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| project_id | text FK | Vincula tarefa ao projeto |
| milestone_id | text FK | Vincula tarefa ao milestone |
| assigned_to | text FK | Membro responsavel |
| estimated_hours | integer | Horas estimadas |

### `onboarding_task` (novas colunas - briefing dinamico)
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| response | jsonb | Resposta do cliente (pergunta, resposta, data) |
| response_type | enum | text, textarea, file, select, date, boolean |
| response_options | jsonb | Opcoes para selects |

---

## NOVOS ENDPOINTS

### Gestao de Projetos
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/projects` | Lista projetos (filtravel por clientId) |
| POST | `/api/projects` | Cria novo projeto |
| GET | `/api/projects/[id]` | Detalhe do projeto com milestones e tasks |
| PATCH | `/api/projects/[id]` | Atualiza projeto |
| DELETE | `/api/projects/[id]` | Deleta projeto |

### Gestao de Milestones
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/projects/[id]/milestones` | Lista milestones do projeto |
| POST | `/api/projects/[id]/milestones` | Cria milestone no projeto |
| PATCH | `/api/milestones/[id]` | Atualiza milestone |
| DELETE | `/api/milestones/[id]` | Deleta milestone |

### Gestao de Equipe
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/team-members` | Lista membros da equipe |
| POST | `/api/team-members` | Cria novo membro |
| PATCH | `/api/team-members/[id]` | Atualiza membro |
| DELETE | `/api/team-members/[id]` | Remove membro |

### Timesheet
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/tasks/[id]/track/start` | Inicia cronometro |
| POST | `/api/tasks/[id]/track/stop` | Para cronometro e calcula duracao |

### Relatorios
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/reports/profit-margin` | Margem de lucro por projeto |

### Automacoes
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/projects/[id]/complete` | Handover automatico (marca done + envia WPP) |

---

## CASOS DE USO DETALHADOS

### CASO 1: Criar Projeto para Cliente
**Actor:** Gerente de Projeto
**Fluxo:**
1. Acessa `/clients/[id]` (Client Bench)
2. Clica em "Novo Projeto"
3. Preenche nome, descricao, orcamento, prazos
4. Envia POST `/api/projects`
5. Projeto aparece na lista de projetos do client

**Regras de Negocio:**
- Todo projeto pertence a um client
- Budget e o valor fechado com o cliente (usado no calculo de margem)
- Status inicial e "planning"

---

### CASO 2: Dividir Projeto em Fases
**Actor:** Gerente de Projeto
**Fluxo:**
1. Acessa detalhe do projeto `/projects/[id]`
2. Cria milestones (ex: "Briefing", "Design", "Desenvolvimento", "Entrega")
3. Para cada milestone, define prazo e ordem
4. Atribui tarefas existentes ao milestone

**Regras de Negocio:**
- Milestones sao ordenados por position
- Tarefas podem ser movidas entre milestones
- Excluir milestone nao exclui tarefas (SET NULL)

---

### CASO 3: Atribuir Tarefa a Membro da Equipe
**Actor:** Designer/Desenvolvedor
**Fluxo:**
1. Gerente cria team members em `/api/team-members`
2. Na tarefa, seleciona o responsavel (assigned_to)
3. Membro ve suas tarefas atribuidas

**Regras de Negocio:**
- Cada membro tem um custo-hora
- Atribuicao e opcional (nullable)
- Membro pode ter multiplas tarefas

---

### CASO 4: Registrar Tempo em Tarefa
**Actor:** Designer/Desenvolvedor
**Fluxo:**
1. Abre a tarefa atribuida a ele
2. Clica em "Play" (inicia cronometro)
3. POST `/api/tasks/[id]/track/start` cria time_entry
4. Trabalha na tarefa
5. Clica em "Pause" (para cronometro)
6. POST `/api/tasks/[id]/track/stop` calcula duracao

**Regras de Negocio:**
- Apenas 1 timer ativo por tarefa+member
- Se timer ficar aberto > 24h, frontend oferece encerramento
- Duracao calculada em segundos, convertida para horas no relatorio

---

### CASO 5: Calcular Margem de Lucro
**Actor:** Owner/Diretor
**Fluxo:**
1. Acessa dashboard ou relatorios
2. GET `/api/reports/profit-margin` retorna margem por projeto
3. Sistema cruza: budget do projeto vs. (horas * custo-hora dos membros)

**Formula:**
```
custo_total = SUM(duracao_segundos / 3600 * hourly_cost)
margem = ((budget - custo_total) / budget) * 100
```

**Regras de Negocio:**
- Budget = valor fechado com o cliente
- custo_total = soma de (horas trabalhadas * custo-hora do membro)
- Margem negativa = prejuizo no projeto

---

### CASO 6: Briefing Dinamico via Portal
**Actor:** Cliente
**Fluxo:**
1. Agency cria onboarding_tasks com responseType e responseOptions
2. Cliente acessa portal `/portal/[agency]/projetos`
3. Preenche respostas (texto, arquivo, selecao)
4. Respostas salvas em `response` (jsonb)

**Tipos de Campo Suportados:**
- `text`: Input simples
- `textarea`: Texto longo
- `file`: Upload de arquivo
- `date`: Selecao de data
- `boolean`: Sim/Nao
- `select`: Lista de opcoes (responseOptions)

---

### CASO 7: Boas-Vindas Automatica via WhatsApp
**Actor:** Sistema (automacao)
**Fluxo:**
1. Lead e convertido em client (`/api/inbox/quick-actions/convert-lead`)
2. Sistema busca integracao WhatsApp ativa
3. Envia mensagem de boas-vindas formatada
4. Registra interacao automatica no client

**Mensagem Enviada:**
```
Ola [Nome]! 

Foi um prazer fecharmos parceria. Estamos muito felizes em trabalhar juntos!

Voce recebera aqui atualizacoes dos seus projetos e podera acompanhar tudo pelo nosso portal.

Se tiver qualquer duvida, e so responder esta mensagem.
```

---

### CASO 8: Handover Automatico ao Concluir Projeto
**Actor:** Gerente de Projeto
**Fluxo:**
1. Gerente clica "Concluir Projeto"
2. POST `/api/projects/[id]/complete`
3. Sistema:
   - Busca assets/entregaveis do client
   - Busca escopo contratado
   - Monta resumo de entrega
   - Envia via WhatsApp ao cliente
   - Marca projeto como "done"
   - Registra interacao de delivery

**Dados Enviados:**
- Lista de entregaveis com links
- Escopo contratado com quotas
- Data de conclusao

---

## MIGRACOES SQL

| Arquivo | Descricao |
|---------|-----------|
| `0007_add_project_milestone_team.sql` | Cria project, milestone, team_member + refatora project_task + migra dados orfaos |
| `0008_add_time_entry.sql` | Cria time_entry |
| `0009_add_onboarding_briefing.sql` | Adiciona response, responseType, responseOptions em onboarding_task |

**Ordem de Execucao:**
```bash
# 1. Rodar migrations
psql $DATABASE_URL -f lib/db/migrations/0007_add_project_milestone_team.sql
psql $DATABASE_URL -f lib/db/migrations/0008_add_time_entry.sql
psql $DATABASE_URL -f lib/db/migrations/0009_add_onboarding_briefing.sql

# 2. Regenerar migrations do Drizzle
npx drizzle-kit generate

# 3. Deploy
npm run build
```

---

## LIMPEZA REALIZADA

| Item | Acao |
|------|------|
| `app/api/clients/[id]/get.ts` | Deletado (arquivo morto) |

---

## PROXIMOS PASSOS (BACKLOG RESTANTE)

| Prioridade | Item |
|------------|------|
| Alta | UI de Gantt/Timeline para projetos |
| Alta | Pagina de configuracoes gerais |
| Media | Integracao IA real (RAG) em prospects e settings |
| Media | Notificacoes via Slack/WhatsApp interno |
| Baixa | Visualizacao Lista para tarefas (toggle Kanban/Lista) |
