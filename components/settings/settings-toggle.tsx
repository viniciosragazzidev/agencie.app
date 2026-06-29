"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface SettingsToggleProps {
  label: string
  description?: string
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
  className?: string
}

export function SettingsToggle({
  label,
  description,
  enabled,
  onChange,
  disabled,
  className,
}: SettingsToggleProps) {
  const id = React.useId()

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={enabled}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}
