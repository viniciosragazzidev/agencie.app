"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert01Icon, TelephoneIcon, Message01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface ChurnAlert {
  clientId: string
  clientName: string
  daysSinceContact: number
  severity: "warning" | "critical"
}

export function ChurnAlertCard({ alerts, onCall, onMessage }: {
  alerts: ChurnAlert[]
  onCall: (clientId: string) => void
  onMessage: (clientId: string) => void
}) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} className="size-6 text-green-500 mb-1.5" />
        <p className="text-xs text-muted-foreground">Nenhum alerta de churn.</p>
        <p className="text-[10px] text-muted-foreground/60">Todos os clientes estão ativos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.clientId}
          className={`p-2.5 border rounded-xl flex items-center justify-between gap-3 ${
            alert.severity === "critical"
              ? "bg-destructive/5 border-destructive/15"
              : "bg-amber-500/5 border-amber-500/15"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`size-8 rounded-lg flex items-center justify-center ${
              alert.severity === "critical" ? "bg-destructive/10" : "bg-amber-500/10"
            }`}>
              <HugeiconsIcon icon={Alert01Icon} strokeWidth={1.5} className={`size-3.5 ${
                alert.severity === "critical" ? "text-destructive" : "text-amber-500"
              }`} />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{alert.clientName}</p>
              <p className="text-[10px] text-muted-foreground">
                {alert.daysSinceContact}d sem contato
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => onCall(alert.clientId)} className="h-6 text-[9px] font-semibold gap-1 px-2">
              <HugeiconsIcon icon={TelephoneIcon} strokeWidth={1.5} className="size-2.5" /> Ligação
            </Button>
            <Button size="sm" onClick={() => onMessage(alert.clientId)} className="h-6 text-[9px] font-semibold gap-1 px-2">
              <HugeiconsIcon icon={Message01Icon} strokeWidth={1.5} className="size-2.5" /> Mensagem
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
