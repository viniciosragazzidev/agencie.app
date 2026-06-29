# Plano de Implementação: Ações Rápidas Avançadas, Escopos Integrados e Enquetes WhatsApp (Polls) Integradas

Este plano descreve como expandir o sistema de Ações Rápidas do Inbox, a Área do Cliente e o fluxo do WhatsApp Web para dar suporte a operações integradas locais, dinâmicas e enquetes nativas, sem dependência de serviços externos.

---

## I'm using the writing-plans skill to create the implementation plan.

---

## 1. User Review Required

> [!IMPORTANT]
> **Enquetes Nativas do WhatsApp (Polls) em Lote**:
> Utilizaremos o suporte do OpenWA para criar caixas de perguntas (Enquetes) nativas no WhatsApp para todas as ações interativas de controle:
> 1. **Confirmar Call (`schedule_meeting`)**: Enquete com data sugerida ("*Confirmar nossa Call para Segunda às 14h?*" com opções: "*Sim, Confirmado! 👍*" / "*Não, preciso alterar 📅*").
> 2. **Aprovação de Material (`request_approval`)**: Enquete sobre o material enviado ("*Você aprova o material anexado?*" com opções: "*Aprovado sem ajustes! ✅*" / "*Preciso de alterações/revisões ✏️*").
> 3. **Feedback NPS (`request_feedback`)**: Enquete de satisfação ("*Como você avalia nossa parceria neste mês?*" com opções: "*10 - Excelente*" / "*8 a 9 - Muito Bom*" / "*6 a 7 - Bom*" / "*Abaixo de 5 - Precisa Melhorar*").
> 4. **Qualificar Lead (`qualify_lead`)**: Enquete de qualificação instantânea ("*Qual o orçamento estimado para o seu projeto?*" com opções: "*Até R$ 3k/mês*" / "*R$ 3k a R$ 6k/mês*" / "*Acima de R$ 6k/mês*").
> 5. **Método de Pagamento (`request_payment`)**: Enquete para preferência de faturamento ("*Como prefere receber a fatura do seu projeto?*" com opções: "*Pix ⚡*" / "*Boleto Bancário 📄*" / "*Cartão de Crédito 💳*").
>
> **Alterações no Banco de Dados (Drizzle kit push)**:
> 1. Adicionaremos as colunas `price`, `billing` e `status` à tabela `client_scope`.
> 2. Criaremos a tabela `client_meeting` para agendamentos locais (calls) com status de aceite.
> 3. Criaremos a tabela `client_contract` para registrar os contratos gerados e a assinatura digital.
> 4. Criaremos a tabela `client_poll` para mapear os IDs das enquetes do WhatsApp e processar as respostas automaticamente via Webhook.

---

## 2. Open Questions

> [!WARNING]
> 1. **Tratamento de Múltiplos Votos**: No WhatsApp, o cliente pode clicar em mais de uma opção na enquete. O webhook tratará apenas a última opção registrada/atualizada no payload para definir o status final.

---

## 3. Mudanças no Banco de Dados

### #### [MODIFY] `lib/db/schema.ts`
*   Adicionar campos à tabela `clientScope`:
    *   `price`: `text("price").default("0").notNull()`
    *   `billing`: `text("billing", { enum: ["mensal", "anual", "unico"] }).default("mensal").notNull()`
    *   `status`: `text("status", { enum: ["active", "closed"] }).default("active").notNull()`
*   Criar tabela `clientMeeting` com colunas: `id`, `clientId`, `userId`, `title`, `description`, `meetingDate`, `platform`, `meetingLink`, `status` (`pending`, `confirmed`, `declined`), `clientSuggestedDate`, `clientComment`, `createdAt`, `updatedAt`.
*   Criar tabela `clientContract` com colunas: `id`, `clientId`, `userId`, `title`, `content` (texto completo preenchido), `status` (`pending`, `signed`), `signedAt`, `signerName`, `signerIp`, `signerDocument`, `createdAt`, `updatedAt`.
*   Criar tabela `clientPoll` com colunas: `id` (UUID), `clientId`, `userId`, `messageId`, `externalMessageId` (ID do WhatsApp), `pollName`, `type` (`meeting_confirmation`, `material_approval`, `nps`, `lead_qualification`, `payment_method`), `referenceId`, `options` (jsonb array), `createdAt`.
*   Registrar novas relações `clientRelations`, `userRelations` no Drizzle.

---

## 4. Endpoints de API (Backend)

### #### [NEW] `app/api/client-portal/meetings/route.ts`
*   `GET`: Lista as reuniões de um `clientId`.
*   `POST`: Cria uma reunião pendente no banco de dados. Opcionalmente envia como Poll do WhatsApp se `sendAsWppPoll` for `true`.

### #### [NEW] `app/api/client-portal/meetings/[id]/route.ts`
*   `PATCH`: Atualiza o status (`confirmed` ou `declined`) da reunião e anota sugestões.

### #### [NEW] `app/api/client-portal/contracts/route.ts`
*   `GET`: Lista os contratos de um cliente.
*   `POST`: Gera um contrato dinâmico a partir dos dados do cliente e da lista de serviços ativos (`client_scope` com status `active`).

