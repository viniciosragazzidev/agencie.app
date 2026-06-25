# Portal Client Management — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform `/client-portal` into an agency-side management area where the agency can see which clients have portal access, enable/disable access per client, copy portal URLs to share, and configure portal settings.

**Architecture:** Replace the current client-facing portal page (`app/client-portal/`) with an authenticated management dashboard inside the `(app)` group. The agency sees a grid of their clients, each with portal status, a shareable URL, and toggle controls. A new `portalEnabled` column on the `client` table gates access. The existing `/portal/[agency]/` login flow remains unchanged for clients.

**Tech Stack:** Next.js App Router, shadcn/ui, Tailwind v4, Hugeicons, GSAP, Drizzle ORM.

---

## Design Read

**Current state:** `/client-portal` is a standalone page (own layout, no auth) that renders the client's view. It's being replaced by `/portal/[agency]/projetos` for client access.

**New state:** `/client-portal` becomes an `(app)` route — authenticated agency dashboard for managing portal access.

**Dial Values:**
- DESIGN_VARIANCE: 3 (consistent with existing client list/grid patterns)
- MOTION_INTENSITY: 2 (GSAP entrance stagger only)
- VISUAL_DENSITY: 4 (information-rich cards with status badges)

---

## Task 1: Schema — Add `portalEnabled` to client table

**Files:**
- Modify: `lib/db/schema.ts` (client table)
- Create: `lib/db/migrations/0006_*.sql` (auto-generated)

**Step 1: Add column to schema**

In `lib/db/schema.ts`, add `portalEnabled` to the `client` table after `document`:

```ts
document: text("document"),
portalEnabled: boolean("portal_enabled").default(false).notNull(),
socials: jsonb("socials"),
```

Import `boolean` from `drizzle-orm/pg-core` (already imported).

**Step 2: Generate and push migration**

```bash
npm run db:generate
npm run db:push
```

Expected: Migration file created, changes applied to DB.

**Step 3: Verify**

Check that the `client` table now has `portal_enabled` boolean column with default `false`.

---

## Task 2: Create portal management page

**Files:**
- Create: `app/(app)/client-portal/page.tsx`

**Step 1: Create the page component**

Create `app/(app)/client-portal/page.tsx` as a `"use client"` component with:

**Data fetching:**
- Fetch clients from `/api/clients` (existing endpoint)
- Each client includes `portalEnabled`, `document`, `contactEmail`, `username` (agency)

**State:**
```ts
const [clients, setClients] = useState<Client[]>([])
const [loading, setLoading] = useState(true)
const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
```

**Client interface (extended):**
```ts
interface Client {
  id: string
  name: string
  industry?: string | null
  status: string
  mrr: string
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  document?: string | null
  portalEnabled: boolean
}
```

