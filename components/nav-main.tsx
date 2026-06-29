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
      dataTour?: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label} className="pt-4 first:pt-2 group-data-[collapsible=icon]:pt-2 group-data-[collapsible=icon]:first:pt-2">
          <SidebarGroupLabel className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-[0.2em] mb-1 px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-center group-data-[collapsible=icon]:w-full">
            {section.label}
          </SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => {
              const active = item.isActive || pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))
              return (
              <SidebarMenuItem 
                key={item.name} 
                className="px-1.5 group-data-[collapsible=icon]:px-0 mb-0.5 flex justify-center"
                data-tour={item.dataTour}
              >
                <SidebarMenuButton 
                  render={<a href={item.url} className="flex items-center w-full" />}
                  isActive={active}
                  tooltip={item.name}
                  className="w-full group flex items-center justify-between rounded-lg px-2.5 py-2 text-[11px] font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted/40 data-[active=true]:bg-muted/60 data-[active=true]:text-foreground text-muted-foreground active:scale-[0.98] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:mx-auto"
                >
                    <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
                      <span className="text-muted-foreground/80 group-data-[active=true]:text-foreground group-hover:text-foreground transition-colors duration-300">
                        {item.icon}
                      </span>
                      <span className="group-data-[collapsible=icon]:hidden truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="ml-auto text-[7px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-1.5 py-px group-data-[collapsible=icon]:hidden uppercase">
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
