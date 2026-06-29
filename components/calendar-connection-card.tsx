"use client"

import React, { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, RefreshIcon, Cancel01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

interface CalendarConnectionCardProps {
  userId: string
  triggerToast: (message: string, type?: "success" | "error") => void
}

export function CalendarConnectionCard({ userId, triggerToast }: CalendarConnectionCardProps) {
  const [status, setStatus] = useState<"loading" | "connected" | "disconnected">("loading")
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null)
  const [calendarName, setCalendarName] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{id: string; summary: string; start: string; htmlLink: string}>>([])

  const checkStatus = async () => {
    setStatus("loading")
    try {
      const res = await fetch("/api/calendar/status")
      const data = await res.json()
      if (data.connected) {
        setStatus("connected")
        setCalendarEmail(data.email)
        setCalendarName(data.name)
        loadEvents()
      } else {
        setStatus("disconnected")
      }
    } catch {
      setStatus("disconnected")
    }
  }

  useEffect(() => {
    checkStatus()

    const params = new URLSearchParams(window.location.search)
    const calendarStatus = params.get("calendar")
    if (calendarStatus === "connected") {
      triggerToast("Google Calendar conectado com sucesso!")
      const newUrl = window.location.pathname + window.location.hash
      window.history.replaceState({}, "", newUrl)
    } else if (calendarStatus === "error") {
      const msg = params.get("message") || "Erro desconhecido"
      triggerToast(`Erro ao conectar Google Calendar: ${decodeURIComponent(msg)}`, "error")
      const newUrl = window.location.pathname + window.location.hash
      window.history.replaceState({}, "", newUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadEvents = async () => {
    try {
      const res = await fetch("/api/calendar/events?maxResults=5")
      const data = await res.json()
      if (data.connected && data.events) {
        setUpcomingEvents(data.events)
      }
    } catch {
      // silently fail
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const returnUrl = window.location.pathname + window.location.search
      const res = await fetch(`/api/calendar/auth?returnUrl=${encodeURIComponent(returnUrl)}`)
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        triggerToast("Erro ao gerar URL de autenticação.", "error")
        setConnecting(false)
      }
    } catch (err) {
      triggerToast("Erro ao conectar Google Calendar.", "error")
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch("/api/calendar/disconnect", { method: "POST" })
      setStatus("disconnected")
      setCalendarEmail(null)
      setCalendarName(null)
      setUpcomingEvents([])
      triggerToast("Google Calendar desconectado!")
    } catch {
      triggerToast("Erro ao desconectar.", "error")
    }
  }

  const formatEventTime = (dateStr: string) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="double-bezel-card bento-detail-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
      <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 border border-border/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="size-4 text-primary" />
            <h3 className="font-semibold text-xs text-foreground font-display">Google Calendar</h3>
          </div>
          {status !== "loading" && (
            <button
              onClick={checkStatus}
              className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
              title="Atualizar status"
            >
              <HugeiconsIcon icon={RefreshIcon} className="size-3" />
            </button>
          )}
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center py-4">
            <p className="text-[10px] text-muted-foreground animate-pulse">Verificando conexão...</p>
          </div>
        )}

        {status === "disconnected" && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground">
              Conecte seu Google Calendar para sincronizar reuniões e criar eventos com Google Meet automaticamente.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest h-8 rounded-lg active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
            >
              {connecting ? "Conectando..." : "Conectar Google Calendar"}
            </button>
          </div>
        )}

        {status === "connected" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/5 border border-border/20 rounded-lg">
              <div className="size-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest truncate">Conectado</p>
                {calendarEmail && (
                  <p className="text-[9px] text-muted-foreground truncate">{calendarEmail}</p>
                )}
              </div>
            </div>

            {upcomingEvents.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Próximos Eventos</p>
                {upcomingEvents.slice(0, 3).map((event) => (
                  <a
                    key={event.id}
                    href={event.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-2 p-2 bg-muted/5 border border-border/20 rounded-lg hover:bg-muted/10 transition-colors group"
                  >
                    <div className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {event.summary}
                      </p>
                      <p className="text-[8px] text-muted-foreground">
                        {formatEventTime(event.start)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {upcomingEvents.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                Nenhum evento futuro no calendário.
              </p>
            )}

            <button
              onClick={handleDisconnect}
              className="w-full bg-muted/20 hover:bg-muted/30 text-foreground border border-border/40 text-[9px] font-bold uppercase tracking-widest h-7 rounded-lg active:scale-[0.98] transition-all duration-300"
            >
              Desconectar Google Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
