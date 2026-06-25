import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lead } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const body = await req.json();
    const { name, status, value } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (value !== undefined) {
      updateData.value = typeof value === "number" ? value : parseInt(value, 10) || 0;
    }
    updateData.updatedAt = new Date();

    const updated = await db
      .update(lead)
      .set(updateData)
      .where(and(eq(lead.id, id), eq(lead.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Lead not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const deleted = await db
      .delete(lead)
      .where(and(eq(lead.id, id), eq(lead.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Lead not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete lead" }, { status: 500 });
  }
}
