import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { client, user } from "@/lib/db/schema"
import { eq, and, ilike } from "drizzle-orm"
import { signPortalToken, setPortalCookie, clearPortalCookie } from "@/lib/portal-auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agency: string }> }
) {
  const { agency } = await params
  const body = await req.json()
  const { document, email } = body

  if (!document || !email) {
    return NextResponse.json({ error: "Documento e e-mail são obrigatórios." }, { status: 400 })
  }

  // 1. Resolve agency by username (case-insensitive)
  const [agencyUser] = await db
    .select()
    .from(user)
    .where(ilike(user.username, agency))
    .limit(1)

  if (!agencyUser) {
    return NextResponse.json({ error: "Agência não encontrada." }, { status: 404 })
  }

  // 2. Find client matching document + email within this agency
  const normalizedDoc = document.replace(/\D/g, "")
  const [foundClient] = await db
    .select()
    .from(client)
    .where(
      and(
        eq(client.userId, agencyUser.id),
        eq(client.document, normalizedDoc),
        ilike(client.contactEmail, email)
      )
    )
    .limit(1)

  if (!foundClient) {
    return NextResponse.json({ error: "Documento ou e-mail não encontrados." }, { status: 401 })
  }

  // 3. Check if portal is enabled for this client
  if (!foundClient.portalEnabled) {
    return NextResponse.json({ error: "Portal não disponível para este cliente." }, { status: 403 })
  }

  // 4. Issue JWT cookie
  const token = await signPortalToken(foundClient.id, agencyUser.id)
  await setPortalCookie(token)

  return NextResponse.json({ clientId: foundClient.id, name: foundClient.name })
}

export async function DELETE() {
  await clearPortalCookie()
  return NextResponse.json({ ok: true })
}
