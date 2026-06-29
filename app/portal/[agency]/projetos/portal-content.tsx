"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProjectStatusPipeline } from "@/components/project-status-pipeline"
import { ApprovalPanel } from "@/components/approval-panel"
import { OnboardingChecklist } from "@/components/onboarding-checklist"
import { AssetsHub } from "@/components/assets-hub"
import { NPSSurvey } from "@/components/nps-survey"
import { ScopeWall } from "@/components/scope-wall"
import { AdSpendMeter } from "@/components/ad-spend-meter"
import { QuicklinksHub } from "@/components/quicklinks-hub"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Link01Icon, NoteIcon, CheckmarkCircle02Icon, UserIcon } from "@hugeicons/core-free-icons"

interface PortalContentProps {
  clientId: string
  agencyId: string
}

interface Meeting {
  id: string
  clientId: string
  userId: string
  title: string
  description?: string
  meetingDate: string
  platform: string
  meetingLink?: string
  status: "pending" | "confirmed" | "declined"
  clientSuggestedDate?: string
  clientComment?: string
  createdAt: string
}

interface Contract {
  id: string
  clientId: string
  userId: string
  title: string
  content: string
  status: "pending" | "signed"
  signedAt?: string
  signerName?: string
  signerIp?: string
  signerDocument?: string
  createdAt: string
}

