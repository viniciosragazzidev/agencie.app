"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  ArrowLeft01Icon, 
  Briefcase01Icon, 
  CpuIcon, 
  ZapIcon
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Client {
  id: string
  name: string
  industry?: string | null
}

export default function NewClientServicePage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const containerRef = useRef<HTMLDivElement>(null)

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Service builder states
  const [serviceName, setServiceName] = useState("")
  const [servicePrice, setServicePrice] = useState("")
  const [serviceBilling, setServiceBilling] = useState<"mensal" | "anual" | "unico">("mensal")
  const [serviceDesc, setServiceDesc] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [serviceSteps, setServiceSteps] = useState<string[]>([
    "Fase 1: Onboarding e Diagnóstico Técnico",
    "Fase 2: Implementação e Integração de APIs",
    "Fase 3: Otimização Contínua e Escala"
  ])

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function loadClient() {
      try {
        const res = await fetch(`/api/clients/${clientId}`)
        if (res.ok) {
          const data = await res.json()
          setClient(data)
        } else {
          triggerToast("Cliente não encontrado.", "error")
        }
      } catch {
        triggerToast("Erro ao carregar cliente.", "error")
      } finally {
        setLoading(false)
      }
    }
    if (clientId) {
      loadClient()
    }
  }, [clientId])

  useGSAP(() => {
    gsap.from(".anim-item", {
      y: 15,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      clearProps: "all"
    })
  }, { scope: containerRef, dependencies: [loading] })

  const handleAiScopeGeneration = () => {
    if (!serviceName.trim()) {
      triggerToast("Defina o nome do serviço para estruturar o escopo via IA.", "error")
      return
    }
    setAiGenerating(true)
    setTimeout(() => {
      const niche = client?.industry || "Tecnologia"
      setServicePrice("4800")
      setServiceBilling("mensal")
      setServiceDesc(`Este escopo foi gerado exclusivamente pela Kyper AI para atender às necessidades específicas da operação de ${client?.name} no setor de ${niche}.

Entregáveis do Projeto:
1. Mapeamento de gargalos em processos de vendas e prospecção ativa.
2. Integração e automação completa do funil com canais de comunicação omnichannel.
3. Treinamento assistido de equipe e dashboards analíticos de performance.`)
      setServiceSteps([
        "Semana 1-2: Diagnóstico profundo de infraestrutura e setup de canais",
        "Semana 3-4: Integrações de CRM, bots e regras de encaminhamento inteligente",
        "Semana 5-6: Lançamento em homologação e calibragem de métricas operacionais",
        "A partir da Semana 7: Acompanhamento de performance e refinamento contínuo"
      ])
      setAiGenerating(false)
      triggerToast("Escopo e cronograma gerados pela IA!")
    }, 1500)
  }

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceName.trim() || !servicePrice.trim()) {
      triggerToast("Nome e valor do serviço são obrigatórios.", "error")
      return
    }

    // Since the client details page reads from local state/mock API updates, we can simulate adding it
    // and redirect back to the client dashboard
    triggerToast("Serviço customizado e escopo salvos para este cliente!")
    setTimeout(() => {
      router.push(`/clients/${clientId}`)
    }, 1500)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-screen">
        <span className="text-xs text-muted-foreground animate-pulse">Carregando configurador...</span>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background h-screen gap-4">
        <span className="text-xs text-muted-foreground">Cliente não localizado.</span>
        <Button variant="outline" onClick={() => router.push("/clients")} className="text-xs">
          Voltar para lista
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      
      {/* Header Bar */}
      <header className="border-b border-border/40 p-4 bg-card/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/clients/${clientId}`)} className="rounded-xl border border-border/40 hover:bg-muted">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 text-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground tracking-tight">Configurador de Serviço Complexo</h1>
              <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                {client.name}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Estruturação de serviços customizados com cronograma de fases</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-6 max-w-[1000px] w-full mx-auto space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Configuration Card */}
          <div className="lg:col-span-8 double-bezel-card anim-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-6 space-y-6">
              
              <div className="flex items-center gap-2 border-b border-border/20 pb-4 justify-between">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={1.5} className="size-5 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground font-display">Especificações do Serviço</h2>
                </div>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleAiScopeGeneration}
                  disabled={aiGenerating}
                  className="text-xs font-semibold gap-1.5 h-8 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                >
                  <HugeiconsIcon icon={CpuIcon} strokeWidth={1.5} className="size-4 animate-pulse" />
                  {aiGenerating ? "Mapeando Nível..." : "Estruturar Escopo via IA"}
                </Button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="s-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nome do Serviço Comercial</Label>
                  <Input 
                    id="s-name"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Ex: Consultoria Avançada de Growth & Tech stack"
                    className="bg-muted/10 border-border/40"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="s-price" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Valor Proposto (R$)</Label>
                    <Input 
                      id="s-price"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      placeholder="Ex: 5000"
                      className="bg-muted/10 border-border/40"
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Faturamento</Label>
                    <select 
                      value={serviceBilling} 
                      onChange={(e) => setServiceBilling(e.target.value as any)}
                      className="w-full h-8 px-2.5 bg-muted/30 border border-border/40 rounded-lg text-xs focus:outline-none dark:bg-input/30"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
                      <option value="unico">Pagamento Único</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="s-desc" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Detalhamento e Entregáveis</Label>
                  <textarea 
                    id="s-desc"
                    rows={6}
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    placeholder="Defina o escopo, ferramentas e processos incluídos nesta prestação de serviço..."
                    className="w-full p-2.5 bg-muted/10 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border/20">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push(`/clients/${clientId}`)}
                    className="h-10 text-xs px-5 rounded-xl font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-10 text-xs px-6 rounded-xl font-semibold active:scale-[0.98]"
                  >
                    Salvar e Associar
                  </Button>
                </div>
              </form>

            </div>
          </div>

          {/* Timeline / Steps Card */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="double-bezel-card anim-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <HugeiconsIcon icon={ZapIcon} className="size-4 text-primary" />
                  <h3 className="font-semibold text-xs text-foreground font-display">Cronograma de Fases</h3>
                </div>
                <div className="relative border-l border-border/40 ml-2.5 pl-4 space-y-5">
                  {serviceSteps.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21.5px] top-0 size-3 rounded-full bg-primary border-2 border-background shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Fase {idx + 1}</p>
                      <p className="text-[11px] text-foreground font-medium mt-0.5 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-card/90 backdrop-blur-md ring-1 ring-border/50 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-sm">
            <div className={`size-2 rounded-full shrink-0 ${
              toast.type === "success" ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-destructive shadow-[0_0_8px_rgba(var(--destructive),0.5)]"
            }`} />
            <span className="text-[11px] font-medium text-foreground">{toast.message}</span>
          </div>
        </div>
      )}

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
