"use client"

import React, { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FavouriteIcon } from "@hugeicons/core-free-icons"

interface NPSSurveyProps {
  onSubmit: (score: number) => void
}

const scoreLabels = [
  "",
  "Muito Insatisfeito",
  "Insatisfeito",
  "Neutro",
  "Satisfeito",
  "Muito Satisfeito",
]

const scoreColors = [
  "",
  "text-destructive",
  "text-orange-500",
  "text-amber-500",
  "text-green-500",
  "text-emerald-500",
]

export function NPSSurvey({ onSubmit }: NPSSurveyProps) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="p-5 bg-muted/10 border border-border/30 rounded-2xl space-y-4">
      <div className="text-center">
        <HugeiconsIcon icon={FavouriteIcon} strokeWidth={1.5} className="size-6 text-primary mx-auto mb-2" />
        <p className="text-xs font-semibold text-foreground">Qual seu nível de satisfação com os resultados?</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Avaliação mensal — leva 5 segundos</p>
      </div>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map(score => (
          <button
            key={score}
            onClick={() => setSelected(score)}
            className={`size-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 active:scale-[0.95] ${
              selected === score
                ? "bg-primary/20 text-primary ring-2 ring-primary/40"
                : "bg-muted/20 text-muted-foreground hover:bg-muted/30 ring-1 ring-border/30"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="text-center space-y-3 animate-in fade-in duration-200">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${scoreColors[selected]}`}>
            {scoreLabels[selected]}
          </p>
          <button
            onClick={() => onSubmit(selected)}
            className="h-8 px-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Enviar Avaliação
          </button>
        </div>
      )}
    </div>
  )
}
