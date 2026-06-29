# Driver.js Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the custom GSAP-based dashboard tour (tour-overlay.tsx + tour-tooltip.tsx) with Driver.js, keeping the same 6-step flow, database persistence, and visual design language.

**Architecture:** Install `driver.js` and create a `useDriverTour` hook that initializes the Driver.js instance with custom CSS theming matching the existing double-bezel card design. The `OnboardingProvider` will call this hook instead of rendering `<TourOverlay>`. The custom `tour-overlay.tsx` and `tour-tooltip.tsx` will be deleted. Step definitions in `tour-step.ts` will be adapted to Driver.js format.

**Tech Stack:** `driver.js` (new), CSS overrides (existing Tailwind + custom CSS), existing `data-tour` attribute selectors, existing PostgreSQL persistence via `/api/onboarding`.

---

### Task 1: Install driver.js

**Files:**
- Modify: `package.json` (via npm)

**Step 1: Install the package**

```bash
pnpm add driver.js
```

**Step 2: Verify installation**

```bash
pnpm ls driver.js
```

Expected: `driver.js` listed with version.

---

### Task 2: Create the Driver.js CSS theme

**Files:**
- Create: `components/onboarding/driver-tour.css`

**Step 1: Create the CSS file**

Create `components/onboarding/driver-tour.css` with custom styles that match the existing double-bezel card design:

```css
/* ===== Driver.js Theme — Agencie.App ===== */

/* Overlay */
.driver-overlay {
  background-color: rgba(0, 0, 0, 0.55) !important;
}

/* Popover — double bezel card */
.driver-popover.agencie-tour {
  background: hsl(var(--muted) / 0.2);
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 0.75rem;
  padding: 4px;
  box-shadow: 0 25px 50px -12px rgb(0 0 / 0.25);
  backdrop-filter: blur(8px);
}

.driver-popover.agencie-tour .driver-popover-inner {
  background: hsl(var(--card));
  border-radius: calc(0.75rem - 4px);
  padding: 1rem;
}

/* Title */
.driver-popover.agencie-tour .driver-popover-title {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin-bottom: 2px;
}

/* Description */
.driver-popover.agencie-tour .driver-popover-description {
  font-size: 10px;
  color: hsl(var(--muted-foreground) / 0.6);
  line-height: 1.6;
  margin: 0;
}

/* Progress text */
.driver-popover.agencie-tour .driver-popover-progress-text {
  font-size: 8px;
  font-weight: 500;
  color: hsl(var(--muted-foreground) / 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Footer buttons */
.driver-popover.agencie-tour .driver-popover-footer {
  border-top: 1px solid hsl(var(--border) / 0.3);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.driver-popover.agencie-tour .driver-popover-footer-btn {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 0.5rem;
  padding: 4px 10px;
  transition: all 0.2s;
  background: transparent;
  border: none;
}

.driver-popover.agencie-tour .driver-popover-prev-btn {
  color: hsl(var(--muted-foreground) / 0.4);
}

.driver-popover.agencie-tour .driver-popover-prev-btn:hover {
  color: hsl(var(--muted-foreground));
}

.driver-popover.agencie-tour .driver-popover-next-btn {
  color: hsl(var(--primary));
}

.driver-popover.agencie-tour .driver-popover-next-btn:hover {
  color: hsl(var(--primary) / 0.8);
}

.driver-popover.agencie-tour .driver-popover-done-btn {
  color: hsl(var(--primary));
}

/* Close button */
.driver-popover.agencie-tour .driver-popover-close-btn {
  color: hsl(var(--muted-foreground) / 0.5);
  font-size: 10px;
}

.driver-popover.agencie-tour .driver-popover-close-btn:hover {
  color: hsl(var(--muted-foreground));
}

/* Arrow */
.driver-popover.agencie-tour.driver-popover-side-left .driver-popover-arrow {
  border-left-color: hsl(var(--card));
}

.driver-popover.agencie-tour.driver-popover-side-right .driver-popover-arrow {
  border-right-color: hsl(var(--card));
}

.driver-popover.agencie-tour.driver-popover-side-top .driver-popover-arrow {
  border-top-color: hsl(var(--card));
}

.driver-popover.agencie-tour.driver-popover-side-bottom .driver-popover-arrow {
  border-bottom-color: hsl(var(--card));
}

/* Cutout stage */
.driver-stage {
  border-radius: 0.5rem !important;
}
```

