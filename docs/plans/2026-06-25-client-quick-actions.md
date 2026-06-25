# Quick Actions - Client Detail Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar um componente de Ações Rápidas na página de detalhes do cliente (`/clients/[id]`) com botões que resolvem problemas reais do dia-a-dia, reduzem cliques e melhoram a qualidade de vida do operador.

**Architecture:** Componente `QuickActions` renderizado entre o header e o grid principal. Ações são baseadas nos dados reais do cliente (telefone, email, status, MRR) e conectam-se às funcionalidades existentes (WhatsApp, propostas, tarefas, notas, portal do cliente).

**Tech Stack:** Next.js App Router, shadcn/ui (base-nova), Tailwind v4, Hugeicons, GSAP.

---

## Design Read

Reading this as: **Authenticated app quick-action bar for agency operators, with a functional/compact language, leaning toward the existing double-bezel system + Plus Jakarta Sans + Space Grotesk.**

**Dial Values:**
- DESIGN_VARIANCE: 4 (compact, functional bar, not decorative)
- MOTION_INTENSITY: 2 (micro-interactions on hover/click only)
- VISUAL_DENSITY: 5 (densely packed but readable action buttons)

---

## Análise: Ações Reais vs. Ruído

Antes de implementar, defini critérios para cada ação ser **realmente útil**:

| Critério | O que significa |
|----------|----------------|
| **Resolve um problema real** | O operador já faz isso frequentemente, mas com muitos cliques |
| **Economiza tempo** | Pelo menos 3+ cliques economizados |
| **Contextual** | A ação faz sentido para o estado atual do cliente |
| **Não duplica** | Não repete funcionalidade já acessível com 1 clique |

### Ações Selecionadas (7 botões):

| # | Ação | Por que é útil | Economia de cliques |
|---|------|----------------|---------------------|
| 1 | **WhatsApp** | Abre conversa com mensagem pré-preenchida. Operadores abrem WhatsApp dezenas de vezes por dia. | 4-5 cliques → 1 |
| 2 | **Gerar Proposta IA** | Gera proposta comercial personalizada em 1 clique. Atalho para o modal que já existe. | 3 cliques → 1 |
| 3 | **Criar Tarefa** | Abre modal de tarefa rápida sem navegar para o Kanban. | 2-3 cliques → 1 |
| 4 | **Solicitar Aprovação** | Abre modal de aprovação diretamente. Essencial no fluxo de entrega. | 3 cliques → 1 |
| 5 | **Portal do Cliente** | Abre o portal do cliente em nova aba. Útil para verificar o que o cliente vê. | Navegação completa → 1 clique |
| 6 | **Nota Rápida** | Abre modal de nota sem trocar de aba. Operadores anotam contexto o tempo todo. | Trocar aba + 2 cliques → 1 |
| 7 | **Copiar Dados** | Copia nome, email, telefone e MRR formatados para área de transferência. | Seleção manual → 1 clique |

### Ações REJEITadas (por não passar no critério):

| Ação | Por que NÃO |
|------|-------------|
| "Enviar Email" | Já tem link `mailto:` no card de perfil (1 clique) |
| "Ligar" | Já tem link `tel:` no card de perfil (1 clique) |
| "Ver No Mapa" | Já tem botão "Mapa" no card de perfil |
| "Adicionar Serviço" | Link já existe na aba Financeiro |
| "Ver Aprovações" | Já está visível na aba Entregas |

---

## Task 1: Create QuickActions Component

**Files:**
- Create: `components/quick-actions.tsx`

**Step 1: Define the component interface**

```tsx
interface QuickActionsProps {
  client: {
    id: string
    name: string
    contactName?: string | null
    contactPhone?: string | null
    contactEmail?: string | null
    mrr: string
    industry?: string | null
    status: string
  }
  onGenerateProposal: () => void
  onCreateTask: () => void
  onCreateApproval: () => void
  onAddNote: () => void
  onToast: (message: string, type?: "success" | "error") => void
}
```

**Step 2: Implement the QuickActions component**

Create `components/quick-actions.tsx` as a `"use client"` component:

### Component Structure:
1. **Container** - Horizontal scrollable row on mobile, grid on desktop
2. **7 action buttons** - Each with icon + label + subtle description
3. **Visual hierarchy** - Primary action (WhatsApp) slightly larger/highlighted
4. **States** - Hover effect (scale + bg change), active press (scale-[0.98])

### Each Button Structure:
```
┌─────────────────────────────────────────┐
│ [Icon]  Label                           │
│         Brief description (10px)        │
└─────────────────────────────────────────┘
```

