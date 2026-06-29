import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientAsset, client } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const proposals = await db
    .select({
      id: clientAsset.id,
      name: clientAsset.name,
      notes: clientAsset.notes,
      linkUrl: clientAsset.linkUrl,
      category: clientAsset.category,
      createdAt: clientAsset.createdAt,
    })
    .from(clientAsset)
    .innerJoin(client, eq(clientAsset.clientId, client.id))
    .where(
      and(
        eq(clientAsset.clientId, clientId),
        eq(client.userId, userId),
        eq(clientAsset.category, "contract")
      )
    )
    .orderBy(desc(clientAsset.createdAt))

  return NextResponse.json(proposals)
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, title, services, notes } = body

    if (!clientId || !title) {
      return NextResponse.json({ error: "clientId and title are required" }, { status: 400 })
    }

    const userId = session.user.id

    // Verify client belongs to this user
    const [clientRecord] = await db
      .select()
      .from(client)
      .where(and(eq(client.id, clientId), eq(client.userId, userId)))
      .limit(1)

    if (!clientRecord) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Build notes from services array
    let notesContent = ""
    if (services && Array.isArray(services) && services.length > 0) {
      const serviceLines = services.map((s: { name: string; price: string; billing: string }) =>
        `- ${s.name}: R$ ${s.price} (${s.billing})`
      )
      notesContent = serviceLines.join("\n")
      if (notes) {
        notesContent += `\n\nObservações: ${notes}`
      }
    } else if (notes) {
      notesContent = notes
    }

    const [asset] = await db.insert(clientAsset).values({
      id: crypto.randomUUID(),
      clientId,
      userId,
      name: title,
      category: "contract",
      notes: notesContent || undefined,
    }).returning()

    return NextResponse.json(asset)
  } catch (err: any) {
    console.error("[POST proposals] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