**Step 2: Verify the file is created**

No build step needed — will be imported in the hook.

---

### Task 3: Create the `useDriverTour` hook

**Files:**
- Create: `components/onboarding/use-driver-tour.ts`

**Step 1: Create the hook**

```typescript
"use client"

import { useEffect, useRef, useCallback } from "react"
import { driver, DriveStep, Config } from "driver.js"
import "driver.js/dist/driver.css"
import "./driver-tour.css"
import { DASHBOARD_TOUR_STEPS } from "./tour-step"

interface UseDriverTourOptions {
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

export function useDriverTour({ isActive, onComplete, onSkip }: UseDriverTourOptions) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)

  const destroy = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy()
      driverRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isActive) {
      destroy()
      return
    }

    // Small delay to ensure DOM is ready (elements need data-tour attributes)
    const timer = setTimeout(() => {
      const steps: DriveStep[] = DASHBOARD_TOUR_STEPS.map((step) => ({
        element: step.target,
        popover: {
          title: step.title,
          description: step.description,
          side: step.position as Config["steps"][number]["popover"]["side"],
          align: "center" as const,
          showButtons: ["next", "previous", "close"] as ("next" | "previous" | "close")[],
          nextBtnText: step.id === "settings" ? "Concluir" : "Próximo",
          prevBtnText: "Anterior",
          doneBtnText: "Concluir",
          showProgress: false,
          popoverClass: "agencie-tour",
          onPopoverRender: (popover, { state }) => {
            // Add action button if step has one
            const currentStepDef = DASHBOARD_TOUR_STEPS[state.activeIndex ?? 0]
            if (currentStepDef?.action) {
              const actionBtn = document.createElement("button")
              actionBtn.innerText = currentStepDef.action.label
              actionBtn.className = "driver-popover-footer-btn"
              actionBtn.style.cssText = `
                color: hsl(var(--primary));
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                cursor: pointer;
                background: none;
                border: none;
                padding: 4px 0;
                display: flex;
                align-items: center;
                gap: 4px;
              `
              actionBtn.addEventListener("click", () => {
                window.location.href = currentStepDef.action!.href
              })
              popover.footerButtons.appendChild(actionBtn)
            }
          }
        }
      }))

      const driverObj = driver({
        showProgress: false,
        animate: true,
        duration: 400,
        overlayOpacity: 0.55,
        overlayColor: "rgba(0, 0, 0, 0.55)",
        stagePadding: 10,
        stageRadius: 8,
        allowClose: true,
        allowKeyboardControl: true,
        smoothScroll: false,
        overlayClickBehavior: "close",
        popoverClass: "agencie-tour",
        nextBtnText: "Próximo",
        prevBtnText: "Anterior",
        doneBtnText: "Concluir",
        onDestroyed: () => {
          onComplete()
        },
        onCloseClick: () => {
          onSkip()
        },
        steps
      })

      driverRef.current = driverObj
      driverObj.drive()
    }, 100)

    return () => {
      clearTimeout(timer)
      destroy()
    }
  }, [isActive, onComplete, onSkip, destroy])

  return {
    refresh: () => driverRef.current?.refresh(),
    isActive: () => driverRef.current?.isActive() ?? false
  }
}
```

**Step 2: Verify no TypeScript errors**

```bash
pnpm tsc --noEmit --pretty
```

Expected: No errors (or only pre-existing ones).

---

### Task 4: Update `OnboardingProvider` to use Driver.js

**Files:**
- Modify: `components/onboarding/onboarding-provider.tsx`

**Step 1: Replace TourOverlay import with useDriverTour**

Remove:
```typescript
import { TourOverlay } from "./tour-overlay"
```

Add:
```typescript
import { useDriverTour } from "./use-driver-tour"
```

**Step 2: Replace TourOverlay rendering with hook call**

Inside `OnboardingProvider`, add the hook after the existing state:

