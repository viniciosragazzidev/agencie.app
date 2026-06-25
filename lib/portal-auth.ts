import { cookies, headers } from "next/headers"
import { db } from "./db"
import { client, user } from "./db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "./auth"

const COOKIE_NAME = "portal_token"
const SECRET = process.env.PORTAL_JWT_SECRET || process.env.BETTER_AUTH_SECRET || "portal-fallback-secret"
const TTL_DAYS = 7

// ── Base64URL helpers ──────────────────────────────────────────
function base64url(data: Uint8Array | string): string {
  const str = typeof data === "string" ? data : String.fromCharCode(...data)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// ── HMAC-SHA256 signing ───────────────────────────────────────
async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data))
  return base64url(new Uint8Array(sig))
}

// ── JWT sign / verify ─────────────────────────────────────────
export interface PortalPayload {
  clientId: string
  agencyId: string
  exp: number
}

export async function signPortalToken(clientId: string, agencyId: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const exp = Math.floor(Date.now() / 1000) + TTL_DAYS * 86400
  const payload = base64url(JSON.stringify({ clientId, agencyId, exp }))
  const signature = await hmacSign(`${header}.${payload}`, SECRET)
  return `${header}.${payload}.${signature}`
}

export async function verifyPortalToken(token: string): Promise<PortalPayload | null> {
  try {
    const [header, payload, sig] = token.split(".")
    if (!header || !payload || !sig) return null

    const expectedSig = await hmacSign(`${header}.${payload}`, SECRET)
    if (sig !== expectedSig) return null

    const data: PortalPayload = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    if (data.exp * 1000 < Date.now()) return null

    return data
  } catch {
    return null
  }
}

// ── Cookie helpers ────────────────────────────────────────────
export async function setPortalCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_DAYS * 86400,
  })
}

export async function clearPortalCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// ── Resolve portal client from request ────────────────────────
export async function getPortalClient(): Promise<{ clientId: string; agencyId: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const payload = await verifyPortalToken(token)
  if (!payload) return null

  // Verify client still exists, belongs to the agency, and portal is enabled
  const [row] = await db
    .select({ id: client.id, userId: client.userId, portalEnabled: client.portalEnabled })
    .from(client)
    .innerJoin(user, eq(client.userId, user.id))
    .where(and(eq(client.id, payload.clientId), eq(client.userId, payload.agencyId)))
    .limit(1)

  if (!row || !row.portalEnabled) return null

  return { clientId: row.id, agencyId: row.userId }
}

// ── Authorization helper for /api/client-portal/* routes ───────
// Returns the authorized clientId if valid, or null if unauthorized.
// Accepts either: (a) agency session + client belongs to agency, or
//                  (b) portal token + token.clientId === clientId
export async function authorizePortalClient(clientId: string): Promise<string | null> {
  if (!clientId) return null

  // (a) Check agency session
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (session?.user) {
      const [row] = await db
        .select({ id: client.id })
        .from(client)
        .where(and(eq(client.id, clientId), eq(client.userId, session.user.id)))
        .limit(1)
      if (row) return row.id
    }
  } catch {
    // No session — fall through to portal token
  }

  // (b) Check portal token
  const portal = await getPortalClient()
  if (portal && portal.clientId === clientId) return clientId

  return null
}
