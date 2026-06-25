import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { client } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper to authenticate user from headers
async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const clientsList = await db.query.client.findMany({
      where: eq(client.userId, userId),
      orderBy: (client, { desc }) => [desc(client.createdAt)],
    });

    return NextResponse.json(clientsList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      industry,
      status,
      projects,
      mrr,
      contactName,
      contactEmail,
      contactPhone,
      document,
      street,
      city,
      state,
      zip,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome da empresa é obrigatório" }, { status: 400 });
    }

    const newClientId = crypto.randomUUID();

    const newClient = await db.insert(client).values({
      id: newClientId,
      userId: session.user.id,
      name,
      industry,
      status: status || "Ativo",
      projects: projects || "1",
      mrr: mrr || "0",
      contactName,
      contactEmail,
      contactPhone,
      document,
      street,
      city,
      state,
      zip,
      notes,
    }).returning();

    return NextResponse.json(newClient[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create client" }, { status: 500 });
  }
}
