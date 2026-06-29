"use client"

import React, { useRef, useEffect, useMemo } from "react"
import { gsap } from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  ArrowRight01Icon, 
  Cancel01Icon,
  SparklesIcon
} from "@hugeicons/core-free-icons"
import { TourStep } from "./tour-step"

interface TourTooltipProps {
  step: TourStep
  targetRect: DOMRect
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}

export function TourTooltip({ 
  step,
  targetRect,
  currentStep, 
  totalSteps, 
  onNext, 
  onPrev, 
  onSkip 
}: TourTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Calculate tooltip position based on target rect and step.position
  const tooltipStyle = useMemo(() => {
    const GAP = 16
    const tooltipW = 288 // w-72 = 18rem = 288px
    const tooltipH = 200 // approximate height
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200
    const vh = typeof window !== "undefined" ? window.innerHeight : 800

    let top = 0
    let left = 0

    switch (step.position) {
      case "right":
        top = targetRect.top + targetRect.height / 2
        left = targetRect.right + GAP
        // If overflows right edge, flip to left
        if (left + tooltipW > vw) {
          left = targetRect.left - GAP - tooltipW
        }
        return {
          top: `${top}px`,
          left: `${left}px`,
          transform: "translateY(-50%)"
        }
      case "left":
        top = targetRect.top + targetRect.height / 2
        left = targetRect.left - GAP - tooltipW
        // If overflows left edge, flip to right
        if (left < 0) {
          left = targetRect.right + GAP
        }
        return {
          top: `${top}px`,
          left: `${left}px`,
          transform: "translateY(-50%)"
        }
      case "bottom":
        top = targetRect.bottom + GAP
        left = targetRect.left + targetRect.width / 2
        // Center but clamp to viewport
        left = Math.max(GAP, Math.min(left - tooltipW / 2, vw - tooltipW - GAP))
        // If overflows bottom, flip to top
        if (top + tooltipH > vh) {
          top = targetRect.top - GAP - tooltipH
        }
        return {
          top: `${top}px`,
          left: `${left}px`,
          transform: "translateX(-50%)"
        }
      case "top":
      default:
        top = targetRect.top - GAP - tooltipH
        left = targetRect.left + targetRect.width / 2
        left = Math.max(GAP, Math.min(left - tooltipW / 2, vw - tooltipW - GAP))
        // If overflows top, flip to bottom
        if (top < 0) {
          top = targetRect.bottom + GAP
        }
        return {
          top: `${top}px`,
          left: `${left}px`,
          transform: "translateX(-50%)"
        }
    }
  }, [targetRect, step.position])

  // Determine arrow direction (points toward target)
  const arrowClass = useMemo(() => {
    switch (step.position) {
      case "right":
        return "-left-1.5 top-1/2 -translate-y-1/2"
      case "left":
        return "-right-1.5 top-1/2 -translate-y-1/2"
      case "bottom":
        return "-top-1.5 left-1/2 -translate-x-1/2"
      case "top":
      default:
        return "-bottom-1.5 left-1/2 -translate-x-1/2"
    }
  }, [step.position])

  const arrowBorders = useMemo(() => {
    switch (step.position) {
      case "right":
        return { borderLeft: "1px solid var(--border)" }
      case "left":
        return { borderRight: "1px solid var(--border)" }
      case "bottom":
        return { borderTop: "1px solid var(--border)" }
      case "top":
      default:
        return { borderBottom: "1px solid var(--border)" }
    }
  }, [step.position])

  useEffect(() => {
    if (!tooltipRef.current || !contentRef.current) return

    const tl = gsap.timeline()

    tl.fromTo(tooltipRef.current,
      { opacity: 0, scale: 0.92, y: 8 },
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        duration: 0.45, 
        ease: "back.out(1.5)"
      }
    )
    .fromTo(contentRef.current.children,
      { opacity: 0, y: 6 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.35, 
        stagger: 0.06,
        ease: "power2.out"
      },
      "-=0.25"
    )
    .fromTo(".tour-sparkle",
      { scale: 0, rotation: -180 },
      { 
        scale: 1, 
        rotation: 0, 
        duration: 0.5, 
        ease: "back.out(2)"
      },
      "-=0.3"
    )

    return () => { tl.kill() }
  }, [step.id])

  return (
    <div 
      ref={tooltipRef}
      className="fixed z-[101] w-72"
      style={tooltipStyle}
    >
      {/* Double bezel card */}
      <div className="bg-muted/20 ring-1 ring-border/50 p-1 rounded-xl shadow-2xl">
        <div className="bg-card rounded-[calc(0.75rem-0.25rem)] p-4 space-y-3">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="tour-sparkle size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HugeiconsIcon 
                  icon={SparklesIcon} 
                  className="size-3.5 text-primary" 
                  strokeWidth={1.5} 
                />
              </div>
              <div>
                <h4 className="text-[11px] font-display font-semibold text-foreground">
                  {step.title}
                </h4>
                <p className="text-[8px] text-muted-foreground/50">
                  {currentStep + 1} de {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="size-5 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <HugeiconsIcon 
                icon={Cancel01Icon} 
                className="size-3 text-muted-foreground/50" 
                strokeWidth={1.5} 
              />
            </button>
          </div>

          {/* Content */}
          <div ref={contentRef}>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              {step.description}
            </p>

            {step.action && (
              <button
                onClick={() => window.location.href = step.action!.href}
                className="mt-2 text-[9px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                {step.action.label}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-2.5" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onPrev}
              disabled={currentStep === 0}
              className="text-[8px] font-bold text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-30 uppercase tracking-wider transition-colors"
            >
              Anterior
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`size-1 rounded-full transition-all duration-300 ${
                    i === currentStep 
                      ? "bg-primary w-3" 
                      : i < currentStep 
                        ? "bg-primary/50" 
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={onNext}
              className="text-[9px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              {currentStep === totalSteps - 1 ? "Concluir" : "Próximo"}
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-2.5" strokeWidth={1.5} />
            </button>
          </div>

        </div>
      </div>

      {/* Arrow pointer */}
      <div 
        className={`absolute w-3 h-3 bg-card rotate-45 ${arrowClass}`}
        style={arrowBorders}
      />
    </div>
  )
}
