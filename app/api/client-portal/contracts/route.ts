import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientContract, client, clientScope, user } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { authorizePortalClient } from "@/lib/portal-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const authorized = await authorizePortalClient(clientId)
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const contracts = await db
    .select()
    .from(clientContract)
    .where(eq(clientContract.clientId, clientId))
  return NextResponse.json(contracts)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      clientId, userId, title, customContent,
      contractType, validityDays, projectId,
      totalValue, paymentConditions, lateFee, expiresAt,
    } = body

    if (!clientId || !userId) {
      return NextResponse.json({ error: "clientId and userId are required" }, { status: 400 })
    }

    const authorized = await authorizePortalClient(clientId)
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 1. Fetch Client info
    const [clientRecord] = await db.select().from(client).where(eq(client.id, clientId)).limit(1)
    if (!clientRecord) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // 2. Fetch User (Agency) info
    const [userRecord] = await db.select().from(user).where(eq(user.id, userId)).limit(1)

    // 3. Fetch Active Scopes
    const activeScopes = await db
      .select()
      .from(clientScope)
      .where(and(eq(clientScope.clientId, clientId), eq(clientScope.status, "active")))

    // 4. Generate content if customContent is not provided
    let content = customContent
    if (!content) {
      const agencyName = userRecord?.name || "Agência"
      const clientName = clientRecord.name
      const documentText = clientRecord.document ? ` inscrito sob o documento CNPJ/CPF nº ${clientRecord.document}` : ""
      const phoneText = clientRecord.contactPhone ? `, telefone ${clientRecord.contactPhone}` : ""
      const emailText = clientRecord.contactEmail ? `, e-mail ${clientRecord.contactEmail}` : ""

      const scopesListText = activeScopes.length > 0
        ? activeScopes.map(s => {
            const priceVal = parseFloat(s.price || "0").toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            const periodMap: Record<string, string> = { mensal: "mensal", anual: "anual", unico: "pagamento único" }
            const billingPeriod = periodMap[s.billing] || s.billing || "mensal"
            return `- **${s.label}**: ${priceVal} (${billingPeriod})`
          }).join("\n")
        : "- Nenhum serviço ativo no momento."

      const totalVal = activeScopes.reduce((acc, s) => acc + parseFloat(s.price || "0"), 0)
        .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

      content = `
# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL

Pelo presente instrumento particular, de um lado:

**PRESTADORA**: **${agencyName}**, doravante denominada simplesmente PRESTADORA.

E de outro lado:

**CONTRATANTE**: **${clientName}**${documentText}${phoneText}${emailText}, doravante denominada simplesmente CONTRATANTE.

As partes têm entre si justo e acordado o presente Contrato de Prestação de Serviços, mediante as seguintes cláusulas e condições:

---

### CLÁUSULA PRIMEIRA – DO OBJETO
O objeto do presente contrato é a prestação de serviços de marketing e publicidade digital, conforme o escopo e termos ativos especificados a seguir:

${scopesListText}

---

### CLÁUSULA SEGUNDA – DOS VALORES E FORMA DE PAGAMENTO
Pelo objeto contratado na Cláusula Primeira, a CONTRATANTE pagará à PRESTADORA a importância total de **${totalVal}** recorrentes ou conforme periodicidade de cada serviço.
Os pagamentos serão faturados e cobrados diretamente pela PRESTADORA ao término ou início de cada período de prestação dos serviços.

---

### CLÁUSULA TERCEIRA – DA VIGÊNCIA E RESCISÃO
Este contrato entra em vigor na data de sua assinatura digital e terá duração por prazo indeterminado, podendo ser rescindido por qualquer uma das partes mediante aviso prévio por escrito de 30 (trinta) dias.

---

### CLÁUSULA QUARTA – DO ACEITE DIGITAL
As partes declaram que a concordância eletrônica por meio da plataforma constitui assinatura digital plenamente válida e legalmente vinculante para fins de execução e validade jurídica deste contrato.
      `.trim()
    }

    const contractId = crypto.randomUUID()
    const [contract] = await db.insert(clientContract).values({
      id: contractId,
      clientId,
      userId,
      title: title || `Contrato de Prestação de Serviços - ${clientRecord.name}`,
      content,
      status: "pending",
      contractType: contractType || "prestacao_servicos",
      validityDays: validityDays || 30,
      projectId: projectId || null,
      totalValue: totalValue || null,
      paymentConditions: paymentConditions || null,
      lateFee: lateFee || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning()

    return NextResponse.json(contract)
  } catch (err: any) {
    console.error("[POST contracts] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
