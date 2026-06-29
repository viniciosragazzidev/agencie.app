"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon, UserIcon, ArrowRight01Icon, SparklesIcon,
  Message01Icon, Settings01Icon, WifiOff01Icon, BlocksIcon, BlockedIcon,
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
import { MagneticTabs } from "@/components/ui/magnetic-tabs"
import { QuickChatActions } from "@/components/inbox/quick-chat-actions"
import { QuickActionModals } from "@/components/inbox/quick-action-modals"
import { InteractiveMessageComposer } from "@/components/inbox/interactive-message-composer"

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
  isClient?: boolean
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

function formatWppText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Split by formatting markers, keeping the delimiters
  const regex = /(```[\s\S]*?```|`[^`]+`|\*[^*]+\*|_[^_]+_|~[^~]+~)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith("```") && token.endsWith("```")) {
      const code = token.slice(3, -3)
      parts.push(
        <pre key={key++} className="bg-black/20 rounded-lg p-2 my-1 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">{code}</pre>
      )
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={key++} className="bg-black/20 rounded px-1 py-0.5 text-[11px] font-mono">{token.slice(1, -1)}</code>
      )
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<strong key={key++} className="font-semibold">{token.slice(1, -1)}</strong>)
    } else if (token.startsWith("_") && token.endsWith("_")) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith("~") && token.endsWith("~")) {
      parts.push(<span key={key++} className="line-through opacity-70">{token.slice(1, -1)}</span>)
    } else {
      parts.push(token)
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
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

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [ignoringConvId, setIgnoringConvId] = useState<string | null>(null)
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null)
  const [activeActionModal, setActiveActionModal] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [showInteractiveComposer, setShowInteractiveComposer] = useState(false)
  const [sendingInteractive, setSendingInteractive] = useState(false)
  const [annotatingMsgId, setAnnotatingMsgId] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<Record<string, { id: string; summary: string; explanation: string; tag: string; messageContent?: string }>>({})
  const [showAnnotationsPanel, setShowAnnotationsPanel] = useState(false)

  // Lightbox: Escape key + body scroll lock
  useEffect(() => {
    if (!lightboxImage) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxImage(null)
    }
    document.addEventListener("keydown", handleKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", handleKey)
    }
  }, [lightboxImage])
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
      } catch { }
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
      fetchAnnotations(found.id)
      setConversations((prev) =>
        prev.map((c) => c.id === found.id ? { ...c, unreadCount: "0" } : c)
      )
      fetch(`/api/conversations/${found.id}/messages`, { method: "PATCH" }).catch(() => { })
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
      const raw = data.conversations || []
      // Client-side dedup by externalChatId (safety net for race conditions)
      const seen = new Map<string, typeof raw[0]>()
      for (const conv of raw) {
        const key = `${conv.integrationId}:${conv.contactIdentifier || conv.externalChatId || ""}`
        const existing = seen.get(key)
        if (!existing || new Date(conv.lastMessageAt || 0) > new Date(existing.lastMessageAt || 0)) {
          seen.set(key, conv)
        }
      }
      setConversations(Array.from(seen.values()))
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
    } catch { }
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
              // Dedup: verificar por ID e tambem por content+direction para mensagens duplicadas
              const existsById = prev.some((m) => m.id === newMsg.id)
              if (existsById) return prev
              const existsByContent = prev.some((m) => m.content === newMsg.content && m.direction === newMsg.direction && Math.abs(new Date(m.sentAt).getTime() - new Date(newMsg.sentAt).getTime()) < 2000)
              if (existsByContent) return prev
              return [...prev, newMsg]
            })
          }
          return current
        })

        // Atualizar lista de conversas
        setActiveConvId((currentActive) => {
          setConversations((prev) => {
        // Client-side dedup: check if this conversation already exists by externalChatId
        const convIdentifier = (updatedConv?.contactIdentifier && updatedConv.contactIdentifier.trim()) || updatedConv?.externalChatId || ""
        const externalKey = updatedConv ? `${updatedConv.integrationId}:${convIdentifier}` : null
        let idx = prev.findIndex((c) => c.id === conversationId)
        if (idx === -1 && externalKey) {
          idx = prev.findIndex((c) => {
            const k = `${c.integrationId}:${(c.contactIdentifier && c.contactIdentifier.trim()) || c.externalChatId || ""}`
            return k === externalKey
          })
        }
            if (idx === -1) {
              fetchConversations()
              return prev
            }
            // Prevent duplicate: skip if a different conversation has the same external key
            if (idx !== -1 && prev[idx].id !== conversationId && externalKey) {
              // The existing entry is the canonical one, skip this update
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
              // Substituir temp pela real ou adicionar se nao existe
              const tempIdx = prev.findIndex((m) => m.id.startsWith("temp-") && m.content === sentMsg.content && m.direction === "outbound")
              if (tempIdx !== -1) {
                const updated = [...prev]
                updated[tempIdx] = sentMsg
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
      const raw: Message[] = data.messages || []
      // Dedup by ID first, then by content+direction+timestamp as safety net
      const seenIds = new Set<string>()
      const seenContent = new Set<string>()
      const deduped = raw.filter((m) => {
        if (seenIds.has(m.id)) return false
        seenIds.add(m.id)
        // Content+direction+timestamp dedup (within 2s window)
        const contentKey = `${m.direction}:${m.content}:${Math.round(new Date(m.sentAt).getTime() / 2000)}`
        if (seenContent.has(contentKey)) return false
        seenContent.add(contentKey)
        return true
      })
      setMessages(deduped)
    } catch {
      toast.error("Erro ao carregar mensagens")
    } finally {
      setLoadingMsgs(false)
    }
  }

  const fetchAnnotations = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/annotations`)
      const data = await res.json()
      const map: Record<string, { id: string; summary: string; explanation: string; tag: string; messageContent?: string }> = {}
      for (const ann of data.annotations || []) {
        map[ann.messageId] = ann
      }
      setAnnotations(map)
    } catch {}
  }

  const handleAnnotateMessage = async (msg: Message) => {
    if (!activeConvId || annotatingMsgId) return
    setAnnotatingMsgId(msg.id)
    try {
      const res = await fetch(`/api/conversations/${activeConvId}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id, messageContent: msg.content }),
      })
      const data = await res.json()
      if (res.ok && data.annotation) {
        setAnnotations(prev => ({ ...prev, [msg.id]: data.annotation }))
        toast.success("Anotação criada!")
      } else {
        toast.error(data.error || "Erro ao criar anotação")
      }
    } catch {
      toast.error("Erro ao criar anotação")
    } finally {
      setAnnotatingMsgId(null)
    }
  }

  const handleDeleteAnnotation = async (annotationId: string, msgId: string) => {
    if (!activeConvId) return
    try {
      const res = await fetch(`/api/conversations/${activeConvId}/annotations/${annotationId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setAnnotations(prev => {
          const next = { ...prev }
          delete next[msgId]
          return next
        })
        toast.success("Anotação removida")
      }
    } catch {
      toast.error("Erro ao remover anotação")
    }
  }

  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId)
    setMessageText("")
    setAiSuggestion("")
    setAnnotations({})
    fetchMessages(convId)
    fetchAnnotations(convId)
    setConversations((prev) =>
      prev.map((c) => c.id === convId ? { ...c, unreadCount: "0" } : c)
    )
    // Resetar unread no servidor (sem await — fire and forget)
    fetch(`/api/conversations/${convId}/messages`, { method: "PATCH" }).catch(() => { })
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

  const handleDeleteConv = (convId: string | null) => {
    if (!convId) return
    setDeletingConvId(convId)
  }

  const executeDeleteConv = async () => {
    if (!deletingConvId) return
    const convId = deletingConvId
    try {
      const res = await fetch(`/api/conversations/${convId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Conversa removida")
        setConversations((prev) => prev.filter((c) => c.id !== convId))
        if (activeConvId === convId) setActiveConvId(null)
      } else {
        toast.error("Erro ao remover conversa")
      }
    } catch {
      toast.error("Erro ao remover conversa")
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
        // Mover conversa pro topo da lista
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === activeConvId)
          if (idx === -1) return prev
          const updated = [...prev]
          updated[idx] = {
            ...updated[idx],
            lastMessagePreview: data.message.content,
            lastMessageAt: data.message.sentAt,
          }
          return [updated[idx], ...updated.filter((_, i) => i !== idx)]
        })
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



  const activeConv = conversations.find((c) => c.id === activeConvId)
  const activeIntegration = integrations.find((i) => i.id === activeConv?.integrationId)


  const hasActiveIntegrations = integrations.some((i) => i.status === "active")

  const filteredConvs = conversations.filter((conv) => {
    const matchesTab = activeTab === "ALL" || conv.channel === activeTab
    const matchesSearch = (conv.contactName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.lastMessagePreview || "").toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  useGSAP(() => {
    if (loadingConvs || filteredConvs.length === 0) return

    gsap.fromTo(
      ".conv-item",
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "cubic-bezier(0.32,0.72,0,1)",
        clearProps: "all",
      }
    )
  }, { dependencies: [filteredConvs, loadingConvs] })

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
                <h1 className="text-lg font-heading font-semibold tracking-tight leading-none">Inbox Omnichannel</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">Gestão centralizada</p>
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

          <MagneticTabs
            options={[
              { id: "ALL", name: "Todos" },
              { id: "whatsapp", name: "WhatsApp" },
              { id: "instagram", name: "Instagram" },
              { id: "facebook", name: "Facebook" },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
            className="w-full"
          />
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
                  style={{ opacity: 0, transform: 'translateY(15px)' }}
                  className={`conv-item p-4 hover:bg-muted/10 cursor-pointer transition-all duration-300 flex gap-3 relative ${activeConvId === conv.id ? "bg-muted/10" : ""}`}>
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
      <div className="hidden lg:flex flex-1 flex-col min-w-0 min-h-0 bg-background h-full bento-item relative overflow-hidden">

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
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ring-1 uppercase tracking-wider ml-1 ${activeConv?.isClient ? "bg-green-500/10 text-green-500 ring-green-500/20" : "bg-blue-500/10 text-blue-500 ring-blue-500/20"}`}>
                      {activeConv?.isClient ? "CLIENTE" : "LEAD"}
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
                  onClick={() => handleDeleteConv(activeConvId)}
                  className="h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1 px-3 text-amber-500 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                  title="Remover conversa da lista"
                >
                  🗑 Remover
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleIgnore(activeConvId)}
                  className="h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1 px-3 text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  title="Marcar como número sem valor / ignorar"
                >
                  <HugeiconsIcon icon={BlockedIcon} /> Ignorar
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnotationsPanel(!showAnnotationsPanel)}
                  className={`h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider gap-1.5 px-3 transition-colors ${showAnnotationsPanel ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground border-border/40 hover:bg-muted/30"}`}
                >
                  <HugeiconsIcon icon={SparklesIcon} className="size-3" />
                  Anotações ({Object.keys(annotations).length})
                </Button>
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
                  return messages.map((msg) => {
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
                        <div data-msg-id={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300 group/msg`}>
                          <div className={`relative rounded-2xl px-4 py-2.5 max-w-[75%] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] border ${isOut ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-sm" : "bg-card text-foreground border-border/50 rounded-tl-sm"}`}>
                            {/* Revoked / deleted message */}
                            {msg.mediaType === "revoked" && (
                              <div className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-xl ${isOut ? "bg-white/10" : "bg-black/10"}`}>
                                <svg className="size-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                <span className="text-[11px] italic opacity-50">Mensagem apagada</span>
                              </div>
                            )}

                            {/* Interactive List Message (WhatsApp button/list responses) */}
                            {msg.mediaType === "interactive" && (
                              <div className={`mb-2 rounded-xl overflow-hidden border ${isOut ? "border-white/10" : "border-border/30"}`}>
                                <div className={`px-3.5 py-2.5 ${isOut ? "bg-white/10" : "bg-primary/5"}`}>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`size-5 rounded-md flex items-center justify-center ${isOut ? "bg-white/20" : "bg-primary/15"}`}>
                                      <svg className="size-3" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" /></svg>
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Mensagem Interativa</span>
                                  </div>
                                  <p className="text-[11px] font-semibold leading-snug">{msg.content}</p>
                                </div>
                              </div>
                            )}

                            {/* Poll / Enquete message */}
                            {(msg.mediaType === "pollCreationMessage" || msg.mediaType === "poll_update" || msg.mediaType === "poll_creation_answer") && (
                              <div className={`mb-2 rounded-xl overflow-hidden border ${isOut ? "border-white/10" : "border-border/30"}`}>
                                <div className={`px-3.5 py-2.5 ${isOut ? "bg-white/10" : "bg-primary/5"}`}>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`size-5 rounded-md flex items-center justify-center ${isOut ? "bg-white/20" : "bg-primary/15"}`}>
                                      <svg className="size-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3v18h18V3H3zm8 14H7v-2h4v2zm0-4H7v-2h4v2zm0-4H7V7h4v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z" /></svg>
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Enquete</span>
                                  </div>
                                  <p className="text-[11px] font-semibold leading-snug">{msg.content}</p>
                                </div>
                                {msg.mediaType === "poll_creation_answer" && (
                                  <div className={`px-3.5 py-2 border-t ${isOut ? "border-white/10" : "border-border/30"}`}>
                                    <div className="flex items-center gap-1.5">
                                      <svg className="size-3 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                                      <span className="text-[11px] font-medium">Resposta enviada</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Location message */}
                            {msg.mediaType === "location" && (
                              <div className={`mb-2 rounded-xl overflow-hidden border ${isOut ? "border-white/10" : "border-border/30"}`}>
                                <div className={`flex items-center gap-3 px-3.5 py-3 ${isOut ? "bg-white/10" : "bg-primary/5"}`}>
                                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${isOut ? "bg-white/20" : "bg-red-500/10"}`}>
                                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold">Localização</p>
                                    <p className="text-[10px] opacity-60 mt-0.5 truncate">{msg.content || "Coordenadas compartilhadas"}</p>
                                  </div>
                                  <a href={msg.content?.match(/https?:\/\/\S+/)?.[0] || `https://www.google.com/maps/search/?api=1`} target="_blank" rel="noopener noreferrer" className={`shrink-0 size-8 rounded-lg flex items-center justify-center transition-colors ${isOut ? "bg-white/15 hover:bg-white/25" : "bg-primary/10 hover:bg-primary/20"}`}>
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Live Location */}
                            {msg.mediaType === "liveLocation" && (
                              <div className={`mb-2 rounded-xl overflow-hidden border ${isOut ? "border-white/10" : "border-border/30"}`}>
                                <div className={`flex items-center gap-3 px-3.5 py-3 ${isOut ? "bg-white/10" : "bg-green-500/5"}`}>
                                  <div className="relative shrink-0">
                                    <div className="size-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                                      <svg className="size-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                      </svg>
                                    </div>
                                    <div className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-green-500 border-2 border-card animate-pulse" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-green-500">Localização ao vivo</p>
                                    <p className="text-[10px] opacity-60 mt-0.5">Atualizando em tempo real</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Contact message */}
                            {msg.mediaType === "contact" && (() => {
                              // Parse the vCard (FN = name, TEL = phone) so we render clean fields
                              // instead of dumping the raw BEGIN:VCARD / VERSION / TEL;... blob.
                              const raw = msg.content || ""
                              const contactName = raw.match(/FN:([^\n\r]*)/)?.[1]?.trim() ?? ""
                              const contactPhone = raw.match(/TEL[^:\n\r]*:([^\n\r]*)/)?.[1]?.trim() ?? ""
                              const fallback = raw
                                .split(/\r?\n/)
                                .map(l => l.replace(/^(?:BEGIN|END):VCARD$/i, "").replace(/^VERSION:\d.*$/i, "").replace(/^[A-Z]+(?:;[^:]*)?:/i, "").trim())
                                .filter(Boolean)
                                .join(" · ")
                              const displayName = contactName || contactPhone || fallback || "Vcard"
                              const showPhone = Boolean(contactName && contactPhone)
                              const copyValue = contactPhone || raw
                              return (
                                <div className={`mb-2 rounded-xl overflow-hidden border max-w-[260px] ${isOut ? "border-white/10" : "border-border/30"}`}>
                                  <div className={`flex items-center gap-3 px-3.5 py-3 ${isOut ? "bg-white/10" : "bg-primary/5"}`}>
                                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${isOut ? "bg-white/20" : "bg-primary/15"}`}>
                                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-semibold">Contato compartilhado</p>
                                      <p className="text-[10px] opacity-60 mt-0.5 truncate">{displayName}</p>
                                      {showPhone && (
                                        <p className="text-[10px] opacity-50 mt-0.5 truncate">{contactPhone}</p>
                                      )}
                                    </div>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(copyValue)
                                          toast.success(contactPhone ? `Telefone copiado: ${contactPhone}` : "Contato copiado para a área de transferência")
                                        } catch {
                                          toast.error("Não foi possível copiar o contato")
                                        }
                                      }}
                                      className={`shrink-0 size-8 rounded-lg flex items-center justify-center transition-colors ${isOut ? "bg-white/15 hover:bg-white/25" : "bg-primary/10 hover:bg-primary/20"}`}
                                      title="Copiar telefone do contato"
                                    >
                                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )
                            })()}

                            {/* Sticker */}
                            {msg.mediaType === "sticker" && msg.mediaUrl && (
                              <div className="mb-2 flex justify-center">
                                <img src={msg.mediaUrl} alt="Figurinha" className="max-h-40 max-w-40 object-contain" loading="lazy" />
                              </div>
                            )}

                            {/* Standard media (image, audio, video, document) */}
                            {msg.mediaUrl && !(["revoked", "pollCreationMessage", "poll_update", "poll_creation_answer", "location", "liveLocation", "contact", "sticker", "interactive", "list_response", "buttons_response"].includes(msg.mediaType || "")) && (
                              <div className="mb-2 max-w-full overflow-hidden">
                                {msg.mediaType === "image" ? (
                                  <button type="button" onClick={() => setLightboxImage(msg.mediaUrl ?? null)} className="block group/img w-full text-left cursor-pointer">
                                    <img
                                      src={msg.mediaUrl}
                                      alt="Imagem"
                                      className="max-h-72 w-full object-cover rounded-xl border border-white/10 transition-transform duration-300 group-hover/img:scale-[1.02]"
                                      loading="lazy"
                                    />
                                    <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
                                      <svg className="size-3 text-current opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                      </svg>
                                      <span className="text-[9px] opacity-60">Clique para ampliar</span>
                                    </div>
                                  </button>
                                ) : msg.mediaType === "audio" || msg.mediaType === "voice" || msg.mediaType === "ptt" ? (
                                  <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${isOut ? "bg-white/10" : "bg-black/10"}`}>
                                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${isOut ? "bg-white/20" : "bg-primary/20"}`}>
                                      <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 3a1 1 0 0 0-1 1v8a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1zM6.5 8A1.5 1.5 0 0 0 5 9.5v3a1.5 1.5 0 0 0 3 0v-3A1.5 1.5 0 0 0 6.5 8zm11 0A1.5 1.5 0 0 0 16 9.5v3a1.5 1.5 0 0 0 3 0v-3A1.5 1.5 0 0 0 17.5 8zM12 20.5a1 1 0 0 0 1-1v-2a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1z" />
                                      </svg>
                                    </div>
                                    <audio src={msg.mediaUrl} controls className="flex-1 h-8 min-w-0 [&::-webkit-media-controls-panel]:bg-transparent [&::-webkit-media-controls-play-button]:size-4 [&::-webkit-media-controls-play-button]:mr-1.5 [&::-webkit-media-controls-current-time-display]:text-[10px] [&::-webkit-media-controls-time-remaining-display]:text-[10px] [&::-webkit-media-controls-volume-slider]:hidden [&::-webkit-media-controls-mute-button]:hidden" />
                                  </div>
                                ) : msg.mediaType === "video" ? (
                                  <div className="rounded-xl overflow-hidden border border-white/10">
                                    <video
                                      src={msg.mediaUrl}
                                      controls
                                      preload="metadata"
                                      className="max-h-72 w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <a
                                    href={msg.mediaUrl}
                                    download
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors duration-200 ${isOut ? "bg-white/10 hover:bg-white/15" : "bg-black/10 hover:bg-black/15"}`}
                                  >
                                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${isOut ? "bg-white/20" : "bg-primary/20"}`}>
                                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-medium truncate">Documento</p>
                                      <p className="text-[9px] opacity-60 mt-0.5">Toque para baixar</p>
                                    </div>
                                    <svg className="size-4 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.content && !(msg.mediaUrl && ["📷 Imagem", "🎤 Áudio", "🎥 Vídeo", "📄 Documento"].includes(msg.content)) && (
                              <p className="text-xs leading-relaxed whitespace-pre-wrap">{formatWppText(msg.content)}</p>
                            )}
                            <span className={`text-[9px] mt-1 block text-right font-medium flex items-center justify-end gap-1 ${isOut ? statusColor : "opacity-60"}`}>
                              {new Date(msg.sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              {isOut && statusIcon && (
                                <span className={`text-[10px] leading-none ${msg.status === "read" ? "text-blue-400" : ""}`}>{statusIcon}</span>
                              )}
                            </span>

                            {/* Anotação da IA */}
                            {annotations[msg.id] && (
                              <div className={`mt-2 pt-2 border-t ${isOut ? "border-white/15" : "border-border/30"}`}>
                                <div className="flex items-start gap-1.5">
                                  <HugeiconsIcon icon={SparklesIcon} className="size-3 text-primary mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-primary leading-snug">{annotations[msg.id].summary}</p>
                                    <p className="text-[9px] text-muted-foreground/70 mt-0.5 leading-relaxed">{annotations[msg.id].explanation}</p>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteAnnotation(annotations[msg.id].id, msg.id) }}
                                    className="shrink-0 size-4 rounded flex items-center justify-center opacity-40 hover:opacity-100 hover:text-destructive transition-all"
                                    title="Remover anotação"
                                  >
                                    <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Botão de anotação (hover) */}
                            {!annotations[msg.id] && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAnnotateMessage(msg) }}
                                disabled={annotatingMsgId === msg.id}
                                className="absolute -top-2 -left-2 size-6 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center opacity-0 group-hover/msg:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg disabled:opacity-50"
                                title="Criar anotação com IA"
                              >
                                {annotatingMsgId === msg.id ? (
                                  <svg className="animate-spin size-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <HugeiconsIcon icon={SparklesIcon} className="size-3" />
                                )}
                              </button>
                            )}
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
              <div className="flex gap-2 items-center min-w-0">
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
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowInteractiveComposer(true)}
                  disabled={sending}
                  className="h-10 w-10 shrink-0 rounded-xl border-border/40 hover:bg-muted/30 p-0 flex items-center justify-center text-emerald-500 hover:text-emerald-600 transition-colors"
                  title="Enviar mensagem interativa (lista de opções)"
                >
                  <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" /></svg>
                </Button>
                <div className="shrink-0">
                  <QuickChatActions
                    isClient={Boolean(activeConv?.isClient)}
                    onSelectAction={(actionId) => setActiveActionModal(actionId)}
                    disabled={sending}
                  />
                </div>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 min-w-0 h-10 px-3.5 bg-muted/30 border border-border/40 rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
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

        {/* Painel de Anotações */}
        {showAnnotationsPanel && activeConvId && (
          <div className="absolute inset-0 z-10 flex flex-col bg-background border-l border-border/40 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={SparklesIcon} className="size-4 text-primary" />
                <div>
                  <h3 className="text-xs font-heading font-semibold">Anotações</h3>
                  <p className="text-[9px] text-muted-foreground">{Object.keys(annotations).length} anotação(ões)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAnnotationsPanel(false)}
                className="size-7 rounded-lg flex items-center justify-center hover:bg-muted/30 transition-colors text-muted-foreground"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 space-y-2">
                {Object.keys(annotations).length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <HugeiconsIcon icon={SparklesIcon} className="size-8 text-muted-foreground/20 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-xs text-muted-foreground">Nenhuma anotação ainda</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Passe o mouse sobre uma mensagem e clique no ícone de sparkle para criar uma anotação</p>
                  </div>
                ) : (
                  Object.entries(annotations).map(([msgId, ann]) => {
                    const tagColors: Record<string, string> = {
                      important: "bg-primary/10 text-primary ring-primary/20",
                      action_required: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
                      decision: "bg-blue-500/10 text-blue-500 ring-blue-500/20",
                      info: "bg-muted text-muted-foreground ring-border/30",
                    }
                    const tagLabels: Record<string, string> = {
                      important: "Importante",
                      action_required: "Ação Necessária",
                      decision: "Decisão",
                      info: "Info",
                    }
                    return (
                      <div
                        key={msgId}
                        className="p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-card transition-colors cursor-pointer group/ann"
                        onClick={() => {
                          const el = document.querySelector(`[data-msg-id="${msgId}"]`)
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ring-1 ${tagColors[ann.tag] || tagColors.info}`}>
                            {tagLabels[ann.tag] || ann.tag}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteAnnotation(ann.id, msgId) }}
                            className="size-5 rounded flex items-center justify-center opacity-0 group-hover/ann:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
                            title="Remover anotação"
                          >
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-[11px] font-semibold text-foreground leading-snug">{ann.summary}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed">{ann.explanation}</p>
                        <p className="text-[9px] text-muted-foreground/40 mt-2 truncate italic">Mensagem: "{ann.messageContent?.substring(0, 60)}..."</p>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
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

      <ConfirmDialog
        open={!!deletingConvId}
        onOpenChange={(open) => !open && setDeletingConvId(null)}
        title="Remover conversa"
        description={`Tem certeza que deseja remover a conversa com "${conversations.find((c) => c.id === deletingConvId)?.contactName || conversations.find((c) => c.id === deletingConvId)?.contactIdentifier || "este contato"}"? O histórico de mensagens será apagado.`}
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={executeDeleteConv}
        variant="destructive"
      />

      <QuickActionModals
        activeActionId={activeActionModal}
        onClose={() => setActiveActionModal(null)}
        conversation={activeConv}
        onSuccess={async (text) => {
          // Salvar a mensagem no banco de dados automaticamente
          if (!activeConvId) return
          
          const tempMsg: Message = {
            id: `temp-${Date.now()}`,
            direction: "outbound",
            content: text,
            sentAt: new Date().toISOString(),
            status: "sending",
          }

          // Optimistic update
          setMessages((prev) => [...prev, tempMsg])
          
          try {
            const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            })
            const data = await res.json()

            if (res.ok) {
              // Substituir mensagem temporária pela real
              setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? data.message : m))
              // Mover conversa pro topo da lista
              setConversations((prev) => {
                const idx = prev.findIndex((c) => c.id === activeConvId)
                if (idx === -1) return prev
                const updated = [...prev]
                updated[idx] = {
                  ...updated[idx],
                  lastMessagePreview: data.message.content,
                  lastMessageAt: data.message.sentAt,
                }
                return [updated[idx], ...updated.filter((_, i) => i !== idx)]
              })
              toast.success("Mensagem enviada e salva no histórico!")
            } else {
              toast.error(data.error || "Erro ao salvar mensagem")
              setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
            }
          } catch {
            toast.error("Erro ao salvar mensagem")
            setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
          }
          
          fetchConversations()
        }}
      />

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 z-[101] size-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors"
          >
            <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <img
            src={lightboxImage}
            alt="Imagem ampliada"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Download button */}
          <a
            href={lightboxImage}
            download
            className="absolute bottom-4 right-4 z-[101] size-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </a>
        </div>
      )}

      <InteractiveMessageComposer
        open={showInteractiveComposer}
        onOpenChange={setShowInteractiveComposer}
        sending={sendingInteractive}
        onSend={async (data) => {
          if (!activeConvId || !activeConv?.contactIdentifier) {
            toast.error("Selecione uma conversa para enviar mensagem interativa")
            return
          }
          setSendingInteractive(true)
          try {
            // Filter out sections with no usable rows
            const filteredSections = data.sections
              .map((s) => ({
                title: s.title,
                rows: s.rows
                  .filter((r) => r.title.trim())
                  .map((r) => ({
                    id: r.id || String(Date.now()),
                    title: r.title.trim(),
                    description: r.description?.trim() || undefined,
                  })),
              }))
              .filter((s) => s.rows.length > 0)

            if (filteredSections.length === 0) {
              toast.error("Adicione pelo menos uma opção com título")
              setSendingInteractive(false)
              return
            }

            const res = await fetch("/api/inbox/quick-actions/send-interactive", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contactPhone: activeConv.contactIdentifier,
                messageBody: data.messageBody,
                buttonText: data.buttonText,
                sections: filteredSections,
              }),
            })
            if (res.ok) {
              // Save the interactive message text to conversation history
              const previewSections = data.sections
                .map((s) => {
                  const rows = s.rows.filter((r) => r.title.trim())
                  if (rows.length === 0) return null
                  const header = s.title.trim() ? `${s.title.trim()}\n` : ""
                  return header + rows.map((r) => `• ${r.title.trim()}`).join("\n")
                })
                .filter(Boolean)
                .join("\n\n")
              const fullText = [data.messageBody, previewSections, `[${data.buttonText}]`]
                .filter(Boolean)
                .join("\n\n")

              const tempMsg: Message = {
                id: `temp-${Date.now()}`,
                direction: "outbound",
                content: fullText,
                mediaType: "interactive",
                sentAt: new Date().toISOString(),
                status: "sending",
              }
              setMessages((prev) => [...prev, tempMsg])

              const msgRes = await fetch(`/api/conversations/${activeConvId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: fullText, mediaType: "interactive" }),
              })
              const msgData = await msgRes.json()
              if (msgRes.ok) {
                setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? msgData.message : m))
                toast.success("Mensagem interativa enviada!")
              } else {
                setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
                toast.warning("Enviada no WhatsApp, mas houve erro ao salvar no histórico")
              }
            } else {
              const err = await res.json()
              toast.error(err.error || "Erro ao enviar mensagem interativa")
            }
          } catch {
            toast.error("Erro ao enviar mensagem interativa")
          } finally {
            setSendingInteractive(false)
          }
        }}
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
