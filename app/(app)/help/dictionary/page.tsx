"use client"

import React, { useRef, useState, useMemo, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpen01Icon,
  Search01Icon,
  ChevronDownIcon,
  BulbIcon,
  Target03Icon,
  Message01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons"
import { dictionary, dictionaryCategories, type DictionaryCategory, type DictionaryTerm } from "@/data/dictionary"

const categoryColors: Record<DictionaryCategory, { bg: string; text: string; ring: string; hover: string }> = {
  "Marketing Digital": { bg: "bg-blue-500/10", text: "text-blue-500", ring: "ring-blue-500/20", hover: "hover:bg-blue-500/15" },
  "Vendas & Pipeline": { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/20", hover: "hover:bg-emerald-500/15" },
  "Gestão de Agência": { bg: "bg-violet-500/10", text: "text-violet-500", ring: "ring-violet-500/20", hover: "hover:bg-violet-500/15" },
  "Financeiro": { bg: "bg-amber-500/10", text: "text-amber-500", ring: "ring-amber-500/20", hover: "hover:bg-amber-500/15" },
  "Tecnologia & IA": { bg: "bg-rose-500/10", text: "text-rose-500", ring: "ring-rose-500/20", hover: "hover:bg-rose-500/15" },
}

function TermCard({ term, index, onRelatedClick }: { term: DictionaryTerm; index: number; onRelatedClick: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
      <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-display font-semibold text-foreground tracking-tight">{term.term}</h3>
          <span className={`shrink-0 text-[9px] font-bold tracking-widest ${categoryColors[term.category].bg} ${categoryColors[term.category].text} ring-1 ${categoryColors[term.category].ring} rounded-full px-2 py-0.5 uppercase`}>
            {term.category}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">{term.definition}</p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          <HugeiconsIcon
            icon={ChevronDownIcon}
            strokeWidth={2}
            className={`size-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Recolher detalhes" : "Ver detalhes completos"}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="size-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <HugeiconsIcon icon={BulbIcon} strokeWidth={1.5} className="size-3.5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Caso de Uso</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{term.useCase}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <HugeiconsIcon icon={Target03Icon} strokeWidth={1.5} className="size-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Importância</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{term.importance}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <HugeiconsIcon icon={Message01Icon} strokeWidth={1.5} className="size-3.5 text-violet-500" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Exemplo Prático</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{term.example}</p>
                </div>
              </div>
            </div>

            {term.relatedTerms.length > 0 && (
              <div className="border-t border-border/20 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <HugeiconsIcon icon={Link01Icon} strokeWidth={1.5} className="size-3 text-muted-foreground/60" />
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Termos Relacionados</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {term.relatedTerms.map((relId) => {
                    const relTerm = dictionary.find((t) => t.id === relId)
                    if (!relTerm) return null
                    return (
                      <button
                        key={relId}
                        onClick={() => onRelatedClick(relId)}
                        className="text-[10px] font-medium text-muted-foreground bg-muted/40 hover:bg-muted/70 border border-border/30 rounded-full px-2.5 py-1 transition-colors cursor-pointer"
                      >
                        {relTerm.term}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DictionaryPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<DictionaryCategory | "all">("all")
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredTerms = useMemo(() => {
    let terms = dictionary

    if (activeCategory !== "all") {
      terms = terms.filter((t) => t.category === activeCategory)
    }

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase()
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.useCase.toLowerCase().includes(q) ||
          t.importance.toLowerCase().includes(q)
      )
    }

    return terms
  }, [debouncedQuery, activeCategory])

  const handleRelatedClick = (id: string) => {
    const term = dictionary.find((t) => t.id === id)
    if (term) {
      setActiveCategory("all")
      setSearchQuery(term.term)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  useGSAP(() => {
    gsap.from(".bento-item", {
      y: 15,
      opacity: 0,
      duration: 0.8,
      stagger: 0.06,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      clearProps: "all",
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="flex-1 flex w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      
      {/* Sidebar de Navegação do Dicionário (Esquerda) */}
      <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 border-r border-border/40 bg-sidebar/30 flex flex-col h-full bento-item">
        <div className="p-4 border-b border-border/40 space-y-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={1.5} className="size-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-heading font-semibold tracking-tight leading-none">Dicionário</h1>
              <p className="text-[10px] text-muted-foreground mt-1">Glossário de agência</p>
            </div>
          </div>
          
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Buscar termos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-background border border-border/40 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all duration-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-1 bg-sidebar/10">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">Categorias</p>
          <button
            onClick={() => setActiveCategory("all")}
            className={`w-full text-left flex items-center justify-between text-[11px] font-semibold rounded-xl px-3 py-2 transition-all cursor-pointer ${
              activeCategory === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            Todos <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeCategory === "all" ? "bg-primary-foreground/20" : "bg-muted/50"}`}>{dictionary.length}</span>
          </button>
          {dictionaryCategories.map((cat) => {
            const count = dictionary.filter((t) => t.category === cat).length
            const colors = categoryColors[cat]
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? "all" : cat)}
                className={`w-full text-left flex items-center justify-between text-[11px] font-semibold rounded-xl px-3 py-2 transition-all cursor-pointer mt-1 ${
                  activeCategory === cat
                    ? `${colors.bg} ${colors.text} ring-1 ${colors.ring}`
                    : `text-muted-foreground hover:bg-muted/40 hover:text-foreground`
                }`}
              >
                {cat} <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeCategory === cat ? "bg-background/20" : "bg-muted/50"}`}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content (Direita) */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0 bg-background h-full bento-item">
        <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/5">
          <p className="text-[10px] text-muted-foreground font-medium">
            Mostrando <span className="text-foreground font-semibold">{filteredTerms.length}</span> de <span className="text-foreground font-semibold">{dictionary.length}</span> termos
          </p>
          {debouncedQuery && (
            <button onClick={() => { setSearchQuery(""); setActiveCategory("all") }} className="text-[10px] text-primary hover:text-primary/80 font-semibold cursor-pointer">
              Limpar filtros
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-background">
          {filteredTerms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={1} className="size-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground font-medium mt-3">Nenhum termo encontrado</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Tente buscar com outras palavras ou selecione outra categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 max-w-[1200px] mx-auto">
              {filteredTerms.map((term, index) => (
                <TermCard
                  key={term.id}
                  term={term}
                  index={index}
                  onRelatedClick={handleRelatedClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}
