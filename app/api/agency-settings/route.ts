import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agencySettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [settings] = await db
      .select()
      .from(agencySettings)
      .where(eq(agencySettings.userId, session.user.id))
      .limit(1)

    return NextResponse.json(settings || null)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const userId = session.user.id

    const [existing] = await db
      .select({ id: agencySettings.id })
      .from(agencySettings)
      .where(eq(agencySettings.userId, userId))
      .limit(1)

    if (existing) {
      await db
        .update(agencySettings)
        .set({
          agencyName: body.agencyName,
          agencyLogo: body.agencyLogo,
          agencySlogan: body.agencySlogan,
          primaryColor: body.primaryColor,
          secondaryColor: body.secondaryColor,
          accentColor: body.accentColor,
          cnpj: body.cnpj,
          address: body.address,
          phone: body.phone,
          email: body.email,
          website: body.website,
          defaultContractTemplate: body.defaultContractTemplate,
          contractFooter: body.contractFooter,
          clauseBank: body.clauseBank,
          portalWelcomeMessage: body.portalWelcomeMessage,
          portalPrimaryAction: body.portalPrimaryAction,
          updatedAt: new Date(),
        })
        .where(eq(agencySettings.userId, userId))
    } else {
      await db.insert(agencySettings).values({
        id: crypto.randomUUID(),
        userId,
        agencyName: body.agencyName,
        agencyLogo: body.agencyLogo,
        agencySlogan: body.agencySlogan,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        cnpj: body.cnpj,
        address: body.address,
        phone: body.phone,
        email: body.email,
        website: body.website,
        defaultContractTemplate: body.defaultContractTemplate,
        contractFooter: body.contractFooter,
        clauseBank: body.clauseBank,
        portalWelcomeMessage: body.portalWelcomeMessage,
        portalPrimaryAction: body.portalPrimaryAction,
      })
    }

    const [updated] = await db
      .select()
      .from(agencySettings)
      .where(eq(agencySettings.userId, userId))
      .limit(1)

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 })
  }
}
