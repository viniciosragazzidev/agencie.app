"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"

interface NumberTickerProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
  duration?: number
  format?: (val: number) => string
}

export function NumberTicker({
  value,
  className = "",
  prefix = "",
  suffix = "",
  duration = 1.2,
  format = (val) => val.toLocaleString("pt-BR", { maximumFractionDigits: 0 }),
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const objRef = useRef({ val: 0 })

  useEffect(() => {
    gsap.to(objRef.current, {
      val: value,
      duration: duration,
      ease: "power3.out",
      onUpdate: () => {
        setDisplayValue(objRef.current.val)
      },
    })
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}
      {format(displayValue)}
      {suffix}
    </span>
  )
}
