import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [userData] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  return NextResponse.json({
    onboardingCompleted: userData?.onboardingCompleted ?? false,
    onboardingStep: userData?.onboardingStep ?? 0,
    setupProgress: userData?.setupProgress ?? {
      agencyConfigured: false,
      firstClientCreated: false,
      firstServiceCreated: false,
      integrationConnected: false,
      contractGenerated: false
    },
    tutorialCompleted: userData?.tutorialCompleted ?? false,
    loginCount: userData?.loginCount ?? 0
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  
  await db
    .update(user)
    .set({
      ...(body.onboardingCompleted !== undefined && { onboardingCompleted: body.onboardingCompleted }),
      ...(body.onboardingStep !== undefined && { onboardingStep: body.onboardingStep }),
      ...(body.setupProgress !== undefined && { setupProgress: body.setupProgress }),
      ...(body.tutorialCompleted !== undefined && { tutorialCompleted: body.tutorialCompleted }),
      ...(body.lastLoginAt !== undefined && { lastLoginAt: body.lastLoginAt }),
      ...(body.loginCount !== undefined && { loginCount: body.loginCount })
    })
    .where(eq(user.id, session.user.id))

  return NextResponse.json({ ok: true })
}
