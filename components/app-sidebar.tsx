"use client"

import * as React from "react"
import { authClient } from "@/lib/auth-client"

import { NavUser } from "@/components/nav-user"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building01Icon,
  Home01Icon,
  ChartUpIcon,
  UserGroupIcon,
  Coins01Icon,
  Wifi01Icon,
  Link01Icon,
  LinkSquare02Icon,
  Layers01Icon,
  TimeQuarterPassIcon,
  Edit02Icon,
  Calendar03Icon,
  Download01Icon,
  Scissor01Icon,
  AtIcon,
  ContactBookIcon,
  Message01Icon,
  Search01Icon,
  CpuIcon,
  Settings01Icon,
  Briefcase01Icon,
  PlugIcon,
  UserIcon,
  BookOpen01Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons"

const sectionsData = [
  {
    label: "Foco",
    items: [
      {
        name: "Central de Foco",
        url: "/dashboard",
        icon: <HugeiconsIcon icon={ZapIcon} strokeWidth={1.5} className="size-4" />,
        dataTour: "dashboard-link",
      },
      {
        name: "Inbox (Chat)",
        url: "/inbox",
        icon: <HugeiconsIcon icon={Message01Icon} strokeWidth={1.5} className="size-4" />,
        dataTour: "inbox-link",
      },
    ],
  },
  {
    label: "Gestao",
    items: [
      {
        name: "Clientes",
        url: "/clients",
        icon: <HugeiconsIcon icon={ContactBookIcon} strokeWidth={1.5} className="size-4" />,
        dataTour: "clients-link",
      },
      {
        name: "Pipeline",
        url: "/pipeline",
        icon: <HugeiconsIcon icon={Layers01Icon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Area do Cliente",
        url: "/client-portal",
        icon: <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={1.5} className="size-4" />,
      },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      {
        name: "Servicos",
        url: "/services",
        icon: <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Prospeccao AI",
        url: "/prospects",
        icon: <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="size-4" />,
        badge: "BETA",
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        name: "Assistente RAG",
        url: "/settings/ai",
        icon: <HugeiconsIcon icon={CpuIcon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Integracoes",
        url: "/settings/integrations",
        icon: <HugeiconsIcon icon={PlugIcon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Configuracoes",
        url: "/settings/agency",
        icon: <HugeiconsIcon icon={Settings01Icon} strokeWidth={1.5} className="size-4" />,
        dataTour: "settings-link",
      },
      {
        name: "Dicionario",
        url: "/help/dictionary",
        icon: <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={1.5} className="size-4" />,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()

  const user = session?.user ? {
    name: session.user.name || "Usuário",
    email: session.user.email,
    avatar: session.user.image || "https://github.com/shadcn.png"
  } : {
    name: "Visitante",
    email: "",
    avatar: "https://github.com/shadcn.png"
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props} data-tour="sidebar" className="border-r border-border/40 bg-sidebar/50">
      <SidebarHeader className="pt-4 pb-1 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />} className="hover:bg-transparent active:bg-transparent px-0">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-card border border-border/50 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105">
                <HugeiconsIcon icon={Building01Icon} strokeWidth={1.5} className="size-4 text-muted-foreground/90" />
              </div>
              <div className="grid flex-1 text-left gap-px ml-1 leading-tight overflow-hidden">
                <div className="flex items-center gap-1.5 w-full">
                  <span className="truncate font-display text-[11px] font-semibold tracking-wide text-foreground/90">Kyper Agência</span>
                  <span className="shrink-0 text-[7px] font-bold tracking-widest bg-muted text-muted-foreground/80 rounded-full px-1 py-px uppercase">
                    BETA
                  </span>
                </div>
                <span className="text-[9px] text-muted-foreground/70 font-medium">Free</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="no-scrollbar">
        <NavMain sections={sectionsData} />
      </SidebarContent>

      <SidebarFooter className="p-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
