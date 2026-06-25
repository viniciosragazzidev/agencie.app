"use client"

import React, { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LinkSquare02Icon,
  Copy01Icon,
  UserIcon,
  Mail01Icon,
  TelephoneIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Search01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

interface Client {
  id: string
  name: string
  industry?: string | null
  status: string
  mrr: string
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  document?: string | null
  portalEnabled: boolean
}

export default function PortalManagementPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: session } = authClient.useSession()
  const agencyUsername = session?.user?.username || ""

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients")
        if (res.ok) {
          const data = await res.json()
          setClients(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadClients()
  }, [])

  useGSAP(() => {
    if (!loading) {
      gsap.from(".portal-item", {
        y: 15,
        opacity: 0,
        duration: 0.8,
        stagger: 0.06,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        clearProps: "all",
      })
    }
  }, { dependencies: [loading], scope: containerRef })

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleTogglePortal = async (clientId: string, enabled: boolean) => {
    setTogglingId(clientId)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portalEnabled: enabled }),
      })
      if (res.ok) {
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, portalEnabled: enabled } : c))
        )
        triggerToast(enabled ? "Portal ativado!" : "Portal desativado!")
      } else {
        triggerToast("Erro ao atualizar portal.", "error")
      }
    } catch {
      triggerToast("Erro de conexão.", "error")
    } finally {
      setTogglingId(null)
    }
  }

  const handleCopyUrl = (username: string) => {
    const url = `${window.location.origin}/portal/${username}`
    navigator.clipboard.writeText(url)
    triggerToast("URL do portal copiada!")
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.contactName && c.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.contactEmail && c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const enabledCount = clients.filter((c) => c.portalEnabled).length

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 portal-item mb-6">
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">Portal do Cliente</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Gerencie o acesso dos clientes ao portal. Ative, desative e compartilhe o link de acesso.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2.5 py-1 uppercase">
              {enabledCount} {enabledCount === 1 ? "ativo" : "ativos"}
            </span>
          </div>
        </div>

        {/* Portal URL Card */}
        {agencyUsername && (
          <div className="double-bezel-card portal-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] mb-6">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 border border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <HugeiconsIcon icon={LinkSquare02Icon} className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">URL do Portal</p>
                    <p className="text-sm font-semibold text-foreground font-mono mt-0.5">
                      /portal/{agencyUsername}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCopyUrl(agencyUsername)}
                  variant="outline"
                  className="h-9 gap-1.5 text-xs active:scale-[0.97] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  <HugeiconsIcon icon={Copy01Icon} className="size-3.5" />
                  Copiar URL
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="portal-item mb-5">
          <div className="relative w-full max-w-sm">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-9 h-9 bg-muted/30 border-border/40 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 portal-item">
          {loading ? (
            <div className="col-span-full p-8 text-center text-muted-foreground text-xs">
              Carregando clientes...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed border-border/30 rounded-2xl bg-muted/5">
              <HugeiconsIcon icon={UserIcon} className="size-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground font-medium">
                {clients.length === 0
                  ? "Nenhum cliente cadastrado. Crie um cliente primeiro."
                  : "Nenhum cliente encontrado."}
              </p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem] transition-all hover:ring-primary/20"
              >
                <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 border border-border/20">
                  {/* Client Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">{client.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {client.industry || "Ramo não especificado"}
                      </p>
                    </div>
                    <span
                      className={`text-[8px] font-bold tracking-widest ring-1 rounded-full px-2 py-0.5 uppercase shrink-0 ${
                        client.status === "Ativo"
                          ? "bg-primary/10 text-primary ring-primary/20"
                          : client.status === "Em Risco"
                          ? "bg-destructive/10 text-destructive ring-destructive/20"
                          : "bg-secondary text-secondary-foreground ring-border/50"
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 mb-4">
                    {client.contactName && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <HugeiconsIcon icon={UserIcon} className="size-3 shrink-0" />
                        <span className="truncate">{client.contactName}</span>
                      </div>
                    )}
                    {client.contactEmail && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <HugeiconsIcon icon={Mail01Icon} className="size-3 shrink-0" />
                        <span className="truncate">{client.contactEmail}</span>
                      </div>
                    )}
                    {client.contactPhone && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <HugeiconsIcon icon={TelephoneIcon} className="size-3 shrink-0" />
                        <span className="truncate">{client.contactPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Document Warning */}
                  {!client.document && (
                    <div className="flex items-center gap-1.5 mb-3 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <HugeiconsIcon icon={Alert01Icon} className="size-3 text-amber-500 shrink-0" />
                      <p className="text-[9px] text-amber-500 font-medium">
                        CPF/CNPJ necessário para acesso ao portal
                      </p>
                    </div>
                  )}

                  {/* Portal Status & Toggle */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/20">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={client.portalEnabled ? CheckmarkCircle02Icon : Cancel01Icon}
                        className={`size-4 ${
                          client.portalEnabled ? "text-green-500" : "text-muted-foreground/50"
                        }`}
                      />
                      <span
                        className={`text-[9px] font-bold tracking-widest uppercase ${
                          client.portalEnabled ? "text-green-500" : "text-muted-foreground"
                        }`}
                      >
                        {client.portalEnabled ? "Portal Ativo" : "Portal Inativo"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {client.portalEnabled && (
                        <Button
                          onClick={() => handleCopyUrl(agencyUsername)}
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground active:scale-[0.97]"
                          title="Copiar URL do portal"
                        >
                          <HugeiconsIcon icon={Copy01Icon} className="size-3" />
                        </Button>
                      )}
                      <button
                        onClick={() => handleTogglePortal(client.id, !client.portalEnabled)}
                        disabled={togglingId === client.id}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          client.portalEnabled ? "bg-primary" : "bg-muted border border-border/60"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-lg ring-0 transition-transform duration-200 ease-in-out mt-0.5 ${
                            client.portalEnabled ? "bg-card translate-x-4 ml-0.5" : "bg-muted-foreground/40 translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-card/90 backdrop-blur-md ring-1 ring-border/50 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-sm">
            <div
              className={`size-2 rounded-full shrink-0 ${
                toast.type === "success"
                  ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                  : "bg-destructive shadow-[0_0_8px_rgba(var(--destructive),0.5)]"
              }`}
            />
            <span className="text-[11px] font-medium text-foreground">{toast.message}</span>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `,
        }}
      />
    </div>
  )
}
