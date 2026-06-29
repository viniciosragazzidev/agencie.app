"use client"

import React, { useRef, useState, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings02Icon,
  CheckmarkCircle02Icon,
  GoogleIcon,
  Loading01Icon,
  Delete01Icon
} from "@hugeicons/core-free-icons"
import { IntegrationCard } from "@/components/integrations/IntegrationCard"
import { WppConnectModal } from "@/components/integrations/WppConnectModal"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface ChannelIntegration {
  id: string
  channel: "whatsapp" | "instagram" | "facebook"
  status: "disconnected" | "connecting" | "qr_pending" | "active" | "error"
  accountName?: string | null
  externalId: string
  createdAt: string
}

export default function IntegrationsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [integrations, setIntegrations] = useState<ChannelIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [wppModalOpen, setWppModalOpen] = useState(false)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; email?: string; name?: string }>({ connected: false })
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [calendarDisconnecting, setCalendarDisconnecting] = useState(false)

  useGSAP(() => {
    gsap.from(".bento-item", {
      y: 12,
      opacity: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      clearProps: "all",
    })
  }, { scope: containerRef })

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/integrations")
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } catch {
      toast.error("Erro ao carregar integrações")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntegrations()
    fetchCalendarStatus()
  }, [])

  const fetchCalendarStatus = async () => {
    try {
      const res = await fetch("/api/calendar/status")
      const data = await res.json()
      setCalendarStatus(data)
    } catch {
      toast.error("Erro ao verificar status do calendário")
    } finally {
      setCalendarLoading(false)
    }
  }

  const getIntegration = (channel: string) =>
    integrations.find((i) => i.channel === channel) || null

  const handleDisconnect = (id: string) => {
    setDisconnectingId(id)
  }

  const executeDisconnect = async () => {
    if (!disconnectingId) return
    const id = disconnectingId
    try {
      await fetch(`/api/integrations/${id}`, { method: "DELETE" })
      toast.success("Integração desconectada")
      setIntegrations((prev) => prev.filter((i) => i.id !== id))
    } catch {
      toast.error("Erro ao desconectar")
    }
  }

  const handleWppConnected = (data: { phoneNumber: string; name: string }) => {
    toast.success(`WhatsApp conectado — ${data.name || data.phoneNumber}`)
    setWppModalOpen(false)
    fetchIntegrations()
  }

  const handleCalendarConnect = async () => {
    try {
      const res = await fetch("/api/calendar/auth?returnUrl=/settings/integrations")
      const data = await res.json()
      if (data.url) {
        window.open(data.url, "_blank")
      }
    } catch {
      toast.error("Erro ao iniciar conexão com Google Calendar")
    }
  }

  const handleCalendarDisconnect = async () => {
    setCalendarDisconnecting(true)
    try {
      await fetch("/api/calendar/disconnect", { method: "POST" })
      toast.success("Google Calendar desconectado")
      setCalendarStatus({ connected: false })
    } catch {
      toast.error("Erro ao desconectar Google Calendar")
    } finally {
      setCalendarDisconnecting(false)
    }
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-auto bg-background">
      <main className="flex-1 flex flex-col p-4 md:p-6 max-w-[1100px] w-full mx-auto gap-4">

        {/* Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 bento-item">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HugeiconsIcon icon={Settings02Icon} className="size-3.5 text-primary" strokeWidth={1.5} />
              </div>
              <h1 className="text-xs font-display font-semibold tracking-tight">Integrações de Canal</h1>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">
              Conecte seus canais de atendimento. Cada canal é isolado por conta.
            </p>
          </div>

          {/* Status geral */}
          <div className="flex items-center gap-2">
            {integrations.filter((i) => i.status === "active").length > 0 && (
              <div className="flex items-center gap-1.5 bg-green-500/10 ring-1 ring-green-500/20 rounded-lg px-2.5 py-1">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-green-500" strokeWidth={1.5} />
                <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
                  {integrations.filter((i) => i.status === "active").length} canal
                  {integrations.filter((i) => i.status === "active").length > 1 ? "is" : ""} ativo
                  {integrations.filter((i) => i.status === "active").length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Cards dos canais */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 bento-item">
          <IntegrationCard
            channel="whatsapp"
            integration={getIntegration("whatsapp")}
            onConnect={() => setWppModalOpen(true)}
            onDisconnect={handleDisconnect}
          />
          <IntegrationCard
            channel="instagram"
            integration={null}
            onConnect={() => {}}
            comingSoon
          />
          <IntegrationCard
            channel="facebook"
            integration={null}
            onConnect={() => {}}
            comingSoon
          />
        </section>

        {/* Google Calendar Integration */}
        <section className="bento-item">
          <div className="bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1rem-0.25rem)] p-3 space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`size-9 rounded-lg ring-1 flex items-center justify-center ${calendarStatus.connected ? "text-blue-500 bg-blue-500/10 ring-blue-500/20" : "bg-muted/50 text-muted-foreground/50 ring-border/30"}`}>
                    <HugeiconsIcon icon={GoogleIcon} className="size-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-foreground/90">Google Calendar</h3>
                      {calendarStatus.connected && (
                        <span className="text-xs font-bold tracking-widest bg-green-500/10 text-green-500 ring-1 ring-green-500/20 rounded-full px-1.5 py-px uppercase">
                          Ativo
                        </span>
                      )}
                      {calendarLoading && (
                        <span className="text-xs font-bold tracking-widest bg-muted text-muted-foreground/50 ring-1 ring-border/30 rounded-full px-1.5 py-px uppercase">
                          Carregando
                        </span>
                      )}
                    </div>
                    {calendarStatus.connected && calendarStatus.email && (
                      <p className="text-xs text-muted-foreground/50 mt-0.5">{calendarStatus.email}</p>
                    )}
                  </div>
                </div>
                {calendarStatus.connected && (
                  <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)] mt-1" />
                )}
              </div>

              <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                Sincronize reuniões e prazos diretamente no seu calendário.
              </p>

              <div className="flex items-center gap-2">
                {!calendarStatus.connected && !calendarLoading && (
                  <button
                    onClick={handleCalendarConnect}
                    className="flex-1 h-8 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all active:scale-[0.98] uppercase tracking-wider"
                  >
                    Conectar Google Calendar
                  </button>
                )}

                {calendarLoading && (
                  <div className="flex-1 h-8 bg-muted/30 text-muted-foreground/50 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <HugeiconsIcon icon={Loading01Icon} className="size-2.5 animate-spin" strokeWidth={1.5} />
                    Carregando...
                  </div>
                )}

                {calendarStatus.connected && (
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="flex-1 h-8 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={1.5} />
                      Conectado
                    </div>
                    <button
                      onClick={handleCalendarDisconnect}
                      disabled={calendarDisconnecting}
                      className="h-8 w-8 flex items-center justify-center bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors active:scale-[0.98]"
                      title="Desconectar"
                    >
                      <HugeiconsIcon icon={calendarDisconnecting ? Loading01Icon : Delete01Icon} className={`size-3 ${calendarDisconnecting ? "animate-spin" : ""}`} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Informações de segurança */}
        <section className="bento-item">
          <div className="bg-muted/10 ring-1 ring-border/30 p-1 rounded-xl">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1rem-0.25rem)] p-4">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-2">
                Segurança & Privacidade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    title: "Isolamento por conta",
                    desc: "Cada usuário tem sua própria sessão isolada.",
                  },
                  {
                    title: "Dados no seu servidor",
                    desc: "O WhatsApp roda via Docker. Mensagens no seu PostgreSQL.",
                  },
                  {
                    title: "Webhook seguro",
                    desc: "Eventos validados com assinatura HMAC SHA-256.",
                  },
                ].map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-[10px] font-bold text-foreground/80">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      <WppConnectModal
        isOpen={wppModalOpen}
        onClose={() => setWppModalOpen(false)}
        onConnected={handleWppConnected}
      />

      <ConfirmDialog
        open={!!disconnectingId}
        onOpenChange={(open) => !open && setDisconnectingId(null)}
        title="Desconectar integração"
        description="Deseja desconectar esta integração? Suas conversas históricas serão mantidas."
        confirmText="Desconectar"
        cancelText="Cancelar"
        onConfirm={executeDisconnect}
        variant="destructive"
      />
    </div>
  )
}
