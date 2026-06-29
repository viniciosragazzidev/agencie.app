"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import { Building01Icon } from "@hugeicons/core-free-icons"

export default function PortalLoginPage() {
  const params = useParams()
  const router = useRouter()
  const agency = params.agency as string

  const [document, setDocument] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [agencyName, setAgencyName] = useState("Área do Cliente")
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState("#111827")

  useEffect(() => {
    fetch(`/api/portal/${agency}/auth`)
      .then(r => r.json())
      .then(data => {
        if (data.agencyName) setAgencyName(data.agencyName)
        if (data.agencyLogo) setAgencyLogo(data.agencyLogo)
        if (data.primaryColor) setPrimaryColor(data.primaryColor)
      })
      .catch(() => {})
  }, [agency])

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 11) {
      // CPF: 000.000.000-00
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    }
    // CNPJ: 00.000.000/0000-00
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocument(formatDocument(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`/api/portal/${agency}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao autenticar.")
        return
      }

      // Success — redirect to projetos
      router.push(`/portal/${agency}/projetos`)
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 w-full max-w-md rounded-[2rem] shadow-2xl">
        <div className="bg-card border border-border/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] p-8">
          <div className="flex flex-col items-center mb-8">
            {agencyLogo ? (
              <img
                src={agencyLogo}
                alt={agencyName}
                className="size-14 rounded-2xl object-contain mb-4"
              />
            ) : (
              <div
                className="size-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}
              >
                <HugeiconsIcon icon={Building01Icon} className="size-7" style={{ color: primaryColor }} />
              </div>
            )}
            <h1 className="text-lg font-semibold text-foreground font-display">{agencyName}</h1>
            <p className="text-[10px] text-muted-foreground mt-1">Acesse o painel da sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="document" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                CPF ou CNPJ
              </Label>
              <Input
                id="document"
                type="text"
                required
                value={document}
                onChange={handleDocumentChange}
                placeholder="000.000.000-00"
                className="bg-muted/10 border-border/40 text-xs"
                maxLength={18}
                autoFocus
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-muted/10 border-border/40 text-xs"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-[10px] text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl text-xs font-semibold h-10 active:scale-[0.98] transition-all duration-300"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
