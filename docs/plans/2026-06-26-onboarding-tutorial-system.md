# Agencie.App — Onboarding & Tutorial Interativo Revolucionario

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar um sistema de onboarding e tutorial interativo que transforma o primeiro contato do usuário em uma experiência mágica, guiada e memorável — com animações cinematográficas, micro-interações de Design Spells, e um fluxo que ensina sem parecer um tutorial.

**Architecture:** Sistema em 3 camadas: (1) Setup Wizard pós-registro com 5 steps de configuração da agência, (2) Tutorial interativo com spotlight/highlight que guia o usuário pelas features principais usando GSAP ScrollTrigger e animações de reveal, (3) Contextual Help persistente com tooltips e checklist vivente. Tudo construído com GSAP (já instalado), Hugeicons, e o padrão double-bezel-card do projeto.

**Tech Stack:** Next.js App Router, TypeScript, GSAP 3.15 + @gsap/react, Tailwind CSS 4, Hugeicons, better-auth, Drizzle ORM, PostgreSQL, Sonner (toasts), shadcn/ui base components.

**Design System References:**
- @design-taste-frontend: VISUAL_DENSITY=4, MOTION_INTENSITY=8, DESIGN_VARIANCE=8
- @gpt-taste: AIDA structure, GSAP ScrollTrigger, card stacking, scrubbing reveals
- @design-spells: Magnetic hover, physics-based interactions, fluid transitions
- @product-manager-toolkit: Funnel Analysis (Acquisition → Activation → Retention)

---

## Product Context

### North Star Metric
**Activation Rate**: % de novos usuários que completam o setup wizard E criam pelo menos 1 cliente + 1 serviço nos primeiros 7 dias.

### Funnel
```
Register → Setup Wizard (5 steps) → Dashboard Tour (6 highlights) → First Client → First Service → First Contract → Activated
```

### Success Criteria
- Setup wizard completion rate > 70%
- Time to first client < 5 minutes
- Tutorial engagement > 60% (users interact with ≥3 highlights)
- 7-day retention > 50%

---

## System Overview — 3 Layers

### Layer 1: Setup Wizard (pós-registro)
Fluxo fullscreen com 5 steps de configuração da agência. Cada step é um card double-bezel com animação de entrada GSAP stagger. O wizard só aparece uma vez (flag `onboardingCompleted` no user).

### Layer 2: Dashboard Tour (tutorial interativo)
Spotlight overlay que destaca 6 elementos do dashboard com tooltips animados. Usa GSAP para magnetic pull, scale reveals, e text scramble effects. O usuário pode pular a qualquer momento.

### Layer 3: Contextual Help (permanente)
- Checklist flutuante (QuickActions pattern) que mostra progresso do setup
- Tooltips contextuais em elementos não configurados
- Badge "Novo" em features não exploradas
- Easter egg: konami code que ativa modo "turbo tour"

---

## Task 1: Database Schema — Onboarding State

**Files:**
- Modify: `lib/db/schema.ts` — add fields to user table
- Create: `scripts/migrate-onboarding.ts` — migration script

**Step 1: Add onboarding fields to user schema**

In `lib/db/schema.ts`, add to the user table definition:

```typescript
// Add these fields to the user table
onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
onboardingStep: integer("onboarding_step").default(0).notNull(),
setupProgress: jsonb("setup_progress").$type<{
  agencyConfigured: boolean
  firstClientCreated: boolean
  firstServiceCreated: boolean
  integrationConnected: boolean
  contractGenerated: boolean
}>().default({
  agencyConfigured: false,
  firstClientCreated: false,
  firstServiceCreated: false,
  integrationConnected: false,
  contractGenerated: false
}),
tutorialCompleted: boolean("tutorial_completed").default(false).notNull(),
lastLoginAt: timestamp("last_login_at"),
loginCount: integer("login_count").default(0).notNull(),
```

**Step 2: Create migration script**

Create `scripts/migrate-onboarding.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { sql } from "drizzle-orm"

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

async function migrate() {
  console.log("Running onboarding migration...")
  
  await db.execute(sql`
    ALTER TABLE "user" 
    ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS "setup_progress" jsonb DEFAULT '{"agencyConfigured":false,"firstClientCreated":false,"firstServiceCreated":false,"integrationConnected":false,"contractGenerated":false}'::jsonb,
    ADD COLUMN IF NOT EXISTS "tutorial_completed" boolean DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS "last_login_at" timestamp,
    ADD COLUMN IF NOT EXISTS "login_count" integer DEFAULT 0 NOT NULL
  `)
  
  console.log("Migration complete!")
  process.exit(0)
}

migrate().catch((e) => {
  console.error("Migration failed:", e)
  process.exit(1)
})
```

**Step 3: Run migration**

```bash
npx tsx scripts/migrate-onboarding.ts
```

**Step 4: Add API route for onboarding state**

Create `app/api/onboarding/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [userData] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  return NextResponse.json({
    onboardingCompleted: userData?.onboardingCompleted ?? false,
    onboardingStep: userData?.onboardingStep ?? 0,
    setupProgress: userData?.setupProgress ?? {
      agencyConfigured: false,
      firstClientCreated: false,
      firstServiceCreated: false,
      integrationConnected: false,
      contractGenerated: false
    },
    tutorialCompleted: userData?.tutorialCompleted ?? false,
    loginCount: userData?.loginCount ?? 0
  })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  
  await db
    .update(user)
    .set({
      ...(body.onboardingCompleted !== undefined && { onboardingCompleted: body.onboardingCompleted }),
      ...(body.onboardingStep !== undefined && { onboardingStep: body.onboardingStep }),
      ...(body.setupProgress !== undefined && { setupProgress: body.setupProgress }),
      ...(body.tutorialCompleted !== undefined && { tutorialCompleted: body.tutorialCompleted }),
      ...(body.lastLoginAt !== undefined && { lastLoginAt: body.lastLoginAt }),
      ...(body.loginCount !== undefined && { loginCount: body.loginCount })
    })
    .where(eq(user.id, session.user.id))

  return NextResponse.json({ ok: true })
}
```

