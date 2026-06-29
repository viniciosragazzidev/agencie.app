# Plano de Desenvolvimento Completo - Página /settings

## 📋 Visão Geral

Este documento detalha o plano completo de desenvolvimento para a página `/settings` do sistema Agencie.app, incluindo todas as funcionalidades, componentes, integrações e melhorias necessárias.

---

## 🎯 Objetivos Principais

1. **Centralizar configurações** - Um hub único para todas as configurações do sistema
2. **Experiência intuitiva** - Interface moderna com navegação clara e feedback visual
3. **Configurações granulares** - Controle fino sobre cada aspecto do sistema
4. **Segurança** - Validações e permissões adequadas para cada tipo de configuração
5. **Performance** - Carregamento rápido e salvamento otimizado

---

## 🏗️ Arquitetura Atual

### Páginas Existentes

```
app/(app)/settings/
├── agency/page.tsx          ✅ EXISTE - Configurações da agência
├── ai/page.tsx             ✅ EXISTE - Configurações de IA
└── integrations/page.tsx   ✅ EXISTE - Integrações
```

### Páginas Necessárias (a criar)

```
app/(app)/settings/
├── page.tsx                 ❌ CRIAR - Página principal/dashboard de settings
├── profile/page.tsx         ❌ CRIAR - Perfil do usuário
├── team/page.tsx           ❌ CRIAR - Gerenciamento de equipe
├── billing/page.tsx        ❌ CRIAR - Faturamento e planos
├── notifications/page.tsx  ❌ CRIAR - Preferências de notificações
├── security/page.tsx       ❌ CRIAR - Segurança e autenticação
├── api-keys/page.tsx       ❌ CRIAR - Gestão de API keys
├── webhooks/page.tsx       ❌ CRIAR - Configuração de webhooks
└── advanced/page.tsx       ❌ CRIAR - Configurações avançadas
```

---

## 📦 Componentes a Desenvolver

### 1. Settings Layout Component
**Arquivo:** `app/(app)/settings/layout.tsx`

```typescript
interface SettingsLayoutProps {
  children: React.ReactNode
}

// Sidebar de navegação lateral com:
// - Menu hierárquico de seções
// - Indicador de seção ativa
// - Busca de configurações
// - Ícones e badges
```

**Funcionalidades:**
- [ ] Sidebar responsivo com collapse em mobile
- [ ] Navegação com atalhos de teclado (cmd+k)
- [ ] Breadcrumbs contextuais
- [ ] Indicador de mudanças não salvas
- [ ] Busca global de configurações

---

### 2. Settings Dashboard (página principal)
**Arquivo:** `app/(app)/settings/page.tsx`

**Seções:**
- [ ] **Quick Stats** - Cards com métricas importantes
  - Total de integrações ativas
  - Membros da equipe
  - Storage utilizado
  - API calls este mês
  
- [ ] **Atalhos Rápidos** - Cards clicáveis para ações comuns
  - Convidar membro da equipe
  - Conectar nova integração
  - Atualizar plano
  - Ver logs de auditoria

- [ ] **Atividade Recente** - Timeline de mudanças
  - Quem mudou o quê e quando
  - Filtros por tipo de mudança
  - Link direto para a configuração

- [ ] **Status do Sistema** - Health checks
  - Status das integrações
  - Conectividade com APIs externas
  - Últimas sincronizações

---

## 🔧 Páginas de Configuração Detalhadas

### 3. Profile Settings (`/settings/profile`)

**Seções:**

#### 3.1 Informações Básicas
- [ ] Nome completo
- [ ] Email (com verificação)
- [ ] Username/handle
- [ ] Avatar (upload com crop)
- [ ] Bio/Descrição
- [ ] Fuso horário
- [ ] Idioma preferido

#### 3.2 Informações de Contato
- [ ] Telefone (com máscara)
- [ ] WhatsApp
- [ ] LinkedIn
- [ ] Redes sociais

#### 3.3 Preferências
- [ ] Tema (Light/Dark/System)
- [ ] Densidade da interface (Comfortable/Compact)
- [ ] Animações (On/Off/Reduced)
- [ ] Sons de notificação

#### 3.4 Assinatura de Email
- [ ] Editor rich-text para assinatura
- [ ] Preview da assinatura
- [ ] Template de assinatura

---

### 4. Agency Settings (`/settings/agency`)

