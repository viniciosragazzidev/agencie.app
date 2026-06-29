"use client"

import React, { useState, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SparklesIcon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons"

interface Suggestion {
  text: string
  scenario: string
}

interface ResponseCopilotProps {
  clientId: string
  clientName: string
}

const CONTEXT_OPTIONS = [
  { value: "whatsapp" as const, label: "WhatsApp", description: "Mensagens diretas no chat" },
  { value: "email" as const, label: "Email", description: "Comunicacoes formais" },
  { value: "general" as const, label: "Geral", description: "Qualquer canal" },
]

const TONE_OPTIONS = [
  { value: "friendly" as const, label: "Amigavel", description: "Proximo e informal" },
  { value: "formal" as const, label: "Formal", description: "Profissional e objetivo" },
  { value: "casual" as const, label: "Casual", description: "Natural e descontraido" },
]

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "")
}

export function ResponseCopilot({ clientId, clientName }: ResponseCopilotProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState<"whatsapp" | "email" | "general">(
    "whatsapp"
  )
  const [tone, setTone] = useState<"formal" | "casual" | "friendly">("friendly")
  const [additionalContext, setAdditionalContext] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const generate = async () => {
    if (loading) return

    if (abortRef.current) {
      abortRef.current.abort()
    }

    setLoading(true)
    setError(null)
    setSuggestions([])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          context,
          tone,
          additionalContext: additionalContext || undefined,
        }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Erro ao gerar sugestoes")
      const data = await res.json()
      const newSuggestions: Suggestion[] = data.suggestions || []

      const seen = new Set<string>()
      const uniqueSuggestions = newSuggestions.filter((s) => {
        const key = normalizeText(s.text)
        if (key.length < 3 || seen.has(key)) return false
        seen.add(key)
        return true
      })

      setSuggestions(uniqueSuggestions)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError("Nao foi possivel gerar sugestoes. Tente novamente.")
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <HugeiconsIcon icon={SparklesIcon} className="size-3 text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-foreground">
            Copiloto de Respostas
          </p>
          <p className="text-[9px] text-muted-foreground">
            Sugestoes baseadas no historico de {clientName}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Canal de comunicacao
        </label>
        <div className="flex gap-1">
          {CONTEXT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setContext(opt.value)}
              title={opt.description}
              className={`flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-2 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                context === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <HugeiconsIcon icon={Message01Icon} className="size-2.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Tom de voz
        </label>
        <div className="flex gap-1">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTone(opt.value)}
              title={opt.description}
              className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                tone === opt.value
                  ? "bg-muted/50 text-foreground"
                  : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Contexto adicional
        </label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Ex: Cliente pediu orcamento para redesign do site..."
          className="w-full h-16 px-2.5 py-2 text-[11px] rounded-xl bg-muted/20 ring-1 ring-border/30 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <p className="text-[8px] text-muted-foreground/40">
          Quanto mais contexto, melhor a sugestao
        </p>
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full h-8 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-[0.98] hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
      >
        <HugeiconsIcon icon={SparklesIcon} className="size-3" />
        {loading ? "Gerando..." : "Gerar Sugestoes"}
      </button>

      {error && (
        <p className="text-[10px] text-destructive text-center">{error}</p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2 mt-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {suggestions.length} sugestao{suggestions.length > 1 ? "es" : ""}
          </p>
          {suggestions.map((s, i) => (
            <div
              key={`${i}-${normalizeText(s.text).slice(0, 20)}`}
              className="p-3 rounded-xl bg-muted/20 ring-1 ring-border/30 hover:ring-primary/20 transition-all duration-300 group"
            >
              <p className="text-[11px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {s.text}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                <div className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-primary/40" />
                  <span className="text-[9px] text-muted-foreground/60 italic">
                    {s.scenario}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(s.text, i)}
                  className="text-[9px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={
                      copiedIndex === i
                        ? CheckmarkCircle02Icon
                        : Copy01Icon
                    }
                    className="size-2.5"
                  />
                  {copiedIndex === i ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
