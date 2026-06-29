import * as React from "react"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"

interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  icon?: any
  badge?: string
  className?: string
}

export function SettingsCard({
  title,
  description,
  children,
  actions,
  icon: Icon,
  badge,
  className,
}: SettingsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="rounded-lg bg-primary/10 p-2">
              <HugeiconsIcon icon={Icon} className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle>{title}</CardTitle>
              {badge && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {badge}
                </span>
              )}
            </div>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {actions && <CardAction>{actions}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
