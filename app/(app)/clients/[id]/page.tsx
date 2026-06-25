"use client"

import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building01Icon,
  UserIcon,
  TelephoneIcon,
  Mail01Icon,
  Location01Icon,
  ArrowLeft01Icon,
  Add01Icon,
  Coins01Icon,
  ZapIcon,
  Message01Icon,
  Briefcase01Icon,
  InvoiceIcon,
  Cancel01Icon,
  FolderOpenIcon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  MapPinIcon,
  LinkSquare02Icon,
  InstagramIcon,
  Linkedin01Icon,
  Facebook01Icon,
  TwitterIcon,
  Copy01Icon
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { authClient } from "@/lib/auth-client"
import { ApprovalPanel } from "@/components/approval-panel"
import { AssetsHub } from "@/components/assets-hub"
import { ClientNotesPanel } from "@/components/client-notes-panel"
import { OnboardingChecklist } from "@/components/onboarding-checklist"
import { QuicklinksHub } from "@/components/quicklinks-hub"
import { ScopeWall } from "@/components/scope-wall"
import { AdSpendMeter } from "@/components/ad-spend-meter"
import { Calendar03Icon, Link01Icon, Shield01Icon, Chart01Icon, HelpCircleIcon } from "@hugeicons/core-free-icons"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface Client {
  id: string
  name: string
  industry?: string | null
  status: "Ativo" | "Em Risco" | "Onboarding"
  projects: string
  mrr: string
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  notes?: string | null
  socials?: Record<string, string> | null
  websites?: string[] | null
}

interface KanbanTask {
  id: string
  title: string
  status: "todo" | "in_progress" | "done"
}

interface Service {
  id: string
  name: string
  price: string
  billing: "mensal" | "anual" | "unico"
  description?: string
}

interface Proposal {
  id: string
  title: string
  value: string
  status: "pending" | "approved" | "rejected"
  niche: string
  scope: string
}

