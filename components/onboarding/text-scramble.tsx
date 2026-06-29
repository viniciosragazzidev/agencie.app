"use client"

import React, { useRef, useEffect, useState } from "react"

interface TextScrambleProps {
  text: string
  className?: string
  delay?: number
}

export function TextScramble({ text, className, delay = 0 }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState("")
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const chars = "!<>-_\\/[]{}—=+*^?#________"
    let iteration = 0
    let timeout: NodeJS.Timeout

    const scramble = () => {
      timeout = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (index < iteration) {
                return text[index]
              }
              return chars[Math.floor(Math.random() * chars.length)]
            })
            .join("")
        )

        if (iteration >= text.length) {
          clearInterval(timeout)
        }

        iteration += 1 / 3
      }, 30)
    }

    const delayTimeout = setTimeout(scramble, delay)

    return () => {
      clearTimeout(delayTimeout)
      clearInterval(timeout)
    }
  }, [text, delay])

  return (
    <span ref={containerRef} className={className}>
      {displayText}
    </span>
  )
}
