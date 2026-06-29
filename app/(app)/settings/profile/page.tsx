"use client"

import { useState } from "react"
import { SettingsCard, SettingsSection, SettingsInput, SettingsToggle, SaveBar } from "@/components/settings"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  UserIcon,
  MailIcon,
  TelephoneIcon,
  GlobeIcon,
  UploadIcon,
  CameraIcon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ProfileSettingsPage() {
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    username: "johndoe",
    phone: "+55 11 99999-9999",
    bio: "Designer & Developer",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
  })

  const [preferences, setPreferences] = useState({
    theme: "system",
    density: "comfortable",
    animations: true,
    sounds: false,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handlePreferenceChange = (field: string, value: boolean | string) => {
    setPreferences((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setIsDirty(false)
  }

  const handleDiscard = () => {
    // Reset para valores originais
    setFormData({
      name: "John Doe",
      email: "john@example.com",
      username: "johndoe",
      phone: "+55 11 99999-9999",
      bio: "Designer & Developer",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
    })
    setPreferences({
      theme: "system",
      density: "comfortable",
      animations: true,
      sounds: false,
    })
    setIsDirty(false)
  }

  return (
    <>
      <div className="space-y-8 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-xs font-heading font-semibold">Perfil</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        {/* Avatar Section */}
        <SettingsCard
          title="Foto de Perfil"
          description="Atualize sua foto de perfil"
          icon={CameraIcon}
        >
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/placeholder-avatar.jpg" alt="Avatar" />
              <AvatarFallback className="text-xs">JD</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <HugeiconsIcon icon={UploadIcon} className="mr-2 h-4 w-4" />
                  Upload nova foto
                </Button>
                <Button variant="ghost" size="sm">
                  Remover
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou GIF. Máximo 2MB.
              </p>
            </div>
          </div>
        </SettingsCard>

        {/* Basic Information */}
        <SettingsSection
          title="Informações Básicas"
          description="Suas informações pessoais básicas"
        >
          <SettingsCard title="Dados Pessoais">
            <div className="space-y-4">
              <SettingsInput
                label="Nome Completo"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Digite seu nome completo"
              />
              <SettingsInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                description="Seu email principal para login e notificações"
              />
              <SettingsInput
                label="Username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                description="Como você será identificado no sistema"
              />
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Conte um pouco sobre você"
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Breve descrição sobre você (máximo 160 caracteres)
                </p>
              </div>
            </div>
          </SettingsCard>
        </SettingsSection>

        {/* Contact Information */}
        <SettingsSection
          title="Informações de Contato"
          description="Como podemos entrar em contato com você"
        >
          <SettingsCard title="Contato" icon={TelephoneIcon}>
            <div className="space-y-4">
              <SettingsInput
                label="Telefone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+55 11 99999-9999"
              />
              <SettingsInput
                label="WhatsApp"
                type="tel"
                placeholder="+55 11 99999-9999"
                description="Se diferente do telefone principal"
              />
              <SettingsInput
                label="LinkedIn"
                placeholder="https://linkedin.com/in/seu-perfil"
              />
            </div>
          </SettingsCard>
        </SettingsSection>

        {/* Regional Settings */}
        <SettingsSection
          title="Configurações Regionais"
          description="Fuso horário e idioma"
        >
          <SettingsCard title="Regional" icon={GlobeIcon}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Fuso Horário
                </Label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange("timezone", e.target.value)}
                  className="flex h-7 w-full rounded-lg border border-border/40 bg-muted/10 px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Usado para exibir datas e horários
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Idioma
                </Label>
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => handleInputChange("language", e.target.value)}
                  className="flex h-7 w-full rounded-lg border border-border/40 bg-muted/10 px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
            </div>
          </SettingsCard>
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection
          title="Preferências"
          description="Personalize sua experiência"
        >
          <SettingsCard title="Preferências de Interface">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Tema
                </Label>
                <select
                  id="theme"
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange("theme", e.target.value)}
                  className="flex h-7 w-full rounded-lg border border-border/40 bg-muted/10 px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="density" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Densidade da Interface
                </Label>
                <select
                  id="density"
                  value={preferences.density}
                  onChange={(e) => handlePreferenceChange("density", e.target.value)}
                  className="flex h-7 w-full rounded-lg border border-border/40 bg-muted/10 px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="comfortable">Confortável</option>
                  <option value="compact">Compacta</option>
                </select>
              </div>

              <SettingsToggle
                label="Animações"
                description="Habilitar animações e transições"
                enabled={preferences.animations}
                onChange={(value) => handlePreferenceChange("animations", value)}
              />

              <SettingsToggle
                label="Sons de Notificação"
                description="Reproduzir sons quando receber notificações"
                enabled={preferences.sounds}
                onChange={(value) => handlePreferenceChange("sounds", value)}
              />
            </div>
          </SettingsCard>
        </SettingsSection>
      </div>

      <SaveBar
        isDirty={isDirty}
        onSave={handleSave}
        onDiscard={handleDiscard}
        isSaving={isSaving}
      />
    </>
  )
}
