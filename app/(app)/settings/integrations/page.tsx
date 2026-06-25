"use client"

import React, { useRef, useState, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import { Settings01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
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

  useGSAP(() => {
    gsap.from(".bento-item", {
      y: 16,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
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
  }, [])

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

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-auto bg-background">
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1200px] w-full mx-auto gap-8">

        {/* Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bento-item">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HugeiconsIcon icon={Settings01Icon} className="size-4 text-primary" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-display font-semibold tracking-tight">Integrações de Canal</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              Conecte seus canais de atendimento. Cada canal é isolado por conta — seus dados nunca se misturam.
            </p>
          </div>

          {/* Status geral */}
          <div className="flex items-center gap-2">
            {integrations.filter((i) => i.status === "active").length > 0 && (
              <div className="flex items-center gap-1.5 bg-green-500/10 ring-1 ring-green-500/20 rounded-xl px-3 py-1.5">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5 text-green-500" strokeWidth={1.5} />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                  {integrations.filter((i) => i.status === "active").length} canal
                  {integrations.filter((i) => i.status === "active").length > 1 ? "is" : ""} ativo
                  {integrations.filter((i) => i.status === "active").length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Cards dos canais */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 bento-item">
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

        {/* Informações de segurança */}
        <section className="bento-item">
          <div className="bg-muted/10 ring-1 ring-border/30 p-1.5 rounded-[1.25rem]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.25rem-0.375rem)] p-5">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
                Segurança & Privacidade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Isolamento por conta",
                    desc: "Cada usuário tem sua própria sessão isolada. Nenhum chat ou mensagem é compartilhado entre contas diferentes.",
                  },
                  {
                    title: "Dados no seu servidor",
                    desc: "O WhatsApp roda via OpenWA no seu próprio Docker. Mensagens são armazenadas no seu PostgreSQL.",
                  },
                  {
                    title: "Webhook seguro",
                    desc: "Todos os eventos recebidos são validados com assinatura HMAC SHA-256 antes de serem processados.",
                  },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-bold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
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
        description="Deseja desconectar esta integração? Suas conversas históricas serão mantidas, mas você deixará de receber novas mensagens por este canal."
        confirmText="Desconectar"
        cancelText="Cancelar"
        onConfirm={executeDisconnect}
        variant="destructive"
      />
    </div>
  )
}