```typescript
const { } = useDriverTour({
  isActive: shouldShowTour,
  onComplete: handleTourComplete,
  onSkip: handleTourSkip
})
```

**Step 3: Remove the `<TourOverlay>` JSX block**

Delete lines 117-123:
```tsx
{/* Dashboard Tour */}
{shouldShowTour && (
  <TourOverlay
    isActive={shouldShowTour}
    onComplete={handleTourComplete}
    onSkip={handleTourSkip}
  />
)}
```

The hook handles everything imperatively — no JSX needed.

---

### Task 5: Delete old custom tour files

**Files:**
- Delete: `components/onboarding/tour-overlay.tsx`
- Delete: `components/onboarding/tour-tooltip.tsx`

**Step 1: Verify no other imports reference these files**

```bash
grep -r "tour-overlay\|tour-tooltip" --include="*.ts" --include="*.tsx" .
```

Expected: Only `onboarding-provider.tsx` references them (which we just updated).

**Step 2: Delete the files**

```bash
rm components/onboarding/tour-overlay.tsx components/onboarding/tour-tooltip.tsx
```

**Step 3: Run type check**

```bash
pnpm tsc --noEmit --pretty
```

Expected: No errors related to deleted files.

---

### Task 6: Keep `tour-step.ts` as-is (no changes needed)

**Files:**
- No changes: `components/onboarding/tour-step.ts`

The step definitions already use CSS selectors (`[data-tour='...']`) which Driver.js accepts directly. The `TourStep` interface and `DASHBOARD_TOUR_STEPS` array remain unchanged. The `action` field is handled in `onPopoverRender` within the hook.

---

### Task 7: Verify data-tour attributes exist on target elements

**Files:**
- No changes expected (verification only)

**Step 1: Confirm all targets are present**

The 6 steps target these selectors:
- `[data-tour='sidebar']` — `app-sidebar.tsx:143`
- `[data-tour='dashboard-kpis']` — `dashboard/page.tsx:264`
- `[data-tour='inbox-link']` — `app-sidebar.tsx:60`
- `[data-tour='clients-link']` — `app-sidebar.tsx:71`
- `[data-tour='quick-actions']` — `quick-actions.tsx:173`
- `[data-tour='settings-link']` — `app-sidebar.tsx:118`

All already exist. No changes needed.

---

### Task 8: Build and test

**Step 1: Run build**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 2: Manual testing checklist**

- [ ] Fresh user (onboarding not completed) → Setup Wizard appears, then Tour
- [ ] Tour shows 6 steps with correct content
- [ ] Popover matches double-bezel card design
- [ ] Navigation (next/prev/close) works
- [ ] Action buttons on steps 3, 4, 6 navigate correctly
- [ ] Completing tour marks `tutorialCompleted: true` in DB
- [ ] Closing tour (X button) also marks `tutorialCompleted: true`
- [ ] Keyboard navigation (arrow keys, Escape) works
- [ ] Overlay click closes tour
- [ ] Floating checklist still appears after tour
- [ ] Returning user with `tutorialCompleted: true` does NOT see tour

**Step 3: Run lint/typecheck**

```bash
pnpm lint && pnpm tsc --noEmit
```

Expected: No new errors.

---

## Summary of Changes

| Action | File | Reason |
|--------|------|--------|
| **Install** | `driver.js` | New tour library |
| **Create** | `components/onboarding/driver-tour.css` | Custom popover theme |
| **Create** | `components/onboarding/use-driver-tour.ts` | Hook wrapping Driver.js |
| **Modify** | `components/onboarding/onboarding-provider.tsx` | Use hook instead of `<TourOverlay>` |
| **Delete** | `components/onboarding/tour-overlay.tsx` | Replaced by Driver.js |
| **Delete** | `components/onboarding/tour-tooltip.tsx` | Replaced by Driver.js popover |
| **Keep** | `components/onboarding/tour-step.ts` | Step definitions reused as-is |
| **Keep** | All `data-tour` attributes | Selectors work with Driver.js |

**Net result:** ~420 lines deleted (tour-overlay + tour-tooltip), ~120 lines added (hook + CSS), 0 changes to step definitions or persistence layer.