**Step 5: Commit**

```bash
git add lib/db/schema.ts scripts/migrate-onboarding.ts app/api/onboarding/route.ts
git commit -m "feat: add onboarding state schema and API"
```

---

## Task 2: Setup Wizard — Core Component

**Files:**
- Create: `components/onboarding/setup-wizard.tsx` — main wizard component
- Create: `components/onboarding/step-indicator.tsx` — step progress dots
- Create: `components/onboarding/wizard-step.tsx` — individual step wrapper

**Step 1: Create step indicator component**

Create `components/onboarding/step-indicator.tsx`:

```typescript
"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: { label: string; icon: React.ReactNode }[]
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    dotsRef.current.forEach((dot, i) => {
      if (!dot) return
      if (i < currentStep) {
        gsap.to(dot, {
          scale: 1,
          backgroundColor: "var(--primary)",
          duration: 0.4,
          ease: "back.out(2)"
        })
      } else if (i === currentStep) {
        gsap.to(dot, {
          scale: 1.3,
          backgroundColor: "var(--primary)",
          duration: 0.4,
          ease: "elastic.out(1, 0.5)"
        })
      } else {
        gsap.to(dot, {
          scale: 1,
          backgroundColor: "var(--muted)",
          duration: 0.3,
          ease: "power2.out"
        })
      }
    })
  }, [currentStep])

  return (
    <div ref={containerRef} className="flex items-center gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            ref={(el) => { dotsRef.current[i] = el }}
            className="relative flex items-center justify-center"
          >
            <div className={`size-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              i < currentStep
                ? "bg-primary text-primary-foreground"
                : i === currentStep
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
            }`}>
              {i < currentStep ? (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-[10px] font-bold">{i + 1}</span>
              )}
            </div>
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${
              i < currentStep ? "bg-primary" : "bg-muted"
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Create wizard step wrapper**

Create `components/onboarding/wizard-step.tsx`:

```typescript
"use client"

import React, { useRef, useEffect, ReactNode } from "react"
import { gsap } from "gsap"

interface WizardStepProps {
  children: ReactNode
  isActive: boolean
  direction: "next" | "prev"
}

export function WizardStep({ children, isActive, direction }: WizardStepProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    
    const xStart = direction === "next" ? 60 : -60
    
    if (isActive) {
      gsap.fromTo(ref.current, 
        { opacity: 0, x: xStart, scale: 0.98 },
        { 
          opacity: 1, x: 0, scale: 1,
          duration: 0.6,
          ease: "cubic-bezier(0.32, 0.72, 0, 1)"
        }
      )
    } else {
      gsap.set(ref.current, { opacity: 0, x: -xStart, scale: 0.98 })
    }
  }, [isActive, direction])

  if (!isActive) return null

  return (
    <div ref={ref} className="w-full">
      {children}
    </div>
  )
}
```

**Step 3: Create main setup wizard**

Create `components/onboarding/setup-wizard.tsx`:

```typescript
"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building01Icon,
  UserAdd01Icon,
  Briefcase01Icon,
  PlugIcon,
  File01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Loading01Icon
} from "@hugeicons/core-free-icons"
import { StepIndicator } from "./step-indicator"
import { WizardStep } from "./wizard-step"
import { toast } from "sonner"

interface SetupWizardProps {
  onComplete: () => void
  userId: string
}

const WIZARD_STEPS = [
  {
    label: "Agência",
    icon: Building01Icon,
    title: "Configure sua Agência",
    description: "Personalize o nome, logo e identidade da sua agência."
  },
  {
    label: "Cliente",
    icon: UserAdd01Icon,
    title: "Adicione seu Primeiro Cliente",
    description: "Cadastre um cliente para começar a gerenciar projetos."
  },
  {
    label: "Serviço",
    icon: Briefcase01Icon,
    title: "Defina seus Serviços",
    description: "Crie pelo menos um serviço para enviar propostas."
  },
  {
    label: "Canal",
    icon: PlugIcon,
    title: "Conecte um Canal",
    description: "Integre WhatsApp ou Instagram para receber mensagens."
  },
  {
    label: "Contrato",
    icon: File01Icon,
    title: "Gere seu Primeiro Contrato",
    description: "Crie um contrato para enviar ao cliente assinar."
  }
]

