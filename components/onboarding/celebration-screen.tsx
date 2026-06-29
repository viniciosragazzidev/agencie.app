"use client"

import React, { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  SparklesIcon,
  Rocket01Icon,
  CheckmarkCircle02Icon
} from "@hugeicons/core-free-icons"
import { ConfettiBurst } from "./confetti-burst"
import { TextScramble } from "./text-scramble"
import { MagneticButton } from "./magnetic-button"

interface CelebrationScreenProps {
  onComplete: () => void
}

export function CelebrationScreen({ onComplete }: CelebrationScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current || !iconRef.current) return

    const tl = gsap.timeline()

    // Icon entrance - Design Spells: Overshoot Spring
    tl.fromTo(iconRef.current,
      { scale: 0, rotation: -180 },
      { 
        scale: 1, 
        rotation: 0, 
        duration: 0.8, 
        ease: "elastic.out(1, 0.5)" 
      }
    )

    // Content reveal
    .fromTo(".celebration-content",
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.5, 
        stagger: 0.1,
        ease: "power2.out"
      },
      "-=0.4"
    )

    // Sparkles floating
    .fromTo(".sparkle",
      { opacity: 0, scale: 0 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 0.4, 
        stagger: 0.05,
        ease: "back.out(2)"
      },
      "-=0.3"
    )

    // Continuous sparkle animation
    gsap.to(".sparkle", {
      y: -10,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.1
    })

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <ConfettiBurst active={true} />
      
      <div ref={containerRef} className="text-center space-y-6 max-w-md mx-4">
        {/* Floating sparkles */}
        <div className="relative">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="sparkle absolute"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${Math.random() * 100}%`
              }}
            >
              <HugeiconsIcon 
                icon={SparklesIcon} 
                className="size-4 text-primary/30" 
                strokeWidth={1.5} 
              />
            </div>
          ))}
          
          <div 
            ref={iconRef}
            className="size-20 mx-auto rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center"
          >
            <HugeiconsIcon 
              icon={Rocket01Icon} 
              className="size-10 text-primary" 
              strokeWidth={1.5} 
            />
          </div>
        </div>

        <div className="celebration-content space-y-2">
          <h2 className="text-xl font-display font-bold text-foreground">
            <TextScramble text="Tudo Pronto!" />
          </h2>
          <p className="text-[11px] text-muted-foreground/60">
            Sua agência está configurada e pronta para começar a gerenciar clientes.
          </p>
        </div>

        <div className="celebration-content space-y-3">
          <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground/50">
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-green-500" strokeWidth={1.5} />
              <span>Agência configurada</span>
            </div>
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-green-500" strokeWidth={1.5} />
              <span>Tutorial completo</span>
            </div>
          </div>

          <MagneticButton
            onClick={onComplete}
            className="h-10 px-6 bg-primary text-primary-foreground text-[10px] font-bold rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider"
          >
            Começar a Usar
          </MagneticButton>
        </div>
      </div>
    </div>
  )
}
