"use client"

import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  sections,
}: {
  sections: {
    label: string
    items: {
      name: string
      url: string
      icon: React.ReactNode
      badge?: string
      isActive?: boolean
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label} className="group-data-[collapsible=icon]:hidden pt-6 first:pt-4">
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-2 px-4">
            {section.label}
          </SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => {
              const active = item.isActive || pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))
              return (
              <SidebarMenuItem key={item.name} className="px-2 mb-1">
                <SidebarMenuButton 
                  render={<a href={item.url} className="flex items-center w-full" />}
                  isActive={active}
                  className="w-full group flex items-center justify-between rounded-xl px-3 py-3.5 text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/40 data-[active=true]:bg-muted/80 data-[active=true]:text-foreground text-foreground active:scale-[0.98]"
                >
                    <div className="flex items-center gap-3">
                      <span className="text-foreground/80 group-data-[active=true]:text-foreground group-hover:text-foreground transition-colors duration-500">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="ml-auto text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
