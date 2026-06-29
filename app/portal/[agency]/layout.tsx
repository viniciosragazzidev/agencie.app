import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../../globals.css"
import { db } from "@/lib/db"
import { user, agencySettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Área do Cliente — Agencie.App",
  description: "Portal do cliente para acompanhar projetos, aprovações e entregas.",
}

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ agency: string }>
}) {
  const { agency } = await params

  let agencyName = "Área do Cliente"
  let agencyLogo = null
  let primaryColor = "#111827"

  try {
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.username, agency))
      .limit(1)

    if (userRecord) {
      agencyName = userRecord.name || "Área do Cliente"
      
      const [settings] = await db
        .select()
        .from(agencySettings)
        .where(eq(agencySettings.userId, userRecord.id))
        .limit(1)

      if (settings) {
        agencyName = settings.agencyName || userRecord.name || "Área do Cliente"
        agencyLogo = settings.agencyLogo
        primaryColor = settings.primaryColor || "#111827"
      }
    }
  } catch {
    // Fallback to defaults
  }

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased bg-background`}>
        <div className="min-h-screen bg-background flex flex-col">
          <header className="border-b border-border/40 bg-card/50 backdrop-blur-md px-6 py-3 sticky top-0 z-50 print:hidden">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {agencyLogo ? (
                  <img
                    src={agencyLogo}
                    alt={agencyName}
                    className="size-8 rounded-lg object-contain"
                  />
                ) : (
                  <div
                    className="size-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: primaryColor }}>
                      {agencyName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs font-semibold text-foreground">{agencyName}</span>
              </div>
              <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                Agencie.App
              </span>
            </div>
          </header>
          <main className="flex-1 max-w-5xl w-full mx-auto p-6 print:p-0 print:max-w-none">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
