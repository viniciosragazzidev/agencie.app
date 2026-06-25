import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../../globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Área do Cliente — Agencie.App",
  description: "Portal do cliente para acompanhar projetos, aprovações e entregas.",
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased bg-background`}>
        <div className="min-h-screen bg-background flex flex-col">
          <header className="border-b border-border/40 bg-card/50 backdrop-blur-md px-6 py-3 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">AA</span>
                </div>
                <span className="text-xs font-semibold text-foreground">Área do Cliente</span>
              </div>
              <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                Agencie.App
              </span>
            </div>
          </header>
          <main className="flex-1 max-w-5xl w-full mx-auto p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
