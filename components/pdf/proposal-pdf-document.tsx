import React from "react"
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"

// Helvetica is a standard PDF font available without registration

const styles = StyleSheet.create({
  page: {
    padding: 45,
    paddingTop: 35,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#111827",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  headerDate: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "right",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    color: "#374151",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  text: {
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.5,
  },
  textBold: {
    fontWeight: "bold",
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  serviceItemEven: {
    backgroundColor: "#f9fafb",
  },
  serviceName: {
    fontSize: 10,
    fontWeight: "bold",
    flex: 2,
  },
  serviceBilling: {
    fontSize: 9,
    color: "#6b7280",
    flex: 1,
    textAlign: "center",
  },
  servicePrice: {
    fontSize: 10,
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#111827",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  notesSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  notesText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 45,
    right: 45,
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
    right: 45,
    fontSize: 8,
    color: "#9ca3af",
  },
  portalLink: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
  },
})

interface ServiceItem {
  name: string
  price: string
  billing: string
  description?: string | null
}

interface ProposalPdfDocumentProps {
  proposalTitle: string
  agencyName: string
  clientName: string
  services: ServiceItem[]
  totalValue: string
  notes?: string | null
  portalLink?: string
  createdAt: string
  agencyCnpj?: string | null
  agencyAddress?: string | null
  primaryColor?: string | null
}

function formatBilling(billing: string): string {
  const map: Record<string, string> = {
    mensal: "mensal",
    anual: "anual",
    unico: "pagamento único",
  }
  return map[billing] || billing
}

export default function ProposalPdfDocument({
  proposalTitle,
  agencyName,
  clientName,
  services,
  totalValue,
  notes,
  portalLink,
  createdAt,
  agencyCnpj,
  agencyAddress,
  primaryColor,
}: ProposalPdfDocumentProps) {
  const createdDate = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <Document title={proposalTitle} author={agencyName} subject="Proposta Comercial" language="pt-BR">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Proposta Comercial</Text>
            <Text style={styles.headerSub}>{agencyName}</Text>
            {agencyCnpj && <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 2 }}>CNPJ: {agencyCnpj}</Text>}
          </View>
          <Text style={styles.headerDate}>{createdDate}</Text>
        </View>

        {/* Intro */}
        <View style={styles.section}>
          <Text style={styles.text}>
            <Text style={styles.textBold}>Para: </Text>
            {clientName}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.textBold}>Proposta: </Text>
            {proposalTitle}
          </Text>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços Inclusos</Text>
          <View style={{ marginTop: 4 }}>
            <View style={[styles.serviceItem, { backgroundColor: "#f3f4f6", borderBottomWidth: 2, borderBottomColor: "#d1d5db" }]}>
              <Text style={[styles.serviceName, { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }]}>Serviço</Text>
              <Text style={[styles.serviceBilling, { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }]}>Cobrança</Text>
              <Text style={[styles.servicePrice, { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }]}>Valor</Text>
            </View>
            {services.map((s, i) => (
              <View key={i} style={[styles.serviceItem, i % 2 === 1 ? styles.serviceItemEven : {}]}>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.serviceBilling}>{formatBilling(s.billing)}</Text>
                <Text style={styles.servicePrice}>
                  {parseFloat(s.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Valor Total</Text>
            <Text style={styles.totalValue}>{totalValue}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Observações</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Portal Link */}
        {portalLink && (
          <View style={styles.portalLink}>
            <Text>Acompanhe o andamento da sua proposta em tempo real pelo Portal do Cliente.</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Documento gerado eletronicamente pela plataforma Agencie.App | {agencyName}
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
