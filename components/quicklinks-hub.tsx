"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link01Icon, Video01Icon, File01Icon } from "@hugeicons/core-free-icons"

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

export function QuicklinksHub({ links }: { links: Quicklink[] }) {
  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(link => {
        const Icon = iconMap[link.icon || "default"] || Link01Icon
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 bg-primary/5 border border-primary/20 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
          >
            <HugeiconsIcon icon={Icon} strokeWidth={1.5} className="size-4" />
            {link.label}
          </a>
        )
      })}
    </div>
  )
}
