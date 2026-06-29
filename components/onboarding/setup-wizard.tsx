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
  Loading01Icon,
  Message01Icon,
  InstagramIcon,
  AtIcon,
  CheckmarkCircle03Icon,
  LinkSquare02Icon,
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

  // Step 1: Agency
  const [agencyName, setAgencyName] = useState("")
  const [agencySlogan, setAgencySlogan] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#6366f1")

  // Step 2: Client
  const [clientName, setClientName] = useState("")
  const [clientContact, setClientContact] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientIndustry, setClientIndustry] = useState("")

  // Step 3: Service
  const [serviceName, setServiceName] = useState("")
  const [serviceDesc, setServiceDesc] = useState("")
  const [servicePrice, setServicePrice] = useState("")

  // Step 4: Channel
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)

  // Step 5: Contract
  const [contractType, setContractType] = useState("service")
  const [contractGenerated, setContractGenerated] = useState(false)

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

  const saveAgency = async () => {
    if (!agencyName.trim()) {
      toast.error("Informe o nome da agência")
      return false
    }
    try {
      const res = await fetch("/api/agency-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyName, agencySlogan, primaryColor })
      })
      if (res.ok) {
        setProgress(p => ({ ...p, agencyConfigured: true }))
        toast.success("Agência configurada!")
        return true
      }
      toast.error("Erro ao salvar agência")
      return false
    } catch {
      toast.error("Erro ao salvar agência")
      return false
    }
  }

  const saveClient = async () => {
    if (!clientName.trim()) {
      toast.error("Informe o nome do cliente")
      return false
    }
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: clientName,
          contactName: clientContact,
          contactEmail: clientEmail,
          contactPhone: clientPhone,
          industry: clientIndustry,
          status: "Ativo"
        })
      })
      if (res.ok) {
        setProgress(p => ({ ...p, firstClientCreated: true }))
        toast.success("Cliente cadastrado!")
        return true
      }
      toast.error("Erro ao cadastrar cliente")
      return false
    } catch {
      toast.error("Erro ao cadastrar cliente")
      return false
    }
  }

  const saveService = async () => {
    if (!serviceName.trim()) {
      toast.error("Informe o nome do serviço")
      return false
    }
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: serviceName,
          description: serviceDesc,
          price: servicePrice || "0"
        })
      })
      if (res.ok) {
        setProgress(p => ({ ...p, firstServiceCreated: true }))
        toast.success("Serviço criado!")
        return true
      }
      toast.error("Erro ao criar serviço")
      return false
    } catch {
      toast.error("Erro ao criar serviço")
      return false
    }
  }

  const handleChannelSelect = (channel: string) => {
    setSelectedChannel(channel)
    setProgress(p => ({ ...p, integrationConnected: true }))
    toast.success(`Canal ${channel} selecionado!`)
  }

  const handleContractType = (type: string) => {
    setContractType(type)
    setContractGenerated(true)
    setProgress(p => ({ ...p, contractGenerated: true }))
    toast.success("Tipo de contrato definido!")
  }

  const handleStepAction = async (): Promise<boolean> => {
    switch (currentStep) {
      case 0: return saveAgency()
      case 1: return saveClient()
      case 2: return saveService()
      case 3: return true // channel is just selection
      case 4: return true // contract type is just selection
      default: return true
    }
  }

  const handleNextClick = useCallback(async () => {
    const saved = await handleStepAction()
    if (saved) handleNext()
  }, [currentStep, agencyName, agencySlogan, primaryColor, clientName, clientContact, clientEmail, clientPhone, clientIndustry, serviceName, serviceDesc, servicePrice])

  const progressValues = Object.values(progress)
  const completedSteps = progressValues.filter(Boolean).length
  const isLastStep = currentStep === WIZARD_STEPS.length - 1

  const inputClass = "w-full h-8 px-2.5 bg-muted/10 border border-border/40 rounded-lg text-[11px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
  const labelClass = "text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest"
  const selectClass = "w-full h-8 px-2.5 bg-muted/10 border border-border/40 rounded-lg text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all appearance-none cursor-pointer"

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
          <div className="bg-card rounded-[calc(1rem-0.375rem)] p-6 space-y-5">
            
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
                    {/* Step Icon + Title */}
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <HugeiconsIcon 
                          icon={step.icon} 
                          className="size-5 text-primary" 
                          strokeWidth={1.5} 
                        />
                      </div>
                      <div>
                        <h3 className="text-xs font-display font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="text-[10px] text-muted-foreground/60">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Step-specific content */}
                    {i === 0 && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className={labelClass}>Nome da Agência</label>
                          <input
                            type="text"
                            value={agencyName}
                            onChange={e => setAgencyName(e.target.value)}
                            placeholder="Ex: Kyper Agência"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Slogan</label>
                          <input
                            type="text"
                            value={agencySlogan}
                            onChange={e => setAgencySlogan(e.target.value)}
                            placeholder="Ex: Conectando marcas ao sucesso"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Cor Principal</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={primaryColor}
                              onChange={e => setPrimaryColor(e.target.value)}
                              className="size-8 rounded-lg border border-border/40 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={primaryColor}
                              onChange={e => setPrimaryColor(e.target.value)}
                              className={inputClass + " max-w-[120px]"}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {i === 1 && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className={labelClass}>Nome do Cliente *</label>
                          <input
                            type="text"
                            value={clientName}
                            onChange={e => setClientName(e.target.value)}
                            placeholder="Ex: Empresa XYZ"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Contato</label>
                          <input
                            type="text"
                            value={clientContact}
                            onChange={e => setClientContact(e.target.value)}
                            placeholder="Nome do responsável"
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <label className={labelClass}>Email</label>
                            <input
                              type="email"
                              value={clientEmail}
                              onChange={e => setClientEmail(e.target.value)}
                              placeholder="email@empresa.com"
                              className={inputClass}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelClass}>Telefone</label>
                            <input
                              type="tel"
                              value={clientPhone}
                              onChange={e => setClientPhone(e.target.value)}
                              placeholder="(11) 99999-9999"
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Ramo / Segmento</label>
                          <input
                            type="text"
                            value={clientIndustry}
                            onChange={e => setClientIndustry(e.target.value)}
                            placeholder="Ex: E-commerce, Saúde, Educação"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}

                    {i === 2 && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className={labelClass}>Nome do Serviço *</label>
                          <input
                            type="text"
                            value={serviceName}
                            onChange={e => setServiceName(e.target.value)}
                            placeholder="Ex: Gestão de Redes Sociais"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Descrição</label>
                          <textarea
                            value={serviceDesc}
                            onChange={e => setServiceDesc(e.target.value)}
                            placeholder="Descreva o que está incluso neste serviço..."
                            rows={3}
                            className={inputClass + " resize-none h-auto py-2"}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Preço Mensal (R$)</label>
                          <input
                            type="number"
                            value={servicePrice}
                            onChange={e => setServicePrice(e.target.value)}
                            placeholder="Ex: 2500"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}

                    {i === 3 && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-muted-foreground/50">
                          Selecione o canal que deseja integrar primeiro. Você pode adicionar mais depois.
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: "whatsapp", label: "WhatsApp Business", icon: Message01Icon, desc: "Mensagens e atendimento direto", color: "text-green-500" },
                            { id: "instagram", label: "Instagram", icon: InstagramIcon, desc: "DMs e comentários", color: "text-pink-500" },
                            { id: "email", label: "Email", icon: AtIcon, desc: "Correspondência profissional", color: "text-blue-500" },
                          ].map(ch => (
                            <button
                              key={ch.id}
                              onClick={() => handleChannelSelect(ch.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${
                                selectedChannel === ch.id
                                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                  : "bg-muted/10 border-border/30 hover:bg-muted/20 hover:border-border/50"
                              }`}
                            >
                              <div className={`size-9 rounded-lg flex items-center justify-center ${
                                selectedChannel === ch.id ? "bg-primary/10" : "bg-muted/30"
                              }`}>
                                <HugeiconsIcon 
                                  icon={ch.icon} 
                                  className={`size-4.5 ${selectedChannel === ch.id ? ch.color : "text-muted-foreground/60"}`} 
                                  strokeWidth={1.5} 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-semibold text-foreground block">{ch.label}</span>
                                <span className="text-[9px] text-muted-foreground/50">{ch.desc}</span>
                              </div>
                              {selectedChannel === ch.id && (
                                <HugeiconsIcon 
                                  icon={CheckmarkCircle03Icon} 
                                  className="size-4 text-primary shrink-0" 
                                  strokeWidth={1.5} 
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {i === 4 && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-muted-foreground/50">
                          Escolha o tipo de contrato para enviar ao seu primeiro cliente.
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: "service", label: "Prestação de Serviço", desc: "Contrato padrão para serviços recorrentes" },
                            { id: "project", label: "Projeto Pontual", desc: "Para entregas com prazo definido" },
                            { id: "consulting", label: "Consultoria", desc: "Assessoria e acompanhamento estratégico" },
                          ].map(ct => (
                            <button
                              key={ct.id}
                              onClick={() => handleContractType(ct.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${
                                contractType === ct.id
                                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                                  : "bg-muted/10 border-border/30 hover:bg-muted/20 hover:border-border/50"
                              }`}
                            >
                              <div className={`size-9 rounded-lg flex items-center justify-center ${
                                contractType === ct.id ? "bg-primary/10" : "bg-muted/30"
                              }`}>
                                <HugeiconsIcon 
                                  icon={File01Icon} 
                                  className={`size-4.5 ${contractType === ct.id ? "text-primary" : "text-muted-foreground/60"}`} 
                                  strokeWidth={1.5} 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-semibold text-foreground block">{ct.label}</span>
                                <span className="text-[9px] text-muted-foreground/50">{ct.desc}</span>
                              </div>
                              {contractType === ct.id && (
                                <HugeiconsIcon 
                                  icon={CheckmarkCircle03Icon} 
                                  className="size-4 text-primary shrink-0" 
                                  strokeWidth={1.5} 
                                />
                              )}
                            </button>
                          ))}
                        </div>
                        {contractGenerated && (
                          <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/20 rounded-lg p-2.5">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5 text-green-500 shrink-0" strokeWidth={1.5} />
                            <span className="text-[10px] text-green-600 font-medium">
                              Modelo de contrato "{contractType === "service" ? "Prestação de Serviço" : contractType === "project" ? "Projeto Pontual" : "Consultoria"}" configurado
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    {progressValues[i] && (
                      <div className="flex items-center gap-2">
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
            <div className="flex items-center justify-between pt-1">
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
                  onClick={handleNextClick}
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
