import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lead } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    const leadsList = await db.query.lead.findMany({
      where: eq(lead.userId, userId),
      orderBy: (lead, { desc }) => [desc(lead.createdAt)],
    });

    return NextResponse.json(leadsList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, status, value } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome do lead é obrigatório" }, { status: 400 });
    }

    const newLeadId = crypto.randomUUID();

    const newLead = await db.insert(lead).values({
      id: newLeadId,
      userId: session.user.id,
      name,
      status: status || "lead",
      value: typeof value === "number" ? value : parseInt(value, 10) || 0,
    }).returning();

    return NextResponse.json(newLead[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create lead" }, { status: 500 });
  }
}
