"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
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
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    badgeColor: "bg-green-500",
    connectLabel: "Conectar WhatsApp",
    description: "Receba e envie mensagens do WhatsApp diretamente no Inbox",
  },
  instagram: {
    label: "Instagram",
    letter: "I",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-500",
    badgeColor: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
    connectLabel: "Conectar Instagram",
    description: "Responda DMs do Instagram sem sair da plataforma",
  },
  facebook: {
    label: "Facebook",
    letter: "F",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    badgeColor: "bg-blue-600",
    connectLabel: "Conectar Facebook",
    description: "Gerencie mensagens do Messenger e páginas do Facebook",
  },
}

export function IntegrationCard({ channel, integration, onConnect, onDisconnect, comingSoon }: IntegrationCardProps) {
  const cfg = CHANNEL_CONFIG[channel]
  const isActive = integration?.status === "active"
  const isPending = integration?.status === "qr_pending" || integration?.status === "connecting"

  return (
    <div className="card-modern hover-lift">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2 ${isActive ? cfg.iconBg : "bg-muted/50"}`}>
            <span className={`text-xs font-bold ${isActive ? cfg.iconColor : "text-muted-foreground/50"}`}>
              {cfg.letter}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-heading font-semibold text-foreground">{cfg.label}</p>
              {isActive && (
                <span className="text-[9px] font-bold tracking-widest bg-green-500/10 text-green-500 rounded-full px-2 py-0.5 uppercase">
                  Ativo
                </span>
              )}
              {isPending && (
                <span className="text-[9px] font-bold tracking-widest bg-yellow-500/10 text-yellow-500 rounded-full px-2 py-0.5 uppercase">
                  Aguardando
                </span>
              )}
              {integration?.status === "error" && (
                <span className="text-[9px] font-bold tracking-widest bg-destructive/10 text-destructive rounded-full px-2 py-0.5 uppercase">
                  Erro
                </span>
              )}
              {comingSoon && (
                <span className="text-[9px] font-bold tracking-widest bg-muted text-muted-foreground/50 rounded-full px-2 py-0.5 uppercase">
                  Em breve
                </span>
              )}
            </div>
            {isActive && integration?.accountName && (
              <p className="text-[9px] text-muted-foreground mt-0.5">{integration.accountName}</p>
            )}
          </div>
        </div>

        {isActive && (
          <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)] mt-1" />
        )}
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground leading-relaxed mt-3">{cfg.description}</p>

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-3">
        {!integration && !comingSoon && (
          <button
            onClick={onConnect}
            className="flex-1 h-7 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg transition-all active:scale-[0.98] uppercase tracking-wider"
          >
            {cfg.connectLabel}
          </button>
        )}

        {comingSoon && (
          <div className="flex-1 h-7 bg-muted/30 text-muted-foreground/50 text-[10px] font-bold rounded-lg flex items-center justify-center uppercase tracking-wider cursor-not-allowed opacity-50">
            Em breve
          </div>
        )}

        {isPending && (
          <button
            onClick={onConnect}
            className="flex-1 h-7 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
          >
            <HugeiconsIcon icon={Loading03Icon} className="size-2.5 animate-spin" strokeWidth={1.5} />
            Aguardando QR Code...
          </button>
        )}

        {isActive && (
          <div className="flex-1 flex items-center gap-1.5">
            <div className="flex-1 h-7 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={1.5} />
              Conectado
            </div>
            {onDisconnect && (
              <button
                onClick={() => onDisconnect(integration!.id)}
                className="h-7 w-7 flex items-center justify-center bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors active:scale-[0.98]"
                title="Desconectar"
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-3" strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}

        {integration?.status === "error" && (
          <button
            onClick={onConnect}
            className="flex-1 h-7 bg-destructive/10 hover:bg-destructive/20 text-destructive text-[10px] font-bold rounded-lg transition-all active:scale-[0.98]"
          >
            Reconectar
          </button>
        )}
      </div>
    </div>
  )
}
