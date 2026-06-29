import { renderToBuffer } from "@react-pdf/renderer"
import ContractPdfDocument from "@/components/pdf/contract-pdf-document"
import ProposalPdfDocument from "@/components/pdf/proposal-pdf-document"

interface ContractPdfData {
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

interface ServiceItem {
  name: string
  price: string
  billing: string
  description?: string | null
}

interface ProposalPdfData {
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

/** Generate a contract PDF and return a Uint8Array (compatible with Response) */
export async function generateContractPdf(data: ContractPdfData): Promise<Uint8Array> {
  const buffer = await renderToBuffer(
    <ContractPdfDocument
      title={data.title}
      content={data.content}
      status={data.status}
      signerName={data.signerName}
      signerDocument={data.signerDocument}
      signerIp={data.signerIp}
      signedAt={data.signedAt}
      agencyName={data.agencyName}
      agencyCnpj={data.agencyCnpj}
      agencyAddress={data.agencyAddress}
      agencyPhone={data.agencyPhone}
      agencyEmail={data.agencyEmail}
      primaryColor={data.primaryColor}
      contractFooter={data.contractFooter}
    />
  )
  return new Uint8Array(buffer)
}

/** Generate a proposal PDF and return a Uint8Array (compatible with Response) */
export async function generateProposalPdf(data: ProposalPdfData): Promise<Uint8Array> {
  const buffer = await renderToBuffer(
    <ProposalPdfDocument
      proposalTitle={data.proposalTitle}
      agencyName={data.agencyName}
      clientName={data.clientName}
      services={data.services}
      totalValue={data.totalValue}
      notes={data.notes}
      portalLink={data.portalLink}
      createdAt={data.createdAt}
      agencyCnpj={data.agencyCnpj}
      agencyAddress={data.agencyAddress}
      primaryColor={data.primaryColor}
    />
  )
  return new Uint8Array(buffer)
}
