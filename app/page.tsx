"use client"

import { useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChartUpIcon,
  Message01Icon,
  Search01Icon,
  ContactBookIcon,
  CpuIcon,
  Layers01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: ContactBookIcon,
    title: "CRM Inteligente",
    description:
      "Organize seus clientes, acompanhe o ciclo de vida e identifique riscos de churn antes que acontecam.",
    span: "md:col-span-7",
    accent: true,
  },
  {
    icon: Message01Icon,
    title: "Inbox Omnichannel",
    description:
      "WhatsApp, Instagram, Web Chat. Todas as conversas em um único lugar com respostas assistidas por IA.",
    span: "md:col-span-5",
    accent: false,
  },
  {
    icon: Search01Icon,
    title: "Prospecção com IA",
    description:
      "Encontre leads qualificados automaticamente. A IA analisa o nicho e gera mensagens personalizadas.",
    span: "md:col-span-5",
    accent: false,
  },
  {
    icon: Layers01Icon,
    title: "Gestão de Projetos",
    description:
      "Kanban visual, tarefas por cliente, acompanhamento de entrega em tempo real.",
    span: "md:col-span-7",
    accent: false,
  },
  {
    icon: CpuIcon,
    title: "Assistente RAG",
    description:
      "Treine um assistente com a knowledge base da sua agência. Respostas precisas, sem alucinações.",
    span: "md:col-span-4",
    accent: false,
  },
  {
    icon: ChartUpIcon,
    title: "Dashboards Acionáveis",
    description:
      "MRR, LTV/CAC, pipeline de leads, conversão. Números que importam, sem ruído.",
    span: "md:col-span-8",
    accent: true,
  },
]

const pricingPlans = [
  {
    name: "Starter",
    price: "Grátis",
    priceSub: "para sempre",
    description: "Para agências que estão começando a organizar seus processos.",
    features: [
      "Até 10 clientes",
      "Inbox omnichannel",
      "Dashboard básico",
      "Suporte via chat",
    ],
    cta: "Começar Grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 97",
    priceSub: "/mês por usuário",
    description: "Para agências que querem escalar com inteligência.",
    features: [
      "Clientes ilimitados",
      "Prospecção com IA",
      "Assistente RAG",
      "Propostas automatizadas",
      "Kanban avançado",
      "Relatórios exportáveis",
      "Suporte prioritário",
    ],
    cta: "Ativar Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    priceSub: "",
    description: "Para agências com operação complexa e múltiplas equipes.",
    features: [
      "Tudo do Pro",
      "Multi-workspace",
      "API completa",
      "SSO / SAML",
      "SLA dedicado",
      "Onboarding personalizado",
    ],
    cta: "Falar com Vendas",
    highlighted: false,
  },
]