### #### [NEW] `app/api/client-portal/contracts/[id]/sign/route.ts`
*   `POST`: Registra o aceite digital (Assinatura Eletrônica) capturando Nome, CPF/CNPJ, data/hora e o IP do cliente.

### #### [NEW] `app/api/inbox/quick-actions/send-poll/route.ts`
*   `POST`: Dispara uma enquete genérica ou ligada ao NPS/Qualificação/Faturamento para o OpenWA, registrando na tabela `client_poll` e devolvendo o preview para exibição no chat.

### #### [MODIFY] `app/api/client-portal/scope/[id]/route.ts`
*   Suportar a atualização dos novos campos (`price`, `billing`, `status`).

---

## 5. Integração com Webhook e Web Sockets

### #### [MODIFY] `lib/integrations/openwa.ts`
*   Criar helper `sendWppPollMessage(sessionId, to, pollName, pollOptions)` que dispara a requisição POST para `/messages/send-poll` do OpenWA Gateway.

### #### [MODIFY] `app/api/webhooks/whatsapp/route.ts`
*   Adicionar tratamento para o recebimento de enquetes respondidas:
    *   Interceptar eventos com tipo `poll_creation_answer` ou `poll_update` (e checar votos associados ao `quotedMsgId`).
    *   Buscar na tabela `client_poll` se existe enquete com `externalMessageId = quotedMsgId`.
    *   Se o tipo for `meeting_confirmation`:
        *   Caso o voto seja "Confirmar Call 👍", alterar `client_meeting.status` para `confirmed` no banco de dados e notificar a agência via SSE.
    *   Se o tipo for `material_approval`:
        *   Caso o voto seja "Aprovado sem ajustes! ✅", alterar `approval.status` para `approved`. Se for "Preciso de alterações/revisões ✏️", alterar para `revision`. Emitir evento SSE.
    *   Se o tipo for `nps`:
        *   Extrair o número da opção (ex: `"10 - Excelente"` -> `10`) e criar um registro na tabela `client_satisfaction`.
    *   Se o tipo for `lead_qualification`:
        *   Atualizar o `lead` correspondente com os dados respondidos na enquete.
    *   Se o tipo for `payment_method`:
        *   Salvar preferência de pagamento do cliente em `client_asset` ou anotações de faturamento.

---

## 6. Interface do Inbox e Área do Cliente

### #### [MODIFY] `components/inbox/quick-action-modals.tsx`
*   **Proposta Comercial (`send_proposal`)**: Exibe abas para "Selecionar do Catálogo Geral" e "Serviços Ativos". Permite editar valores e prazos.
*   **Agendar Reunião (`schedule_meeting`)**: Adicionar checkbox "Enviar como Enquete do WhatsApp".
*   **Contrato em PDF (`send_contract`)**: Gera o contrato pegando os escopos ativos do banco de dados, gera o documento e envia o link do portal para assinatura.
*   **Solicitar Aprovação (`request_approval`)**: Adicionar checkbox "Enviar como Enquete de Aprovação no WhatsApp".
*   **Solicitar Feedback / NPS (`request_feedback`)**: Adicionar checkbox para enviar a pesquisa NPS de 0 a 10 como enquete no WhatsApp.
*   **Solicitar Pagamento (`request_payment`)**: Adicionar checkbox "Enviar enquete de preferência de pagamento".
*   **Qualificar Lead (`qualify_lead`)**: Adicionar checkbox para enviar enquetes de orçamento estimado no chat.

### #### [MODIFY] `components/scope-wall.tsx`
*   Exibir o preço e cobrança de cada escopo.
*   Adicionar botão para **Fechar Orçamento** (mudar status para `closed`) e **Reabrir**.
*   Exibir separadamente a lista de "Serviços Ativos" e "Serviços Anteriores (Histórico)".

### #### [MODIFY] `app/(app)/clients/[id]/page.tsx`
*   Integrar campos de preço e cobrança no formulário de criação/edição de escopos.
*   Exibir as duas seções no CRM ("Serviços Ativos" vs "Histórico").

### #### [MODIFY] `app/portal/[agency]/projetos/portal-content.tsx`
*   **Nova Seção de Reuniões**: Mostra reuniões pendentes com botões para "Confirmar Horário" ou "Sugerir Alteração".
*   **Nova Seção de Contratos**: Mostra contratos pendentes e permite abrir a visualização detalhada para assinatura eletrônica.

### #### [NEW] `app/portal/[agency]/contrato/[id]/page.tsx`
*   Página otimizada de visualização de contrato para o cliente ler, assinar eletronicamente e baixar via `window.print()` (com CSS print configurado para ocultar botões e formatar margens).

---

## 7. Plano de Verificação

### Testes Automatizados (Build)
*   Executar `npm run build` para checagem de tipos.

### Testes Manuais
*   Agendar reuniões, solicitar aprovações, pedir faturamento e NPS usando enquetes. Responder no WhatsApp e garantir o recebimento em tempo real e atualização das respectivas tabelas do CRM.
*   Fechar um escopo de serviço do cliente e verificar se ele é movido automaticamente para "Serviços Anteriores" sem misturar com escopos ativos.
