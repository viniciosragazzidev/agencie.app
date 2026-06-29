import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { db } from "@/lib/db"
import { googleCalendarCredential } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Validação de variáveis de ambiente
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables. " +
    "Configure them in .env.local for development."
  )
}

const REDIRECT_URI = `${APP_URL}/api/calendar/callback`

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
]

/**
 * Cria um cliente OAuth2 configurado.
 */
export function createOAuth2Client(): OAuth2Client {
  return new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
  })
}

/**
 * Gera a URL de autorização para o usuário conectar o Google Calendar.
 */
export function getAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: state,
    prompt: "consent",
  })
}

/**
 * Troca o código de autorização por tokens e salva no banco.
 * Usa upsert (deleta antigo + insere novo em sequência).
 */
export async function exchangeAndSaveTokens(code: string, userId: string) {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token) {
    throw new Error("Falha ao obter access_token do Google")
  }

  // Buscar informações do usuário Google
  oauth2Client.setCredentials(tokens)
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client as any })
  const userInfo = await oauth2.userinfo.get()

  const credentialId = crypto.randomUUID()

  // Remove credencial antiga (se houver) e insere a nova
  await db
    .delete(googleCalendarCredential)
    .where(eq(googleCalendarCredential.userId, userId))

  await db.insert(googleCalendarCredential).values({
    id: credentialId,
    userId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    scope: tokens.scope || SCOPES.join(" "),
    tokenType: tokens.token_type || "Bearer",
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    calendarEmail: userInfo.data.email || null,
    calendarName: userInfo.data.name || null,
  })

  return credentialId
}

/**
 * Recupera as credenciais do Google Calendar para um usuário.
 * Se o token estiver expirado, faz o refresh automaticamente.
 */
export async function getCredentials(userId: string): Promise<{
  oauth2Client: OAuth2Client
  credential: typeof googleCalendarCredential.$inferSelect
} | null> {
  const [credential] = await db
    .select()
    .from(googleCalendarCredential)
    .where(eq(googleCalendarCredential.userId, userId))
    .limit(1)

  if (!credential) return null

  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    access_token: credential.accessToken,
    refresh_token: credential.refreshToken || undefined,
    expiry_date: credential.expiryDate?.getTime(),
    token_type: credential.tokenType,
    scope: credential.scope || undefined,
  })

  // Se o token expirou (com margem de 5 min), faz refresh
  const expiryMargin = 5 * 60 * 1000
  if (credential.expiryDate && new Date() >= new Date(credential.expiryDate.getTime() - expiryMargin)) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      if (credentials.access_token) {
        await db
          .update(googleCalendarCredential)
          .set({
            accessToken: credentials.access_token,
            refreshToken: credentials.refresh_token || credential.refreshToken,
            expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
            updatedAt: new Date(),
          })
          .where(eq(googleCalendarCredential.id, credential.id))
      }
    } catch (err) {
      console.error("[Google Calendar] Token refresh failed:", err)
      return null
    }
  }

  return { oauth2Client, credential }
}

/**
 * Cria um evento no Google Calendar.
 */
export async function createCalendarEvent(params: {
  userId: string
  summary: string
  description?: string
  startTime: Date
  endTime: Date
  attendees?: string[]
  conferenceData?: boolean
}) {
  const result = await getCredentials(params.userId)
  if (!result) return null

  const { oauth2Client } = result
  const calendar = google.calendar({ version: "v3", auth: oauth2Client as any })

  const event: any = {
    summary: params.summary,
    description: params.description || "",
    start: {
      dateTime: params.startTime.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: params.endTime.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
  }

  if (params.attendees && params.attendees.length > 0) {
    event.attendees = params.attendees.map((email) => ({ email }))
  }

  if (params.conferenceData) {
    event.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    }
  }

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: params.conferenceData ? 1 : 0,
  })

  return {
    id: response.data.id,
    htmlLink: response.data.htmlLink,
    hangoutLink: response.data.hangoutLink || null,
    start: response.data.start?.dateTime,
    end: response.data.end?.dateTime,
    summary: response.data.summary,
  }
}

/**
 * Lista os próximos eventos do calendário do usuário.
 */
export async function listCalendarEvents(userId: string, maxResults: number = 20) {
  const result = await getCredentials(userId)
  if (!result) return null

  const { oauth2Client } = result
  const calendar = google.calendar({ version: "v3", auth: oauth2Client as any })

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  })

  return (response.data.items || []).map((event) => ({
    id: event.id,
    summary: event.summary,
    description: event.description,
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    htmlLink: event.htmlLink,
    hangoutLink: event.hangoutLink || null,
    creator: event.creator?.email,
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      responseStatus: a.responseStatus,
    })),
  }))
}

/**
 * Deleta um evento do Google Calendar.
 */
export async function deleteCalendarEvent(userId: string, eventId: string) {
  const result = await getCredentials(userId)
  if (!result) throw new Error("Google Calendar não conectado")

  const { oauth2Client } = result
  const calendar = google.calendar({ version: "v3", auth: oauth2Client as any })

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  })
}
