import { NextResponse } from "next/server"
import { exchangeAndSaveTokens } from "@/lib/integrations/google-calendar"

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    // Tentar parsear state para obter returnUrl
    let returnUrl = "/clients"
    try {
      if (state) {
        const parsed = JSON.parse(state)
        returnUrl = parsed.returnUrl || "/clients"
      }
    } catch {}
    return NextResponse.redirect(
      `${origin}${returnUrl}?calendar=error&message=${encodeURIComponent(error)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/clients?calendar=error&message=missing_params`)
  }

  // Parsear o state para obter userId e returnUrl
  let userId: string
  let returnUrl = "/clients"
  try {
    const parsed = JSON.parse(state)
    userId = parsed.userId
    returnUrl = parsed.returnUrl || "/clients"
  } catch {
    // Fallback: state é o userId diretamente (compatibilidade retroativa)
    userId = state
  }

  try {
    await exchangeAndSaveTokens(code, userId)
    return NextResponse.redirect(`${origin}${returnUrl}?calendar=connected`)
  } catch (err: any) {
    console.error("[Calendar Callback] Error exchanging code:", err)
    return NextResponse.redirect(
      `${origin}${returnUrl}?calendar=error&message=${encodeURIComponent(err.message || "unknown_error")}`
    )
  }
}
