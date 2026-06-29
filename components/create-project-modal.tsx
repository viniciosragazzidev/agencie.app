"use client"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface CreateProjectModalProps {
  clientId: string
  open: boolean
  onClose: () => void
  onCreated: (project: { id: string; name: string; status: string }) => void
}

export function CreateProjectModal({ clientId, open, onClose, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [creating, setCreating] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          name: name.trim(),
          description: description.trim() || undefined,
          budget: budget || "0",
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      })
      if (res.ok) {
        const project = await res.json()
        onCreated(project)
        setName(""); setDescription(""); setBudget(""); setStartDate(""); setEndDate("")
        onClose()
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-lg rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
        <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
          <button onClick={onClose} className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300">
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          </button>
          <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Criar Novo Projeto</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Defina os dados iniciais do projeto para este cliente.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nome do Projeto *</Label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Redesign do Site Institucional" className="bg-muted/10 border-border/40 text-xs" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Descrição</Label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Descreva o escopo e objetivos..." className="w-full p-2.5 bg-muted/10 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Orçamento (R$)</Label>
                <Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="0.00" className="bg-muted/10 border-border/40 text-xs" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Data Início</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-muted/10 border-border/40 text-xs" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Data Fim</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-muted/10 border-border/40 text-xs" />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300">Cancelar</Button>
              <Button type="submit" disabled={creating} className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all duration-300">
                {creating ? "Criando..." : "Criar Projeto"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