**Status:** ✅ EXISTENTE - Precisa melhorias

**Melhorias Necessárias:**

#### 4.1 Upload de Logo
- [ ] Drag & drop de imagem
- [ ] Crop/resize de imagem
- [ ] Preview em tempo real
- [ ] Upload para CDN/Storage
- [ ] Múltiplas versões (logo, favicon, logo_dark)

#### 4.2 Branding Avançado
- [ ] Paleta de cores completa (não só 3 cores)
- [ ] Typography settings (fontes personalizadas)
- [ ] Preview live das mudanças
- [ ] Export de brand kit

#### 4.3 Dados Jurídicos
- [ ] Validação de CNPJ com API da Receita
- [ ] Auto-complete de endereço via CEP
- [ ] Upload de documentos legais
- [ ] Dados bancários para boletos

#### 4.4 Informações Públicas
- [ ] Página pública da agência
- [ ] SEO meta tags
- [ ] Social media cards
- [ ] Favicon e app icons

---

### 5. Team Management (`/settings/team`)

**Funcionalidades:**

#### 5.1 Lista de Membros
- [ ] Tabela com filtros e busca
- [ ] Colunas: Nome, Email, Role, Status, Último acesso
- [ ] Ações rápidas: Editar, Remover, Reenviar convite

#### 5.2 Convites Pendentes
- [ ] Lista de convites enviados
- [ ] Reenviar convite
- [ ] Cancelar convite
- [ ] Link de convite público

#### 5.3 Roles e Permissões
- [ ] Admin - Acesso total
- [ ] Manager - Gestão de clientes e projetos
- [ ] Member - Acesso básico
- [ ] Custom Roles - Criar roles personalizados

#### 5.4 Permissões Granulares
```typescript
interface Permission {
  resource: "clients" | "projects" | "inbox" | "financeiro" | "settings"
  actions: ("create" | "read" | "update" | "delete")[]
}
```

#### 5.5 Convite de Membros
- [ ] Modal de convite
- [ ] Seleção de role
- [ ] Mensagem personalizada
- [ ] Envio por email
- [ ] Notificação no sistema

---

### 6. Integrations (`/settings/integrations`)

**Status:** ✅ EXISTENTE - Precisa melhorias

**Melhorias Necessárias:**

#### 6.1 WhatsApp (OpenWA)
- [ ] QR Code para conexão
- [ ] Status da conexão em tempo real
- [ ] Logs de mensagens
- [ ] Configurações de auto-resposta
- [ ] Webhook configuration
- [ ] Número de telefone conectado

#### 6.2 Google Calendar
- [ ] OAuth flow melhorado
- [ ] Seleção de calendários
- [ ] Sincronização bidirecional
- [ ] Configurações de sincronização
- [ ] Logs de eventos sincronizados

#### 6.3 Novas Integrações a Adicionar

**CRM & Sales:**
- [ ] RD Station
- [ ] HubSpot
- [ ] Pipedrive
- [ ] Salesforce

**Comunicação:**
- [ ] Slack
- [ ] Discord
- [ ] Telegram
- [ ] Email (SMTP/IMAP)

**Pagamentos:**
- [ ] Stripe
- [ ] Mercado Pago
- [ ] PayPal
- [ ] PagSeguro

**Produtividade:**
- [ ] Notion
- [ ] Trello
- [ ] Asana
- [ ] Monday.com
- [ ] ClickUp

**Storage:**
- [ ] Google Drive
- [ ] Dropbox
- [ ] OneDrive
- [ ] AWS S3

**Analytics:**
- [ ] Google Analytics
- [ ] Mixpanel
- [ ] Amplitude
- [ ] Hotjar

#### 6.4 Marketplace de Integrações
- [ ] Grid de integrações disponíveis
- [ ] Filtros por categoria
- [ ] Busca
- [ ] Status: Disponível, Em breve, Beta
- [ ] Documentação de cada integração
- [ ] Botão "Conectar" com OAuth flow

---

### 7. AI Settings (`/settings/ai`)

**Status:** ✅ EXISTENTE - Precisa melhorias

**Melhorias Necessárias:**

#### 7.1 Model Configuration
- [ ] Seleção de modelo (GPT-4, Claude, Gemini)
- [ ] Temperature slider
- [ ] Max tokens
- [ ] Top-p, Top-k parameters
- [ ] Comparison table de modelos

