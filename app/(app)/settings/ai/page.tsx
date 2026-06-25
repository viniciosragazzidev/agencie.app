"use client"

import React, { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HugeiconsIcon } from "@hugeicons/react"
import { CpuIcon, DocumentAttachmentIcon, Link01Icon, Settings02Icon, Search01Icon, Edit02Icon, Building01Icon, Coins01Icon, TimeQuarterPassIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface IndexedUrl {
  id: string
  url: string
  status: "Indexado" | "Indexando" | "Falhou"
  date: string
}

interface IndexedFile {
  id: string
  name: string
  size: string
  status: "Indexado" | "Processando" | "Falhou"
  date: string
}

export default function AiSettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Interactive states
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null)
  
  // Scraper states
  const [crawlUrl, setCrawlUrl] = useState("")
  const [isScraping, setIsScraping] = useState(false)
  const [scrapingStep, setScrapingStep] = useState("")
  const [scrapedUrls, setScrapedUrls] = useState<IndexedUrl[]>([
    { id: "1", url: "https://kyper.ag/sobre-nos", status: "Indexado", date: "24 Jun 2026" },
    { id: "2", url: "https://kyper.ag/servicos", status: "Indexado", date: "24 Jun 2026" },
    { id: "3", url: "https://kyper.ag/portfolio", status: "Indexado", date: "24 Jun 2026" },
  ])

  // File states
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<IndexedFile[]>([
    { id: "1", name: "tabela-mrr-servicos.pdf", size: "1.2 MB", status: "Indexado", date: "23 Jun 2026" },
    { id: "2", name: "manual-tom-de-voz-v4.txt", size: "8.4 KB", status: "Indexado", date: "24 Jun 2026" },
  ])

  // Settings states
  const [botName, setBotName] = useState("Agencie AI")
  const [botPersona, setBotPersona] = useState("Profissional, direto, e sempre disposto a ajudar. Use termos de tecnologia e negócios de forma natural.")
  const [botGuidelines, setBotGuidelines] = useState("- Nunca informe preços fixos, sempre direcione para um consultor.\n- Se não souber a resposta baseada nos documentos, diga que um humano irá assumir o chat.")
  const [selectedModel, setSelectedModel] = useState<"gemini-1.5-pro" | "claude-3.5-sonnet" | "gpt-4o">("gemini-1.5-pro")
  const [temperature, setTemperature] = useState(0.7)
  const [autoPilot, setAutoPilot] = useState(true)
  const [humanAlert, setHumanAlert] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Custom Toast helper
  const triggerToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type })
    // Fade in toast animation
    setTimeout(() => setToast(null), 3500)
  }

  // Entrance animations
  useGSAP(() => {
    gsap.from(".bento-item", {
      y: 20,
      opacity: 0,
      duration: 1.0,
      stagger: 0.08,
      ease: "cubic-bezier(0.32,0.72,0,1)",
      clearProps: "all"
    })
  }, { scope: containerRef })

  // Scraper action handler
  const handleScrape = () => {
    if (!crawlUrl.trim()) {
      triggerToast("Por favor, insira uma URL válida.", "error")
      return
    }

    if (!crawlUrl.startsWith("http://") && !crawlUrl.startsWith("https://")) {
      triggerToast("A URL deve começar com http:// ou https://", "error")
      return
    }

    setIsScraping(true)
    const steps = [
      "Estabelecendo conexão...",
      "Lendo robots.txt & Sitemap...",
      "Indexando parágrafos...",
      "Processando embeddings RAG...",
      "Finalizado!"
    ]

    let currentStep = 0
    setScrapingStep(steps[currentStep])

    const interval = setInterval(() => {
      currentStep++
      if (currentStep < steps.length) {
        setScrapingStep(steps[currentStep])
      } else {
        clearInterval(interval)
        setIsScraping(false)
        setScrapedUrls(prev => [
          {
            id: Date.now().toString(),
            url: crawlUrl,
            status: "Indexado",
            date: "Hoje"
          },
          ...prev
        ])
        setCrawlUrl("")
        triggerToast("Site indexado com sucesso na base RAG!")
      }
    }, 1200)
  }

  // Scraping keypress handler
  const handleScrapeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScrape()
    }
  }

  // File upload simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsUploading(false)
            setUploadedFiles(prevFiles => [
              {
                id: Date.now().toString(),
                name: file.name,
                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                status: "Indexado",
                date: "Hoje"
              },
              ...prevFiles
            ])
            triggerToast(`Arquivo "${file.name}" processado e indexado!`)
          }, 400)
          return 100
        }
        return prev + 10
      })
    }, 150)
  }

  // Delete Handlers
  const handleDeleteUrl = (id: string, url: string) => {
    setScrapedUrls(prev => prev.filter(item => item.id !== id))
    triggerToast(`URL "${url}" removida da base de dados.`, "info")
  }

  const handleDeleteFile = (id: string, name: string) => {
    setUploadedFiles(prev => prev.filter(item => item.id !== id))
    triggerToast(`Documento "${name}" removido da base de dados.`, "info")
  }

  // Save Config handler
  const handleSaveConfig = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      triggerToast("Configurações salvas e bot reinicializado!")
    }, 1500)
  }

  // Temperature description mapping
  const getTempDesc = (val: number) => {
    if (val < 0.3) return "Preciso & Literal"
    if (val < 0.6) return "Equilibrado / Analítico"
    if (val < 0.8) return "Conversacional"
    return "Criativo / Fluido"
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* Main dense panel area */}
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto overflow-y-auto overflow-x-hidden no-scrollbar">
        
        {/* Cinematic Page Title and Subtitle */}
        <section className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bento-item">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HugeiconsIcon icon={CpuIcon} className="size-5 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-semibold tracking-tight">Treinamento RAG</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Alimente o assistente de IA com o contexto, manuais e sites da sua agência.</p>
          </div>
          
          {/* Quick Base Stats Bento items */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-card border border-border/40 px-3 py-2 rounded-xl flex items-center gap-2">
              <HugeiconsIcon icon={Coins01Icon} className="size-4 text-primary" />
              <div className="text-left">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none">Limite da Base</p>
                <p className="text-xs font-semibold mt-0.5 leading-none">1.2 MB / 50 MB</p>
              </div>
            </div>
            
            <div className="bg-card border border-border/40 px-3 py-2 rounded-xl flex items-center gap-2">
              <HugeiconsIcon icon={Building01Icon} className="size-4 text-primary" />
              <div className="text-left">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none">Fontes Ativas</p>
                <p className="text-xs font-semibold mt-0.5 leading-none">{scrapedUrls.length} URLs • {uploadedFiles.length} Docs</p>
              </div>
            </div>
            
            <div className="bg-card border border-border/40 px-3 py-2 rounded-xl flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <div className="text-left">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider leading-none">Status</p>
                <p className="text-xs font-semibold mt-0.5 leading-none">Sincronizado</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Panel: Knowledge Sources Ingestion */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Bento Crawler Ingestion Card */}
            <div className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col">
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <HugeiconsIcon icon={Link01Icon} className="size-4.5 text-muted-foreground" />
                  Crawler de Site & Links
                </h3>
                <p className="text-[11px] text-muted-foreground mb-4">Varra o sitemap do site para extrair textos de portfólios, serviços e blog.</p>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      disabled={isScraping}
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                      onKeyDown={handleScrapeKeyPress}
                      placeholder="https://kyper.ag"
                      className="w-full h-10 px-3 bg-muted/30 border border-border/50 rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300 disabled:opacity-50"
                    />
                  </div>
                  <Button
                    onClick={handleScrape}
                    disabled={isScraping}
                    className="h-10 rounded-xl px-5 text-xs font-medium active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] gap-1.5"
                  >
                    {isScraping ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin size-3 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {scrapingStep}
                      </span>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Search01Icon} className="size-3.5" />
                        Varrer Link
                      </>
                    )}
                  </Button>
                </div>

                {/* Scraped URLs list */}
                <div className="mt-5">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Páginas Indexadas ({scrapedUrls.length})</span>
                  </div>
                  <div className="max-h-[160px] overflow-y-auto no-scrollbar space-y-1.5 divide-y divide-border/20 pr-1">
                    {scrapedUrls.map((item) => (
                      <div key={item.id} className="group/row flex items-center justify-between py-2 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono font-medium text-foreground truncate">{item.url}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Adicionado em {item.date}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-2 shrink-0">
                          <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                            {item.status}
                          </span>
                          <button 
                            onClick={() => handleDeleteUrl(item.id, item.url)}
                            className="p-1 hover:bg-destructive/15 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                            title="Remover fonte"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Document Ingestion Card */}
            <div className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col">
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <HugeiconsIcon icon={DocumentAttachmentIcon} className="size-4.5 text-muted-foreground" />
                  Biblioteca de Documentos
                </h3>
                <p className="text-[11px] text-muted-foreground mb-4">Carregue manuais, PDFs de propostas comerciais e diretrizes para a IA ler.</p>

                {/* Upload drag drop box */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-muted/5 hover:bg-muted/10 hover:border-primary/40 transition-all duration-300 cursor-pointer group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.txt,.docx"
                  />
                  <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-muted border border-border/50 mb-3 group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <HugeiconsIcon icon={DocumentAttachmentIcon} className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h4 className="text-xs font-semibold mb-1 text-foreground">Clique para fazer upload</h4>
                  <p className="text-[10px] text-muted-foreground max-w-xs">Arraste seus PDFs, DOCX ou TXT (Limite de 10MB por arquivo)</p>
                </div>

                {/* File Upload progress bar */}
                {isUploading && (
                  <div className="mt-4 bg-muted/30 border border-border/40 rounded-xl p-3 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-1 text-[10px] font-semibold">
                      <span className="text-muted-foreground">Processando e criando vetores RAG...</span>
                      <span className="text-primary">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted-foreground/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-150 ease-out" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Uploaded Files list */}
                <div className="mt-5">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Arquivos Indexados ({uploadedFiles.length})</span>
                  </div>
                  <div className="max-h-[160px] overflow-y-auto no-scrollbar space-y-1.5 divide-y divide-border/20 pr-1">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="group/row flex items-center justify-between py-2 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{file.size} • Indexado em {file.date}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-2 shrink-0">
                          <span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
                            {file.status}
                          </span>
                          <button 
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            className="p-1 hover:bg-destructive/15 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                            title="Excluir arquivo"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right Panel: Settings, System Prompts & Tuning */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Bento General Bot Persona Configuration */}
            <div className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
                  <HugeiconsIcon icon={Settings02Icon} className="size-4.5 text-muted-foreground" />
                  Personalidade & Regras
                </h3>
                
                <div className="grid gap-1.5">
                  <Label htmlFor="bot-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Nome da IA</Label>
                  <input
                    id="bot-name"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="w-full h-10 px-3 bg-muted/30 border border-border/50 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="bot-persona" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Tom de Voz / Persona</Label>
                  <Textarea
                    id="bot-persona"
                    value={botPersona}
                    onChange={(e) => setBotPersona(e.target.value)}
                    className="min-h-[75px] max-h-[140px] text-xs bg-muted/30 border border-border/50 rounded-xl resize-y focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="bot-guidelines" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Diretrizes & Limites</Label>
                  <Textarea
                    id="bot-guidelines"
                    value={botGuidelines}
                    onChange={(e) => setBotGuidelines(e.target.value)}
                    className="min-h-[75px] max-h-[140px] text-xs bg-muted/30 border border-border/50 rounded-xl resize-y focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Bento Advanced Model Parameters Tuning */}
            <div className="double-bezel-card bento-item bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]">
              <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 flex flex-col space-y-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-border/40 pb-2">
                  <HugeiconsIcon icon={Settings02Icon} className="size-4.5 text-muted-foreground" />
                  Ajuste de Hiperparâmetros
                </h3>

                {/* LLM Engine Selection */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Modelo Linguístico</Label>
                  <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
                    {[
                      { id: "gemini-1.5-pro", name: "Gemini Pro" },
                      { id: "claude-3.5-sonnet", name: "Claude 3.5" },
                      { id: "gpt-4o", name: "GPT-4o" }
                    ].map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id as any)}
                        className={`py-2 text-[10px] font-semibold rounded-lg transition-all active:scale-[0.96] cursor-pointer ${
                          selectedModel === model.id 
                            ? "bg-card text-foreground shadow-sm ring-1 ring-border/30" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temperature slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">
                    <span>Temperatura (Criatividade)</span>
                    <span className="text-primary font-mono text-[11px] font-semibold">{temperature.toFixed(1)} — {getTempDesc(temperature)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Toggle Swiches */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Label htmlFor="auto-pilot" className="text-xs font-semibold cursor-pointer">Piloto Automático RAG</Label>
                      <span className="text-[10px] text-muted-foreground">Responder chats diretamente se o fit for &gt; 85%.</span>
                    </div>
                    <Switch 
                      id="auto-pilot" 
                      checked={autoPilot} 
                      onCheckedChange={setAutoPilot} 
                      className="active:scale-95 transition-transform" 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Label htmlFor="human-alert" className="text-xs font-semibold cursor-pointer">Handoff Humano</Label>
                      <span className="text-[10px] text-muted-foreground">Avisar equipe se a pergunta for de fora da base.</span>
                    </div>
                    <Switch 
                      id="human-alert" 
                      checked={humanAlert} 
                      onCheckedChange={setHumanAlert} 
                      className="active:scale-95 transition-transform"
                    />
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <Button 
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full h-10 rounded-xl text-xs font-semibold active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] gap-1.5"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin size-3.5 text-current" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Salvando Ajustes...
                      </span>
                    ) : (
                      <>
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Salvar Preferências
                      </>
                    )}
                  </Button>
                </div>

              </div>
            </div>

          </div>

        </section>
      </main>

      {/* Floating custom notification toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-card/90 backdrop-blur-md ring-1 ring-border/50 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-sm">
            <div className={`size-2 rounded-full shrink-0 ${
              toast.type === "success" ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" :
              toast.type === "error" ? "bg-destructive shadow-[0_0_8px_rgba(var(--destructive),0.5)]" :
              "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            }`} />
            <span className="text-[11px] font-medium text-foreground">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Custom styled range slider & scrollbar overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}} />
    </div>
  )
}
