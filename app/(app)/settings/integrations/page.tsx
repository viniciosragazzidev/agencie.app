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
  Delete01Icon,
  Shield01Icon,
  Key01Icon,
  GlobeIcon,
} from "@hugeicons/core-free-icons"
import { IntegrationCard } from "@/components/integrations/IntegrationCard"
import { WppConnectModal } from "@/components/integrations/WppConnectModal"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SettingsSection } from "@/components/settings"

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
    if (loading) return

    gsap.fromTo(
      ".integrations-header",
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "cubic-bezier(0.32,0.72,0,1)",
      }
    )
    gsap.fromTo(
      ".integrations-section",
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        delay: 0.1,
      }
    )
  }, { scope: containerRef, dependencies: [loading] })

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

  const activeCount = integrations.filter((i) => i.status === "active").length

  const securityItems = [
    {
      title: "Isolamento por conta",
      desc: "Cada usuário tem sua própria sessão isolada.",
      icon: Shield01Icon,
    },
    {
      title: "Dados no seu servidor",
      desc: "O WhatsApp roda via Docker. Mensagens no seu PostgreSQL.",
      icon: GlobeIcon,
    },
    {
      title: "Webhook seguro",
      desc: "Eventos validados com assinatura HMAC SHA-256.",
      icon: Key01Icon,
    },
  ]

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-auto bg-background">
      <main className="flex-1 flex flex-col p-4 md:p-5 lg:p-6 max-w-[1100px] w-full mx-auto space-y-6">

        {/* Header */}
        <div className="integrations-header">
          <h1 className="text-lg font-heading font-semibold">
            Integrações
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Conecte seus canais de atendimento e ferramentas externas
          </p>
        </div>

        {/* Channel Integrations */}
        <SettingsSection
          title="Canais de Atendimento"
          description="Cada canal é isolado por conta. Conecte e gerencie seus canais de comunicação."
        >
          <div className="integrations-section grid grid-cols-1 md:grid-cols-3 gap-3">
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
          </div>

          {activeCount > 0 && (
            <div className="integrations-section flex items-center gap-1.5 mt-3">
              <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
              <span className="text-[9px] font-bold tracking-widest text-green-500 uppercase">
                {activeCount} canal{activeCount > 1 ? "is" : ""} ativo{activeCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </SettingsSection>

        {/* Google Calendar */}
        <div className="integrations-section">
          <SettingsSection
            title="Google Calendar"
            description="Sincronize reuniões e prazos diretamente no seu calendário"
          >
            <div className="card-modern hover-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2 ${calendarStatus.connected ? "bg-blue-500/10" : "bg-muted/50"}`}>
                    <HugeiconsIcon
                      icon={GoogleIcon}
                      strokeWidth={1.5}
                      className={`h-4 w-4 ${calendarStatus.connected ? "text-blue-500" : "text-muted-foreground/50"}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-heading font-semibold text-foreground">
                        Google Calendar
                      </p>
                      {calendarStatus.connected && (
                        <span className="text-[9px] font-bold tracking-widest bg-green-500/10 text-green-500 rounded-full px-2 py-0.5 uppercase">
                          Ativo
                        </span>
                      )}
                      {calendarLoading && (
                        <span className="text-[9px] font-bold tracking-widest bg-muted text-muted-foreground/50 rounded-full px-2 py-0.5 uppercase">
                          Carregando
                        </span>
                      )}
                    </div>
                    {calendarStatus.connected && calendarStatus.email && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {calendarStatus.email}
                      </p>
                    )}
                  </div>
                </div>

                {calendarStatus.connected && (
                  <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)] mt-1" />
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                {!calendarStatus.connected && !calendarLoading && (
                  <button
                    onClick={handleCalendarConnect}
                    className="flex-1 h-7 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg transition-all active:scale-[0.98] uppercase tracking-wider"
                  >
                    Conectar Google Calendar
                  </button>
                )}

                {calendarLoading && (
                  <div className="flex-1 h-7 bg-muted/30 text-muted-foreground/50 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <HugeiconsIcon icon={Loading01Icon} className="size-2.5 animate-spin" strokeWidth={1.5} />
                    Carregando...
                  </div>
                )}

                {calendarStatus.connected && (
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="flex-1 h-7 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={1.5} />
                      Conectado
                    </div>
                    <button
                      onClick={handleCalendarDisconnect}
                      disabled={calendarDisconnecting}
                      className="h-7 w-7 flex items-center justify-center bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors active:scale-[0.98]"
                      title="Desconectar"
                    >
                      <HugeiconsIcon icon={calendarDisconnecting ? Loading01Icon : Delete01Icon} className={`size-3 ${calendarDisconnecting ? "animate-spin" : ""}`} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* Security */}
        <div className="integrations-section">
          <SettingsSection
            title="Segurança & Privacidade"
            description="Suas integrações são protegidas com isolamento e criptografia"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {securityItems.map((item, i) => (
                <div key={i} className="card-modern">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 shrink-0">
                      <HugeiconsIcon icon={item.icon} strokeWidth={1.5} className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-heading font-semibold text-foreground">{item.title}</p>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SettingsSection>
        </div>

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
