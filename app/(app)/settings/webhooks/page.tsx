"use client"

import { useState } from "react"
import { SettingsCard, SettingsSection } from "@/components/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  WebhookIcon,
  AddIcon,
  MoreVerticalIcon,
  DeleteIcon,
  PlayIcon,
  PauseIcon,
  NoteIcon,
  CheckmarkCircle02Icon,
  CancelIcon,
  ClockIcon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data
const webhooks = [
  {
    id: "1",
    url: "https://api.example.com/webhooks/agencie",
    events: ["client.created", "client.updated", "project.created"],
    status: "active",
    lastDelivery: "Há 5 minutos",
    lastStatus: "success",
    createdAt: "15/06/2026",
  },
  {
    id: "2",
    url: "https://zapier.com/hooks/catch/123456/abcdef",
    events: ["message.received", "task.completed"],
    status: "error",
    lastDelivery: "Há 1 hora",
    lastStatus: "failed",
    createdAt: "10/06/2026",
  },
  {
    id: "3",
    url: "https://my-app.com/webhooks",
    events: ["payment.received"],
    status: "paused",
    lastDelivery: "Há 2 dias",
    lastStatus: "success",
    createdAt: "05/06/2026",
  },
]

const webhookLogs = [
  {
    id: "1",
    event: "client.created",
    url: "https://api.example.com/webhooks/agencie",
    status: 200,
    timestamp: "Há 5 minutos",
    duration: "142ms",
  },
  {
    id: "2",
    event: "message.received",
    url: "https://zapier.com/hooks/catch/123456/abcdef",
    status: 500,
    timestamp: "Há 1 hora",
    duration: "3021ms",
  },
  {
    id: "3",
    event: "project.created",
    url: "https://api.example.com/webhooks/agencie",
    status: 200,
    timestamp: "Há 2 horas",
    duration: "98ms",
  },
]

const availableEvents = [
  {
    id: "client.created",
    label: "Cliente Criado",
    description: "Quando um novo cliente é adicionado",
  },
  {
    id: "client.updated",
    label: "Cliente Atualizado",
    description: "Quando um cliente é modificado",
  },
  {
    id: "project.created",
    label: "Projeto Criado",
    description: "Quando um novo projeto é criado",
  },
  {
    id: "project.updated",
    label: "Projeto Atualizado",
    description: "Quando um projeto é modificado",
  },
  {
    id: "task.completed",
    label: "Tarefa Concluída",
    description: "Quando uma tarefa é marcada como concluída",
  },
  {
    id: "message.received",
    label: "Mensagem Recebida",
    description: "Quando uma nova mensagem é recebida",
  },
  {
    id: "payment.received",
    label: "Pagamento Recebido",
    description: "Quando um pagamento é confirmado",
  },
]

