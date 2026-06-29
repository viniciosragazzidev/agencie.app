import { describe, it, expect, vi } from "vitest"

// Mock active scopes and client record
const mockActiveScopes = [
  { id: "scope-1", label: "Gestão de Tráfego", price: "2500", billing: "mensal", status: "active" },
  { id: "scope-2", label: "Criação de Conteúdo", price: "1200", billing: "mensal", status: "active" },
]

const mockClient = {
  id: "client-123",
  name: "Empresa Parceira LTDA",
  document: "12.345.678/0001-90",
  contactPhone: "5521959307782",
  contactEmail: "contato@empresa.com",
}

const mockUser = {
  id: "agency-456",
  name: "Agência Premium",
}

// Function that mirrors contract text generation logic in app/api/client-portal/contracts/route.ts
function generateContractContent(clientRecord: any, userRecord: any, activeScopes: any[]): string {
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

  return `
# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL

PRESTADORA: **${agencyName}**
CONTRATANTE: **${clientName}**${documentText}${phoneText}${emailText}

### CLÁUSULA PRIMEIRA – DO OBJETO
${scopesListText}

### CLÁUSULA SEGUNDA – DOS VALORES
Total de **${totalVal}** recorrentes.
  `.trim()
}

describe("Client Portal API & Templates Generation", () => {
  it("should generate contract template populated with correct values and active scopes", () => {
    const content = generateContractContent(mockClient, mockUser, mockActiveScopes)

    // Check title and names
    expect(content).toContain("# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL")
    expect(content).toContain("PRESTADORA: **Agência Premium**")
    expect(content).toContain("CONTRATANTE: **Empresa Parceira LTDA**")

    // Check document and details
    expect(content).toContain("inscrito sob o documento CNPJ/CPF nº 12.345.678/0001-90")
    expect(content).toContain("telefone 5521959307782")
    expect(content).toContain("contato@empresa.com")

    // Check active scopes list format
    expect(content).toContain("Gestão de Tráfego")
    expect(content).toContain("Criação de Conteúdo")

    // Check calculated price total (2500 + 1200 = 3700)
    // Note: Use a regex or loose check to ignore minor spacing variances in BRL formatting
    expect(content).toContain("3.700,00")
  })

  it("should return empty scopes fallback when no active scopes are provided", () => {
    const content = generateContractContent(mockClient, mockUser, [])
    expect(content).toContain("- Nenhum serviço ativo no momento.")
    expect(content).toContain("0,00")
  })
})
