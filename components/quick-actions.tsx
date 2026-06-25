"use client"

import React, { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Message01Icon,
  SparklesIcon,
  Task01Icon,
  CheckmarkCircle02Icon,
  LinkSquare02Icon,
  NoteIcon,
  Copy01Icon,
} from "@hugeicons/core-free-icons"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface QuickActionsProps {
  client: {
    id: string
    name: string
    contactName?: string | null
    contactPhone?: string | null
    contactEmail?: string | null
    mrr: string
    industry?: string | null
    status: string
  }
  onGenerateProposal: () => void
  onCreateTask: () => void
  onCreateApproval: () => void
  onAddNote: () => void
  onToast: (message: string, type?: "success" | "error") => void
}

export function QuickActions({
  client,
  onGenerateProposal,
  onCreateTask,
  onCreateApproval,
  onAddNote,
  onToast,
}: QuickActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.from(".quick-action-item", {
      y: 10,
      opacity: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      clearProps: "all",
    })
  }, { scope: containerRef })

  const handleWhatsApp = () => {
    if (!client.contactPhone) {
      onToast("Telefone do cliente não cadastrado.", "error")
      return
    }
    const phone = client.contactPhone.replace(/\D/g, "")
    const greeting =
      client.status === "Em Risco"
        ? `Gostaria de alinhar alguns pontos importantes sobre sua conta.`
        : `Espero que esteja tudo bem! Passando para alinhar andamento dos projetos.`
    const message = encodeURIComponent(
      `Olá ${client.contactName || client.name}! Aqui é da Kyper. ${greeting}`
    )
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank")
  }

  const handleCopyData = () => {
    const text = [
      `Cliente: ${client.name}`,
      `Ramo: ${client.industry || "Não informado"}`,
      `Contato: ${client.contactName || "Não informado"}`,
      `Telefone: ${client.contactPhone || "Não informado"}`,
      `Email: ${client.contactEmail || "Não informado"}`,
      `MRR: R$ ${parseFloat(client.mrr || "0").toLocaleString()}`,
      `Status: ${client.status}`,
    ].join("\n")
    navigator.clipboard.writeText(text)
    onToast("Dados do cliente copiados!")
  }

  const handlePortal = () => {
    window.open(`/client-portal/${client.id}`, "_blank")
  }

  const hasPhone = !!client.contactPhone

  const actions = [
    {
      id: "whatsapp",
      icon: Message01Icon,
      label: "WhatsApp",
      description: "Conversa direta",
      onClick: handleWhatsApp,
      variant: "primary" as const,
      disabled: false,
      tooltip: hasPhone ? undefined : "Telefone não cadastrado",
    },
    {
      id: "proposal",
      icon: SparklesIcon,
      label: "Proposta IA",
      description: "Gerar proposta",
      onClick: onGenerateProposal,
      variant: "default" as const,
    },
    {
      id: "task",
      icon: Task01Icon,
      label: "Criar Tarefa",
      description: "Adicionar ao Kanban",
      onClick: onCreateTask,
      variant: "default" as const,
    },
    {
      id: "approval",
      icon: CheckmarkCircle02Icon,
      label: "Aprovação",
      description: "Solicitar aprovação",
      onClick: onCreateApproval,
      variant: "default" as const,
    },
    {
      id: "portal",
      icon: LinkSquare02Icon,
      label: "Portal",
      description: "Ver como cliente",
      onClick: handlePortal,
      variant: "default" as const,
    },
    {
      id: "note",
      icon: NoteIcon,
      label: "Nota Rápida",
      description: "Salvar contexto",
      onClick: onAddNote,
      variant: "default" as const,
    },
    {
      id: "copy",
      icon: Copy01Icon,
      label: "Copiar Dados",
      description: "Área de transferência",
      onClick: handleCopyData,
      variant: "default" as const,
    },
  ]

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="bento-detail-item px-6 py-3 shrink-0"
      >
        <div className="grid grid-cols-7 gap-3 max-lg:grid-cols-4 max-md:grid-cols-1 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:gap-3 max-md:pb-1">
          {actions.map((action) => {
            const isPrimary = action.variant === "primary"
            const button = (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`quick-action-item group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.97] shrink-0 min-w-[80px] max-md:snap-start ${
                  isPrimary
                    ? "bg-emerald-500/5 border-emerald-500/15 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                    : "bg-card border-border/30 hover:bg-muted/50 hover:border-primary/20"
                } ${action.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                aria-label={action.label}
              >
                <div
                  className={`rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isPrimary
                      ? "size-10 bg-emerald-500/10 border border-emerald-500/20"
                      : "size-9 bg-primary/5 border border-primary/10"
                  }`}
                >
                  <HugeiconsIcon
                    icon={action.icon}
                    strokeWidth={1.5}
                    className={`size-4 ${isPrimary ? "text-emerald-500" : "text-primary"}`}
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-semibold text-foreground leading-none">
                    {action.label}
                  </span>
                  <span className="text-[8px] text-muted-foreground/60 text-center leading-tight hidden max-lg:block">
                    {action.description}
                  </span>
                </div>
              </button>
            )

            if (action.tooltip) {
              return (
                <Tooltip key={action.id}>
                  <TooltipTrigger render={button} />
                  <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl">
                    {action.tooltip}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return button
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
