"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon, Delete02Icon, CheckmarkCircle02Icon, Cancel01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

export interface ScopeItem {
  id: string
  label: string
  totalQuota: number
  usedQuota: number
  period: string
  price?: string
  billing?: "mensal" | "anual" | "unico"
  status?: "active" | "closed"
}

export function ScopeWall({
  scopes = [],
  onDelete,
  onEdit,
  onToggleStatus,
}: {
  scopes: ScopeItem[]
  onDelete: (id: string) => void
  onEdit: (item: ScopeItem) => void
  onToggleStatus?: (id: string, newStatus: "active" | "closed") => void
}) {
  const [activeTab, setActiveTab] = React.useState<"active" | "closed">("active")

  // Ensure default values are handled gracefully
  const activeScopes = scopes.filter(s => (s.status || "active") === "active")
  const closedScopes = scopes.filter(s => (s.status || "active") === "closed")

  const currentList = activeTab === "active" ? activeScopes : closedScopes

  return (
    <div className="space-y-4">
      {/* Sliding Tab Navigation */}
      <div className="flex bg-muted/20 p-1 rounded-xl w-fit border border-border/30">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 active:scale-[0.97] ${
            activeTab === "active"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Serviços Ativos ({activeScopes.length})
        </button>
        <button
          onClick={() => setActiveTab("closed")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 active:scale-[0.97] ${
            activeTab === "closed"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Histórico ({closedScopes.length})
        </button>
      </div>

      {currentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/5 border border-dashed border-border/40 rounded-2xl">
          <p className="text-xs text-muted-foreground">Nenhum serviço nesta seção.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map(scope => {
            const remaining = scope.totalQuota - scope.usedQuota
            const percentage = (scope.usedQuota / scope.totalQuota) * 100
            const isOver = remaining <= 0

            // Formatting values
            const priceVal = parseFloat(scope.price || "0").toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            })
            const periodMap: Record<string, string> = { mensal: "mensal", anual: "anual", unico: "pagamento único" }
            const billingPeriod = periodMap[scope.billing || "mensal"] || scope.billing || "mensal"

            return (
              <div 
                key={scope.id} 
                className="p-1.5 bg-card/60 border border-border/40 rounded-2xl ring-1 ring-border/10 transition-all hover:bg-card/80 group"
              >
                {/* Double-Bezel Inner Core */}
                <div className="p-3 bg-muted/5 border border-border/10 rounded-xl space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{scope.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {priceVal} <span className="opacity-70">({billingPeriod})</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {/* Status Toggle Action (Close / Reopen) */}
                        {onToggleStatus && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleStatus(scope.id, scope.status === "closed" ? "active" : "closed")}
                            title={scope.status === "closed" ? "Reabrir Escopo" : "Fechar Escopo"}
                            className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md active:scale-95"
                          >
                            <HugeiconsIcon 
                              icon={scope.status === "closed" ? ArrowRight01Icon : CheckmarkCircle02Icon} 
                              strokeWidth={1.5} 
                              className="size-3.5" 
                            />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(scope)}
                          className="size-6 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md active:scale-95"
                        >
                          <HugeiconsIcon icon={Edit02Icon} strokeWidth={1.5} className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(scope.id)}
                          className="size-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md active:scale-95"
                        >
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.5} className="size-3.5" />
                        </Button>
                      </div>
                      <span className={`text-[9px] font-bold tracking-widest rounded-full px-2 py-0.5 uppercase ring-1 ${
                        isOver
                          ? "bg-destructive/10 text-destructive ring-destructive/20"
                          : percentage > 80
                          ? "bg-secondary text-secondary-foreground ring-border/50"
                          : "bg-primary/10 text-primary ring-primary/20"
                      }`}>
                        {remaining} restante{remaining !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quota Usage Bar */}
                  <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        isOver ? "bg-destructive" : percentage > 80 ? "bg-muted-foreground" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{scope.usedQuota} / {scope.totalQuota} consumidos</span>
                    <span className="capitalize">{scope.period === "monthly" ? "Mensal" : scope.period === "quarterly" ? "Trimestral" : "Único"}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

