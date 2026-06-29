"use client"

import React, { useState, useEffect, useRef } from "react"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  File01Icon,
  UserAdd01Icon,
  CheckmarkBadge01Icon,
  Invoice01Icon,
  Calendar01Icon,
  StarIcon,
  ChartBarLineIcon,
  ClipboardIcon,
  RefreshIcon,
  Search01Icon,
  Building03Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface Service {
  id: string
  name: string
  price: string
  billing: string
  description?: string
}

interface ProjectTask {
  id: string
  title: string
  status: "todo" | "in_progress" | "done"
}

interface QuickActionModalsProps {
  activeActionId: string | null
  onClose: () => void
  conversation: any
  onSuccess: (generatedText: string) => void
}

export function QuickActionModals({
  activeActionId,
  onClose,
  conversation,
  onSuccess,
}: QuickActionModalsProps) {
  const isOpen = !!activeActionId
  const clientId = conversation?.clientId
  const leadId = conversation?.leadId
  const contactName = conversation?.contactName || ""
  const contactPhone = conversation?.contactIdentifier
    ? conversation.contactIdentifier.replace(/@c\.us$/, "")
    : ""

  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Enviar Proposta Comercial (Client)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({})
  const [proposalNotes, setProposalNotes] = useState("")
  const [clientScopes, setClientScopes] = useState<any[]>([])
  const [proposalTab, setProposalTab] = useState<"active" | "catalog">("active")

  // 2. Enviar Serviços (Client)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])

  // 3. Enviar Contrato (Client)
  const [contractName, setContractName] = useState("Contrato de Prestação de Serviços")
  const [contractLink, setContractLink] = useState("")
  const [contractNotes, setContractNotes] = useState("")
  const [customContractContent, setCustomContractContent] = useState("")

  // 4. Solicitar Pagamento (Client)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDesc, setPaymentDesc] = useState("")
  const [paymentMonth, setPaymentMonth] = useState("")
  const [sendPaymentAsInteractive, setSendPaymentAsInteractive] = useState(false)

  // 5. Agendar Reunião (Client)
  const [meetingPlatform, setMeetingPlatform] = useState("Google Meet")
  const [calendarLink, setCalendarLink] = useState(`https://cal.com/agencia/${conversation?.id || "reuniao"}`)
  const [meetingTitle, setMeetingTitle] = useState("Reunião de Alinhamento")
  const [meetingDate, setMeetingDate] = useState("")
  const [sendMeetingAsInteractive, setSendMeetingAsInteractive] = useState(false)

  // 6. Solicitar NPS (Client)
  const [sendNpsAsInteractive, setSendNpsAsInteractive] = useState(false)

  // 7. Relatório de Resultados (Client)
  const [reportMonth, setReportMonth] = useState("")
  const [reportLink, setReportLink] = useState("")

  // 8. Form de Briefing (Client)
  const briefingPortalLink = clientId ? `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/portal/${conversation?.userId || "agencia"}/briefing/${clientId}` : `https://agencia.app/briefing/${clientId || "novo"}`
  const [briefingLink, setBriefingLink] = useState(briefingPortalLink)

  // 9. Atualizar Status (Client)
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([])
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])

  // 10. Solicitar Aprovação (Client)
  const [approvalTitle, setApprovalTitle] = useState("")
  const [approvalDesc, setApprovalDesc] = useState("")
  const [approvalFileUrl, setApprovalFileUrl] = useState("")
  const [approvalFileType, setApprovalFileType] = useState<"design" | "copy" | "page" | "other">("other")
  const [sendApprovalAsInteractive, setSendApprovalAsInteractive] = useState(false)

  // Leads
  // 11. Qualificar Lead (Lead)
  const [leadStatus, setLeadStatus] = useState("lead")
  const [leadValue, setLeadValue] = useState("")
  const [leadNotes, setLeadNotes] = useState("")
  const [sendLeadAsInteractive, setSendLeadAsInteractive] = useState(false)

  // 12. Tornar Cliente (Lead)
  const [clientCompanyName, setClientCompanyName] = useState("")
  const [clientIndustry, setClientIndustry] = useState("")
  const [clientContactName, setClientContactName] = useState(contactName)
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState(contactPhone)
  const [clientDocument, setClientDocument] = useState("")
  const [clientMrr, setClientMrr] = useState("")
  const [clientProjects, setClientProjects] = useState("1")

  // Common Loading
  const [loading, setLoading] = useState(false)

  // Fetch initial data based on actionId
  useEffect(() => {
    if (!isOpen) return

    if (activeActionId === "send_proposal" || activeActionId === "send_services") {
      fetch("/api/services")
        .then((r) => r.json())
        .then((data) => {
          setServices(data || [])
          if (data && data.length > 0) {
            // Default select the first one
            setSelectedServices([data[0].id])
            setSelectedServiceIds([data[0].id])
            const prices: Record<string, string> = {}
            data.forEach((s: Service) => {
              prices[s.id] = s.price
            })
            setCustomPrices(prices)
          }
        })
        .catch(() => toast.error("Erro ao carregar serviços"))
    }

    if (activeActionId === "send_proposal" && clientId) {
      fetch(`/api/client-portal/scope?clientId=${clientId}`)
        .then((r) => r.json())
        .then((data) => {
          const activeOnly = (data || []).filter((s: any) => (s.status || "active") === "active")
          setClientScopes(activeOnly)
          if (activeOnly.length > 0) {
            setProposalTab("active")
            setSelectedServices(activeOnly.map((s: any) => s.id))
          } else {
            setProposalTab("catalog")
          }
        })
        .catch(() => {})
    }

    if (activeActionId === "update_status" && clientId) {
      fetch(`/api/client-portal/tasks?clientId=${clientId}`)
        .then((r) => r.json())
        .then((data) => {
          setProjectTasks(data || [])
          // Pre-select completed/in_progress tasks
          setSelectedTasks((data || []).map((t: ProjectTask) => t.id))
        })
        .catch(() => toast.error("Erro ao carregar tarefas do projeto"))
    }
  }, [activeActionId, isOpen, clientId])

  // GSAP animations for staggers inside the active modal
  useGSAP(() => {
    if (isOpen && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".stagger-in"),
        { opacity: 0, y: 15, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "back.out(1.2)",
          delay: 0.1,
        }
      )
    }
  }, [activeActionId, isOpen])

  const handleConvertClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientCompanyName.trim()) {
      toast.error("Nome da empresa é obrigatório")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/inbox/quick-actions/convert-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          conversationId: conversation?.id,
          name: clientCompanyName,
          industry: clientIndustry,
          contactName: clientContactName,
          contactEmail: clientEmail,
          contactPhone: clientPhone,
          document: clientDocument,
          mrr: clientMrr,
          projects: clientProjects,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao converter lead")

      toast.success("Lead convertido em cliente com sucesso!")
      onSuccess(
        `🎉 *Seja muito bem-vindo!* Seu cadastro de cliente para a empresa *${clientCompanyName}* foi formalizado no sistema. O portal do cliente já está ativo!`
      )
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao converter lead")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      let proposalText = ""

      if (proposalTab === "active") {
        const selectedList = clientScopes.filter(s => selectedServices.includes(s.id))
        if (selectedList.length === 0) {
          toast.error("Selecione ao menos um serviço ativo")
          setLoading(false)
          return
        }

        const formatted = selectedList
          .map((s) => {
            const priceVal = parseFloat(s.price || "0").toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            const periodMap: Record<string, string> = { mensal: "mensal", anual: "anual", unico: "pagamento único" }
            const billingPeriod = periodMap[s.billing || "mensal"] || s.billing || "mensal"
            return `- *${s.label}*: ${priceVal} (${billingPeriod})`
          })
          .join("\n")

        const portalLink = `/portal/${conversation?.userId || "agency"}/projetos`
        proposalText = `Olá, *${contactName}*! Segue a formalização da proposta comercial com base nos serviços ativos em seu projeto:\n\n*Serviços Ativos:*\n${formatted}\n\nVocê pode visualizar e aprovar os detalhes diretamente no seu portal: http://localhost:3000${portalLink}`
        toast.success("Proposta comercial gerada a partir dos serviços ativos!")
      } else {
        if (selectedServices.length === 0) {
          toast.error("Selecione ao menos um serviço")
          setLoading(false)
          return
        }

        const res = await fetch("/api/inbox/quick-actions/create-proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            serviceIds: selectedServices,
            customPrices,
            notes: proposalNotes,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erro ao criar proposta")

        const portalLink = `/portal/${conversation?.userId || "agency"}/projetos`
        proposalText = `Olá, *${contactName}*! Segue a nossa proposta comercial detalhada para sua análise:\n\n*Serviços Selecionados:*\n${data.services
          .map((s: any) => `- *${s.name}*: R$ ${customPrices[s.id] || s.price} (${s.billing})`)
          .join("\n")}\n\nVocê pode visualizar os detalhes e aprovar diretamente no seu portal: http://localhost:3000${portalLink}`
        toast.success("Proposta comercial gerada e integrada!")
      }

      onSuccess(proposalText)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar proposta")
    } finally {
      setLoading(false)
    }
  }

  const handleSendServices = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedServiceIds.length === 0) {
      toast.error("Selecione ao menos um serviço")
      return
    }

    const selectedList = services.filter((s) => selectedServiceIds.includes(s.id))
    const formatted = `Olá! Conforme conversamos, aqui está a nossa lista completa de serviços selecionados e os preços atuais:\n\n${selectedList
      .map((s) => `*${s.name}*\nPreço: R$ ${s.price} (${s.billing})\n${s.description ? `${s.description}\n` : ""}`)
      .join("\n")}Qualquer dúvida ou para darmos início, por favor me avise!`

    onSuccess(formatted)
    onClose()
  }

  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!approvalTitle.trim()) {
      toast.error("Título do material é obrigatório")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/client-portal/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          userId: conversation?.userId,
          title: approvalTitle,
          description: approvalDesc,
          fileUrl: approvalFileUrl,
          fileType: approvalFileType,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar solicitação")

      let text = ""
      if (sendApprovalAsInteractive) {
        const interactiveRes = await fetch("/api/inbox/quick-actions/send-interactive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            messageBody: `Material para aprovação: ${approvalTitle}${approvalDesc ? `\n\n${approvalDesc}` : ""}${approvalFileUrl ? `\n\nVisualizar: ${approvalFileUrl}` : ""}`,
            buttonText: "Selecionar opção",
            sections: [{ title: "Aprovação", rows: [{ id: "approved", title: "Aprovado sem ajustes!", description: "Material aprovado" }, { id: "revision", title: "Preciso de alterações", description: "Revisar material" }] }],
          }),
        })
        if (!interactiveRes.ok) {
          const errData = await interactiveRes.json().catch(() => ({}))
          throw new Error(errData.error || "Erro ao enviar mensagem interativa")
        }

        text = `📢 *Solicitação de Aprovação enviada via WhatsApp*\n\n*Material:* ${approvalTitle}\n${
          approvalDesc ? `*Descrição:* ${approvalDesc}\n` : ""
        }${approvalFileUrl ? `*Visualizar material:* ${approvalFileUrl}\n` : ""}`
      } else {
        const portalLink = `/portal/${conversation?.userId || "agency"}/projetos`
        text = `📢 *Nova Solicitação de Aprovação*\n\n*Material:* ${approvalTitle}\n${
          approvalDesc ? `*Descrição:* ${approvalDesc}\n` : ""
        }${approvalFileUrl ? `*Visualizar material:* ${approvalFileUrl}\n` : ""}\nPor favor, revise o material e responda aprovando diretamente no seu portal: http://localhost:3000${portalLink}`
      }

      toast.success("Aprovação criada e integrada!")
      onSuccess(text)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar aprovação")
    } finally {
      setLoading(false)
    }
  }

  const handleQualifyLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadId) {
      toast.error("Nenhum lead associado a este chat")
      return
    }

    setLoading(true)
    try {
      let text = ""
      if (sendLeadAsInteractive) {
        const interactiveRes = await fetch("/api/inbox/quick-actions/send-interactive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: null,
            contactPhone,
            messageBody: "Qual o orçamento estimado para o seu projeto?",
            buttonText: "Selecionar faixa",
            sections: [{ title: "Orçamento", rows: [{ id: "budget_3k", title: "Até R$ 3k/mês" }, { id: "budget_3k_6k", title: "R$ 3k a R$ 6k/mês" }, { id: "budget_6k_plus", title: "Acima de R$ 6k/mês" }] }],
          }),
        })
        if (!interactiveRes.ok) {
          const errData = await interactiveRes.json().catch(() => ({}))
          throw new Error(errData.error || "Erro ao enviar mensagem interativa")
        }

        text = `📊 *Qualificação de Lead enviada via WhatsApp*\n\nPergunta: "Qual o orçamento estimado para o seu projeto?"`
      } else {
        const res = await fetch(`/api/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: leadStatus,
            value: leadValue ? parseFloat(leadValue) : 0,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erro ao qualificar lead")

        text = `Olá, *${contactName}*! Fiquei muito feliz em conhecer seu projeto. Analisei suas necessidades e já registrei no sistema com status *${leadStatus.toUpperCase()}* e valor de R$ ${leadValue || "0"}. Em breve enviarei a proposta!`
      }

      toast.success("Lead qualificado com sucesso!")
      onSuccess(text)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao qualificar lead")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault()
    const activeTasks = projectTasks.filter((t) => selectedTasks.includes(t.id))
    const doneTasks = activeTasks.filter((t) => t.status === "done")
    const progressTasks = activeTasks.filter((t) => t.status === "in_progress")

    const text = `Passando para te enviar uma atualização rápida sobre o status das tarefas do seu projeto:\n\n${
      doneTasks.length > 0
        ? `*Concluídas:*\n${doneTasks.map((t) => `[x] *${t.title}*`).join("\n")}\n\n`
        : ""
    }${
      progressTasks.length > 0
        ? `*Em Andamento:*\n${progressTasks.map((t) => `[/] *${t.title}*`).join("\n")}\n\n`
        : ""
    }O andamento detalhado e cronograma geral do seu projeto pode ser acompanhado direto em seu portal!`

    onSuccess(text)
    onClose()
  }

  const handleSendContract = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/client-portal/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          userId: conversation?.userId,
          title: contractName,
          customContent: customContractContent || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar contrato")

      const baseOrigin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const portalLink = `/portal/${conversation?.userId || "agency"}/contrato/${data.id}`
      const text = `Olá! Segue o link do contrato comercial para análise e assinatura digital:\n\nDocumento: *${contractName}*\nAssinar eletronicamente em: ${baseOrigin}${portalLink}`

      toast.success("Contrato gerado com sucesso!")
      onSuccess(text)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar contrato")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentAmount) {
      toast.error("Valor é obrigatório")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/client-portal/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          userId: conversation?.userId,
          name: `Fatura - ${paymentDesc || "Faturamento"}`,
          category: "other",
          notes: `Valor solicitado: R$ ${paymentAmount} referente a ${paymentDesc || "serviço"}. Competência: ${paymentMonth}`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao registrar faturamento")

      let text = ""
      if (sendPaymentAsInteractive) {
        const interactiveRes = await fetch("/api/inbox/quick-actions/send-interactive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            messageBody: `Como prefere receber a fatura de R$ ${paymentAmount} (${paymentDesc || "faturamento"})?`,
            buttonText: "Selecionar forma de pagamento",
            sections: [{ title: "Pagamento", rows: [{ id: "pix", title: "Pix", description: "Transferência instantânea" }, { id: "boleto", title: "Boleto Bancário", description: "Pagamento com vencimento" }, { id: "cartao", title: "Cartão de Crédito", description: "Parcelamento disponível" }] }],
          }),
        })
        if (!interactiveRes.ok) {
          const errData = await interactiveRes.json().catch(() => ({}))
          throw new Error(errData.error || "Erro ao enviar mensagem interativa")
        }

        text = `⚡ *Faturamento de R$ ${paymentAmount} gerado.*\nMensagem interativa enviada no WhatsApp para selecionar a forma de pagamento!`
      } else {
        text = `Olá! A fatura referente a *${paymentDesc || "serviço"}* no valor de *R$ ${paymentAmount}* já está gerada. Você pode efetuar o pagamento clicando no link a seguir:\n\nFatura/Pix: R$ ${paymentAmount}\nLink: [LINK DO PAGAMENTO/FATURA]`
      }

      toast.success("Solicitação de pagamento registrada!")
      onSuccess(text)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar faturamento")
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingDate) {
      toast.error("Data da reunião é obrigatória")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/client-portal/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          userId: conversation?.userId,
          title: meetingTitle,
          meetingDate,
          platform: meetingPlatform,
          meetingLink: calendarLink || null,
          sendAsWppPoll: sendMeetingAsInteractive,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao agendar reunião")

      let text = ""
      if (sendMeetingAsInteractive) {
        text = `📅 *Agendamento de Call Solicitado via WhatsApp*\n\n*Assunto:* ${meetingTitle}\n*Data sugerida:* ${new Date(meetingDate).toLocaleString("pt-BR")}\n*Plataforma:* ${meetingPlatform}\n\nMensagem interativa de confirmação enviada para o cliente no WhatsApp!`
      } else {
        text = `Olá! Agendei uma call rápida via *${meetingPlatform}* para alinharmos os próximos passos:\n\n*Assunto:* ${meetingTitle}\n*Data/Hora:* ${new Date(meetingDate).toLocaleString("pt-BR")}\nLink/Agenda: ${calendarLink || "Disponível no Portal"}`
      }

      toast.success("Reunião agendada com sucesso!")
      onSuccess(text)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao agendar reunião")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sendNpsAsInteractive) {
      setLoading(true)
      try {
        const res = await fetch("/api/inbox/quick-actions/send-interactive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            messageBody: "Como você avalia nossa parceria neste mês?",
            buttonText: "Selecionar nota",
            sections: [{ title: "Avaliação", rows: [{ id: "nps_10", title: "10 - Excelente" }, { id: "nps_8_9", title: "8 a 9 - Muito Bom" }, { id: "nps_6_7", title: "6 a 7 - Bom" }, { id: "nps_below_5", title: "Abaixo de 5 - Precisa Melhorar" }] }],
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erro ao enviar mensagem interativa NPS")

        toast.success("Mensagem interativa NPS enviada com sucesso!")
        onSuccess(`📊 *Pesquisa NPS Enviada via WhatsApp*\n\nPergunta: "Como você avalia nossa parceria neste mês?"`)
        onClose()
      } catch (err: any) {
        toast.error(err.message || "Erro ao enviar enquete NPS")
      } finally {
        setLoading(false)
      }
    } else {
      const text = `Olá! Como estamos indo? Adoraríamos ouvir o seu feedback rápido sobre a qualidade de nossos serviços. É super rápido e nos ajuda a melhorar:\n\nLink da Pesquisa NPS: http://localhost:3000/portal/feedback`
      onSuccess(text)
      onClose()
    }
  }

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/client-portal/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          userId: conversation?.userId,
          name: `Relatório de Resultados - ${reportMonth}`,
          category: "report",
          linkUrl: reportLink,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao criar relatório")

      const text = `Olá! O seu relatório de resultados mensal referente a *${reportMonth}* já foi gerado e integrado no seu portal. Você pode analisá-lo no link abaixo:\n\nRelatório: ${reportLink || "Disponível no Portal"}`

      toast.success("Relatório anexado ao CRM!")
      onSuccess(text)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar relatório")
    } finally {
      setLoading(false)
    }
  }

  const handleSendBriefing = (e: React.FormEvent) => {
    e.preventDefault()
    const text = `Para iniciarmos o desenvolvimento do projeto com pé direito, por favor preencha este formulário rápido de briefing com as principais informações:\n\nFormulário de Briefing: ${briefingLink}`
    onSuccess(text)
    onClose()
  }

  const handleSendPitch = (e: React.FormEvent) => {
    e.preventDefault()
    const text = `Muito prazer! Somos a Kyper Agência, focados em desenvolver e acelerar negócios digitais. Segue o link com a nossa apresentação completa explicativa:\n\nPitch/Apresentação: https://kyper.app/pitch-kyper`
    onSuccess(text)
    onClose()
  }

  const handleScheduleDiscovery = (e: React.FormEvent) => {
    e.preventDefault()
    const text = `Olá! Vamos bater um papo rápido de 15 minutos para entendermos a sua necessidade e desenharmos a melhor proposta? Você pode agendar o melhor horário aqui:\n\nAgenda Discovery: https://cal.com/kyper/discovery`
    onSuccess(text)
    onClose()
  }

  // Render modal content conditionally based on activeActionId
  const renderModalContent = () => {
    switch (activeActionId) {
      case "convert_client":
        return (
          <form onSubmit={handleConvertClient} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={UserAdd01Icon} className="size-5 text-green-500" />
                Tornar Cliente
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Preencha os dados cadastrais para converter este Lead em Cliente e habilitar a Área do Cliente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-3 stagger-in">
              <div className="grid gap-1.5 col-span-2">
                <Label htmlFor="comp-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Nome da Empresa / Razão Social
                </Label>
                <Input
                  id="comp-name"
                  type="text"
                  required
                  value={clientCompanyName}
                  onChange={(e) => setClientCompanyName(e.target.value)}
                  placeholder="Empresa Ltda"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="industry" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Setor / Indústria
                </Label>
                <Input
                  id="industry"
                  type="text"
                  value={clientIndustry}
                  onChange={(e) => setClientIndustry(e.target.value)}
                  placeholder="Marketing, Saúde..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="document" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  CNPJ ou CPF
                </Label>
                <Input
                  id="document"
                  type="text"
                  value={clientDocument}
                  onChange={(e) => setClientDocument(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cont-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Nome do Contato
                </Label>
                <Input
                  id="cont-name"
                  type="text"
                  value={clientContactName}
                  onChange={(e) => setClientContactName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  E-mail de Contato
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="5511999999999"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mrr" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  MRR acordado
                </Label>
                <Input
                  id="mrr"
                  type="text"
                  value={clientMrr}
                  onChange={(e) => setClientMrr(e.target.value)}
                  placeholder="5000"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" disabled={loading} className="rounded-xl text-xs h-9">
                {loading ? "Cadastrando..." : "Confirmar e Converter"}
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "qualify_lead":
        return (
          <form onSubmit={handleQualifyLead} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={Search01Icon} className="size-5 text-primary" />
                Qualificar Lead
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Atualize a qualificação do lead de acordo com a conversa atual.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3.5 stagger-in">
              <div className="grid gap-1.5">
                <Label htmlFor="lead-status" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Funil / Status do Lead
                </Label>
                <select
                  id="lead-status"
                  value={leadStatus}
                  onChange={(e) => setLeadStatus(e.target.value)}
                  className="w-full h-9 bg-muted/10 border border-border/40 rounded-xl text-xs px-3 focus:outline-none"
                >
                  <option value="lead">Lead Inicial</option>
                  <option value="qualified">Qualificado (Interesse Real)</option>
                  <option value="won">Ganho (Convertido)</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-value" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Valor Estimado (R$)
                </Label>
                <Input
                  id="lead-value"
                  type="number"
                  value={leadValue}
                  onChange={(e) => setLeadValue(e.target.value)}
                  placeholder="3000"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" disabled={loading} className="rounded-xl text-xs h-9">
                {loading ? "Salvando..." : "Qualificar e Injetar Mensagem"}
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "send_proposal":
        return (
          <form onSubmit={handleCreateProposal} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={File01Icon} className="size-5 text-primary" />
                Criar Proposta Comercial
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Selecione os serviços que farão parte da proposta comercial para gerar a fatura/contrato.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {clientScopes.length > 0 && (
              <div className="flex bg-muted/20 p-1 rounded-xl w-fit border border-border/30 mb-2 stagger-in">
                <button
                  type="button"
                  onClick={() => {
                    setProposalTab("active")
                    setSelectedServices(clientScopes.map(s => s.id))
                  }}
                  className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition-all duration-300 ${
                    proposalTab === "active"
                      ? "bg-card text-foreground shadow-sm ring-1 ring-border/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Serviços Ativos ({clientScopes.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProposalTab("catalog")
                    setSelectedServices([])
                  }}
                  className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition-all duration-300 ${
                    proposalTab === "catalog"
                      ? "bg-card text-foreground shadow-sm ring-1 ring-border/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Catálogo Geral ({services.length})
                </button>
              </div>
            )}

            <div className="space-y-3 stagger-in max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {proposalTab === "active" ? (
                clientScopes.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedServices((prev) =>
                        prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                      )
                    }}
                    className={`p-3 border rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                      selectedServices.includes(s.id)
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border/40 hover:bg-muted/15"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        Valor: {parseFloat(s.price || "0").toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-muted-foreground capitalize font-mono">{s.billing}</span>
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(s.id)}
                        onChange={() => {}}
                        className="size-3.5 accent-primary cursor-pointer animate-in zoom-in-50"
                      />
                    </div>
                  </div>
                ))
              ) : (
                services.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedServices((prev) =>
                        prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                      )
                    }}
                    className={`p-3 border rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                      selectedServices.includes(s.id)
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border/40 hover:bg-muted/15"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{s.description || "Sem descrição"}</p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-muted-foreground font-mono">{s.billing}</span>
                      <Input
                        type="text"
                        value={customPrices[s.id] || s.price}
                        onChange={(e) => {
                          setCustomPrices((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }}
                        className="w-20 h-7 text-[11px] px-1 bg-background text-right font-mono"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="grid gap-1.5 stagger-in">
              <Label htmlFor="prop-notes" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Observações Adicionais
              </Label>
              <Textarea
                id="prop-notes"
                value={proposalNotes}
                onChange={(e) => setProposalNotes(e.target.value)}
                placeholder="Ex: Condições de pagamento, descontos..."
                className="bg-muted/10 border-border/40 text-xs rounded-xl h-14 min-h-0"
              />
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" disabled={loading} className="rounded-xl text-xs h-9">
                {loading ? "Gerando..." : "Gerar Proposta Comercial"}
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "send_services":
        return (
          <form onSubmit={handleSendServices} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-5 text-primary" />
                Enviar Lista de Serviços
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Selecione os serviços que você deseja listar para enviar na mensagem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 stagger-in max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedServiceIds((prev) =>
                      prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                    )
                  }}
                  className={`p-2.5 border rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                    selectedServiceIds.includes(s.id)
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/40 hover:bg-muted/15"
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">R$ {s.price} ({s.billing})</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(s.id)}
                    onChange={() => {}}
                    className="size-3.5 accent-primary cursor-pointer"
                  />
                </div>
              ))}
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" className="rounded-xl text-xs h-9">
                Injetar no Chat
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "request_approval":
        return (
          <form onSubmit={handleCreateApproval} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-primary" />
                Solicitar Aprovação de Material
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Cadastre um material para aprovação do cliente. Ele será notificado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3 stagger-in">
              <div className="grid gap-1.5">
                <Label htmlFor="app-title" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Título do Material
                </Label>
                <Input
                  id="app-title"
                  type="text"
                  required
                  value={approvalTitle}
                  onChange={(e) => setApprovalTitle(e.target.value)}
                  placeholder="Layout do site v1, Copy do anúncio..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="app-desc" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Descrição / Instruções
                </Label>
                <Textarea
                  id="app-desc"
                  value={approvalDesc}
                  onChange={(e) => setApprovalDesc(e.target.value)}
                  placeholder="Instruções para o cliente sobre o que avaliar..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl h-14 min-h-0"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="app-url" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Link do Arquivo / Figma
                  </Label>
                  <Input
                    id="app-url"
                    type="url"
                    value={approvalFileUrl}
                    onChange={(e) => setApprovalFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-muted/10 border-border/40 text-xs rounded-xl"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="app-type" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Tipo do Arquivo
                  </Label>
                  <select
                    id="app-type"
                    value={approvalFileType}
                    onChange={(e: any) => setApprovalFileType(e.target.value)}
                    className="h-9 bg-muted/10 border border-border/40 rounded-xl text-xs px-2 focus:outline-none"
                  >
                    <option value="design">Design / Imagem</option>
                    <option value="copy">Redação / Copy</option>
                    <option value="page">Página Web / Dev</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="app-send-poll"
                  type="checkbox"
                  checked={sendApprovalAsInteractive}
                  onChange={(e) => setSendApprovalAsInteractive(e.target.checked)}
                  className="size-4 accent-primary cursor-pointer rounded"
                />
                <Label htmlFor="app-send-poll" className="text-xs text-foreground cursor-pointer select-none">
                  Enviar mensagem interativa de aprovação no WhatsApp
                </Label>
              </div>
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" disabled={loading} className="rounded-xl text-xs h-9">
                {loading ? "Cadastrando..." : "Cadastrar e Injetar Solicitação"}
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "update_status":
        return (
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={RefreshIcon} className="size-5 text-primary" />
                Atualizar Status do Projeto
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Selecione as tarefas do projeto para enviar uma atualização rápida sobre o progresso.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 stagger-in max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {projectTasks.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma tarefa encontrada para este projeto.</p>
              ) : (
                projectTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTasks((prev) =>
                        prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                      )
                    }}
                    className={`p-2.5 border rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                      selectedTasks.includes(t.id)
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/40 hover:bg-muted/15"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.title}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        t.status === "done"
                          ? "bg-green-500/10 text-green-500 ring-1 ring-green-500/20"
                          : t.status === "in_progress"
                          ? "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {t.status === "done" ? "Concluído" : t.status === "in_progress" ? "Em Andamento" : "Pendente"}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(t.id)}
                      onChange={() => {}}
                      className="size-3.5 accent-primary cursor-pointer"
                    />
                  </div>
                ))
              )}
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" disabled={projectTasks.length === 0} className="rounded-xl text-xs h-9">
                Gerar Relatório de Status
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "send_contract":
        return (
          <form onSubmit={handleSendContract} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={File01Icon} className="size-5 text-primary" />
                Enviar Contrato Comercial
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Cadastre o contrato comercial no CRM do cliente para gerar o link de assinatura.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3 stagger-in">
              <div className="grid gap-1.5">
                <Label htmlFor="contr-name" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Nome do Documento / Contrato
                </Label>
                <Input
                  id="contr-name"
                  type="text"
                  required
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  placeholder="Contrato de Prestação de Serviços..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contr-custom-content" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Conteúdo do Contrato (Opcional - Deixe vazio para usar o modelo padrão com serviços ativos)
                </Label>
                <Textarea
                  id="contr-custom-content"
                  value={customContractContent}
                  onChange={(e) => setCustomContractContent(e.target.value)}
                  placeholder="Se preferir, insira aqui o texto integral do contrato..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl h-24 min-h-0"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contr-notes" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Notas de Observação / Termos Adicionais
                </Label>
                <Textarea
                  id="contr-notes"
                  value={contractNotes}
                  onChange={(e) => setContractNotes(e.target.value)}
                  placeholder="Anotações internas..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl h-14 min-h-0"
                />
              </div>
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" disabled={loading} className="rounded-xl text-xs h-9">
                {loading ? "Salvando..." : "Cadastrar e Gerar Mensagem"}
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "request_payment":
        return (
          <form onSubmit={handleRequestPayment} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={Invoice01Icon} className="size-5 text-primary" />
                Solicitar Pagamento
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Gere uma solicitação de pagamento/fatura integrada no CRM.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-3 stagger-in">
              <div className="grid gap-1.5">
                <Label htmlFor="pay-val" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Valor da Fatura (R$)
                </Label>
                <Input
                  id="pay-val"
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="2500"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pay-month" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Mês de Referência (Competência)
                </Label>
                <Input
                  id="pay-month"
                  type="text"
                  value={paymentMonth}
                  onChange={(e) => setPaymentMonth(e.target.value)}
                  placeholder="Junho / 2026"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5 col-span-2">
                <Label htmlFor="pay-desc" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Descrição do Serviço
                </Label>
                <Input
                  id="pay-desc"
                  type="text"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  placeholder="MRR Mensal, Desenvolvimento de Landing Page..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 col-span-2">
                <input
                  id="pay-send-poll"
                  type="checkbox"
                  checked={sendPaymentAsInteractive}
                  onChange={(e) => setSendPaymentAsInteractive(e.target.checked)}
                  className="size-4 accent-primary cursor-pointer rounded"
                />
                <Label htmlFor="pay-send-poll" className="text-xs text-foreground cursor-pointer select-none">
                  Enviar mensagem interativa de preferência de pagamento no WhatsApp
                </Label>
              </div>
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" disabled={loading} className="rounded-xl text-xs h-9">
                {loading ? "Cadastrando..." : "Confirmar e Injetar Fatura"}
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "schedule_meeting":
        return (
          <form onSubmit={handleScheduleMeeting} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={Calendar01Icon} className="size-5 text-primary" />
                Agendar Reunião / Call
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Gere um convite com seu link da agenda (Cal.com ou Google Meet).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3.5 stagger-in">
              <div className="grid gap-1.5">
                <Label htmlFor="meet-title" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Assunto da Reunião / Call
                </Label>
                <Input
                  id="meet-title"
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Reunião de Alinhamento Semanal..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="meet-plat" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Plataforma
                  </Label>
                  <Input
                    id="meet-plat"
                    type="text"
                    value={meetingPlatform}
                    onChange={(e) => setMeetingPlatform(e.target.value)}
                    placeholder="Google Meet"
                    className="bg-muted/10 border-border/40 text-xs rounded-xl"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="meet-date" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Data e Horário Sugerido
                  </Label>
                  <Input
                    id="meet-date"
                    type="datetime-local"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="bg-muted/10 border-border/40 text-xs rounded-xl h-10"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="meet-link" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Link da Reunião (Opcional se usar Enquete)
                </Label>
                <Input
                  id="meet-link"
                  type="url"
                  value={calendarLink}
                  onChange={(e) => setCalendarLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  id="meet-send-poll"
                  type="checkbox"
                  checked={sendMeetingAsInteractive}
                  onChange={(e) => setSendMeetingAsInteractive(e.target.checked)}
                  className="size-4 accent-primary cursor-pointer rounded"
                />
                <Label htmlFor="meet-send-poll" className="text-xs text-foreground cursor-pointer select-none">
                  Enviar mensagem interativa de confirmação no WhatsApp
                </Label>
              </div>
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" className="rounded-xl text-xs h-9">
                Confirmar e Injetar
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "request_feedback":
        return (
          <form onSubmit={handleRequestFeedback} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={StarIcon} className="size-5 text-primary" />
                Solicitar Avaliação (NPS)
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Gere um convite para o cliente avaliar a parceria diretamente no chat.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center gap-2 px-1 stagger-in">
              <input
                id="nps-send-poll"
                type="checkbox"
                checked={sendNpsAsInteractive}
                onChange={(e) => setSendNpsAsInteractive(e.target.checked)}
                className="size-4 accent-primary cursor-pointer rounded"
              />
              <Label htmlFor="nps-send-poll" className="text-xs text-foreground cursor-pointer select-none">
                Enviar pesquisa NPS interativa no WhatsApp
              </Label>
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" className="rounded-xl text-xs h-9">
                Confirmar e Injetar
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "send_report":
        return (
          <form onSubmit={handleSendReport} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={ChartBarLineIcon} className="size-5 text-primary" />
                Enviar Relatório Mensal
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Cadastre um relatório de resultados para o CRM do cliente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-3 stagger-in">
              <div className="grid gap-1.5">
                <Label htmlFor="rep-month" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Mês de Referência
                </Label>
                <Input
                  id="rep-month"
                  type="text"
                  required
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  placeholder="Junho / 2026"
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rep-link" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Link do Relatório / Looker Studio
                </Label>
                <Input
                  id="rep-link"
                  type="url"
                  required
                  value={reportLink}
                  onChange={(e) => setReportLink(e.target.value)}
                  placeholder="https://..."
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" disabled={loading} className="rounded-xl text-xs h-9">
                {loading ? "Enviando..." : "Anexar e Injetar Relatório"}
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "send_briefing":
        return (
          <form onSubmit={handleSendBriefing} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={ClipboardIcon} className="size-5 text-primary" />
                Enviar Briefing do Projeto
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Gere um convite para o preenchimento de briefing integrado ao portal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3.5 stagger-in">
              <div className="grid gap-1.5">
                <Label htmlFor="brief-link" className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Link do Formulário de Briefing
                </Label>
                <Input
                  id="brief-link"
                  type="url"
                  required
                  value={briefingLink}
                  onChange={(e) => setBriefingLink(e.target.value)}
                  className="bg-muted/10 border-border/40 text-xs rounded-xl"
                />
              </div>
            </div>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" className="rounded-xl text-xs h-9">
                Confirmar e Injetar
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "send_pitch":
        return (
          <form onSubmit={handleSendPitch} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={Building03Icon} className="size-5 text-primary" />
                Enviar Apresentação (Pitch)
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Injeta a apresentação padrão da agência no campo de mensagem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" className="rounded-xl text-xs h-9">
                Injetar no Chat
              </Button>
            </AlertDialogFooter>
          </form>
        )

      case "schedule_discovery":
        return (
          <form onSubmit={handleScheduleDiscovery} className="space-y-4">
            <AlertDialogHeader className="text-left stagger-in">
              <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={Calendar01Icon} className="size-5 text-primary" />
                Agendar Call de Descoberta
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Gera o convite com o link da call de descoberta para o lead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="stagger-in">
              <AlertDialogCancel onClick={onClose} className="rounded-xl text-xs h-9">
                Cancelar
              </AlertDialogCancel>
              <Button type="submit" className="rounded-xl text-xs h-9">
                Injetar no Chat
              </Button>
            </AlertDialogFooter>
          </form>
        )

      default:
        return null
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="p-1.5 ring-1 ring-border rounded-2xl bg-card overflow-hidden shadow-2xl max-w-sm sm:max-w-md">
        <div ref={containerRef} className="p-5 rounded-xl bg-background flex flex-col gap-4">
          {renderModalContent()}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
