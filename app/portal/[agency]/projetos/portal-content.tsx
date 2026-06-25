"use client"

import React, { useEffect, useState } from "react"
import { ProjectStatusPipeline } from "@/components/project-status-pipeline"
import { ApprovalPanel } from "@/components/approval-panel"
import { OnboardingChecklist } from "@/components/onboarding-checklist"
import { AssetsHub } from "@/components/assets-hub"
import { NPSSurvey } from "@/components/nps-survey"
import { ScopeWall } from "@/components/scope-wall"
import { AdSpendMeter } from "@/components/ad-spend-meter"
import { QuicklinksHub } from "@/components/quicklinks-hub"

interface PortalContentProps {
  clientId: string
  agencyId: string
}

export default function PortalContent({ clientId }: PortalContentProps) {
  const [tasks, setTasks] = useState<{ id: string; title: string; status: "todo" | "in_progress" | "done" }[]>([])
  const [approvals, setApprovals] = useState<{ id: string; title: string; description?: string; fileType: string; status: "pending" | "approved" | "revision" }[]>([])
  const [onboardingTasks, setOnboardingTasks] = useState<{ id: string; title: string; description?: string; isRequired: boolean; isCompleted: boolean }[]>([])
  const [assets, setAssets] = useState<{ id: string; name: string; category: string; fileUrl?: string; linkUrl?: string; notes?: string }[]>([])
  const [scopes, setScopes] = useState<{ id: string; label: string; totalQuota: number; usedQuota: number; period: string }[]>([])
  const [adSpendTrackers, setAdSpendTrackers] = useState<{ id: string; month: string; plannedBudget: string; spentAmount: string; platform: string }[]>([])
  const [quicklinks, setQuicklinks] = useState<{ id: string; label: string; url: string; icon?: string }[]>([])

  useEffect(() => {
    const endpoints = [
      { url: `/api/client-portal/tasks?clientId=${clientId}`, setter: setTasks },
      { url: `/api/client-portal/approvals?clientId=${clientId}`, setter: setApprovals },
      { url: `/api/client-portal/onboarding?clientId=${clientId}`, setter: setOnboardingTasks },
      { url: `/api/client-portal/assets?clientId=${clientId}`, setter: setAssets },
      { url: `/api/client-portal/scope?clientId=${clientId}`, setter: setScopes },
      { url: `/api/client-portal/ad-spend?clientId=${clientId}`, setter: setAdSpendTrackers },
      { url: `/api/client-portal/quicklinks?clientId=${clientId}`, setter: setQuicklinks },
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
