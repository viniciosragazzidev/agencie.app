"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Link01Icon, NoteIcon, CheckmarkCircle02Icon, ArrowLeft01Icon, Download01Icon } from "@hugeicons/core-free-icons"

interface ContractViewProps {
  agencySlug: string
  contract: {
    id: string
    clientId: string
    userId: string
    title: string
    content: string
    status: "pending" | "signed" | "expired" | "cancelled"
    signedAt?: Date | null
    signerName?: string | null
    signerIp?: string | null
    signerDocument?: string | null
    createdAt: Date
  }
}

export default function ContractView({ agencySlug, contract: initialContract }: ContractViewProps) {
  const router = useRouter()
  const [contract, setContract] = useState(initialContract)
  const [signerName, setSignerName] = useState("")
  const [signerDocument, setSignerDocument] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    }
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignerDocument(formatDocument(e.target.value))
  }

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signerName || !signerDocument || !agreed) {
      setError("Preencha todos os campos e concorde com os termos.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/client-portal/contracts/${contract.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName, signerDocument }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao assinar contrato.")
        return
      }

      setContract(data)
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function parseBold(text: string) {
    const parts = text.split("**")
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-foreground print:text-black">{part}</strong>
      }
      return part
    })
  }

  function renderMarkdown(content: string) {
    return content.split("\n").map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return <div key={i} className="h-4" />

      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={i} className="text-lg font-bold text-foreground font-display mt-6 mb-4 text-center print:text-black">
            {trimmed.slice(2)}
          </h1>
        )
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={i} className="text-xs font-semibold text-foreground font-display mt-5 mb-2 print:text-black">
            {trimmed.slice(4)}
          </h3>
        )
      }

      if (trimmed === "---") {
        return <hr key={i} className="my-6 border-border/40 print:border-black/20" />
      }

      if (trimmed.startsWith("- ")) {
        const itemText = trimmed.slice(2)
        return (
          <li key={i} className="text-[11px] text-muted-foreground ml-4 list-disc mb-1.5 print:text-black/80 leading-relaxed">
            {parseBold(itemText)}
          </li>
        )
      }

      return (
        <p key={i} className="text-[11px] text-muted-foreground mb-4 leading-relaxed text-justify print:text-black/80">
          {parseBold(trimmed)}
        </p>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push(`/portal/${agencySlug}/projetos`)}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors duration-300"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" strokeWidth={1.5} />
          Voltar para Projetos
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setDownloading(true)
              try {
                const res = await fetch(`/api/pdf/contract/${contract.id}`)
                if (!res.ok) throw new Error("Falha ao gerar PDF")
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `${contract.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`
                a.click()
                URL.revokeObjectURL(url)
              } catch (e) {
                console.error(e)
                toast.error("Erro ao baixar PDF. Tente novamente.")
              } finally {
                setDownloading(false)
              }
            }}
            disabled={downloading}
            className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-semibold h-9 px-3 rounded-xl active:scale-[0.98] transition-all duration-300 flex items-center gap-1.5 disabled:opacity-50"
          >
            <HugeiconsIcon icon={Download01Icon} className="size-3.5" strokeWidth={1.5} />
            {downloading ? "Baixando..." : "Baixar PDF"}
          </button>
          {contract.status === "signed" && (
            <button
              onClick={() => window.print()}
              className="bg-primary text-primary-foreground text-xs font-semibold h-9 px-4 rounded-xl active:scale-[0.98] transition-all duration-300"
            >
              Imprimir
            </button>
          )}
        </div>
      </div>

      {/* Contract Sheet */}
      <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[2rem] print:border-0 print:ring-0 print:p-0 print:bg-transparent print:shadow-none">
        <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-8 md:p-12 print:border-0 print:shadow-none print:p-0 print:bg-transparent">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {renderMarkdown(contract.content)}
          </div>

          {/* Signature info if signed */}
          {contract.status === "signed" && (
            <div className="mt-8 pt-6 border-t border-border/40 print:border-black/20">
              <h4 className="text-xs font-semibold text-foreground mb-3 print:text-black">Assinatura Eletrônica</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/5 p-4 rounded-xl border border-border/20 print:border-black/10 print:bg-transparent print:p-2">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest print:text-black/60">Assinante</p>
                  <p className="text-xs font-semibold text-foreground print:text-black">{contract.signerName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest print:text-black/60">Documento</p>
                  <p className="text-xs font-semibold text-foreground print:text-black">{contract.signerDocument}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest print:text-black/60">Data/Hora</p>
                  <p className="text-xs font-semibold text-foreground print:text-black">
                    {contract.signedAt ? new Date(contract.signedAt).toLocaleString("pt-BR") : ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest print:text-black/60">Endereço IP</p>
                  <p className="text-xs font-semibold text-foreground print:text-black">{contract.signerIp}</p>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground mt-4 text-center italic print:text-black/60">
                Assinado eletronicamente em conformidade com as regras de aceite digital da plataforma.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Signature Form (if pending) */}
      {contract.status === "pending" && (
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[2rem] max-w-xl mx-auto print:hidden">
          <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-8">
            <h3 className="text-sm font-semibold text-foreground font-display mb-4">Assinar Contrato Eletronicamente</h3>
            <form onSubmit={handleSign} className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Nome Completo do Assinante
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="Nome Completo"
                  className="bg-muted/10 border border-border/40 rounded-xl text-xs p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  CPF ou CNPJ
                </label>
                <input
                  type="text"
                  required
                  value={signerDocument}
                  onChange={handleDocumentChange}
                  placeholder="000.000.000-00"
                  className="bg-muted/10 border border-border/40 rounded-xl text-xs p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  maxLength={18}
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-border/40 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-[10px] text-muted-foreground leading-normal">
                  Eu declaro que sou representante legal habilitado e aceito formalizar a contratação eletrônica com registro de assinatura digital.
                </span>
              </label>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-[10px] text-destructive font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !agreed || !signerName || !signerDocument}
                className="w-full bg-primary text-primary-foreground disabled:opacity-50 rounded-xl text-xs font-semibold h-10 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                {loading ? "Processando..." : "Assinar Contrato"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
