# Plano: Portal do Cliente separado por agência + login por CPF/CNPJ + e-mail

## Problema atual

O "portal" em `app/client-portal/page.tsx` **não autentica clientes**: usa a sessão da agência (`authClient.useSession()`), chama `/api/clients` e pega `clients[0].id`. Além disso, os endpoints `/api/client-portal/*` confiam no `clientId` do query/body sem verificação — buraco de segurança que precisa ser fechado.

## Solução

URL `/portal/[agency]` (slug = `user.username`, já único) → cliente digita **CPF/CNPJ + e-mail** → backend valida ambos contra o cadastro → emite **JWT em cookie httpOnly** → cliente acessa o resumo dos projetos dele. As rotas `/api/client-portal/*` passam a exigir auth (sessão da agência **ou** token do portal), sem quebrar o CRM da agência.

---

## 1. Schema do banco (`lib/db/schema.ts`)

- Adicionar coluna `document` (text, nullable) na tabela `client` — aceita CPF ou CNPJ.
- Índice único composto em `(userId, document)` → mesma agência não pode ter 2 clientes com o mesmo documento.
- Rodar `npm run db:generate` + `npm run db:push`.
- O campo `contactEmail` **já existe** na tabela — reusado como segundo fator. Clientes existentes ficam com `document = null` (não logam até a agência cadastrar).

## 2. Auth do portal (`lib/portal-auth.ts` — novo)

- JWT HS256 com `crypto` do Node (sem dependência nova).
- Payload: `{ clientId, agencyId, exp }` (TTL ~7 dias).
- Funções: `signPortalToken`, `verifyPortalToken`, `setPortalCookie`, `clearPortalCookie`, `getPortalClient(req)`.
- Cookie: `httpOnly`, `secure` (prod), `sameSite=lax`, `path=/`.

## 3. Endpoints de auth do portal

- `POST /api/portal/[agency]/auth` — body `{ document, email }`:
  1. Resolve a agência pelo `username` (case-insensitive); 404 se não existir.
  2. Busca `client` onde `userId = agency.id` **e** `document = informado` **e** `contactEmail = informado` (comparação case-insensitive no e-mail).
  3. Achou → seta cookie, retorna `{ clientId, name }`. Não achou → 401 "Documento ou e-mail não encontrados".
- `DELETE /api/portal/[agency]/auth` — limpa o cookie (logout).

## 4. Páginas do portal (`app/portal/[agency]/`)

- `layout.tsx` — chrome do portal (reaproveita o layout atual `app/client-portal/layout.tsx`), com o nome da agência (`user.name`) no header.
- `page.tsx` — **tela de login com 2 campos: CPF/CNPJ e e-mail**. Se já houver cookie válido pertencente a esta agência → redireciona para `/projetos`.
- `projetos/page.tsx` — **guarda server-side**: verifica o cookie; inválido → redireciona para o login. Renderiza o resumo reaproveitando os componentes já existentes: `ProjectStatusPipeline`, `ApprovalPanel`, `ScopeWall`, `OnboardingChecklist`, `AssetsHub`, `AdSpendMeter`, `QuicklinksHub`, `NPSSurvey`. Busca dados via `/api/client-portal/*?clientId=...` (agora protegidas).
- Remover o `app/client-portal/` antigo (substituído por `app/portal/[agency]/`).

## 5. Proteger os endpoints `/api/client-portal/*` (sem quebrar a agência)

- Helper `authorizePortalClient(req, clientId)` autoriza o `clientId` se:
  - **(a)** sessão de agência válida **e** cliente pertence a ela (modo CRM — mantém `clients/[id]` funcionando), **ou**
  - **(b)** token de portal válido **e** `token.clientId === clientId` **e** cliente pertence à agência do token.
- Aplicar em todas as rotas: `tasks`, `approvals`, `onboarding`, `assets`, `scope`, `ad-spend`, `quicklinks`, `satisfaction`, `notes`, `interactions`, `churn-alerts` (+ variantes `[id]`).
- Hoje retornam 200 pra qualquer `clientId`; após, 401 sem auth válida.

## 6. Lado da agência: cadastrar CPF/CNPJ do cliente

- Adicionar campo **CPF/CNPJ** no formulário de criar/editar cliente.
- Atualizar `POST /api/clients` e o `PUT` para aceitar `document`.
- (Opcional) Mostrar a URL do portal (`/portal/[username]`) em Account/Settings para a agência compartilhar.

---

## Arquivos afetados

- **Novos**: `lib/portal-auth.ts`, `app/portal/[agency]/layout.tsx`, `app/portal/[agency]/page.tsx`, `app/portal/[agency]/projetos/page.tsx`, `app/api/portal/[agency]/auth/route.ts`
- **Editados**: `lib/db/schema.ts`, todos os `app/api/client-portal/*/route.ts` (+ `[id]`), `app/api/clients/route.ts`, formulário de cliente em `app/(app)/clients/...`
- **Removidos**: `app/client-portal/` (antigo)

## Ordem de execução

1. Schema + migration → 2. `lib/portal-auth.ts` → 3. endpoints de auth → 4. proteger `/api/client-portal/*` → 5. páginas do portal → 6. formulário de cliente da agência → 7. validação manual (`npm run dev`): fluxo login → resumo + confirmar que o CRM da agência segue funcionando.

---

## Observações

- Não há testes automatizados no projeto, então a validação será manual.
- O plano foi aprovado e está sendo executado em 7 tarefas organizadas em ordem sequencial.
