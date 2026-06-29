"use client"

import React, { useEffect, useState, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Link01Icon,
  CheckmarkCircle02Icon,
  Time01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: string
  end: string
  type: "meeting" | "google"
  status?: "pending" | "confirmed" | "declined"
  platform?: string
  meetingLink?: string
  htmlLink?: string
  hangoutLink?: string
  creator?: string
  clientSuggestedDate?: string | null
}

interface CalendarMonthViewProps {
  clientId: string
  userId: string
  triggerToast: (message: string, type?: "success" | "error") => void
}

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function CalendarMonthView({ clientId, userId, triggerToast }: CalendarMonthViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createDate, setCreateDate] = useState<string>("")
  const [createTitle, setCreateTitle] = useState("")
  const [createDesc, setCreateDesc] = useState("")
  const [createTime, setCreateTime] = useState("10:00")
  const [createPlatform, setCreatePlatform] = useState("Google Meet")
  const [createCalendarSync, setCreateCalendarSync] = useState(false)
  const [creating, setCreating] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`
      const res = await fetch(`/api/calendar/combined-events?clientId=${clientId}&month=${monthStr}`)
      const data = await res.json()
      setEvents(data.events || [])
      setGoogleConnected(data.googleConnected || false)
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [year, month, clientId])

  // GSAP entrance animation
  useGSAP(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        ".cal-day-cell",
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.4, stagger: 0.02, ease: "back.out(1.2)" }
      )
    }
  }, { dependencies: [loading, currentDate], scope: containerRef })

  // Navegação
  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Dias do mês
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Grid de dias: preencher semanas completas
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7
  const days: (number | null)[] = []

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(daysInPrevMonth - firstDayOfMonth + 1 + i) // dias do mês anterior
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  while (days.length < totalCells) {
    days.push(days.length - firstDayOfMonth - daysInMonth + 1) // dias do próximo mês
  }

  const today = new Date()
  const isToday = (day: number, isCurrentMonth: boolean) =>
    isCurrentMonth &&
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  const getEventsForDay = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return []
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((e) => e.start.startsWith(dateStr))
  }

  const formatEventTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setCreateDate(dateStr)
    setCreateTitle("")
    setCreateDesc("")
    setCreateTime("10:00")
    setCreateCalendarSync(false)
    setShowCreateModal(true)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createTitle.trim()) return
    setCreating(true)

    try {
      const meetingDate = new Date(`${createDate}T${createTime}:00`)

      const res = await fetch("/api/client-portal/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },          body: JSON.stringify({
          clientId,
          userId,
          title: createTitle,
          description: createDesc,
          meetingDate: meetingDate.toISOString(),
          platform: createPlatform,
          createCalendarEvent: createCalendarSync,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar evento")

      triggerToast(createCalendarSync ? "Evento criado e sincronizado com Google Calendar!" : "Reunião agendada!")
      setShowCreateModal(false)
      fetchEvents()
    } catch (err: any) {
      triggerToast(err.message || "Erro ao criar evento", "error")
    } finally {
      setCreating(false)
    }
  }

  // Obter cor baseada no tipo
  const getEventStyle = (evt: CalendarEvent) => {
    if (evt.type === "google") {
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
    if (evt.status === "confirmed") {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    }
    if (evt.status === "declined") {
      return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    }
    return "bg-primary/20 text-primary border-primary/30"
  }

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="size-8 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-center hover:bg-muted/40 active:scale-[0.95] transition-all duration-300 text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          </button>
          <h3 className="text-sm font-semibold text-foreground font-display min-w-[180px] text-center">
            {MONTHS[month]} {year}
          </h3>
          <button
            onClick={goToNextMonth}
            className="size-8 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-center hover:bg-muted/40 active:scale-[0.95] transition-all duration-300 text-foreground"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="h-8 px-3 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/20 active:scale-[0.95] transition-all duration-300"
          >
            Hoje
          </button>
          {googleConnected && (
            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
              Google
            </span>
          )}
        </div>
      </div>

      {/* Grid do calendário */}
      <div className="bg-muted/5 border border-border/20 rounded-2xl overflow-hidden">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 border-b border-border/20">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-2.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center bg-muted/10"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Dias do mês */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = idx >= firstDayOfMonth && idx < firstDayOfMonth + daysInMonth
            const dayEvents = day ? getEventsForDay(day, isCurrentMonth) : []
            const isTodayDate = day ? isToday(day, isCurrentMonth) : false

            return (
              <div
                key={idx}
                onClick={() => day && handleDayClick(day)}
                className={`cal-day-cell min-h-[90px] p-1.5 border-b border-r border-border/10 cursor-pointer hover:bg-muted/10 transition-colors duration-200 relative group ${
                  !isCurrentMonth ? "opacity-30 pointer-events-none" : ""
                } ${isTodayDate ? "bg-primary/5" : ""}`}
              >
                {/* Número do dia */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                      isTodayDate
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[8px] font-bold text-muted-foreground bg-muted/30 rounded-full px-1.5 py-0.5">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Eventos do dia (max 2 visíveis) */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEvent(evt)
                      }}
                      className={`text-[8px] font-semibold px-1.5 py-0.5 rounded border truncate ${getEventStyle(evt)}`}
                    >
                      {formatEventTime(evt.start)} {evt.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[7px] text-muted-foreground font-medium px-1">
                      +{dayEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-primary/30 border border-primary/40" />
          Reunião
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-emerald-500/30 border border-emerald-500/40" />
          Confirmada
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-amber-500/30 border border-amber-500/40" />
          Ajuste
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-blue-500/30 border border-blue-500/40" />
          Google Calendar
        </div>
      </div>

      {/* Modal de detalhes do evento */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className={`size-3 rounded-full ${
                selectedEvent.type === "google" ? "bg-blue-500" :
                selectedEvent.status === "confirmed" ? "bg-emerald-500" :
                selectedEvent.status === "declined" ? "bg-amber-500" : "bg-primary"
              }`} />
              <h3 className="text-sm font-semibold text-foreground">{selectedEvent.title}</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
                <span>
                  {new Date(selectedEvent.start).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <HugeiconsIcon icon={Time01Icon} className="size-3.5" />
                <span>
                  {formatEventTime(selectedEvent.start)} - {formatEventTime(selectedEvent.end || selectedEvent.start)}
                </span>
              </div>
              {selectedEvent.platform && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
                  <span>{selectedEvent.platform}</span>
                </div>
              )}
              {selectedEvent.description && (
                <p className="text-muted-foreground bg-muted/10 rounded-xl p-3 leading-relaxed">
                  {selectedEvent.description}
                </p>
              )}
              {selectedEvent.status && (
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 ring-1 ${
                    selectedEvent.status === "confirmed"
                      ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                      : selectedEvent.status === "declined"
                      ? "bg-amber-500/10 text-amber-500 ring-amber-500/20"
                      : "bg-blue-500/10 text-blue-500 ring-blue-500/20"
                  }`}>
                    {selectedEvent.status === "confirmed" ? "Confirmada" :
                     selectedEvent.status === "declined" ? "Ajuste Proposto" : "Pendente"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/20">
              {selectedEvent.meetingLink && (
                <a
                  href={selectedEvent.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider h-8 rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all duration-300"
                >
                  <HugeiconsIcon icon={Link01Icon} className="size-3" />
                  Entrar
                </a>
              )}
              {selectedEvent.htmlLink && (
                <a
                  href={selectedEvent.htmlLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-muted/20 text-foreground border border-border/40 text-[10px] font-bold uppercase tracking-wider h-8 rounded-xl flex items-center justify-center gap-1.5 hover:bg-muted/30 active:scale-[0.98] transition-all duration-300"
                >
                  <HugeiconsIcon icon={Calendar03Icon} className="size-3" />
                  Google
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação de evento */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Nova Reunião</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="Ex: Alinhamento Semanal"
                  className="w-full h-9 px-3 bg-muted/10 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Data
                  </label>
                  <input
                    type="date"
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                    className="w-full h-9 px-3 bg-muted/10 border border-border/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={createTime}
                    onChange={(e) => setCreateTime(e.target.value)}
                    className="w-full h-9 px-3 bg-muted/10 border border-border/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Descrição (opcional)
                </label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Pauta da reunião..."
                  rows={2}
                  className="w-full px-3 py-2 bg-muted/10 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Plataforma
                </label>
                <select
                  value={createPlatform}
                  onChange={(e) => setCreatePlatform(e.target.value)}
                  className="w-full h-9 px-3 bg-muted/10 border border-border/40 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="WhatsApp Call">WhatsApp Call</option>
                  <option value="Presencial">Presencial</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createCalendarSync}
                  onChange={(e) => setCreateCalendarSync(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-[11px] text-foreground font-medium">
                  Sincronizar com Google Calendar
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 h-9 rounded-xl bg-muted/20 text-foreground border border-border/40 text-[10px] font-bold uppercase tracking-wider hover:bg-muted/30 active:scale-[0.98] transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 h-9 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                >
                  {creating ? "Criando..." : "Agendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
