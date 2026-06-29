"use client"

import { useState } from "react"
import { SettingsCard, SettingsSection } from "@/components/settings"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  UserIcon,
  UserAddIcon,
  MoreVerticalIcon,
  MailIcon,
  CrownIcon,
  BuildingIcon,
  DeleteIcon,
  LoadingIcon,
  SearchIcon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock data
const teamMembers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    avatar: "/placeholder-avatar.jpg",
    status: "active",
    lastActive: "Agora",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "manager",
    avatar: null,
    status: "active",
    lastActive: "Há 5 min",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "member",
    avatar: null,
    status: "active",
    lastActive: "Há 1 hora",
  },
]

const pendingInvites = [
  {
    id: "1",
    email: "sarah@example.com",
    role: "member",
    invitedBy: "John Doe",
    invitedAt: "Há 2 dias",
  },
  {
    id: "2",
    email: "robert@example.com",
    role: "manager",
    invitedBy: "John Doe",
    invitedAt: "Há 5 dias",
  },
]

const roles = [
  {
    value: "admin",
    label: "Admin",
    description: "Acesso total ao sistema",
    icon: CrownIcon,
  },
  {
    value: "manager",
    label: "Manager",
    description: "Gestão de clientes e projetos",
    icon: BuildingIcon,
  },
  {
    value: "member",
    label: "Member",
    description: "Acesso básico",
    icon: UserIcon,
  },
]

export default function TeamSettingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviteMessage, setInviteMessage] = useState("")

  const getRoleIcon = (role: string) => {
    const roleData = roles.find((r) => r.value === role)
    return roleData?.icon || UserIcon
  }

  const getRoleLabel = (role: string) => {
    const roleData = roles.find((r) => r.value === role)
    return roleData?.label || role
  }

  const handleInvite = () => {
    // Implementar lógica de convite
    console.log("Enviando convite para:", inviteEmail)
    setInviteDialogOpen(false)
    setInviteEmail("")
    setInviteRole("member")
    setInviteMessage("")
  }

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-heading font-semibold">Equipe</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Gerencie membros e convites da sua equipe
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <HugeiconsIcon icon={UserAddIcon} className="mr-2 h-4 w-4" />
              Convidar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Membro</DialogTitle>
              <DialogDescription>
                Envie um convite para alguém se juntar à sua equipe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Função</Label>
                <Select value={inviteRole} onValueChange={(value) => value && setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => {
                      const Icon = role.icon
                      return (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={Icon} className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {role.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Mensagem (opcional)</Label>
                <Input
                  id="message"
                  placeholder="Adicione uma mensagem personalizada..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleInvite}>Enviar Convite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members */}
      <SettingsSection
        title="Membros da Equipe"
        description={`${teamMembers.length} membros ativos`}
      >
        <SettingsCard title="Membros" icon={UserIcon}>
          {/* Search */}
          <div className="relative mb-4">
            <HugeiconsIcon icon={SearchIcon} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const RoleIcon = getRoleIcon(member.role)
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">{member.name}</p>
                        {member.role === "admin" && (
                          <HugeiconsIcon icon={CrownIcon} className="h-2.5 w-2.5 text-amber-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <HugeiconsIcon icon={RoleIcon} className="h-2.5 w-2.5" />
                        <span>{getRoleLabel(member.role)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {member.lastActive}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="sm">
                          <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar função</DropdownMenuItem>
                        <DropdownMenuItem>Ver atividade</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <HugeiconsIcon icon={DeleteIcon} className="mr-2 h-4 w-4" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <SettingsSection
          title="Convites Pendentes"
          description={`${pendingInvites.length} convites aguardando aceitação`}
        >
          <SettingsCard title="Convites Pendentes" icon={MailIcon}>
            <div className="space-y-3">
              {pendingInvites.map((invite) => {
                const RoleIcon = getRoleIcon(invite.role)
                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border border-dashed p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <HugeiconsIcon icon={MailIcon} className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{invite.email}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Convidado por {invite.invitedBy} • {invite.invitedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <HugeiconsIcon icon={RoleIcon} className="h-2.5 w-2.5" />
                        <span>{getRoleLabel(invite.role)}</span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="sm">
                            <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <HugeiconsIcon icon={LoadingIcon} className="mr-2 h-4 w-4" />
                            Reenviar convite
                          </DropdownMenuItem>
                          <DropdownMenuItem>Copiar link</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <HugeiconsIcon icon={DeleteIcon} className="mr-2 h-4 w-4" />
                            Cancelar convite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          </SettingsCard>
        </SettingsSection>
      )}

      {/* Roles & Permissions */}
      <SettingsSection
        title="Funções e Permissões"
        description="Entenda o que cada função pode fazer"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <SettingsCard key={role.value} title={role.label} className="h-full">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <HugeiconsIcon icon={Icon} className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="text-xs font-medium">{role.label}</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </SettingsCard>
            )
          })}
        </div>
      </SettingsSection>
    </div>
  )
}