export function SetupWizard({ onComplete, userId }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({
    agencyConfigured: false,
    firstClientCreated: false,
    firstServiceCreated: false,
    integrationConnected: false,
    contractGenerated: false
  })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Fetch current progress
  useEffect(() => {
    fetch("/api/onboarding")
      .then(r => r.json())
      .then(data => {
        if (data.setupProgress) setProgress(data.setupProgress)
      })
      .catch(() => {})
  }, [])

  // Entrance animation
  useGSAP(() => {
    if (!overlayRef.current || !contentRef.current) return
    
    const tl = gsap.timeline()
    
    tl.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" }
    )
    .fromTo(contentRef.current,
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "cubic-bezier(0.32, 0.72, 0, 1)" },
      "-=0.2"
    )
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setDirection("next")
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection("prev")
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(async () => {
    setLoading(true)
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true })
      })
      
      gsap.to([overlayRef.current, contentRef.current], {
        opacity: 0,
        scale: 0.95,
        y: -20,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => onComplete()
      })
    } catch {
      toast.error("Erro ao finalizar onboarding")
    } finally {
      setLoading(false)
    }
  }, [onComplete])

  const handleComplete = useCallback(async () => {
    setLoading(true)
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          onboardingCompleted: true,
          setupProgress: progress
        })
      })
      
      gsap.to([overlayRef.current, contentRef.current], {
        opacity: 0,
        scale: 0.95,
        y: -20,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => onComplete()
      })
    } catch {
      toast.error("Erro ao finalizar onboarding")
    } finally {
      setLoading(false)
    }
  }, [onComplete, progress])

  const progressValues = Object.values(progress)
  const completedSteps = progressValues.filter(Boolean).length
  const isLastStep = currentStep === WIZARD_STEPS.length - 1

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Content */}
      <div 
        ref={contentRef}
        className="relative w-full max-w-lg mx-4"
      >
        {/* Double bezel card */}
        <div className="bg-muted/20 ring-1 ring-border/50 p-1.5 rounded-2xl shadow-2xl">
          <div className="bg-card rounded-[calc(1rem-0.375rem)] p-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-display font-semibold text-foreground">
                  Configuração Inicial
                </h2>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                  Passo {currentStep + 1} de {WIZARD_STEPS.length}
                </p>
              </div>
              <button
                onClick={handleSkip}
                disabled={loading}
                className="text-[9px] font-bold text-muted-foreground/50 hover:text-muted-foreground uppercase tracking-wider transition-colors"
              >
                Pular
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex justify-center">
              <StepIndicator
                currentStep={currentStep}
                totalSteps={WIZARD_STEPS.length}
                steps={WIZARD_STEPS}
              />
            </div>

            {/* Step Content */}
            <div className="min-h-[280px]">
              {WIZARD_STEPS.map((step, i) => (
                <WizardStep key={i} isActive={i === currentStep} direction={direction}>
                  <div className="space-y-4">
                    {/* Step Icon */}
                    <div className="flex justify-center">
                      <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <HugeiconsIcon 
                          icon={step.icon} 
                          className="size-7 text-primary" 
                          strokeWidth={1.5} 
                        />
                      </div>
                    </div>
                    
                    {/* Step Title */}
                    <div className="text-center">
                      <h3 className="text-base font-display font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {step.description}
                      </p>
                    </div>

                    {/* Step Content Placeholder */}
                    <div className="bg-muted/20 rounded-xl p-4 ring-1 ring-border/30">
                      <p className="text-[10px] text-muted-foreground/50 text-center">
                        Conteúdo do passo {i + 1} será implementado aqui
                      </p>
                    </div>

                    {/* Status */}
                    {progressValues[i] && (
                      <div className="flex items-center gap-2 justify-center">
                        <HugeiconsIcon 
                          icon={CheckmarkCircle02Icon} 
                          className="size-3.5 text-green-500" 
                          strokeWidth={1.5} 
                        />
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">
                          Concluído
                        </span>
                      </div>
                    )}
                  </div>
                </WizardStep>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0 || loading}
                className="h-8 px-3 text-[9px] font-bold text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-30 uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3" strokeWidth={1.5} />
                Voltar
              </button>

              {isLastStep ? (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="h-8 px-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-lg transition-all active:scale-[0.98] uppercase tracking-wider flex items-center gap-1.5"
                >
                  {loading ? (
                    <HugeiconsIcon icon={Loading01Icon} className="size-3 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={1.5} />
                  )}
                  Finalizar
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="h-8 px-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-lg transition-all active:scale-[0.98] uppercase tracking-wider flex items-center gap-1.5"
                >
                  Próximo
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] text-muted-foreground/40">
                <span>Progresso do setup</span>
                <span>{completedSteps}/{WIZARD_STEPS.length} passos</span>
              </div>
              <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(completedSteps / WIZARD_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add components/onboarding/
git commit -m "feat: setup wizard core component with GSAP animations"
```

---

## Task 3: Dashboard Tour — Spotlight Overlay

**Files:**
- Create: `components/onboarding/tour-overlay.tsx` — spotlight overlay
- Create: `components/onboarding/tour-tooltip.tsx` — animated tooltip
- Create: `components/onboarding/tour-step.tsx` — step definition types

**Step 1: Create tour step types**

Create `components/onboarding/tour-step.ts`:

```typescript
export interface TourStep {
  id: string
  target: string // CSS selector
  title: string
  description: string
  position: "top" | "bottom" | "left" | "right"
  icon?: string
  action?: {
    label: string
    href: string
  }
}

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: "sidebar",
    target: "[data-tour='sidebar']",
    title: "Navegação Principal",
    description: "Aqui fica todo o menu de navegação. Clique em qualquer item para acessar as funcionalidades.",
    position: "right"
  },
  {
    id: "dashboard",
    target: "[data-tour='dashboard-kpis']",
    title: "Seus KPIs em Tempo Real",
    description: "Acompanhe MRR, clientes ativos, taxa de conversão e satisfação atualizados em tempo real.",
    position: "bottom"
  },
  {
    id: "inbox",
    target: "[data-tour='inbox-link']",
    title: "Caixa de Entrada Unificada",
    description: "Todas as mensagens dos seus canais (WhatsApp, Instagram, Web) em um só lugar.",
    position: "right",
    action: { label: "Ver Inbox", href: "/inbox" }
  },
  {
    id: "clients",
    target: "[data-tour='clients-link']",
    title: "CRM de Clientes",
    description: "Gerencie todos os seus clientes, contratos, tarefas e aprovações em um painel completo.",
    position: "right",
    action: { label: "Ver Clientes", href: "/clients" }
  },
  {
    id: "quick-actions",
    target: "[data-tour='quick-actions']",
    title: "Ações Rápidas",
    description: "Botão mágico para criar propostas, contratos, agendar reuniões e muito mais com um clique.",
    position: "left"
  },
  {
    id: "settings",
    target: "[data-tour='settings-link']",
    title: "Configurações da Agência",
    description: "Personalize sua marca, dados jurídicos, integrações e portal do cliente.",
    position: "right",
    action: { label: "Configurar", href: "/settings/agency" }
  }
]
```

**Step 2: Create tour tooltip with Design Spells animations**

Create `components/onboarding/tour-tooltip.tsx`:

```typescript
"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  ArrowRight01Icon, 
  Cancel01Icon,
  SparklesIcon
} from "@hugeicons/core-free-icons"
import { TourStep } from "./tour-step"

interface TourTooltipProps {
  step: TourStep
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}

export function TourTooltip({ 
  step, 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrev, 
  onSkip 
}: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tooltipRef.current || !contentRef.current) return

    const tl = gsap.timeline()

    // Tooltip entrance - Design Spells: Magnetic Pull
    tl.fromTo(tooltipRef.current,
      { opacity: 0, scale: 0.9, y: 10 },
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        duration: 0.5, 
        ease: "elastic.out(1, 0.75)" // Spring physics
      }
    )

    // Content stagger reveal
    .fromTo(contentRef.current.children,
      { opacity: 0, y: 10 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.4, 
        stagger: 0.08,
        ease: "power2.out"
      },
      "-=0.3"
    )

    // Sparkle effect on icon
    .fromTo(".tour-sparkle",
      { scale: 0, rotation: -180 },
      { 
        scale: 1, 
        rotation: 0, 
        duration: 0.6, 
        ease: "back.out(2)"
      },
      "-=0.4"
    )

    return () => {
      tl.kill()
    }
  }, [step.id])

  return (
    <div 
      ref={tooltipRef}
      className="fixed z-[101] w-72"
      style={{
        // Position will be calculated based on step.position
        top: step.position === "bottom" ? "auto" : "50%",
        left: step.position === "right" ? "calc(50% + 40px)" : "auto",
        transform: "translateY(-50%)"
      }}
    >
      {/* Double bezel card */}
      <div className="bg-muted/20 ring-1 ring-border/50 p-1 rounded-xl shadow-2xl">
        <div className="bg-card rounded-[calc(0.75rem-0.25rem)] p-4 space-y-3">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="tour-sparkle size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HugeiconsIcon 
                  icon={SparklesIcon} 
                  className="size-3.5 text-primary" 
                  strokeWidth={1.5} 
                />
              </div>
              <div>
                <h4 className="text-[11px] font-display font-semibold text-foreground">
                  {step.title}
                </h4>
                <p className="text-[8px] text-muted-foreground/50">
                  {currentStep + 1} de {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="size-5 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <HugeiconsIcon 
                icon={Cancel01Icon} 
                className="size-3 text-muted-foreground/50" 
                strokeWidth={1.5} 
              />
            </button>
          </div>

          {/* Content */}
          <div ref={contentRef}>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              {step.description}
            </p>

            {step.action && (
              <button
                onClick={() => window.location.href = step.action!.href}
                className="mt-2 text-[9px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                {step.action.label}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-2.5" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onPrev}
              disabled={currentStep === 0}
              className="text-[8px] font-bold text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-30 uppercase tracking-wider transition-colors"
            >
              Anterior
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`size-1 rounded-full transition-all duration-300 ${
                    i === currentStep 
                      ? "bg-primary w-3" 
                      : i < currentStep 
                        ? "bg-primary/50" 
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={onNext}
              className="text-[9px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              {currentStep === totalSteps - 1 ? "Concluir" : "Próximo"}
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-2.5" strokeWidth={1.5} />
            </button>
          </div>

        </div>
      </div>

      {/* Arrow pointer */}
      <div 
        className={`absolute w-3 h-3 bg-card rotate-45 ${
          step.position === "right" ? "-left-1.5 top-1/2 -translate-y-1/2" :
          step.position === "left" ? "-right-1.5 top-1/2 -translate-y-1/2" :
          step.position === "bottom" ? "-top-1.5 left-1/2 -translate-x-1/2" :
          "-bottom-1.5 left-1/2 -translate-x-1/2"
        }`}
        style={{ 
          borderLeft: step.position === "right" ? "1px solid var(--border)" : "none",
          borderRight: step.position === "left" ? "1px solid var(--border)" : "none",
          borderTop: step.position === "bottom" ? "1px solid var(--border)" : "none",
          borderBottom: step.position === "top" ? "1px solid var(--border)" : "none"
        }}
      />
    </div>
  )
}
```

**Step 3: Create tour overlay**

Create `components/onboarding/tour-overlay.tsx`:

```typescript
"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { TourTooltip } from "./tour-tooltip"
import { DASHBOARD_TOUR_STEPS, TourStep } from "./tour-step"

interface TourOverlayProps {
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

export function TourOverlay({ isActive, onComplete, onSkip }: TourOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)

  const step = DASHBOARD_TOUR_STEPS[currentStep]

  // Update spotlight position
  useEffect(() => {
    if (!isActive || !step) return

    const updateSpotlight = () => {
      const target = document.querySelector(step.target)
      if (target) {
        const rect = target.getBoundingClientRect()
        setSpotlightRect(rect)
        
        // Animate spotlight - Design Spells: Spotlight Reveal
        if (spotlightRef.current) {
          gsap.to(spotlightRef.current, {
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            duration: 0.5,
            ease: "cubic-bezier(0.32, 0.72, 0, 1)"
          })
        }
      }
    }

    updateSpotlight()
    window.addEventListener("resize", updateSpotlight)
    return () => window.removeEventListener("resize", updateSpotlight)
  }, [isActive, step])

  // Overlay entrance
  useGSAP(() => {
    if (!isActive || !overlayRef.current) return

    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" }
    )
  }, [isActive])

  const handleNext = useCallback(() => {
    if (currentStep < DASHBOARD_TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }, [currentStep, onComplete])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  if (!isActive || !step) return null

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100]">
      {/* Dark overlay with spotlight cutout */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]">
        {/* Spotlight mask */}
        <div
          ref={spotlightRef}
          className="absolute rounded-lg transition-shadow duration-300"
          style={{
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)"
          }}
        />
      </div>

      {/* Tooltip */}
      <TourTooltip
        step={step}
        currentStep={currentStep}
        totalSteps={DASHBOARD_TOUR_STEPS.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={onSkip}
      />

      {/* Progress indicator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 ring-1 ring-border/30 shadow-lg">
        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
          Tour
        </span>
        <div className="w-px h-3 bg-border/30" />
        <span className="text-[10px] font-semibold text-foreground/80">
          {currentStep + 1}/{DASHBOARD_TOUR_STEPS.length}
        </span>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add components/onboarding/tour-*
git commit -m "feat: dashboard tour overlay with spotlight and GSAP animations"
```

---

## Task 4: Contextual Help — Floating Checklist

**Files:**
- Create: `components/onboarding/floating-checklist.tsx` — persistent checklist
- Create: `components/onboarding/checklist-item.tsx` — individual item

**Step 1: Create checklist item**

Create `components/onboarding/checklist-item.tsx`:

```typescript
"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  CheckmarkCircle02Icon,
  ArrowRight01Icon
} from "@hugeicons/core-free-icons"

interface ChecklistItemProps {
  title: string
  description: string
  isCompleted: boolean
  href?: string
  onAction?: () => void
}

export function ChecklistItem({ 
  title, 
  description, 
  isCompleted, 
  href,
  onAction 
}: ChecklistItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const checkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    // Design Spells: Magnetic Hover
    const handleMouseEnter = () => {
      gsap.to(ref.current, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    const handleMouseLeave = () => {
      gsap.to(ref.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    const el = ref.current
    el.addEventListener("mouseenter", handleMouseEnter)
    el.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter)
      el.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  // Check animation
  useEffect(() => {
    if (isCompleted && checkRef.current) {
      gsap.fromTo(checkRef.current,
        { scale: 0, rotation: -180 },
        { 
          scale: 1, 
          rotation: 0, 
          duration: 0.6, 
          ease: "elastic.out(1, 0.5)" 
        }
      )
    }
  }, [isCompleted])

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
        isCompleted 
          ? "bg-green-500/5 hover:bg-green-500/10" 
          : "bg-muted/20 hover:bg-muted/30"
      }`}
      onClick={onAction}
    >
      <div ref={checkRef}>
        <HugeiconsIcon 
          icon={CheckmarkCircle02Icon} 
          className={`size-4 ${isCompleted ? "text-green-500" : "text-muted-foreground/30"}`}
          strokeWidth={1.5} 
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-semibold ${isCompleted ? "text-green-500/80 line-through" : "text-foreground/80"}`}>
          {title}
        </p>
        <p className="text-[8px] text-muted-foreground/40 truncate">
          {description}
        </p>
      </div>

      {!isCompleted && href && (
        <HugeiconsIcon 
          icon={ArrowRight01Icon} 
          className="size-3 text-muted-foreground/30" 
          strokeWidth={1.5} 
        />
      )}
    </div>
  )
}
```

**Step 2: Create floating checklist**

Create `components/onboarding/floating-checklist.tsx`:

```typescript
"use client"

import React, { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  ChecklistIcon,
  Cancel01Icon,
  ArrowUp01Icon
} from "@hugeicons/core-free-icons"
import { ChecklistItem } from "./checklist-item"

interface FloatingChecklistProps {
  userId: string
}

export function FloatingChecklist({ userId }: FloatingChecklistProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [progress, setProgress] = useState({
    agencyConfigured: false,
    firstClientCreated: false,
    firstServiceCreated: false,
    integrationConnected: false,
    contractGenerated: false
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  // Fetch progress
  useEffect(() => {
    fetch("/api/onboarding")
      .then(r => r.json())
      .then(data => {
        if (data.setupProgress) setProgress(data.setupProgress)
      })
      .catch(() => {})
  }, [])

  // Button pulse animation - Design Spells: Perpetual Micro-interaction
  useGSAP(() => {
    if (!buttonRef.current || isMinimized) return

    gsap.to(buttonRef.current, {
      scale: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    })
  }, [isMinimized])

  // Panel animation
  useGSAP(() => {
    if (!panelRef.current) return

    if (isOpen) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.4, 
          ease: "cubic-bezier(0.32, 0.72, 0, 1)" 
        }
      )
    } else {
      gsap.to(panelRef.current, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.3,
        ease: "power2.in"
      })
    }
  }, [isOpen])

  const completedCount = Object.values(progress).filter(Boolean).length
  const totalCount = Object.keys(progress).length
  const progressPercent = (completedCount / totalCount) * 100

  const checklistItems = [
    { 
      key: "agencyConfigured" as const,
      title: "Configurar Agência", 
      description: "Nome, logo e identidade",
      href: "/settings/agency"
    },
    { 
      key: "firstClientCreated" as const,
      title: "Cadastrar Cliente", 
      description: "Adicione seu primeiro cliente",
      href: "/clients"
    },
    { 
      key: "firstServiceCreated" as const,
      title: "Criar Serviço", 
      description: "Defina seus serviços",
      href: "/services"
    },
    { 
      key: "integrationConnected" as const,
      title: "Conectar Canal", 
      description: "WhatsApp ou Instagram",
      href: "/settings/integrations"
    },
    { 
      key: "contractGenerated" as const,
      title: "Gerar Contrato", 
      description: "Primeiro contrato para assinatura",
      href: "/clients"
    }
  ]

  if (isMinimized) {
    return (
      <div 
        ref={containerRef}
        className="fixed bottom-6 right-6 z-50"
      >
        <div
          ref={buttonRef}
          onClick={() => setIsMinimized(false)}
          className="size-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
        >
          <HugeiconsIcon icon={ChecklistIcon} className="size-5" strokeWidth={1.5} />
        </div>
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary/20"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${progressPercent * 1.13} 113`}
            className="text-primary transition-all duration-500"
          />
        </svg>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Panel */}
      <div
        ref={panelRef}
        className="w-72 bg-card rounded-xl shadow-2xl ring-1 ring-border/30 overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon 
                icon={ChecklistIcon} 
                className="size-4 text-primary" 
                strokeWidth={1.5} 
              />
              <h3 className="text-[11px] font-display font-semibold text-foreground">
                Setup da Agência
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="size-5 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <HugeiconsIcon 
                  icon={ArrowUp01Icon} 
                  className="size-3 text-muted-foreground/50" 
                  strokeWidth={1.5} 
                />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="size-5 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <HugeiconsIcon 
                  icon={Cancel01Icon} 
                  className="size-3 text-muted-foreground/50" 
                  strokeWidth={1.5} 
                />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[8px] text-muted-foreground/40">
              <span>{completedCount} de {totalCount} concluídos</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
          {checklistItems.map((item) => (
            <ChecklistItem
              key={item.key}
              title={item.title}
              description={item.description}
              isCompleted={progress[item.key]}
              href={item.href}
              onAction={() => {
                if (item.href) window.location.href = item.href
              }}
            />
          ))}
        </div>

        {/* Footer */}
        {completedCount === totalCount && (
          <div className="p-3 bg-green-500/5 border-t border-green-500/20">
            <p className="text-[9px] font-bold text-green-500 text-center uppercase tracking-widest">
              Setup Completo! 🎉
            </p>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      {!isOpen && (
        <div
          ref={buttonRef}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 size-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
        >
          <HugeiconsIcon icon={ChecklistIcon} className="size-5" strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add components/onboarding/floating-checklist.tsx components/onboarding/checklist-item.tsx
git commit -m "feat: floating checklist with perpetual pulse animation"
```

---

## Task 5: Integration — Root Page & Auth Flow

**Files:**
- Modify: `app/(app)/layout.tsx` — add onboarding provider
- Modify: `app/(app)/dashboard/page.tsx` — add data-tour attributes
- Modify: `components/nav-main.tsx` — add data-tour attributes
- Create: `components/onboarding/onboarding-provider.tsx` — orchestrator

**Step 1: Create onboarding provider**

Create `components/onboarding/onboarding-provider.tsx`:

```typescript
"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { SetupWizard } from "./setup-wizard"
import { TourOverlay } from "./tour-overlay"
import { FloatingChecklist } from "./floating-checklist"

interface OnboardingContextType {
  shouldShowWizard: boolean
  shouldShowTour: boolean
  refreshOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType>({
  shouldShowWizard: false,
  shouldShowTour: false,
  refreshOnboarding: () => {}
})

export function useOnboarding() {
  return useContext(OnboardingContext)
}

interface OnboardingProviderProps {
  children: React.ReactNode
  userId: string
}

export function OnboardingProvider({ children, userId }: OnboardingProviderProps) {
  const [loading, setLoading] = useState(true)
  const [onboardingState, setOnboardingState] = useState({
    onboardingCompleted: false,
    tutorialCompleted: false,
    setupProgress: {
      agencyConfigured: false,
      firstClientCreated: false,
      firstServiceCreated: false,
      integrationConnected: false,
      contractGenerated: false
    }
  })

  const fetchOnboarding = async () => {
    try {
      const res = await fetch("/api/onboarding")
      if (res.ok) {
        const data = await res.json()
        setOnboardingState(data)
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOnboarding()
  }, [])

  const shouldShowWizard = !loading && !onboardingState.onboardingCompleted
  const shouldShowTour = !loading && 
    onboardingState.onboardingCompleted && 
    !onboardingState.tutorialCompleted

  const handleWizardComplete = () => {
    setOnboardingState(prev => ({ ...prev, onboardingCompleted: true }))
  }

  const handleTourComplete = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialCompleted: true })
      })
      setOnboardingState(prev => ({ ...prev, tutorialCompleted: true }))
    } catch {
      // Silent fail
    }
  }

  const handleTourSkip = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialCompleted: true })
      })
      setOnboardingState(prev => ({ ...prev, tutorialCompleted: true }))
    } catch {
      // Silent fail
    }
  }

  if (loading) {
    return <>{children}</>
  }

  return (
    <OnboardingContext.Provider value={{
      shouldShowWizard,
      shouldShowTour,
      refreshOnboarding: fetchOnboarding
    }}>
      {children}

      {/* Setup Wizard */}
      {shouldShowWizard && (
        <SetupWizard 
          userId={userId}
          onComplete={handleWizardComplete}
        />
      )}

      {/* Dashboard Tour */}
      {shouldShowTour && (
        <TourOverlay
          isActive={shouldShowTour}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}

      {/* Floating Checklist */}
      {onboardingState.onboardingCompleted && (
        <FloatingChecklist userId={userId} />
      )}
    </OnboardingContext.Provider>
  )
}
```

**Step 2: Update app layout**

In `app/(app)/layout.tsx`, wrap children with OnboardingProvider:

```typescript
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider"