#### 7.2 Knowledge Base
- [ ] Upload de documentos (PDF, DOCX, TXT)
- [ ] Web scraping de URLs
- [ ] Gestão de documentos indexados
- [ ] Re-indexação de documentos
- [ ] Visualização de chunks/embeddings

#### 7.3 Prompt Engineering
- [ ] System prompt customizável
- [ ] Persona configuration
- [ ] Guidelines e regras
- [ ] Few-shot examples
- [ ] Testing playground

#### 7.4 Auto-Pilot Settings
- [ ] Ativar/Desativar autopilot
- [ ] Configurar gatilhos para intervencão humana
- [ ] Palavras-chave para escalação
- [ ] Horários de atuação
- [ ] Limites de conversas simultâneas

#### 7.5 Analytics de IA
- [ ] Total de mensagens processadas
- [ ] Taxa de resolução automática
- [ ] Tempo médio de resposta
- [ ] Satisfação do cliente
- [ ] Custos de API

---

### 8. Billing & Subscription (`/settings/billing`)

**Funcionalidades:**

#### 8.1 Plano Atual
- [ ] Card com detalhes do plano
- [ ] Features incluídas
- [ ] Limites e uso atual
- [ ] Data de renovação
- [ ] Botão "Upgrade" ou "Change Plan"

#### 8.2 Planos Disponíveis
- [ ] Comparação de planos (Starter, Pro, Enterprise)
- [ ] Toggle anual/mensal com desconto
- [ ] Highlights de features
- [ ] CTAs claros

#### 8.3 Método de Pagamento
- [ ] Cartão de crédito salvo (últimos 4 dígitos)
- [ ] Adicionar/Atualizar cartão
- [ ] Boleto bancário
- [ ] PIX

#### 8.4 Histórico de Faturas
- [ ] Tabela de faturas
- [ ] Status: Paga, Pendente, Vencida
- [ ] Download de PDF
- [ ] Enviar por email
- [ ] Detalhes itemizados

#### 8.5 Usage & Quotas
- [ ] Gráficos de uso mensal
- [ ] Breakdown por feature:
  - Clientes ativos
  - Projetos
  - Mensagens/mês
  - Storage
  - API calls
  - Membros da equipe
- [ ] Alertas de limite

#### 8.6 Cancelamento
- [ ] Flow de cancelamento
- [ ] Survey de feedback
- [ ] Oferta de retenção
- [ ] Data efetiva de cancelamento

---

### 9. Notifications (`/settings/notifications`)

**Funcionalidades:**

#### 9.1 Preferências de Email
- [ ] Notificações de clientes
- [ ] Notificações de projetos
- [ ] Notificações de equipe
- [ ] Digest diário/semanal
- [ ] Marketing e novidades

#### 9.2 Preferências de Push
- [ ] Mensagens novas no inbox
- [ ] Tarefas atribuídas a você
- [ ] Menções em comentários
- [ ] Aprovações pendentes
- [ ] Pagamentos recebidos

#### 9.3 Preferências de WhatsApp
- [ ] Alertas críticos
- [ ] Resumo diário
- [ ] Opt-in/opt-out

#### 9.4 Horários
- [ ] Não perturbe
- [ ] Horário de trabalho
- [ ] Fuso horário

#### 9.5 Canais de Notificação
```typescript
interface NotificationChannel {
  type: "email" | "push" | "sms" | "whatsapp" | "slack"
  enabled: boolean
  events: string[]
}
```

---

### 10. Security Settings (`/settings/security`)

**Funcionalidades:**

#### 10.1 Senha
- [ ] Alterar senha
- [ ] Requisitos de senha forte
- [ ] Última alteração
- [ ] Forçar mudança periódica

#### 10.2 Two-Factor Authentication (2FA)
- [ ] Ativar/Desativar 2FA
- [ ] QR Code para TOTP (Google Authenticator)
- [ ] Backup codes
- [ ] SMS como fallback

#### 10.3 Sessões Ativas
- [ ] Lista de dispositivos logados
- [ ] Última atividade
- [ ] Localização (IP)
- [ ] Browser/Device info
- [ ] Revogar sessão

#### 10.4 Logs de Acesso
- [ ] Histórico de logins
- [ ] IPs utilizados
- [ ] Tentativas falhadas
- [ ] Ações suspeitas

#### 10.5 API Tokens
- [ ] Ver tokens ativos
- [ ] Criar novo token
- [ ] Revogar token
- [ ] Escopos e permissões

