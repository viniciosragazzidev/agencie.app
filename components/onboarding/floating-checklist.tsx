"use client"

import React, { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  CheckListIcon,
  Cancel01Icon,
  ArrowUp01Icon
} from "@hugeicons/core-free-icons"
import { ChecklistItem } from "./checklist-item"

interface FloatingChecklistProps {
  userId: string
}

export function FloatingChecklist({ userId }: FloatingChecklistProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [progress, setProgress] = useState({
    agencyConfigured: false,
    firstClientCreated: false,
    firstServiceCreated: false,
    integrationConnected: false,
    contractGenerated: false
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  // Fetch progress
  useEffect(() => {
    fetch("/api/onboarding")
      .then(r => r.json())
      .then(data => {
        if (data.setupProgress) setProgress(data.setupProgress)
      })
      .catch(() => {})
  }, [])

  // Button pulse animation - Design Spells: Perpetual Micro-interaction
  useGSAP(() => {
    if (!buttonRef.current || isMinimized) return

    gsap.to(buttonRef.current, {
      scale: 1.05,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    })
  }, [isMinimized])

  // Panel animation
  useGSAP(() => {
    if (!panelRef.current) return

    if (isOpen) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.4, 
          ease: "cubic-bezier(0.32, 0.72, 0, 1)" 
        }
      )
    } else {
      gsap.to(panelRef.current, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.3,
        ease: "power2.in"
      })
    }
  }, [isOpen])

  const completedCount = Object.values(progress).filter(Boolean).length
  const totalCount = Object.keys(progress).length
  const progressPercent = (completedCount / totalCount) * 100

  const checklistItems = [
    { 
      key: "agencyConfigured" as const,
      title: "Configurar Agência", 
      description: "Nome, logo e identidade",
      href: "/settings/agency"
    },
    { 
      key: "firstClientCreated" as const,
      title: "Cadastrar Cliente", 
      description: "Adicione seu primeiro cliente",
      href: "/clients"
    },
    { 
      key: "firstServiceCreated" as const,
      title: "Criar Serviço", 
      description: "Defina seus serviços",
      href: "/services"
    },
    { 
      key: "integrationConnected" as const,
      title: "Conectar Canal", 
      description: "WhatsApp ou Instagram",
      href: "/settings/integrations"
    },
    { 
      key: "contractGenerated" as const,
      title: "Gerar Contrato", 
      description: "Primeiro contrato para assinatura",
      href: "/clients"
    }
  ]

  if (isMinimized) {
    return (
      <div 
        ref={containerRef}
        className="fixed bottom-3 right-8 z-50"
      >
        <div
          ref={buttonRef}
          onClick={() => setIsMinimized(false)}
          className="size-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
        >
          <HugeiconsIcon icon={CheckListIcon} className="size-5" strokeWidth={1.5} />
        </div>
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary/20"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${progressPercent * 1.13} 113`}
            className="text-primary transition-all duration-500"
          />
        </svg>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="fixed bottom-3 right-8 z-50">
      {/* Panel */}
      <div
        ref={panelRef}
        className="w-72 bg-card rounded-xl shadow-2xl ring-1 ring-border/30 overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon 
                icon={CheckListIcon} 
                className="size-4 text-primary" 
                strokeWidth={1.5} 
              />
              <h3 className="text-[11px] font-display font-semibold text-foreground">
                Setup da Agência
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="size-5 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <HugeiconsIcon 
                  icon={ArrowUp01Icon} 
                  className="size-3 text-muted-foreground/50" 
                  strokeWidth={1.5} 
                />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="size-5 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <HugeiconsIcon 
                  icon={Cancel01Icon} 
                  className="size-3 text-muted-foreground/50" 
                  strokeWidth={1.5} 
                />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[8px] text-muted-foreground/40">
              <span>{completedCount} de {totalCount} concluídos</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
          {checklistItems.map((item) => (
            <ChecklistItem
              key={item.key}
              title={item.title}
              description={item.description}
              isCompleted={progress[item.key]}
              href={item.href}
              onAction={() => {
                if (item.href) window.location.href = item.href
              }}
            />
          ))}
        </div>

        {/* Footer */}
        {completedCount === totalCount && (
          <div className="p-3 bg-green-500/5 border-t border-green-500/20">
            <p className="text-[9px] font-bold text-green-500 text-center uppercase tracking-widest">
              Setup Completo!
            </p>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      {!isOpen && (
        <div
          ref={buttonRef}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-3 right-8 size-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
        >
          <HugeiconsIcon icon={CheckListIcon} className="size-5" strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}