// In the component, wrap children:
<OnboardingProvider userId={session.user.id}>
  {children}
</OnboardingProvider>
```

**Step 3: Add data-tour attributes to dashboard**

In `app/(app)/dashboard/page.tsx`, add `data-tour` attributes:

```tsx
// Main container
<div data-tour="dashboard-kpis" className="...">
  {/* KPI cards */}
</div>
```

**Step 4: Add data-tour attributes to sidebar**

In `components/nav-main.tsx`, add `data-tour` attributes:

```tsx
// Inbox link
<SidebarMenuItem data-tour="inbox-link">
  ...
</SidebarMenuItem>

// Clients link
<SidebarMenuItem data-tour="clients-link">
  ...
</SidebarMenuItem>

// Settings link
<SidebarMenuItem data-tour="settings-link">
  ...
</SidebarMenuItem>
```

**Step 5: Add data-tour to quick actions**

In `components/quick-actions.tsx`, add:

```tsx
<div data-tour="quick-actions">
  {/* FAB button */}
</div>
```

**Step 6: Commit**

```bash
git add components/onboarding/onboarding-provider.tsx
git add app/(app)/layout.tsx
git add app/(app)/dashboard/page.tsx
git add components/nav-main.tsx
git add components/quick-actions.tsx
git commit -m "feat: integrate onboarding system with auth flow"
```

---

## Task 6: Design Spells — Micro-interactions Polish

**Files:**
- Create: `components/onboarding/confetti-burst.tsx` — celebration effect
- Create: `components/onboarding/magnetic-button.tsx` — physics-based button
- Create: `components/onboarding/text-scramble.tsx` — text reveal effect

**Step 1: Create confetti burst**

Create `components/onboarding/confetti-burst.tsx`:

```typescript
"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"