---

### 11. API Keys Management (`/settings/api-keys`)

**Funcionalidades:**

#### 11.1 Lista de API Keys
- [ ] Tabela com keys criadas
- [ ] Nome da key
- [ ] Última utilização
- [ ] Permissões/Scopes
- [ ] Ações: Ver, Revogar, Regenerar

#### 11.2 Criar Nova API Key
- [ ] Modal de criação
- [ ] Nome da key
- [ ] Descrição
- [ ] Seleção de scopes:
  ```typescript
  const scopes = [
    "clients:read",
    "clients:write",
    "projects:read",
    "projects:write",
    "conversations:read",
    "conversations:write",
    "webhooks:manage"
  ]
  ```
- [ ] Expiration date (opcional)
- [ ] Mostrar key apenas uma vez (copy to clipboard)

#### 11.3 Documentação
- [ ] Link para documentação da API
- [ ] Exemplos de uso
- [ ] Rate limits

---

### 12. Webhooks (`/settings/webhooks`)

**Funcionalidades:**

#### 12.1 Lista de Webhooks
- [ ] Tabela de webhooks configurados
- [ ] URL de destino
- [ ] Eventos inscritos
- [ ] Status: Ativo, Pausado, Com erro
- [ ] Última entrega

#### 12.2 Criar Webhook
- [ ] URL de destino
- [ ] Seleção de eventos:
  ```typescript
  const webhookEvents = [
    "client.created",
    "client.updated",
    "project.created",
    "project.updated",
    "task.completed",
    "message.received",
    "payment.received"
  ]
  ```
- [ ] Secret para assinatura HMAC
- [ ] Headers customizados
- [ ] Retry policy

#### 12.3 Logs de Webhooks
- [ ] Histórico de entregas
- [ ] Payload enviado
- [ ] Response recebido
- [ ] Status codes
- [ ] Tempo de resposta
- [ ] Retry attempts

#### 12.4 Testing
- [ ] Enviar webhook de teste
- [ ] Visualizar payload
- [ ] Validar assinatura

---

### 13. Advanced Settings (`/settings/advanced`)

**Funcionalidades:**

#### 13.1 Danger Zone
- [ ] Exportar todos os dados (GDPR)
- [ ] Deletar conta
- [ ] Transfer ownership
- [ ] Archive workspace

#### 13.2 Developer Tools
- [ ] Enable debug mode
- [ ] View system logs
- [ ] Database queries log
- [ ] Feature flags

#### 13.3 Experimental Features
- [ ] Beta features opt-in
- [ ] Feature flags toggles
- [ ] Feedback form

#### 13.4 Data & Privacy
- [ ] Data retention policy
- [ ] GDPR compliance
- [ ] Privacy settings
- [ ] Cookie preferences

---

## 🛠️ Componentes Compartilhados

### SettingsCard Component
```typescript
interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  icon?: React.ComponentType
  badge?: string
}
```

### SettingsSection Component
```typescript
interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}
```

### SettingsToggle Component
```typescript
interface SettingsToggleProps {
  label: string
  description?: string
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}
```

### SettingsInput Component
```typescript
interface SettingsInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
  success?: string
}
```

### SaveBar Component
```typescript
// Barra fixa no rodapé quando há mudanças não salvas
interface SaveBarProps {
  isDirty: boolean
  onSave: () => void
  onDiscard: () => void
  isSaving: boolean
}
```

---

## 🎨 Design System

### Cores
```css
--settings-primary: hsl(var(--primary))
--settings-success: hsl(142 76% 36%)
--settings-warning: hsl(38 92% 50%)
--settings-danger: hsl(0 72% 51%)
--settings-info: hsl(199 89% 48%)
```

### Espaçamento
- Seções: `gap-8`
- Cards: `gap-6`
- Inputs: `gap-4`
- Labels: `gap-2`

### Typography
- Título de página: `text-2xl font-display font-semibold`
- Título de seção: `text-lg font-semibold`
- Label: `text-sm font-medium`
- Descrição: `text-xs text-muted-foreground`

---

## 🔌 APIs e Rotas Necessárias

### User/Profile
```
GET    /api/user/profile
PATCH  /api/user/profile
POST   /api/user/avatar
DELETE /api/user/avatar
PATCH  /api/user/password
```