### Layout:
- Desktop: `grid grid-cols-7 gap-3` (equal width columns)
- Tablet: `grid grid-cols-4 gap-3` (wraps to 2 rows)
- Mobile: `flex overflow-x-auto gap-3 snap-x` (horizontal scroll)

### Styling per button:
- Container: `bg-card border border-border/30 rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-muted/50 hover:border-primary/20 transition-all duration-300 cursor-pointer active:scale-[0.97]`
- Icon wrapper: `size-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center`
- Icon: `size-4 text-primary`
- Label: `text-[10px] font-semibold text-foreground`
- Description: `text-[8px] text-muted-foreground/60 text-center leading-tight`

### WhatsApp Action (Primary):
- Larger icon wrapper: `size-10`
- Green accent: `bg-emerald-500/10 border-emerald-500/20` with `text-emerald-500`
- Pre-filled message: `Olá {contactName || name}! Aqui é da {userName}. {greeting based on status}`

### GSAP Animation:
```tsx
gsap.from(".quick-action-item", {
  y: 10,
  opacity: 0,
  duration: 0.5,
  stagger: 0.05,
  ease: "cubic-bezier(0.32,0.72,0,1)",
  clearProps: "all"
})
```

**Step 3: Verify component compiles**

Run: `npm run build -- --turbopack`
Expected: Build succeeds

---

## Task 2: Integrate QuickActions into Client Page

**Files:**
- Modify: `app/(app)/clients/[id]/page.tsx`

**Step 1: Import QuickActions component**

Add at the top of the file:
```tsx
import { QuickActions } from "@/components/quick-actions"
```

**Step 2: Add state for quick action modals**

Add new state variables after existing modal states:
```tsx
// Quick action modals
const [showQuickTaskModal, setShowQuickTaskModal] = useState(false)
const [quickTaskTitle, setQuickTaskTitle] = useState("")
const [showQuickNoteModal, setShowQuickNoteModal] = useState(false)
const [quickNoteContent, setQuickNoteContent] = useState("")
const [quickNoteTag, setQuickNoteTag] = useState("context")
```

**Step 3: Add handler functions**

```tsx
// Quick Action Handlers
const handleQuickWhatsApp = () => {
  if (!client?.contactPhone) {
    triggerToast("Telefone do cliente não cadastrado.", "error")
    return
  }
  const phone = client.contactPhone.replace(/\D/g, "")
  const greeting = client.status === "Em Risco" 
    ? `Gostaria de alinhar alguns pontos importantes sobre sua conta.`
    : `Espero que esteja tudo bem! Passando para alinhar andamento dos projetos.`
  const message = encodeURIComponent(`Olá ${client.contactName || client.name}! Aqui é da Kyper. ${greeting}`)
  window.open(`https://wa.me/55${phone}?text=${message}`, "_blank")
}

const handleQuickCopyData = () => {
  const text = [
    `Cliente: ${client.name}`,
    `Ramo: ${client.industry || "Não informado"}`,
    `Contato: ${client.contactName || "Não informado"}`,
    `Telefone: ${client.contactPhone || "Não informado"}`,
    `Email: ${client.contactEmail || "Não informado"}`,
    `MRR: R$ ${parseFloat(client.mrr || "0").toLocaleString()}`,
    `Status: ${client.status}`,
  ].join("\n")
  navigator.clipboard.writeText(text)
  triggerToast("Dados do cliente copiados!")
}

const handleQuickCreateTask = async () => {
  if (!quickTaskTitle.trim()) return
  await addTask("todo")
  setQuickTaskTitle("")
  setShowQuickTaskModal(false)
}

const handleQuickAddNote = async () => {
  if (!quickNoteContent.trim()) return
  await handleAddNote(quickNoteContent, quickNoteTag)
  setQuickNoteContent("")
  setShowQuickNoteModal(false)
}
```

**Step 4: Add QuickActions to the JSX**

Insert between header and main grid:
```tsx
{/* Quick Actions Bar */}
<QuickActions
  client={client}
  onGenerateProposal={() => setShowProposalModal(true)}
  onCreateTask={() => setShowQuickTaskModal(true)}
  onCreateApproval={() => setShowApprovalModalNew(true)}
  onAddNote={() => setShowQuickNoteModal(true)}
  onToast={triggerToast}