interface ConfettiBurstProps {
  active: boolean
  onComplete?: () => void
}

export function ConfettiBurst({ active, onComplete }: ConfettiBurstProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]
    const particles: HTMLDivElement[] = []

    // Create particles
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div")
      particle.className = "absolute w-2 h-2 rounded-full"
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      particle.style.left = "50%"
      particle.style.top = "50%"
      container.appendChild(particle)
      particles.push(particle)
    }

    // Animate particles - Design Spells: Particle Explosion
    const tl = gsap.timeline({
      onComplete: () => {
        particles.forEach(p => p.remove())
        onComplete?.()
      }
    })

    particles.forEach((particle, i) => {
      const angle = (i / particles.length) * Math.PI * 2
      const velocity = 100 + Math.random() * 200
      const x = Math.cos(angle) * velocity
      const y = Math.sin(angle) * velocity

      tl.fromTo(particle,
        { 
          x: 0, 
          y: 0, 
          scale: 1, 
          opacity: 1 
        },
        {
          x,
          y: y + 100, // Gravity
          scale: 0,
          opacity: 0,
          duration: 1 + Math.random() * 0.5,
          ease: "power2.out"
        },
        0
      )
    })

    return () => {
      tl.kill()
      particles.forEach(p => p.remove())
    }
  }, [active, onComplete])

  if (!active) return null

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[200]"
    />
  )
}
```

**Step 2: Create magnetic button**

Create `components/onboarding/magnetic-button.tsx`:

```typescript
"use client"