export default function WebhooksPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newWebhookUrl, setNewWebhookUrl] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [secret, setSecret] = useState("")

  const handleCreateWebhook = () => {
    console.log("Criando webhook:", {
      url: newWebhookUrl,
      events: selectedEvents,
      secret,
    })
    setCreateDialogOpen(false)
    setNewWebhookUrl("")
    setSelectedEvents([])
    setSecret("")
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />
      case "error":
        return <HugeiconsIcon icon={CancelIcon} className="h-4 w-4 text-red-500" />
      case "paused":
        return <HugeiconsIcon icon={PauseIcon} className="h-4 w-4 text-amber-500" />
      default:
        return <HugeiconsIcon icon={ClockIcon} className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            Ativo
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            Erro
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="secondary">
            Pausado
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-500"
    if (status >= 400) return "text-red-500"
    return "text-amber-500"
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xs font-heading font-semibold">Webhooks</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure webhooks para receber eventos em tempo real
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <HugeiconsIcon icon={AddIcon} className="mr-2 h-4 w-4" />
              Criar Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Webhook</DialogTitle>
              <DialogDescription>
                Configure um endpoint para receber eventos do sistema
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL de Destino</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://seu-dominio.com/webhooks"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A URL que receberá os eventos via POST
                </p>
              </div>

              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="rounded-lg border p-4 space-y-3 max-h-64 overflow-y-auto">
                  {availableEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <Checkbox
                        id={event.id}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={event.id}
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 cursor-pointer"
                        >
                          {event.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione os eventos que deseja receber
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secret (opcional)</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Deixe vazio para gerar automaticamente"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Usado para validar a assinatura HMAC dos eventos
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="text-xs font-medium mb-1.5">Formato do Payload</h4>
                <div className="rounded bg-background p-3 font-mono text-xs overflow-x-auto">
                  <pre>{`{
  "event": "client.created",
  "timestamp": "2026-06-26T10:00:00Z",
  "data": {
    "id": "123",
    "name": "Cliente Nome",
    ...
  }
}`}</pre>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateWebhook}
                disabled={!newWebhookUrl || selectedEvents.length === 0}
              >
                Criar Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      <SettingsSection
        title="Webhooks Configurados"
        description={`${webhooks.length} webhooks ativos`}
      >
        <SettingsCard title="Lista de Webhooks" icon={WebhookIcon}>
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(webhook.status)}
                      <code className="text-xs font-mono">{webhook.url}</code>
                      {getStatusBadge(webhook.status)}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="sm">
                        <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <HugeiconsIcon icon={PlayIcon} className="mr-2 h-4 w-4" />
                        Testar webhook
                      </DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>
                        {webhook.status === "paused" ? (
                          <>
                            <HugeiconsIcon icon={PlayIcon} className="mr-2 h-4 w-4" />
                            Reativar
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={PauseIcon} className="mr-2 h-4 w-4" />
                            Pausar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <HugeiconsIcon icon={DeleteIcon} className="mr-2 h-4 w-4" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Criado em {webhook.createdAt}</span>
                  <div className="flex items-center gap-1">
                    <span>Última entrega: {webhook.lastDelivery}</span>
                    {webhook.lastStatus === "success" ? (
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3 w-3 text-green-500" />
                    ) : (
                      <HugeiconsIcon icon={CancelIcon} className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Logs */}
      <SettingsSection
        title="Logs de Entregas"
        description="Histórico de eventos enviados"
      >
        <SettingsCard title="Logs de Entregas" icon={NoteIcon}>
          <Tabs defaultValue="recent">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recentes</TabsTrigger>
              <TabsTrigger value="success">Sucesso</TabsTrigger>
              <TabsTrigger value="failed">Falhas</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-3 mt-4">
              {webhookLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {log.status >= 200 && log.status < 300 ? (
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />
                    ) : (
                      <HugeiconsIcon icon={CancelIcon} className="h-4 w-4 text-red-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">{log.event}</p>
                        <code
                          className={`text-xs font-mono ${getStatusColor(log.status)}`}
                        >
                          {log.status}
                        </code>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.url}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-muted-foreground">
                    <p>{log.timestamp}</p>
                    <p>{log.duration}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="success" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="text-sm">Entregas bem-sucedidas</p>
              </div>
            </TabsContent>

            <TabsContent value="failed" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-12 w-12 mx-auto mb-2 text-red-500" />
                <p className="text-sm">Entregas com falha</p>
              </div>
            </TabsContent>
          </Tabs>
        </SettingsCard>
      </SettingsSection>

      {/* Documentation */}
      <SettingsSection title="Documentação" description="Como funcionam os webhooks">
        <SettingsCard title="Guia de Webhooks">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium mb-1.5">Validação de Assinatura</h4>
              <p className="text-[10px] text-muted-foreground mb-2">
                Todos os eventos incluem um header <code>X-Webhook-Signature</code> com
                uma assinatura HMAC SHA-256:
              </p>
              <div className="rounded-lg bg-muted p-3 font-mono text-xs overflow-x-auto">
                <div>X-Webhook-Signature: sha256=abc123...</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium mb-1.5">Retry Policy</h4>
              <ul className="space-y-1 text-[10px] text-muted-foreground">
                <li>• Tentativa imediata em caso de falha</li>
                <li>• Retry após 5 minutos</li>
                <li>• Retry após 1 hora</li>
                <li>• Webhook pausado automaticamente após 3 falhas consecutivas</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-medium mb-1.5">Timeout</h4>
              <p className="text-[10px] text-muted-foreground">
                Seu endpoint deve responder em até 10 segundos. Respostas mais lentas
                serão consideradas como falha.
              </p>
            </div>

            <Button variant="outline" className="w-full">
              Ver Documentação Completa
            </Button>
          </div>
        </SettingsCard>
      </SettingsSection>
    </div>
  )
}
