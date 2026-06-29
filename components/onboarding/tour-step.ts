export interface TourStep {
  id: string
  target: string
  title: string
  description: string
  position: "top" | "bottom" | "left" | "right"
  icon?: string
  action?: {
    label: string
    href: string
  }
}

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: "sidebar",
    target: "[data-tour='sidebar']",
    title: "Navegação Principal",
    description: "Aqui fica todo o menu de navegação. Clique em qualquer item para acessar as funcionalidades.",
    position: "right"
  },
  {
    id: "dashboard",
    target: "[data-tour='dashboard-kpis']",
    title: "Seus KPIs em Tempo Real",
    description: "Acompanhe MRR, clientes ativos, taxa de conversão e satisfação atualizados em tempo real.",
    position: "bottom"
  },
  {
    id: "inbox",
    target: "[data-tour='inbox-link']",
    title: "Caixa de Entrada Unificada",
    description: "Todas as mensagens dos seus canais (WhatsApp, Instagram, Web) em um só lugar.",
    position: "right",
    action: { label: "Ver Inbox", href: "/inbox" }
  },
  {
    id: "clients",
    target: "[data-tour='clients-link']",
    title: "CRM de Clientes",
    description: "Gerencie todos os seus clientes, contratos, tarefas e aprovações em um painel completo.",
    position: "right",
    action: { label: "Ver Clientes", href: "/clients" }
  },
  {
    id: "quick-actions",
    target: "[data-tour='quick-actions']",
    title: "Ações Rápidas",
    description: "Botão mágico para criar propostas, contratos, agendar reuniões e muito mais com um clique.",
    position: "left"
  },
  {
    id: "settings",
    target: "[data-tour='settings-link']",
    title: "Configurações da Agência",
    description: "Personalize sua marca, dados jurídicos, integrações e portal do cliente.",
    position: "right",
    action: { label: "Configurar", href: "/settings/agency" }
  }
]