import React, { useRef, useEffect, ReactNode } from "react"
import { gsap } from "gsap"

interface MagneticButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function MagneticButton({ children, onClick, className }: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!buttonRef.current) return

    const button = buttonRef.current

    // Design Spells: Magnetic Hover Physics
    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      gsap.to(button, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: "power2.out"
      })

      if (textRef.current) {
        gsap.to(textRef.current, {
          x: x * 0.1,
          y: y * 0.1,
          duration: 0.3,
          ease: "power2.out"
        })
      }
    }

    const handleMouseLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)"
      })

      if (textRef.current) {
        gsap.to(textRef.current, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.5)"
        })
      }
    }

    button.addEventListener("mousemove", handleMouseMove)
    button.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      button.removeEventListener("mousemove", handleMouseMove)
      button.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={className}
    >
      <span ref={textRef}>{children}</span>
    </button>
  )
}
```

**Step 3: Create text scramble**

Create `components/onboarding/text-scramble.tsx`:

```typescript
"use client"

import React, { useRef, useEffect, useState } from "react"
import { gsap } from "gsap"

interface TextScrambleProps {
  text: string
  className?: string
  delay?: number
}

export function TextScramble({ text, className, delay = 0 }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState("")
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const chars = "!<>-_\\/[]{}—=+*^?#________"
    let iteration = 0
    let timeout: NodeJS.Timeout

    const scramble = () => {
      timeout = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (index < iteration) {
                return text[index]
              }
              return chars[Math.floor(Math.random() * chars.length)]
            })
            .join("")
        )

        if (iteration >= text.length) {
          clearInterval(timeout)
        }

        iteration += 1 / 3
      }, 30)
    }

    const delayTimeout = setTimeout(scramble, delay)

    return () => {
      clearTimeout(delayTimeout)
      clearInterval(timeout)
    }
  }, [text, delay])

  return (
    <span ref={containerRef} className={className}>
      {displayText}
    </span>
  )
}
```

**Step 4: Commit**

```bash
git add components/onboarding/confetti-burst.tsx components/onboarding/magnetic-button.tsx components/onboarding/text-scramble.tsx
git commit -m "feat: design spells - confetti, magnetic button, text scramble"
```

---

## Task 7: Completion Celebration — Final Integration

**Files:**
- Modify: `components/onboarding/setup-wizard.tsx` — add confetti on complete
- Modify: `components/onboarding/tour-overlay.tsx` — add confetti on complete
- Create: `components/onboarding/celebration-screen.tsx` — final celebration

**Step 1: Create celebration screen**

Create `components/onboarding/celebration-screen.tsx`:

```typescript
"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  SparklesIcon,
  Rocket01Icon,
  CheckmarkCircle02Icon
} from "@hugeicons/core-free-icons"
import { ConfettiBurst } from "./confetti-burst"
import { TextScramble } from "./text-scramble"
import { MagneticButton } from "./magnetic-button"