### Agency
```
GET    /api/agency-settings          ✅ EXISTE
PUT    /api/agency-settings          ✅ EXISTE
POST   /api/agency-settings/logo     ❌ CRIAR
```

### Team
```
GET    /api/team/members
POST   /api/team/invite
DELETE /api/team/members/:id
PATCH  /api/team/members/:id
GET    /api/team/invites
DELETE /api/team/invites/:id
POST   /api/team/invites/:id/resend
```

### Integrations
```
GET    /api/integrations                    ✅ EXISTE
POST   /api/integrations/:type/connect
DELETE /api/integrations/:id/disconnect
GET    /api/integrations/:id/status
PATCH  /api/integrations/:id/settings
```

### AI
```
GET    /api/ai/settings
PATCH  /api/ai/settings
POST   /api/ai/knowledge-base/documents
DELETE /api/ai/knowledge-base/documents/:id
POST   /api/ai/knowledge-base/urls
GET    /api/ai/analytics
```

### Billing
```
GET    /api/billing/subscription
POST   /api/billing/subscription/upgrade
POST   /api/billing/subscription/cancel
GET    /api/billing/invoices
GET    /api/billing/invoices/:id/download
POST   /api/billing/payment-methods
DELETE /api/billing/payment-methods/:id
GET    /api/billing/usage
```

### Notifications
```
GET    /api/user/notification-preferences
PATCH  /api/user/notification-preferences
```

### Security
```
POST   /api/user/2fa/enable
POST   /api/user/2fa/disable
POST   /api/user/2fa/verify
GET    /api/user/sessions
DELETE /api/user/sessions/:id
GET    /api/user/access-logs
```

### API Keys
```
GET    /api/api-keys
POST   /api/api-keys
DELETE /api/api-keys/:id
PATCH  /api/api-keys/:id
```

### Webhooks
```
GET    /api/webhooks
POST   /api/webhooks
PATCH  /api/webhooks/:id
DELETE /api/webhooks/:id
GET    /api/webhooks/:id/logs
POST   /api/webhooks/:id/test
```

---

## 🗄️ Schema de Banco de Dados

### Tabelas Necessárias

