import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { client } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

async function getSession() {
  return await auth.api.getSession({ headers: await headers() })
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const userId = session.user.id
    const clientsList = await db.query.client.findMany({
      where: eq(client.userId, userId),
    })

    // Construir cabeçalhos do CSV
    let csvContent = "\uFEFF" // UTF-8 BOM para abrir corretamente no Excel
    csvContent += "ID,Cliente,Segmento,Status,Projetos,MRR,Data de Criacao\n"

    for (const c of clientsList) {
      const name = c.name.replace(/"/g, '""')
      const industry = (c.industry || "").replace(/"/g, '""')
      const status = c.status
      const projects = c.projects
      const mrr = c.mrr
      const date = new Date(c.createdAt).toLocaleDateString("pt-BR")
      
      csvContent += `"${c.id}","${name}","${industry}","${status}","${projects}","R$ ${mrr}","${date}"\n`
    }

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio_clientes_${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
