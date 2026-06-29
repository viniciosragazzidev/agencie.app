"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building01Icon,
  UserIcon,
  Notification02Icon,
  Key01Icon,
  WebhookIcon,
  ZapIcon,
  Plug01Icon,
  Settings02Icon,
  CreditCardIcon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const settingsNavigation = [
  {
    name: "Geral",
    href: "/settings",
    icon: Settings02Icon,
    description: "Visão geral e estatísticas"
  },
  {
    name: "Agência",
    href: "/settings/agency",
    icon: Building01Icon,
    description: "Configurações da agência"
  },
  {
    name: "Equipe",
    href: "/settings/team",
    icon: UserIcon,
    description: "Gerenciar membros da equipe"
  },
  {
    name: "IA",
    href: "/settings/ai",
    icon: ZapIcon,
    description: "Configurações de inteligência artificial"
  },
  {
    name: "Integrações",
    href: "/settings/integrations",
    icon: Plug01Icon,
    description: "Conectar ferramentas externas"
  },
  {
    name: "Notificações",
    href: "/settings/notifications",
    icon: Notification02Icon,
    description: "Preferências de notificações"
  },
  {
    name: "API Keys",
    href: "/settings/api-keys",
    icon: Key01Icon,
    description: "Gerenciar chaves de API"
  },
  {
    name: "Webhooks",
    href: "/settings/webhooks",
    icon: WebhookIcon,
    description: "Configurar webhooks"
  },
  {
    name: "Cobrança",
    href: "/settings/billing",
    icon: CreditCardIcon,
    description: "Planos e pagamentos"
  }
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-sm font-heading font-semibold">Configurações</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Gerencie as configurações do sistema
          </p>
        </div>

        <nav className="space-y-0.5 bg-muted/10 p-1.5 rounded-2xl border border-border/20 shadow-inner">
          <div className="bg-card border border-border/40 p-2.5 rounded-[10px] space-y-1">
            {settingsNavigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  <HugeiconsIcon icon={Icon} className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs">{item.name}</div>
                    <div className={cn(
                      "text-[10px] mt-0.5 leading-snug",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground/70"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
