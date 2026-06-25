"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Building01Icon, GoogleIcon } from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function RegisterPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useGSAP(() => {
    gsap.from(".auth-card", {
      y: 20,
      scale: 0.98,
      opacity: 0,
      duration: 1.2,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      clearProps: "all"
    })
    
    gsap.from(".auth-elem", {
      opacity: 0,
      y: 10,
      duration: 1,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      stagger: 0.08,
      delay: 0.15
    })
  }, { scope: containerRef })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { data, error } = await authClient.signUp.email({
      name: name,
      email: email,
      password: password,
      username: username,
      fetchOptions: {
        onSuccess: () => {
          router.push("/dashboard")
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Erro ao criar conta")
        }
      }
    })

    setIsLoading(false)
  }

  const handleGoogleRegister = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard"
    })
  }

  return (
    <div ref={containerRef} className="flex min-h-screen items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-md auth-card">
        <div className="double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[2rem]">
          <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(2rem-0.375rem)] flex flex-col p-8 md:p-10">
            
            <div className="flex justify-center mb-8 auth-elem">
              <div className="flex aspect-square size-14 items-center justify-center rounded-2xl bg-muted/30 border border-border/50 shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105">
                <HugeiconsIcon icon={Building01Icon} strokeWidth={1.5} className="size-7 text-primary" />
              </div>
            </div>

            <div className="text-center mb-8 auth-elem">
              <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground mb-1.5">Criar conta</h1>
              <p className="text-xs text-muted-foreground font-medium">Comece a gerenciar sua agência</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleRegister}>
              <div className="auth-elem">
                <label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-1.5 block">Nome da Agência</label>
                <Input 
                  type="text" 
                  placeholder="Kyper Digital" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 bg-muted/10 border-border/50 focus-visible:ring-primary/20 rounded-xl transition-all duration-300"
                  required
                />
              </div>

              <div className="auth-elem">
                <label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-1.5 block">Username</label>
                <Input 
                  type="text" 
                  placeholder="kyperdigital" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 bg-muted/10 border-border/50 focus-visible:ring-primary/20 rounded-xl transition-all duration-300"
                  required
                />
              </div>

              <div className="auth-elem">
                <label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-1.5 block">Email de trabalho</label>
                <Input 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-muted/10 border-border/50 focus-visible:ring-primary/20 rounded-xl transition-all duration-300"
                  required
                />
              </div>

              <div className="auth-elem">
                <label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-1.5 block">Senha</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-muted/10 border-border/50 focus-visible:ring-primary/20 rounded-xl transition-all duration-300"
                  required
                />
              </div>

              <div className="mt-2 auth-elem">
                <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                  {isLoading ? "Criando..." : "Criar conta grátis"}
                </Button>
              </div>
            </form>

            <div className="my-6 flex items-center gap-4 auth-elem">
              <div className="h-px flex-1 bg-border/50"></div>
              <span className="text-[9px] font-bold text-muted-foreground/75 uppercase tracking-widest">Ou</span>
              <div className="h-px flex-1 bg-border/50"></div>
            </div>

            <div className="auth-elem">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleGoogleRegister}
                className="w-full h-12 rounded-xl bg-card border-border/50 hover:bg-muted/50 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <HugeiconsIcon icon={GoogleIcon} className="size-5" />
                Continuar com o Google
              </Button>
            </div>

            <div className="mt-8 text-center auth-elem">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
                  Entrar agora
                </Link>
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
