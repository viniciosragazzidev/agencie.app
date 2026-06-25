"use client"

import React, { useRef, useState, useEffect } from "react"
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
  Menu01Icon,
  Cancel01Icon,
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
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo(
        ".quick-action-item",
        { y: 15, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: -0.04, ease: "cubic-bezier(0.32,0.72,0,1)" }
      )
    }
  }, { scope: containerRef, dependencies: [isOpen] })

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
    setIsOpen(false)
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
    setIsOpen(false)
  }

  const handlePortal = () => {
    window.open(`/client-portal/${client.id}`, "_blank")
    setIsOpen(false)
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
      onClick: () => { onGenerateProposal(); setIsOpen(false) },
      variant: "default" as const,
    },
    {
      id: "task",
      icon: Task01Icon,
      label: "Criar Tarefa",
      description: "Adicionar ao Kanban",
      onClick: () => { onCreateTask(); setIsOpen(false) },
      variant: "default" as const,
    },
    {
      id: "approval",
      icon: CheckmarkCircle02Icon,
      label: "Aprovação",
      description: "Solicitar aprovação",
      onClick: () => { onCreateApproval(); setIsOpen(false) },
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
      onClick: () => { onAddNote(); setIsOpen(false) },
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
      <div ref={containerRef} className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
        
        {/* Dropup Menu */}
        {isOpen && (
          <div 
            ref={menuRef}
            className="mb-4 flex flex-col gap-2 double-bezel-card bg-card/60 backdrop-blur-2xl ring-1 ring-border/50 p-2 rounded-[1.5rem] shadow-2xl origin-bottom"
          >
            {actions.map((action) => {
              const isPrimary = action.variant === "primary"
              const button = (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`quick-action-item group flex items-center justify-between gap-4 p-2.5 rounded-xl border transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer active:scale-[0.97] min-w-[200px] ${
                    isPrimary
                      ? "bg-emerald-500/5 border-emerald-500/15 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                      : "bg-background/40 border-transparent hover:bg-muted/50 hover:border-border/30"
                  } ${action.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  aria-label={action.label}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isPrimary
                          ? "size-8 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                          : "size-8 bg-primary/5 border border-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={action.icon}
                        strokeWidth={isPrimary ? 2 : 1.5}
                        className={`size-4 ${isPrimary ? "text-emerald-500" : "text-primary"}`}
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-semibold text-foreground leading-none">
                        {action.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground mt-0.5 leading-none font-medium">
                        {action.description}
                      </span>
                    </div>
                  </div>
                  
                  <div className="size-6 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                </button>
              )

              if (action.tooltip) {
                return (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="left" className="bg-card border border-border/40 text-foreground text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl mr-2">
                      {action.tooltip}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return button
            })}
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center size-14 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl active:scale-[0.95] z-50 ${
            isOpen 
              ? "bg-card border border-border/40 text-foreground rotate-90" 
              : "bg-primary border border-primary/20 text-primary-foreground hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]"
          }`}
        >
          <HugeiconsIcon 
            icon={isOpen ? Cancel01Icon : Menu01Icon} 
            className="size-6 transition-transform duration-500" 
            strokeWidth={1.5} 
          />
        </button>

      </div>
    </TooltipProvider>
  )
}
