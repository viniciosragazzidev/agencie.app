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
} from "@hugeicons/core-free-icons"

const sectionsData = [
  {
    label: "Workspace",
    items: [
      {
        name: "Dashboard",
        url: "/dashboard",
        icon: <HugeiconsIcon icon={Home01Icon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Inbox (Chat)",
        url: "/inbox",
        icon: <HugeiconsIcon icon={Message01Icon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Projetos",
        url: "#",
        icon: <HugeiconsIcon icon={Layers01Icon} strokeWidth={1.5} className="size-4" />,
      },
    ],
  },
  {
    label: "Crescimento",
    items: [
      {
        name: "Clientes CRM",
        url: "/clients",
        icon: <HugeiconsIcon icon={ContactBookIcon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Pipeline Comercial",
        url: "/pipeline",
        icon: <HugeiconsIcon icon={Layers01Icon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Prospecção AI",
        url: "/prospects",
        icon: <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="size-4" />,
        badge: "BETA",
      },
      {
        name: "Área do Cliente",
        url: "/client-portal",
        icon: <HugeiconsIcon icon={UserIcon} strokeWidth={1.5} className="size-4" />,
        badge: "NEW",
      },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        name: "Faturamento",
        url: "#",
        icon: <HugeiconsIcon icon={Coins01Icon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Serviços",
        url: "/services",
        icon: <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Assistente RAG",
        url: "/settings/ai",
        icon: <HugeiconsIcon icon={CpuIcon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Integrações",
        url: "/settings/integrations",
        icon: <HugeiconsIcon icon={PlugIcon} strokeWidth={1.5} className="size-4" />,
      },
      {
        name: "Configurações",
        url: "#",
        icon: <HugeiconsIcon icon={Settings01Icon} strokeWidth={1.5} className="size-4" />,
      },
    ],
  },
  {
    label: "Ajuda",
    items: [
      {
        name: "Dicionário",
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
    <Sidebar variant="sidebar" {...props} className="border-r border-border/40 bg-sidebar/50">
      <SidebarHeader className="pt-6 pb-2 px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />} className="hover:bg-transparent active:bg-transparent px-0">
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-card border border-border/50 shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105">
                <HugeiconsIcon icon={Building01Icon} strokeWidth={1.5} className="size-5 text-muted-foreground" />
              </div>
              <div className="grid flex-1 text-left gap-0.5 ml-1 leading-tight overflow-hidden">
                <div className="flex items-center gap-1.5 w-full">
                  <span className="truncate font-display text-xs font-semibold tracking-wide">Kyper Agência</span>
                  <span className="shrink-0 text-[8px] font-bold tracking-widest bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 uppercase">
                    BETA
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Free</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="no-scrollbar">
        <NavMain sections={sectionsData} />
      </SidebarContent>

      <SidebarFooter className="p-4">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
