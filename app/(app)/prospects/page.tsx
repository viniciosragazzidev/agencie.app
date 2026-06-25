"use client"

import React, { useRef, useState, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, FilterIcon, SparklesIcon, Building01Icon, ArrowRight01Icon, Coins01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Analysis {
  pains: string[]
  opportunities: string[]
  coldMessage: string
}

interface Prospect {
  id: number
  name: string
  match: number
  niche: string
  location: string
  analysis: Analysis
}

export default function ProspectsPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Interactive states
  const [prospects, setProspects] = useState<Prospect[]>([
    {
      id: 1,
      name: "EcoLogistics Tech",
      match: 94,
      niche: "Logística",
      location: "São Paulo, SP",
      analysis: {
        pains: [
          "Tempo de resposta médio no WhatsApp superior a 4 horas",
          "Website institucional não responsivo no mobile",
          "Nenhuma tag de analytics ativa no sitemap"
        ],
        opportunities: [
          "Implementar chatbot de triagem automática via WhatsApp",
          "Ofertar reconstrução completa do site utilizando Next.js",
          "Configurar funil de vendas e tags de conversão"
        ],
        coldMessage: "Olá Lucas! Vi que a EcoLogistics tem expandido as operações de entrega. Analisando o canal de atendimento de vocês, notei que o tempo de resposta no WhatsApp pode ser otimizado em até 80% usando um assistente inteligente integrado. Preparamos uma demonstração rápida para o seu segmento, gostaria de avaliar?"
      }
    },
    {
      id: 2,
      name: "HealthVibe",
      match: 88,
      niche: "Saúde",
      location: "Curitiba, PR",
      analysis: {
        pains: [
          "Agendamento de consultas 100% manual por atendente",
          "Carregamento lento das imagens do site médico",
          "Nenhuma estratégia de tráfego pago visível"
        ],
        opportunities: [
          "Integrar sistema de agendamento automatizado no chat",
          "Otimização de performance web (Lighthouse score de 42 para 95+)",
          "Ofertar assessoria de mídia paga local"
        ],
        coldMessage: "Olá Dr. Ricardo! Tudo bem? Encontrei a clínica HealthVibe na busca local e analisei a velocidade de carregamento da página de vocês. Otimizando o tempo de abertura do site em 2 segundos, estimamos um aumento de até 25% na conversão de novos agendamentos diretos. Podemos agendar um bate-papo rápido de 10 minutos esta semana?"
      }
    },
    {
      id: 3,
      name: "EduFuture",
      match: 76,
      niche: "Educação",
      location: "Belo Horizonte, MG",
      analysis: {
        pains: [
          "Ausência de landing page dedicada para captação de leads",
          "Sem pixel de Facebook ou tag de Google Ads instalada",
          "Tom de voz do atendimento pouco humanizado"
        ],
        opportunities: [
          "Criação de Landing Pages de alta conversão para os cursos",
          "Configuração de pixels de rastreamento de anúncios",
          "Treinamento de assistente de atendimento com tom de voz humanizado"
        ],
        coldMessage: "Olá equipe EduFuture! Acompanho o trabalho pedagógico de vocês. Para auxiliar no próximo período de matrículas, desenhamos uma estrutura de Landing Page otimizada focada em conversão de novos alunos. Gostariam de ver esse protótipo sem custo?"
      }
    }
  ])

  // UI state hooks
  const [nicheInput, setNicheInput] = useState("")
  const [locationInput, setLocationInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchStep, setSearchStep] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)

  // Local storage CRM sync states
  const [crmClientNames, setCrmClientNames] = useState<string[]>([])
  
  // Custom interactive search / filter
  const [searchQuery, setSearchQuery] = useState("")
  const [fitFilter, setFitFilter] = useState<"all" | "high" | "excellent">("all")
  const [scraperLogs, setScraperLogs] = useState<string[]>([])

  // Hydration-safe load of CRM clients from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_clients")
      if (saved) {
        try {
          const list = JSON.parse(saved)
          setCrmClientNames(list.map((c: any) => c.name))
        } catch (e) {}
      }
    }
  }, [selectedProspect])

  // GSAP Entrance Animations
  useGSAP(() => {
    gsap.from(".bento-item", {
      y: 15,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      clearProps: "all"
    })
  }, { scope: containerRef })

  // Trigger floating notifications
  const triggerToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Sweep simulation
  const handleSweepWeb = () => {
    if (!nicheInput.trim()) {
      triggerToast("Por favor, preencha o Nicho/Setor desejado.", "error")
      return
    }

    setIsSearching(true)
    setScraperLogs([])

    const logs = [
      `[0.2s] [System] Iniciando varredura automatizada para o nicho "${nicheInput}"...`,
      `[0.9s] [Search] Buscando geolocalizações no Google Maps API para "${locationInput || "Brasil"}"...`,
      `[1.6s] [Scraper] Extraindo metadados e sitemaps dos domínios encontrados...`,
      `[2.4s] [Auditor] Analisando tempo de carregamento mobile e ausência de widgets de atendimento...`,
      `[3.2s] [IA Core] Mapeando dores comerciais prioritárias e oportunidades tecnológicas...`,
      `[3.9s] [Match Engine] Calculando aderência técnica ao perfil ICP...`,
      `[4.5s] [Sucesso] Varredura finalizada. 2 novos prospects adicionados à sua base!`
    ]

    let currentLogIndex = 0
    const logInterval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setScraperLogs(prev => [...prev, logs[currentLogIndex]])
        currentLogIndex++
      } else {
        clearInterval(logInterval)
      }
    }, 600)

    const steps = [
      "Buscando no Google Maps API...",
      "Extraindo sitemaps corporativos...",
      "Calculando fit técnico com ICP...",
      "Formatando insights de IA...",
      "Finalizado!"
    ]

    let currentStep = 0
    setSearchStep(steps[currentStep])

    const interval = setInterval(() => {
      currentStep++
      if (currentStep < steps.length) {
        setSearchStep(steps[currentStep])
      } else {
        clearInterval(interval)
        setIsSearching(false)

        const capitalizedNiche = nicheInput.charAt(0).toUpperCase() + nicheInput.slice(1)
        const city = locationInput.trim() ? locationInput : "Brasil"

        const newLeads: Prospect[] = [
          {
            id: Date.now(),
            name: `${capitalizedNiche} Premium`,
            match: Math.floor(Math.random() * (98 - 90 + 1)) + 90,
            niche: capitalizedNiche,
            location: city,
            analysis: {
              pains: [
                `Nenhum canal de chat integrado no site de ${capitalizedNiche}`,
                "Lighthouse performance score inferior a 45",
                "Sem pixels ativos de conversão para marketing"
              ],
              opportunities: [
                "Implementar funil de vendas automático com chatbot de IA",
                "Migração completa de frontend para performance Next.js",
                "Configurar pixels e criar campanhas de anúncios"
              ],
              coldMessage: `Olá! Notei que a sua empresa de ${nicheInput} em ${city} tem uma excelente avaliação, mas o carregamento do site mobile está demorando cerca de 5 segundos. Reduzindo isso, podemos aumentar em até 30% a taxa de conversão direta. Vamos conversar?`
            }
          },
          {
            id: Date.now() + 1,
            name: `Grupo ${capitalizedNiche} Hub`,
            match: Math.floor(Math.random() * (89 - 78 + 1)) + 78,
            niche: capitalizedNiche,
            location: city,
            analysis: {
              pains: [
                "WhatsApp de atendimento demora horas para responder",
                "Falta de automação de marcação de horários",
                "Copywriting do site antigo pouco persuasivo"
              ],
              opportunities: [
                "Integrar chatbot Omnichannel com IA",
                "Acoplar sistema de agendamento automático",
                "Refazer design completo focado em conversão CRO"
              ],
              coldMessage: `Olá! Encontrei o Grupo ${capitalizedNiche} Hub. Percebi que o atendimento de vocês no WhatsApp costuma ter fila de espera. Temos uma IA pré-configurada para o seu setor que automatiza 90% das dúvidas comuns instantaneamente. Posso te enviar uma demo?`
            }
          }
        ]

        setProspects(prev => [...newLeads, ...prev])
        setNicheInput("")
        setLocationInput("")
        triggerToast("Varredura completa! Encontramos 2 novos prospects qualificados.")
      }
    }, 4500)
  }

  // Copy cold message to clipboard
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
    triggerToast("Mensagem copiada com sucesso!")
  }

  // CRM LocalStorage integration
  const handleImportToCrm = (lead: Prospect) => {
    if (typeof window === "undefined") return

    const saved = localStorage.getItem("crm_clients")
    let clientsList: any[] = []
    if (saved) {
      try {
        clientsList = JSON.parse(saved)
      } catch (e) {}
    }

    const exists = clientsList.some((c: any) => c.name === lead.name)
    if (exists) {
      triggerToast("Este prospect já foi importado para o CRM.", "info")
      return
    }

    const newClient = {
      id: Date.now(),
      name: lead.name,
      status: "Onboarding",
      projects: 1,
      mrr: lead.match >= 90 ? 3500 : 2500
    }

    clientsList.push(newClient)
    localStorage.setItem("crm_clients", JSON.stringify(clientsList))
    
    setCrmClientNames(prev => [...prev, lead.name])
    triggerToast(`"${lead.name}" importado para o CRM com sucesso!`)
  }

  // Filter prospects dynamically
  const filteredProspects = prospects.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lead.niche.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lead.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (fitFilter === "excellent") {
      return matchesSearch && lead.match >= 90
    }
    if (fitFilter === "high") {
      return matchesSearch && lead.match >= 80
    }
    return matchesSearch
  })

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      
      {/* Scrollable Container */}
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto overflow-y-auto no-scrollbar">
        
        {/* Dynamic header row */}
        <section className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bento-item">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-semibold tracking-tight">Prospecção AI</h1>
              <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                BETA
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Varra a web em tempo real em busca de leads altamente qualificados que precisam de tecnologia.</p>
          </div>

          {/* Quick stats indicators */}
          <div className="flex items-center gap-3">
            <div className="bg-card border border-border/40 px-3 py-2 rounded-xl flex items-center gap-2">
              <HugeiconsIcon icon={Coins01Icon} strokeWidth={1.5} className="size-4 text-primary" />
              <div className="text-left">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none">Créditos de Varredura</p>
                <p className="text-xs font-semibold mt-0.5 leading-none">85 / 100</p>
              </div>
            </div>
            <div className="bg-card border border-border/40 px-3 py-2 rounded-xl flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <div className="text-left">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none">Última Varredura</p>
                <p className="text-xs font-semibold mt-0.5 leading-none">Há 2 horas</p>
              </div>
            </div>
          </div>
        </section>

        {/* Crawler Search Input Bento Card */}
        <div className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] mb-6">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1.5 text-left">
                <Label htmlFor="n-input" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nicho / Setor Comercial</Label>
                <div className="relative">
                  <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    id="n-input"
                    disabled={isSearching}
                    value={nicheInput}
                    onChange={(e) => setNicheInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSweepWeb()}
                    placeholder="Ex: Clínicas médicas, Academias, Construtoras..." 
                    className="pl-9 h-10 bg-muted/30 border-border/40 rounded-xl text-xs" 
                  />
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-1.5 text-left">
                <Label htmlFor="l-input" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Localidade / Cidade</Label>
                <div className="relative">
                  <HugeiconsIcon icon={FilterIcon} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    id="l-input"
                    disabled={isSearching}
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSweepWeb()}
                    placeholder="Ex: São Paulo, Rio de Janeiro, Curitiba..." 
                    className="pl-9 h-10 bg-muted/30 border-border/40 rounded-xl text-xs" 
                  />
                </div>
              </div>

              <Button 
                onClick={handleSweepWeb}
                disabled={isSearching}
                className="h-10 rounded-xl px-7 text-xs font-semibold active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] gap-1.5 shrink-0"
              >
                {isSearching ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin size-3.5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {searchStep}
                  </span>
                ) : (
                  <>
                    <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.5} className="size-4" />
                    Varrer Web com IA
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stateful Scraper Logs Console */}
        {(isSearching || scraperLogs.length > 0) && (
          <div className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-4 font-mono text-[10px] text-muted-foreground bg-black/40 border border-border/40">
              <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-destructive" />
                  <div className="size-2.5 rounded-full bg-amber-500" />
                  <div className="size-2.5 rounded-full bg-primary" />
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-2">Console de Varredura Web Scraper</span>
                </div>
                {isSearching && <span className="animate-pulse size-1.5 rounded-full bg-primary animate-pulse" />}
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar font-medium">
                {scraperLogs.filter(Boolean).map((log, idx) => (
                  <p key={idx} className={log.includes("[Sucesso]") ? "text-primary" : log.includes("[System]") ? "text-foreground" : "text-muted-foreground"}>
                    {log}
                  </p>
                ))}
                {isSearching && (
                  <p className="text-primary animate-pulse">
                    &gt; Executando varredura e cruzamento com ICP...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search & Fit ICP Filter Panel */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between bento-item">
          {/* Text search */}
          <div className="relative w-full sm:w-72">
            <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar prospects..." 
              className="pl-9 h-9 bg-muted/30 border-border/40 rounded-xl text-xs" 
            />
          </div>

          {/* ICP fit tabs */}
          <div className="flex items-center gap-1 bg-muted/20 p-0.5 rounded-xl border border-border/40 w-full sm:w-auto">
            {(["all", "high", "excellent"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFitFilter(filter)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-[9px] font-bold rounded-lg uppercase tracking-wider transition-all active:scale-[0.96] cursor-pointer ${
                  fitFilter === filter 
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border/30" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter === "all" ? "Todos" : filter === "high" ? "Fit > 80%" : "Fit > 90%"}
              </button>
            ))}
          </div>
        </div>

        {/* Prospects Results List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bento-item">
          {filteredProspects.length === 0 ? (
            <div className="col-span-full double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] text-center">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-8">
                <p className="text-xs text-muted-foreground font-medium">Nenhum prospect qualificado encontrado nesta busca.</p>
              </div>
            </div>
          ) : (
            filteredProspects.map((lead) => {
              const isImported = crmClientNames.includes(lead.name)
              return (
                <div 
                  key={lead.id} 
                  onClick={() => setSelectedProspect(lead)}
                  className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] group cursor-pointer"
                >
                  <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 h-full flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[0.98]">
                    
                    {/* Header card details */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-muted/50 border border-border/50">
                        <HugeiconsIcon icon={Building01Icon} strokeWidth={1.5} className="size-5 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isImported && (
                          <span className="text-[8px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                            CRM
                          </span>
                        )}
                        <span className={`text-[8px] font-bold tracking-widest ring-1 rounded-full px-2 py-0.5 uppercase ${
                          lead.match >= 90 ? 'bg-primary/10 text-primary ring-primary/20' : 'bg-amber-500/10 text-amber-500 ring-amber-500/20'
                        }`}>
                          {lead.match}% Fit ICP
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-foreground truncate">{lead.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{lead.niche} • {lead.location}</p>

                    {/* Bottom detail action links */}
                    <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Ver Análise IA</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="size-3.5 text-primary group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </main>

      {/* Floating AI Analysis Modal Details */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-6">
              
              {/* Close button */}
              <button 
                onClick={() => setSelectedProspect(null)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header info */}
              <div className="flex items-center gap-2.5 mb-5 border-b border-border/40 pb-3">
                <span className={`text-[8px] font-bold tracking-widest ring-1 rounded-full px-2 py-0.5 uppercase ${
                  selectedProspect.match >= 90 ? 'bg-primary/10 text-primary ring-primary/20' : 'bg-amber-500/10 text-amber-500 ring-amber-500/20'
                }`}>
                  {selectedProspect.match}% Fit ICP
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedProspect.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{selectedProspect.niche} • {selectedProspect.location}</p>
                </div>
              </div>

              {/* Analysis Grid split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 text-left">
                
                {/* Identified Pains */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-destructive uppercase tracking-widest block">Dores / Problemas</span>
                  <ul className="space-y-1.5">
                    {selectedProspect.analysis.pains.map((pain, idx) => (
                      <li key={idx} className="text-xs text-foreground/80 flex items-start gap-1.5">
                        <span className="text-destructive shrink-0 mt-0.5">•</span>
                        <span>{pain}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Identified Opportunities */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest block">Oportunidades de Vendas</span>
                  <ul className="space-y-1.5">
                    {selectedProspect.analysis.opportunities.map((opp, idx) => (
                      <li key={idx} className="text-xs text-foreground/80 flex items-start gap-1.5">
                        <span className="text-primary shrink-0 mt-0.5">•</span>
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Outreach suggested scripts */}
              <div className="space-y-2 border-t border-border/40 pt-4">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Mensagem Outreach Sugerida</span>
                <div className="bg-muted/30 border border-border/30 rounded-xl p-3.5 relative group">
                  <p className="text-xs text-foreground/90 leading-relaxed pr-6 text-left">{selectedProspect.analysis.coldMessage}</p>
                  <button
                    onClick={() => handleCopyMessage(selectedProspect.analysis.coldMessage)}
                    className="absolute right-2.5 top-2.5 p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    title="Copiar mensagem"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProspect(null)}
                  className="h-8 rounded-xl text-[10px] font-semibold active:scale-[0.97]"
                >
                  Fechar
                </Button>
                {crmClientNames.includes(selectedProspect.name) ? (
                  <Button
                    disabled
                    className="h-8 rounded-xl text-[10px] font-semibold bg-muted text-muted-foreground border border-border/40 gap-1"
                  >
                    <svg className="size-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Importado para CRM
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleImportToCrm(selectedProspect)}
                    className="h-8 rounded-xl text-[10px] font-semibold active:scale-[0.97]"
                  >
                    Importar para CRM
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating custom notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-card/90 backdrop-blur-md ring-1 ring-border/50 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-sm">
            <div className={`size-2 rounded-full shrink-0 ${
              toast.type === "success" ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" :
              toast.type === "error" ? "bg-destructive shadow-[0_0_8px_rgba(var(--destructive),0.5)]" :
              "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            }`} />
            <span className="text-[11px] font-medium text-foreground">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Custom scrollbar overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}
