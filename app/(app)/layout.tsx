"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Generate breadcrumb items based on the pathname
  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean)
    const breadcrumbs = []

    // Always start with Workspace
    breadcrumbs.push({
      label: "Workspace",
      href: "/dashboard",
      isLast: paths.length === 0 || (paths.length === 1 && paths[0] === "dashboard"),
    })

    if (paths.length > 0) {
      const firstPath = paths[0]
      if (firstPath === "dashboard") {
        // Already covered by Workspace/Dashboard
      } else if (firstPath === "inbox") {
        breadcrumbs.push({
          label: "Inbox (Chat)",
          href: "/inbox",
          isLast: true,
        })
      } else if (firstPath === "clients") {
        breadcrumbs.push({
          label: "Clientes CRM",
          href: "/clients",
          isLast: true,
        })
      } else if (firstPath === "pipeline") {
        breadcrumbs.push({
          label: "Pipeline Comercial",
          href: "/pipeline",
          isLast: true,
        })
      } else if (firstPath === "prospects") {
        breadcrumbs.push({
          label: "Prospecção AI",
          href: "/prospects",
          isLast: true,
        })
      } else if (firstPath === "account") {
        breadcrumbs.push({
          label: "Minha Conta",
          href: "/account",
          isLast: true,
        })
      } else if (firstPath === "settings") {
        const secondPath = paths[1]
        if (secondPath === "ai") {
          breadcrumbs.push({
            label: "Administração",
            href: "#",
            isLast: false,
          })
          breadcrumbs.push({
            label: "Assistente RAG",
            href: "/settings/ai",
            isLast: true,
          })
        } else if (secondPath === "integrations") {
          breadcrumbs.push({
            label: "Administração",
            href: "#",
            isLast: false,
          })
          breadcrumbs.push({
            label: "Integrações de Canal",
            href: "/settings/integrations",
            isLast: true,
          })
        } else {
          breadcrumbs.push({
            label: "Configurações",
            href: "/settings",
            isLast: true,
          })
        }
      } else if (firstPath === "client-portal") {
        breadcrumbs.push({
          label: "Área do Cliente",
          href: "/client-portal",
          isLast: true,
        })
      } else if (firstPath === "help") {
        const secondPath = paths[1]
        if (secondPath === "dictionary") {
          breadcrumbs.push({
            label: "Ajuda",
            href: "#",
            isLast: false,
          })
          breadcrumbs.push({
            label: "Dicionário",
            href: "/help/dictionary",
            isLast: true,
          })
        } else {
          breadcrumbs.push({
            label: "Ajuda",
            href: "/help",
            isLast: true,
          })
        }
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur-md z-50 px-4 sticky top-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage className="text-xs font-normal">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={crumb.href} />} className="text-xs">
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {idx < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
