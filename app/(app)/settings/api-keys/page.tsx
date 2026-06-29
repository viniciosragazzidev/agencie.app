"use client"

import { useState } from "react"
import { SettingsCard, SettingsSection } from "@/components/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Key01Icon,
  Add01Icon,
  Copy01Icon,
  ViewIcon,
  ViewOffIcon,
  MoreVerticalIcon,
  Delete01Icon,
  Loading01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon
} from "@hugeicons/core-free-icons"
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

// Mock data
const apiKeys = [
  {
    id: "1",
    name: "Production API",
    key: "sk_live_51H...",
    scopes: ["clients:read", "clients:write", "projects:read"],
    lastUsed: "Há 5 minutos",
    createdAt: "15/06/2026",
    expiresAt: null,
  },
  {
    id: "2",
    name: "Development API",
    key: "sk_test_51H...",
    scopes: ["clients:read", "projects:read"],
    lastUsed: "Há 2 horas",
    createdAt: "10/06/2026",
    expiresAt: "10/12/2026",
  },
]

const availableScopes = [
  {
    id: "clients:read",
    label: "Clientes (Leitura)",
    description: "Visualizar informações de clientes",
  },
  {
    id: "clients:write",
    label: "Clientes (Escrita)",
    description: "Criar e modificar clientes",
  },
  {
    id: "projects:read",
    label: "Projetos (Leitura)",
    description: "Visualizar informações de projetos",
  },
  {
    id: "projects:write",
    label: "Projetos (Escrita)",
    description: "Criar e modificar projetos",
  },
  {
    id: "conversations:read",
    label: "Conversas (Leitura)",
    description: "Visualizar conversas",
  },
  {
    id: "conversations:write",
    label: "Conversas (Escrita)",
    description: "Enviar mensagens",
  },
  {
    id: "webhooks:manage",
    label: "Webhooks",
    description: "Gerenciar webhooks",
  },
]

export default function APIKeysPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyDescription, setNewKeyDescription] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [showNewKey, setShowNewKey] = useState(false)
  const [generatedKey, setGeneratedKey] = useState("")
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})

  const handleCreateKey = () => {
    // Gerar uma chave mock
    const mockKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    setGeneratedKey(mockKey)
    setShowNewKey(true)
  }

  const handleCloseDialog = () => {
    setCreateDialogOpen(false)
    setShowNewKey(false)
    setNewKeyName("")
    setNewKeyDescription("")
    setSelectedScopes([])
    setGeneratedKey("")
  }

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId)
        ? prev.filter((s) => s !== scopeId)
        : [...prev, scopeId]
    )
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const maskKey = (key: string) => {
    return key.slice(0, 12) + "•".repeat(20)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-heading font-semibold">API Keys</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Gerencie suas chaves de API para integração
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <HugeiconsIcon icon={Add01Icon} className="mr-2 h-4 w-4" />
              Criar Nova Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {showNewKey ? "Sua Nova API Key" : "Criar Nova API Key"}
              </DialogTitle>
              <DialogDescription>
                {showNewKey
                  ? "Copie e guarde esta chave em um lugar seguro. Você não poderá vê-la novamente."
                  : "Configure sua nova chave de API"}
              </DialogDescription>
            </DialogHeader>

            {!showNewKey ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Key</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Production API"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    placeholder="Para que você usará esta key?"
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Permissões (Scopes)</Label>
                  <div className="rounded-lg border p-4 space-y-3 max-h-64 overflow-y-auto">
                    {availableScopes.map((scope) => (
                      <div key={scope.id} className="flex items-start gap-3">
                        <Checkbox
                          id={scope.id}
                          checked={selectedScopes.includes(scope.id)}
                          onCheckedChange={() => toggleScope(scope.id)}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={scope.id}
                            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 cursor-pointer"
                          >
                            {scope.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {scope.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selecione as permissões que esta key terá
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        API Key criada com sucesso!
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Copie e guarde esta chave agora. Por questões de segurança,
                        ela não será exibida novamente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sua API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(generatedKey)}
                    >
                      <HugeiconsIcon icon={Copy01Icon} className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon icon={AlertCircleIcon} className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Importante
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Mantenha suas API keys seguras e nunca as compartilhe
                        publicamente. Trate-as como senhas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              {!showNewKey ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    disabled={!newKeyName || selectedScopes.length === 0}
                  >
                    Criar API Key
                  </Button>
                </>
              ) : (
                <Button onClick={handleCloseDialog}>Concluir</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      <SettingsSection
        title="Suas API Keys"
        description={`${apiKeys.length} keys ativas`}
      >
        <SettingsCard title="Lista de API Keys" icon={Key01Icon}>
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-medium">{key.name}</h4>
                      {key.expiresAt && (
                        <Badge variant="outline" className="text-xs">
                          Expira em {key.expiresAt}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">
                        {visibleKeys[key.id] ? key.key : maskKey(key.key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {visibleKeys[key.id] ? (
                          <HugeiconsIcon icon={ViewOffIcon} className="h-3 w-3" />
                        ) : (
                          <HugeiconsIcon icon={ViewIcon} className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(key.key)}
                      >
                        <HugeiconsIcon icon={Copy01Icon} className="h-3 w-3" />
                      </Button>
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
                        <HugeiconsIcon icon={Loading01Icon} className="mr-2 h-4 w-4" />
                        Regenerar
                      </DropdownMenuItem>
                      <DropdownMenuItem>Editar permissões</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <HugeiconsIcon icon={Delete01Icon} className="mr-2 h-4 w-4" />
                        Revogar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-1">
                  {key.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Criada em {key.createdAt}</span>
                  <span>Última utilização: {key.lastUsed}</span>
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Documentation */}
      <SettingsSection
        title="Documentação"
        description="Como usar a API"
      >
        <SettingsCard title="Guia de Uso">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium mb-1.5">Autenticação</h4>
              <p className="text-[10px] text-muted-foreground mb-2">
                Inclua sua API key no header de todas as requisições:
              </p>
              <div className="rounded-lg bg-muted p-3 font-mono text-xs overflow-x-auto">
                <div>Authorization: Bearer YOUR_API_KEY</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium mb-1.5">Exemplo de Requisição</h4>
              <div className="rounded-lg bg-muted p-3 font-mono text-xs overflow-x-auto">
                <div className="text-blue-600">curl</div>
                <div className="text-green-600">-H</div>
                <div className="ml-2">"Authorization: Bearer YOUR_API_KEY"</div>
                <div className="ml-2">"Content-Type: application/json"</div>
                <div className="text-purple-600">https://api.agencie.app/v1/clients</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium mb-1.5">Rate Limits</h4>
              <ul className="space-y-1 text-[10px] text-muted-foreground">
                <li>• 1000 requisições por hora</li>
                <li>• 100 requisições por minuto</li>
                <li>• Headers de rate limit incluídos nas respostas</li>
              </ul>
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
