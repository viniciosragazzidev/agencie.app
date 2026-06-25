"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
      aria-label="Toggle theme"
    >
      <HugeiconsIcon 
        icon={Sun01Icon} 
        strokeWidth={1.5} 
        className="absolute size-4 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" 
      />
      <HugeiconsIcon 
        icon={Moon02Icon} 
        strokeWidth={1.5} 
        className="absolute size-4 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" 
      />
    </button>
  )
}
