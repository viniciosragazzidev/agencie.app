"use client"

import { SettingsCard, SettingsSection } from "@/components/settings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CreditCardIcon,
  DownloadIcon,
  CheckmarkCircle02Icon,
  ArrowRightIcon,
  UserIcon,
  BuildingIcon,
  ZapIcon,
  CrownIcon,
  RocketIcon
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

// Mock data
const currentPlan = {
  name: "Pro",
  price: 299,
  interval: "mensal",
  renewalDate: "26/07/2026",
  features: [
    "Até 50 clientes",
    "Projetos ilimitados",
    "5 membros da equipe",
    "100GB de storage",
    "Integrações ilimitadas",
    "Suporte prioritário",
  ],
}

const plans = [
  {
    name: "Starter",
    price: 99,
    icon: RocketIcon,
    features: [
      "Até 10 clientes",
      "20 projetos",
      "2 membros",
      "10GB storage",
      "3 integrações",
      "Suporte por email",
    ],
  },
  {
    name: "Pro",
    price: 299,
    icon: CrownIcon,
    popular: true,
    features: [
      "Até 50 clientes",
      "Projetos ilimitados",
      "5 membros",
      "100GB storage",
      "Integrações ilimitadas",
      "Suporte prioritário",
    ],
  },
  {
    name: "Enterprise",
    price: 899,
    icon: BuildingIcon,
    features: [
      "Clientes ilimitados",
      "Projetos ilimitados",
      "Membros ilimitados",
      "500GB storage",
      "Integrações ilimitadas",
      "Suporte dedicado 24/7",
    ],
  },
]

const invoices = [
  {
    id: "INV-2026-06",
    date: "26/06/2026",
    amount: 299,
    status: "paid",
  },
  {
    id: "INV-2026-05",
    date: "26/05/2026",
    amount: 299,
    status: "paid",
  },
  {
    id: "INV-2026-04",
    date: "26/04/2026",
    amount: 299,
    status: "paid",
  },
]

const usage = [
  {
    label: "Clientes",
    current: 32,
    limit: 50,
    percentage: 64,
  },
  {
    label: "Membros da Equipe",
    current: 3,
    limit: 5,
    percentage: 60,
  },
  {
    label: "Storage",
    current: 42,
    limit: 100,
    unit: "GB",
    percentage: 42,
  },
  {
    label: "API TelephoneIcons",
    current: 12500,
    limit: 50000,
    percentage: 25,
  },
]

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-heading font-semibold">Cobrança</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Gerencie seu plano e informações de pagamento
        </p>
      </div>

      {/* Current Plan */}
      <SettingsSection
        title="Plano Atual"
        description="Detalhes da sua assinatura"
      >
        <SettingsCard title="Plano Atual" icon={CrownIcon}>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xs font-heading font-bold">
                    {currentPlan.name}
                  </h3>
                  <Badge variant="default">Ativo</Badge>
                </div>
                <p className="text-xs font-heading font-bold">
                  R$ {currentPlan.price}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    /{currentPlan.interval}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Renovação automática em {currentPlan.renewalDate}
                </p>
              </div>
              <Button>Alterar Plano</Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-xs font-medium mb-2">Recursos incluídos:</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Usage */}
      <SettingsSection
        title="Uso Atual"
        description="Monitore seu consumo de recursos"
      >
        <SettingsCard title="Uso de Recursos" icon={ArrowRightIcon}>
          <div className="space-y-4">
            {usage.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.current.toLocaleString()} / {item.limit.toLocaleString()}
                    {item.unit && ` ${item.unit}`}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* All Plans */}
      <SettingsSection
        title="Planos Disponíveis"
        description="Escolha o plano ideal para sua agência"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrent = plan.name === currentPlan.name
            return (
              <SettingsCard title={plan.name}
                key={plan.name}
                className={
                  plan.popular
                    ? "border-primary ring-2 ring-primary/20"
                    : undefined
                }
              >
                <div className="space-y-4">
                  {plan.popular && (
                    <Badge className="w-fit">Mais Popular</Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <HugeiconsIcon icon={Icon} className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-heading font-semibold">
                      {plan.name}
                    </h3>
                  </div>
                  <div>
                <p className="text-xs font-heading font-bold">
                      R$ {plan.price}
                    </p>
                    <p className="text-xs text-muted-foreground">por mês</p>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    {plan.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-xs"
                      >
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant={isCurrent ? "outline" : "default"}
                    className="w-full"
                    disabled={isCurrent}
                  >
                    {isCurrent ? "Plano Atual" : "Fazer Upgrade"}
                  </Button>
                </div>
              </SettingsCard>
            )
          })}
        </div>
      </SettingsSection>

      {/* Payment Method */}
      <SettingsSection
        title="Método de Pagamento"
        description="Cartões e formas de pagamento"
      >
        <SettingsCard title="Cartão de Crédito" icon={CreditCardIcon}>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  <HugeiconsIcon icon={CreditCardIcon} className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium">Visa •••• 4242</p>
                  <p className="text-xs text-muted-foreground">
                    Expira em 12/2028
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500">
                Padrão
              </Badge>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline">Atualizar Cartão</Button>
              <Button variant="outline">Adicionar Cartão</Button>
            </div>
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Invoices */}
      <SettingsSection
        title="Histórico de Faturas"
        description="Suas faturas e recibos"
      >
        <SettingsCard title="Faturas">
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-xs font-medium">{invoice.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-medium">
                      R$ {invoice.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3 w-3" />
                      <span>Pago</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <HugeiconsIcon icon={DownloadIcon} className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection
        title="Cancelar Assinatura"
        description="Encerre sua conta a qualquer momento"
      >
        <SettingsCard title="Zona de Perigo">
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
              <p className="text-xs text-red-900 dark:text-red-100">
                Ao cancelar sua assinatura, você perderá acesso a todos os recursos
                do plano atual ao final do período de cobrança.
              </p>
            </div>
            <Button variant="destructive">Cancelar Assinatura</Button>
          </div>
        </SettingsCard>
      </SettingsSection>
    </div>
  )
}