```sql
-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  theme TEXT,
  language TEXT,
  timezone TEXT,
  notification_email JSONB,
  notification_push JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  role TEXT, -- admin, manager, member
  permissions JSONB,
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team invites
CREATE TABLE team_invites (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT,
  invited_by UUID REFERENCES users(id),
  token TEXT UNIQUE,
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  key_hash TEXT UNIQUE,
  scopes TEXT[],
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  url TEXT NOT NULL,
  events TEXT[],
  secret TEXT,
  headers JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook logs
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY,
  webhook_id UUID REFERENCES webhooks(id),
  event_type TEXT,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  attempt INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token TEXT UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Access logs
CREATE TABLE access_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT,
  resource TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI settings
CREATE TABLE ai_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  model TEXT,
  temperature FLOAT,
  system_prompt TEXT,
  autopilot_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI knowledge base
CREATE TABLE ai_knowledge_base (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT, -- document, url
  name TEXT,
  content TEXT,
  embeddings VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Roadmap de Implementação

### Fase 1: Fundação (Semana 1-2)
- [ ] Criar layout base de settings com sidebar
- [ ] Implementar página dashboard de settings
- [ ] Criar componentes compartilhados (SettingsCard, SettingsSection, etc.)
- [ ] Implementar SaveBar component
- [ ] Criar rotas de API base para user/profile

### Fase 2: Core Settings (Semana 3-4)
- [ ] Implementar Profile Settings completo
- [ ] Melhorar Agency Settings (upload de logo, branding)
- [ ] Implementar Team Management
- [ ] Criar sistema de roles e permissões
- [ ] Implementar convite de membros

### Fase 3: Integrações (Semana 5-6)
- [ ] Melhorar página de integrações existente
- [ ] Adicionar marketplace de integrações
- [ ] Implementar OAuth flows para novas integrações
- [ ] Criar documentação de integrações
- [ ] Implementar logs e monitoring de integrações

### Fase 4: AI Enhancements (Semana 7)
- [ ] Melhorar AI Settings
- [ ] Implementar knowledge base completo
- [ ] Criar prompt engineering playground
- [ ] Implementar analytics de IA
- [ ] Otimizar sistema de embeddings

### Fase 5: Billing & Security (Semana 8-9)
- [ ] Implementar Billing & Subscription
- [ ] Integrar gateway de pagamento (Stripe)
- [ ] Implementar Security Settings
- [ ] Adicionar 2FA
- [ ] Implementar gestão de sessões
- [ ] Criar logs de auditoria

### Fase 6: Developer Tools (Semana 10)
- [ ] Implementar API Keys management
- [ ] Implementar Webhooks
- [ ] Criar logs e testing de webhooks
- [ ] Documentação de API
- [ ] Rate limiting

### Fase 7: Advanced & Polish (Semana 11-12)
- [ ] Implementar Notifications preferences
- [ ] Implementar Advanced Settings
- [ ] Adicionar busca global de settings
- [ ] Atalhos de teclado
- [ ] Animações e transições
- [ ] Testes E2E
- [ ] Otimizações de performance

---

## 📊 Métricas de Sucesso

### Performance
- [ ] Time to Interactive < 2s
- [ ] Salvamento de settings < 500ms
- [ ] Upload de imagens < 3s

### UX
- [ ] Taxa de conclusão de perfil > 80%
- [ ] Taxa de erro em forms < 5%
- [ ] NPS de settings page > 8/10

### Adoption
- [ ] % de usuários que configuraram perfil completo
- [ ] % de agências com branding customizado
- [ ] % de usuários com integrações ativas

---

## 🔒 Segurança e Validações

### Validações de Input
- [ ] Sanitização de todos os inputs
- [ ] Validação de emails
- [ ] Validação de URLs
- [ ] Validação de CNPJ
- [ ] Validação de telefone
- [ ] XSS protection
- [ ] CSRF protection

### Permissões
- [ ] Role-based access control (RBAC)
- [ ] Verificar permissões antes de salvar
- [ ] Audit log de todas as mudanças
- [ ] Rate limiting em APIs

### Dados Sensíveis
- [ ] Não expor API keys no frontend
- [ ] Hash de senhas com bcrypt
- [ ] Encriptação de dados sensíveis
- [ ] HTTPS obrigatório
- [ ] Secure cookies

---

## 🧪 Testes

### Unit Tests
- [ ] Componentes de UI
- [ ] Validações
- [ ] Utilitários

### Integration Tests
- [ ] Flows de OAuth
- [ ] Upload de arquivos
- [ ] Salvamento de settings
- [ ] APIs

### E2E Tests
- [ ] Criar conta → configurar perfil → convidar membro
- [ ] Conectar integração → configurar → testar
- [ ] Criar API key → fazer request → revogar
- [ ] Configurar webhook → receber evento → ver logs

---

## 📱 Responsividade

### Mobile (< 768px)
- [ ] Sidebar collapsa em menu hambúrguer
- [ ] Cards em coluna única
- [ ] Inputs ocupam largura total
- [ ] Tabs scrollable horizontal
- [ ] SaveBar adaptado para mobile

### Tablet (768px - 1024px)
- [ ] Sidebar sempre visível mas estreita
- [ ] Grid de 2 colunas onde faz sentido
- [ ] Spacing ajustado

### Desktop (> 1024px)
- [ ] Sidebar expandida com labels
- [ ] Grids de 2-3 colunas
- [ ] Hover states e tooltips
- [ ] Atalhos de teclado visíveis

---

## 🎯 Próximos Passos Imediatos

1. **Criar página principal de settings** (`/settings/page.tsx`)
2. **Implementar layout com sidebar** (`/settings/layout.tsx`)
3. **Criar componentes compartilhados** (SettingsCard, SaveBar, etc.)
4. **Melhorar upload de logo** na página de agency
5. **Implementar Team Management** básico

---

## 📚 Referências e Inspirações

### Design
- Vercel Settings
- Linear Settings
- Stripe Dashboard
- GitHub Settings
- Notion Settings

### UX Patterns
- Progressive disclosure
- Inline editing
- Optimistic updates
- Toast notifications
- Confirmation modals

---

## 🤝 Conclusão

Este plano cobre todas as necessidades essenciais e avançadas para uma página de settings completa e profissional. A implementação deve ser feita de forma incremental, priorizando as funcionalidades mais importantes primeiro e mantendo sempre a qualidade, segurança e experiência do usuário como pilares principais.

**Estimativa total:** 10-12 semanas de desenvolvimento
**Prioridade:** Alta
**Complexidade:** Média-Alta
