"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link01Icon, Video01Icon, File01Icon, Edit02Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface Quicklink {
  id: string
  label: string
  url: string
  icon?: string
}

const iconMap: Record<string, typeof Link01Icon> = {
  meet: Video01Icon,
  dashboard: File01Icon,
  contrato: File01Icon,
  default: Link01Icon,
}

export function QuicklinksHub({ links, onDelete, onEdit }: {
  links: Quicklink[]
  onDelete: (id: string) => void
  onEdit: (item: Quicklink) => void
}) {
  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(link => {
        const Icon = iconMap[link.icon || "default"] || Link01Icon
        return (
          <div
            key={link.id}
            className="group relative"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 bg-primary/5 border border-primary/20 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
            >
              <HugeiconsIcon icon={Icon} strokeWidth={1.5} className="size-4" />
              {link.label}
            </a>
            <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(link)}
                className="size-5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full bg-background border border-border/40 shadow-sm"
              >
                <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.5} className="size-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(link.id)}
                className="size-5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-full bg-background border border-border/40 shadow-sm"
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-2.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
