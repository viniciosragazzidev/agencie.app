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
