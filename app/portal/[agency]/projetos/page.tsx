import { redirect } from "next/navigation"
import { getPortalClient } from "@/lib/portal-auth"
import PortalContent from "./portal-content"

export default async function PortalProjetosPage() {
  const portal = await getPortalClient()

  if (!portal) {
    redirect("/portal/agency/login")
  }

  return <PortalContent clientId={portal.clientId} agencyId={portal.agencyId} />
}
