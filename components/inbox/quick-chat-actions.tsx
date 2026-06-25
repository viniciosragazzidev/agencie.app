"use client"

import React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ZapIcon,
  File01Icon,
  CheckmarkBadge01Icon,
  Invoice01Icon,
  Calendar01Icon,
  StarIcon,
  ChartBarLineIcon,
  ClipboardIcon,
  RefreshIcon,
  CheckmarkCircle02Icon,
  Search01Icon,
  Building03Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

interface QuickChatActionsProps {
  isClient: boolean
  onSelectAction: (text: string) => void
  disabled?: boolean
}

export function QuickChatActions({ isClient, onSelectAction, disabled }: QuickChatActionsProps) {
  const clientActions = [
    {
      label: "Enviar Proposta Comercial",
      icon: File01Icon,
      template: "Olá! Segue o link com a nossa proposta comercial detalhada: [LINK DA PROPOSTA]",
    },
    {
      label: "Enviar Serviços e Preços",
      icon: CheckmarkBadge01Icon,
      template: "Aqui está a nossa lista completa de serviços e a tabela de preços atualizada: [LINK DOS SERVIÇOS]",
    },
    {
      label: "Enviar Contrato em PDF",
      icon: File01Icon,
      template: "Segue o contrato para análise e assinatura digital. Qualquer dúvida, estou à disposição! [LINK DO CONTRATO]",
    },
    {
      label: "Solicitar Pagamento",
      icon: Invoice01Icon,
      template: "Olá! O link para pagamento / fatura do seu projeto já está disponível aqui: [LINK DE PAGAMENTO]",
    },
    {
      label: "Agendar Reunião / Call",
      icon: Calendar01Icon,
      template: "Vamos fazer uma call rápida? Escolha o melhor horário na minha agenda: [LINK DA AGENDA]",
    },
    {
      label: "Solicitar Feedback (NPS)",
      icon: StarIcon,
      template: "Como estamos indo? Adoraríamos ouvir o seu feedback rápido sobre o nosso serviço: [LINK DA PESQUISA]",
    },
    {
      label: "Enviar Relatório de Resultados",
      icon: ChartBarLineIcon,
      template: "Aqui está o relatório de resultados deste mês com os principais indicadores! [LINK DO RELATÓRIO]",
    },
    {
      label: "Enviar Form de Briefing",
      icon: ClipboardIcon,
      template: "Para iniciarmos, por favor preencha este formulário rápido de briefing: [LINK DO BRIEFING]",
    },
    {
      label: "Atualizar Status do Projeto",
      icon: RefreshIcon,
      template: "Passando para atualizar o status do projeto! Estamos na fase [FASE] e a previsão de entrega é [DATA].",
    },
    {
      label: "Solicitar Aprovação de Material",
      icon: CheckmarkCircle02Icon,
      template: "O material está pronto! Dê uma olhada no anexo/link e nos avise se está aprovado. [LINK/ANEXO]",
    },
  ]

  const leadActions = [
    {
      label: "Qualificar Lead",
      icon: Search01Icon,
      template: "Olá! Para entender melhor o seu projeto e como podemos ajudar, poderia me contar um pouco mais sobre os seus objetivos?",
    },
    {
      label: "Enviar Apresentação (Pitch)",
      icon: Building03Icon,
      template: "Muito prazer! Somos a Kyper Agência. Segue a nossa apresentação completa explicando como atuamos: [LINK DA APRESENTAÇÃO]",
    },
    {
      label: "Agendar Call de Descoberta",
      icon: Calendar01Icon,
      template: "Vamos bater um papo rápido para entendermos melhor a sua necessidade? Agende um horário aqui: [LINK DA AGENDA]",
    },
    {
      label: "Ação: Tornar Cliente",
      icon: UserAdd01Icon,
      template: "Ótimo! Vamos dar andamento. Qual é o seu e-mail e CNPJ/CPF para fazermos o cadastro em nosso sistema?",
    },
  ]

  const actions = isClient ? clientActions : leadActions

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        disabled={disabled}
        render={
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl border-border/40 hover:bg-muted/30 p-0 text-amber-500 hover:text-amber-600 flex items-center justify-center transition-colors shadow-sm"
            title="Ações Rápidas do Chat"
          />
        }
      >
        <HugeiconsIcon icon={ZapIcon} className="size-4" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="w-72 p-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <DropdownMenuLabel className="px-2 pt-1 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          <span>Ações Rápidas</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[8px] tracking-widest ${isClient ? "bg-green-500/10 text-green-500 ring-1 ring-green-500/20" : "bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20"}`}>
            {isClient ? "CLIENTE" : "LEAD"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40 mb-2" />
        <DropdownMenuGroup className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
          {actions.map((action, i) => (
            <DropdownMenuItem
              key={i}
              onClick={() => onSelectAction(action.template)}
              className="px-2 py-2.5 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3 active:scale-[0.98]"
            >
              <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={action.icon} className="size-4 text-foreground/80" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
