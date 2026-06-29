"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Cancel01Icon, Add01Icon, Delete02Icon, SparklesIcon, ArrowRight01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface ServiceItem {
  id: string
  name: string
  description: string
  quantity: number
  unitPrice: string
  billing: "mensal" | "anual" | "unico"
}

interface DeliverableItem {
  id: string
  name: string
  description: string
  deadlineDays: number
  assignee: string
}

interface BudgetProposalWizardProps {
  clientId: string
  clientName: string
  projectId?: string | null
  projects: Array<{ id: string; name: string }>
  globalServices: Array<{ id: string; name: string; price: string; billing: string; description?: string }>
  open: boolean
  onClose: () => void
  onSaved: (proposal: any) => void
  onToast: (msg: string, type?: "success" | "error") => void
}

const STEPS = ["Dados Gerais", "Serviços e Custos", "Entregáveis", "Condições", "Revisão"]

export function BudgetProposalWizard({
  clientId, clientName, projectId, projects, globalServices, open, onClose, onSaved, onToast
}: BudgetProposalWizardProps) {
  const [step, setStep] = useState(0)

  const [title, setTitle] = useState("")
  const [niche, setNiche] = useState("")
  const [linkedProjectId, setLinkedProjectId] = useState(projectId || "")
  const [validityDays, setValidityDays] = useState("30")

  const [services, setServices] = useState<ServiceItem[]>([
    { id: crypto.randomUUID(), name: "", description: "", quantity: 1, unitPrice: "", billing: "mensal" }
  ])

  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([
    { id: crypto.randomUUID(), name: "", description: "", deadlineDays: 0, assignee: "" }
  ])

  const [paymentCondition, setPaymentCondition] = useState("1x")
  const [customInstallments, setCustomInstallments] = useState("")
  const [lateFee, setLateFee] = useState("2% ao mês")
  const [cancellationClause, setCancellationClause] = useState("")
  const [finalNotes, setFinalNotes] = useState("")
  const [includeAdjustment, setIncludeAdjustment] = useState(false)

  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)

  useEffect(() => {
    if (projectId) setLinkedProjectId(projectId)
  }, [projectId])

  if (!open) return null

  const totalBudget = services.reduce((sum, s) => {
    const price = parseFloat(s.unitPrice) || 0
    return sum + (price * s.quantity)
  }, 0)

  const addService = () => {
    setServices(prev => [...prev, { id: crypto.randomUUID(), name: "", description: "", quantity: 1, unitPrice: "", billing: "mensal" }])
  }

  const removeService = (id: string) => {
    if (services.length <= 1) return
    setServices(prev => prev.filter(s => s.id !== id))
  }

  const updateService = (id: string, field: keyof ServiceItem, value: any) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const addDeliverable = () => {
    setDeliverables(prev => [...prev, { id: crypto.randomUUID(), name: "", description: "", deadlineDays: 0, assignee: "" }])
  }

  const removeDeliverable = (id: string) => {
    if (deliverables.length <= 1) return
    setDeliverables(prev => prev.filter(d => d.id !== id))
  }

  const updateDeliverable = (id: string, field: keyof DeliverableItem, value: any) => {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  const fillServiceFromCatalog = (serviceId: string) => {
    const catalog = globalServices.find(s => s.id === serviceId)
    if (catalog) {
      setServices(prev => {
        const firstEmpty = prev.findIndex(s => !s.name)
        if (firstEmpty >= 0) {
          return prev.map((s, i) => i === firstEmpty ? { ...s, name: catalog.name, unitPrice: catalog.price, billing: catalog.billing as any, description: catalog.description || "" } : s)
        }
        return [...prev, { id: crypto.randomUUID(), name: catalog.name, description: catalog.description || "", quantity: 1, unitPrice: catalog.price, billing: catalog.billing as any }]
      })
    }
  }

  const handleSave = async () => {
    if (!title.trim()) { onToast("Título é obrigatório.", "error"); return }
    setSaving(true)
    try {
      const scopeText = [
        "Serviços:",
        ...services.filter(s => s.name).map(s => `- ${s.name} (x${s.quantity}) R$ ${parseFloat(s.unitPrice || "0").toLocaleString()} / ${s.billing}`),
        "",
        "Entregáveis:",
        ...deliverables.filter(d => d.name).map(d => `- ${d.name}: ${d.description} (${d.deadlineDays} dias)`),
        "",
        "Condições:",
        `Pagamento: ${paymentCondition === "personalizado" ? customInstallments : paymentCondition}`,
        lateFee ? `Multa: ${lateFee}` : "",
        cancellationClause ? `Cancelamento: ${cancellationClause}` : "",
        finalNotes ? `Obs: ${finalNotes}` : "",
        includeAdjustment ? "Reajuste anual IPCA incluído." : "",
      ].filter(Boolean).join("\n")

      const res = await fetch("/api/client-portal/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, title, notes: scopeText }),
      })
      if (res.ok) {
        const asset = await res.json()
        onSaved(asset)
        onToast("Proposta salva com sucesso!")
        onClose()
      } else {
        onToast("Erro ao salvar proposta.", "error")
      }
    } catch {
      onToast("Erro de conexão.", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleAIGenerate = async () => {
    setGeneratingAI(true)
    try {
      const res = await fetch("/api/ai/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          services: services.filter(s => s.name).map(s => ({ name: s.name, price: s.unitPrice, billing: s.billing })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.scope) {
          setFinalNotes(prev => prev ? prev + "\n\n" + data.scope : data.scope)
        }
        onToast("Escopo aprimorado pela IA!")
      }
    } catch {
      onToast("Erro ao gerar via IA.", "error")
    } finally {
      setGeneratingAI(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-2xl rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-hidden">
        <div className="bg-card border border-border/20 rounded-[calc(2rem-0.375rem)] flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-5 pb-0 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground font-display">Nova Proposta Comercial</h3>
                <p className="text-[10px] text-muted-foreground">Preencha todos os dados para gerar uma proposta completa.</p>
              </div>
              <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted active:scale-[0.98] transition-all">
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            </div>
            <div className="flex gap-1 mb-4">
              {STEPS.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-1 w-full rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted/50"}`} />
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${i === step ? "text-primary" : "text-muted-foreground/50"}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 pt-2 space-y-4">
            {step === 0 && (
              <>
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Título da Proposta *</Label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Gestão de Tráfego Pago - Q1 2026" className="bg-muted/10 border-border/40 text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nicho / Segmento</Label>
                    <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex: E-Commerce, Saúde" className="bg-muted/10 border-border/40 text-xs" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Validade (dias)</Label>
                    <Input type="number" value={validityDays} onChange={e => setValidityDays(e.target.value)} className="bg-muted/10 border-border/40 text-xs" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Projeto Vinculado</Label>
                  <Select value={linkedProjectId} onValueChange={(v) => setLinkedProjectId(v || "")}>
                    <SelectTrigger className="h-10 text-xs rounded-xl border-border/40 bg-muted/10">
                      <SelectValue placeholder="Selecionar projeto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-1.5 mb-3">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Vincular Serviço do Catálogo</Label>
                  <Select onValueChange={(v: any) => { if (v) fillServiceFromCatalog(String(v)) }}>
                    <SelectTrigger className="h-9 text-xs rounded-xl border-border/40 bg-muted/10">
                      <SelectValue placeholder="Selecionar para preencher automaticamente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {globalServices.map(s => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">{s.name} — R$ {parseFloat(s.price).toLocaleString()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {services.map((svc, idx) => (
                    <div key={svc.id} className="p-3 bg-muted/5 border border-border/20 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Serviço {idx + 1}</span>
                        {services.length > 1 && (
                          <button onClick={() => removeService(svc.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                            <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <Input value={svc.name} onChange={e => updateService(svc.id, "name", e.target.value)} placeholder="Nome do serviço" className="bg-muted/10 border-border/40 text-xs" />
                      <textarea value={svc.description} onChange={e => updateService(svc.id, "description", e.target.value)} rows={2} placeholder="Descrição do que está incluído..." className="w-full p-2 bg-muted/10 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="grid gap-1">
                          <Label className="text-[8px] font-bold text-muted-foreground uppercase">Qtd</Label>
                          <Input type="number" min="1" value={svc.quantity} onChange={e => updateService(svc.id, "quantity", parseInt(e.target.value) || 1)} className="bg-muted/10 border-border/40 text-xs h-8" />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[8px] font-bold text-muted-foreground uppercase">Valor Unit. (R$)</Label>
                          <Input value={svc.unitPrice} onChange={e => updateService(svc.id, "unitPrice", e.target.value)} placeholder="0.00" className="bg-muted/10 border-border/40 text-xs h-8" />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[8px] font-bold text-muted-foreground uppercase">Cobrança</Label>
                          <Select value={svc.billing} onValueChange={v => { if (v) updateService(svc.id, "billing", v) }}>
                            <SelectTrigger className="h-8 text-[10px] rounded-lg border-border/40 bg-muted/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mensal" className="text-xs">Mensal</SelectItem>
                              <SelectItem value="anual" className="text-xs">Anual</SelectItem>
                              <SelectItem value="unico" className="text-xs">Único</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-primary">
                          Subtotal: R$ {((parseFloat(svc.unitPrice) || 0) * svc.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" onClick={addService} size="sm" className="w-full gap-1.5 text-[10px] font-bold h-8 border-dashed border-border/40">
                  <HugeiconsIcon icon={Add01Icon} className="size-3.5" /> Adicionar Serviço
                </Button>

                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Total Geral</span>
                  <span className="text-lg font-bold text-primary font-display">R$ {totalBudget.toLocaleString()}</span>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-3">
                  {deliverables.map((del, idx) => (
                    <div key={del.id} className="p-3 bg-muted/5 border border-border/20 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Entrega {idx + 1}</span>
                        {deliverables.length > 1 && (
                          <button onClick={() => removeDeliverable(del.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                            <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <Input value={del.name} onChange={e => updateDeliverable(del.id, "name", e.target.value)} placeholder="Nome da entrega" className="bg-muted/10 border-border/40 text-xs" />
                      <textarea value={del.description} onChange={e => updateDeliverable(del.id, "description", e.target.value)} rows={2} placeholder="Descreva o que será entregue..." className="w-full p-2 bg-muted/10 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                          <Label className="text-[8px] font-bold text-muted-foreground uppercase">Prazo (dias)</Label>
                          <Input type="number" min="0" value={del.deadlineDays || ""} onChange={e => updateDeliverable(del.id, "deadlineDays", parseInt(e.target.value) || 0)} placeholder="Dias" className="bg-muted/10 border-border/40 text-xs h-8" />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[8px] font-bold text-muted-foreground uppercase">Responsável</Label>
                          <Input value={del.assignee} onChange={e => updateDeliverable(del.id, "assignee", e.target.value)} placeholder="Nome" className="bg-muted/10 border-border/40 text-xs h-8" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addDeliverable} size="sm" className="w-full gap-1.5 text-[10px] font-bold h-8 border-dashed border-border/40">
                  <HugeiconsIcon icon={Add01Icon} className="size-3.5" /> Adicionar Entregável
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Condição de Pagamento</Label>
                  <Select value={paymentCondition} onValueChange={(v) => { if (v) setPaymentCondition(v) }}>
                    <SelectTrigger className="h-10 text-xs rounded-xl border-border/40 bg-muted/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1x" className="text-xs">À Vista</SelectItem>
                      <SelectItem value="2x" className="text-xs">2x</SelectItem>
                      <SelectItem value="3x" className="text-xs">3x</SelectItem>
                      <SelectItem value="personalizado" className="text-xs">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentCondition === "personalizado" && (
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Parcelas Personalizadas</Label>
                    <textarea value={customInstallments} onChange={e => setCustomInstallments(e.target.value)} rows={3} placeholder="Ex: 40% na assinatura, 30% na entrega do 1º lote, 30% na entrega final" className="w-full p-2.5 bg-muted/10 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40" />
                  </div>
                )}
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Multa por Atraso</Label>
                  <Input value={lateFee} onChange={e => setLateFee(e.target.value)} placeholder="Ex: 2% ao mês" className="bg-muted/10 border-border/40 text-xs" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Cláusula de Cancelamento</Label>
                  <textarea value={cancellationClause} onChange={e => setCancellationClause(e.target.value)} rows={3} placeholder="Ex: O cancelamento deve ser solicitado com 30 dias de antecedência..." className="w-full p-2.5 bg-muted/10 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Observações Finais</Label>
                  <textarea value={finalNotes} onChange={e => setFinalNotes(e.target.value)} rows={3} placeholder="Informações adicionais, garantias, SLA..." className="w-full p-2.5 bg-muted/10 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeAdjustment} onChange={e => setIncludeAdjustment(e.target.checked)} className="accent-primary" />
                  <span className="text-xs text-muted-foreground">Incluir cláusula de reajuste anual (IPCA)</span>
                </label>
              </>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/5 border border-border/20 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{title || "Sem título"}</h4>
                  {niche && <p className="text-[10px] text-muted-foreground">Nicho: <span className="text-foreground font-medium">{niche}</span></p>}
                  {linkedProjectId && <p className="text-[10px] text-muted-foreground">Projeto: <span className="text-foreground font-medium">{projects.find(p => p.id === linkedProjectId)?.name}</span></p>}
                  <p className="text-[10px] text-muted-foreground">Validade: <span className="text-foreground font-medium">{validityDays} dias</span></p>
                </div>

                <div className="p-4 bg-muted/5 border border-border/20 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">Serviços</h4>
                  {services.filter(s => s.name).map(s => (
                    <div key={s.id} className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">{s.name} x{s.quantity}</span>
                      <span className="font-medium text-foreground">R$ {((parseFloat(s.unitPrice) || 0) * s.quantity).toLocaleString()} / {s.billing}</span>
                    </div>
                  ))}
                  <div className="border-t border-border/20 pt-2 mt-2 flex justify-between">
                    <span className="text-[10px] font-bold text-primary uppercase">Total</span>
                    <span className="text-sm font-bold text-primary font-display">R$ {totalBudget.toLocaleString()}</span>
                  </div>
                </div>

                {deliverables.filter(d => d.name).length > 0 && (
                  <div className="p-4 bg-muted/5 border border-border/20 rounded-xl space-y-2">
                    <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">Entregáveis</h4>
                    {deliverables.filter(d => d.name).map(d => (
                      <div key={d.id} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-medium text-foreground">{d.deadlineDays} dias</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-muted/5 border border-border/20 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">Condições</h4>
                  <p className="text-[10px] text-muted-foreground">Pagamento: <span className="text-foreground">{paymentCondition === "personalizado" ? customInstallments : paymentCondition}</span></p>
                  {lateFee && <p className="text-[10px] text-muted-foreground">Multa: <span className="text-foreground">{lateFee}</span></p>}
                  {cancellationClause && <p className="text-[10px] text-muted-foreground">Cancelamento: <span className="text-foreground">{cancellationClause}</span></p>}
                  {includeAdjustment && <p className="text-[10px] text-muted-foreground">Reajuste anual IPCA: <span className="text-foreground">Sim</span></p>}
                </div>

                <Button type="button" variant="outline" onClick={handleAIGenerate} disabled={generatingAI} className="w-full text-xs font-semibold gap-1.5 h-9 bg-primary/5 text-primary border border-primary/10 hover:border-primary/20">
                  {generatingAI ? "Analisando..." : "Aprimorar Escopo com IA"}
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 pt-3 border-t border-border/20 flex justify-between shrink-0">
            <Button type="button" variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onClose()} className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all">
              {step > 0 ? <><HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5 mr-1" /> Anterior</> : "Cancelar"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep(step + 1)} className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all">
                Próximo <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSave} disabled={saving} className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all">
                {saving ? "Salvando..." : "Salvar Proposta"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
