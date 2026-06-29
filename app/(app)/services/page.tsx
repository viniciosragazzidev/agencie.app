"use client"

import React, { useRef, useState, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  Briefcase01Icon, 
  Add01Icon, 
  Cancel01Icon, 
  Coins01Icon, 
  ZapIcon, 
  CpuIcon, 
  FolderOpenIcon, 
  Delete02Icon, 
  Edit02Icon,
  TextIcon
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Service {
  id: string
  name: string
  description?: string | null
  price: string
  billing: "mensal" | "anual" | "unico"
}

export default function ServicesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [serviceName, setServiceName] = useState("")
  const [servicePrice, setServicePrice] = useState("")
  const [serviceBilling, setServiceBilling] = useState<"mensal" | "anual" | "unico">("mensal")
  const [serviceDesc, setServiceDesc] = useState("")
  
  // AI assist states
  const [aiGenerating, setAiGenerating] = useState(false)
  const [pitchPreview, setPitchPreview] = useState<{ name: string; pitch: string } | null>(null)

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/services")
        if (res.ok) {
          const data = await res.json()
          setServices(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadServices()
  }, [])

  useGSAP(() => {
    if (!loading) {
      gsap.from(".bento-item", {
        y: 15,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        clearProps: "all"
      })
    }
  }, { dependencies: [loading], scope: containerRef })

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openAddModal = () => {
    setSelectedService(null)
    setServiceName("")
    setServicePrice("")
    setServiceBilling("mensal")
    setServiceDesc("")
    setShowModal(true)
  }

  const openEditModal = (s: Service) => {
    setSelectedService(s)
    setServiceName(s.name)
    setServicePrice(s.price)
    setServiceBilling(s.billing)
    setServiceDesc(s.description || "")
    setShowModal(true)
  }

  const handleAiAutoFill = () => {
    if (!serviceName.trim()) {
      triggerToast("Digite um nome ou conceito de serviço primeiro.", "error")
      return
    }
    setAiGenerating(true)
    setTimeout(() => {
      setServicePrice(Math.floor(Math.random() * 4000 + 1500).toString())
      setServiceBilling("mensal")
      setServiceDesc(`Serviço especializado de ${serviceName}. Pacote corporativo Kyper incluindo:
1. Planejamento estratégico e auditoria técnica semanal.
2. Setup completo de integrações omnichannel (WhatsApp, Email & CRM).
3. Monitoramento em tempo real com relatórios gerenciais e SLA de 2 horas.`)
      setAiGenerating(false)
      triggerToast("Descrição e valor estratégico gerados por IA!")
    }, 1200)
  }

  const handleGeneratePitch = (s: Service) => {
    setPitchPreview({
      name: s.name,
      pitch: `Apresentamos o pacote de ${s.name}.\n\nEsse serviço foi estruturado para resolver gargalos críticos de eficiência operacional e conversão de vendas. Com um investimento recorrente de R$ ${parseFloat(s.price).toLocaleString()} (${s.billing}), sua equipe terá acesso direto a especialistas de mercado e tecnologia de ponta.\n\nGarantias:\n- Setup concluído em até 10 dias úteis.\n- Relatórios quinzenais de entrega.\n- Flexibilidade total de cancelamento.`
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceName.trim() || !servicePrice.trim()) {
      triggerToast("Nome e preço são obrigatórios.", "error")
      return
    }

    const payload = {
      name: serviceName,
      price: servicePrice,
      billing: serviceBilling,
      description: serviceDesc,
    }

    try {
      if (selectedService) {
        // Edit mode
        const res = await fetch(`/api/services/${selectedService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setServices(prev => prev.map(s => s.id === updated.id ? updated : s))
          triggerToast("Serviço atualizado com sucesso!")
          setShowModal(false)
        } else {
          triggerToast("Erro ao atualizar o serviço.", "error")
        }
      } else {
        // Create mode
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setServices(prev => [created, ...prev])
          triggerToast("Serviço registrado na carteira global!")
          setShowModal(false)
        } else {
          triggerToast("Erro ao criar o serviço.", "error")
        }
      }
    } catch (err) {
      triggerToast("Erro de rede.", "error")
    }
  }

  const handleDelete = (id: string, name: string) => {
    setServiceToDelete({ id, name })
  }

  const executeDeleteService = async () => {
    if (!serviceToDelete) return
    const { id, name } = serviceToDelete
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" })
      if (res.ok) {
        setServices(prev => prev.filter(s => s.id !== id))
        triggerToast("Serviço removido com sucesso!")
      } else {
        triggerToast("Erro ao remover serviço.", "error")
      }
    } catch (err) {
      triggerToast("Erro de rede.", "error")
    }
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      
      {/* Header Bar */}
      <header className="border-b border-border/40 p-4 bg-card/30 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={1.5} className="size-5 text-primary" />
            <h1 className="text-lg font-heading font-semibold text-foreground tracking-tight">Catálogo de Serviços</h1>
          </div>
          <p className="text-[10px] text-muted-foreground">Gerenciamento global de escopos e recorrência comercial</p>
        </div>
        <Button 
          onClick={openAddModal} 
          className="text-xs h-9 gap-1.5 active:scale-[0.98] font-semibold"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          Cadastrar Serviço
        </Button>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 max-w-[1400px] w-full mx-auto">
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-xs text-muted-foreground animate-pulse">Carregando catálogo de serviços...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] max-w-md mx-auto mt-12">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-8 text-center space-y-4">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={1.5} className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Nenhum serviço registrado</h3>
                <p className="text-xs text-muted-foreground mt-1">Cadastre seus pacotes para utilizá-los rapidamente nas propostas dos clientes.</p>
              </div>
              <Button onClick={openAddModal} className="text-xs h-8">
                Criar Primeiro Serviço
              </Button>
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(s => (
              <div key={s.id} className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
                <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col justify-between h-[220px] relative">
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-xs font-semibold text-foreground tracking-tight line-clamp-1">{s.name}</h3>
                      <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase shrink-0">
                        {s.billing}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-4">
                      {s.description || "Nenhuma descrição fornecida para este serviço."}
                    </p>
                  </div>

                  <div className="flex justify-between items-end border-t border-border/20 pt-4 mt-auto">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold leading-none">Preço do Serviço</p>
                      <p className="text-sm font-semibold text-foreground mt-1">R$ {parseFloat(s.price).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleGeneratePitch(s)}
                        title="Pitch do Serviço"
                        className="size-8 rounded-lg border-border/50 hover:bg-muted"
                      >
                        <HugeiconsIcon icon={TextIcon} strokeWidth={1.5} className="size-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => openEditModal(s)}
                        className="size-8 rounded-lg border-border/50 hover:bg-muted"
                      >
                        <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.5} className="size-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleDelete(s.id, s.name)}
                        className="size-8 rounded-lg border-border/50 text-destructive/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-4" />
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </section>
        )}

      </main>

      {/* 1. Modal Cadastro / Edição de Serviço */}
      {showModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-card border border-border/50 w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
            </button>

            <h3 className="text-sm font-semibold text-foreground mb-1 font-display">
              {selectedService ? "Editar Serviço Comercial" : "Novo Serviço Comercial"}
            </h3>
            <p className="text-[10px] text-muted-foreground mb-4">Adicione serviços específicos ao catálogo de entregáveis da agência.</p>

            <div className="mb-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleAiAutoFill}
                disabled={aiGenerating}
                className="w-full text-xs font-semibold gap-1.5 h-9 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
              >
                <HugeiconsIcon icon={CpuIcon} strokeWidth={1.5} className="size-4 animate-pulse" />
                {aiGenerating ? "Compondo Escopo..." : "Compor com Inteligência Artificial"}
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="service-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nome do Serviço / Escopo</Label>
                <Input
                  id="service-name"
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Gestão de Anúncios Google Ads"
                  className="bg-muted/10 border-border/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="service-price" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Valor do Serviço (R$)</Label>
                  <Input
                    id="service-price"
                    type="text"
                    required
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    placeholder="Ex: 2500"
                    className="bg-muted/10 border-border/40"
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
                <Label htmlFor="service-desc" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Detalhamento e Entregáveis</Label>
                <textarea
                  id="service-desc"
                  rows={4}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Quais serão os prazos, relatórios e processos integrados neste serviço comercial?"
                  className="w-full p-2.5 bg-muted/10 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  className="rounded-xl text-xs font-semibold h-10 px-4"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.97]"
                >
                  {selectedService ? "Salvar Alterações" : "Salvar no Catálogo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Pitch Preview */}
      {pitchPreview && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-card border border-border/50 w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => setPitchPreview(null)}
              className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
            </button>

            <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Pitch Comercial</h3>
            <p className="text-[10px] text-muted-foreground mb-4">Ganchos persuasivos gerados pela IA para vender o serviço {pitchPreview.name}.</p>

            <div className="border border-border/40 rounded-2xl p-4 bg-muted/5 relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full filter blur-xl" />
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap">
                {pitchPreview.pitch}
              </p>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(pitchPreview.pitch)
                  triggerToast("Pitch copiado para a área de transferência!")
                  setPitchPreview(null)
                }}
                className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.97]"
              >
                Copiar Texto
              </Button>
            </div>
          </div>
        </div>
      )}

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

      <ConfirmDialog
        open={!!serviceToDelete}
        onOpenChange={(open) => !open && setServiceToDelete(null)}
        title="Remover serviço"
        description={`Deseja realmente remover o serviço "${serviceToDelete?.name}"? Ele deixará de estar disponível para novos contratos.`}
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={executeDeleteService}
        variant="destructive"
      />

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
