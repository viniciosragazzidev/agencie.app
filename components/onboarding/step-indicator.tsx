"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: { label: string; icon: any }[]
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    dotsRef.current.forEach((dot, i) => {
      if (!dot) return
      if (i < currentStep) {
        gsap.to(dot, {
          scale: 1,
          backgroundColor: "var(--primary)",
          duration: 0.4,
          ease: "back.out(2)"
        })
      } else if (i === currentStep) {
        gsap.to(dot, {
          scale: 1.3,
          backgroundColor: "var(--primary)",
          duration: 0.4,
          ease: "elastic.out(1, 0.5)"
        })
      } else {
        gsap.to(dot, {
          scale: 1,
          backgroundColor: "var(--muted)",
          duration: 0.3,
          ease: "power2.out"
        })
      }
    })
  }, [currentStep])

  return (
    <div ref={containerRef} className="flex items-center gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            ref={(el) => { dotsRef.current[i] = el }}
            className="relative rounded-full flex items-center justify-center"
          >
            <div className={`size-8 rounded-full flex items-center justify-center transition-all duration-300 ${i < currentStep
                ? "bg-primary text-primary-foreground"
                : i === currentStep
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}>
              {i < currentStep ? (
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-[10px] font-bold">{i + 1}</span>
              )}
            </div>
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${i < currentStep ? "bg-primary" : "bg-muted"
              }`} />
          )}
        </div>
      ))}
    </div>
  )
}
