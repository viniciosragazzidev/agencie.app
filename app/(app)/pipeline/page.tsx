"use client"

import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  Edit02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Layers01Icon,
  Coins01Icon,
  ChartUpIcon,
  CheckmarkCircle02Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Lead {
  id: string
  userId: string
  name: string
  status: "lead" | "qualified" | "won" | "lost"
  value: number
  createdAt: string
  updatedAt: string
}

const STAGES = [
  { id: "lead", label: "Novo Lead", color: "text-muted-foreground", bg: "bg-muted-foreground/10" },
  { id: "qualified", label: "Qualificado", color: "text-primary", bg: "bg-primary/10" },
  { id: "won", label: "Ganho", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "lost", label: "Perdido", color: "text-destructive", bg: "bg-destructive/10" },
] as const

export default function PipelinePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: session } = authClient.useSession()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Form states
  const [leadName, setLeadName] = useState("")
  const [leadValue, setLeadValue] = useState("")
  const [leadStatus, setLeadStatus] = useState<"lead" | "qualified" | "won" | "lost">("lead")

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load leads
  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads")
      if (!res.ok) throw new Error("Falha ao buscar leads")
      const data = await res.json()
      setLeads(data)
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao carregar leads.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchLeads()
    }
  }, [session])

  // GSAP entrance animation
  useGSAP(() => {
    if (!loading && leads.length >= 0) {
      gsap.from(".hero-text", {
        opacity: 0,
        y: -12,
        duration: 1.0,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        stagger: 0.08,
      })
      gsap.from(".metric-card", {
        y: 15,
        opacity: 0,
        scale: 0.98,
        duration: 0.8,
        stagger: 0.05,
        ease: "cubic-bezier(0.32,0.72,0,1)",
      })
      gsap.from(".kanban-column", {
        y: 25,
        opacity: 0,
        duration: 1.0,
        stagger: 0.06,
        ease: "cubic-bezier(0.32,0.72,0,1)",
      })
    }
  }, [loading])

  // Open Modal helpers
  const openCreateModal = (initialStatus: typeof STAGES[number]["id"] = "lead") => {
    setModalMode("create")
    setLeadName("")
    setLeadValue("")
    setLeadStatus(initialStatus)
    setSelectedLead(null)
    setShowModal(true)
  }

  const openEditModal = (lead: Lead) => {
    setModalMode("edit")
    setLeadName(lead.name)
    setLeadValue(lead.value.toString())
    setLeadStatus(lead.status)
    setSelectedLead(lead)
    setShowModal(true)
  }

  // API Actions
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadName.trim()) {
      triggerToast("Nome do lead é obrigatório.", "error")
      return
    }

    const valueNum = parseFloat(leadValue) || 0

    try {
      if (modalMode === "create") {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: leadName, status: leadStatus, value: valueNum }),
        })
        if (!res.ok) throw new Error("Erro ao criar lead")
        const newLead = await res.json()
        setLeads(prev => [newLead, ...prev])
        triggerToast("Lead criado com sucesso!")
      } else {
        if (!selectedLead) return
        const res = await fetch(`/api/leads/${selectedLead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: leadName, status: leadStatus, value: valueNum }),
        })
        if (!res.ok) throw new Error("Erro ao editar lead")
        const updatedLead = await res.json()
        setLeads(prev => prev.map(l => (l.id === updatedLead.id ? updatedLead : l)))
        triggerToast("Lead atualizado!")
      }
      setShowModal(false)
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao salvar lead.", "error")
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este lead?")) return

    // Optimistic update
    const previousLeads = [...leads]
    setLeads(prev => prev.filter(l => l.id !== id))

    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      triggerToast("Lead removido com sucesso!")
    } catch (err) {
      setLeads(previousLeads)
      triggerToast("Erro ao remover lead.", "error")
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: Lead["status"]) => {
    const leadToUpdate = leads.find(l => l.id === id)
    if (!leadToUpdate || leadToUpdate.status === newStatus) return

    // Optimistic update
    const previousLeads = [...leads]
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, status: newStatus } : l)))

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
    } catch (err) {
      setLeads(previousLeads)
      triggerToast("Erro ao atualizar status do lead.", "error")
    }
  }

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id)
    e.dataTransfer.setData("text/plain", id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setDraggedLeadId(null)
    setDragOverCol(null)
  }

  const handleDragOver = (e: React.DragEvent, status: Lead["status"]) => {
    e.preventDefault()
    setDragOverCol(status)
  }

  const handleDrop = (e: React.DragEvent, status: Lead["status"]) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/plain") || draggedLeadId
    if (id) {
      handleUpdateStatus(id, status)
    }
    setDraggedLeadId(null)
    setDragOverCol(null)
  }

  // Metrics calculators
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
  }

  const getStageLeads = (stageId: Lead["status"]) => leads.filter(l => l.status === stageId)
  const getStageTotal = (stageId: Lead["status"]) => getStageLeads(stageId).reduce((sum, l) => sum + l.value, 0)

  const totalValue = leads.reduce((sum, l) => sum + l.value, 0)
  const totalLeads = leads.length
  const wonLeadsCount = leads.filter(l => l.status === "won").length
  const conversionRate = totalLeads > 0 ? Math.round((wonLeadsCount / totalLeads) * 100) : 0

  return (
    <div ref={containerRef} className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* Top Header & Summary Bar */}
      <div className="border-b border-border/40 bg-card/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="hero-text text-xl font-semibold text-foreground tracking-tight font-display flex items-center gap-2">
            <HugeiconsIcon icon={Layers01Icon} strokeWidth={1.5} className="size-5 text-primary" />
            Pipeline Comercial
          </h1>
          <p className="hero-text text-[10px] text-muted-foreground mt-0.5">
            Gerencie suas oportunidades de vendas e acompanhe o funil de conversão.
          </p>
        </div>

        {/* Sales metrics widgets (Mini Control Panel) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="metric-card double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl">
            <div className="bg-card px-3 py-1.5 rounded-[calc(0.75rem-0.25rem)] border border-border/20 flex flex-col min-w-[100px]">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Volume Total</span>
              <span className="text-xs font-semibold text-foreground mt-0.5">{formatCurrency(totalValue)}</span>
            </div>
          </div>

          <div className="metric-card double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl">
            <div className="bg-card px-3 py-1.5 rounded-[calc(0.75rem-0.25rem)] border border-border/20 flex flex-col min-w-[80px]">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Total Leads</span>
              <span className="text-xs font-semibold text-foreground mt-0.5">{totalLeads}</span>
            </div>
          </div>

          <div className="metric-card double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl">
            <div className="bg-card px-3 py-1.5 rounded-[calc(0.75rem-0.25rem)] border border-border/20 flex flex-col min-w-[90px]">
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Conversão Global</span>
              <span className="text-xs font-semibold text-primary mt-0.5 flex items-center gap-1">
                <HugeiconsIcon icon={ChartUpIcon} strokeWidth={1.5} className="size-3 text-emerald-500" />
                {conversionRate}%
              </span>
            </div>
          </div>

          <Button
            onClick={() => openCreateModal("lead")}
            className="rounded-xl text-[10px] font-semibold tracking-wider h-10 px-4 active:scale-[0.98] transition-all duration-300 ml-2 cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3.5 mr-1" />
            NOVO LEAD
          </Button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 p-6 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center flex-col gap-2">
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Carregando pipeline...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full overflow-hidden">
            {STAGES.map((stage, idx) => {
              const stageLeads = getStageLeads(stage.id)
              const stageTotal = getStageTotal(stage.id)
              const isOver = dragOverCol === stage.id

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={`kanban-column double-bezel-card bg-muted/10 ring-1 p-1 rounded-2xl flex flex-col h-full overflow-hidden transition-all duration-300 ${
                    isOver ? "ring-primary/45 bg-primary/5 border-primary/20 scale-[1.01]" : "ring-border/50"
                  }`}
                >
                  <div className="bg-card/50 border border-border/10 rounded-[calc(1rem-0.25rem)] flex flex-col h-full overflow-hidden p-3">
                    {/* Stage Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/40 shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold tracking-wider font-display text-foreground`}>
                            {stage.label}
                          </span>
                          <span className="text-[9px] font-bold bg-muted text-muted-foreground ring-1 ring-border rounded-full px-2 py-0.2">
                            {stageLeads.length}
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                          {formatCurrency(stageTotal)}
                        </div>
                      </div>
                      <button
                        onClick={() => openCreateModal(stage.id)}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all active:scale-[0.95]"
                      >
                        <HugeiconsIcon icon={Add01Icon} className="size-4" />
                      </button>
                    </div>

                    {/* Leads Cards List */}
                    <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1 no-scrollbar">
                      {stageLeads.length === 0 ? (
                        <div className="h-28 flex flex-col items-center justify-center border border-dashed border-border/40 rounded-xl p-4 text-center">
                          <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                            Nenhum lead
                          </span>
                        </div>
                      ) : (
                        stageLeads.map(lead => (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onDragEnd={handleDragEnd}
                            className={`double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1 rounded-xl cursor-grab active:cursor-grabbing hover:ring-primary/30 transition-all duration-300 ${
                              draggedLeadId === lead.id ? "opacity-40" : ""
                            }`}
                          >
                            <div className="bg-card rounded-[calc(0.75rem-0.25rem)] p-3 border border-border/20 shadow-sm relative group">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[11px] font-medium text-foreground tracking-tight line-clamp-2">
                                  {lead.name}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditModal(lead)}
                                    className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-all active:scale-[0.9]"
                                  >
                                    <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.5} className="size-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="p-1 hover:bg-muted text-muted-foreground hover:text-destructive rounded transition-all active:scale-[0.9]"
                                  >
                                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs font-semibold text-foreground">
                                  {formatCurrency(lead.value)}
                                </span>

                                {/* Stage indicators or arrows for mobile/tablet */}
                                <div className="flex items-center gap-1">
                                  {idx > 0 && (
                                    <button
                                      onClick={() => handleUpdateStatus(lead.id, STAGES[idx - 1].id)}
                                      className="p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-all active:scale-[0.9]"
                                      title="Mover para esquerda"
                                    >
                                      <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.5} className="size-3" />
                                    </button>
                                  )}
                                  {idx < STAGES.length - 1 && (
                                    <button
                                      onClick={() => handleUpdateStatus(lead.id, STAGES[idx + 1].id)}
                                      className="p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-all active:scale-[0.9]"
                                      title="Mover para direita"
                                    >
                                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="size-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal - New/Edit Lead */}
      {showModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">
                {modalMode === "create" ? "Criar Novo Lead" : "Editar Lead"}
              </h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                {modalMode === "create"
                  ? "Adicione uma nova oportunidade de venda ao seu funil."
                  : "Atualize os detalhes da oportunidade comercial."}
              </p>

              <form onSubmit={handleSaveLead} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="l-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                    Nome da Oportunidade
                  </Label>
                  <Input
                    id="l-name"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Ex: Contrato de Tráfego - Empresa X"
                    className="bg-muted/10 border-border/40 text-xs h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="l-value" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                      Valor Estimado (R$)
                    </Label>
                    <Input
                      id="l-value"
                      type="number"
                      required
                      value={leadValue}
                      onChange={(e) => setLeadValue(e.target.value)}
                      placeholder="Ex: 2500"
                      className="bg-muted/10 border-border/40 text-xs h-10"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="l-status" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                      Etapa do Funil
                    </Label>
                    <select
                      id="l-status"
                      value={leadStatus}
                      onChange={(e) => setLeadStatus(e.target.value as Lead["status"])}
                      className="bg-card border border-border/40 rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 h-10 w-full"
                    >
                      {STAGES.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300 cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300 cursor-pointer"
                  >
                    {modalMode === "create" ? "Criar Lead" : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating double-bezel toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1 rounded-2xl shadow-2xl">
            <div className="bg-card rounded-[calc(1rem-0.25rem)] p-3 px-4 flex items-center gap-3 max-w-sm">
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
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
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
