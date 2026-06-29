"use client"

import React from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
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
  onSelectAction: (actionId: string) => void
  disabled?: boolean
}

export function QuickChatActions({ isClient, onSelectAction, disabled }: QuickChatActionsProps) {
  const clientActions = [
    {
      label: "Enviar Proposta Comercial",
      icon: File01Icon,
      actionId: "send_proposal",
    },
    {
      label: "Enviar Serviços e Preços",
      icon: CheckmarkBadge01Icon,
      actionId: "send_services",
    },
    {
      label: "Enviar Contrato em PDF",
      icon: File01Icon,
      actionId: "send_contract",
    },
    {
      label: "Solicitar Pagamento",
      icon: Invoice01Icon,
      actionId: "request_payment",
    },
    {
      label: "Agendar Reunião / Call",
      icon: Calendar01Icon,
      actionId: "schedule_meeting",
    },
    {
      label: "Solicitar Feedback (NPS)",
      icon: StarIcon,
      actionId: "request_feedback",
    },
    {
      label: "Enviar Relatório de Resultados",
      icon: ChartBarLineIcon,
      actionId: "send_report",
    },
    {
      label: "Enviar Form de Briefing",
      icon: ClipboardIcon,
      actionId: "send_briefing",
    },
    {
      label: "Atualizar Status do Projeto",
      icon: RefreshIcon,
      actionId: "update_status",
    },
    {
      label: "Solicitar Aprovação de Material",
      icon: CheckmarkCircle02Icon,
      actionId: "request_approval",
    },
  ]

  const leadActions = [
    {
      label: "Qualificar Lead",
      icon: Search01Icon,
      actionId: "qualify_lead",
    },
    {
      label: "Enviar Apresentação (Pitch)",
      icon: Building03Icon,
      actionId: "send_pitch",
    },
    {
      label: "Agendar Call de Descoberta",
      icon: Calendar01Icon,
      actionId: "schedule_discovery",
    },
    {
      label: "Ação: Tornar Cliente",
      icon: UserAdd01Icon,
      actionId: "convert_client",
    },
  ]

  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (open && containerRef.current) {
      gsap.fromTo(
        ".quick-action-item",
        { opacity: 0, y: 15, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.03,
          ease: "back.out(1.2)",
        }
      )
    }
  }, { dependencies: [open], scope: containerRef })

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
        className="w-72 p-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl"
      >
        <DropdownMenuGroup ref={containerRef}>
          <DropdownMenuLabel className="px-2 pt-1 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Ações Rápidas</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[8px] tracking-widest ${isClient ? "bg-green-500/10 text-green-500 ring-1 ring-green-500/20" : "bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20"}`}>
              {isClient ? "CLIENTE" : "LEAD"}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/40 mb-2" />
          <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
            {(isClient ? clientActions : leadActions).map((action, i) => (
              <DropdownMenuItem
                key={i}
                onClick={() => {
                  setOpen(false)
                  onSelectAction(action.actionId)
                }}
                className="quick-action-item px-2 py-2.5 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3 active:scale-[0.98]"
              >
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={action.icon} className="size-4 text-foreground/80" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
