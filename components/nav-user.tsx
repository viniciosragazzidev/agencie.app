"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { UnfoldMoreIcon, SparklesIcon, CheckmarkBadgeIcon, CreditCardIcon, NotificationIcon, LogoutIcon } from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

import Link from "next/link"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login")
        }
      }
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted active:scale-[0.98] transition-all duration-300 py-2">
                <Avatar className="size-7">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-[9px]">U</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-[10px] leading-tight ml-1.5">
                  <span className="truncate font-semibold text-foreground/90">{user.name}</span>
                  <span className="truncate text-[8px] text-muted-foreground/80 font-medium">{user.email}</span>
                </div>
                <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={1.5} className="ml-auto size-3 text-muted-foreground/70" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="min-w-52 rounded-xl border border-border/40 p-1 bg-card shadow-2xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2.5 py-2 text-left text-[10px] bg-muted/20 rounded-t-lg border-b border-border/20">
                  <Avatar className="size-7">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-[9px]">U</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-[10px] leading-tight">
                    <span className="truncate font-semibold text-foreground">{user.name}</span>
                    <span className="truncate text-[8px] text-muted-foreground font-medium">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-[10px] font-semibold text-primary focus:text-primary-foreground focus:bg-primary py-1.5 px-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={1.5} className="size-3.5" />
                <span>Seja PRO</span>
                <span className="ml-auto text-[7px] font-bold tracking-widest bg-primary/15 text-primary ring-1 ring-primary/30 rounded-full px-1.5 py-px uppercase">
                  NEW
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <Link href="/account" className="text-[10px] font-medium py-1.5 px-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-foreground/80 hover:bg-muted w-full">
                    <HugeiconsIcon icon={CheckmarkBadgeIcon} strokeWidth={1.5} className="size-3.5 text-muted-foreground/60" />
                    <span>Minha conta</span>
                  </Link>
                }
              />
              <DropdownMenuItem className="text-[10px] font-medium py-1.5 px-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-foreground/80 hover:bg-muted">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={1.5} className="size-3.5 text-muted-foreground/60" />
                <span>Assinaturas</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[10px] font-medium py-1.5 px-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-foreground/80 hover:bg-muted">
                <HugeiconsIcon icon={NotificationIcon} strokeWidth={1.5} className="size-3.5 text-muted-foreground/60" />
                <span>Notificações</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-[10px] font-medium py-1.5 px-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 text-destructive hover:bg-destructive/10">
              <HugeiconsIcon icon={LogoutIcon} strokeWidth={1.5} className="size-3.5 text-destructive" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