interface CelebrationScreenProps {
  onComplete: () => void
}

export function CelebrationScreen({ onComplete }: CelebrationScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current || !iconRef.current) return

    const tl = gsap.timeline()

    // Icon entrance - Design Spells: Overshoot Spring
    tl.fromTo(iconRef.current,
      { scale: 0, rotation: -180 },
      { 
        scale: 1, 
        rotation: 0, 
        duration: 0.8, 
        ease: "elastic.out(1, 0.5)" 
      }
    )

    // Content reveal
    .fromTo(".celebration-content",
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.5, 
        stagger: 0.1,
        ease: "power2.out"
      },
      "-=0.4"
    )

    // Sparkles floating
    .fromTo(".sparkle",
      { opacity: 0, scale: 0 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 0.4, 
        stagger: 0.05,
        ease: "back.out(2)"
      },
      "-=0.3"
    )

    // Continuous sparkle animation
    gsap.to(".sparkle", {
      y: -10,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.1
    })

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <ConfettiBurst active={true} />
      
      <div ref={containerRef} className="text-center space-y-6 max-w-md mx-4">
        {/* Floating sparkles */}
        <div className="relative">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="sparkle absolute"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${Math.random() * 100}%`
              }}
            >
              <HugeiconsIcon 
                icon={SparklesIcon} 
                className="size-4 text-primary/30" 
                strokeWidth={1.5} 
              />
            </div>
          ))}
          
          <div 
            ref={iconRef}
            className="size-20 mx-auto rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center"
          >
            <HugeiconsIcon 
              icon={Rocket01Icon} 
              className="size-10 text-primary" 
              strokeWidth={1.5} 
            />
          </div>
        </div>

        <div className="celebration-content space-y-2">
          <h2 className="text-xl font-display font-bold text-foreground">
            <TextScramble text="Tudo Pronto!" />
          </h2>
          <p className="text-[11px] text-muted-foreground/60">
            Sua agência está configurada e pronta para começar a gerenciar clientes.
          </p>
        </div>

        <div className="celebration-content space-y-3">
          <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground/50">
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-green-500" strokeWidth={1.5} />
              <span>Agência configurada</span>
            </div>
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-green-500" strokeWidth={1.5} />
              <span>Tutorial completo</span>
            </div>
          </div>

          <MagneticButton
            onClick={onComplete}
            className="h-10 px-6 bg-primary text-primary-foreground text-[10px] font-bold rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider"
          >
            Começar a Usar
          </MagneticButton>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Update setup wizard to show celebration**

In `components/onboarding/setup-wizard.tsx`, add state and import:

```typescript
import { CelebrationScreen } from "./celebration-screen"
import { ConfettiBurst } from "./confetti-burst"

