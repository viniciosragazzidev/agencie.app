"use client"

import React, { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Loading03Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

type IntegrationStatus = "disconnected" | "connecting" | "qr_pending" | "active" | "error"

interface ChannelIntegration {
  id: string
  channel: "whatsapp" | "instagram" | "facebook"
  status: IntegrationStatus
  accountName?: string | null
  accountAvatar?: string | null
  externalId: string
  createdAt: string
}

interface IntegrationCardProps {
  channel: "whatsapp" | "instagram" | "facebook"
  integration?: ChannelIntegration | null
  onConnect: () => void
  onDisconnect?: (id: string) => void
  comingSoon?: boolean
}

const CHANNEL_CONFIG = {
  whatsapp: {
    label: "WhatsApp",
    letter: "W",
    activeColor: "text-green-500 bg-green-500/10 ring-green-500/20",
    badgeColor: "bg-green-500",
    connectLabel: "Conectar WhatsApp",
    description: "Receba e envie mensagens do WhatsApp diretamente no Inbox",
  },
  instagram: {
    label: "Instagram",
    letter: "I",
    activeColor: "text-pink-500 bg-pink-500/10 ring-pink-500/20",
    badgeColor: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
    connectLabel: "Conectar Instagram",
    description: "Responda DMs do Instagram sem sair da plataforma",
  },
  facebook: {
    label: "Facebook",
    letter: "F",
    activeColor: "text-blue-500 bg-blue-500/10 ring-blue-500/20",
    badgeColor: "bg-blue-600",
    connectLabel: "Conectar Facebook",
    description: "Gerencie mensagens do Messenger e páginas do Facebook",
  },
}

export function IntegrationCard({ channel, integration, onConnect, onDisconnect, comingSoon }: IntegrationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const cfg = CHANNEL_CONFIG[channel]
  const isActive = integration?.status === "active"
  const isPending = integration?.status === "qr_pending" || integration?.status === "connecting"

  useGSAP(() => {
    gsap.from(cardRef.current, {
      y: 12,
      opacity: 0,
      duration: 0.6,
      ease: "cubic-bezier(0.32,0.72,0,1)",
    })
  }, { scope: cardRef })

  return (
    <div ref={cardRef} className="bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.25rem]">
      <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.25rem-0.375rem)] p-5 space-y-4">

        {/* Header do card */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl ring-1 flex items-center justify-center text-base font-bold ${isActive ? cfg.activeColor : "bg-muted/50 text-muted-foreground ring-border/30"}`}>
              {cfg.letter}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground">{cfg.label}</h3>
                {isActive && (
                  <span className="text-[9px] font-bold tracking-widest bg-green-500/10 text-green-500 ring-1 ring-green-500/20 rounded-full px-2 py-0.5 uppercase">
                    Ativo
                  </span>
                )}
                {isPending && (
                  <span className="text-[9px] font-bold tracking-widest bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/20 rounded-full px-2 py-0.5 uppercase">
                    Aguardando
                  </span>
                )}
                {integration?.status === "error" && (
                  <span className="text-[9px] font-bold tracking-widest bg-destructive/10 text-destructive ring-1 ring-destructive/20 rounded-full px-2 py-0.5 uppercase">
                    Erro
                  </span>
                )}
                {comingSoon && (
                  <span className="text-[9px] font-bold tracking-widest bg-muted text-muted-foreground ring-1 ring-border/30 rounded-full px-2 py-0.5 uppercase">
                    Em breve
                  </span>
                )}
              </div>
              {isActive && integration?.accountName && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{integration.accountName}</p>
              )}
            </div>
          </div>

          {isActive && (
            <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] mt-1" />
          )}
        </div>

        {/* Descrição */}
        <p className="text-[10px] text-muted-foreground leading-relaxed">{cfg.description}</p>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {!integration && !comingSoon && (
            <button
              onClick={onConnect}
              className="flex-1 h-9 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider"
            >
              {cfg.connectLabel}
            </button>
          )}

          {comingSoon && (
            <div className="flex-1 h-9 bg-muted/30 text-muted-foreground text-[10px] font-bold rounded-xl flex items-center justify-center uppercase tracking-wider cursor-not-allowed opacity-50">
              Em breve
            </div>
          )}

          {isPending && (
            <button
              onClick={onConnect}
              className="flex-1 h-9 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <HugeiconsIcon icon={Loading03Icon} className="size-3 animate-spin" strokeWidth={1.5} />
              Aguardando QR Code...
            </button>
          )}

          {isActive && (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-9 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" strokeWidth={1.5} />
                Conectado
              </div>
              {onDisconnect && (
                <button
                  onClick={() => onDisconnect(integration!.id)}
                  className="h-9 w-9 flex items-center justify-center bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-xl transition-colors active:scale-[0.98]"
                  title="Desconectar"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}

          {integration?.status === "error" && (
            <button
              onClick={onConnect}
              className="flex-1 h-9 bg-destructive/10 hover:bg-destructive/20 text-destructive text-[10px] font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              Reconectar
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
