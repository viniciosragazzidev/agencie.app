"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Cancel01Icon, Add01Icon, Delete02Icon, ArrowRight01Icon, ArrowLeft01Icon, Copy01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

interface Clause {
  id: string
  name: string
  content: string
  included: boolean
  required: boolean
}

interface ContractWizardProps {
  clientId: string
  clientName: string
  userId: string
  projectId?: string | null
  projects: Array<{ id: string; name: string }>
  agencySettings?: {
    agencyName?: string | null
    cnpj?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    defaultContractTemplate?: string | null
    contractFooter?: string | null
  } | null
  open: boolean
  onClose: () => void
  onCreated: (contract: { id: string; link: string }) => void
  onToast: (msg: string, type?: "success" | "error") => void
}

const STEPS = ["Dados do Contrato", "Cláusulas", "Condições", "Revisão"]

const CONTRACT_TYPES = [
  { value: "prestacao_servicos", label: "Prestação de Serviços" },
  { value: "nda", label: "NDA (Confidencialidade)" },
  { value: "aditivo", label: "Aditivo Contratual" },
  { value: "personalizado", label: "Personalizado" },
]

const DEFAULT_CLAUSES: Omit<Clause, "id">[] = [
  {
    name: "Objeto do Contrato",
    content: "O presente contrato tem por objeto a prestação de serviços de marketing digital e comunicação conforme detalhado nas cláusulas seguintes.",
    included: true,
    required: true,
  },
  {
    name: "Valor e Forma de Pagamento",
    content: "Os serviços contratados terão o valor total de R$ {VALOR}, a ser pago conforme as condições de pagamento estabelecidas na Cláusula de Condições.",
    included: true,
    required: true,
  },
  {
    name: "Vigência e Rescisão",
    content: "O contrato terá vigência de {VIGENCIA} dias a partir da data de assinatura. Qualquer uma das partes poderá rescindir o contrato mediante aviso prévio de 30 dias.",
    included: true,
    required: true,
  },
  {
    name: "Confidencialidade",
    content: "As partes comprometem-se a manter em sigilo todas as informações confidenciais obtidas durante a execução do contrato, não podendo divulgá-las a terceiros sem autorização prévia por escrito.",
    included: false,
    required: false,
  },
  {
    name: "Propriedade Intelectual",
    content: "Todos os materiais, criações e entregáveis produzidos no âmbito deste contrato serão de propriedade do CONTRATANTE após o pagamento integral dos valores devidos.",
    included: false,
    required: false,
  },
  {
    name: "Limitação de Responsabilidade",
    content: "A PRESTADORA não se responsabiliza por resultados indiretos, lucros cessantes ou danos decorrentes do uso dos serviços, limitando sua responsabilidade ao valor total contratado.",
    included: false,
    required: false,
  },
  {
    name: "Foro",
    content: "Fica eleito o foro da Comarca de {CIDADE} para dirimir quaisquer questões oriundas do presente contrato.",
    included: true,
    required: false,
  },
]

