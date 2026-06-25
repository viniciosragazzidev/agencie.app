# Help Dictionary - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar uma seção "Ajuda" no sidebar com sub-item "Dicionário" que exibe documentação completa de termos do marketing, vendas e gestão de agências.

**Architecture:** Página de dicionário com dados estáticos em TypeScript, interface de busca com filtro em tempo real, categorias navegáveis, e cards de termos com significado, caso de uso, importância e exemplos. Segue o padrão visual double-bezel existente.

**Tech Stack:** Next.js App Router, shadcn/ui (base-nova), Tailwind v4, Hugeicons, GSAP (animações de entrada), dados estáticos em TypeScript.

---

## Design Read

Reading this as: **Authenticated app page (dictionary/documentation) for agency operators, with a clean functional language, leaning toward the existing double-bezel glassmorphism system + Plus Jakarta Sans + Space Grotesk.**

**Dial Values:**
- DESIGN_VARIANCE: 5 (clean, predictable grid for readability)
- MOTION_INTENSITY: 3 (subtle entrance animations only, content-first)
- VISUAL_DENSITY: 3 (airy, documentation-friendly spacing)

---

## Task 1: Create Dictionary Data File

**Files:**
- Create: `data/dictionary.ts`

**Step 1: Create the dictionary data structure**

Create `data/dictionary.ts` with all marketing/sales/agency terms. Each term has:
- `id`: unique slug
- `term`: display name
- `category`: one of "Marketing Digital", "Vendas & Pipeline", "Gestão de Agência", "Financeiro", "Tecnologia & IA"
- `definition`: clear meaning (2-3 sentences)
- `useCase`: when/how to use this term
- `importance`: why it matters for the agency
- `example`: practical example in context
- `relatedTerms`: array of related term IDs

Start with ~25-30 essential terms covering:
- Marketing Digital: ROI, CAC, LTV, CPL, CPA, Funil de Conversão, Remarketing, SEO, SEM, Inbound Marketing, Lead Scoring
- Vendas & Pipeline: Pipeline Comercial, Ticket Médio, taxa de conversão, ciclo de vendas, BANT, upselling, cross-selling
- Gestão de Agência: SLA, churn rate, NPS, OKR, KPI, escopo, briefing, deliverable
- Financeiro: MRR, ARR, recorrência, margem bruta, break-even
- Tecnologia & IA: RAG, automação, omnichannel, CRM, ERP

**Step 2: Verify file structure**

Run: `npx tsc --noEmit data/dictionary.ts`
Expected: No errors

---

## Task 2: Add Sidebar Navigation Items

**Files:**
- Modify: `components/app-sidebar.tsx` (lines 18-41 for imports, lines 91-120 for sectionsData)
- Modify: `app/(app)/layout.tsx` (lines 31-117 for breadcrumbs)

**Step 1: Import new icons in app-sidebar.tsx**

Add `HelpCircleIcon` and `BookOpen01Icon` to the Hugeicons import at line 40:

```tsx
import {
  // ... existing icons ...
  HelpCircleIcon,
  BookOpen01Icon,
} from "@hugeicons/core-free-icons"
```

**Step 2: Add "Ajuda" section to sectionsData**

Add a new section at the end of `sectionsData` array (after line 120):

```tsx
{
  label: "Ajuda",
  items: [
    {
      name: "Dicionário",
      url: "/help/dictionary",
      icon: <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={1.5} className="size-4" />,
    },
  ],
},
```

**Step 3: Add breadcrumb for help/dictionary in layout.tsx**

Add handling for `firstPath === "help"` in the `getBreadcrumbs` function (after line 113):

```tsx
} else if (firstPath === "help") {
  const secondPath = paths[1]
  if (secondPath === "dictionary") {
    breadcrumbs.push({
      label: "Ajuda",
      href: "#",
      isLast: false,
    })
    breadcrumbs.push({
      label: "Dicionário",
      href: "/help/dictionary",
      isLast: true,
    })
  }
}
```

**Step 4: Verify sidebar renders correctly**

Run: `npm run build -- --turbopack`
Expected: Build succeeds, sidebar shows "Ajuda" section with "Dicionário" item

---

## Task 3: Create Dictionary Page Component

**Files:**
- Create: `app/(app)/help/dictionary/page.tsx`

**Step 1: Create the directory structure**

```
app/(app)/help/
└── dictionary/
    └── page.tsx
```

**Step 2: Build the dictionary page**

Create `app/(app)/help/dictionary/page.tsx` as a `"use client"` component with:

### Page Structure:
1. **Header bar** - Same pattern as services page: icon + title "Dicionário" + subtitle "Glossário completo de termos essenciais para gestão de agências"
2. **Search bar** - Full-width input with search icon, filters terms in real-time
3. **Category pills** - Horizontal scrollable row of filter pills (all + each category), active state highlighted
4. **Results count** - "Mostrando X de Y termos"
5. **Dictionary grid** - 2-column grid of term cards on desktop, 1-column on mobile
6. **Term card** (double-bezel pattern) with:
   - Category pill badge (top-right)
   - Term name (bold, display font)
   - Definition text
   - Expandable sections for: Caso de Uso, Importância, Exemplo
   - Related terms as clickable pills
