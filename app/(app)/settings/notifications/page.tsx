"use client"

import { useState } from "react"
import { SettingsCard, SettingsSection, SettingsToggle, SaveBar } from "@/components/settings"
import {
  Mail01Icon,
  Message01Icon,
  Clock01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"

export default function NotificationsSettingsPage() {
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [emailNotifications, setEmailNotifications] = useState({
    newClients: true,
    newProjects: true,
    newMessages: true,
    taskAssigned: true,
    taskCompleted: false,
    teamActivity: true,
    dailyDigest: true,
    weeklyReport: false,
    marketing: false,
  })

  const [pushNotifications, setPushNotifications] = useState({
    newMessages: true,
    taskAssigned: true,
    mentions: true,
    approvals: true,
    payments: true,
  })

  const [whatsappNotifications, setWhatsappNotifications] = useState({
    criticalAlerts: true,
    dailySummary: false,
  })

  const [schedule, setSchedule] = useState({
    doNotDisturb: false,
    startTime: "22:00",
    endTime: "08:00",
  })

  const handleEmailToggle = (key: string, value: boolean) => {
    setEmailNotifications((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const handlePushToggle = (key: string, value: boolean) => {
    setPushNotifications((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const handleWhatsAppToggle = (key: string, value: boolean) => {
    setWhatsappNotifications((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const handleScheduleToggle = (key: string, value: boolean) => {
    setSchedule((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setIsDirty(false)
  }

  const handleDiscard = () => {
    setEmailNotifications({
      newClients: true,
      newProjects: true,
      newMessages: true,
      taskAssigned: true,
      taskCompleted: false,
      teamActivity: true,
      dailyDigest: true,
      weeklyReport: false,
      marketing: false,
    })
    setPushNotifications({
      newMessages: true,
      taskAssigned: true,
      mentions: true,
      approvals: true,
      payments: true,
    })
    setWhatsappNotifications({
      criticalAlerts: true,
      dailySummary: false,
    })
    setSchedule({
      doNotDisturb: false,
      startTime: "22:00",
      endTime: "08:00",
    })
    setIsDirty(false)
  }

  return (
    <>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-lg font-heading font-semibold">
            Notificações
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Configure como você deseja ser notificado
          </p>
        </div>

        {/* Email Notifications */}
        <SettingsSection
          title="Notificações por Email"
          description="Receba atualizações importantes por email"
        >
          <SettingsCard title="Notificações por Email" icon={Mail01Icon}>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium mb-1.5">Clientes e Projetos</h4>
                <div className="space-y-3">
                  <SettingsToggle
                    label="Novos clientes"
                    description="Quando um novo cliente for adicionado"
                    enabled={emailNotifications.newClients}
                    onChange={(value) => handleEmailToggle("newClients", value)}
                  />
                  <SettingsToggle
                    label="Novos projetos"
                    description="Quando um novo projeto for criado"
                    enabled={emailNotifications.newProjects}
                    onChange={(value) => handleEmailToggle("newProjects", value)}
                  />
                  <SettingsToggle
                    label="Novas mensagens"
                    description="Quando receber uma nova mensagem no inbox"
                    enabled={emailNotifications.newMessages}
                    onChange={(value) => handleEmailToggle("newMessages", value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <h4 className="text-xs font-medium mb-1.5">Tarefas</h4>
                <div className="space-y-3">
                  <SettingsToggle
                    label="Tarefas atribuídas"
                    description="Quando uma tarefa for atribuída a você"
                    enabled={emailNotifications.taskAssigned}
                    onChange={(value) => handleEmailToggle("taskAssigned", value)}
                  />
                  <SettingsToggle
                    label="Tarefas concluídas"
                    description="Quando uma tarefa for marcada como concluída"
                    enabled={emailNotifications.taskCompleted}
                    onChange={(value) => handleEmailToggle("taskCompleted", value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <h4 className="text-xs font-medium mb-1.5">Equipe e Relatórios</h4>
                <div className="space-y-3">
                  <SettingsToggle
                    label="Atividade da equipe"
                    description="Quando membros da equipe fizerem alterações"
                    enabled={emailNotifications.teamActivity}
                    onChange={(value) => handleEmailToggle("teamActivity", value)}
                  />
                  <SettingsToggle
                    label="Resumo diário"
                    description="Receba um resumo das atividades do dia"
                    enabled={emailNotifications.dailyDigest}
                    onChange={(value) => handleEmailToggle("dailyDigest", value)}
                  />
                  <SettingsToggle
                    label="Relatório semanal"
                    description="Receba um relatório completo toda semana"
                    enabled={emailNotifications.weeklyReport}
                    onChange={(value) => handleEmailToggle("weeklyReport", value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <h4 className="text-xs font-medium mb-1.5">Marketing</h4>
                <div className="space-y-3">
                  <SettingsToggle
                    label="Novidades e atualizações"
                    description="Receba notícias sobre novos recursos e melhorias"
                    enabled={emailNotifications.marketing}
                    onChange={(value) => handleEmailToggle("marketing", value)}
                  />
                </div>
              </div>
            </div>
          </SettingsCard>
        </SettingsSection>

        {/* Push Notifications */}
        <SettingsSection
          title="Notificações Push"
          description="Notificações no navegador e dispositivos móveis"
        >
          <SettingsCard title="Notificações Push" icon={SmartPhone01Icon}>
            <div className="space-y-3">
              <SettingsToggle
                label="Mensagens novas no inbox"
                description="Receba notificações instantâneas de novas mensagens"
                enabled={pushNotifications.newMessages}
                onChange={(value) => handlePushToggle("newMessages", value)}
              />
              <SettingsToggle
                label="Tarefas atribuídas a você"
                description="Quando uma tarefa for designada para você"
                enabled={pushNotifications.taskAssigned}
                onChange={(value) => handlePushToggle("taskAssigned", value)}
              />
              <SettingsToggle
                label="Menções em comentários"
                description="Quando alguém mencionar você em um comentário"
                enabled={pushNotifications.mentions}
                onChange={(value) => handlePushToggle("mentions", value)}
              />
              <SettingsToggle
                label="Aprovações pendentes"
                description="Quando precisar aprovar algo"
                enabled={pushNotifications.approvals}
                onChange={(value) => handlePushToggle("approvals", value)}
              />
              <SettingsToggle
                label="Pagamentos recebidos"
                description="Quando receber um novo pagamento"
                enabled={pushNotifications.payments}
                onChange={(value) => handlePushToggle("payments", value)}
              />
            </div>
          </SettingsCard>
        </SettingsSection>

        {/* WhatsApp Notifications */}
        <SettingsSection
          title="Notificações por WhatsApp"
          description="Receba alertas importantes via WhatsApp"
        >
          <SettingsCard title="WhatsApp" icon={Message01Icon}>
            <div className="space-y-3">
              <SettingsToggle
                label="Alertas críticos"
                description="Apenas para notificações urgentes"
                enabled={whatsappNotifications.criticalAlerts}
                onChange={(value) => handleWhatsAppToggle("criticalAlerts", value)}
              />
              <SettingsToggle
                label="Resumo diário"
                description="Receba um resumo das atividades do dia"
                enabled={whatsappNotifications.dailySummary}
                onChange={(value) => handleWhatsAppToggle("dailySummary", value)}
              />
            </div>
          </SettingsCard>
        </SettingsSection>

        {/* Schedule */}
        <SettingsSection
          title="Horários"
          description="Configure quando você deseja receber notificações"
        >
          <SettingsCard title="Horários" icon={Clock01Icon}>
            <div className="space-y-4">
              <SettingsToggle
                label="Não perturbe"
                description="Pausar notificações durante um período específico"
                enabled={schedule.doNotDisturb}
                onChange={(value) => handleScheduleToggle("doNotDisturb", value)}
              />

              {schedule.doNotDisturb && (
                <div className="grid gap-4 sm:grid-cols-2 pl-6 border-l-2 border-border/40">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Início
                    </label>
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => {
                        setSchedule((prev) => ({ ...prev, startTime: e.target.value }))
                        setIsDirty(true)
                      }}
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                      Término
                    </label>
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => {
                        setSchedule((prev) => ({ ...prev, endTime: e.target.value }))
                        setIsDirty(true)
                      }}
                      className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>
          </SettingsCard>
        </SettingsSection>
      </div>

      <SaveBar
        isDirty={isDirty}
        onSave={handleSave}
        onDiscard={handleDiscard}
        isSaving={isSaving}
      />
    </>
  )
}
