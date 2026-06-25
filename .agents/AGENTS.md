# UI/UX & Design Constraints

<!-- BEGIN:high-end-visual-design-rules -->
Always apply `gpt-taste` and `high-end-visual-design` principles to any frontend work in this project.
- **Micro-Aesthetics**: Use the "Double-Bezel" (Doppelrand) architecture for cards and containers (outer shell with `p-1.5` and `ring-1`, inner core with subtle inner shadows).
- **Motion Choreography**: Never use default `linear` or `ease-in-out`. Always use `cubic-bezier(0.32,0.72,0,1)` for smooth, haptic, realistic physics. Add `active:scale-[0.98]` to buttons and interactive items. Use `gsap` for entry staggers and cinematic reveals.
- **Gapless Bento Grids**: Layouts should use mathematically perfect grids with `grid-flow-dense` and no empty voids.
- **Typography & Structure**: Use dense, control-center-like data views where required (e.g. `h-screen`, `overflow-hidden`), with scaled down typography (`text-[10px]` for labels, `text-3xl` for data points) and massive horizontal breathing room where appropriate. No cheap meta labels.
- **Icons**: Always use `strokeWidth={1.5}` or thinner for icons. Avoid thick, chunky iconography.
- **Colors**: ALWAYS use semantic Tailwind tokens from `globals.css` (e.g., `bg-background`, `text-muted-foreground`, `bg-primary`, `bg-card`, `ring-border`, `bg-destructive`). NEVER use hardcoded colors (like `bg-black/10` or `text-gray-500`).
- **Badges/Alerts**: Use the specific pattern: `text-[9px] font-bold tracking-widest bg-[color]/10 text-[color] ring-1 ring-[color]/20 rounded-full px-2 py-0.5 uppercase`.
- **Interface Choreography & Fluid Motion**:
  - *Vertical Cascades (Staggered Entry)*: Elements must enter in sequence (stagger) from bottom to top with a subtle spring/elastic settling effect.
  - *Magnetic Controls*: Segmented tabs and selector backgrounds must slide magnetically behind texts (using expanding layout transitions).
  - *Spring Physics*: Progress bars, sliders, and size transitions must bounce or stretch slightly (spring effect) before locking.
  - *Odometer Effect*: Real-time numbers and metrics must roll/spin vertically rather than snapping.
  - *Symmetric Hover/Active*: Active elements compress (`active:scale-[0.97]`). Multi-panel layouts must use synchronized, instant cross-hover highlights.
  - *Soft Fading & Muting*: Disabled/removed elements must transition to grayscale/muted colors and fade out slowly instead of abruptly vanishing.
<!-- END:high-end-visual-design-rules -->

# Agent Workflow Skills

<!-- BEGIN:agent-workflow-skills -->
Daqui em diante, sempre que houver necessidade de planejar novas funcionalidades, estruturar produtos ou planejar o código, use **OBRIGATORIAMENTE** as seguintes skills como pilares principais:

## 1. Estratégia e Planejamento
1. **`product-manager-toolkit`**: Usar primeiro para todo planejamento focado no produto, no negócio, nas dores do usuário, priorização de features (ex: metodologias RICE, MoSCoW) e criação de PRDs (Product Requirements Documents).
2. **`writing-plans`**: Usar sequencialmente após a definição do produto, para traduzir o PRD/regras de negócio em um plano de implementação técnico detalhado (passo a passo de código, TDD, modificações de arquivos, testes), garantindo que a execução técnica não tenha ambiguidades.

## 2. Design e Interface (UI/UX)
3. **`gpt-taste`**: Essencial para o design de altíssima qualidade exigido neste projeto, garantindo micro-estéticas, motion choreography (GSAP) e tipografia premium.
4. **`shadcn`**: Como o projeto utiliza componentes customizados, essa skill ajuda a manter a consistência do Design System e o uso de tokens semânticos corretos do Tailwind.
5. **`design-spells`**: Fundamental para adicionar "mágica" na UI, garantindo hover states responsivos e a sensação "haptic" exigida nas regras de negócio.

## 3. Arquitetura e Backend
6. **`nextjs-best-practices`**: Garante o uso correto do App Router do Next.js, mantendo a performance, rotas seguras e Server Actions organizadas.
7. **`database` / `database-design`**: Para lidar com o Drizzle ORM, migrações e modelagem relacional limpa das tabelas no PostgreSQL.
8. **`api-patterns`**: Ajuda a estruturar endpoints limpos em `/api`, focando na padronização de respostas, métodos HTTP corretos e segurança.

## 4. Estabilidade e Qualidade
9. **`systematic-debugging`**: Crucial para debugar problemas no React/Next.js ou no banco, rastreando a causa raiz metodicamente sem "adivinhações".

## 5. Entrega e Deploy
10. **`vercel-deployment`**: (Ou equivalente) Garantirá que o build do Next.js seja otimizado para o Vercel sem problemas de environment, cuidando de regras de Cache e SSR.
<!-- END:agent-workflow-skills -->
