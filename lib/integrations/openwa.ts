/**
 * Cliente HTTP para o OpenWA (WhatsApp Gateway self-hosted)
 * Documentação: http://localhost:2785/api-docs
 */

const OPENWA_BASE = process.env.OPENWA_BASE_URL || "http://localhost:2785"
const OPENWA_KEY  = process.env.OPENWA_API_KEY  || ""

const openwaHeaders = {
  "Content-Type": "application/json",
  "X-Api-Key": OPENWA_KEY,
}

export interface OpenWASession {
  sessionId: string
  status: "created" | "initializing" | "qr_ready" | "authenticating" | "ready" | "disconnected" | "failed"
  qrCode?: string // base64 PNG
  phoneNumber?: string
  name?: string
}

export interface OpenWAMessage {
  messageId: string
  status: string
}

export interface OpenWAIncomingMessage {
  id: string
  waMessageId: string
  chatId: string
  from: string
  to: string
  body: string
  type: string
  direction: string
  timestamp: number
  metadata?: Record<string, unknown>
}

/**
 * Cria e inicia uma nova sessão WPP no OpenWA.
 * Retorna status e QR code (se ainda não autenticado).
 */
export async function createWppSession(sessionId: string): Promise<OpenWASession> {
  console.log("[OpenWA] createWppSession called with name:", sessionId)
  // 1. Criar sessão com o name amigável (sessionId)
  const createRes = await fetch(`${OPENWA_BASE}/api/sessions`, {
    method: "POST",
    headers: openwaHeaders,
    body: JSON.stringify({ name: sessionId }),
  })
  console.log("[OpenWA] POST /api/sessions status:", createRes.status)
  if (!createRes.ok) throw new Error(`OpenWA createSession failed: ${createRes.status}`)
  const createdData = await createRes.json()
  const uuid = createdData.id
  console.log("[OpenWA] Session created, uuid:", uuid)

  // 2. Chamar o start usando o UUID retornado
  const startRes = await fetch(`${OPENWA_BASE}/api/sessions/${uuid}/start`, {
    method: "POST",
    headers: openwaHeaders,
  })
  console.log("[OpenWA] POST /start status:", startRes.status)
  if (!startRes.ok) throw new Error(`OpenWA startSession failed: ${startRes.status}`)
  const startData = await startRes.json()
  console.log("[OpenWA] Start response:", JSON.stringify({ status: startData.status, hasQr: !!startData.qrCode, phone: startData.phone, name: startData.pushName }))

  // 3. Obter QR code inicial se disponível
  let qrCode: string | undefined = startData.qrCode
  if (!qrCode && startData.status === "qr_ready") {
    try {
      console.log("[OpenWA] Fetching QR from /qr endpoint")
      const qrRes = await fetch(`${OPENWA_BASE}/api/sessions/${uuid}/qr`, { headers: openwaHeaders })
      if (qrRes.ok) {
        const qrData = await qrRes.json()
        qrCode = qrData.qrCode
        console.log("[OpenWA] QR fetched from /qr:", !!qrCode)
      }
    } catch (_) {}
  }

  return {
    sessionId: uuid, // Salvaremos o UUID no banco como externalId para todas as chamadas futuras
    status: startData.status,
    qrCode,
    phoneNumber: startData.phone,
    name: startData.pushName
  }
}

/**
 * Retorna o status atual e QR code de uma sessão existente (usando o UUID).
 */
export async function getWppSession(uuid: string): Promise<OpenWASession> {
  console.log("[OpenWA] getWppSession called with uuid:", uuid)
  const url = `${OPENWA_BASE}/api/sessions/${uuid}`
  console.log("[OpenWA] GET", url)
  const res = await fetch(url, { headers: openwaHeaders })
  console.log("[OpenWA] GET response status:", res.status)
  if (!res.ok) {
    const errBody = await res.text().catch(() => "unable to read body")
    console.error("[OpenWA] GET failed:", res.status, errBody)
    throw new Error(`OpenWA getSession failed: ${res.status}`)
  }
  const data = await res.json()
  console.log("[OpenWA] GET session data:", JSON.stringify({ id: data.id, status: data.status, hasQr: !!data.qrCode, phone: data.phone, name: data.pushName }))

  let qrCode = data.qrCode
  if (!qrCode && data.status === "qr_ready") {
    try {
      console.log("[OpenWA] qr_ready but no qrCode, fetching from /qr endpoint")
      const qrRes = await fetch(`${OPENWA_BASE}/api/sessions/${uuid}/qr`, { headers: openwaHeaders })
      if (qrRes.ok) {
        const qrData = await qrRes.json()
        qrCode = qrData.qrCode
        console.log("[OpenWA] /qr endpoint returned qrCode:", !!qrCode)
      }
    } catch (_) {}
  }

  return {
    sessionId: data.id,
    status: data.status,
    qrCode,
    phoneNumber: data.phone,
    name: data.pushName
  }
}

/**
 * Encerra e remove uma sessão do OpenWA.
 */
export async function deleteWppSession(sessionId: string): Promise<void> {
  await fetch(`${OPENWA_BASE}/api/sessions/${sessionId}`, {
    method: "DELETE",
    headers: openwaHeaders,
  })
}

