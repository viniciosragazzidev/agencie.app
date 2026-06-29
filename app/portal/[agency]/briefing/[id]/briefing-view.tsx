"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ClipboardIcon,
  CheckmarkCircle02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  SaveMoneyDollarIcon,
  UserGroupIcon,
  TargetIcon,
  AlarmClockIcon,
  Image01Icon,
  NoteEditIcon,
  SearchAreaIcon,
  GlobeIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface BriefingData {
  id?: string
  projectName?: string | null
  businessGoal?: string | null
  targetAudience?: string | null
  targetAge?: string | null
  targetLocation?: string | null
  competitors?: string | null
  projectScope?: string | null
  estimatedBudget?: string | null
  desiredDeadline?: string | null
  visualReferences?: string | null
  additionalInfo?: string | null
  status?: string | null
}

interface BriefingViewProps {
  agencySlug: string
  clientId: string
  initialData: BriefingData | null
}

export default function BriefingView({ agencySlug, clientId, initialData }: BriefingViewProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const [projectName, setProjectName] = useState(initialData?.projectName || "")
  const [businessGoal, setBusinessGoal] = useState(initialData?.businessGoal || "")
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || "")
  const [targetAge, setTargetAge] = useState(initialData?.targetAge || "")
  const [targetLocation, setTargetLocation] = useState(initialData?.targetLocation || "")
  const [competitors, setCompetitors] = useState(initialData?.competitors || "")
  const [projectScope, setProjectScope] = useState(initialData?.projectScope || "")
  const [estimatedBudget, setEstimatedBudget] = useState(initialData?.estimatedBudget || "")
  const [desiredDeadline, setDesiredDeadline] = useState(initialData?.desiredDeadline || "")
  const [visualReferences, setVisualReferences] = useState(initialData?.visualReferences || "")
  const [additionalInfo, setAdditionalInfo] = useState(initialData?.additionalInfo || "")
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isSubmitted] = useState(initialData?.status === "submitted")

  useGSAP(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".stagger-in"),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: "cubic-bezier(0.32,0.72,0,1)",
        }
      )
    }
  }, { scope: containerRef })

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/client-portal/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          userId: "", // server resolves via authorization
          projectName,
          businessGoal,
          targetAudience,
          targetAge,
          targetLocation,
          competitors,
          projectScope,
          estimatedBudget,
          desiredDeadline,
          visualReferences,
          additionalInfo,
          submit: false,
        }),
      })
      if (res.ok) {
        toast.success("Briefing salvo como rascunho!")
      } else {
        const err = await res.json()
        toast.error(err.error || "Erro ao salvar briefing")
      }
    } catch {
      toast.error("Erro de conexão ao salvar briefing")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/client-portal/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          userId: "",
          projectName,
          businessGoal,
          targetAudience,
          targetAge,
          targetLocation,
          competitors,
          projectScope,
          estimatedBudget,
          desiredDeadline,
          visualReferences,
          additionalInfo,
          submit: true,
        }),
      })
      if (res.ok) {
        toast.success("Briefing enviado com sucesso! Sua agência será notificada.")
        router.push(`/portal/${agencySlug}/projetos`)
      } else {
        const err = await res.json()
        toast.error(err.error || "Erro ao enviar briefing")
      }
    } catch {
      toast.error("Erro de conexão ao enviar briefing")
    } finally {
      setSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div ref={containerRef} className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/portal/${agencySlug}/projetos`)}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors duration-300 stagger-in"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" strokeWidth={1.5} />
            Voltar para Projetos
          </button>
        </div>

        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[2rem] stagger-in">
          <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-8 md:p-12 text-center">
            <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-8 text-emerald-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-semibold text-foreground font-display mb-2">Briefing Enviado! 🎉</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Seu briefing de projeto foi recebido com sucesso. Nossa equipe já está analisando as informações
              e entraremos em contato em breve para alinhar os próximos passos.
            </p>
            <button
              onClick={() => router.push(`/portal/${agencySlug}/projetos`)}
              className="mt-6 bg-primary text-primary-foreground text-xs font-semibold h-9 px-5 rounded-xl active:scale-[0.98] transition-all duration-300"
            >
              Ir para meus projetos
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 stagger-in">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <HugeiconsIcon icon={ClipboardIcon} className="size-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground font-display leading-tight">Briefing do Projeto</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Preencha o máximo de informações para entendermos seu projeto
            </p>
          </div>
        </div>
        <span className="text-[9px] font-bold tracking-widest bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 rounded-full px-2 py-1 uppercase stagger-in">
          Rascunho
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section: Projeto */}
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] stagger-in">
          <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 space-y-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <HugeiconsIcon icon={TargetIcon} className="size-3.5" strokeWidth={1.5} />
              Sobre o Projeto
            </h3>
            <div className="grid gap-1.5">
              <Label text="Nome do Projeto" />
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex: Campanha de Lançamento, Site Institucional..."
                className="w-full h-9 bg-muted/10 border border-border/40 rounded-xl text-xs px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="grid gap-1.5">
              <Label text="Objetivo Principal do Negócio" />
              <textarea
                value={businessGoal}
                onChange={(e) => setBusinessGoal(e.target.value)}
                placeholder="Ex: Aumentar leads em 30%, melhorar reconhecimento de marca, vender 500 unidades no trimestre..."
                className="w-full bg-muted/10 border border-border/40 rounded-xl text-xs p-3 text-foreground h-20 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        {/* Section: Público */}
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] stagger-in">
          <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 space-y-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} className="size-3.5" strokeWidth={1.5} />
              Público-Alvo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label text="Descrição do Público" />
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: Donos de PME, Gestores de Marketing..."
                  className="w-full h-9 bg-muted/10 border border-border/40 rounded-xl text-xs px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="grid gap-1.5">
                <Label text="Faixa Etária" />
                <input
                  type="text"
                  value={targetAge}
                  onChange={(e) => setTargetAge(e.target.value)}
                  placeholder="Ex: 25-45 anos"
                  className="w-full h-9 bg-muted/10 border border-border/40 rounded-xl text-xs px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="grid gap-1.5">
                <Label text="Localização" />
                <input
                  type="text"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  placeholder="Ex: Brasil (Sudeste), São Paulo..."
                  className="w-full h-9 bg-muted/10 border border-border/40 rounded-xl text-xs px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label text="Principais Concorrentes" />
              <input
                type="text"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="Ex: Concorrente A, Concorrente B..."
                className="w-full h-9 bg-muted/10 border border-border/40 rounded-xl text-xs px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        {/* Section: Escopo */}
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] stagger-in">
          <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 space-y-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <HugeiconsIcon icon={SearchAreaIcon} className="size-3.5" strokeWidth={1.5} />
              Escopo e Entregas
            </h3>
            <div className="grid gap-1.5">
              <Label text="Escopo Detalhado do Projeto" />
              <textarea
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
                placeholder="Descreva em detalhes o que precisa ser feito: criação de artes, gestão de tráfego, desenvolvimento de site, produção de conteúdo, etc..."
                className="w-full bg-muted/10 border border-border/40 rounded-xl text-xs p-3 text-foreground h-24 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        {/* Section: Orçamento e Prazo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 stagger-in">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 space-y-3">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <HugeiconsIcon icon={SaveMoneyDollarIcon} className="size-3.5" strokeWidth={1.5} />
                Orçamento Estimado
              </h3>
              <div className="grid gap-1.5">
                <Label text="Qual o investimento previsto?" />
                <input
                  type="text"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  placeholder="Ex: R$ 5.000 - R$ 10.000/mês"
                  className="w-full h-9 bg-muted/10 border border-border/40 rounded-xl text-xs px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </div>
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 space-y-3">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <HugeiconsIcon icon={AlarmClockIcon} className="size-3.5" strokeWidth={1.5} />
                Prazo Desejado
              </h3>
              <div className="grid gap-1.5">
                <Label text="Quando precisa ficar pronto?" />
                <input
                  type="text"
                  value={desiredDeadline}
                  onChange={(e) => setDesiredDeadline(e.target.value)}
                  placeholder="Ex: 30 dias, até 15/08/2026..."
                  className="w-full h-9 bg-muted/10 border border-border/40 rounded-xl text-xs px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Referências */}
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] stagger-in">
          <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 space-y-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <HugeiconsIcon icon={Image01Icon} className="size-3.5" strokeWidth={1.5} />
              Referências Visuais
            </h3>
            <div className="grid gap-1.5">
              <Label text="Links de referência (inspiração, marcas, sites, artes)" />
              <textarea
                value={visualReferences}
                onChange={(e) => setVisualReferences(e.target.value)}
                placeholder="Cole links de sites, artes, marcas ou referências visuais que inspiram o projeto..."
                className="w-full bg-muted/10 border border-border/40 rounded-xl text-xs p-3 text-foreground h-16 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        {/* Section: Informações Adicionais */}
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] stagger-in">
          <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 space-y-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <HugeiconsIcon icon={NoteEditIcon} className="size-3.5" strokeWidth={1.5} />
              Informações Adicionais
            </h3>
            <div className="grid gap-1.5">
              <Label text="Algo mais que gostaria de compartilhar?" />
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Observações, dúvidas, ou qualquer informação extra que ache relevante..."
                className="w-full bg-muted/10 border border-border/40 rounded-xl text-xs p-3 text-foreground h-20 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 stagger-in">
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={GlobeIcon} className="size-4 text-muted-foreground/40" strokeWidth={1} />
            <span className="text-[9px] text-muted-foreground/60">
              Você pode salvar como rascunho e voltar depois
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="h-9 px-4 bg-muted/20 hover:bg-muted/30 border border-border/40 rounded-xl text-xs font-semibold text-foreground active:scale-[0.98] transition-all duration-300 flex items-center gap-1.5"
            >
              {saving ? "Salvando..." : "Salvar Rascunho"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold active:scale-[0.98] transition-all duration-300 flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Enviar Briefing"}
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Label({ text }: { text: string }) {
  return (
    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
      {text}
    </label>
  )
}
