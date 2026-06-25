"use client"

import React, { useState, useEffect, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Loading03Icon,
  SmartPhone01Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons"

interface WppConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onConnected: (data: { phoneNumber: string; name: string }) => void
}

type ModalState = "idle" | "connecting" | "qr_ready" | "connected" | "error"

export function WppConnectModal({ isOpen, onClose, onConnected }: WppConnectModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<ModalState>("idle")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [integrationId, setIntegrationId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [qrExpiry, setQrExpiry] = useState(30) // countdown em segundos
  const eventSourceRef = useRef<EventSource | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useGSAP(() => {
    if (isOpen && containerRef.current) {
      gsap.from(containerRef.current, {
        y: 24,
        opacity: 0,
        duration: 0.5,
        ease: "cubic-bezier(0.32,0.72,0,1)",
      })
    }
  }, { scope: containerRef, dependencies: [isOpen] })

  // Limpar ao fechar
  useEffect(() => {
    if (!isOpen) {
      eventSourceRef.current?.close()
      if (countdownRef.current) clearInterval(countdownRef.current)
      setState("idle")
      setQrCode(null)
      setIntegrationId(null)
      setErrorMsg("")
      setQrExpiry(30)
    }
  }, [isOpen])

  // Iniciar countdown quando QR aparece
  useEffect(() => {
    if (state === "qr_ready") {
      setQrExpiry(30)
      if (countdownRef.current) clearInterval(countdownRef.current)
      countdownRef.current = setInterval(() => {
        setQrExpiry((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [state, qrCode])

  const handleConnect = async () => {
    setState("connecting")
    setErrorMsg("")
    console.log("[WPP] handleConnect called")

    try {
      const res = await fetch("/api/integrations/whatsapp/connect", { method: "POST" })
      const data = await res.json()
      console.log("[WPP] Connect response:", { ok: res.ok, status: data.integration?.status, hasQr: !!data.qrCode, integrationId: data.integration?.id })

      if (!res.ok) {
        console.error("[WPP] Connect failed:", data.error)
        setErrorMsg(data.error || "Erro ao conectar")
        setState("error")
        return
      }

      setIntegrationId(data.integration.id)

      if (data.integration.status === "active") {
        setState("connected")
        onConnected({ phoneNumber: "", name: data.integration.accountName || "WhatsApp" })
        return
      }

      if (data.qrCode) {
        setQrCode(data.qrCode)
        setState("qr_ready")
      } else {
        setState("qr_ready")
      }

      // Abrir SSE para receber updates em tempo real
      startStatusStream(data.integration.id)
    } catch (err) {
      console.error("[WPP] Connect exception:", err)
      setErrorMsg("OpenWA indisponível. Verifique se o container Docker está rodando.")
      setState("error")
    }
  }

  const startStatusStream = (id: string) => {
    if (eventSourceRef.current) eventSourceRef.current.close()

    console.log("[WPP] Opening SSE for integration:", id)
    const es = new EventSource(`/api/integrations/${id}/status-stream`)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log("[WPP] SSE event:", data.type, data.type === "error" ? data.message : "")

      if (data.type === "qr_updated" && data.qrCode) {
        setQrCode(data.qrCode)
        setQrExpiry(30) // Resetar countdown
        setState("qr_ready")
      }

      if (data.type === "connected") {
        es.close()
        setState("connected")
        setTimeout(() => {
          onConnected({ phoneNumber: data.phoneNumber, name: data.name })
          onClose()
        }, 1500)
      }

      if (data.type === "error") {
        console.error("[WPP] SSE error event received:", data.message)
        setErrorMsg("Erro na conexão com o WhatsApp")
        setState("error")
        es.close()
      }
    }

    es.onerror = (err) => {
      console.error("[WPP] SSE connection error:", err)
      es.close()
    }
  }

  // Auto-conectar ao abrir
  useEffect(() => {
    if (isOpen && state === "idle") {
      handleConnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div ref={containerRef} className="bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem] w-full max-w-sm mx-4">
        <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-green-500/10 ring-1 ring-green-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-green-500">W</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Conectar WhatsApp</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Escaneie o QR code no seu celular</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
            </button>
          </div>

          {/* Estados */}
          {state === "idle" && (
            <div className="text-center space-y-4 py-4">
              <div className="size-16 mx-auto rounded-2xl bg-green-500/10 ring-1 ring-green-500/20 flex items-center justify-center">
                <HugeiconsIcon icon={SmartPhone01Icon} className="size-8 text-green-500" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vamos gerar um QR code seguro para vincular sua conta do WhatsApp.
                Nenhum dado seu é compartilhado — tudo roda no seu servidor.
              </p>
              <button
                onClick={handleConnect}
                className="w-full h-10 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                Gerar QR Code
              </button>
            </div>
          )}

          {state === "connecting" && (
            <div className="text-center py-8 space-y-3">
              <HugeiconsIcon icon={Loading03Icon} className="size-8 mx-auto text-green-500 animate-spin" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground">Iniciando sessão segura...</p>
            </div>
          )}

          {state === "qr_ready" && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="relative flex items-center justify-center">
                {qrCode ? (
                  <div className="relative">
                    <img
                      src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                      alt="QR Code WhatsApp"
                      className="w-48 h-48 rounded-xl ring-1 ring-border/50"
                    />
                    {qrExpiry === 0 && (
                      <div className="absolute inset-0 bg-card/90 rounded-xl flex flex-col items-center justify-center gap-2">
                        <p className="text-[10px] text-muted-foreground font-medium">QR expirado</p>
                        <button
                          onClick={() => startStatusStream(integrationId!)}
                          className="flex items-center gap-1.5 text-[9px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full uppercase"
                        >
                          <HugeiconsIcon icon={Refresh01Icon} className="size-3" /> Atualizar
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-xl bg-muted/30 ring-1 ring-border/30 flex items-center justify-center">
                    <HugeiconsIcon icon={Loading03Icon} className="size-8 text-muted-foreground animate-spin" strokeWidth={1.5} />
                  </div>
                )}
                {/* Countdown ring */}
                {qrExpiry > 0 && qrCode && (
                  <div className="absolute -bottom-2 -right-2 size-8 bg-card ring-1 ring-border/50 rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-muted-foreground">{qrExpiry}s</span>
                  </div>
                )}
              </div>

              {/* Instruções */}
              <ol className="space-y-1.5 text-[10px] text-muted-foreground">
                {[
                  "Abra o WhatsApp no celular",
                  'Vá em "Dispositivos vinculados"',
                  "Escaneie este QR code",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="size-4 rounded-full bg-green-500/10 text-green-500 text-[8px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {state === "connected" && (
            <div className="text-center py-6 space-y-3">
              <div className="size-14 mx-auto rounded-full bg-green-500/10 ring-1 ring-green-500/20 flex items-center justify-center">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-7 text-green-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Conectado!</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">WhatsApp vinculado com sucesso</p>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-3">
              <div className="bg-destructive/5 ring-1 ring-destructive/20 rounded-xl p-3">
                <p className="text-[10px] text-destructive font-medium">{errorMsg}</p>
              </div>
              <button
                onClick={() => setState("idle")}
                className="w-full h-9 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