export default function PortalContent({ clientId }: PortalContentProps) {
  const params = useParams()
  const agencySlug = params.agency as string

  const [tasks, setTasks] = useState<{ id: string; title: string; status: "todo" | "in_progress" | "done" }[]>([])
  const [approvals, setApprovals] = useState<{ id: string; title: string; description?: string; fileType: string; status: "pending" | "approved" | "revision" }[]>([])
  const [onboardingTasks, setOnboardingTasks] = useState<{ id: string; title: string; description?: string; isRequired: boolean; isCompleted: boolean }[]>([])
  const [assets, setAssets] = useState<{ id: string; name: string; category: string; fileUrl?: string; linkUrl?: string; notes?: string }[]>([])
  const [scopes, setScopes] = useState<{ id: string; label: string; totalQuota: number; usedQuota: number; period: string }[]>([])
  const [adSpendTrackers, setAdSpendTrackers] = useState<{ id: string; month: string; plannedBudget: string; spentAmount: string; platform: string }[]>([])
  const [quicklinks, setQuicklinks] = useState<{ id: string; label: string; url: string; icon?: string }[]>([])
  
  // New States
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [suggestingMeetingId, setSuggestingMeetingId] = useState<string | null>(null)
  const [suggestedDate, setSuggestedDate] = useState("")
  const [suggestedComment, setSuggestedComment] = useState("")

  useEffect(() => {
    const endpoints = [
      { url: `/api/client-portal/tasks?clientId=${clientId}`, setter: setTasks },
      { url: `/api/client-portal/approvals?clientId=${clientId}`, setter: setApprovals },
      { url: `/api/client-portal/onboarding?clientId=${clientId}`, setter: setOnboardingTasks },
      { url: `/api/client-portal/assets?clientId=${clientId}`, setter: setAssets },
      { url: `/api/client-portal/scope?clientId=${clientId}`, setter: setScopes },
      { url: `/api/client-portal/ad-spend?clientId=${clientId}`, setter: setAdSpendTrackers },
      { url: `/api/client-portal/quicklinks?clientId=${clientId}`, setter: setQuicklinks },
      { url: `/api/client-portal/meetings?clientId=${clientId}`, setter: setMeetings },
      { url: `/api/client-portal/contracts?clientId=${clientId}`, setter: setContracts },
    ]
    endpoints.forEach(({ url, setter }) => {
      fetch(url).then(r => r.json()).then(setter).catch(console.error)
    })
  }, [clientId])

  const handleMoveTask = async (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    await fetch(`/api/client-portal/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/client-portal/tasks/${taskId}`, { method: "DELETE" })
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const handleApprove = async (id: string) => {
    await fetch(`/api/client-portal/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    })
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a))
  }

  const handleRevision = async (id: string, comment: string) => {
    await fetch(`/api/client-portal/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "revision", clientComment: comment }),
    })
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "revision" as const } : a))
  }

  const handleToggleOnboarding = async (id: string, completed: boolean) => {
    await fetch(`/api/client-portal/onboarding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: completed }),
    })
    setOnboardingTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: completed } : t))
  }

  const handleNPS = async (score: number) => {
    await fetch("/api/client-portal/satisfaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, score }),
    })
  }

  // New Handlers
  const handleConfirmMeeting = async (meetingId: string) => {
    const res = await fetch(`/api/client-portal/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMeetings(prev => prev.map(m => m.id === meetingId ? updated : m))
    }
  }

  const handleDeclineMeetingSubmit = async (meetingId: string) => {
    const res = await fetch(`/api/client-portal/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "declined",
        clientSuggestedDate: suggestedDate ? new Date(suggestedDate).toISOString() : null,
        clientComment: suggestedComment,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMeetings(prev => prev.map(m => m.id === meetingId ? updated : m))
      setSuggestingMeetingId(null)
      setSuggestedDate("")
      setSuggestedComment("")
    }
  }

  const isOnboarding = onboardingTasks.length > 0 && !onboardingTasks.every(t => t.isCompleted)

  return (
    <div className="space-y-6">
      <section>
        <QuicklinksHub links={quicklinks} onDelete={() => {}} onEdit={() => {}} />
      </section>

      <section className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
        <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
          <h3 className="font-semibold text-xs text-foreground font-display mb-4">Status dos Projetos</h3>
          <ProjectStatusPipeline tasks={tasks} onMove={handleMoveTask} onDelete={handleDeleteTask} />
        </div>
      </section>

      {/* Meetings and Contracts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Meetings section */}
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col h-full">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-primary" strokeWidth={1.5} />
              Reuniões & Agendamentos
            </h3>
            <div className="flex-1 space-y-3">
              {meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-xl border border-dashed border-border/40 p-4">
                  <p className="text-[10px] text-muted-foreground">Nenhuma reunião agendada no momento.</p>
                </div>
              ) : (
                meetings.map(meeting => {
                  const meetingDateObj = new Date(meeting.meetingDate)
                  const formattedDate = meetingDateObj.toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })

                  return (
                    <div
                      key={meeting.id}
                      className="p-3 bg-muted/5 rounded-xl border border-border/20 space-y-3 hover:border-border/40 transition-colors duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground">{meeting.title}</h4>
                          {meeting.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{meeting.description}</p>
                          )}
                          <p className="text-[10px] text-primary/80 font-medium mt-1">
                            {formattedDate} ({meeting.platform})
                          </p>
                        </div>
                        <div>
                          {meeting.status === "confirmed" && (
                            <span className="text-[9px] font-bold tracking-widest bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 rounded-full px-2 py-0.5 uppercase">
                              Confirmada
                            </span>
                          )}
                          {meeting.status === "declined" && (
                            <span className="text-[9px] font-bold tracking-widest bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 rounded-full px-2 py-0.5 uppercase">
                              Ajuste Proposto
                            </span>
                          )}
                          {meeting.status === "pending" && (
                            <span className="text-[9px] font-bold tracking-widest bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 rounded-full px-2 py-0.5 uppercase">
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>

                      {meeting.status === "confirmed" && meeting.meetingLink && (
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:underline"
                        >
                          <HugeiconsIcon icon={Link01Icon} className="size-3" strokeWidth={1.5} />
                          Entrar na sala de videoconferência
                        </a>
                      )}

                      {meeting.status === "declined" && meeting.clientSuggestedDate && (
                        <div className="p-2 bg-muted/10 rounded-lg text-[9px] text-muted-foreground space-y-1">
                          <p className="font-semibold text-foreground">Sua sugestão de novo horário:</p>
                          <p>
                            {new Date(meeting.clientSuggestedDate).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {meeting.clientComment && (
                            <p className="italic">"{meeting.clientComment}"</p>
                          )}
                        </div>
                      )}

                      {meeting.status === "pending" && suggestingMeetingId !== meeting.id && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleConfirmMeeting(meeting.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-semibold h-7 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-1"
                          >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={1.5} />
                            Confirmar Horário
                          </button>
                          <button
                            onClick={() => {
                              setSuggestingMeetingId(meeting.id)
                              setSuggestedDate("")
                              setSuggestedComment("")
                            }}
                            className="flex-1 bg-muted/20 hover:bg-muted/30 text-foreground border border-border/40 rounded-lg text-[10px] font-semibold h-7 active:scale-[0.98] transition-all duration-300"
                          >
                            Sugerir Outro Horário
                          </button>
                        </div>
                      )}

                      {suggestingMeetingId === meeting.id && (
                        <div className="space-y-3 pt-2 border-t border-border/20">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                              Sugerir Nova Data/Hora
                            </label>
                            <input
                              type="datetime-local"
                              value={suggestedDate}
                              onChange={e => setSuggestedDate(e.target.value)}
                              className="w-full bg-muted/10 border border-border/40 rounded-lg text-[10px] p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                              Motivo/Observação
                            </label>
                            <textarea
                              placeholder="Explique o motivo ou deixe um comentário..."
                              value={suggestedComment}
                              onChange={e => setSuggestedComment(e.target.value)}
                              className="w-full bg-muted/10 border border-border/40 rounded-lg text-[10px] p-2 text-foreground h-16 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={!suggestedDate}
                              onClick={() => handleDeclineMeetingSubmit(meeting.id)}
                              className="flex-1 bg-primary text-primary-foreground disabled:opacity-50 rounded-lg text-[10px] font-semibold h-7 active:scale-[0.98] transition-all duration-300"
                            >
                              Enviar Sugestão
                            </button>
                            <button
                              onClick={() => setSuggestingMeetingId(null)}
                              className="px-3 bg-muted/20 hover:bg-muted/30 text-foreground border border-border/40 rounded-lg text-[10px] font-semibold h-7 active:scale-[0.98] transition-all duration-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Contracts section */}
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col h-full">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={NoteIcon} className="size-4 text-primary" strokeWidth={1.5} />
              Contratos & Propostas
            </h3>
            <div className="flex-1 space-y-3">
              {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-xl border border-dashed border-border/40 p-4">
                  <p className="text-[10px] text-muted-foreground">Nenhum contrato gerado para a sua conta.</p>
                </div>
              ) : (
                contracts.map(contract => (
                  <div
                    key={contract.id}
                    className="p-3 bg-muted/5 rounded-xl border border-border/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-border/40 transition-colors duration-300"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{contract.title}</h4>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        Gerado em: {new Date(contract.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      {contract.status === "signed" && contract.signerName && (
                        <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-medium mt-1">
                          <HugeiconsIcon icon={UserIcon} className="size-3" strokeWidth={1.5} />
                          Assinado por {contract.signerName} em {contract.signedAt ? new Date(contract.signedAt).toLocaleDateString("pt-BR") : ""}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {contract.status === "signed" ? (
                        <>
                          <span className="text-[9px] font-bold tracking-widest bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 rounded-full px-2 py-0.5 uppercase">
                            Assinado
                          </span>
                          <a
                            href={`/portal/${agencySlug}/contrato/${contract.id}`}
                            className="bg-muted/20 hover:bg-muted/30 border border-border/40 text-foreground text-[10px] font-semibold h-7 px-3 rounded-lg flex items-center justify-center active:scale-[0.98] transition-all duration-300"
                          >
                            Ver / Imprimir
                          </a>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold tracking-widest bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 rounded-full px-2 py-0.5 uppercase">
                            Pendente
                          </span>
                          <a
                            href={`/portal/${agencySlug}/contrato/${contract.id}`}
                            className="bg-primary text-primary-foreground hover:opacity-90 text-[10px] font-semibold h-7 px-3 rounded-lg flex items-center justify-center active:scale-[0.98] transition-all duration-300"
                          >
                            Ver e Assinar
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Aprovações Pendentes</h3>
            <ApprovalPanel items={approvals} onApprove={handleApprove} onRevision={handleRevision} onDelete={() => {}} onEdit={() => {}} />
          </div>
        </div>
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Escopo Contratado</h3>
            <ScopeWall scopes={scopes} onDelete={() => {}} onEdit={() => {}} />
          </div>
        </div>
      </section>

      {isOnboarding && (
        <section className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Onboarding</h3>
            <OnboardingChecklist tasks={onboardingTasks} onToggle={handleToggleOnboarding} />
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Entregáveis</h3>
            <AssetsHub assets={assets} onDelete={() => {}} onEdit={() => {}} />
          </div>
        </div>
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
            <h3 className="font-semibold text-xs text-foreground font-display mb-4">Verba de Anúncios</h3>
            <AdSpendMeter trackers={adSpendTrackers} onDelete={() => {}} onEdit={() => {}} />
          </div>
        </div>
      </section>

      <section>
        <NPSSurvey onSubmit={handleNPS} />
      </section>
    </div>
  )
}

