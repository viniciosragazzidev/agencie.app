"use client"

import { useState } from "react"
import { SettingsCard, SettingsSection, SettingsInput } from "@/components/settings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BuildingIcon,
  KeyIcon,
  SmartPhoneIcon,
  ComputerIcon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  CopyIcon,
  DeleteIcon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// Mock data
const activeSessions = [
  {
    id: "1",
    device: "Chrome on Windows",
    location: "São Paulo, Brazil",
    ip: "192.168.1.1",
    lastActive: "Agora (esta sessão)",
    isCurrent: true,
  },
  {
    id: "2",
    device: "Safari on iPhone",
    location: "São Paulo, Brazil",
    ip: "192.168.1.100",
    lastActive: "Há 2 horas",
    isCurrent: false,
  },
  {
    id: "3",
    device: "Chrome on MacOS",
    location: "Rio de Janeiro, Brazil",
    ip: "200.123.45.67",
    lastActive: "Ontem",
    isCurrent: false,
  },
]

const accessLogs = [
  {
    id: "1",
    action: "Login bem-sucedido",
    ip: "192.168.1.1",
    location: "São Paulo, Brazil",
    timestamp: "Hoje às 14:30",
    status: "success",
  },
  {
    id: "2",
    action: "Senha alterada",
    ip: "192.168.1.1",
    location: "São Paulo, Brazil",
    timestamp: "Há 2 dias",
    status: "success",
  },
  {
    id: "3",
    action: "Tentativa de login falhou",
    ip: "203.0.113.0",
    location: "Unknown",
    timestamp: "Há 5 dias",
    status: "failed",
  },
]

export default function SecuritySettingsPage() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const handlePasswordChange = () => {
    // Implementar lógica de mudança de senha
    console.log("Alterando senha...")
  }

  const handleEnable2FA = () => {
    setShow2FASetup(true)
    // Gerar códigos de backup mock
    setBackupCodes([
      "ABCD-EFGH-IJKL-MNOP",
      "QRST-UVWX-YZAB-CDEF",
      "GHIJ-KLMN-OPQR-STUV",
      "WXYZ-ABCD-EFGH-IJKL",
    ])
  }

  const handleDisable2FA = () => {
    setIs2FAEnabled(false)
    setShow2FASetup(false)
    setBackupCodes([])
  }

  const handleRevokeSession = (sessionId: string) => {
    console.log("Revogando sessão:", sessionId)
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-heading font-semibold">Segurança</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Gerencie a segurança da sua conta
        </p>
      </div>

      {/* Password */}
      <SettingsSection
        title="Senha"
        description="Altere sua senha regularmente para manter sua conta segura"
      >
        <SettingsCard title="Alterar Senha" icon={KeyIcon}>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-xs">
              <div className="flex items-start gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Requisitos de senha:</p>
                  <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                    <li>• Mínimo de 8 caracteres</li>
                    <li>• Pelo menos uma letra maiúscula</li>
                    <li>• Pelo menos um número</li>
                    <li>• Pelo menos um caractere especial</li>
                  </ul>
                </div>
              </div>
            </div>

            <SettingsInput
              label="Senha atual"
              type="password"
              value={passwordForm.current}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, current: e.target.value })
              }
            />
            <SettingsInput
              label="Nova senha"
              type="password"
              value={passwordForm.new}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, new: e.target.value })
              }
            />
            <SettingsInput
              label="Confirmar nova senha"
              type="password"
              value={passwordForm.confirm}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm: e.target.value })
              }
            />

            <div className="flex justify-end">
              <Button onClick={handlePasswordChange}>Alterar senha</Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Última alteração: Há 30 dias
              </p>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Two-Factor Authentication */}
      <SettingsSection
        title="Autenticação de Dois Fatores (2FA)"
        description="Adicione uma camada extra de segurança à sua conta"
      >
        <SettingsCard title="Autenticação 2FA" icon={SmartPhoneIcon}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium">Status da 2FA</p>
                <p className="text-xs text-muted-foreground">
                  {is2FAEnabled
                    ? "A autenticação de dois fatores está ativada"
                    : "A autenticação de dois fatores está desativada"}
                </p>
              </div>
              {is2FAEnabled ? (
                <Badge variant="default" className="bg-green-500">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-1 h-3 w-3" />
                  Ativado
                </Badge>
              ) : (
                <Badge variant="secondary">Desativado</Badge>
              )}
            </div>

            {!is2FAEnabled && !show2FASetup && (
              <div className="pt-4 border-t">
                <Button onClick={handleEnable2FA}>Ativar 2FA</Button>
              </div>
            )}

            {show2FASetup && !is2FAEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium">
                      1. Escaneie o QR Code
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use o Google Authenticator ou app similar
                    </p>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <div className="h-48 w-48 bg-muted flex items-center justify-center rounded-lg">
                        <p className="text-xs text-muted-foreground">QR Code</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium">
                      2. Digite o código de verificação
                    </p>
                    <Input placeholder="000000" maxLength={6} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium">
                      3. Salve seus códigos de backup
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Guarde estes códigos em um lugar seguro. Você pode usá-los
                      para acessar sua conta se perder o acesso ao seu dispositivo.
                    </p>
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="font-mono text-xs">
                          {code}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyBackupCodes}
                    >
                      <HugeiconsIcon icon={CopyIcon} className="mr-2 h-4 w-4" />
                      Copiar códigos
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setIs2FAEnabled(true)
                        setShow2FASetup(false)
                      }}
                    >
                      Confirmar e ativar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShow2FASetup(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {is2FAEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <Button variant="destructive" onClick={handleDisable2FA}>
                  Desativar 2FA
                </Button>
              </div>
            )}
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Active Sessions */}
      <SettingsSection
        title="Sessões Ativas"
        description="Dispositivos onde você está logado atualmente"
      >
        <SettingsCard title="Dispositivos Conectados" icon={ComputerIcon}>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between rounded-lg border p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <HugeiconsIcon icon={ComputerIcon} className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{session.device}</p>
                      {session.isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.location} • {session.ip}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.lastActive}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    <HugeiconsIcon icon={DeleteIcon} className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Access Logs */}
      <SettingsSection
        title="Logs de Acesso"
        description="Histórico de atividades da sua conta"
      >
        <SettingsCard title="Histórico de Acessos" icon={BuildingIcon}>
          <div className="space-y-3">
            {accessLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="mt-0.5">
                  {log.status === "success" ? (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />
                  ) : (
                    <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.location} • {log.ip}
                  </p>
                  <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="w-full">
              Ver todos os logs
            </Button>
          </div>
        </SettingsCard>
      </SettingsSection>
    </div>
  )
}