export default function ClientDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: session } = authClient.useSession()
  const userId = session?.user?.id || ""

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Kanban states
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")

  // Services states
  const [services, setServices] = useState<Service[]>([])
  const [globalServices, setGlobalServices] = useState<Service[]>([])
  const [showCatalogModal, setShowCatalogModal] = useState(false)

  // Proposals states
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalPreview, setProposalPreview] = useState<Proposal | null>(null)

  const [newProposalTitle, setNewProposalTitle] = useState("")
  const [newProposalValue, setNewProposalValue] = useState("")
  const [newProposalNiche, setNewProposalNiche] = useState("")
  const [newProposalScope, setNewProposalScope] = useState("")
  const [generatingProposal, setGeneratingProposal] = useState(false)

  // Pós-venda states
  const [approvals, setApprovals] = useState<{ id: string; title: string; description?: string; fileType: string; status: "pending" | "approved" | "revision"; clientComment?: string }[]>([])
  const [clientAssets, setClientAssets] = useState<{ id: string; name: string; category: string; fileUrl?: string; linkUrl?: string; notes?: string }[]>([])
  const [clientNotes, setClientNotes] = useState<{ id: string; content: string; tag: string; createdAt: string }[]>([])
  const [onboardingTasks, setOnboardingTasks] = useState<{ id: string; title: string; description?: string; isRequired: boolean; isCompleted: boolean }[]>([])
  const [quicklinks, setQuicklinks] = useState<{ id: string; label: string; url: string; icon?: string }[]>([])
  const [scopes, setScopes] = useState<{ id: string; label: string; totalQuota: number; usedQuota: number; period: string }[]>([])
  const [adSpendTrackers, setAdSpendTrackers] = useState<{ id: string; month: string; plannedBudget: string; spentAmount: string; platform: string }[]>([])

  const deleteClientService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId))
    triggerToast("Serviço desassociado do cliente!")
  }  // AI suggestions list
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    "Sugerir expansão para Cloud Hosting próprio para aumentar margem.",
    "Iniciar conversa de onboarding para configurar integração WhatsApp API.",
    "Propor serviço adicional de Otimização de SEO (Valor estimado: R$ 2.400)."
  ])

  // Custom Tabs state
  const [activeTab, setActiveTab] = useState<"crm" | "financial" | "delivery" | "notes">("crm")

  // Active Creation Modals
  const [showApprovalModalNew, setShowApprovalModalNew] = useState(false)
  const [showScopeModalNew, setShowScopeModalNew] = useState(false)
  const [showAssetModalNew, setShowAssetModalNew] = useState(false)
  const [showAdSpendModalNew, setShowAdSpendModalNew] = useState(false)
  const [showQuicklinkModalNew, setShowQuicklinkModalNew] = useState(false)

  // Creation Form States
  const [newApprovalTitle, setNewApprovalTitle] = useState("")
  const [newApprovalDescription, setNewApprovalDescription] = useState("")
  const [newApprovalFileType, setNewApprovalFileType] = useState("document")
  const [newApprovalFileUrl, setNewApprovalFileUrl] = useState("")
  const [creatingApproval, setCreatingApproval] = useState(false)

  const [newScopeLabel, setNewScopeLabel] = useState("")
  const [newScopeTotalQuota, setNewScopeTotalQuota] = useState("")
  const [newScopePeriod, setNewScopePeriod] = useState("monthly")
  const [creatingScope, setCreatingScope] = useState(false)

  const [newAssetName, setNewAssetName] = useState("")
  const [newAssetCategory, setNewAssetCategory] = useState("logo")
  const [newAssetLinkUrl, setNewAssetLinkUrl] = useState("")
  const [newAssetNotes, setNewAssetNotes] = useState("")
  const [creatingAsset, setCreatingAsset] = useState(false)

  const [newAdSpendMonth, setNewAdSpendMonth] = useState("")
  const [newAdSpendPlanned, setNewAdSpendPlanned] = useState("")
  const [newAdSpendPlatform, setNewAdSpendPlatform] = useState("")
  const [creatingAdSpend, setCreatingAdSpend] = useState(false)

  const [newQuicklinkLabel, setNewQuicklinkLabel] = useState("")
  const [newQuicklinkUrl, setNewQuicklinkUrl] = useState("")
  const [creatingQuicklink, setCreatingQuicklink] = useState(false)

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Active Creation Handlers
  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newApprovalTitle.trim()) return
    setCreatingApproval(true)
    try {
      const res = await fetch("/api/client-portal/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          userId,
          title: newApprovalTitle,
          description: newApprovalDescription,
          fileType: newApprovalFileType,
          fileUrl: newApprovalFileUrl || undefined,
        }),
      })
      if (res.ok) {
        const item = await res.json()
        setApprovals(prev => [item, ...prev])
        setNewApprovalTitle("")
        setNewApprovalDescription("")
        setNewApprovalFileUrl("")
        setShowApprovalModalNew(false)
        triggerToast("Solicitação de aprovação criada!")
      } else {
        triggerToast("Erro ao criar aprovação.", "error")
      }
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao criar aprovação.", "error")
    } finally {
      setCreatingApproval(false)
    }
  }

  const handleCreateScope = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScopeLabel.trim() || !newScopeTotalQuota.trim()) return
    setCreatingScope(true)
    try {
      const res = await fetch("/api/client-portal/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          userId,
          label: newScopeLabel,
          totalQuota: parseInt(newScopeTotalQuota),
          period: newScopePeriod,
        }),
      })
      if (res.ok) {
        const item = await res.json()
        setScopes(prev => [...prev, item])
        setNewScopeLabel("")
        setNewScopeTotalQuota("")
        setShowScopeModalNew(false)
        triggerToast("Item de escopo cadastrado com sucesso!")
      } else {
        triggerToast("Erro ao cadastrar escopo.", "error")
      }
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao cadastrar escopo.", "error")
    } finally {
      setCreatingScope(false)
    }
  }

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssetName.trim()) return
    setCreatingAsset(true)
    try {
      const res = await fetch("/api/client-portal/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          userId,
          name: newAssetName,
          category: newAssetCategory,
          linkUrl: newAssetLinkUrl || undefined,
          notes: newAssetNotes || undefined,
        }),
      })
      if (res.ok) {
        const item = await res.json()
        setClientAssets(prev => [...prev, item])
        setNewAssetName("")
        setNewAssetLinkUrl("")
        setNewAssetNotes("")
        setShowAssetModalNew(false)
        triggerToast("Entregável adicionado com sucesso!")
      } else {
        triggerToast("Erro ao adicionar entregável.", "error")
      }
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao adicionar entregável.", "error")
    } finally {
      setCreatingAsset(false)
    }
  }

  const handleCreateAdSpend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdSpendMonth.trim() || !newAdSpendPlanned.trim() || !newAdSpendPlatform.trim()) return
    setCreatingAdSpend(true)
    try {
      const res = await fetch("/api/client-portal/ad-spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          userId,
          month: newAdSpendMonth,
          plannedBudget: newAdSpendPlanned,
          platform: newAdSpendPlatform,
          dailyPace: "0.0",
        }),
      })
      if (res.ok) {
        const item = await res.json()
        setAdSpendTrackers(prev => [...prev, item])
        setNewAdSpendMonth("")
        setNewAdSpendPlanned("")
        setNewAdSpendPlatform("")
        setShowAdSpendModalNew(false)
        triggerToast("Rastreamento de verba configurado!")
      } else {
        triggerToast("Erro ao criar rastreamento.", "error")
      }
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao criar rastreamento.", "error")
    } finally {
      setCreatingAdSpend(false)
    }
  }

  const handleCreateQuicklink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuicklinkLabel.trim() || !newQuicklinkUrl.trim()) return
    setCreatingQuicklink(true)
    try {
      const res = await fetch("/api/client-portal/quicklinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          userId,
          label: newQuicklinkLabel,
          url: newQuicklinkUrl.startsWith("http") ? newQuicklinkUrl : `https://${newQuicklinkUrl}`,
          position: quicklinks.length + 1,
        }),
      })
      if (res.ok) {
        const item = await res.json()
        setQuicklinks(prev => [...prev, item])
        setNewQuicklinkLabel("")
        setNewQuicklinkUrl("")
        setShowQuicklinkModalNew(false)
        triggerToast("Link rápido adicionado com sucesso!")
      } else {
        triggerToast("Erro ao adicionar link rápido.", "error")
      }
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao adicionar link rápido.", "error")
    } finally {
      setCreatingQuicklink(false)
    }
  }

  // Load client detail and global services
  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await fetch(`/api/clients/${id}`)
        if (res.ok) {
          const data = await res.json()
          setClient(data)
        } else {
          triggerToast("Cliente não encontrado.", "error")
        }
      } catch (err) {
        console.error(err)
        triggerToast("Erro ao carregar detalhes do cliente.", "error")
      } finally {
        setLoading(false)
      }
    }

    async function loadGlobalServices() {
      try {
        const res = await fetch("/api/services")
        if (res.ok) {
          const data = await res.json()
          setGlobalServices(data)
        }
      } catch (err) {
        console.error(err)
      }
    }

    async function loadTasks() {
      try {
        const res = await fetch(`/api/client-portal/tasks?clientId=${id}`)
        if (res.ok) {
          const data = await res.json()
          setTasks(data)
        }
      } catch (err) {
        console.error(err)
      }
    }

    if (id) {
      loadDetail()
      loadGlobalServices()
      loadTasks()

      // Pós-venda fetches
      fetch(`/api/client-portal/approvals?clientId=${id}`).then(r => r.json()).then(setApprovals).catch(() => {})
      fetch(`/api/client-portal/assets?clientId=${id}`).then(r => r.json()).then(setClientAssets).catch(() => {})
      fetch(`/api/client-portal/notes?clientId=${id}`).then(r => r.json()).then(setClientNotes).catch(() => {})
      fetch(`/api/client-portal/onboarding?clientId=${id}`).then(r => r.json()).then(setOnboardingTasks).catch(() => {})
      fetch(`/api/client-portal/quicklinks?clientId=${id}`).then(r => r.json()).then(setQuicklinks).catch(() => {})
      fetch(`/api/client-portal/scope?clientId=${id}`).then(r => r.json()).then(setScopes).catch(() => {})
      fetch(`/api/client-portal/ad-spend?clientId=${id}`).then(r => r.json()).then(setAdSpendTrackers).catch(() => {})
    }
  }, [id])

  const addGlobalServiceToClient = (gService: Service) => {
    if (services.some(s => s.name === gService.name)) {
      triggerToast("Este serviço já está ativo para este cliente.", "error")
      return
    }
    setServices(prev => [...prev, gService])
    setShowCatalogModal(false)
    triggerToast(`Serviço "${gService.name}" associado com sucesso!`)
  }

  // GSAP entrance staggers
  useGSAP(() => {
    if (!loading) {
      gsap.from(".bento-detail-item", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        clearProps: "all"
      })
    }
  }, { dependencies: [loading], scope: containerRef })

  // GSAP Tab content transition stagger
  useGSAP(() => {
    if (!loading) {
      gsap.fromTo(".tab-content-item", 
        { y: 12, opacity: 0, scale: 0.99 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.04, ease: "cubic-bezier(0.32,0.72,0,1)", clearProps: "all" }
      )
    }
  }, { dependencies: [activeTab, loading], scope: containerRef })

  // Kanban task management
  const addTask = async (status: "todo" | "in_progress" | "done") => {
    if (!newTaskTitle.trim()) return
    const res = await fetch("/api/client-portal/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id, userId, title: newTaskTitle, status }),
    })
    const task = await res.json()
    setTasks(prev => [...prev, task])
    setNewTaskTitle("")
    triggerToast("Tarefa adicionada!")
  }

  const moveTask = async (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    await fetch(`/api/client-portal/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    triggerToast("Tarefa movida com sucesso!")
  }

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/client-portal/tasks/${taskId}`, { method: "DELETE" })
    setTasks(prev => prev.filter(t => t.id !== taskId))
    triggerToast("Tarefa removida!")
  }

  // Aprovações
  const handleApprove = async (approvalId: string) => {
    await fetch(`/api/client-portal/approvals/${approvalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    })
    setApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status: "approved" as const } : a))
    triggerToast("Aprovação confirmada!")
  }

  const handleRevision = async (approvalId: string, comment: string) => {
    await fetch(`/api/client-portal/approvals/${approvalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "revision", clientComment: comment }),
    })
    setApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status: "revision" as const } : a))
    triggerToast("Solicitação de ajuste enviada!")
  }

  // Notas
  const handleAddNote = async (content: string, tag: string) => {
    const res = await fetch("/api/client-portal/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id, userId, content, tag }),
    })
    const note = await res.json()
    setClientNotes(prev => [note, ...prev])
    triggerToast("Nota salva!")
  }

  // Onboarding
  const handleToggleOnboarding = async (taskId: string, completed: boolean) => {
    await fetch(`/api/client-portal/onboarding/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: completed }),
    })
    setOnboardingTasks(prev => prev.map(t => t.isCompleted === completed ? t : { ...t, isCompleted: completed }))
  }

  // Proposals management
  const handleCreateProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProposalTitle.trim() || !newProposalValue.trim()) return
    const p: Proposal = {
      id: Date.now().toString(),
      title: newProposalTitle,
      value: newProposalValue,
      status: "pending",
      niche: newProposalNiche || "Geral",
      scope: newProposalScope || "Escopo comercial sob demanda."
    }
    setProposals(prev => [p, ...prev])
    setNewProposalTitle("")
    setNewProposalValue("")
    setNewProposalNiche("")
    setNewProposalScope("")
    setShowProposalModal(false)
    triggerToast("Proposta comercial salva!")
  }

  // AI Proposal generation simulator
  const handleAiProposalGenerate = () => {
    if (!client) return
    setGeneratingProposal(true)
    setTimeout(() => {
      setNewProposalTitle(`Planejamento de Expansão Digital - ${client.name}`)
      setNewProposalValue("R$ 24.500,00 único + R$ 1.200,00 mensal")
      setNewProposalNiche(client.industry || "Tecnologia")
      setNewProposalScope(`PROPOSTA COMERCIAL PREMIUM\n\n1. Otimização SEO local e posicionamento de marca.\n2. Integração do Funil CRM para automatizar a jornada do lead.\n3. Suporte dedicado Kyper com SLA de resposta de 2 horas.`)
      setGeneratingProposal(false)
      triggerToast("Proposta estruturada pela IA!")
    }, 1500)
  }

  const handleStartOutreach = () => {
    if (!client) return
    const defaultApproach = `Olá ${client.contactName || "representante da " + client.name}, somos especialistas no ramo de ${client.industry || "serviços"} e gostaríamos de apresentar nossa proposta para otimizar os seus projetos ativos.`
    const encodedName = encodeURIComponent(client.name)
    const encodedContact = encodeURIComponent(client.contactName || "")
    const encodedPhone = encodeURIComponent(client.contactPhone || "")
    const encodedApproach = encodeURIComponent(defaultApproach)
    router.push(`/inbox?clientName=${encodedName}&contactName=${encodedContact}&contactPhone=${encodedPhone}&approach=${encodedApproach}`)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-screen">
        <span className="text-xs text-muted-foreground animate-pulse">Carregando bancada do cliente...</span>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background h-screen gap-4">
        <span className="text-xs text-muted-foreground">Cliente não encontrado.</span>
        <Button variant="outline" onClick={() => router.push("/clients")} className="text-xs">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" /> Voltar para lista
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      
      {/* Header Bar */}
      <header className="border-b border-border/40 p-4 bg-card/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/clients")} className="rounded-xl border border-border/40 hover:bg-muted active:scale-[0.98] transition-all duration-300">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 text-foreground" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground tracking-tight">{client.name}</h1>
              {client.industry && (
                <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                  {client.industry}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Cockpit de Operação Integrada</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleStartOutreach} variant="outline" className="text-xs h-9 gap-1.5 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-semibold">
            <HugeiconsIcon icon={Message01Icon} className="size-4" />
            Iniciar Abordagem
          </Button>
        </div>
      </header>

      {/* Main Grid View - Fixed viewport height layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-6 overflow-hidden min-h-0">
        
        {/* Left Sidebar (Col-span 4) */}
        <aside className="xl:col-span-4 flex flex-col gap-5 overflow-y-auto no-scrollbar h-full pr-1 shrink-0">
          
          {/* Profile Details (Double Bezel) */}
          <div className="double-bezel-card bento-detail-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 border border-border/20 space-y-5">
              
              <div className="flex items-start gap-4 pb-4 border-b border-border/20">
                <div className="size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Building01Icon} className="size-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-foreground truncate">{client.name}</h2>
                    <span className={`text-[9px] font-bold tracking-widest ring-1 rounded-full px-2 py-0.5 uppercase shrink-0 ${
                      client.status === 'Ativo' ? 'bg-primary/10 text-primary ring-primary/20' :
                      client.status === 'Em Risco' ? 'bg-destructive/10 text-destructive ring-destructive/20' :
                      'bg-secondary text-secondary-foreground ring-border/50'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{client.industry || "Ramo não especificado"}</p>
                </div>
              </div>

              {/* MRR display */}
              <div className="flex items-center justify-between bg-muted/5 border border-border/20 rounded-xl p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Faturamento MRR</p>
                  <p className="text-xl font-display font-semibold text-foreground mt-0.5">R$ {(parseFloat(client.mrr) || 0).toLocaleString()}</p>
                </div>
                <div className="size-8 rounded-lg bg-primary/5 border border-border/20 flex items-center justify-center">
                  <HugeiconsIcon icon={Coins01Icon} className="size-4 text-primary" />
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-2 text-[10px] font-medium text-muted-foreground">
                <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5">Contatos Principais</p>
                
                {client.contactName && (
                  <div className="flex items-center gap-2 py-1 border-b border-border/10">
                    <HugeiconsIcon icon={UserIcon} className="size-3.5 shrink-0 text-muted-foreground/80" />
                    <span className="text-foreground truncate">{client.contactName}</span>
                  </div>
                )}
                
                {client.contactPhone && (
                  <div className="flex items-center justify-between py-1 border-b border-border/10 group/phone">
                    <a href={`tel:${client.contactPhone.replace(/\D/g, '')}`} className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer truncate">
                      <HugeiconsIcon icon={TelephoneIcon} className="size-3.5 shrink-0 text-muted-foreground/80" />
                      <span className="text-foreground truncate">{client.contactPhone}</span>
                    </a>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(client.contactPhone!); triggerToast("Telefone copiado!"); }}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors opacity-0 group-hover/phone:opacity-100"
                    >
                      <HugeiconsIcon icon={Copy01Icon} className="size-3" />
                    </button>
                  </div>
                )}

                {client.contactEmail && (
                  <div className="flex items-center justify-between py-1 border-b border-border/10 group/email">
                    <a href={`mailto:${client.contactEmail}`} className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer truncate">
                      <HugeiconsIcon icon={Mail01Icon} className="size-3.5 shrink-0 text-muted-foreground/80" />
                      <span className="text-foreground truncate">{client.contactEmail}</span>
                    </a>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(client.contactEmail!); triggerToast("Email copiado!"); }}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors opacity-0 group-hover/email:opacity-100"
                    >
                      <HugeiconsIcon icon={Copy01Icon} className="size-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Websites & Socials */}
              {(client.websites?.length || (client.socials && Object.keys(client.socials).length > 0)) && (
                <div className="pt-2">
                  <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Canais Digitais</p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.websites?.map((url, i) => (
                      <a key={i} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[8px] font-bold tracking-widest bg-muted/40 text-foreground hover:bg-primary/10 hover:text-primary ring-1 ring-border/40 hover:ring-primary/20 rounded-full px-2 py-0.5 uppercase transition-colors active:scale-[0.98]">
                        <HugeiconsIcon icon={LinkSquare02Icon} className="size-2.5" />
                        {url.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    ))}
                    {client.socials && Object.entries(client.socials).map(([net, url]) => (
                      <a key={net} href={url as string} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[8px] font-bold tracking-widest bg-muted/40 text-foreground hover:bg-primary/10 hover:text-primary ring-1 ring-border/40 hover:ring-primary/20 rounded-full px-2 py-0.5 uppercase transition-colors active:scale-[0.98]">
                        {net.toLowerCase().includes('insta') ? <HugeiconsIcon icon={InstagramIcon} className="size-2.5" /> :
                         net.toLowerCase().includes('linked') ? <HugeiconsIcon icon={Linkedin01Icon} className="size-2.5" /> :
                         net.toLowerCase().includes('face') ? <HugeiconsIcon icon={Facebook01Icon} className="size-2.5" /> :
                         net.toLowerCase().includes('twit') || net.toLowerCase().includes('x') ? <HugeiconsIcon icon={TwitterIcon} className="size-2.5" /> :
                         <HugeiconsIcon icon={LinkSquare02Icon} className="size-2.5" />}
                        {net}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Location details */}
              <div className="pt-2 border-t border-border/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
                    <HugeiconsIcon icon={Location01Icon} className="size-2.5" /> Endereço corporativo
                  </p>
                  {client.street && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { navigator.clipboard.writeText(`${client.street}, ${client.city || ""} - ${client.state || ""}`); triggerToast("Endereço copiado!"); }} className="p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors" title="Copiar Endereço">
                        <HugeiconsIcon icon={Copy01Icon} className="size-3" />
                      </button>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${client.street}, ${client.city || ""} - ${client.state || ""}`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-[8px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase hover:bg-primary/20 transition-colors active:scale-[0.98]" title="Abrir no Mapa">
                        <HugeiconsIcon icon={MapPinIcon} className="size-2.5" /> Mapa
                      </a>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-foreground font-medium leading-relaxed">
                  {client.street ? `${client.street}, ${client.city || ""} - ${client.state || ""}` : "Endereço não informado"}
                </p>
              </div>

            </div>
          </div>

          {/* AI Insights (Double Bezel) */}
          <div className="double-bezel-card bento-detail-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 border border-border/20">
              <div className="flex items-center gap-2 mb-3">
                <HugeiconsIcon icon={ZapIcon} className="size-4 text-primary" />
                <h3 className="font-semibold text-xs text-foreground font-display">Sugestões de IA</h3>
              </div>
              <div className="space-y-2">
                {aiSuggestions.map((sug, i) => (
                  <div key={i} className="p-3 bg-muted/5 border border-border/30 rounded-xl flex gap-2">
                    <div className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">{sug}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quicklinks (Double Bezel) */}
          <div className="double-bezel-card bento-detail-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 border border-border/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Link01Icon} strokeWidth={1.5} className="size-4 text-primary" />
                  <h3 className="font-semibold text-xs text-foreground font-display">Links Rápidos</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger render={<button type="button" className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />}>
                        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.5} className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl max-w-xs">
                        Links úteis para o projeto do cliente (ex: Google Drive, Notion, Figma).
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  onClick={() => setShowQuicklinkModalNew(true)}
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md shrink-0 active:scale-[0.98] transition-all duration-300"
                >
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="size-3.5" />
                </Button>
              </div>
              {quicklinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-border/30 rounded-xl bg-muted/5">
                  <p className="text-[10px] text-muted-foreground">Nenhum link cadastrado.</p>
                  <Button
                    onClick={() => setShowQuicklinkModalNew(true)}
                    variant="link"
                    className="text-[9px] text-primary h-auto p-0 mt-1 font-bold uppercase tracking-wider"
                  >
                    Adicionar Link
                  </Button>
                </div>
              ) : (
                <QuicklinksHub links={quicklinks} />
              )}
            </div>
          </div>

        </aside>

        {/* Right Workbench / Operations Panel (Col-span 8) */}
        <section className="xl:col-span-8 flex flex-col h-full overflow-hidden min-h-0">
          
          {/* Custom Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-border/40 pb-3 shrink-0">
            {[
              { id: "crm", label: "CRM & Atividades" },
              { id: "financial", label: "Financeiro & Vendas" },
              { id: "delivery", label: "Entregas & Onboarding" },
              { id: "notes", label: "Anotações (Context)" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ring-1 ${
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary ring-primary/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground ring-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pt-5">
            
            {/* 1. CRM & Kanban Tab */}
            {activeTab === "crm" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 tab-content-item">
                
                {/* TO DO Column */}
                <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem] flex flex-col h-[480px]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-4 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-border/20">
                      <h3 className="font-semibold text-xs text-foreground font-display">A Fazer</h3>
                      <span className="text-[9px] font-bold bg-muted text-muted-foreground rounded px-1.5 py-0.5">{tasks.filter(t => t.status === 'todo').length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-2.5">
                      {tasks.filter(t => t.status === "todo").map(task => (
                        <div key={task.id} className="p-3 bg-muted/5 border border-border/30 rounded-xl space-y-2 hover:bg-muted/10 transition-colors">
                          <p className="text-xs text-foreground font-semibold leading-relaxed">{task.title}</p>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <Button variant="outline" size="xs" onClick={() => moveTask(task.id, "in_progress")} className="text-[9px] h-6 px-2 font-bold uppercase tracking-wider active:scale-[0.98] transition-all duration-300">Mover</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-border/20 flex gap-2">
                      <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Nova tarefa..." className="h-8 text-xs bg-muted/20 border-border/40" />
                      <Button size="sm" onClick={() => addTask("todo")} className="h-8 text-xs px-3 active:scale-[0.98] transition-all duration-300">Ok</Button>
                    </div>
                  </div>
                </div>

                {/* IN PROGRESS Column */}
                <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem] flex flex-col h-[480px]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-4 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-border/20">
                      <h3 className="font-semibold text-xs text-foreground font-display">Em Execução</h3>
                      <span className="text-[9px] font-bold bg-primary/10 text-primary rounded px-1.5 py-0.5">{tasks.filter(t => t.status === 'in_progress').length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-2.5">
                      {tasks.filter(t => t.status === "in_progress").map(task => (
                        <div key={task.id} className="p-3 bg-muted/5 border border-border/30 rounded-xl space-y-2 hover:bg-muted/10 transition-colors">
                          <p className="text-xs text-foreground font-semibold leading-relaxed">{task.title}</p>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <Button variant="outline" size="xs" onClick={() => moveTask(task.id, "todo")} className="text-[9px] h-6 px-2 font-bold uppercase tracking-wider active:scale-[0.98] transition-all duration-300">A Fazer</Button>
                            <Button size="xs" onClick={() => moveTask(task.id, "done")} className="text-[9px] h-6 px-2 font-bold uppercase tracking-wider active:scale-[0.98] transition-all duration-300">Concluir</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* DONE Column */}
                <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem] flex flex-col h-[480px]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-4 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-border/20">
                      <h3 className="font-semibold text-xs text-foreground font-display">Concluído</h3>
                      <span className="text-[9px] font-bold bg-primary/10 text-primary rounded px-1.5 py-0.5">{tasks.filter(t => t.status === 'done').length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-2.5">
                      {tasks.filter(t => t.status === "done").map(task => (
                        <div key={task.id} className="p-3 bg-muted/5 border border-border/30 rounded-xl space-y-2 hover:bg-muted/10 transition-colors">
                          <p className="text-xs text-muted-foreground font-semibold line-through leading-relaxed">{task.title}</p>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <Button variant="outline" size="xs" onClick={() => moveTask(task.id, "in_progress")} className="text-[9px] h-6 px-2 font-bold uppercase tracking-wider active:scale-[0.98] transition-all duration-300">Reabrir</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. Financeiro & Vendas Tab */}
            {activeTab === "financial" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 tab-content-item">
                
                {/* Active Services */}
                <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col h-[400px]">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/20 justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Briefcase01Icon} className="size-4 text-primary" />
                        <h3 className="font-semibold text-xs text-foreground font-display">Serviços Ativos</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button 
                          onClick={() => setShowCatalogModal(true)}
                          variant="outline"
                          className="h-7 text-[8px] font-bold uppercase tracking-wider gap-1 rounded-lg active:scale-[0.98] transition-all duration-300"
                        >
                          <HugeiconsIcon icon={Briefcase01Icon} className="size-3" /> Catálogo
                        </Button>
                        <Button 
                          onClick={() => router.push(`/clients/${id}/services/new`)}
                          className="h-7 text-[8px] font-bold uppercase tracking-wider gap-1 rounded-lg active:scale-[0.98] transition-all duration-300"
                        >
                          <HugeiconsIcon icon={Add01Icon} className="size-3" /> Novo
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5">
                      {services.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-xs text-muted-foreground">Nenhum serviço ativo associado.</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">Vincule do catálogo ou configure um novo serviço.</p>
                        </div>
                      ) : (
                        services.map(s => (
                          <div key={s.id} className="p-3 bg-muted/5 border border-border/30 rounded-2xl flex flex-col gap-1 relative group hover:bg-muted/10 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold text-foreground truncate pr-6">{s.name}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-foreground">R$ {parseFloat(s.price).toLocaleString()} <span className="text-[10px] font-medium text-muted-foreground">/{s.billing}</span></span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => deleteClientService(s.id)}
                                  className="size-6 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                            {s.description && (
                              <p className="text-[10px] text-muted-foreground leading-relaxed">{s.description}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Proposals */}
                <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col h-[400px]">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/20 justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={InvoiceIcon} className="size-4 text-primary" />
                        <h3 className="font-semibold text-xs text-foreground font-display">Propostas Comerciais</h3>
                      </div>
                      <Button 
                        onClick={() => setShowProposalModal(true)}
                        className="h-7 text-[8px] font-bold uppercase tracking-wider gap-1 rounded-lg active:scale-[0.98] transition-all duration-300"
                      >
                        <HugeiconsIcon icon={Add01Icon} className="size-3" /> Gerar Proposta
                      </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5">
                      {proposals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-xs text-muted-foreground">Nenhuma proposta comercial gerada.</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">Gere propostas inteligentes personalizadas para este cliente.</p>
                        </div>
                      ) : (
                        proposals.map(p => (
                          <div key={p.id} className="p-3 bg-muted/5 border border-border/30 rounded-2xl flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div>
                              <p className="text-xs font-semibold text-foreground">{p.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Valor Proposto: {p.value}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="xs"
                                onClick={() => setProposalPreview(p)}
                                className="h-6 text-[8px] font-bold uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all duration-300"
                              >
                                Visualizar
                              </Button>
                              <span className={`text-[8px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ring-1 ${
                                p.status === 'approved' ? 'bg-primary/10 text-primary ring-primary/20' :
                                p.status === 'rejected' ? 'bg-destructive/10 text-destructive ring-destructive/20' :
                                'bg-secondary text-secondary-foreground ring-border/50'
                              }`}>
                                {p.status === 'approved' ? 'Aprovada' : p.status === 'rejected' ? 'Recusada' : 'Aguardando'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Ad Spend Tracker */}
                <div className="double-bezel-card lg:col-span-2 bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Chart01Icon} strokeWidth={1.5} className="size-4 text-primary" />
                        <h3 className="font-semibold text-xs text-foreground font-display">Verba de Anúncios</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<button type="button" className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />}>
                              <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.5} className="size-3.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl max-w-xs">
                              Monitore o orçamento planejado versus gasto real em campanhas de tráfego pago (Meta Ads, Google Ads).
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        onClick={() => setShowAdSpendModalNew(true)}
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md shrink-0 active:scale-[0.98] transition-all duration-300"
                      >
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="size-3.5" />
                      </Button>
                    </div>
                    {adSpendTrackers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl bg-muted/5">
                        <p className="text-xs text-muted-foreground">Nenhum rastreamento de verba ativo.</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Defina um orçamento mensal planejado para as plataformas.</p>
                        <Button
                          onClick={() => setShowAdSpendModalNew(true)}
                          className="h-8 text-[9px] uppercase font-bold tracking-wider mt-3 rounded-lg active:scale-[0.98] transition-all duration-300"
                        >
                          Configurar Orçamento
                        </Button>
                      </div>
                    ) : (
                      <AdSpendMeter trackers={adSpendTrackers} />
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 3. Entregas & Onboarding Tab */}
            {activeTab === "delivery" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 tab-content-item">
                
                {/* Onboarding Checklist */}
                {client?.status === "Onboarding" && onboardingTasks.length > 0 && (
                  <div className="double-bezel-card lg:col-span-2 bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                    <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className="size-4 text-primary" />
                        <h3 className="font-semibold text-xs text-foreground font-display">Onboarding do Cliente</h3>
                      </div>
                      <OnboardingChecklist tasks={onboardingTasks} onToggle={handleToggleOnboarding} />
                    </div>
                  </div>
                )}

                {/* Pending Approvals */}
                <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col h-[380px]">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20 shrink-0">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className="size-4 text-primary" />
                        <h3 className="font-semibold text-xs text-foreground font-display">Aprovações Pendentes</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<button type="button" className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />}>
                              <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.5} className="size-3.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl max-w-xs">
                              Itens enviados para a aprovação formal do cliente (ex: artes, posts, copys, contratos).
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        onClick={() => setShowApprovalModalNew(true)}
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md shrink-0 active:scale-[0.98] transition-all duration-300"
                      >
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="size-3.5" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                      {approvals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-xs text-muted-foreground">Nenhuma aprovação pendente.</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Envie artes, textos ou links para o cliente aprovar.</p>
                          <Button
                            onClick={() => setShowApprovalModalNew(true)}
                            className="h-8 text-[9px] uppercase font-bold tracking-wider mt-3 rounded-lg active:scale-[0.98] transition-all duration-300"
                          >
                            Nova Solicitação
                          </Button>
                        </div>
                      ) : (
                        <ApprovalPanel items={approvals} onApprove={handleApprove} onRevision={handleRevision} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Contracted Scope */}
                <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col h-[380px]">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20 shrink-0">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Shield01Icon} strokeWidth={1.5} className="size-4 text-primary" />
                        <h3 className="font-semibold text-xs text-foreground font-display">Escopo Contratado</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<button type="button" className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />}>
                              <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.5} className="size-3.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl max-w-xs">
                              Limites operacionais de entrega acordados no contrato (ex: posts por mês, horas de desenvolvimento).
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        onClick={() => setShowScopeModalNew(true)}
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md shrink-0 active:scale-[0.98] transition-all duration-300"
                      >
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="size-3.5" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                      {scopes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-xs text-muted-foreground">Nenhum escopo configurado.</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Monitore limites mensais de demandas.</p>
                          <Button
                            onClick={() => setShowScopeModalNew(true)}
                            className="h-8 text-[9px] uppercase font-bold tracking-wider mt-3 rounded-lg active:scale-[0.98] transition-all duration-300"
                          >
                            Configurar Escopo
                          </Button>
                        </div>
                      ) : (
                        <ScopeWall scopes={scopes} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Assets Hub / Deliverables */}
                <div className="double-bezel-card lg:col-span-2 bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={1.5} className="size-4 text-primary" />
                        <h3 className="font-semibold text-xs text-foreground font-display">Entregáveis</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<button type="button" className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />}>
                              <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={1.5} className="size-3.5" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border border-border/40 text-foreground text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl max-w-xs">
                              Central de arquivos finais, links de acesso rápido, relatórios de performance e ativos de marca do cliente.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        onClick={() => setShowAssetModalNew(true)}
                        className="h-7 text-[8px] font-bold uppercase tracking-wider gap-1 rounded-lg active:scale-[0.98] transition-all duration-300"
                      >
                        <HugeiconsIcon icon={Add01Icon} className="size-3" /> Novo Entregável
                      </Button>
                    </div>
                    {clientAssets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl bg-muted/5">
                        <p className="text-xs text-muted-foreground">Nenhum entregável disponível.</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Disponibilize links de acessos, logos, relatórios ou contratos.</p>
                        <Button
                          onClick={() => setShowAssetModalNew(true)}
                          className="h-8 text-[9px] uppercase font-bold tracking-wider mt-3 rounded-lg active:scale-[0.98] transition-all duration-300"
                        >
                          Adicionar Entregável
                        </Button>
                      </div>
                    ) : (
                      <AssetsHub assets={clientAssets} />
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 4. Notes Tab */}
            {activeTab === "notes" && (
              <div className="double-bezel-card tab-content-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/20">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="size-4 text-primary" />
                    <h3 className="font-semibold text-xs text-foreground font-display">Anotações Internas (Context Shadow)</h3>
                  </div>
                  <ClientNotesPanel notes={clientNotes} onAdd={handleAddNote} />
                </div>
              </div>
            )}

          </div>

        </section>

      </div>

      {/* 1. Modal Geração de Propostas Comerciais */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-lg rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button 
                onClick={() => setShowProposalModal(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Gerador de Propostas Comerciais</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Estrutura de propostas profissionais customizadas com a identidade do cliente.</p>

              <div className="mb-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleAiProposalGenerate}
                  disabled={generatingProposal}
                  className="w-full text-xs font-semibold gap-1.5 h-9 bg-primary/5 text-primary border border-primary/10 hover:border-primary/20 hover:bg-primary/10 active:scale-[0.98] transition-all duration-300"
                >
                  {generatingProposal ? "Analisando Nicho..." : "Gerar Proposta Inteligente via IA"}
                </Button>
              </div>
              
              <form onSubmit={handleCreateProposalSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-title" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Título da Proposta</Label>
                    <Input
                      id="p-title"
                      type="text"
                      required
                      value={newProposalTitle}
                      onChange={(e) => setNewProposalTitle(e.target.value)}
                      placeholder="Ex: Gestão Tráfego Pago"
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-niche" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nicho / Segmento</Label>
                    <Input
                      id="p-niche"
                      type="text"
                      value={newProposalNiche}
                      onChange={(e) => setNewProposalNiche(e.target.value)}
                      placeholder="Ex: E-Commerce, Saúde"
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="p-value" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Valor Proposto</Label>
                  <Input
                    id="p-value"
                    type="text"
                    required
                    value={newProposalValue}
                    onChange={(e) => setNewProposalValue(e.target.value)}
                    placeholder="Ex: R$ 12.000,00 único"
                    className="bg-muted/10 border-border/40 text-xs"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="p-scope" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Escopo de Entregáveis</Label>
                  <textarea
                    id="p-scope"
                    rows={4}
                    value={newProposalScope}
                    onChange={(e) => setNewProposalScope(e.target.value)}
                    placeholder="Insira os tópicos, cronograma e garantias incluídas nesta proposta..."
                    className="w-full p-2.5 bg-muted/10 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowProposalModal(false)}
                    className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all duration-300"
                  >
                    Criar Proposta
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Visualizador Branded de Propostas com Identidade do Cliente */}
      {proposalPreview && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 relative text-left">
            <div className="rounded-[calc(2.5rem-0.375rem)] border border-border/20 bg-card p-8 space-y-6 relative overflow-hidden">
              
              {/* Dynamic branded background lines / gradients based on client industry */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full filter blur-[100px] -z-10 pointer-events-none animate-pulse duration-[8000ms]" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-muted/20 rounded-full filter blur-[80px] -z-10 pointer-events-none" />

              <button 
                onClick={() => setProposalPreview(null)}
                className="absolute right-6 top-6 p-1.5 text-muted-foreground hover:text-foreground cursor-pointer rounded-xl hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              {/* Document Header / Company Brand block */}
              <div className="flex justify-between items-start border-b border-border/30 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <HugeiconsIcon icon={Building01Icon} className="size-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-display">Kyper Consultoria</span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight mt-3">{proposalPreview.title}</h2>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Preparado exclusivamente para: <span className="font-semibold text-foreground">{client.name}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2.5 py-1 uppercase">
                    {proposalPreview.niche}
                  </span>
                  <p className="text-[9px] text-muted-foreground mt-2 font-medium">Data: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Document Body */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Escopo de Prestação e Entregáveis</h4>
                  <div className="mt-2 bg-muted/5 border border-border/20 rounded-xl p-4 min-h-[120px] overflow-y-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                    <p className="text-[11px] text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                      {proposalPreview.scope}
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h5 className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none">Investimento Sugerido</h5>
                    <p className="text-[10px] text-muted-foreground mt-1">Sob vigência contratual e SLA ativo.</p>
                  </div>
                  <span className="text-sm font-semibold text-primary font-display">{proposalPreview.value}</span>
                </div>
              </div>

              {/* Signatures block */}
              <div className="flex justify-between items-end border-t border-border/20 pt-6 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <div>
                  <div className="w-28 h-px bg-border/60 mb-2" />
                  <span>Kyper Consultoria</span>
                </div>
                <div className="text-right">
                  <div className="w-28 h-px bg-border/60 mb-2 ml-auto" />
                  <span>{client.contactName || client.name}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    triggerToast("Proposta exportada como PDF (Simulado)!")
                    setProposalPreview(null)
                  }}
                  className="h-10 text-xs px-5 rounded-xl gap-1.5 font-semibold active:scale-[0.98] transition-all duration-300"
                >
                  <HugeiconsIcon icon={FolderOpenIcon} className="size-4" /> Exportar PDF
                </Button>
                <Button 
                  onClick={() => {
                    triggerToast("Assinatura comercial solicitada!")
                    setProposalPreview(null)
                  }}
                  className="h-10 text-xs px-6 rounded-xl font-semibold active:scale-[0.98] transition-all duration-300"
                >
                  Solicitar Assinatura
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Vincular Serviço do Catálogo */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-lg rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button 
                onClick={() => setShowCatalogModal(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Vincular Serviço do Catálogo</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Selecione um serviço cadastrado no catálogo geral para associar a este cliente.</p>

              <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-3 pr-1">
                {globalServices.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground">Nenhum serviço disponível no catálogo global.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push("/services")} 
                      className="mt-3 text-[9px] uppercase font-bold tracking-wider h-8 active:scale-[0.98] transition-all duration-300"
                    >
                      Ir para Catálogo de Serviços
                    </Button>
                  </div>
                ) : (
                  globalServices.map(g => (
                    <div key={g.id} className="p-3 bg-muted/5 border border-border/30 rounded-2xl flex items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{g.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">R$ {parseFloat(g.price).toLocaleString()} / {g.billing}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => addGlobalServiceToClient(g)}
                        className="text-[9px] uppercase font-bold tracking-wider h-7 active:scale-[0.98] transition-all duration-300"
                      >
                        Vincular
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Criar Link Rápido */}
      {showQuicklinkModalNew && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button 
                onClick={() => setShowQuicklinkModalNew(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Adicionar Link Rápido</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Adicione um link útil de acesso rápido (ex: drive, repositório) para este cliente.</p>
              
              <form onSubmit={handleCreateQuicklink} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="q-label" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nome do Link</Label>
                  <Input
                    id="q-label"
                    type="text"
                    required
                    value={newQuicklinkLabel}
                    onChange={(e) => setNewQuicklinkLabel(e.target.value)}
                    placeholder="Ex: Google Drive"
                    className="bg-muted/10 border-border/40 text-xs"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="q-url" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">URL</Label>
                  <Input
                    id="q-url"
                    type="text"
                    required
                    value={newQuicklinkUrl}
                    onChange={(e) => setNewQuicklinkUrl(e.target.value)}
                    placeholder="Ex: drive.google.com/..."
                    className="bg-muted/10 border-border/40 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowQuicklinkModalNew(false)}
                    className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creatingQuicklink}
                    className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all duration-300"
                  >
                    {creatingQuicklink ? "Adicionando..." : "Adicionar Link"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Criar Solicitação de Aprovação */}
      {showApprovalModalNew && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button 
                onClick={() => setShowApprovalModalNew(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Solicitar Aprovação</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Envie uma entrega (copy, arte, página, documento) para aprovação formal do cliente.</p>
              
              <form onSubmit={handleCreateApproval} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="a-title" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Título do Item</Label>
                  <Input
                    id="a-title"
                    type="text"
                    required
                    value={newApprovalTitle}
                    onChange={(e) => setNewApprovalTitle(e.target.value)}
                    placeholder="Ex: Arte do Feed - Campanha de Julho"
                    className="bg-muted/10 border-border/40 text-xs"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="a-desc" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Descrição/Orientações</Label>
                  <Textarea
                    id="a-desc"
                    value={newApprovalDescription}
                    onChange={(e) => setNewApprovalDescription(e.target.value)}
                    placeholder="Instruções para o cliente analisar a entrega..."
                    className="bg-muted/10 border-border/40 text-xs min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="a-type" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Tipo de Arquivo</Label>
                    <select
                      id="a-type"
                      value={newApprovalFileType}
                      onChange={(e) => setNewApprovalFileType(e.target.value)}
                      className="bg-card border border-border/40 rounded-lg p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 h-10"
                    >
                      <option value="image">Imagem</option>
                      <option value="video">Vídeo</option>
                      <option value="document">Documento PDF</option>
                      <option value="link">Link Externo</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="a-url" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">URL do Arquivo</Label>
                    <Input
                      id="a-url"
                      type="text"
                      value={newApprovalFileUrl}
                      onChange={(e) => setNewApprovalFileUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowApprovalModalNew(false)}
                    className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creatingApproval}
                    className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all duration-300"
                  >
                    {creatingApproval ? "Enviando..." : "Solicitar Aprovação"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Criar Item de Escopo */}
      {showScopeModalNew && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button 
                onClick={() => setShowScopeModalNew(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Adicionar Item de Escopo</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Adicione uma cota de entregas (ex: 8 posts mensais) para controlar o consumo operacional.</p>
              
              <form onSubmit={handleCreateScope} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="s-label" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Descrição da Entrega</Label>
                  <Input
                    id="s-label"
                    type="text"
                    required
                    value={newScopeLabel}
                    onChange={(e) => setNewScopeLabel(e.target.value)}
                    placeholder="Ex: Posts para Rede Social"
                    className="bg-muted/10 border-border/40 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="s-quota" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Quantidade Contratada</Label>
                    <Input
                      id="s-quota"
                      type="number"
                      required
                      value={newScopeTotalQuota}
                      onChange={(e) => setNewScopeTotalQuota(e.target.value)}
                      placeholder="Ex: 8"
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="s-period" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Período de Renovação</Label>
                    <select
                      id="s-period"
                      value={newScopePeriod}
                      onChange={(e) => setNewScopePeriod(e.target.value)}
                      className="bg-card border border-border/40 rounded-lg p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 h-10"
                    >
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="unico">Pagamento Único</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowScopeModalNew(false)}
                    className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creatingScope}
                    className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all duration-300"
                  >
                    {creatingScope ? "Salvando..." : "Criar Item de Escopo"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Criar Entregável */}
      {showAssetModalNew && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button 
                onClick={() => setShowAssetModalNew(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Adicionar Entregável</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Adicione arquivos, links de acessos compartilhados, manuais de marca ou relatórios operacionais.</p>
              
              <form onSubmit={handleCreateAsset} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="as-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nome do Entregável</Label>
                  <Input
                    id="as-name"
                    type="text"
                    required
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    placeholder="Ex: Manual de Identidade Visual"
                    className="bg-muted/10 border-border/40 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="as-cat" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Categoria</Label>
                    <select
                      id="as-cat"
                      value={newAssetCategory}
                      onChange={(e) => setNewAssetCategory(e.target.value)}
                      className="bg-card border border-border/40 rounded-lg p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 h-10"
                    >
                      <option value="logo">Marca / Logo</option>
                      <option value="access">Acesso / Senhas</option>
                      <option value="report">Relatório</option>
                      <option value="art">Arte / Criativo</option>
                      <option value="contract">Contrato</option>
                      <option value="other">Outros</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="as-url" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">URL de Acesso</Label>
                    <Input
                      id="as-url"
                      type="text"
                      value={newAssetLinkUrl}
                      onChange={(e) => setNewAssetLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="as-notes" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Anotações / Descrição</Label>
                  <Textarea
                    id="as-notes"
                    value={newAssetNotes}
                    onChange={(e) => setNewAssetNotes(e.target.value)}
                    placeholder="Instruções de acesso ou notas adicionais..."
                    className="bg-muted/10 border-border/40 text-xs min-h-[60px]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAssetModalNew(false)}
                    className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creatingAsset}
                    className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all duration-300"
                  >
                    {creatingAsset ? "Salvando..." : "Salvar Entregável"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Criar Orçamento de Anúncios */}
      {showAdSpendModalNew && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button 
                onClick={() => setShowAdSpendModalNew(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Configurar Verba de Anúncios</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Cadastre a verba planejada de tráfego pago para monitoramento do ritmo de consumo diário.</p>
              
              <form onSubmit={handleCreateAdSpend} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="sp-month" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Mês de Vigência</Label>
                    <Input
                      id="sp-month"
                      type="text"
                      required
                      value={newAdSpendMonth}
                      onChange={(e) => setNewAdSpendMonth(e.target.value)}
                      placeholder="Ex: Julho/2026"
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="sp-platform" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Plataforma</Label>
                    <Input
                      id="sp-platform"
                      type="text"
                      required
                      value={newAdSpendPlatform}
                      onChange={(e) => setNewAdSpendPlatform(e.target.value)}
                      placeholder="Ex: Meta Ads, Google Ads"
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="sp-budget" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Orçamento Planejado (R$)</Label>
                  <Input
                    id="sp-budget"
                    type="number"
                    required
                    value={newAdSpendPlanned}
                    onChange={(e) => setNewAdSpendPlanned(e.target.value)}
                    placeholder="Ex: 5000"
                    className="bg-muted/10 border-border/40 text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAdSpendModalNew(false)}
                    className="rounded-xl text-xs font-semibold h-10 px-4 active:scale-[0.98] transition-all duration-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creatingAdSpend}
                    className="rounded-xl text-xs font-semibold h-10 px-6 active:scale-[0.98] transition-all duration-300"
                  >
                    {creatingAdSpend ? "Configurando..." : "Salvar Configuração"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating toast notification (Double-Bezel style) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1 rounded-2xl shadow-2xl">
            <div className="bg-card rounded-[calc(1rem-0.25rem)] p-3 px-4 flex items-center gap-3 max-w-sm">
              <div className={`size-2 rounded-full shrink-0 ${
                toast.type === "success" ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-destructive shadow-[0_0_8px_rgba(var(--destructive),0.5)]"
              }`} />
              <span className="text-[11px] font-medium text-foreground">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
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