export function ContractWizard({
  clientId, clientName, userId, projectId, projects, agencySettings, open, onClose, onCreated, onToast
}: ContractWizardProps) {
  const [step, setStep] = useState(0)

  const [title, setTitle] = useState("Contrato de Prestação de Serviços")
  const [contractType, setContractType] = useState(agencySettings?.defaultContractTemplate || "prestacao_servicos")
  const [validityDays, setValidityDays] = useState("30")
  const [linkedProjectId, setLinkedProjectId] = useState(projectId || "")

  const [clauses, setClauses] = useState<Clause[]>(
    DEFAULT_CLAUSES.map(c => ({ ...c, id: crypto.randomUUID() }))
  )

  const [totalValue, setTotalValue] = useState("")
  const [paymentConditions, setPaymentConditions] = useState("1x à vista")
  const [lateFee, setLateFee] = useState("2% ao mês")
  const [generalConditions, setGeneralConditions] = useState("")

  const [saving, setSaving] = useState(false)
  const [createdContract, setCreatedContract] = useState<{ id: string; link: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (projectId) setLinkedProjectId(projectId)
  }, [projectId])

  useEffect(() => {
    if (agencySettings?.defaultContractTemplate) {
      setContractType(agencySettings.defaultContractTemplate)
    }
  }, [agencySettings])

  if (!open) return null

  const toggleClause = (id: string) => {
    setClauses(prev => prev.map(c =>
      c.id === id ? { ...c, included: !c.included } : c
    ))
  }

  const updateClauseContent = (id: string, content: string) => {
    setClauses(prev => prev.map(c =>
      c.id === id ? { ...c, content } : c
    ))
  }

  const addCustomClause = () => {
    setClauses(prev => [...prev, {
      id: crypto.randomUUID(),
      name: "Cláusula Personalizada",
      content: "",
      included: true,
      required: false,
    }])
  }

  const removeClause = (id: string) => {
    setClauses(prev => prev.filter(c => c.id !== id || c.required))
  }

  const generatePreview = (): string => {
    const agencyName = agencySettings?.agencyName || "Agência"
    const parts: string[] = []

    parts.push(`# ${title}`)
    parts.push("")
    parts.push(`**CONTRATANTE**: ${clientName}`)
    parts.push(`**PRESTADORA**: ${agencyName}`)
    if (agencySettings?.cnpj) parts.push(`**CNPJ**: ${agencySettings.cnpj}`)
    parts.push("")

    const includedClauses = clauses.filter(c => c.included)
    includedClauses.forEach((clause, i) => {
      const numeral = ["PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA", "SEXTA", "SÉTIMA", "OITAVA", "NONA", "DÉCIMA"][i] || `${i + 1}ª`
      parts.push(`### CLÁUSULA ${numeral} — ${clause.name.toUpperCase()}`)
      parts.push("")
      let content = clause.content
      content = content.replace("{VALOR}", totalValue ? `R$ ${totalValue}` : "a ser definido")
      content = content.replace("{VIGENCIA}", validityDays)
      content = content.replace("{CIDADE}", agencySettings?.address?.split("-")?.[1]?.trim() || "São Paulo")
      parts.push(content)
      parts.push("")
    })

    if (totalValue) {
      parts.push("### CONDIÇÕES DE PAGAMENTO")
      parts.push("")
      parts.push(`- **Valor Total**: R$ ${totalValue}`)
      parts.push(`- **Condição**: ${paymentConditions}`)
      parts.push(`- **Multa por Atraso**: ${lateFee}`)
      if (generalConditions) parts.push(`- **Observações**: ${generalConditions}`)
      parts.push("")
    }

    parts.push("---")
    parts.push("")
    parts.push(`Local e Data: _________________________`)
    parts.push("")
    parts.push("_________________________________________")
    parts.push(`Assinatura do(a) CONTRATANTE`)
    parts.push("")
    parts.push("_________________________________________")
    parts.push(`Assinatura da PRESTADORA`)

    if (agencySettings?.contractFooter) {
      parts.push("")
      parts.push("---")
      parts.push(agencySettings.contractFooter)
    }

    return parts.join("\n")
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      onToast("Preencha o título do contrato", "error")
      return
    }
    setSaving(true)
    try {
      const content = generatePreview()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + parseInt(validityDays || "30"))

      const res = await fetch("/api/client-portal/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          userId,
          title,
          customContent: content,
          contractType,
          validityDays: parseInt(validityDays || "30"),
          projectId: linkedProjectId || undefined,
          totalValue: totalValue || undefined,
          paymentConditions: paymentConditions || undefined,
          lateFee: lateFee || undefined,
          expiresAt: expiresAt.toISOString(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const baseOrigin = window.location.origin
        const link = `${baseOrigin}/portal/${userId}/contrato/${data.id}`
        setCreatedContract({ id: data.id, link })
        onCreated({ id: data.id, link })
        onToast("Contrato criado com sucesso!")
      } else {
        onToast(data.error || "Erro ao criar contrato", "error")
      }
    } catch {
      onToast("Erro de conexão", "error")
    } finally {
      setSaving(false)
    }
  }

  const copyLink = () => {
    if (createdContract?.link) {
      navigator.clipboard.writeText(createdContract.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onToast("Link copiado!")
    }
  }

  const openWhatsApp = () => {
    if (createdContract?.link) {
      const text = encodeURIComponent(
        `Olá! Segue o link do contrato para análise e assinatura digital:\n\nDocumento: *${title}*\nAssinar: ${createdContract.link}`
      )
      window.open(`https://wa.me/?text=${text}`, "_blank")
    }
  }

  // Success screen
  if (createdContract) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-card rounded-[2rem] ring-1 ring-border/50 p-6 w-full max-w-md space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-green-500" strokeWidth={1.5} />
              <h2 className="text-sm font-bold">Contrato Criado!</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={1.5} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Link de Assinatura</label>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 ring-1 ring-border/30">
              <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">{createdContract.link}</span>
              <button onClick={copyLink} className="shrink-0 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <HugeiconsIcon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} className={`size-3.5 ${copied ? "text-green-500" : "text-muted-foreground"}`} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={openWhatsApp}
              className="flex-1 h-9 bg-green-500/10 hover:bg-green-500/20 text-green-600 text-[10px] font-bold rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider"
            >
              Enviar no WhatsApp
            </button>
            <a
              href={createdContract.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-9 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider flex items-center justify-center"
            >
              Ver no Portal
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full h-9 bg-muted/30 hover:bg-muted/50 text-muted-foreground text-[10px] font-bold rounded-xl transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-[2rem] ring-1 ring-border/50 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <div>
            <h2 className="text-sm font-bold">Novo Contrato</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Para {clientName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-5 pt-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`size-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 transition-colors ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-[9px] font-semibold truncate ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${i < step ? "bg-primary" : "bg-border/30"}`} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Step 0: Dados do Contrato */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Título do Contrato</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de Contrato</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {CONTRACT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Vigência (dias)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                    min="1"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              {projects.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Projeto Vinculado</label>
                  <select
                    value={linkedProjectId}
                    onChange={(e) => setLinkedProjectId(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Nenhum</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Cláusulas */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground">Selecione as cláusulas e edite o conteúdo de cada uma.</p>
              {clauses.map(clause => (
                <div key={clause.id} className={`p-3 rounded-xl ring-1 transition-colors ${
                  clause.included ? "ring-primary/30 bg-primary/5" : "ring-border/30 bg-muted/10"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={clause.included}
                        onChange={() => toggleClause(clause.id)}
                        className="size-3.5 rounded border-border/40"
                        disabled={clause.required}
                      />
                      <span className="text-[10px] font-bold">{clause.name}</span>
                      {clause.required && (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">Obrigatória</span>
                      )}
                    </div>
                    {!clause.required && clause.included && (
                      <button onClick={() => removeClause(clause.id)} className="text-destructive/60 hover:text-destructive">
                        <HugeiconsIcon icon={Delete02Icon} className="size-3" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                  {clause.included && (
                    <textarea
                      value={clause.content}
                      onChange={(e) => updateClauseContent(clause.id, e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1.5 text-[10px] rounded-lg border border-border/20 bg-muted/5 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                  )}
                </div>
              ))}
              <button
                onClick={addCustomClause}
                className="w-full h-8 border border-dashed border-border/40 rounded-xl text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <HugeiconsIcon icon={Add01Icon} className="size-3" strokeWidth={1.5} />
                Adicionar Cláusula
              </button>
            </div>
          )}

          {/* Step 2: Condições */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Valor Total (R$)</label>
                  <input
                    type="text"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Condição de Pagamento</label>
                  <input
                    type="text"
                    value={paymentConditions}
                    onChange={(e) => setPaymentConditions(e.target.value)}
                    placeholder="1x à vista"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Multa por Atraso</label>
                <input
                  type="text"
                  value={lateFee}
                  onChange={(e) => setLateFee(e.target.value)}
                  placeholder="2% ao mês"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Condições Gerais</label>
                <textarea
                  value={generalConditions}
                  onChange={(e) => setGeneralConditions(e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                  className="w-full px-3 py-2 text-[10px] rounded-xl border border-border/40 bg-muted/10 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Revisão */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground">Revise o contrato antes de gerar.</p>
              <div className="p-4 rounded-xl bg-muted/20 ring-1 ring-border/30 max-h-[400px] overflow-y-auto">
                <pre className="text-[10px] text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
                  {generatePreview()}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border/30">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="h-8 px-3 text-[10px] font-bold rounded-lg bg-muted/30 hover:bg-muted/50 disabled:opacity-30 transition-all flex items-center gap-1"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3" strokeWidth={1.5} />
            Voltar
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              className="h-8 px-4 text-[10px] font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1 active:scale-[0.98]"
            >
              Próximo
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" strokeWidth={1.5} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="h-8 px-4 text-[10px] font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-[0.98]"
            >
              {saving ? "Gerando..." : "Gerar Contrato"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