const stats = [
  { value: "2.4x", label: "mais retenção de clientes" },
  { value: "35%", label: "menos churn em 90 dias" },
  { value: "12h", label: "economizadas por semana" },
  { value: "98%", label: "de satisfação dos usuários" },
]

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from(".lp-hero-text", {
        opacity: 0,
        y: 20,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
      })

      gsap.from(".lp-hero-visual", {
        opacity: 0,
        scale: 0.96,
        y: 10,
        duration: 1.1,
        delay: 0.3,
        ease: "power3.out",
      })

      gsap.from(".lp-stat", {
        opacity: 0,
        y: 16,
        duration: 0.6,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".lp-stats-trigger",
          start: "top 85%",
          once: true,
        },
      })

      gsap.from(".lp-feature-card", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".lp-features-trigger",
          start: "top 80%",
          once: true,
        },
      })

      gsap.from(".lp-pricing-card", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".lp-pricing-trigger",
          start: "top 80%",
          once: true,
        },
      })

      gsap.from(".lp-cta-inner", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".lp-cta-section",
          start: "top 85%",
          once: true,
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="min-h-[100dvh] bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="absolute inset-0 border-b border-white/[0.06] pointer-events-none" />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <span className="text-xs font-bold text-primary-foreground">A</span>
            </div>
            <span className="font-display text-sm font-semibold tracking-tight">
              Agencie
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-xs font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              Funcionalidades
            </a>
            <a
              href="#pricing"
              className="text-xs font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              Preços
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-medium active:scale-[0.98] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="text-xs font-medium active:scale-[0.98] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                Começar Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Split Screen */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          {/* Left: Copy */}
          <div>
            <p className="lp-hero-text mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Gerenciamento para Agências
            </p>
            <h1 className="lp-hero-text font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl lg:text-[3.4rem]">
              Pare de perder clientes
              <br />
              <span className="text-muted-foreground/60">por falta de organização.</span>
            </h1>
            <p className="lp-hero-text mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              CRM, inbox omnichannel, prospecção com IA e dashboards em um só lugar.
              Feito para agências que querem crescer sem caos.
            </p>

            <div className="lp-hero-text mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 text-sm font-medium active:scale-[0.98] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  Começar Grátis
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-sm font-medium active:scale-[0.98] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  Ver Demo
                </Button>
              </Link>
            </div>

            <div className="lp-hero-text mt-6 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="size-3.5 text-primary" />
                Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="size-3.5 text-primary" />
                Setup em 5 minutos
              </span>
            </div>
          </div>

          {/* Right: Visual — Double-Bezel Architecture */}
          <div className="lp-hero-visual">
            <div className="rounded-[1.5rem] bg-muted/10 p-1.5 ring-1 ring-border/50 shadow-2xl shadow-black/5">
              <div className="rounded-[calc(1.5rem-0.375rem)] bg-card p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                {/* Browser chrome */}
                <div className="mb-4 flex items-center gap-2 border-b border-border/40 pb-3">
                  <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-muted-foreground/15" />
                    <div className="size-2.5 rounded-full bg-muted-foreground/15" />
                    <div className="size-2.5 rounded-full bg-muted-foreground/15" />
                  </div>
                  <div className="ml-2 flex-1 rounded-md bg-muted/40 px-2.5 py-1 text-[9px] font-mono text-muted-foreground/70">
                    app.agencie.app/dashboard
                  </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "MRR", value: "R$ 142k", delta: "+12%" },
                    { label: "Conversão", value: "18.4%", delta: "+2.1%" },
                    { label: "LTV/CAC", value: "4.2x", delta: "Saudável" },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-xl bg-muted/40 p-3"
                    >
                      <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {kpi.label}
                      </p>
                      <p className="mt-1 font-display text-sm font-medium tracking-tight">
                        {kpi.value}
                      </p>
                      <p className="mt-0.5 text-[8px] font-medium text-primary/80">
                        {kpi.delta}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pipeline */}
                <div className="mt-3 rounded-xl bg-muted/40 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Pipeline de Leads
                    </p>
                    <span className="text-[8px] font-medium text-primary">
                      Ver todos
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    {[
                      { name: "EcoLogistics Tech", status: "Reunião", color: "bg-primary" },
                      { name: "Vox Digital Agency", status: "Proposta", color: "bg-muted-foreground/40" },
                      { name: "Meridian SaaS", status: "Qualificação", color: "bg-primary/60" },
                    ].map((lead, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-background/50 px-2.5 py-2"
                      >
                        <span className="text-[9px] font-medium">{lead.name}</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`size-1.5 rounded-full ${lead.color}`} />
                          <span className="text-[8px] text-muted-foreground/70">
                            {lead.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="lp-stats-trigger border-y border-border/40 bg-muted/20">
        <div className="mx-auto grid max-w-6xl grid-cols-2 px-6 py-10 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="lp-stat px-4 py-2 text-center">
              <p className="font-display text-2xl font-medium tracking-tight md:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — Asymmetric Bento Grid (no 3-col equal) */}
      <section id="features" className="lp-features-trigger mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-12 max-w-lg">
          <h2 className="font-display text-2xl font-medium tracking-tight md:text-3xl">
            Tudo que sua agência precisa,
            <br />
            <span className="text-muted-foreground/60">num só lugar.</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Chega de planilhas, WhatsApp bagunçado e dashboard genérico. A Agencie
            foi desenhada do zero para o fluxo de trabalho de agências digitais.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`lp-feature-card group rounded-2xl border border-border/50 bg-card p-6 transition-colors duration-500 hover:bg-muted/30 ${feature.span}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 transition-colors duration-500 group-hover:bg-muted">
                  <HugeiconsIcon
                    icon={feature.icon}
                    strokeWidth={1.5}
                    className="size-5 text-muted-foreground"
                  />
                </div>
                <div>
                  <h3 className="font-display text-sm font-medium tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground max-w-[42ch]">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing — Asymmetric Layout */}
      <section id="pricing" className="lp-pricing-trigger mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-12 max-w-lg">
          <h2 className="font-display text-2xl font-medium tracking-tight md:text-3xl">
            Simples e transparente.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Comece grátis. Escale quando estiver pronto.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          {/* Starter — 4 cols */}
          <div className="lp-pricing-card md:col-span-4 rounded-2xl border border-border/50 bg-card p-6 flex flex-col">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Starter
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-medium tracking-tight">
                  Grátis
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Para agências que estão começando a organizar seus processos.
              </p>
            </div>

            <ul className="mt-6 flex-1 space-y-2.5">
              {["Até 10 clientes", "Inbox omnichannel", "Dashboard básico", "Suporte via chat"].map(
                (feature, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                )
              )}
            </ul>

            <div className="mt-8">
              <Link href="/register" className="block">
                <Button
                  variant="outline"
                  className="w-full text-xs font-medium active:scale-[0.98] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  size="lg"
                >
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>

          {/* Pro — 4 cols, highlighted */}
          <div className="lp-pricing-card md:col-span-4 relative rounded-2xl border border-primary/40 bg-card p-6 flex flex-col shadow-lg shadow-primary/5">
            <span className="absolute -top-2.5 left-6 rounded-full bg-primary px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
              Mais Popular
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Pro
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-medium tracking-tight">
                  R$ 97
                </span>
                <span className="text-xs text-muted-foreground">
                  /mês por usuário
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Para agências que querem escalar com inteligência.
              </p>
            </div>

            <ul className="mt-6 flex-1 space-y-2.5">
              {[
                "Clientes ilimitados",
                "Prospecção com IA",
                "Assistente RAG",
                "Propostas automatizadas",
                "Kanban avançado",
                "Relatórios exportáveis",
                "Suporte prioritário",
              ].map((feature, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/register" className="block">
                <Button
                  className="w-full text-xs font-medium active:scale-[0.98] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  size="lg"
                >
                  Ativar Pro
                </Button>
              </Link>
            </div>
          </div>

          {/* Enterprise — 4 cols */}
          <div className="lp-pricing-card md:col-span-4 rounded-2xl border border-border/50 bg-card p-6 flex flex-col">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Enterprise
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-medium tracking-tight">
                  Sob consulta
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Para agências com operação complexa e múltiplas equipes.
              </p>
            </div>

            <ul className="mt-6 flex-1 space-y-2.5">
              {[
                "Tudo do Pro",
                "Multi-workspace",
                "API completa",
                "SSO / SAML",
                "SLA dedicado",
                "Onboarding personalizado",
              ].map((feature, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/register" className="block">
                <Button
                  variant="outline"
                  className="w-full text-xs font-medium active:scale-[0.98] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  size="lg"
                >
                  Falar com Vendas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="lp-cta-section border-t border-border/40 bg-muted/20">
        <div className="lp-cta-inner mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <h2 className="font-display text-2xl font-medium tracking-tight md:text-3xl">
            Pronto para organizar sua agência?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Crie sua conta gratuita em menos de 2 minutos. Sem cartão, sem
            compromisso.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 text-sm font-medium active:scale-[0.98] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                Começar Agora
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <span className="text-[8px] font-bold text-primary-foreground">
                A
              </span>
            </div>
            <span className="font-display text-xs font-medium tracking-tight">
              Agencie
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            © 2026 Agencie.app. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors duration-300">
              Termos
            </a>
            <a href="#" className="hover:text-foreground transition-colors duration-300">
              Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