**Handler: Toggle portal access**
```ts
const handleTogglePortal = async (clientId: string, enabled: boolean) => {
  const res = await fetch(`/api/clients/${clientId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ portalEnabled: enabled }),
  })
  if (res.ok) {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, portalEnabled: enabled } : c))
    triggerToast(enabled ? "Portal ativado!" : "Portal desativado!")
  }
}
```

**Handler: Copy portal URL**
```ts
const handleCopyUrl = (agencyUsername: string) => {
  const url = `${window.location.origin}/portal/${agencyUsername}`
  navigator.clipboard.writeText(url)
  triggerToast("URL do portal copiada!")
}
```

**JSX structure:**
```
┌─────────────────────────────────────────────────────┐
│ Header: "Portal do Cliente" + description           │
├─────────────────────────────────────────────────────┤
│ URL do Portal: [/portal/{username}] [Copiar]        │
├─────────────────────────────────────────────────────┤
│ Grid de Clientes:                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │ Client 1 │ │ Client 2 │ │ Client 3 │             │
│ │ Status   │ │ Status   │ │ Status   │             │
│ │ Toggle   │ │ Toggle   │ │ Toggle   │             │
│ │ [Copiar] │ │ [Copiar] │ │ [Copiar] │             │
│ └──────────┘ └──────────┘ └──────────┘             │
└─────────────────────────────────────────────────────┘
```

**Each client card:**
- Client name + industry badge
- Contact info (name, email, phone)
- Document (CPF/CNPJ) if set
- Portal status badge (Ativado/Desativado)
- Toggle switch for portal access
- Copy URL button (only if portal enabled + document set)
- Warning if document not set ("Cliente precisa de CPF/CNPJ para acessar o portal")

**Empty state:**
- "Nenhum cliente cadastrado" with link to `/clients`

**Step 2: Styling**

Follow existing patterns:
- Double-bezel cards for the main container
- Same card pattern as `/clients` page
- GSAP entrance animation (stagger on `.bento-item`)
- Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop

**Step 3: Verify**

Run: `npm run build -- --turbopack`
Expected: Build succeeds

---

## Task 3: Update clients API to handle `portalEnabled`

**Files:**
- Modify: `app/api/clients/[id]/route.ts`

**Step 1: Verify PATCH handler**

The existing PATCH handler at `app/api/clients/[id]/route.ts` uses `...body` spread:
```ts
const updated = await db.update(client).set({
  ...body,
  updatedAt: new Date(),
}).where(...)
```

This already accepts any field from the body, including `portalEnabled`. No code change needed — just verify it works.

**Step 2: Test**

Send PATCH request with `{ "portalEnabled": true }` and verify the field is updated.

---

## Task 4: Add portal management to sidebar navigation

**Files:**
- Modify: `components/nav-main.tsx`

**Step 1: Add navigation item**

In `components/nav-main.tsx`, add a new item to the navigation array:

```ts
{
  title: "Portal do Cliente",
  url: "/client-portal",
  icon: LinkSquare02Icon,
}
```

Use `LinkSquare02Icon` from `@hugeicons/core-free-icons` (already used in the codebase).

**Step 2: Verify**

Check sidebar renders the new item and navigates to `/client-portal`.

---

## Task 5: Remove old client-portal layout (standalone)

**Files:**
- Delete: `app/client-portal/layout.tsx`

**Step 1: Delete the standalone layout**

The old `app/client-portal/layout.tsx` has its own `<html>` tag and Inter font. Since the page is now inside `(app)`, it uses the app layout. Delete the old layout.

**Step 2: Delete old page**

Delete `app/client-portal/page.tsx` (replaced by `app/(app)/client-portal/page.tsx`).

**Step 3: Verify**

The route `/client-portal` now uses the `(app)` layout with sidebar.

---

## Task 6: Add portal URL display to client detail page

**Files:**
- Modify: `app/(app)/clients/[id]/page.tsx`

**Step 1: Add portal URL section to client detail**

In the left sidebar of the client detail page, add a "Portal do Cliente" section after the quicklinks:

```tsx
{/* Portal do Cliente */}
<div className="double-bezel-card bento-detail-item bg-muted/10 ring-1 ring-border/40 p-1.5 rounded-[1.5rem]">
  <div className="bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-[calc(1.5rem-0.375rem)] p-5 border border-border/20">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={1.5} className="size-4 text-primary" />
        <h3 className="font-semibold text-xs text-foreground font-display">Portal do Cliente</h3>
      </div>
      <span className={`text-[9px] font-bold tracking-widest ring-1 rounded-full px-2 py-0.5 uppercase ${
        client.portalEnabled
          ? "bg-green-500/10 text-green-500 ring-green-500/20"
          : "bg-muted text-muted-foreground ring-border/30"
      }`}>
        {client.portalEnabled ? "Ativado" : "Desativado"}
      </span>
    </div>
    {client.portalEnabled ? (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-muted/5 border border-border/20 rounded-lg">
          <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">
            /portal/{session?.user?.username}
          </span>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/portal/${session?.user?.username}`); triggerToast("URL copiada!") }}>
            <HugeiconsIcon icon={Copy01Icon} className="size-3" />
          </button>
        </div>
        {!client.document && (
          <p className="text-[9px] text-amber-500">⚠ Cliente precisa de CPF/CNPJ para acessar</p>
        )}
      </div>
    ) : (
      <p className="text-[10px] text-muted-foreground">Ative o portal para que o cliente acesse.</p>
    )}
  </div>
</div>
```

**Step 2: Verify**

Navigate to `/clients/[id]` and check the portal section renders correctly.

---

## Task 7: Final verification

**Step 1: TypeScript check**

```bash
npx tsc --noEmit --pretty
```

Expected: No new errors (pre-existing errors in `.next/types` and `client-portal/page.tsx` are OK).

**Step 2: Lint check**

```bash
npx eslint app/(app)/client-portal/ components/nav-main.tsx --no-error-on-unmatched-pattern
```

Expected: 0 errors.

**Step 3: Manual verification checklist**

- [ ] `/client-portal` renders inside (app) layout with sidebar
- [ ] Client grid shows all clients with portal status
- [ ] Toggle switch enables/disables portal per client
- [ ] Copy URL button works (shows `/portal/{username}`)
- [ ] Warning shows when client has no CPF/CNPJ
- [ ] Empty state shows when no clients exist
- [ ] GSAP entrance animation fires on load
- [ ] Client detail page shows portal section
- [ ] Portal URL is correct format: `/portal/{agency-username}`
- [ ] Old `app/client-portal/` files are removed

---

## File Summary

| Action | File |
|--------|------|
| Modify | `lib/db/schema.ts` |
| Create | `app/(app)/client-portal/page.tsx` |
| Modify | `components/nav-main.tsx` |
| Modify | `app/(app)/clients/[id]/page.tsx` |
| Delete | `app/client-portal/layout.tsx` |
| Delete | `app/client-portal/page.tsx` |

---

## Architecture Decision: Portal URL Format

The portal URL uses the agency's `username` field (already unique in the `user` table):

```
/portal/{agency-username}
```

Example: If the agency's username is `kyper-digital`, the portal URL is:
```
https://agencie.app/portal/kyper-digital
```

This was already implemented in the previous sprint (`app/portal/[agency]/`). The management page simply displays and copies this URL.

**Why username instead of client ID:**
1. URLs are human-readable and shareable
2. The agency only has one URL to share (same URL for all clients)
3. Clients authenticate with CPF/CNPJ + email (not URL tokens)
4. No sensitive IDs exposed in URLs
