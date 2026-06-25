"use client"

import React, { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ContactBookIcon, Search01Icon, Add01Icon, MoreVerticalIcon, Coins01Icon, Building01Icon, ZapIcon, Mail01Icon, TelephoneIcon, Location01Icon, NoteIcon, UserIcon, Message01Icon, MapPinIcon, LinkSquare02Icon, InstagramIcon, Linkedin01Icon, Facebook01Icon, TwitterIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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

export default function ClientsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null)

  // Fetch real clients on load
  React.useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients")
        if (res.ok) {
          const data = await res.json()
          setClients(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadClients()
  }, [])

  // UI state hooks
  const [searchQuery, setSearchQuery] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Form states for adding/editing client
  const [clientName, setClientName] = useState("")
  const [clientIndustry, setClientIndustry] = useState("")
  const [clientMrr, setClientMrr] = useState("0")
  const [clientProjects, setClientProjects] = useState("1")
  const [clientStatus, setClientStatus] = useState<"Ativo" | "Em Risco" | "Onboarding">("Ativo")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [stateVal, setStateVal] = useState("")
  const [zip, setZip] = useState("")
  const [notes, setNotes] = useState("")

  // GSAP entrance staggers
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

  // Trigger floating notifications
  const triggerToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const openAddModal = () => {
    setSelectedClient(null)
    setClientName("")
    setClientIndustry("")
    setClientMrr("0")
    setClientProjects("1")
    setClientStatus("Ativo")
    setContactName("")
    setContactEmail("")
    setContactPhone("")
    setStreet("")
    setCity("")
    setStateVal("")
    setZip("")
    setNotes("")
    setShowModal(true)
  }

  const openEditModal = (client: Client) => {
    setSelectedClient(client)
    setClientName(client.name)
    setClientIndustry(client.industry || "")
    setClientMrr(client.mrr)
    setClientProjects(client.projects)
    setClientStatus(client.status)
    setContactName(client.contactName || "")
    setContactEmail(client.contactEmail || "")
    setContactPhone(client.contactPhone || "")
    setStreet(client.street || "")
    setCity(client.city || "")
    setStateVal(client.state || "")
    setZip(client.zip || "")
    setNotes(client.notes || "")
    setShowModal(true)
    setActiveMenuId(null)
  }

  // Create or Update Client handler
  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) {
      triggerToast("Nome da empresa é obrigatório.", "error")
      return
    }

    const payload = {
      name: clientName,
      industry: clientIndustry || null,
      status: clientStatus,
      projects: clientProjects,
      mrr: clientMrr,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      street: street || null,
      city: city || null,
      state: stateVal || null,
      zip: zip || null,
      notes: notes || null,
    }

    try {
      if (selectedClient) {
        // Edit mode
        const res = await fetch(`/api/clients/${selectedClient.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
          triggerToast(`Cliente "${updated.name}" atualizado com sucesso!`)
          setShowModal(false)
        } else {
          const err = await res.json()
          triggerToast(err.error || "Erro ao atualizar cliente.", "error")
        }
      } else {
        // Create mode
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setClients(prev => [created, ...prev])
          triggerToast(`Cliente "${created.name}" cadastrado com sucesso!`)
          setShowModal(false)
        } else {
          const err = await res.json()
          triggerToast(err.error || "Erro ao cadastrar cliente.", "error")
        }
      }
    } catch (err) {
      triggerToast("Erro de conexão.", "error")
    }
  }

  // Delete Client handler
  const handleDeleteClient = (id: string, name: string) => {
    setClientToDelete({ id, name })
  }

  const executeDeleteClient = async () => {
    if (!clientToDelete) return
    const { id, name } = clientToDelete
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== id))
        setActiveMenuId(null)
        triggerToast(`Cliente "${name}" excluído.`, "info")
      } else {
        triggerToast("Erro ao excluir cliente.", "error")
      }
    } catch (err) {
      triggerToast("Erro de conexão.", "error")
    }
  }

  // Toggle client status directly
  const handleToggleStatus = async (id: string, currentStatus: "Ativo" | "Em Risco" | "Onboarding") => {
    const nextStatusMap: Record<string, "Ativo" | "Em Risco" | "Onboarding"> = {
      "Ativo": "Em Risco",
      "Em Risco": "Onboarding",
      "Onboarding": "Ativo"
    }
    const nextStatus = nextStatusMap[currentStatus]
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setClients(prev => prev.map(c => c.id === id ? updated : c))
        triggerToast(`Status atualizado para ${nextStatus}`)
      }
    } catch (err) {
      triggerToast("Erro ao alternar status.", "error")
    }
  }

  // Fast Outreach transfer
  const handleStartOutreach = (client: Client) => {
    const defaultApproach = `Olá ${client.contactName || "representante da " + client.name}, somos especialistas no ramo de ${client.industry || "serviços"} e gostaríamos de apresentar nossa proposta comercial.`
    const encodedName = encodeURIComponent(client.name)
    const encodedContact = encodeURIComponent(client.contactName || "")
    const encodedPhone = encodeURIComponent(client.contactPhone || "")
    const encodedApproach = encodeURIComponent(defaultApproach)
    router.push(`/inbox?clientName=${encodedName}&contactName=${encodedContact}&contactPhone=${encodedPhone}&approach=${encodedApproach}`)
  }

  // Dynamic statistics calculations
  const totalMrr = clients.reduce((acc, curr) => acc + (parseFloat(curr.mrr) || 0), 0)
  const totalProjects = clients.reduce((acc, curr) => acc + (parseInt(curr.projects) || 0), 0)
  const churnRiskCount = clients.filter(c => c.status === "Em Risco").length

  // Filter clients
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.contactName && c.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.contactEmail && c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      
      {/* Scrollable Container */}
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto overflow-y-auto no-scrollbar">
        
        {/* Dynamic header row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bento-item mb-6">
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">Clientes CRM</h1>
            <p className="text-xs text-muted-foreground mt-1">Gerencie a carteira de clientes, projetos ativos, faturamento mensal e ramos de atividade.</p>
          </div>
          <Button 
            onClick={openAddModal}
            className="active:scale-[0.97] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] text-xs h-9 gap-1.5"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Main List Box */}
          <div className="lg:col-span-8 double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
            <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] flex flex-col h-full min-h-[400px]">
              
              {/* Search bar area */}
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <div className="relative w-64">
                  <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar cliente, contato ou ramo..." 
                    className="pl-9 h-9 bg-muted/30 border-border/40 rounded-xl text-xs" 
                  />
                </div>
              </div>
              
              {/* Table details */}
              <div className="p-0 flex-1 overflow-x-auto no-scrollbar">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">Carregando clientes...</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/10 border-b border-border/40 text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                      <tr>
                        <th className="px-6 py-4 font-bold">Empresa / Ramo</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold">Projetos</th>
                        <th className="px-6 py-4 font-bold">MRR</th>
                        <th className="px-6 py-4 font-bold text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-xs">
                            Nenhum cliente cadastrado
                          </td>
                        </tr>
                      ) : (
                        filteredClients.map((client) => (
                          <tr key={client.id} className="group hover:bg-muted/5 transition-colors relative">
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-foreground text-xs">{client.name}</span>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {client.industry ? (
                                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-95 origin-left">
                                        {client.industry}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-muted-foreground italic">Sem ramo</span>
                                    )}
                                    {client.contactName && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                        • <HugeiconsIcon icon={UserIcon} className="size-3" /> {client.contactName}
                                      </span>
                                    )}
                                    {/* QoL Links — inline with badges */}
                                    {client.street && (
                                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${client.street}, ${client.city || ""} - ${client.state || ""}`)}`} target="_blank" rel="noreferrer" title="Ver no Mapa" className="p-0.5 hover:bg-muted text-muted-foreground hover:text-primary rounded transition-colors">
                                        <HugeiconsIcon icon={MapPinIcon} className="size-3" />
                                      </a>
                                    )}
                                    {client.websites?.[0] && (
                                      <a href={client.websites[0].startsWith('http') ? client.websites[0] : `https://${client.websites[0]}`} target="_blank" rel="noreferrer" title="Visitar Site" className="p-0.5 hover:bg-muted text-muted-foreground hover:text-primary rounded transition-colors">
                                        <HugeiconsIcon icon={LinkSquare02Icon} className="size-3" />
                                      </a>
                                    )}
                                    {client.socials && Object.keys(client.socials).map(net => (
                                      <a key={net} href={client.socials![net]} target="_blank" rel="noreferrer" title={net} className="p-0.5 hover:bg-muted text-muted-foreground hover:text-primary rounded transition-colors">
                                        {net.toLowerCase().includes('insta') ? <HugeiconsIcon icon={InstagramIcon} className="size-3" /> :
                                         net.toLowerCase().includes('linked') ? <HugeiconsIcon icon={Linkedin01Icon} className="size-3" /> :
                                         net.toLowerCase().includes('face') ? <HugeiconsIcon icon={Facebook01Icon} className="size-3" /> :
                                         net.toLowerCase().includes('twit') || net.toLowerCase().includes('x') ? <HugeiconsIcon icon={TwitterIcon} className="size-3" /> :
                                         <HugeiconsIcon icon={LinkSquare02Icon} className="size-3" />}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                              <span 
                                onClick={() => handleToggleStatus(client.id, client.status)}
                                className={`text-[8px] font-bold tracking-widest ring-1 rounded-full px-2 py-0.5 uppercase cursor-pointer transition-all active:scale-95 ${
                                  client.status === 'Ativo' ? 'bg-primary/10 text-primary ring-primary/20 hover:bg-primary/20' :
                                  client.status === 'Em Risco' ? 'bg-destructive/10 text-destructive ring-destructive/20 hover:bg-destructive/20' :
                                  'bg-amber-500/10 text-amber-500 ring-amber-500/20 hover:bg-amber-500/20'
                                }`}
                              >
                                {client.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground font-medium">{client.projects} ativos</td>
                            <td className="px-6 py-4 text-foreground font-semibold">R$ {(parseFloat(client.mrr) || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right relative">
                              <div className="inline-block text-left">
                                <button 
                                  onClick={() => setActiveMenuId(activeMenuId === client.id ? null : client.id)}
                                  className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                                >
                                  <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
                                </button>
                                
                                {/* Simple dropdown panel */}
                                {activeMenuId === client.id && (
                                  <div className="absolute right-6 top-8 z-10 w-36 bg-card border border-border/40 rounded-xl shadow-lg p-1.5 flex flex-col text-left animate-in fade-in slide-in-from-top-1 duration-150">
                                    <button
                                      onClick={() => router.push(`/clients/${client.id}`)}
                                      className="px-2.5 py-1.5 hover:bg-muted text-[10px] text-foreground font-semibold rounded-lg text-left transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      <HugeiconsIcon icon={Building01Icon} className="size-3.5 text-muted-foreground" />
                                      Bancada Cliente
                                    </button>
                                    <button
                                      onClick={() => handleStartOutreach(client)}
                                      className="px-2.5 py-1.5 hover:bg-muted text-[10px] text-foreground font-semibold rounded-lg text-left transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      <HugeiconsIcon icon={Message01Icon} className="size-3.5 text-muted-foreground" />
                                      Abordar via Chat
                                    </button>
                                    <button
                                      onClick={() => openEditModal(client)}
                                      className="px-2.5 py-1.5 hover:bg-muted text-[10px] text-foreground font-semibold rounded-lg text-left transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      Editar Info
                                    </button>
                                    <button
                                      onClick={() => handleToggleStatus(client.id, client.status)}
                                      className="px-2.5 py-1.5 hover:bg-muted text-[10px] text-foreground font-semibold rounded-lg text-left transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      Alternar Status
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClient(client.id, client.name)}
                                      className="px-2.5 py-1.5 hover:bg-destructive/10 text-[10px] text-destructive font-semibold rounded-lg text-left transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Stats Panel */}
          <div className="lg:col-span-4 space-y-5">
            <div className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <HugeiconsIcon icon={ContactBookIcon} className="size-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-foreground">Visão Geral</h3>
                    <p className="text-[10px] text-muted-foreground">Métricas integradas do CRM</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-muted/10 border border-border/30 p-4 rounded-2xl">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 flex items-center gap-1">
                      <HugeiconsIcon icon={Building01Icon} className="size-3 text-muted-foreground" />
                      Total de Clientes
                    </p>
                    <p className="text-2xl font-display font-medium text-foreground">{clients.length}</p>
                  </div>
                  
                  <div className="bg-muted/10 border border-border/30 p-4 rounded-2xl">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 flex items-center gap-1">
                      <HugeiconsIcon icon={Coins01Icon} className="size-3 text-muted-foreground" />
                      MRR Faturamento
                    </p>
                    <p className="text-2xl font-display font-medium text-foreground">R$ {totalMrr.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-muted/10 border border-border/30 p-4 rounded-2xl relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1 bg-destructive" />
                    <p className="text-[9px] uppercase tracking-widest text-destructive font-bold mb-1.5 flex items-center gap-1 relative">
                      <HugeiconsIcon icon={ZapIcon} className="size-3 text-destructive" />
                      Clientes em Risco (Churn)
                    </p>
                    <p className="text-2xl font-display font-medium relative text-destructive">{churnRiskCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Floating Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-card border border-border/50 w-full max-w-lg rounded-[1.5rem] p-6 my-8 shadow-2xl animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-sm font-semibold text-foreground mb-4">
              {selectedClient ? "Editar Detalhes do Cliente" : "Adicionar Novo Cliente"}
            </h3>
            
            <form onSubmit={handleSubmitClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* General Info */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 pb-1 border-b border-border/20">
                    <HugeiconsIcon icon={Building01Icon} className="size-3" /> Informações Gerais
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="c-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nome da Empresa</Label>
                    <Input
                      id="c-name"
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: ACME Corporation"
                      className="bg-muted/10 border-border/40"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="c-industry" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Ramo de Atuação</Label>
                    <Input
                      id="c-industry"
                      type="text"
                      value={clientIndustry}
                      onChange={(e) => setClientIndustry(e.target.value)}
                      placeholder="Ex: Tecnologia, Varejo, Saúde"
                      className="bg-muted/10 border-border/40"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="c-mrr" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">MRR (Faturamento)</Label>
                    <Input
                      id="c-mrr"
                      type="text"
                      required
                      value={clientMrr}
                      onChange={(e) => setClientMrr(e.target.value)}
                      placeholder="Ex: 5000"
                      className="bg-muted/10 border-border/40"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="c-projects" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Projetos Ativos</Label>
                    <Input
                      id="c-projects"
                      type="text"
                      required
                      value={clientProjects}
                      onChange={(e) => setClientProjects(e.target.value)}
                      placeholder="Ex: 2"
                      className="bg-muted/10 border-border/40"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Status do Cliente</Label>
                    <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-xl border border-border/40">
                      {["Ativo", "Em Risco", "Onboarding"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setClientStatus(status as any)}
                          className={`py-1.5 text-[9px] font-bold rounded-lg transition-all active:scale-[0.96] cursor-pointer ${
                            clientStatus === status 
                              ? "bg-card text-foreground shadow-sm ring-1 ring-border/30" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contacts Info */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 pb-1 border-b border-border/20">
                    <HugeiconsIcon icon={UserIcon} className="size-3" /> Contatos & Responsável
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="c-contact-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nome do Contato</Label>
                    <Input
                      id="c-contact-name"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="bg-muted/10 border-border/40"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="c-contact-email" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Email de Contato</Label>
                    <Input
                      id="c-contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Ex: joao@empresa.com"
                      className="bg-muted/10 border-border/40"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="c-contact-phone" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Telefone</Label>
                    <Input
                      id="c-contact-phone"
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Ex: (11) 98888-8888"
                      className="bg-muted/10 border-border/40"
                    />
                  </div>
                </div>

              </div>

              {/* Address Info */}
              <div className="space-y-4 pt-2">
                <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 pb-1 border-b border-border/20">
                  <HugeiconsIcon icon={Location01Icon} className="size-3" /> Localização / Endereço
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-street" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Logradouro / Rua</Label>
                    <Input
                      id="c-street"
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000"
                      className="bg-muted/10 border-border/40"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 grid gap-1.5">
                      <Label htmlFor="c-city" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Cidade</Label>
                      <Input
                        id="c-city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="São Paulo"
                        className="bg-muted/10 border-border/40"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="c-state" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">UF</Label>
                      <Input
                        id="c-state"
                        type="text"
                        maxLength={2}
                        value={stateVal}
                        onChange={(e) => setStateVal(e.target.value)}
                        placeholder="SP"
                        className="bg-muted/10 border-border/40 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="c-zip" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">CEP</Label>
                    <Input
                      id="c-zip"
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="01310-100"
                      className="bg-muted/10 border-border/40"
                    />
                  </div>
                  <div className="md:col-span-2 grid gap-1.5">
                    <Label htmlFor="c-notes" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Notas / Observações</Label>
                    <Input
                      id="c-notes"
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Fechado via indicação. Interesse em expandir escopo."
                      className="bg-muted/10 border-border/40"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border/20">
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
                  {selectedClient ? "Salvar Alterações" : "Cadastrar Cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating toast notification */}
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

      {/* Styles */}
      <ConfirmDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
        title="Confirmar exclusão"
        description={`Deseja realmente excluir o cliente "${clientToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir Cliente"
        cancelText="Cancelar"
        onConfirm={executeDeleteClient}
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
