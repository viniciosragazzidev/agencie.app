"use client"

import { SettingsCard, SettingsSection } from "@/components/settings"
import { Button } from "@/components/ui/button"
import {
  NoteIcon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Plug01Icon,
  ArrowRight01Icon,
  UserIcon,
  Building01Icon,
  ZapIcon,
  UserAdd01Icon,
  Add01Icon,
  CreditCardIcon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

// Mock data - substituir com dados reais da API
const stats = [
  {
    label: "Integrações Ativas",
    value: "3",
    icon: Plug01Icon,
    trend: "+1 este mês",
    href: "/settings/integrations",
  },
  {
    label: "Membros da Equipe",
    value: "5",
    icon: UserIcon,
    trend: "2 convites pendentes",
    href: "/settings/team",
  },
  {
    label: "Storage Utilizado",
    value: "2.4 GB",
    icon: Building01Icon,
    trend: "de 10 GB",
    href: "/settings/billing",
  },
  {
    label: "API TelephoneIcons",
    value: "12.5k",
    icon: ZapIcon,
    trend: "este mês",
    href: "/settings/api-keys",
  },
]

const quickActions = [
  {
    title: "Convidar Membro",
    description: "Adicione novos membros à sua equipe",
    icon: UserAdd01Icon,
    href: "/settings/team",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Nova Integração",
    description: "Conecte ferramentas externas",
    icon: Add01Icon,
    href: "/settings/integrations",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Atualizar Plano",
    description: "Expanda os recursos disponíveis",
    icon: CreditCardIcon,
    href: "/settings/billing",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Ver Logs",
    description: "Auditoria de atividades",
    icon: NoteIcon,
    href: "/settings/security",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
]

const recentActivity = [
  {
    action: "Configuração de IA atualizada",
    user: "Você",
    timestamp: "Há 2 horas",
    type: "update",
  },
  {
    action: "WhatsApp conectado com sucesso",
    user: "Você",
    timestamp: "Há 5 horas",
    type: "success",
  },
  {
    action: "Novo membro adicionado: João Silva",
    user: "Admin",
    timestamp: "Ontem",
    type: "info",
  },
  {
    action: "Webhook configurado: client.created",
    user: "Você",
    timestamp: "2 dias atrás",
    type: "info",
  },
]

const integrationStatus = [
  {
    name: "WhatsApp",
    status: "connected",
    lastSync: "Há 5 minutos",
  },
  {
    name: "Google Calendar",
    status: "connected",
    lastSync: "Há 1 hora",
  },
  {
    name: "OpenAI",
    status: "connected",
    lastSync: "Há 2 minutos",
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-heading font-semibold">
          Configurações
        </h1>
        <p className="text-[10px] text-muted-foreground mt-1">
          Gerencie suas configurações e preferências do sistema
        </p>
      </div>

      {/* Quick Stats */}
      <SettingsSection
        title="Visão Geral"
        description="Estatísticas rápidas do seu workspace"
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href}>
                <div className="group card-modern hover-lift">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-lg font-heading font-bold">
                        {stat.value}
                      </p>
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="h-2.5 w-2.5" />
                        {stat.trend}
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-2 group-hover:bg-primary/15 transition-colors">
                      <HugeiconsIcon icon={Icon} strokeWidth={1.5} className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </SettingsSection>

      {/* Quick Actions */}
      <SettingsSection
        title="Ações Rápidas"
        description="Acesse rapidamente as funcionalidades mais usadas"
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <div className="group card-modern hover-lift">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl ${action.bgColor} p-2 group-hover:scale-105 transition-transform`}>
                      <HugeiconsIcon icon={Icon} strokeWidth={1.5} className={`h-4 w-4 ${action.color}`} />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-heading font-semibold">{action.title}</p>
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-snug">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </SettingsSection>

      {/* Two column layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="card-modern space-y-3">
          <div>
            <h2 className="text-xs font-heading font-semibold text-foreground flex items-center gap-2">
              <div className="size-7 rounded-xl bg-primary/10 flex items-center justify-center">
                <HugeiconsIcon icon={NoteIcon} strokeWidth={1.5} className="size-3.5 text-primary" />
              </div>
              Atividade Recente
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1 ml-9">Últimas mudanças nas configurações</p>
          </div>
            
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {activity.type === "success" && (
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className="h-4 w-4 text-green-500" />
                    )}
                    {activity.type === "update" && (
                      <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={1.5} className="h-4 w-4 text-blue-500" />
                    )}
                    {activity.type === "info" && (
                      <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.5} className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-medium">{activity.action}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {activity.user} • {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-3 border-t border-border/30">
              <Button variant="ghost" size="sm" className="w-full text-[9px] h-7 rounded-xl">
                <Link href="/settings/security" className="flex items-center gap-1">
                  Ver todos os logs
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="h-3 w-3" />
                </Link>
              </Button>
            </div>
        </div>

        {/* Integration Status */}
        <div className="card-modern space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-heading font-semibold text-foreground flex items-center gap-2">
                <div className="size-7 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HugeiconsIcon icon={Plug01Icon} strokeWidth={1.5} className="size-3.5 text-primary" />
                </div>
                Status das Integrações
              </h2>
              <p className="text-[10px] text-muted-foreground mt-1 ml-9">Conectividade e sincronização</p>
            </div>
            <Button variant="outline" size="xs" className="text-[9px] h-6 px-2 rounded-xl">
              <Link href="/settings/integrations">Gerenciar</Link>
            </Button>
          </div>
            
          <div className="space-y-2.5">
            {integrationStatus.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <HugeiconsIcon icon={Plug01Icon} strokeWidth={1.5} className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{integration.name}</p>
                    <p className="text-[9px] text-muted-foreground">
                      Sincronizado {integration.lastSync}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] text-muted-foreground font-medium">
                    Conectado
                  </span>
                </div>
              </div>
            ))}
          </div>
            
          <div className="pt-3 border-t border-border/30">
            <Button variant="ghost" size="sm" className="w-full text-[9px] h-7 rounded-xl">
              <Link href="/settings/integrations" className="flex items-center gap-1">
                Ver todas as integrações
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
