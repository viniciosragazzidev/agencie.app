"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface SettingsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
  success?: string
}

export const SettingsInput = React.forwardRef<HTMLInputElement, SettingsInputProps>(
  ({ label, description, error, success, className, ...props }, ref) => {
    const id = React.useId()

    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <Input
          id={id}
          ref={ref}
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500",
            success && "border-green-500 focus-visible:ring-green-500"
          )}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1 text-xs text-red-500">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-1 text-xs text-green-500">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3 w-3" />
            <span>{success}</span>
          </div>
        )}
      </div>
    )
  }
)

SettingsInput.displayName = "SettingsInput"