/>
```

**Step 5: Add quick task modal**

Add after existing modals:
```tsx
{/* Quick Task Modal */}
{showQuickTaskModal && (
  <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-card border border-border/50 w-full max-w-sm rounded-[1.5rem] p-5 shadow-2xl animate-in zoom-in-95 duration-300">
      <h3 className="text-sm font-semibold text-foreground mb-1 font-display">Tarefa Rápida</h3>
      <p className="text-[10px] text-muted-foreground mb-4">Adicione uma tarefa ao Kanban deste cliente.</p>
      <Input
        value={quickTaskTitle}
        onChange={(e) => setQuickTaskTitle(e.target.value)}
        placeholder="Ex: Enviar relatório mensal"
        className="bg-muted/10 border-border/40 text-xs mb-4"
        onKeyDown={(e) => e.key === "Enter" && handleQuickCreateTask()}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setShowQuickTaskModal(false)} className="text-xs h-9 rounded-xl">Cancelar</Button>
        <Button onClick={handleQuickCreateTask} className="text-xs h-9 rounded-xl">Criar Tarefa</Button>
      </div>
    </div>
  </div>
)}
```

**Step 6: Add quick note modal**

Similar structure to quick task modal, with a textarea and tag selector.

**Step 7: Verify integration**

Run: `npm run build -- --turbopack`
Expected: Build succeeds, all modals functional

---

## Task 3: Add GSAP Animation

**Files:**
- Modify: `components/quick-actions.tsx`

**Step 1: Add entrance animation**

The component already includes GSAP from Task 1. Ensure the `bento-detail-item` class is added for the parent container to animate with the rest of the page.

**Step 2: Add micro-interactions**

Each button gets:
- `hover:bg-muted/50 hover:border-primary/20` - subtle bg change
- `active:scale-[0.97]` - press feedback
- `transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]` - smooth spring

**Step 3: Verify animations**

Run: `npm run dev`, navigate to `/clients/[id]`
Expected: Quick actions animate in with stagger, hover/click feel responsive

---

## Task 4: Style & Polish

**Files:**
- Modify: `components/quick-actions.tsx`

**Step 1: Responsive behavior**

- Desktop (lg+): Full grid, all labels visible
- Tablet (md): Grid wraps, descriptions hidden
- Mobile: Horizontal scroll with snap, compact buttons

**Step 2: Empty states**

If client has no phone: WhatsApp button shows tooltip "Telefone não cadastrado" and is slightly dimmed.

**Step 3: Dark mode**

All colors use CSS variables (already handled by shadcn tokens).

**Step 4: Accessibility**

- All buttons have `aria-label`
- Keyboard navigation works
- Focus visible states

**Step 5: Verify visual consistency**

Run: `npm run build -- --turbopack`
Expected: Build succeeds, design matches existing system

---

## Task 5: Final Verification

**Step 1: Full build check**

Run: `npm run build -- --turbopack`
Expected: Clean build with no errors

**Step 2: Manual verification checklist**

- [ ] Quick actions bar renders between header and grid
- [ ] WhatsApp button opens wa.me with pre-filled message
- [ ] Gerar Proposta IA opens proposal modal
- [ ] Criar Tarefa opens quick task modal, task appears in Kanban
- [ ] Solicitar Aprovação opens approval modal
- [ ] Portal do Cliente opens /client-portal in new tab
- [ ] Nota Rápida opens quick note modal, note saves
- [ ] Copiar Dados copies formatted text to clipboard
- [ ] GSAP entrance animation fires on load
- [ ] Hover states feel responsive
- [ ] Active press (scale-[0.97]) works
- [ ] Mobile horizontal scroll works
- [ ] Dark mode renders correctly
- [ ] Empty state for missing phone number
- [ ] Keyboard navigation works

---

## File Summary

| Action | File |
|--------|------|
| Create | `components/quick-actions.tsx` |
| Modify | `app/(app)/clients/[id]/page.tsx` |

---

## Design Decision: Layout Position

The quick actions bar goes **between the header and the main grid**, as a full-width row. This placement:

1. **Always visible** - No need to scroll or switch tabs
2. **Doesn't compete** - Doesn't replace existing UI, supplements it
3. **Scannable** - Operator sees all options at a glance
4. **Consistent** - Follows the same pattern as the header bar

```
┌─────────────────────────────────────────────┐
│ Header: [←] Client Name  [Iniciar Abordagem]│
├─────────────────────────────────────────────┤
│ Quick Actions: [📱 WA] [📄 Proposta] [✓ T] │
├──────────────────┬──────────────────────────┤
│ Left Sidebar     │ Right Panel (Tabs)       │
│ Profile          │ CRM / Finance / Delivery │
│ AI Suggestions   │                          │
│ Quicklinks       │                          │
└──────────────────┴──────────────────────────┘
```
