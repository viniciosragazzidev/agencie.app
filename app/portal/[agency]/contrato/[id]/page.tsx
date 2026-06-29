import { redirect, notFound } from "next/navigation"
import { getPortalClient } from "@/lib/portal-auth"
import { db } from "@/lib/db"
import { clientContract } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import ContractView from "./contract-view"

type Params = Promise<{ agency: string; id: string }>

export default async function PortalContractPage({ params }: { params: Params }) {
  const { agency, id } = await params
  const portal = await getPortalClient()

  if (!portal || portal.agencyId !== agency) {
    redirect(`/portal/${agency}`)
  }

  // Fetch contract from DB matching current client
  const [contract] = await db
    .select()
    .from(clientContract)
    .where(
      and(
        eq(clientContract.id, id),
        eq(clientContract.clientId, portal.clientId)
      )
    )
    .limit(1)

  if (!contract) {
    notFound()
  }

  return (
    <ContractView
      agencySlug={agency}
      contract={{
        ...contract,
        signedAt: contract.signedAt ? new Date(contract.signedAt) : null,
        createdAt: new Date(contract.createdAt),
      }}
    />
  )
}
