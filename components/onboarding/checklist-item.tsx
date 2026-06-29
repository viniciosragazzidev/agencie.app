"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  CheckmarkCircle02Icon,
  ArrowRight01Icon
} from "@hugeicons/core-free-icons"

interface ChecklistItemProps {
  title: string
  description: string
  isCompleted: boolean
  href?: string
  onAction?: () => void
}

export function ChecklistItem({ 
  title, 
  description, 
  isCompleted, 
  href,
  onAction 
}: ChecklistItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const checkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    // Design Spells: Magnetic Hover
    const handleMouseEnter = () => {
      gsap.to(ref.current, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    const handleMouseLeave = () => {
      gsap.to(ref.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    const el = ref.current
    el.addEventListener("mouseenter", handleMouseEnter)
    el.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter)
      el.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  // Check animation
  useEffect(() => {
    if (isCompleted && checkRef.current) {
      gsap.fromTo(checkRef.current,
        { scale: 0, rotation: -180 },
        { 
          scale: 1, 
          rotation: 0, 
          duration: 0.6, 
          ease: "elastic.out(1, 0.5)" 
        }
      )
    }
  }, [isCompleted])

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
        isCompleted 
          ? "bg-green-500/5 hover:bg-green-500/10" 
          : "bg-muted/20 hover:bg-muted/30"
      }`}
      onClick={onAction}
    >
      <div ref={checkRef}>
        <HugeiconsIcon 
          icon={CheckmarkCircle02Icon} 
          className={`size-4 ${isCompleted ? "text-green-500" : "text-muted-foreground/30"}`}
          strokeWidth={1.5} 
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-semibold ${isCompleted ? "text-green-500/80 line-through" : "text-foreground/80"}`}>
          {title}
        </p>
        <p className="text-[8px] text-muted-foreground/40 truncate">
          {description}
        </p>
      </div>

      {!isCompleted && href && (
        <HugeiconsIcon 
          icon={ArrowRight01Icon} 
          className="size-3 text-muted-foreground/30" 
          strokeWidth={1.5} 
        />
      )}
    </div>
  )
}
