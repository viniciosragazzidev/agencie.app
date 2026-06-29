import React from "react"
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"

// Helvetica is a standard PDF font available without registration

const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingTop: 40,
    paddingBottom: 65,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.6,
    color: "#111827",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 10,
    textAlign: "justify",
    lineHeight: 1.6,
  },
  listItem: {
    fontSize: 10,
    marginBottom: 4,
    marginLeft: 16,
    flexDirection: "row",
  },
  bullet: {
    width: 12,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginVertical: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  // Signature section
  signatureSection: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
  },
  signatureTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 12,
  },
  signatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  signatureField: {
    width: "48%",
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  signatureValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  signatureNote: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 50,
    fontSize: 8,
    color: "#9ca3af",
  },
})

interface ContractPdfDocumentProps {
  title: string
  content: string
  status: string
  signerName?: string | null
  signerDocument?: string | null
  signerIp?: string | null
  signedAt?: string | null
  agencyName?: string | null
  agencyCnpj?: string | null
  agencyAddress?: string | null
  agencyPhone?: string | null
  agencyEmail?: string | null
  primaryColor?: string | null
  contractFooter?: string | null
}

// Parse inline bold (**text**) and return elements
function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <Text key={`${keyPrefix}-b-${i}`} style={styles.bold}>{part.slice(2, -2)}</Text>
    }
    return <Text key={`${keyPrefix}-${i}`}>{part}</Text>
  })
}

function parseContent(content: string, signerName?: string | null, signerDocument?: string | null, signerIp?: string | null, signedAt?: string | null) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let keyCounter = 0

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    const key = `el-${keyCounter++}`

    if (!trimmed) {
      elements.push(<View key={key} style={{ height: 8 }} />)
      continue
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <Text key={key} style={styles.title}>
          {trimmed.slice(2)}
        </Text>
      )
      continue
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <Text key={key} style={styles.subtitle}>
          {trimmed.slice(4)}
        </Text>
      )
      continue
    }

    if (trimmed === "---") {
      elements.push(<View key={key} style={styles.hr} />)
      continue
    }

    if (trimmed.startsWith("- ")) {
      const itemText = trimmed.slice(2)
      elements.push(
        <View key={key} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{parseInline(itemText, key)}</Text>
        </View>
      )
      continue
    }

    // Regular paragraph
    elements.push(
      <Text key={key} style={styles.paragraph}>
        {parseInline(trimmed, key)}
      </Text>
    )
  }

  // Add signature section if signed
  if (signerName || signerDocument) {
    elements.push(
      <View key="sig-section" style={styles.signatureSection}>
        <Text style={styles.signatureTitle}>Assinatura Eletrônica</Text>
        <View style={styles.signatureGrid}>
          {signerName && (
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Assinante</Text>
              <Text style={styles.signatureValue}>{signerName}</Text>
            </View>
          )}
          {signerDocument && (
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Documento</Text>
              <Text style={styles.signatureValue}>{signerDocument}</Text>
            </View>
          )}
          {signedAt && (
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Data/Hora</Text>
              <Text style={styles.signatureValue}>{signedAt}</Text>
            </View>
          )}
          {signerIp && (
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Endereço IP</Text>
              <Text style={styles.signatureValue}>{signerIp}</Text>
            </View>
          )}
        </View>
        <Text style={styles.signatureNote}>
          Assinado eletronicamente em conformidade com as regras de aceite digital da plataforma.
        </Text>
      </View>
    )
  }

  return elements
}

export default function ContractPdfDocument({
  title,
  content,
  status,
  signerName,
  signerDocument,
  signerIp,
  signedAt,
  agencyName,
  agencyCnpj,
  agencyAddress,
  agencyPhone,
  agencyEmail,
  primaryColor,
  contractFooter,
}: ContractPdfDocumentProps) {
  const formattedSignedAt = signedAt
    ? new Date(signedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : null

  const authorName = agencyName || "Agencie.App"
  const footerText = contractFooter || "Documento gerado eletronicamente pela plataforma Agencie.App"

  return (
    <Document
      title={title}
      author={authorName}
      subject="Contrato de Prestação de Serviços"
      language="pt-BR"
    >
      <Page size="A4" style={styles.page}>
        {parseContent(content, signerName, signerDocument, signerIp, formattedSignedAt)}

        {(agencyCnpj || agencyAddress || agencyPhone || agencyEmail) && (
          <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
            {agencyCnpj && <Text style={{ fontSize: 8, color: "#6b7280" }}>CNPJ: {agencyCnpj}</Text>}
            {agencyAddress && <Text style={{ fontSize: 8, color: "#6b7280" }}>{agencyAddress}</Text>}
            {agencyPhone && <Text style={{ fontSize: 8, color: "#6b7280" }}>Tel: {agencyPhone}</Text>}
            {agencyEmail && <Text style={{ fontSize: 8, color: "#6b7280" }}>{agencyEmail}</Text>}
          </View>
        )}

        <Text style={styles.footer}>
          {footerText}
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
