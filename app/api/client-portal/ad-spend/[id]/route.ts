import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { adSpendTracker } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const [updated] = await db.update(adSpendTracker).set(body).where(eq(adSpendTracker.id, id)).returning()
  return NextResponse.json(updated)
}
