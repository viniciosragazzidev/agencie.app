# Project-Based Client Panel & Complete Budget Forms

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize the client detail dashboard (`/clients/[id]`) to be project-centric — initially showing nothing until a project is created, with a project selector at the top — and build a comprehensive budget/proposal form with structured services, costs, deliverables, and payment terms.

**Architecture:** The client detail page becomes a thin shell that loads projects first, then renders project-scoped data only after a project is selected. A `ProjectSelector` component sits at the top. The proposal modal gets a full redesign as a multi-step wizard with services breakdown, cost summary, deliverables timeline, and payment terms.

**Tech Stack:** Next.js App Router, Drizzle ORM, shadcn/ui, GSAP, Hugeicons, React state

---

## Part 1: Project-Based Client Panel

### Task 1: Create ProjectSelector Component

**Files:**
- Create: `components/project-selector.tsx`

**Step 1: Create the component**

Create a `ProjectSelector` that:
- Fetches projects via `GET /api/projects?clientId={id}`
- Shows a shadcn `Select` with project names + status badges
- Has a "Criar Novo Projeto" option in dropdown
- Shows empty state with CTA when no projects exist
- Emits `onProjectChange(projectId)` and `onCreateProject()`

```tsx
"use client"
import React, { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Add01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface Project {
  id: string
  name: string
  status: "planning" | "in_progress" | "review" | "done" | "cancelled"
  budget?: string
}

interface ProjectSelectorProps {
  clientId: string
  selectedProjectId: string | null
  onProjectChange: (projectId: string) => void
  onCreateProject: () => void
  onRefresh?: () => void
}

const STATUS_LABELS: Record<string, string> = {
  planning: "Planejamento",
  in_progress: "Em Andamento",
  review: "Revisão",
  done: "Concluído",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  review: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  done: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
}

export function ProjectSelector({ clientId, selectedProjectId, onProjectChange, onCreateProject, onRefresh }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const loadProjects = () => {
    fetch(`/api/projects?clientId=${clientId}`)
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []) })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [clientId])

  useEffect(() => { if (onRefresh) onRefresh() }, [])

  if (loading) {
    return <div className="h-10 w-full animate-pulse rounded-xl bg-muted/50" />
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-border/40 rounded-2xl bg-muted/5">
        <HugeiconsIcon icon={FolderOpenIcon} className="size-10 text-muted-foreground/40 mb-3" />
        <p className="text-xs font-semibold text-muted-foreground mb-1">Nenhum projeto encontrado</p>
        <p className="text-[10px] text-muted-foreground/60 mb-4 text-center">Crie um projeto para começar a gerenciar este cliente.</p>
        <Button onClick={onCreateProject} size="sm" className="gap-1.5 text-[10px] font-bold h-8 px-4 rounded-xl">
          <HugeiconsIcon icon={Add01Icon} className="size-3.5" /> Criar Primeiro Projeto
        </Button>
      </div>
    )
  }

  return (
    <Select value={selectedProjectId || ""} onValueChange={(v) => { if (v === "__new__") { onCreateProject() } else { onProjectChange(v) } }}>
      <SelectTrigger className="h-10 text-xs font-semibold rounded-xl border-border/40 bg-muted/10">
        <SelectValue placeholder="Selecionar projeto..." />
      </SelectTrigger>
      <SelectContent>
        {projects.map(p => (
          <SelectItem key={p.id} value={p.id} className="text-xs">
            <div className="flex items-center gap-2">
              <span>{p.name}</span>
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[p.status] || ""}`}>
                {STATUS_LABELS[p.status] || p.status}
              </span>
            </div>
          </SelectItem>
        ))}
        <SelectItem value="__new__" className="text-xs text-primary font-semibold">
          + Criar Novo Projeto
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
```

---

### Task 2: Create CreateProjectModal Component

**Files:**
- Create: `components/create-project-modal.tsx`

**Step 1: Create the modal**

A modal form with: Nome (required), Descrição, Orçamento, Data Início, Data Fim. Calls `POST /api/projects`.

```tsx
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
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs font-semibold h-10 px-4">Cancelar</Button>
              <Button type="submit" disabled={creating} className="rounded-xl text-xs font-semibold h-10 px-6">
                {creating ? "Criando..." : "Criar Projeto"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 3: Create ProjectInfoBar Component

**Files:**
- Create: `components/project-info-bar.tsx`

**Step 1: Create compact project info bar**

Shows when a project is selected: name (editable), status badge (clickable to cycle), budget, task progress.

```tsx
"use client"
import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ProjectInfoBarProps {
  project: {
    id: string; name: string; status: string; budget?: string; startDate?: string; endDate?: string
  }
  taskStats: { total: number; done: number }
  onUpdate: (id: string, data: { name?: string; status?: string; budget?: string }) => void
}

const STATUS_FLOW = ["planning", "in_progress", "review", "done"]

export function ProjectInfoBar({ project, taskStats, onUpdate }: ProjectInfoBarProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(project.name)
  const [budget, setBudget] = useState(project.budget || "")

  const progress = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0
  const cycleStatus = () => {
    const idx = STATUS_FLOW.indexOf(project.status)
    onUpdate(project.id, { status: STATUS_FLOW[(idx + 1) % STATUS_FLOW.length] })
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/5 border border-border/20 rounded-xl">
      {editing ? (
        <>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs font-semibold flex-1" />
          <Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="Orçamento" className="h-8 text-xs w-24" />
          <Button size="sm" variant="outline" onClick={() => { onUpdate(project.id, { name, budget }); setEditing(false) }} className="h-7 text-[9px]">Salvar</Button>
        </>
      ) : (
        <>
          <span className="text-xs font-semibold text-foreground truncate">{project.name}</span>
          <button onClick={cycleStatus} className="shrink-0">
            <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-wider cursor-pointer hover:bg-primary/10 transition-colors">
              {project.status}
            </Badge>
          </button>
          {project.budget && <span className="text-[10px] text-muted-foreground shrink-0">R$ {parseFloat(project.budget).toLocaleString()}</span>}
          <div className="flex-1" />
          <span className="text-[9px] text-muted-foreground shrink-0">{taskStats.done}/{taskStats.total} tarefas</span>
          <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden shrink-0">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-7 text-[9px] px-2">Editar</Button>
        </>
      )}
    </div>
  )
}
```

---

### Task 4: Add projectId to Task API Filtering

**Files:**
- Modify: `app/api/client-portal/tasks/route.ts`

**Step 1: Add projectId query param**

```tsx
const projectId = searchParams.get("projectId")
if (projectId) {
  conditions.push(eq(projectTask.projectId, projectId))
}
```

---

### Task 5: Create BudgetProposalWizard Component

**Files:**
- Create: `components/budget-proposal-wizard.tsx`

**Step 1: Create the multi-step wizard**

4 steps: Dados Gerais → Serviços e Custos → Entregáveis → Condições Comerciais → Revisão

Each step has structured fields as detailed in the plan. Uses dynamic service/deliverable lists with add/remove. Auto-calculates totals. Includes AI enhancement button on review step. Saves via `POST /api/client-portal/proposals`.

(Full component code in the plan document - ~300 lines)

---

### Task 6: Refactor Client Detail Page to Project-Centric

**Files:**
- Modify: `app/(app)/clients/[id]/page.tsx`

**Changes:**
1. Add `selectedProjectId` and `showCreateProjectModal` state
2. Add `clientProjects` state, fetched via `/api/projects?clientId={id}`
3. Import `ProjectSelector`, `CreateProjectModal`, `ProjectInfoBar`, `BudgetProposalWizard`
4. Place `ProjectSelector` at top of main content area (before tabs)
5. Gate task fetching behind `selectedProjectId`:
   ```tsx
   useEffect(() => {
     if (selectedProjectId) {
       fetch(`/api/client-portal/tasks?clientId=${id}&projectId=${selectedProjectId}`)
         .then(r => r.json()).then(setTasks).catch(() => {})
     }
   }, [selectedProjectId])
   ```
6. Show `ProjectInfoBar` when project is selected (below selector, above tabs)
7. Replace old proposal modal with `BudgetProposalWizard`
8. Remove old proposal state variables and modal HTML
9. Wire `CreateProjectModal` to set newly created project as selected

---

## Execution Order

1. Task 1 → `ProjectSelector` component
2. Task 2 → `CreateProjectModal` component
3. Task 3 → `ProjectInfoBar` component
4. Task 4 → Task API `projectId` filtering
5. Task 5 → `BudgetProposalWizard` component
6. Task 6 → Refactor client detail page (uses all above)

## Verification

After all tasks:
1. `npx tsc --noEmit` — zero errors
2. `/clients` → click client → ProjectSelector empty state → "Criar Primeiro Projeto"
3. Create project → page shows project info bar + tabs
4. Switch projects via selector → task data updates
5. Click "Gerar Proposta" → multi-step wizard → fill all steps → save
6. Verify proposal appears in documents tab