7. **Empty state** - When search yields no results
8. **GSAP entrance animation** - `.bento-item` stagger pattern

### Search Implementation:
- `useState` for search query
- `useMemo` to filter dictionary data by:
  - Term name (case-insensitive)
  - Definition text
  - Category name
- Debounced input (300ms) using `useEffect` + `setTimeout`

### Category Filter:
- `useState` for active category (default: "all")
- Pills rendered from unique categories in dictionary data
- Combines with search filter

### Term Card Component:
- Inline within the page (no separate file needed)
- Uses `useState` for expanded state per card
- Chevron icon rotates on expand
- Smooth height transition using CSS `max-height` + `overflow-hidden`

### Responsive Layout:
- Desktop (lg+): 2-column grid `grid-cols-1 lg:grid-cols-2 gap-5`
- Mobile: single column, full-width cards
- Search bar and category pills always full-width

**Step 3: Verify page renders**

Run: `npm run build -- --turbopack`
Expected: Build succeeds, page accessible at `/help/dictionary`

---

## Task 4: Add GSAP Animation

**Files:**
- Modify: `app/(app)/help/dictionary/page.tsx`

**Step 1: Add GSAP entrance animation**

Inside the page component, add the standard GSAP pattern:

```tsx
"use client"
import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

const containerRef = useRef<HTMLDivElement>(null)

useGSAP(() => {
  gsap.from(".bento-item", {
    y: 15,
    opacity: 0,
    duration: 0.8,
    stagger: 0.08,
    ease: "cubic-bezier(0.32,0.72,0,1)",
    clearProps: "all"
  })
}, { scope: containerRef })
```

**Step 2: Add `bento-item` class to all major sections**

- Header section: `bento-item`
- Search bar: `bento-item`
- Category pills: `bento-item`
- Each term card: `bento-item`

**Step 3: Verify animations work**

Run: `npm run dev`, navigate to `/help/dictionary`
Expected: Elements animate in with staggered fade-up on page load

---

## Task 5: Style & Polish

**Files:**
- Modify: `app/(app)/help/dictionary/page.tsx`

**Step 1: Apply consistent styling**

- All text follows the existing scale:
  - Page title: `text-2xl font-display font-semibold tracking-tight`
  - Subtitle: `text-[10px] text-muted-foreground`
  - Term name: `text-sm font-semibold font-display`
  - Definition: `text-[11px] text-muted-foreground leading-relaxed`
  - Category badge: `text-[9px] font-bold tracking-widest uppercase`
  - Labels: `text-[9px] font-bold text-muted-foreground uppercase tracking-widest`
- Double-bezel cards: `double-bezel-card bg-muted/10 ring-1 ring-border/50 p-1.5 rounded-[1.5rem]`
- Inner card: `bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5`
- Search input: same style as services modal inputs
- Category pills: `text-[10px] font-semibold rounded-full px-3 py-1.5 border border-border/40` with active state `bg-primary/10 text-primary border-primary/20`

**Step 2: Dark mode support**

Ensure all colors use CSS variables (already handled by shadcn tokens). Test both modes.

**Step 3: Empty state design**

When no results match search:
```tsx
<div className="flex flex-col items-center justify-center py-16">
  <HugeiconsIcon icon={Search01Icon} strokeWidth={1} className="size-8 text-muted-foreground/40" />
  <p className="text-xs text-muted-foreground font-medium mt-3">Nenhum termo encontrado</p>
  <p className="text-[10px] text-muted-foreground/60 mt-1">Tente buscar com outras palavras</p>
</div>
```

**Step 4: Verify visual consistency**

Run: `npm run build -- --turbopack`
Expected: Build succeeds, page matches existing design system

---

## Task 6: Final Verification

**Step 1: Full build check**

Run: `npm run build -- --turbopack`
Expected: Clean build with no errors

**Step 2: Manual verification checklist**

- [ ] Sidebar shows "Ajuda" section with "Dicionário" item
- [ ] Clicking "Dicionário" navigates to `/help/dictionary`
- [ ] Breadcrumb shows "Ajuda > Dicionário"
- [ ] Search filters terms in real-time
- [ ] Category pills filter by category
- [ ] Combining search + category works
- [ ] Term cards expand/collapse smoothly
- [ ] Related terms are clickable and scroll/navigate
- [ ] GSAP entrance animation fires on load
- [ ] Dark mode renders correctly
- [ ] Mobile responsive (single column)
- [ ] Empty state shows when no results

---

## File Summary

| Action | File |
|--------|------|
| Create | `data/dictionary.ts` |
| Create | `app/(app)/help/dictionary/page.tsx` |
| Modify | `components/app-sidebar.tsx` |
| Modify | `app/(app)/layout.tsx` |
