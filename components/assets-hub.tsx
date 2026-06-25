"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FolderOpenIcon, Download01Icon, Link01Icon, Edit02Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface Asset {
  id: string
  name: string
  category: string
  fileUrl?: string
  linkUrl?: string
  notes?: string
}

const categoryLabels: Record<string, string> = {
  logo: "Identidade Visual",
  report: "Relatórios",
  access: "Acessos",
  art: "Artes Finais",
  contract: "Contratos",
  other: "Outros",
}

export function AssetsHub({ assets, onDelete, onEdit }: {
  assets: Asset[]
  onDelete: (id: string) => void
  onEdit: (item: Asset) => void
}) {
  const grouped = assets.reduce((acc, asset) => {
    const cat = asset.category || "other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(asset)
    return acc
  }, {} as Record<string, Asset[]>)

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={1.5} className="size-8 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">Nenhum entregável disponível.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2">
            {categoryLabels[cat] || cat}
          </p>
          <div className="space-y-2">
            {items.map(asset => (
              <div key={asset.id} className="p-3 bg-muted/10 border border-border/30 rounded-xl flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={1.5} className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{asset.name}</p>
                    {asset.notes && <p className="text-[10px] text-muted-foreground truncate">{asset.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(asset)}
                    className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.5} className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(asset.id)}
                    className="size-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-3" />
                  </Button>
                  {asset.linkUrl && (
                    <a href={asset.linkUrl} target="_blank" rel="noreferrer" className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-border/40 flex items-center gap-1 hover:bg-muted transition-colors">
                      <HugeiconsIcon icon={Link01Icon} strokeWidth={1.5} className="size-3" /> Abrir
                    </a>
                  )}
                  {asset.fileUrl && (
                    <a href={asset.fileUrl} download className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider rounded-lg bg-primary/10 text-primary flex items-center gap-1 hover:bg-primary/20 transition-colors">
                      <HugeiconsIcon icon={Download01Icon} strokeWidth={1.5} className="size-3" /> Baixar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
