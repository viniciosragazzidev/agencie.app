import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { client } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function GET(
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

    const record = await db.query.client.findFirst({
      where: and(eq(client.id, id), eq(client.userId, userId)),
    });

    if (!record) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch client" }, { status: 500 });
  }
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

    const updated = await db
      .update(client)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(client.id, id), eq(client.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update client" }, { status: 500 });
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
      .delete(client)
      .where(and(eq(client.id, id), eq(client.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Client deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete client" }, { status: 500 });
  }
}
