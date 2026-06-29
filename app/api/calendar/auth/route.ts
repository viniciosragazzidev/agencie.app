import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAuthUrl } from "@/lib/integrations/google-calendar"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const returnUrl = searchParams.get("returnUrl") || "/clients"

  // State contém userId + returnUrl codificados em JSON para o callback poder redirecionar de volta
  const state = JSON.stringify({
    userId: session.user.id,
    returnUrl,
  })

  const authUrl = getAuthUrl(state)
  return NextResponse.json({ url: authUrl })
}
