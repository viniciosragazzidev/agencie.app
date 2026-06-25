"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

interface TabOption {
  id: string
  name: string
}

interface MagneticTabsProps {
  options: TabOption[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

export function MagneticTabs({
  options,
  activeId,
  onChange,
  className = "",
}: MagneticTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const activeBtn = buttonsRef.current[activeId]
    const container = containerRef.current
    const pill = pillRef.current

    if (!activeBtn || !container || !pill) return

    const containerRect = container.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()

    const left = btnRect.left - containerRect.left
    const width = btnRect.width

    // Animate pill background position and scale (width)
    gsap.to(pill, {
      left: left,
      width: width,
      duration: 0.45,
      ease: "cubic-bezier(0.32,0.72,0,1)",
    })
  }, [activeId, options])

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center p-1 rounded-xl bg-muted/30 border border-border/40 select-none ${className}`}
    >
      {/* Magnetic background pill */}
      <div
        ref={pillRef}
        className="absolute top-1 bottom-1 bg-primary rounded-lg shadow-sm"
        style={{ left: 0, width: 0 }}
      />
      {options.map((option) => (
        <button
          key={option.id}
          ref={(el) => {
            buttonsRef.current[option.id] = el
          }}
          onClick={() => onChange(option.id)}
          className={`relative z-10 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors duration-300 cursor-pointer whitespace-nowrap active:scale-[0.97] ${
            activeId === option.id
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.name}
        </button>
      ))}
    </div>
  )
}
