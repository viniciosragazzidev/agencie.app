# Agencie.App Design System Rules

## Typography Scale (Compact Dashboard Pattern)

Use this standardized text size scale for ALL settings pages and dashboard interfaces:

| Element | Class | Use Case |
|---------|-------|----------|
| Page Title | `text-lg font-heading font-semibold` | Main page headers |
| Page Subtitle | `text-[10px] text-muted-foreground mt-0.5` | Descriptions below titles |
| Section Title | `text-xs font-heading font-semibold` | SettingsSection titles |
| Section Description | `text-[10px] text-muted-foreground` | SettingsSection descriptions |
| Card Title | `text-sm font-heading font-medium` | CardComponent titles |
| Card Description | `text-[10px] text-muted-foreground` | CardComponent descriptions |
| Input Labels | `text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60` | Form labels |
| Input Text | `text-xs` | Input field content |
| Helper Text | `text-[9px] text-muted-foreground/40` | Small helper descriptions |
| Badges | `text-[9px] font-bold tracking-widest uppercase` | Status badges |
| Tab Labels | `text-[10px] font-bold uppercase tracking-wider` | Navigation tabs |
| Buttons | `text-[10px] font-bold uppercase tracking-wider` | Action buttons |
| H4 Subheadings | `text-xs font-medium mb-1.5` | Sub-section headings |
| List Items | `text-[11px]` | Feature lists, descriptions |

## Spacing Pattern

| Element | Class |
|---------|-------|
| Page Container | `space-y-6` |
| Section Gap | `space-y-4` |
| Card Internal | `space-y-3` or `space-y-2.5` |
| Input Groups | `space-y-1` or `space-y-0.5` |
| Grid Gap | `gap-2` to `gap-3` |

## Component Patterns

### SettingsSection
```tsx
<div className="space-y-4">
  <div className="space-y-0.5">
    <h3 className="text-xs font-heading font-semibold">{title}</h3>
    <p className="text-[10px] text-muted-foreground">{description}</p>
  </div>
  <div className="space-y-3">{children}</div>
</div>
```

### SettingsCard
```tsx
<Card>
  <CardHeader>
    <CardTitle>{title}</CardTitle>  {/* text-sm */}
    <CardDescription>{description}</CardDescription>  {/* text-[10px] */}
  </CardHeader>
  <CardContent>{children}</CardContent>
</Card>
```

### Form Inputs
```tsx
<div className="space-y-1">
  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
    Label
  </label>
  <input className="w-full h-7 px-2 text-xs rounded-lg border border-border/40 bg-muted/10 ..." />
</div>
```

### Buttons
```tsx
<button className="h-7 px-3 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg uppercase tracking-wider ...">
  Action
</button>
```

### Status Badges
```tsx
<span className="text-[9px] font-bold tracking-widest bg-primary/10 text-primary ring-1 ring-primary/20 rounded-full px-2 py-0.5 uppercase">
  Status
</span>
```

## Icon Sizes

| Context | Size Class |
|---------|------------|
| Section Icons | `size-6` or `size-5` |
| Card Icons | `size-4` or `h-4 w-4` |
| Inline Icons | `size-3` or `h-3 w-3` |
| Small Icons | `size-2.5` or `h-2.5 w-2.5` |

## Animation Defaults

- Entry Animation: `y: 12, opacity: 0, duration: 0.5, stagger: 0.08`
- Easing: `cubic-bezier(0.32,0.72,0,1)`
- Active State: `active:scale-[0.98]`
- Hover Transition: `transition-all duration-300`

## Color Tokens (Always Use Semantic Tokens)

- Background: `bg-background`
- Card: `bg-card`
- Muted: `bg-muted/10`, `text-muted-foreground`
- Primary: `bg-primary`, `text-primary`
- Border: `border-border/40`, `ring-border/30`
- Destructive: `bg-destructive`, `text-destructive`

## Anti-Patterns to Avoid

- NEVER use `text-2xl` or larger for page titles in settings
- NEVER use `text-sm` for labels (use `text-[10px]` instead)
- NEVER use `space-y-8` (use `space-y-6` or smaller)
- NEVER use hardcoded colors (always use semantic tokens)
- NEVER use `text-gray-*` (use `text-muted-foreground` instead)