/**
 * Envia uma mensagem de texto via WhatsApp.
 * @param sessionId - UUID da sessão OpenWA
 * @param to - número com DDI, ex: "5511999999999" (sem + ou espaços)
 */
export async function sendWppTextMessage(
  sessionId: string,
  to: string,
  text: string
): Promise<OpenWAMessage> {
  // Se `to` já tem @ (ex: phone@c.us, lid@lid), usar direto. Senão, adicionar @c.us
  const chatId = to.includes("@") ? to : `${to}@c.us`
  console.log("[OpenWA] sendText chamado:", { sessionId, chatId, textLen: text.length })
  const res = await fetch(`${OPENWA_BASE}/api/sessions/${sessionId}/messages/send-text`, {
    method: "POST",
    headers: openwaHeaders,
    body: JSON.stringify({ chatId, text }),
  })
  const resBody = await res.text().catch(() => "")
  if (!res.ok) {
    console.error("[OpenWA] sendText falhou:", res.status, resBody)
    throw new Error(`OpenWA sendMessage failed: ${res.status}: ${resBody}`)
  }
  console.log("[OpenWA] sendText sucesso:", resBody.substring(0, 200))
  return JSON.parse(resBody)
}

/**
 * Envia uma mensagem multimídia (imagem, áudio, vídeo ou documento) via WhatsApp.
 */
export async function sendWppMediaMessage(
  sessionId: string,
  to: string,
  type: "image" | "audio" | "video" | "document",
  payload: { base64?: string; url?: string; mimetype?: string; filename?: string; caption?: string }
): Promise<OpenWAMessage> {
  const chatId = to.includes("@") ? to : `${to}@c.us`
  const endpoint = type === "image" ? "send-image" : type === "audio" ? "send-audio" : type === "video" ? "send-video" : "send-document"
  console.log(`[OpenWA] ${endpoint} chamado:`, { sessionId, chatId, mimetype: payload.mimetype })
  const res = await fetch(`${OPENWA_BASE}/api/sessions/${sessionId}/messages/${endpoint}`, {
    method: "POST",
    headers: openwaHeaders,
    body: JSON.stringify({ chatId, ...payload }),
  })
  const resBody = await res.text().catch(() => "")
  if (!res.ok) {
    console.error(`[OpenWA] ${endpoint} falhou:`, res.status, resBody)
    throw new Error(`OpenWA ${endpoint} failed: ${res.status}: ${resBody}`)
  }
  return JSON.parse(resBody)
}

/**
 * Registra o webhook do Agencie.app no OpenWA para receber mensagens em tempo real.
 */
export async function registerWppWebhook(
  sessionId: string,
  webhookUrl: string,
  secret: string
): Promise<void> {
  await fetch(`${OPENWA_BASE}/api/webhooks`, {
    method: "POST",
    headers: openwaHeaders,
    body: JSON.stringify({
      sessionId,
      url: webhookUrl,
      events: ["message.received", "message.status", "session.status"],
      secret,
    }),
  })
}

/**
 * Remove o webhook de uma sessão.
 */
export async function removeWppWebhook(sessionId: string): Promise<void> {
  await fetch(`${OPENWA_BASE}/api/webhooks/${sessionId}`, {
    method: "DELETE",
    headers: openwaHeaders,
  })
}

/**
 * Verifica a assinatura HMAC de um evento de webhook do OpenWA.
 */
export function verifyOpenWASignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false
  const crypto = require("crypto") as typeof import("crypto")
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")
  return `sha256=${expected}` === signatureHeader
}

/**
 * Busca mensagens recentes de uma sessão no OpenWA (polling fallback).
 */
export async function getWppMessages(
  sessionId: string,
  options: { chatId?: string; limit?: number; offset?: number } = {}
): Promise<{ messages: OpenWAIncomingMessage[]; total: number }> {
  const params = new URLSearchParams()
  if (options.chatId) params.set("chatId", options.chatId)
  if (options.limit) params.set("limit", String(options.limit))
  if (options.offset) params.set("offset", String(options.offset))

  const qs = params.toString()
  const url = `${OPENWA_BASE}/api/sessions/${sessionId}/messages${qs ? `?${qs}` : ""}`

  const res = await fetch(url, { headers: openwaHeaders })
  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    console.error("[OpenWA] getMessages failed:", res.status, errBody)
    throw new Error(`OpenWA getMessages failed: ${res.status}`)
  }
  return res.json()
}

/**
 * Resolve um JID (ex: @lid) para número de telefone.
 * Retorna o phone se resolver, ou null se não conseguir.
 */
export async function resolveContactPhone(
  sessionId: string,
  contactId: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${OPENWA_BASE}/api/sessions/${sessionId}/contacts/${encodeURIComponent(contactId)}/phone`,
      { headers: openwaHeaders }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.phone || null
  } catch {
    return null
  }
}

/**
 * Busca a URL da foto de perfil de um contato no OpenWA.
 */
export async function getContactProfilePicture(
  sessionId: string,
  contactId: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${OPENWA_BASE}/api/sessions/${sessionId}/contacts/${encodeURIComponent(contactId)}/profile-picture`,
      { headers: openwaHeaders }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.url || null
  } catch {
    return null
  }
}

