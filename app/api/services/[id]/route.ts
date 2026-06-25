import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { service } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
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

    const currentService = await db.query.service.findFirst({
      where: and(eq(service.id, id), eq(service.userId, userId)),
    });

    if (!currentService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(currentService);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch service" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { name, description, price, billing } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome do serviço é obrigatório" }, { status: 400 });
    }
    if (!price) {
      return NextResponse.json({ error: "Preço do serviço é obrigatório" }, { status: 400 });
    }

    const updatedService = await db
      .update(service)
      .set({
        name,
        description,
        price,
        billing: billing || "mensal",
        updatedAt: new Date(),
      })
      .where(and(eq(service.id, id), eq(service.userId, userId)))
      .returning();

    if (updatedService.length === 0) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updatedService[0]);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update service" },
      { status: 500 }
    );
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
      .delete(service)
      .where(and(eq(service.id, id), eq(service.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Serviço excluído" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete service" },
      { status: 500 }
    );
  }
}
