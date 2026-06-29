"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { TourTooltip } from "./tour-tooltip"
import { DASHBOARD_TOUR_STEPS } from "./tour-step"

interface TourOverlayProps {
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

export function TourOverlay({ isActive, onComplete, onSkip }: TourOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)

  const step = DASHBOARD_TOUR_STEPS[currentStep]

  // Calculate target position
  const updateSpotlight = useCallback(() => {
    if (!step) return
    const target = document.querySelector(step.target)
    if (target) {
      const rect = target.getBoundingClientRect()
      setTargetRect(rect)
    }
  }, [step])

  useEffect(() => {
    if (!isActive || !step) return

    updateSpotlight()
    window.addEventListener("resize", updateSpotlight)
    // Re-measure after a short delay in case layout is still settling
    const timer = setTimeout(updateSpotlight, 100)
    return () => {
      window.removeEventListener("resize", updateSpotlight)
      clearTimeout(timer)
    }
  }, [isActive, step, updateSpotlight])

  // Animate spotlight position
  useEffect(() => {
    if (!targetRect || !spotlightRef.current) return

    gsap.to(spotlightRef.current, {
      left: targetRect.left - 10,
      top: targetRect.top - 10,
      width: targetRect.width + 20,
      height: targetRect.height + 20,
      duration: 0.5,
      ease: "cubic-bezier(0.32, 0.72, 0, 1)"
    })
  }, [targetRect])

  // Overlay entrance
  useGSAP(() => {
    if (!isActive || !overlayRef.current) return
    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" }
    )
  }, [isActive])

  const handleNext = useCallback(() => {
    if (currentStep < DASHBOARD_TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }, [currentStep, onComplete])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  if (!isActive || !step) return null

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100]">
      {/* SVG mask for spotlight cutout — no blur on whole page */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 10}
                y={targetRect.top - 10}
                width={targetRect.width + 20}
                height={targetRect.height + 20}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Animated spotlight border ring */}
      <div
        ref={spotlightRef}
        className="absolute rounded-lg pointer-events-none"
        style={{
          border: "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0 0 20px rgba(255,255,255,0.1)"
        }}
      />

      {/* Tooltip — positioned relative to target */}
      {targetRect && (
        <TourTooltip
          step={step}
          targetRect={targetRect}
          currentStep={currentStep}
          totalSteps={DASHBOARD_TOUR_STEPS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={onSkip}
        />
      )}

      {/* Progress indicator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 ring-1 ring-border/30 shadow-lg">
        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
          Tour
        </span>
        <div className="w-px h-3 bg-border/30" />
        <span className="text-[10px] font-semibold text-foreground/80">
          {currentStep + 1}/{DASHBOARD_TOUR_STEPS.length}
        </span>
      </div>
    </div>
  )
}
