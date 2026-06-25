"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, UserIcon, ArrowRight01Icon, SparklesIcon,
  Message01Icon, Settings01Icon, WifiOff01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Message {
  id: string
  direction: "inbound" | "outbound"
  content: string
  sentAt: string
  status?: string
  mediaUrl?: string | null
  mediaType?: string | null
}

interface Conversation {
  id: string
  channel: "whatsapp" | "instagram" | "facebook"
  contactName?: string | null
  contactIdentifier?: string | null
  contactAvatar?: string | null
  lastMessagePreview?: string | null
  lastMessageAt?: string | null
  unreadCount?: string
  integrationId: string
}

interface Integration {
  id: string
  channel: "whatsapp" | "instagram" | "facebook"
  status: string
  accountName?: string | null
}

const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: "text-green-500 bg-green-500/10 ring-green-500/20",
  instagram: "text-pink-500 bg-pink-500/10 ring-pink-500/20",
  facebook: "text-blue-500 bg-blue-500/10 ring-blue-500/20",
}

const CHANNEL_LETTER: Record<string, string> = {
  whatsapp: "W",
  instagram: "I",
  facebook: "F",
}

function InboxContent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"ALL" | "whatsapp" | "instagram" | "facebook">("ALL")
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [autopilotMap, setAutopilotMap] = useState<Record<string, boolean>>({})
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [testingWpp, setTestingWpp] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [ignoringConvId, setIgnoringConvId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const autoContactName = searchParams.get("contactName")
  const autoContactPhone = searchParams.get("contactPhone")
  const autoApproach = searchParams.get("approach")
  const autoSelectDone = useRef(false)

  useGSAP(() => {
    gsap.from(".bento-item", {
      y: 15, opacity: 0, duration: 0.8, stagger: 0.08,
      ease: "cubic-bezier(0.32,0.72,0,1)", clearProps: "all",
    })
  }, { scope: containerRef })

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest("[data-slot='scroll-area-viewport']")
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200
        if (isNearBottom || messages.length <= 1) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  useEffect(() => { scrollToBottom() }, [messages, aiThinking])

  // Buscar dados iniciais
  useEffect(() => {
    fetchConversations()
    fetchIntegrations()
    openInboxStream()
  }, [])

  // Polling: sincronizar mensagens do OpenWA a cada 5s (fallback para webhook em localhost)
  useEffect(() => {
    const wpp = integrations.find((i) => i.channel === "whatsapp" && i.status === "active")
    if (!wpp) return

    const syncMessages = async () => {
      try {
        await fetch("/api/integrations/whatsapp/sync", { method: "POST" })
      } catch {}
    }

    // Sync imediato
    syncMessages()

    // Sync a cada 5 segundos
    const interval = setInterval(syncMessages, 5000)
    return () => clearInterval(interval)
  }, [integrations])

  // Auto-selecionar conversa e preencher abordagem quando vier de "Abordar via Chat"
  useEffect(() => {
    if (autoSelectDone.current || conversations.length === 0) return
    if (!autoContactName && !autoContactPhone) return
    autoSelectDone.current = true

    const phoneDigits = (autoContactPhone || "").replace(/\D/g, "")

    const found = conversations.find((c) => {
      if (phoneDigits) {
        const idDigits = (c.contactIdentifier || "").replace(/\D/g, "")
        if (idDigits.includes(phoneDigits) || phoneDigits.includes(idDigits)) return true
      }
      if (autoContactName) {
        if ((c.contactName || "").toLowerCase().includes(autoContactName.toLowerCase())) return true
      }
      return false
    })
    if (found) {
      setActiveConvId(found.id)
      setAiSuggestion("")
      fetchMessages(found.id)
      setConversations((prev) =>
        prev.map((c) => c.id === found.id ? { ...c, unreadCount: "0" } : c)
      )
      fetch(`/api/conversations/${found.id}/messages`, { method: "PATCH" }).catch(() => {})
      if (autoApproach) {
        setMessageText(autoApproach)
      }
    } else {
      // Nenhuma conversa encontrada — criar uma nova
      const createConv = async () => {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contactPhone: autoContactPhone || "",
              contactName: autoContactName || "",
              channel: "whatsapp",
            }),
          })
          const data = await res.json()
          if (data.conversation) {
            setConversations((prev) => [data.conversation, ...prev])
            setActiveConvId(data.conversation.id)
            setAiSuggestion("")
            if (autoApproach) {
              setMessageText(autoApproach)
            }
          }
        } catch {
          if (autoApproach) {
            setMessageText(autoApproach)
          }
          toast.error("Erro ao criar conversa")
        }
      }
      createConv()
    }
  }, [conversations, autoContactName, autoContactPhone, autoApproach])

  const fetchConversations = async () => {
    setLoadingConvs(true)
    try {
      const res = await fetch("/api/conversations")
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {
      toast.error("Erro ao carregar conversas")
    } finally {
      setLoadingConvs(false)
    }
  }

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/integrations")
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } catch {}
  }

  // SSE global para tempo real
  const openInboxStream = useCallback(() => {
    const es = new EventSource("/api/inbox-stream")

    es.onopen = () => {
      console.log("[SSE] Conexão estabelecida")
    }

    es.onerror = () => {
      console.warn("[SSE] Conexão perdida, reconectando...")
    }

    es.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "ping") return

      console.log("[SSE] Evento recebido:", data.type, data)

      if (data.type === "new_message") {
        const { conversationId, message: newMsg, conversation: updatedConv } = data

        // Adicionar mensagem se for a conversa ativa
        setActiveConvId((current) => {
          if (current === conversationId) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === newMsg.id)
              return exists ? prev : [...prev, newMsg]
            })
          }
          return current
        })

        // Atualizar lista de conversas
        setActiveConvId((currentActive) => {
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === conversationId)
            if (idx === -1) {
              fetchConversations()
              return prev
            }
            const updated = [...prev]
            updated[idx] = {
              ...updated[idx],
              contactAvatar: updatedConv?.contactAvatar || updated[idx].contactAvatar,
              lastMessagePreview: newMsg.content,
              lastMessageAt: newMsg.sentAt,
              unreadCount: currentActive === conversationId
                ? "0"
                : String(parseInt(updated[idx].unreadCount || "0") + 1),
            }
            return [updated[idx], ...updated.filter((_, i) => i !== idx)]
          })
          return currentActive
        })
      }

      if (data.type === "integration_status") {
        setIntegrations((prev) =>
          prev.map((i) => i.id === data.integrationId ? { ...i, status: data.status } : i)
        )
      }

      // Multi-tab: receber mensagem que eu enviei em outra aba
      if (data.type === "message_sent") {
        const { conversationId, message: sentMsg } = data
        setActiveConvId((current) => {
          if (current === conversationId) {
            setMessages((prev) => {
              // Substituir temp pela real ou adicionar se não existe
              const idx = prev.findIndex((m) => m.id === sentMsg.id || m.id.startsWith("temp-") && m.content === sentMsg.content && m.direction === "outbound")
              if (idx !== -1) {
                const updated = [...prev]
                updated[idx] = sentMsg
                return updated
              }
              return prev.some((m) => m.id === sentMsg.id) ? prev : [...prev, sentMsg]
            })
          }
          return current
        })
      }

      // Atualizar status de mensagem (entrega/leitura)
      if (data.type === "message_status_update") {
        const { conversationId, messageId, status } = data
        setActiveConvId((current) => {
          if (current === conversationId) {
            setMessages((prev) =>
              prev.map((m) => m.id === messageId ? { ...m, status } : m)
            )
          }
          return current
        })
      }
    }

    return () => es.close()
  }, [])

  const fetchMessages = async (convId: string) => {
    setLoadingMsgs(true)
    setMessages([])
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      toast.error("Erro ao carregar mensagens")
    } finally {
      setLoadingMsgs(false)
    }
  }

  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId)
    setMessageText("")
    setAiSuggestion("")
    fetchMessages(convId)
    setConversations((prev) =>
      prev.map((c) => c.id === convId ? { ...c, unreadCount: "0" } : c)
    )
    // Resetar unread no servidor (sem await — fire and forget)
    fetch(`/api/conversations/${convId}/messages`, { method: "PATCH" }).catch(() => {})
  }

  const handleToggleIgnore = (convId: string | null) => {
    if (!convId) return
    setIgnoringConvId(convId)
  }

  const executeIgnoreConv = async () => {
    if (!ignoringConvId) return
    const convId = ignoringConvId
    try {
      const res = await fetch(`/api/conversations/${convId}/ignore`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isIgnored: true }),
      })
      if (res.ok) {
        toast.success("Número removido para lista de ignorados/sem valor")
        setConversations((prev) => prev.filter((c) => c.id !== convId))
        setActiveConvId(null)
      } else {
        toast.error("Erro ao ignorar contato")
      }
    } catch {
      toast.error("Erro ao ignorar contato")
    }
  }

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !attachmentFile) || !activeConvId || sending) return
    setSending(true)

    let mediaUrl: string | undefined
    let mediaType: string | undefined
    let fileName: string | undefined

    if (attachmentFile) {
      fileName = attachmentFile.name
      const mime = attachmentFile.type || "application/octet-stream"
      if (mime.startsWith("image/")) mediaType = "image"
      else if (mime.startsWith("audio/")) mediaType = "audio"
      else if (mime.startsWith("video/")) mediaType = "video"
      else mediaType = "document"

      mediaUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(attachmentFile)
      })
    }

    const sentText = messageText
    const sentFile = attachmentFile

    const defaultTag = mediaType === "image" ? "📷 Imagem" : mediaType === "audio" ? "🎤 Áudio" : mediaType === "video" ? "🎥 Vídeo" : "📄 Anexo"

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      direction: "outbound",
      content: sentText || defaultTag,
      mediaUrl,
      mediaType,
      sentAt: new Date().toISOString(),
      status: "sending",
    }

    // Optimistic update
    setMessages((prev) => [...prev, tempMsg])
    setMessageText("")
    setAttachmentFile(null)
    setAiSuggestion("")

    try {
      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sentText,
          mediaUrl,
          mediaType,
          fileName,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar mensagem")
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
        setMessageText(sentText)
        setAttachmentFile(sentFile)
      } else {
        // Substituir mensagem temporária pela real
        setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? data.message : m))
      }
    } catch {
      toast.error("Erro ao enviar mensagem")
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      setMessageText(sentText)
      setAttachmentFile(sentFile)
    } finally {
      setSending(false)
    }
  }

  const handleSuggestAi = () => {
    setAiThinking(true)
    setTimeout(() => {
      const activeConv = conversations.find((c) => c.id === activeConvId)
      const suggestion = `Olá, ${activeConv?.contactName || ""}! Obrigado pelo contato. Em que posso ajudá-lo hoje?`
      setMessageText(suggestion)
      setAiSuggestion(suggestion)
      setAiThinking(false)
    }, 1200)
  }

  const handleTestWpp = async () => {
    setTestingWpp(true)
    try {
      const res = await fetch("/api/integrations/whatsapp/test", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erro ao testar conexão")
        return
      }
      toast.success("Mensagem de teste enviada! Verifique seu WhatsApp.")
      // Recarregar conversas para mostrar a nova conversa de teste
      fetchConversations()
    } catch {
      toast.error("Erro ao testar conexão WhatsApp")
    } finally {
      setTestingWpp(false)
    }
  }

  const activeConv = conversations.find((c) => c.id === activeConvId)
  const activeIntegration = integrations.find((i) => i.id === activeConv?.integrationId)

  const wppIntegration = integrations.find((i) => i.channel === "whatsapp")
  const hasActiveIntegrations = integrations.some((i) => i.status === "active")

  const filteredConvs = conversations.filter((conv) => {
    const matchesTab = activeTab === "ALL" || conv.channel === activeTab
    const matchesSearch = (conv.contactName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.lastMessagePreview || "").toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return "Agora"
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  }

  return (
    <div ref={containerRef} className="flex-1 flex w-full h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      
      {/* Painel esquerdo — lista de conversas */}
      <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 border-r border-border/40 bg-sidebar/30 flex flex-col h-full min-h-0 bento-item">
        
        {/* Header Inbox */}
        <div className="p-4 border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HugeiconsIcon icon={Message01Icon} className="size-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-display font-semibold tracking-tight leading-none">Inbox Omnichannel</h1>
                <p className="text-[10px] text-muted-foreground mt-1">Gestão centralizada</p>
              </div>
            </div>
            
            {/* Indicador Autopiloto */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/40">
              <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">{Object.values(autopilotMap).filter(Boolean).length} IA</span>
            </div>
          </div>

          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="pl-9 h-9 bg-background border-border/40 rounded-xl text-xs focus-visible:ring-1"
            />
          </div>
          
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {[{ id: "ALL", name: "Todos" }, { id: "whatsapp", name: "WhatsApp" }, { id: "instagram", name: "Instagram" }, { id: "facebook", name: "Facebook" }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/30 text-muted-foreground hover:text-foreground border border-border/30"}`}>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de conversas */}
        <ScrollArea className="flex-1 min-h-0 bg-sidebar/10">
          <div className="divide-y divide-border/10">
                {!hasActiveIntegrations && !loadingConvs ? (
                  <div className="p-8 text-center space-y-3">
                    <HugeiconsIcon icon={WifiOff01Icon} className="size-8 mx-auto text-muted-foreground/40" strokeWidth={1} />
                    <p className="text-xs text-muted-foreground font-medium">Nenhum canal conectado</p>
                    <Link href="/settings/integrations">
                      <Button size="sm" className="h-8 text-[10px] rounded-full mt-1">
                        <HugeiconsIcon icon={Settings01Icon} className="size-3 mr-1.5" />
                        Configurar Integrações
                      </Button>
                    </Link>
                  </div>
                ) : loadingConvs ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-muted-foreground">Carregando conversas...</p>
                  </div>
                ) : filteredConvs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-muted-foreground">Nenhuma conversa encontrada</p>
                  </div>
                ) : (
                  filteredConvs.map((conv) => (
                    <div key={conv.id} onClick={() => handleSelectConversation(conv.id)}
                      className={`p-4 hover:bg-muted/10 cursor-pointer transition-all duration-300 flex gap-3 relative ${activeConvId === conv.id ? "bg-muted/10" : ""}`}>
                      {activeConvId === conv.id && (
                        <div className="absolute left-0 top-[20%] w-[3px] h-[60%] bg-primary rounded-r-full" />
                      )}
                      <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-muted border border-border/50 shrink-0 relative">
                        {conv.contactAvatar ? (
                          <img src={conv.contactAvatar} alt="" className="size-full rounded-full object-cover" />
                        ) : (
                          <HugeiconsIcon icon={UserIcon} className="size-5 text-muted-foreground" />
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border border-card flex items-center justify-center text-[7px] text-white font-bold font-sans ${CHANNEL_COLOR[conv.channel]?.includes("green") ? "bg-green-500" : CHANNEL_COLOR[conv.channel]?.includes("pink") ? "bg-pink-500" : "bg-blue-500"}`}>
                          {CHANNEL_LETTER[conv.channel]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-foreground truncate">{conv.contactName || conv.contactIdentifier || "Contato"}</h4>
                          <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessagePreview || "Sem mensagens"}</p>
                        </div>
                        <div className="flex flex-col items-end justify-between shrink-0 h-9">
                          <span className="text-[9px] font-medium text-muted-foreground leading-none">{formatTime(conv.lastMessageAt)}</span>
                          {conv.unreadCount && parseInt(conv.unreadCount) > 0 ? (
                            <div className="size-4 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground shadow-[0_0_6px_rgba(var(--primary),0.4)] mt-1">
                              {conv.unreadCount}
                            </div>
                          ) : <div className="size-4" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
          </div>
        </ScrollArea>
      </div>

      {/* Painel direito — chat ativo */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0 min-h-0 bg-background h-full bento-item relative">

              {!activeConvId ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <HugeiconsIcon icon={Message01Icon} className="size-12 text-muted-foreground/20" strokeWidth={1} />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Selecione uma conversa</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Ou aguarde uma nova mensagem chegar em tempo real</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header do chat */}
                  <div className="p-4 px-6 border-b border-border/40 flex items-center justify-between bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="flex aspect-square size-10 items-center justify-center rounded-full bg-muted border border-border/50 relative">
                        {activeConv?.contactAvatar ? (
                          <img src={activeConv.contactAvatar} alt="" className="size-full rounded-full object-cover" />
                        ) : (
                          <HugeiconsIcon icon={UserIcon} className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-xs text-foreground">
                            {activeConv?.contactName || activeConv?.contactIdentifier || "Contato"}
                          </h3>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ring-1 uppercase tracking-wider ${CHANNEL_COLOR[activeConv?.channel || "whatsapp"]}`}>
                            {activeConv?.channel === "whatsapp" ? "WPP" : activeConv?.channel?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-primary font-medium tracking-wide uppercase mt-0.5">
                          {activeIntegration?.accountName || activeConv?.channel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleIgnore(activeConvId)}
                        className="h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1 px-3 text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                        title="Marcar como número sem valor / ignorar"
                      >
                        🚫 Ignorar
                      </Button>

                      <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-xl border border-border/40">
                        <Switch
                          id="ai-auto"
                          checked={autopilotMap[activeConvId] || false}
                          onCheckedChange={(v) => setAutopilotMap((prev) => ({ ...prev, [activeConvId]: v }))}
                        />
                        <Label htmlFor="ai-auto" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer leading-none">
                          Autopiloto IA
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <ScrollArea className="flex-1 min-h-0 bg-muted/5">
                    <div className="p-6 space-y-4">
                    {loadingMsgs ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-muted-foreground">Carregando mensagens...</p>
                      </div>
                    ) : (() => {
                      // Renderizar com separadores de data
                      let lastDate = ""
                      return messages.map((msg, index) => {
                        const isOut = msg.direction === "outbound"
                        const msgDate = new Date(msg.sentAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                        const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                        const showDate = msgDate !== lastDate
                        lastDate = msgDate

                        // Status indicator para mensagens outbound
                        let statusIcon = ""
                        let statusColor = "opacity-60"
                        if (isOut) {
                          if (msg.status === "sending") {
                            statusIcon = "⏳"
                          } else if (msg.status === "sent") {
                            statusIcon = "✓"
                          } else if (msg.status === "delivered") {
                            statusIcon = "✓✓"
                          } else if (msg.status === "read") {
                            statusIcon = "✓✓"
                            statusColor = "text-blue-400 opacity-100"
                          } else {
                            statusIcon = "✓"
                          }
                        }

                        return (
                          <React.Fragment key={msg.id}>
                            {showDate && (
                              <div className="flex items-center justify-center py-2">
                                <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                  {msgDate === today ? "Hoje" : msgDate}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isOut ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                              <div className={`rounded-2xl px-4 py-2.5 max-w-[75%] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] border ${isOut ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-sm" : "bg-card text-foreground border-border/50 rounded-tl-sm"}`}>
                                {msg.mediaUrl && (
                                  <div className="mb-2 max-w-full overflow-hidden rounded-xl">
                                    {msg.mediaType === "image" ? (
                                      <img src={msg.mediaUrl} alt="Anexo" className="max-h-64 w-full object-cover rounded-xl border border-white/10" />
                                    ) : msg.mediaType === "audio" || msg.mediaType === "voice" || msg.mediaType === "ptt" ? (
                                      <audio src={msg.mediaUrl} controls className="w-full max-w-[240px] my-1" />
                                    ) : msg.mediaType === "video" ? (
                                      <video src={msg.mediaUrl} controls className="max-h-64 w-full rounded-xl" />
                                    ) : (
                                      <a href={msg.mediaUrl} download className="flex items-center gap-2 p-2.5 bg-black/20 rounded-xl text-xs underline">
                                        📎 Baixar Anexo / Documento
                                      </a>
                                    )}
                                  </div>
                                )}
                                {msg.content && !(msg.mediaUrl && ["📷 Imagem", "🎤 Áudio", "🎥 Vídeo", "📄 Documento"].includes(msg.content)) && (
                                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                )}
                                <span className={`text-[9px] mt-1 block text-right font-medium flex items-center justify-end gap-1 ${isOut ? statusColor : "opacity-60"}`}>
                                  {new Date(msg.sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  {isOut && statusIcon && (
                                    <span className={`text-[10px] leading-none ${msg.status === "read" ? "text-blue-400" : ""}`}>{statusIcon}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </React.Fragment>
                        )
                      })
                    })()}
                    {aiThinking && (
                      <div className="flex justify-end animate-pulse">
                        <div className="bg-secondary text-secondary-foreground border border-secondary-foreground/10 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%] flex items-center gap-2">
                          <svg className="animate-spin size-3.5 text-current" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-xs font-medium">IA pensando na resposta...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-border/40 bg-background/50 flex flex-col gap-2">
                    {attachmentFile && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary animate-in fade-in">
                        <span className="truncate max-w-[300px] font-medium flex items-center gap-1.5">
                          📎 Anexo pronto: <span className="underline">{attachmentFile.name}</span>
                        </span>
                        <button onClick={() => setAttachmentFile(null)} className="font-bold p-1 hover:text-destructive">✕</button>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" onClick={handleSuggestAi} disabled={aiThinking}
                        className="h-8 rounded-full text-[10px] font-bold uppercase tracking-wider gap-1.5 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                        <HugeiconsIcon icon={SparklesIcon} className="size-3" />
                        Sugerir Resposta via IA
                      </Button>
                      {autopilotMap[activeConvId] && (
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-green-500 animate-ping" />
                          Autopiloto assumirá resposta
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setAttachmentFile(e.target.files[0])
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                        className="h-10 w-10 shrink-0 rounded-xl border-border/40 hover:bg-muted/30 p-0 text-muted-foreground flex items-center justify-center text-base"
                        title="Anexar arquivo / imagem / áudio"
                      >
                        📎
                      </Button>
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        placeholder="Digite sua mensagem ou legenda..."
                        className="flex-1 h-10 px-3.5 bg-muted/30 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                        disabled={sending}
                      />
                      <Button onClick={handleSendMessage} disabled={sending || (!messageText.trim() && !attachmentFile)}
                        className="h-10 w-10 shrink-0 rounded-xl active:scale-[0.96] transition-transform flex items-center justify-center">
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
      </div>
      
      <ConfirmDialog
        open={!!ignoringConvId}
        onOpenChange={(open) => !open && setIgnoringConvId(null)}
        title="Marcar como número sem valor"
        description={`Tem certeza que deseja marcar "${conversations.find((c) => c.id === ignoringConvId)?.contactName || conversations.find((c) => c.id === ignoringConvId)?.contactIdentifier || "este contato"}" como número sem valor? Ele não aparecerá mais no Inbox.`}
        confirmText="Ignorar Contato"
        cancelText="Cancelar"
        onConfirm={executeIgnoreConv}
        variant="destructive"
      />

      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}` }} />
    </div>
  )
}

export default function InboxPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen text-xs text-muted-foreground">Carregando Inbox...</div>}>
      <InboxContent />
    </React.Suspense>
  )
}
