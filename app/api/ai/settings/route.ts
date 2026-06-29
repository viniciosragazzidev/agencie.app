import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAiSettings, upsertAiSettings } from "@/lib/ai/settings";

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getAiSettings(session.user.id);
    return NextResponse.json(settings);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao buscar configuracoes de IA";
    console.error("[AI Settings GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Whitelist allowed fields to prevent mass-assignment
    const allowedFields = {
      botName: body.botName,
      systemPrompt: body.systemPrompt,
      persona: body.persona,
      guidelines: body.guidelines,
      autoPilot: body.autoPilot,
      humanHandoff: body.humanHandoff,
    };

    // Remove undefined values so we don't overwrite with null
    const data = Object.fromEntries(
      Object.entries(allowedFields).filter(([, v]) => v !== undefined)
    );

    const updated = await upsertAiSettings(session.user.id, data);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao salvar configuracoes de IA";
    console.error("[AI Settings PUT]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
