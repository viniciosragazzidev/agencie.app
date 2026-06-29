"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"

interface ConfettiBurstProps {
  active: boolean
  onComplete?: () => void
}

export function ConfettiBurst({ active, onComplete }: ConfettiBurstProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]
    const particles: HTMLDivElement[] = []

    // Create particles
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div")
      particle.className = "absolute w-2 h-2 rounded-full"
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      particle.style.left = "50%"
      particle.style.top = "50%"
      container.appendChild(particle)
      particles.push(particle)
    }

    // Animate particles - Design Spells: Particle Explosion
    const tl = gsap.timeline({
      onComplete: () => {
        particles.forEach(p => p.remove())
        onComplete?.()
      }
    })

    particles.forEach((particle, i) => {
      const angle = (i / particles.length) * Math.PI * 2
      const velocity = 100 + Math.random() * 200
      const x = Math.cos(angle) * velocity
      const y = Math.sin(angle) * velocity

      tl.fromTo(particle,
        { 
          x: 0, 
          y: 0, 
          scale: 1, 
          opacity: 1 
        },
        {
          x,
          y: y + 100, // Gravity
          scale: 0,
          opacity: 0,
          duration: 1 + Math.random() * 0.5,
          ease: "power2.out"
        },
        0
      )
    })

    return () => {
      tl.kill()
      particles.forEach(p => p.remove())
    }
  }, [active, onComplete])

  if (!active) return null

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[200]"
    />
  )
}
