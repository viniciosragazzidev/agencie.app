"use client"

import React, { useRef, useEffect, ReactNode } from "react"
import { gsap } from "gsap"

interface WizardStepProps {
  children: ReactNode
  isActive: boolean
  direction: "next" | "prev"
}

export function WizardStep({ children, isActive, direction }: WizardStepProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    
    const xStart = direction === "next" ? 60 : -60
    
    if (isActive) {
      gsap.fromTo(ref.current, 
        { opacity: 0, x: xStart, scale: 0.98 },
        { 
          opacity: 1, x: 0, scale: 1,
          duration: 0.6,
          ease: "cubic-bezier(0.32, 0.72, 0, 1)"
        }
      )
    } else {
      gsap.set(ref.current, { opacity: 0, x: -xStart, scale: 0.98 })
    }
  }, [isActive, direction])

  if (!isActive) return null

  return (
    <div ref={ref} className="w-full">
      {children}
    </div>
  )
}
