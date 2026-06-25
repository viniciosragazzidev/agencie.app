import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { service } from "@/lib/db/schema";
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
    const servicesList = await db.query.service.findMany({
      where: eq(service.userId, userId),
      orderBy: (service, { desc }) => [desc(service.createdAt)],
    });

    return NextResponse.json(servicesList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, price, billing } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome do serviço é obrigatório" }, { status: 400 });
    }
    if (!price) {
      return NextResponse.json({ error: "Preço do serviço é obrigatório" }, { status: 400 });
    }

    const newServiceId = crypto.randomUUID();

    const newService = await db.insert(service).values({
      id: newServiceId,
      userId: session.user.id,
      name,
      description,
      price,
      billing: billing || "mensal",
    }).returning();

    return NextResponse.json(newService[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create service" }, { status: 500 });
  }
}
