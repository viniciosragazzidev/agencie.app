"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: "default" | "destructive"
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)

  const loading = isLoading || internalLoading

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      setInternalLoading(true)
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro no ConfirmDialog:", error)
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <AlertDialogContent className="p-1.5 ring-1 ring-border rounded-2xl bg-card overflow-hidden shadow-2xl">
        <div className="p-5 rounded-xl bg-background flex flex-col gap-4">
          <AlertDialogHeader className="text-left items-start sm:text-left sm:items-start">
            <AlertDialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-2 pt-0 border-t-0 bg-transparent p-0 -mx-0 -mb-0">
            <AlertDialogCancel
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium px-3.5 py-2 h-8 rounded-lg active:scale-[0.98] transition-transform"
            >
              {cancelText}
            </AlertDialogCancel>
            <Button
              variant={variant}
              disabled={loading}
              onClick={handleConfirm}
              className="text-xs font-medium px-4 py-2 h-8 rounded-lg active:scale-[0.98] transition-transform shadow-sm"
            >
              {loading ? "Processando..." : confirmText}
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
