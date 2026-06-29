"use client"

import React, { useRef, useState, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings02Icon,
  CheckmarkCircle02Icon,
  Building01Icon,
  ColorPickerIcon,
  FileAttachmentIcon,
  GlobeIcon,
  Loading01Icon
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface AgencySettings {
  id?: string
  agencyName?: string | null
  agencyLogo?: string | null
  agencySlogan?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  cnpj?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  defaultContractTemplate?: string | null
  contractFooter?: string | null
  portalWelcomeMessage?: string | null
  portalPrimaryAction?: string | null
}

export default function AgencySettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [settings, setSettings] = useState<AgencySettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<"identity" | "brand" | "legal" | "contracts" | "portal">("identity")

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

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/agency-settings")
      if (res.ok) {
        const data = await res.json()
        if (data) setSettings(data)
      }
    } catch {
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/agency-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        toast.success("Configurações salvas!")
      } else {
        toast.error("Erro ao salvar")
      }
    } catch {
      toast.error("Erro de conexão")
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof AgencySettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const sections = [
    { id: "identity" as const, label: "Identidade", icon: Building01Icon },
    { id: "brand" as const, label: "Cores", icon: ColorPickerIcon },
    { id: "legal" as const, label: "Jurídico", icon: FileAttachmentIcon },
    { id: "contracts" as const, label: "Contratos", icon: FileAttachmentIcon },
    { id: "portal" as const, label: "Portal", icon: GlobeIcon },
  ]

  if (loading) {
    return (
      <div className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-auto bg-background">
        <main className="flex-1 flex flex-col p-4 md:p-6 max-w-[1100px] w-full mx-auto gap-4">
          <div className="animate-pulse space-y-2">
            <div className="h-5 w-36 bg-muted/50 rounded" />
            <div className="h-2.5 w-72 bg-muted/50 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-auto bg-background">
      <main className="flex-1 flex flex-col p-4 md:p-6 max-w-[1100px] w-full mx-auto gap-4">

        {/* Header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 bento-item">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HugeiconsIcon icon={Settings02Icon} className="size-3 text-primary" strokeWidth={1.5} />
              </div>
              <h1 className="text-xs font-heading font-semibold">Configurações da Agência</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Personalize a identidade, documentos e portal do cliente.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-7 px-3 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg transition-all active:scale-[0.98] uppercase tracking-wider flex items-center gap-1.5"
          >
            {saving ? (
              <HugeiconsIcon icon={Loading01Icon} className="size-3 animate-spin" strokeWidth={1.5} />
            ) : (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={1.5} />
            )}
            Salvar
          </button>
        </section>

        {/* Section Tabs */}
        <section className="bento-item">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {sections.map(sec => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeSection === sec.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50 hover:text-muted-foreground"
                }`}
              >
                <HugeiconsIcon icon={sec.icon} className="size-2.5" strokeWidth={1.5} />
                {sec.label}
              </button>
            ))}
          </div>
        </section>

        {/* Identity Section */}
        {activeSection === "identity" && (
          <section className="bento-item">
            <div className="bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1rem-0.25rem)] p-3 space-y-3">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  Identidade da Agência
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Nome da Agência
                    </label>
                    <input
                      type="text"
                      value={settings.agencyName || ""}
                      onChange={(e) => updateField("agencyName", e.target.value)}
                      placeholder="Sua Agência"
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Slogan
                    </label>
                    <input
                      type="text"
                      value={settings.agencySlogan || ""}
                      onChange={(e) => updateField("agencySlogan", e.target.value)}
                      placeholder="Sua tagline aqui"
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Logo URL
                    </label>
                    <input
                      type="text"
                      value={settings.agencyLogo || ""}
                      onChange={(e) => updateField("agencyLogo", e.target.value)}
                      placeholder="https://exemplo.com/logo.png"
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                {settings.agencyLogo && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 ring-1 ring-border/30">
                    <img
                      src={settings.agencyLogo}
                      alt="Logo da agência"
                      className="h-6 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground/50">Preview</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Brand Colors Section */}
        {activeSection === "brand" && (
          <section className="bento-item">
            <div className="bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1rem-0.25rem)] p-3 space-y-3">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  Cores da Marca
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {[
                    { field: "primaryColor" as const, label: "Principal", desc: "Headings, botões" },
                    { field: "secondaryColor" as const, label: "Secundária", desc: "Textos auxiliares" },
                    { field: "accentColor" as const, label: "Destaque", desc: "Links, badges" },
                  ].map(({ field, label, desc }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        {label}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={settings[field] || "#111827"}
                          onChange={(e) => updateField(field, e.target.value)}
                          className="size-7 rounded-lg border border-border/40 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings[field] || ""}
                          onChange={(e) => updateField(field, e.target.value)}
                          placeholder="#111827"
                          className="flex-1 h-7 px-2 text-[10px] rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground/40">{desc}</p>
                    </div>
                  ))}
                </div>
                {/* Preview */}
                <div className="p-2.5 rounded-lg bg-muted/20 ring-1 ring-border/30 space-y-2">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50">Preview</p>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-6 px-2.5 rounded-lg flex items-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: settings.primaryColor || "#111827" }}
                    >
                      Primária
                    </div>
                    <div
                      className="h-6 px-2.5 rounded-lg flex items-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: settings.secondaryColor || "#6b7280" }}
                    >
                      Secundária
                    </div>
                    <div
                      className="h-6 px-2.5 rounded-lg flex items-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: settings.accentColor || "#3b82f6" }}
                    >
                      Destaque
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Legal Data Section */}
        {activeSection === "legal" && (
          <section className="bento-item">
            <div className="bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1rem-0.25rem)] p-3 space-y-3">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  Dados Jurídicos
                </h3>
                <p className="text-[10px] text-muted-foreground/40">
                  Aparecem nos contratos e documentos gerados.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">CNPJ</label>
                    <input
                      type="text"
                      value={settings.cnpj || ""}
                      onChange={(e) => updateField("cnpj", e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Telefone</label>
                    <input
                      type="text"
                      value={settings.phone || ""}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Email</label>
                    <input
                      type="email"
                      value={settings.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="contato@agencia.com"
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Website</label>
                    <input
                      type="text"
                      value={settings.website || ""}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://agencia.com"
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Endereço</label>
                    <input
                      type="text"
                      value={settings.address || ""}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Contracts Section */}
        {activeSection === "contracts" && (
          <section className="bento-item">
            <div className="bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1rem-0.25rem)] p-3 space-y-3">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  Configurações de Contrato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Template Padrão
                    </label>
                    <select
                      value={settings.defaultContractTemplate || "prestacao_servicos"}
                      onChange={(e) => updateField("defaultContractTemplate", e.target.value)}
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="prestacao_servicos">Prestação de Serviços</option>
                      <option value="nda">NDA (Confidencialidade)</option>
                      <option value="aditivo">Aditivo Contratual</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    Rodapé dos Contratos
                  </label>
                  <textarea
                    value={settings.contractFooter || ""}
                    onChange={(e) => updateField("contractFooter", e.target.value)}
                    placeholder="Texto que aparece no rodapé de todos os contratos..."
                    rows={3}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Portal Section */}
        {activeSection === "portal" && (
          <section className="bento-item">
            <div className="bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1rem-0.25rem)] p-3 space-y-3">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  Portal do Cliente
                </h3>
                <p className="text-[10px] text-muted-foreground/40">
                  Personalize a experiência do cliente no portal.
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Mensagem de Boas-vindas
                    </label>
                    <textarea
                      value={settings.portalWelcomeMessage || ""}
                      onChange={(e) => updateField("portalWelcomeMessage", e.target.value)}
                      placeholder="Bem-vindo ao portal da nossa agência!"
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Texto do Botão Principal
                    </label>
                    <input
                      type="text"
                      value={settings.portalPrimaryAction || ""}
                      onChange={(e) => updateField("portalPrimaryAction", e.target.value)}
                      placeholder="Acessar Projetos"
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
