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
  File01Icon,
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
  Copy01Icon,
  Alert01Icon,
  Download01Icon
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
import { QuickActions } from "@/components/quick-actions"
import { CalendarConnectionCard } from "@/components/calendar-connection-card"
import { CalendarMonthView } from "@/components/calendar-month-view"
import { ClientOverviewTab } from "@/components/client-overview-tab"
import { ProjectSelector } from "@/components/project-selector"
import { CreateProjectModal } from "@/components/create-project-modal"
import { ProjectInfoBar } from "@/components/project-info-bar"
import { BudgetProposalWizard } from "@/components/budget-proposal-wizard"
import { ContractWizard } from "@/components/contract-wizard"
import { ClientTimeline } from "@/components/client-timeline"
import { ResponseCopilot } from "@/components/response-copilot"
import { Layers01Icon, SparklesIcon } from "@hugeicons/core-free-icons"

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
  document?: string | null
  portalEnabled: boolean
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  notes?: string | null
  socials?: Record<string, string> | null
  websites?: string[] | null
  createdAt: string
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
  const [savedProposals, setSavedProposals] = useState<{ id: string; name: string; notes?: string | null; createdAt: string }[]>([])

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
  const [activeTab, setActiveTab] = useState<"inicio" | "crm" | "financial" | "delivery" | "documentos" | "calendar" | "notes" | "timeline" | "copilot">("inicio")

  // Active Creation Modals
  const [showApprovalModalNew, setShowApprovalModalNew] = useState(false)
  const [showScopeModalNew, setShowScopeModalNew] = useState(false)
  const [showAssetModalNew, setShowAssetModalNew] = useState(false)
  const [showAdSpendModalNew, setShowAdSpendModalNew] = useState(false)
  const [showQuicklinkModalNew, setShowQuicklinkModalNew] = useState(false)

  // Project-centric states
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [clientProjects, setClientProjects] = useState<Array<{ id: string; name: string; status: string; budget?: string }>>([])
  const [projectRefreshKey, setProjectRefreshKey] = useState(0)
  const [hasProjects, setHasProjects] = useState<boolean | null>(null)

  // Budget Wizard
  const [showBudgetWizard, setShowBudgetWizard] = useState(false)

  // Contract Wizard
  const [showContractWizard, setShowContractWizard] = useState(false)
  const [agencySettings, setAgencySettings] = useState<any>(null)

  // Quick action modals
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false)
  const [quickTaskTitle, setQuickTaskTitle] = useState("")
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false)
  const [quickNoteContent, setQuickNoteContent] = useState("")
  const [quickNoteTag, setQuickNoteTag] = useState("context")
  const [showQuickMeetingModal, setShowQuickMeetingModal] = useState(false)
  const [quickMeetingTitle, setQuickMeetingTitle] = useState("")
  const [quickMeetingDate, setQuickMeetingDate] = useState("")
  const [quickMeetingTime, setQuickMeetingTime] = useState("10:00")
  const [quickMeetingPlatform, setQuickMeetingPlatform] = useState("Google Meet")
  const [quickMeetingDesc, setQuickMeetingDesc] = useState("")
  const [creatingMeeting, setCreatingMeeting] = useState(false)

  // Quick Briefing Modal states
  const [showQuickBriefingModal, setShowQuickBriefingModal] = useState(false)
  const [briefingName, setBriefingName] = useState("")
  const [briefingGoal, setBriefingGoal] = useState("")
  const [briefingLink, setBriefingLink] = useState("")
  const [creatingBriefing, setCreatingBriefing] = useState(false)

  // Quick Contract Modal states
  const [showQuickContractModal, setShowQuickContractModal] = useState(false)
  const [quickContractName, setQuickContractName] = useState("Contrato de Prestacao de Servicos")
  const [quickContractContent, setQuickContractContent] = useState("")
  const [quickContractLink, setQuickContractLink] = useState("")
  const [creatingQuickContract, setCreatingQuickContract] = useState(false)

  // Satisfaction Modal states
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false)

  // Data for overview tab
  const [satisfaction, setSatisfaction] = useState<Array<{ id: string; score: number; note?: string; createdAt: string }>>([])
  const [contracts, setContracts] = useState<Array<{ id: string; title: string; status: string; createdAt: string }>>([])
  const [meetings, setMeetings] = useState<Array<{ id: string; title: string; status: string; meetingDate: string; platform?: string }>>([])
  const [interactions, setInteractions] = useState<Array<{ id: string; type: string; description?: string | null; createdAt: string }>>([])

  // Creation Form States
  const [newApprovalTitle, setNewApprovalTitle] = useState("")
  const [newApprovalDescription, setNewApprovalDescription] = useState("")
  const [newApprovalFileType, setNewApprovalFileType] = useState("document")
  const [newApprovalFileUrl, setNewApprovalFileUrl] = useState("")
  const [creatingApproval, setCreatingApproval] = useState(false)

  const [newScopeLabel, setNewScopeLabel] = useState("")
  const [newScopeTotalQuota, setNewScopeTotalQuota] = useState("")
  const [newScopePeriod, setNewScopePeriod] = useState("monthly")
  const [newScopePrice, setNewScopePrice] = useState("0")
  const [newScopeBilling, setNewScopeBilling] = useState("mensal")
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
      if (editingApproval) {
        const res = await fetch(`/api/client-portal/approvals/${editingApproval.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newApprovalTitle,
            description: newApprovalDescription,
            fileType: newApprovalFileType,
            fileUrl: newApprovalFileUrl || undefined,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setApprovals(prev => prev.map(a => a.id === editingApproval.id ? { ...a, ...updated } : a))
          triggerToast("Solicitação de aprovação atualizada!")
        }
      } else {
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
          triggerToast("Solicitação de aprovação criada!")
        } else {
          triggerToast("Erro ao criar aprovação.", "error")
        }
      }
      setNewApprovalTitle("")
      setNewApprovalDescription("")
      setNewApprovalFileUrl("")
      setEditingApproval(null)
      setShowApprovalModalNew(false)
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao processar aprovação.", "error")
    } finally {
      setCreatingApproval(false)
    }
  }

  const handleCreateScope = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScopeLabel.trim() || !newScopeTotalQuota.trim()) return
    setCreatingScope(true)
    try {
      if (editingScope) {
        const res = await fetch(`/api/client-portal/scope/${editingScope.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: newScopeLabel,
            totalQuota: parseInt(newScopeTotalQuota),
            period: newScopePeriod,
            price: newScopePrice,
            billing: newScopeBilling,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setScopes(prev => prev.map(s => s.id === editingScope.id ? { ...s, ...updated } : s))
          triggerToast("Item de escopo atualizado!")
        }
      } else {
        const res = await fetch("/api/client-portal/scope", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: id,
            userId,
            label: newScopeLabel,
            totalQuota: parseInt(newScopeTotalQuota),
            period: newScopePeriod,
            price: newScopePrice,
            billing: newScopeBilling,
            status: "active",
          }),
        })
        if (res.ok) {
          const item = await res.json()
          setScopes(prev => [...prev, item])
          triggerToast("Item de escopo cadastrado com sucesso!")
        } else {
          triggerToast("Erro ao cadastrar escopo.", "error")
        }
      }
      setNewScopeLabel("")
      setNewScopeTotalQuota("")
      setNewScopePrice("0")
      setNewScopeBilling("mensal")
      setEditingScope(null)
      setShowScopeModalNew(false)
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao processar escopo.", "error")
    } finally {
      setCreatingScope(false)
    }
  }

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssetName.trim()) return
    setCreatingAsset(true)
    try {
      if (editingAsset) {
        const res = await fetch(`/api/client-portal/assets/${editingAsset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newAssetName,
            category: newAssetCategory,
            linkUrl: newAssetLinkUrl || undefined,
            notes: newAssetNotes || undefined,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setClientAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, ...updated } : a))
          triggerToast("Entregável atualizado!")
        }
      } else {
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
          triggerToast("Entregável adicionado com sucesso!")
        } else {
          triggerToast("Erro ao adicionar entregável.", "error")
        }
      }
      setNewAssetName("")
      setNewAssetLinkUrl("")
      setNewAssetNotes("")
      setEditingAsset(null)
      setShowAssetModalNew(false)
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao processar entregável.", "error")
    } finally {
      setCreatingAsset(false)
    }
  }

  const handleCreateAdSpend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdSpendMonth.trim() || !newAdSpendPlanned.trim() || !newAdSpendPlatform.trim()) return
    setCreatingAdSpend(true)
    try {
      if (editingAdSpend) {
        const res = await fetch(`/api/client-portal/ad-spend/${editingAdSpend.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month: newAdSpendMonth,
            plannedBudget: newAdSpendPlanned,
            platform: newAdSpendPlatform,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setAdSpendTrackers(prev => prev.map(t => t.id === editingAdSpend.id ? { ...t, ...updated } : t))
          triggerToast("Rastreamento de verba atualizado!")
        }
      } else {
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
          triggerToast("Rastreamento de verba configurado!")
        } else {
          triggerToast("Erro ao criar rastreamento.", "error")
        }
      }
      setNewAdSpendMonth("")
      setNewAdSpendPlanned("")
      setNewAdSpendPlatform("")
      setEditingAdSpend(null)
      setShowAdSpendModalNew(false)
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao processar rastreamento.", "error")
    } finally {
      setCreatingAdSpend(false)
    }
  }

  const handleCreateQuicklink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuicklinkLabel.trim() || !newQuicklinkUrl.trim()) return
    setCreatingQuicklink(true)
    try {
      if (editingQuicklink) {
        const res = await fetch(`/api/client-portal/quicklinks/${editingQuicklink.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: newQuicklinkLabel,
            url: newQuicklinkUrl.startsWith("http") ? newQuicklinkUrl : `https://${newQuicklinkUrl}`,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setQuicklinks(prev => prev.map(l => l.id === editingQuicklink.id ? { ...l, ...updated } : l))
          triggerToast("Link rápido atualizado!")
        }
      } else {
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
          triggerToast("Link rápido adicionado com sucesso!")
        } else {
          triggerToast("Erro ao adicionar link rápido.", "error")
        }
      }
      setNewQuicklinkLabel("")
      setNewQuicklinkUrl("")
      setEditingQuicklink(null)
      setShowQuicklinkModalNew(false)
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao processar link rápido.", "error")
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

    async function loadTasks(projectId?: string | null) {
      try {
        const url = projectId
          ? `/api/client-portal/tasks?clientId=${id}&projectId=${projectId}`
          : `/api/client-portal/tasks?clientId=${id}`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setTasks(data)
        }
      } catch (err) {
        console.error(err)
      }
    }

    async function loadProjects() {
      try {
        const res = await fetch(`/api/projects?clientId=${id}`)
        if (res.ok) {
          const data = await res.json()
          const list = Array.isArray(data) ? data : []
          setClientProjects(list)
          setHasProjects(list.length > 0)
          if (list.length > 0 && !selectedProjectId) {
            setSelectedProjectId(list[0].id)
          }
        }
      } catch (err) {
        console.error(err)
        setHasProjects(false)
      }
    }

    if (id) {
      loadDetail()
      loadGlobalServices()
      loadTasks()
      loadProjects()

      // Pós-venda fetches
      fetch(`/api/client-portal/approvals?clientId=${id}`).then(r => r.json()).then(setApprovals).catch(() => {})
      fetch(`/api/client-portal/assets?clientId=${id}`).then(r => r.json()).then(setClientAssets).catch(() => {})
      fetch(`/api/client-portal/notes?clientId=${id}`).then(r => r.json()).then(setClientNotes).catch(() => {})
      fetch(`/api/client-portal/onboarding?clientId=${id}`).then(r => r.json()).then(setOnboardingTasks).catch(() => {})
      fetch(`/api/client-portal/quicklinks?clientId=${id}`).then(r => r.json()).then(setQuicklinks).catch(() => {})
      fetch(`/api/client-portal/scope?clientId=${id}`).then(r => r.json()).then(setScopes).catch(() => {})
      fetch(`/api/client-portal/ad-spend?clientId=${id}`).then(r => r.json()).then(setAdSpendTrackers).catch(() => {})
      fetch(`/api/client-portal/satisfaction?clientId=${id}`).then(r => r.json()).then(setSatisfaction).catch(() => {})
      fetch(`/api/client-portal/contracts?clientId=${id}`).then(r => r.json()).then(setContracts).catch(() => {})
      fetch(`/api/client-portal/proposals?clientId=${id}`).then(r => r.json()).then(setSavedProposals).catch(() => {})
      fetch(`/api/client-portal/meetings?clientId=${id}`).then(r => r.json()).then(setMeetings).catch(() => {})
      fetch(`/api/client-portal/interactions?clientId=${id}`).then(r => r.json()).then(setInteractions).catch(() => {})
      fetch("/api/agency-settings").then(r => r.json()).then(setAgencySettings).catch(() => {})
    }
  }, [id])

  // Reload tasks when project selection changes
  useEffect(() => {
    if (id && selectedProjectId) {
      fetch(`/api/client-portal/tasks?clientId=${id}&projectId=${selectedProjectId}`)
        .then(r => r.json())
        .then(setTasks)
        .catch(() => {})
    }
  }, [id, selectedProjectId])

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
      body: JSON.stringify({ clientId: id, userId, title: newTaskTitle, status, projectId: selectedProjectId || undefined }),
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

  // Quick Action Handlers
  const handleQuickCreateTask = async () => {
    if (!quickTaskTitle.trim()) return
    const res = await fetch("/api/client-portal/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id, userId, title: quickTaskTitle, status: "todo" }),
    })
    const task = await res.json()
    setTasks(prev => [...prev, task])
    setQuickTaskTitle("")
    setShowQuickTaskModal(false)
    triggerToast("Tarefa criada!")
  }


  const handleQuickCreateBriefing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!briefingName.trim()) return
    setCreatingBriefing(true)
    try {
      const res = await fetch("/api/client-portal/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          userId,
          projectName: briefingName,
          businessGoal: briefingGoal,
          submit: false,
        }),
      })
      if (res.ok) {
        const baseOrigin = window.location.origin
        setBriefingLink(baseOrigin + "/portal/" + userId + "/briefing/" + id)
        triggerToast("Briefing salvo como rascunho!")
      } else {
        triggerToast("Erro ao criar briefing.", "error")
      }
    } catch {
      triggerToast("Erro de conexao.", "error")
    } finally {
      setCreatingBriefing(false)
    }
  }

  const handleQuickCreateContract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickContractName.trim()) return
    setCreatingQuickContract(true)
    try {
      const res = await fetch("/api/client-portal/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          userId,
          title: quickContractName,
          customContent: quickContractContent || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const baseOrigin = window.location.origin
        setQuickContractLink(baseOrigin + "/portal/" + userId + "/contrato/" + data.id)
        triggerToast("Contrato criado com sucesso!")
      } else {
        triggerToast(data.error || "Erro ao criar contrato.", "error")
      }
    } catch {
      triggerToast("Erro de conexao.", "error")
    } finally {
      setCreatingQuickContract(false)
    }
  }

  const handleQuickAddNote = async () => {
    if (!quickNoteContent.trim()) return
    await handleAddNote(quickNoteContent, quickNoteTag)
    setQuickNoteContent("")
    setQuickNoteTag("context")
    setShowQuickNoteModal(false)
  }

  const handleQuickCreateMeeting = async () => {
    if (!quickMeetingTitle.trim() || !quickMeetingDate.trim()) return
    setCreatingMeeting(true)
    try {
      const meetingDateTime = `${quickMeetingDate}T${quickMeetingTime}:00`
      const res = await fetch("/api/client-portal/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          userId,
          title: quickMeetingTitle,
          description: quickMeetingDesc || undefined,
          meetingDate: meetingDateTime,
          platform: quickMeetingPlatform,
        }),
      })
      if (res.ok) {
        const meeting = await res.json()
        setMeetings(prev => [meeting, ...prev])
        triggerToast("Reunião agendada com sucesso!")
      } else {
        triggerToast("Erro ao agendar reunião.", "error")
      }
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao processar reunião.", "error")
    } finally {
      setQuickMeetingTitle("")
      setQuickMeetingDate("")
      setQuickMeetingTime("10:00")
      setQuickMeetingPlatform("Google Meet")
      setQuickMeetingDesc("")
      setCreatingMeeting(false)
      setShowQuickMeetingModal(false)
    }
  }

  // Delete & Edit handlers for Pós-Venda items
  const handleDeleteApproval = async (approvalId: string) => {
    await fetch(`/api/client-portal/approvals/${approvalId}`, { method: "DELETE" })
    setApprovals(prev => prev.filter(a => a.id !== approvalId))
    triggerToast("Solicitação de aprovação removida!")
  }

  const handleDeleteScope = async (scopeId: string) => {
    await fetch(`/api/client-portal/scope/${scopeId}`, { method: "DELETE" })
    setScopes(prev => prev.filter(s => s.id !== scopeId))
    triggerToast("Item de escopo removido!")
  }

  const handleDeleteAsset = async (assetId: string) => {
    await fetch(`/api/client-portal/assets/${assetId}`, { method: "DELETE" })
    setClientAssets(prev => prev.filter(a => a.id !== assetId))
    triggerToast("Entregável removido!")
  }

  const handleDeleteQuicklink = async (linkId: string) => {
    await fetch(`/api/client-portal/quicklinks/${linkId}`, { method: "DELETE" })
    setQuicklinks(prev => prev.filter(l => l.id !== linkId))
    triggerToast("Link rápido removido!")
  }

  const handleDeleteAdSpend = async (trackerId: string) => {
    await fetch(`/api/client-portal/ad-spend/${trackerId}`, { method: "DELETE" })
    setAdSpendTrackers(prev => prev.filter(t => t.id !== trackerId))
    triggerToast("Rastreamento de verba removido!")
  }

  const handleDeleteNote = async (noteId: string) => {
    await fetch(`/api/client-portal/notes/${noteId}`, { method: "DELETE" })
    setClientNotes(prev => prev.filter(n => n.id !== noteId))
    triggerToast("Nota removida!")
  }

  // Edit handlers
  const [editingApproval, setEditingApproval] = useState<any>(null)
  const [editingScope, setEditingScope] = useState<any>(null)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [editingAdSpend, setEditingAdSpend] = useState<any>(null)
  const [editingQuicklink, setEditingQuicklink] = useState<any>(null)

  const handleEditApproval = (item: any) => {
    setNewApprovalTitle(item.title)
    setNewApprovalDescription(item.description || "")
    setNewApprovalFileType(item.fileType)
    setNewApprovalFileUrl(item.fileUrl || "")
    setEditingApproval(item)
    setShowApprovalModalNew(true)
  }

  const handleEditScope = (item: any) => {
    setNewScopeLabel(item.label)
    setNewScopeTotalQuota(String(item.totalQuota))
    setNewScopePeriod(item.period)
    setNewScopePrice(item.price || "0")
    setNewScopeBilling(item.billing || "mensal")
    setEditingScope(item)
    setShowScopeModalNew(true)
  }

  const handleToggleScopeStatus = async (scopeId: string, newStatus: "active" | "closed") => {
    try {
      const res = await fetch(`/api/client-portal/scope/${scopeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setScopes(prev => prev.map(s => s.id === scopeId ? { ...s, ...updated } : s))
        triggerToast(newStatus === "closed" ? "Serviço movido para o histórico!" : "Serviço reativado com sucesso!")
      } else {
        triggerToast("Erro ao alterar status do serviço.", "error")
      }
    } catch (err) {
      console.error(err)
      triggerToast("Erro ao processar alteração.", "error")
    }
  }

  const handleEditAsset = (item: any) => {
    setNewAssetName(item.name)
    setNewAssetCategory(item.category)
    setNewAssetLinkUrl(item.linkUrl || "")
    setNewAssetNotes(item.notes || "")
    setEditingAsset(item)
    setShowAssetModalNew(true)
  }

  const handleEditAdSpend = (item: any) => {
    setNewAdSpendMonth(item.month)
    setNewAdSpendPlanned(item.plannedBudget)
    setNewAdSpendPlatform(item.platform)
    setEditingAdSpend(item)
    setShowAdSpendModalNew(true)
  }

  const handleEditQuicklink = (item: any) => {
    setNewQuicklinkLabel(item.label)
    setNewQuicklinkUrl(item.url)
    setEditingQuicklink(item)
    setShowQuicklinkModalNew(true)
  }

  const handleEditNote = async (noteId: string, content: string, tag: string) => {
    await fetch(`/api/client-portal/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, tag }),
    })
    setClientNotes(prev => prev.map(n => n.id === noteId ? { ...n, content, tag } : n))
    triggerToast("Nota atualizada!")
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
          {hasProjects && (
            <ProjectSelector
              clientId={id}
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              onCreateProject={() => setShowCreateProjectModal(true)}
              refreshKey={projectRefreshKey}
              initialProjects={clientProjects}
              compact
            />
          )}
          <Button onClick={handleStartOutreach} variant="outline" className="text-xs h-9 gap-1.5 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 font-semibold">
            <HugeiconsIcon icon={Message01Icon} className="size-4" />
            Iniciar Abordagem
          </Button>
        </div>
      </header>

      {/* No Projects: centered empty state */}
      {hasProjects === false && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <ProjectSelector
              clientId={id}
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              onCreateProject={() => setShowCreateProjectModal(true)}
              refreshKey={projectRefreshKey}
              initialProjects={clientProjects}
              onProjectsLoaded={(projs) => {
                setClientProjects(projs)
                setHasProjects(projs.length > 0)
                if (projs.length > 0 && !selectedProjectId) {
                  setSelectedProjectId(projs[0].id)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Has Projects: full layout */}
      {hasProjects === true && (
        <>
          {/* Quick Actions Bar */}
          <QuickActions
            client={client}
            onGenerateProposal={() => setShowBudgetWizard(true)}
            onCreateTask={() => setShowQuickTaskModal(true)}
            onCreateApproval={() => setShowApprovalModalNew(true)}
            onAddNote={() => setShowQuickNoteModal(true)}
            onToast={triggerToast}
          />

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
                <QuicklinksHub links={quicklinks} onDelete={handleDeleteQuicklink} onEdit={handleEditQuicklink} />
              )}
            </div>
          </div>

          {/* Portal do Cliente (Double Bezel) */}
          <div className="double-bezel-card bento-detail-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 border border-border/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={1.5} className="size-4 text-primary" />
                  <h3 className="font-semibold text-xs text-foreground font-display">Portal do Cliente</h3>
                </div>
                <span className={`text-[9px] font-bold tracking-widest ring-1 rounded-full px-2 py-0.5 uppercase ${
                  client.portalEnabled
                    ? "bg-green-500/10 text-green-500 ring-green-500/20"
                    : "bg-muted text-muted-foreground ring-border/30"
                }`}>
                  {client.portalEnabled ? "Ativado" : "Desativado"}
                </span>
              </div>

              {client.portalEnabled ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-muted/5 border border-border/20 rounded-lg">
                    <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">
                      /portal/{userId}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/portal/${userId}`)
                        triggerToast("URL do portal copiada!")
                      }}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                      title="Copiar URL"
                    >
                      <HugeiconsIcon icon={Copy01Icon} className="size-3" />
                    </button>
                  </div>
                  {!client.document && (
                    <p className="text-[9px] text-amber-500 flex items-center gap-1">
                      <HugeiconsIcon icon={Alert01Icon} className="size-3" />
                      Cliente precisa de CPF/CNPJ para acessar o portal
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Ative o portal na página <a href="/client-portal" className="text-primary hover:underline">Área do Cliente</a> para que o cliente acesse.
                </p>
              )}
            </div>
          </div>

          {/* Google Calendar (Double Bezel) */}
          <CalendarConnectionCard userId={userId} triggerToast={triggerToast} />

        </aside>
        <section className="xl:col-span-8 flex flex-col h-full overflow-hidden min-h-0">
          
          {/* Project Info Bar */}
          {selectedProjectId && clientProjects.length > 0 && (
            <div className="mb-3 shrink-0">
              <ProjectInfoBar
                project={clientProjects.find(p => p.id === selectedProjectId)!}
                taskStats={{
                  total: tasks.length,
                  done: tasks.filter(t => t.status === "done").length,
                }}
                onUpdate={async (projectId, data) => {
                  await fetch(`/api/projects/${projectId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  })
                  setClientProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...data } : p))
                  triggerToast("Projeto atualizado!")
                }}
              />
            </div>
          )}

          {/* Custom Tabs Navigation */}
          <div className="flex items-center gap-1.5 border-b border-border/40 pb-2.5 shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: "inicio", label: "Início" },
              { id: "crm", label: "CRM" },
              { id: "financial", label: "Financeiro" },
              { id: "delivery", label: "Entregas" },
              { id: "documentos", label: "Documentos" },
              { id: "calendar", label: "Calendário" },
              { id: "notes", label: "Anotações" },
              { id: "timeline", label: "Timeline" },
              { id: "copilot", label: "Copiloto" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pt-5">
            
            {/* 0. Início (Overview) Tab */}
            {activeTab === "inicio" && client && (
              <ClientOverviewTab
                client={client}
                tasks={tasks}
                approvals={approvals}
                onboardingTasks={onboardingTasks}
                interactions={interactions}
                scopes={scopes}
                satisfaction={satisfaction}
                contracts={contracts}
                meetings={meetings}
                stage={
                  client.status === "Onboarding"
                    ? "onboarding"
                    : client.status === "Em Risco"
                      ? "at_risk"
                      : "active"
                }
                onNavigate={(path) => router.push(path)}
                onModalAction={(action) => {
                  if (action === "task") setShowQuickTaskModal(true)
                  if (action === "scope") setShowScopeModalNew(true)
                  if (action === "approval") setShowApprovalModalNew(true)
                  if (action === "meeting") setShowQuickMeetingModal(true)
                  if (action === "portal") {
                    // Toggle portal
                    fetch(`/api/clients/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ portalEnabled: !client.portalEnabled }),
                    }).then(() => {
                      setClient(prev => prev ? { ...prev, portalEnabled: !prev.portalEnabled } : prev)
                      triggerToast(client.portalEnabled ? "Portal desativado." : "Portal ativado!")
                    })
                  }
                  if (action === "briefing") setShowQuickBriefingModal(true)
                  if (action === "contract") setShowContractWizard(true)
                  if (action === "proposal") setShowBudgetWizard(true)
                  if (action === "interactions") setActiveTab("notes")
                  if (action === "satisfaction") setShowSatisfactionModal(true)
                }}
              />
            )}

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
                        onClick={() => setActiveTab("documentos")}
                        variant="ghost"
                        className="h-7 text-[9px] font-semibold gap-1 rounded-lg active:scale-[0.98] transition-all duration-300"
                      >
                        Ver Documentos →
                      </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5">
                      {savedProposals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <p className="text-xs text-muted-foreground">Nenhuma proposta comercial gerada.</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">Gere propostas na aba Documentos.</p>
                        </div>
                      ) : (
                        savedProposals.slice(0, 4).map(p => (
                          <div key={p.id} className="p-3 bg-muted/5 border border-border/30 rounded-2xl flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/pdf/proposal/${p.id}`, "_blank")}
                              className="h-6 text-[9px] font-semibold gap-1 px-2 rounded-lg shrink-0 active:scale-[0.98] transition-all duration-300"
                            >
                              <HugeiconsIcon icon={Download01Icon} className="size-3" /> PDF
                            </Button>
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
                      <AdSpendMeter trackers={adSpendTrackers} onDelete={handleDeleteAdSpend} onEdit={handleEditAdSpend} />
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
                        <ApprovalPanel items={approvals} onApprove={handleApprove} onRevision={handleRevision} onDelete={handleDeleteApproval} onEdit={handleEditApproval} />
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
                        <ScopeWall scopes={scopes} onDelete={handleDeleteScope} onEdit={handleEditScope} onToggleStatus={handleToggleScopeStatus} />
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
                      <AssetsHub assets={clientAssets} onDelete={handleDeleteAsset} onEdit={handleEditAsset} />
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 5. Documentos Tab */}
            {activeTab === "documentos" && (
              <div className="space-y-5 tab-content-item">
                {/* Contracts Section */}
                <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Shield01Icon} strokeWidth={1.5} className="size-4 text-primary" />
                        <h3 className="font-semibold text-xs text-foreground font-display">Contratos</h3>
                        {contracts.length > 0 && (
                          <span className="text-[9px] font-bold bg-muted text-muted-foreground rounded px-1.5 py-0.5">{contracts.length}</span>
                        )}
                      </div>
                      <Button
                        onClick={() => setShowContractWizard(true)}
                        className="h-7 text-[9px] font-semibold gap-1 rounded-lg active:scale-[0.98] transition-all duration-300"
                      >
                        <HugeiconsIcon icon={Add01Icon} className="size-3" /> Novo Contrato
                      </Button>
                    </div>
                    {contracts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl bg-muted/5">
                        <HugeiconsIcon icon={Shield01Icon} strokeWidth={1.5} className="size-8 text-muted-foreground/40 mb-2" />
                        <p className="text-xs text-muted-foreground">Nenhum contrato criado.</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Crie contratos e envie para assinatura digital.</p>
                        <Button
                          onClick={() => setShowContractWizard(true)}
                          variant="link"
                          className="text-[10px] text-primary h-auto p-0 mt-2 font-semibold"
                        >
                          Criar Primeiro Contrato
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {contracts.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-3 bg-muted/5 border border-border/30 rounded-xl hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                                c.status === "signed" ? "bg-green-500/10" : "bg-amber-500/10"
                              }`}>
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className={`size-4 ${
                                  c.status === "signed" ? "text-green-500" : "text-amber-500"
                                }`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{c.title}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {c.status === "signed" ? "Assinado" : "Pendente"} · {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/pdf/contract/${c.id}`, "_blank")}
                                className="h-7 text-[9px] font-semibold gap-1 px-2 rounded-lg active:scale-[0.98] transition-all duration-300"
                              >
                                <HugeiconsIcon icon={Download01Icon} className="size-3" /> PDF
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/portal/${userId}/contrato/${c.id}`, "_blank")}
                                className="h-7 text-[9px] font-semibold gap-1 px-2 rounded-lg active:scale-[0.98] transition-all duration-300"
                              >
                                Portal
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposals Section */}
                <div className="double-bezel-card bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                  <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={InvoiceIcon} strokeWidth={1.5} className="size-4 text-primary" />
                        <h3 className="font-semibold text-xs text-foreground font-display">Propostas Comerciais</h3>
                        {savedProposals.length > 0 && (
                          <span className="text-[9px] font-bold bg-muted text-muted-foreground rounded px-1.5 py-0.5">{savedProposals.length}</span>
                        )}
                      </div>
                      <Button
                        onClick={() => setShowBudgetWizard(true)}
                        className="h-7 text-[9px] font-semibold gap-1 rounded-lg active:scale-[0.98] transition-all duration-300"
                      >
                        <HugeiconsIcon icon={Add01Icon} className="size-3" /> Nova Proposta
                      </Button>
                    </div>
                    {savedProposals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/30 rounded-xl bg-muted/5">
                        <HugeiconsIcon icon={InvoiceIcon} strokeWidth={1.5} className="size-8 text-muted-foreground/40 mb-2" />
                        <p className="text-xs text-muted-foreground">Nenhuma proposta criada.</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Gere propostas personalizadas e exporte como PDF.</p>
                        <Button
                          onClick={() => setShowBudgetWizard(true)}
                          variant="link"
                          className="text-[10px] text-primary h-auto p-0 mt-2 font-semibold"
                        >
                          Criar Primeira Proposta
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {savedProposals.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-muted/5 border border-border/30 rounded-xl hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <HugeiconsIcon icon={File01Icon} strokeWidth={1.5} className="size-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/pdf/proposal/${p.id}`, "_blank")}
                                className="h-7 text-[9px] font-semibold gap-1 px-2 rounded-lg active:scale-[0.98] transition-all duration-300"
                              >
                                <HugeiconsIcon icon={Download01Icon} className="size-3" /> PDF
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Calendar Tab */}
            {activeTab === "calendar" && (
              <div className="tab-content-item">
                <CalendarMonthView clientId={id} userId={userId} triggerToast={triggerToast} />
              </div>
            )}

            {/* 6. Notes Tab */}
            {activeTab === "notes" && (
              <div className="double-bezel-card tab-content-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/20">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="size-4 text-primary" />
                    <h3 className="font-semibold text-xs text-foreground font-display">Anotações Internas (Context Shadow)</h3>
                  </div>
                  <ClientNotesPanel notes={clientNotes} onAdd={handleAddNote} onDelete={handleDeleteNote} onEdit={handleEditNote} />
                </div>
              </div>
            )}

            {/* 7. Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="double-bezel-card tab-content-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/20">
                    <HugeiconsIcon icon={Layers01Icon} strokeWidth={1.5} className="size-4 text-primary" />
                    <h3 className="font-semibold text-xs text-foreground font-display">Linha do Tempo Unificada</h3>
                  </div>
                  <ClientTimeline clientId={id} />
                </div>
              </div>
            )}

            {/* 8. Copilot Tab */}
            {activeTab === "copilot" && (
              <div className="double-bezel-card tab-content-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
                <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/20">
                    <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.5} className="size-4 text-primary" />
                    <h3 className="font-semibold text-xs text-foreground font-display">Copiloto de Respostas</h3>
                  </div>
                  <ResponseCopilot clientId={id} clientName={client?.name || ""} />
                </div>
              </div>
            )}

          </div>

        </section>

      </div>
      </>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        clientId={id}
        open={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onCreated={(project) => {
          setClientProjects(prev => [project as any, ...prev])
          setSelectedProjectId(project.id)
          setHasProjects(true)
          setProjectRefreshKey(k => k + 1)
          setShowCreateProjectModal(false)
          triggerToast("Projeto criado com sucesso!")
        }}
      />

      {/* 1. Modal Geração de Propostas Comerciais */}
      {showBudgetWizard && client && (
        <BudgetProposalWizard
          clientId={id}
          clientName={client.name}
          projectId={selectedProjectId}
          projects={clientProjects}
          globalServices={globalServices}
          open={showBudgetWizard}
          onClose={() => setShowBudgetWizard(false)}
          onSaved={(asset) => {
            setSavedProposals(prev => [asset, ...prev])
          }}
          onToast={triggerToast}
        />
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
                onClick={() => { setEditingQuicklink(null); setShowQuicklinkModalNew(false); }}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">{editingQuicklink ? "Editar Link Rápido" : "Adicionar Link Rápido"}</h3>
              <p className="text-[10px] text-muted-foreground mb-4">{editingQuicklink ? "Atualize as informações do link rápido." : "Adicione um link útil de acesso rápido (ex: drive, repositório) para este cliente."}</p>
              
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
                onClick={() => { setEditingApproval(null); setShowApprovalModalNew(false); }}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">{editingApproval ? "Editar Solicitação de Aprovação" : "Solicitar Aprovação"}</h3>
              <p className="text-[10px] text-muted-foreground mb-4">{editingApproval ? "Atualize os detalhes da solicitação de aprovação." : "Envie uma entrega (copy, arte, página, documento) para aprovação formal do cliente."}</p>
              
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
                onClick={() => { setEditingScope(null); setShowScopeModalNew(false); }}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">{editingScope ? "Editar Item de Escopo" : "Adicionar Item de Escopo"}</h3>
              <p className="text-[10px] text-muted-foreground mb-4">{editingScope ? "Atualize as informações do item de escopo." : "Adicione uma cota de entregas (ex: 8 posts mensais) para controlar o consumo operacional."}</p>
              
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="s-price" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Valor do Serviço (R$)</Label>
                    <Input
                      id="s-price"
                      type="text"
                      required
                      value={newScopePrice}
                      onChange={(e) => setNewScopePrice(e.target.value)}
                      placeholder="Ex: 1200"
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="s-billing" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Tipo de Cobrança</Label>
                    <select
                      id="s-billing"
                      value={newScopeBilling}
                      onChange={(e) => setNewScopeBilling(e.target.value)}
                      className="bg-card border border-border/40 rounded-lg p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 h-10"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
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

      {/* Quick Task Modal */}
      {showQuickTaskModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button
                onClick={() => setShowQuickTaskModal(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Tarefa Rápida</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Adicione uma tarefa ao Kanban deste cliente.</p>
              <Input
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Ex: Enviar relatório mensal"
                className="bg-muted/10 border-border/40 text-xs mb-4"
                onKeyDown={(e) => e.key === "Enter" && handleQuickCreateTask()}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowQuickTaskModal(false)} className="text-xs h-9 rounded-xl">Cancelar</Button>
                <Button onClick={handleQuickCreateTask} className="text-xs h-9 rounded-xl">Criar Tarefa</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Note Modal */}
      {showQuickNoteModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button
                onClick={() => setShowQuickNoteModal(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Nota Rápida</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Salve um contexto importante sobre este cliente.</p>
              <div className="space-y-3 mb-4">
                <div className="flex gap-1.5">
                  {["context", "insight", "follow-up", "urgent"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuickNoteTag(tag)}
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg transition-all duration-300 ${
                        quickNoteTag === tag
                          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                          : "text-muted-foreground hover:bg-muted/50 ring-1 ring-border/30"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={quickNoteContent}
                  onChange={(e) => setQuickNoteContent(e.target.value)}
                  placeholder="Ex: Cliente mencionou interesse em Expandir para novo mercado..."
                  className="bg-muted/10 border-border/40 text-xs min-h-[80px] resize-none"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowQuickNoteModal(false)} className="text-xs h-9 rounded-xl">Cancelar</Button>
                <Button onClick={handleQuickAddNote} disabled={!quickNoteContent.trim()} className="text-xs h-9 rounded-xl">Salvar Nota</Button>
              </div>
            </div>
          </div>
        </div>
      )}

  
      {/* Quick Meeting Modal */}
      
      {/* Quick Briefing Modal */}
      {showQuickBriefingModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button
                onClick={() => setShowQuickBriefingModal(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Enviar Briefing</h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                Crie um briefing de projeto e gere o link do portal para o cliente preencher.
              </p>

              {briefingLink ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-emerald-500" />
                      <p className="text-xs font-semibold text-emerald-500">Briefing criado com sucesso!</p>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/5 border border-border/20 rounded-lg p-2">
                      <input
                        type="text"
                        readOnly
                        value={briefingLink}
                        className="flex-1 bg-transparent text-[10px] font-mono text-foreground outline-none"
                      />
                      <button
                        onClick={() => { navigator.clipboard.writeText(briefingLink); triggerToast("Link copiado!"); }}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                      >
                        <HugeiconsIcon icon={Copy01Icon} className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/inbox?clientId=${id}`)}
                      className="text-xs h-9 rounded-xl gap-1.5"
                    >
                      <HugeiconsIcon icon={Message01Icon} className="size-3.5" />
                      Enviar no WhatsApp
                    </Button>
                    <Button
                      onClick={() => { setShowQuickBriefingModal(false); setBriefingLink(""); }}
                      className="text-xs h-9 rounded-xl"
                    >
                      Concluir
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleQuickCreateBriefing} className="space-y-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="brief-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                      Nome do Projeto
                    </Label>
                    <Input
                      id="brief-name"
                      type="text"
                      required
                      value={briefingName}
                      onChange={(e) => setBriefingName(e.target.value)}
                      placeholder="Ex: Site Institucional, Campanha Lancamento..."
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="brief-goal" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                      Objetivo Principal (Opcional)
                    </Label>
                    <Textarea
                      id="brief-goal"
                      value={briefingGoal}
                      onChange={(e) => setBriefingGoal(e.target.value)}
                      placeholder="Aumentar leads, melhorar reconhecimento de marca..."
                      className="bg-muted/10 border-border/40 text-xs min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowQuickBriefingModal(false)} className="text-xs h-9 rounded-xl">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creatingBriefing} className="text-xs h-9 rounded-xl">
                      {creatingBriefing ? "Criando..." : "Criar Briefing"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Wizard */}
      {showContractWizard && client && (
        <ContractWizard
          clientId={id}
          clientName={client.name}
          userId={userId}
          projectId={selectedProjectId}
          projects={clientProjects}
          agencySettings={agencySettings}
          open={showContractWizard}
          onClose={() => setShowContractWizard(false)}
          onCreated={(contract) => {
            setContracts(prev => [...prev, { id: contract.id, status: "pending", title: "", createdAt: new Date().toISOString() }])
            setShowContractWizard(false)
          }}
          onToast={triggerToast}
        />
      )}

      {/* Satisfaction Scores Modal */}
      {showSatisfactionModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button
                onClick={() => setShowSatisfactionModal(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>

              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Satisfacao do Cliente (NPS)</h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                Avaliacoes recentes registradas pelo cliente.
              </p>

              {satisfaction.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border/30 rounded-xl bg-muted/5">
                  <p className="text-xs text-muted-foreground">Nenhum score NPS registrado.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Envie uma pesquisa de satisfacao pelo chat.</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/inbox?clientId=${id}`)}
                    className="mt-3 text-xs h-8 rounded-xl"
                  >
                    Ir para o Chat
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-muted/5 border border-border/20 rounded-xl p-3">
                    <span className="text-[10px] font-semibold text-foreground">Media NPS</span>
                    <span className="text-lg font-semibold font-display text-primary">
                      {Math.round(satisfaction.reduce((s, v) => s + v.score, 0) / satisfaction.length)}/10
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2">
                    {satisfaction.map((s) => (
                      <div key={s.id} className="p-2.5 bg-muted/5 border border-border/30 rounded-xl flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold ${s.score >= 8 ? 'text-emerald-500' : s.score >= 5 ? 'text-amber-500' : 'text-destructive'}`}>
                              {s.score}/10
                            </span>
                            {s.note && (
                              <span className="text-[9px] text-muted-foreground truncate">{s.note}</span>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showQuickMeetingModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-6 relative">
              <button
                onClick={() => setShowQuickMeetingModal(false)}
                className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted active:scale-[0.98] transition-all duration-300"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
              <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Agendar Reunião</h3>
              <p className="text-[10px] text-muted-foreground mb-4">Agende uma reunião com este cliente.</p>
              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Título</Label>
                  <Input
                    value={quickMeetingTitle}
                    onChange={(e) => setQuickMeetingTitle(e.target.value)}
                    placeholder="Ex: Reunião de Alinhamento Semanal"
                    className="bg-muted/10 border-border/40 text-xs"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Data</Label>
                    <Input
                      type="date"
                      value={quickMeetingDate}
                      onChange={(e) => setQuickMeetingDate(e.target.value)}
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Horário</Label>
                    <Input
                      type="time"
                      value={quickMeetingTime}
                      onChange={(e) => setQuickMeetingTime(e.target.value)}
                      className="bg-muted/10 border-border/40 text-xs"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Plataforma</Label>
                  <select
                    value={quickMeetingPlatform}
                    onChange={(e) => setQuickMeetingPlatform(e.target.value)}
                    className="bg-card border border-border/40 rounded-lg p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 h-10"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Teams">Microsoft Teams</option>
                    <option value="Presencial">Presencial</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Descrição (opcional)</Label>
                  <Textarea
                    value={quickMeetingDesc}
                    onChange={(e) => setQuickMeetingDesc(e.target.value)}
                    placeholder="Ex: Revisar resultados do mês e planejar próximas ações..."
                    className="bg-muted/10 border-border/40 text-xs min-h-[60px] resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowQuickMeetingModal(false)} className="text-xs h-9 rounded-xl" disabled={creatingMeeting}>Cancelar</Button>
                <Button onClick={handleQuickCreateMeeting} disabled={!quickMeetingTitle.trim() || !quickMeetingDate.trim() || creatingMeeting} className="text-xs h-9 rounded-xl">
                  {creatingMeeting ? "Agendando..." : "Agendar Reunião"}
                </Button>
              </div>
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
