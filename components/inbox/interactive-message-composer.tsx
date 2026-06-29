"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Row {
  id: string
  title: string
  description: string
}

interface Section {
  title: string
  rows: Row[]
}

interface InteractiveMessageComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (data: { messageBody: string; buttonText: string; sections: Section[] }) => void
  sending?: boolean
}

export function InteractiveMessageComposer({
  open,
  onOpenChange,
  onSend,
  sending = false,
}: InteractiveMessageComposerProps) {
  const [messageBody, setMessageBody] = useState("")
  const [buttonText, setButtonText] = useState("Selecione uma opção")
  const [sections, setSections] = useState<Section[]>([
    { title: "", rows: [{ id: "1", title: "", description: "" }] },
  ])

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      { title: "", rows: [{ id: String(Date.now()), title: "", description: "" }] },
    ])
  }

  const removeSection = (idx: number) => {
    if (sections.length <= 1) return
    setSections((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateSectionTitle = (idx: number, title: string) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, title } : s)))
  }

  const addRow = (sectionIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? { ...s, rows: [...s.rows, { id: String(Date.now()), title: "", description: "" }] }
          : s
      )
    )
  }

  const removeRow = (sectionIdx: number, rowIdx: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx ? { ...s, rows: s.rows.filter((_, ri) => ri !== rowIdx) } : s
      )
    )
  }

  const updateRow = (sectionIdx: number, rowIdx: number, field: "title" | "description", value: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              rows: s.rows.map((r, ri) =>
                ri === rowIdx ? { ...r, [field]: value } : r
              ),
            }
          : s
      )
    )
  }

  const canSend =
    messageBody.trim() &&
    buttonText.trim() &&
    sections.some((s) => s.rows.some((r) => r.title.trim()))

  const handleSend = () => {
    if (!canSend) return
    onSend({ messageBody: messageBody.trim(), buttonText: buttonText.trim(), sections })
    setMessageBody("")
    setButtonText("Selecione uma opção")
    setSections([{ title: "", rows: [{ id: "1", title: "", description: "" }] }])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <DialogTitle className="text-sm font-display font-semibold flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="size-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
              </svg>
            </div>
            Mensagem Interativa
          </DialogTitle>
          <p className="text-[10px] text-muted-foreground mt-1">
            Envie uma mensagem com botões de opção — o cliente clica e responde diretamente.
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-5">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <svg className="size-4 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-[10px] font-semibold text-primary">Como funciona</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                O cliente recebera uma mensagem com botoes clicaveis. Ao clicar, vera as opcoes organizadas por secoes.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Texto da mensagem *
            </Label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Ex: Olá! Qual serviço você gostaria de contratar?"
              rows={3}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
            />
            <p className="text-[8px] text-muted-foreground/40">
              Texto que aparece acima dos botoes de opcao
            </p>
          </div>

          {/* Button Text */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Texto do botao *
            </Label>
            <Input
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Selecione uma opcao"
              className="h-9 text-xs rounded-xl"
            />
            <p className="text-[8px] text-muted-foreground/40">
              Texto do botao que o cliente clica para ver as opcoes
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Secoes e Opcoes *
                </Label>
                <p className="text-[8px] text-muted-foreground/40 mt-0.5">
                  Organize as opcoes em grupos para facilitar a escolha
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addSection}
                className="h-7 text-[10px] font-semibold gap-1 text-primary hover:text-primary"
              >
                <HugeiconsIcon icon={Add01Icon} className="size-3" />
                Secao
              </Button>
            </div>

            {sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="border border-border/40 rounded-xl p-3.5 space-y-3 bg-muted/10"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={section.title}
                    onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                    placeholder={`Titulo da secao ${sIdx + 1} (opcional)`}
                    className="h-8 text-[11px] rounded-lg flex-1"
                  />
                  {sections.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSection(sIdx)}
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {section.rows.map((row, rIdx) => (
                    <div key={row.id} className="flex items-start gap-2 group">
                      <div className="flex-1 space-y-1.5">
                        <Input
                          value={row.title}
                          onChange={(e) => updateRow(sIdx, rIdx, "title", e.target.value)}
                          placeholder={`Opcao ${rIdx + 1}`}
                          className="h-8 text-[11px] rounded-lg"
                        />
                        <Input
                          value={row.description}
                          onChange={(e) => updateRow(sIdx, rIdx, "description", e.target.value)}
                          placeholder="Descricao (opcional)"
                          className="h-7 text-[10px] rounded-lg text-muted-foreground"
                        />
                      </div>
                      {section.rows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(sIdx, rIdx)}
                          className="h-8 w-8 text-destructive/60 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="size-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addRow(sIdx)}
                  className="h-7 text-[10px] font-semibold gap-1 text-muted-foreground hover:text-foreground w-full border border-dashed border-border/40 hover:border-border/60"
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-3" />
                  Adicionar opcao
                </Button>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Pre-visualizacao
            </Label>
            <p className="text-[8px] text-muted-foreground/40">
              Assim que o cliente vera no WhatsApp
            </p>
            <div className="bg-primary/5 border border-primary/15 rounded-2xl rounded-tr-sm p-4 max-w-[280px]">
              {messageBody.trim() && (
                <p className="text-xs leading-relaxed mb-3">{messageBody.trim()}</p>
              )}
              {sections.map((s, sIdx) =>
                s.rows.filter((r) => r.title.trim()).length > 0 ? (
                  <div key={sIdx} className="mb-2 last:mb-0">
                    {s.title.trim() && (
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        {s.title.trim()}
                      </p>
                    )}
                    <div className="space-y-1">
                      {s.rows
                        .filter((r) => r.title.trim())
                        .map((r) => (
                          <div
                            key={r.id}
                            className="px-3 py-2 bg-background/80 border border-border/30 rounded-lg"
                          >
                            <p className="text-[11px] font-medium">{r.title.trim()}</p>
                            {r.description.trim() && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {r.description.trim()}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null
              )}
              <div className="mt-3 pt-2 border-t border-border/20">
                <div className="px-3 py-1.5 bg-background/60 border border-border/30 rounded-lg text-center">
                  <span className="text-[10px] font-medium text-primary">
                    {buttonText || "Selecione uma opcao"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border/40 bg-muted/10">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-8 text-[11px] font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend || sending}
            className="h-8 text-[11px] font-semibold gap-1.5"
          >
            {sending ? (
              <>
                <svg className="animate-spin size-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando...
              </>
            ) : (
              "Enviar Mensagem Interativa"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