// Add state
const [showCelebration, setShowCelebration] = useState(false)
const [showConfetti, setShowConfetti] = useState(false)

// Update handleComplete
const handleComplete = useCallback(async () => {
  setLoading(true)
  try {
    await fetch("/api/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        onboardingCompleted: true,
        setupProgress: progress
      })
    })
    
    // Show confetti first
    setShowConfetti(true)
    
    // Then show celebration
    setTimeout(() => {
      setShowCelebration(true)
    }, 500)
  } catch {
    toast.error("Erro ao finalizar onboarding")
  } finally {
    setLoading(false)
  }
}, [onComplete, progress])

// In JSX, add before return:
{showCelebration && (
  <CelebrationScreen onComplete={onComplete} />
)}

<ConfettiBurst active={showConfetti} />
```

**Step 3: Commit**

```bash
git add components/onboarding/celebration-screen.tsx components/onboarding/setup-wizard.tsx
git commit -m "feat: celebration screen with confetti and text scramble"
```

---

## Task 8: Testing & Polish

**Files:**
- Test all onboarding flows
- Verify GSAP animations performance
- Check responsive behavior
- Ensure accessibility

**Step 1: Run development server**

```bash
npm run dev
```

**Step 2: Test scenarios**

1. New user registration → should see setup wizard
2. Complete wizard → should see celebration → should see dashboard tour
3. Skip wizard → should see dashboard tour
4. Skip tour → should see floating checklist
5. Complete all checklist items → should show completion state
6. Refresh page → should not see wizard/tour again

**Step 3: Performance check**

- Verify all GSAP animations run at 60fps
- Check for memory leaks in animation cleanup
- Test on mobile viewport

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete onboarding and tutorial system"
```

---

## Summary — What Was Built

### 3-Layer Onboarding System

1. **Setup Wizard** (5 steps)
   - Agency configuration
   - First client
   - First service
   - Channel integration
   - First contract
   - GSAP stagger animations, double-bezel cards, step indicator

2. **Dashboard Tour** (6 highlights)
   - Spotlight overlay with animated mask
   - Magnetic tooltip with spring physics
   - Text scramble effects
   - Progress indicator

3. **Contextual Help** (persistent)
   - Floating checklist with perpetual pulse
   - Progress tracking
   - Magnetic hover effects
   - Completion celebration

### Design Spells Applied

- **Particle Explosion**: Confetti burst on completion
- **Magnetic Hover**: Buttons that pull toward cursor
- **Text Scramble**: Matrix-style character decoding
- **Spring Physics**: Elastic overshoot animations
- **Spotlight Reveal**: Dynamic mask following elements
- **Perpetual Pulse**: Continuous micro-animations

### GSAP Animations

- `elastic.out(1, 0.5)` for spring physics
- `cubic-bezier(0.32, 0.72, 0, 1)` for smooth transitions
- Staggered reveals for list items
- Scale + rotation for celebration effects
- ScrollTrigger-ready for future expansion

### Files Created/Modified

**New Files:**
- `lib/db/schema.ts` (modified)
- `scripts/migrate-onboarding.ts`
- `app/api/onboarding/route.ts`
- `components/onboarding/setup-wizard.tsx`
- `components/onboarding/step-indicator.tsx`
- `components/onboarding/wizard-step.tsx`
- `components/onboarding/tour-overlay.tsx`
- `components/onboarding/tour-tooltip.tsx`
- `components/onboarding/tour-step.ts`
- `components/onboarding/floating-checklist.tsx`
- `components/onboarding/checklist-item.tsx`
- `components/onboarding/onboarding-provider.tsx`
- `components/onboarding/confetti-burst.tsx`
- `components/onboarding/magnetic-button.tsx`
- `components/onboarding/text-scramble.tsx`
- `components/onboarding/celebration-screen.tsx`

**Modified Files:**
- `app/(app)/layout.tsx`
- `app/(app)/dashboard/page.tsx`
- `components/nav-main.tsx`
- `components/quick-actions.tsx`
