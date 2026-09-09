# Styling & Component Rules

## Table Cell Styling Standards

| Data type | Tailwind classes |
|-----------|-----------------|
| ID / code | `font-mono text-xs font-medium text-blue-700` |
| Regular text | `text-sm text-slate-700` |
| Muted/secondary text | `text-sm text-slate-600` |
| Null fallback | `text-slate-400` with `—` character |
| Source code badge | `font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded` |
| Status | `<StatusBadge status={val} />` from `@/components/common/StatusBadge` |
| Role/category | `<Badge variant="secondary">{val}</Badge>` |
| Active/Main | `<Badge variant="default">{val}</Badge>` |

## Loading States — Shimmer Skeletons (REQUIRED for every page)

Every page MUST show a **shimmer skeleton** while data is pending — never a spinner, never a bare "Loading…" text.

- Use the `Skeleton` primitive from `@/components/ui/skeleton` — it already applies the on-theme `.shimmer` class (subtle maroon-tinted sweep, RTL-aware, respects `prefers-reduced-motion`). Defined in `globals.css`.
- NEVER use `animate-spin` spinners or `animate-pulse` for content placeholders. The only spinners allowed are inline button-action indicators (e.g. "Saving…").
- Build skeletons out of `Skeleton` blocks — never raw `bg-slate-200 animate-pulse` divs.

### Rule — new page ⇒ new skeleton in the common folder
When you implement a **new page**, you MUST also create its matching shimmer skeleton component and place it in the common folder **`src/components/common/`** (shared, reusable):

- Name it `{Page}Skeleton.tsx` (e.g. `EnterpriseDetailSkeleton.tsx`) exported from `src/components/common/`.
- The skeleton must **mirror the real page layout** (same cards, columns, header band, strip) so there is no layout shift when data arrives.
- Render it from the page while `isLoading` is true, inside the page's `PageContainer`.
- Reuse the existing shared loaders when they already fit:
  - `PageLoader` (`@/components/common/Loader`) — generic detail-page skeleton (header band → highlight strip → two-column attribute cards).
  - `TableLoader` (`@/components/common/Loader`) — table-row skeletons (already wired into `DataTable` via `isLoading`).
  Only create a new `{Page}Skeleton` when neither generic loader matches the page's shape.

```tsx
// src/components/common/MyThingDetailSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
export function MyThingDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-28 w-full rounded-lg" />
      {/* …mirror the real layout… */}
    </div>
  );
}

// In the page:
if (isLoading) return <PageContainer><MyThingDetailSkeleton /></PageContainer>;
```

## Common Components — When to Use

### PageContainer
Wraps every page. Provides consistent padding and vertical spacing.
```tsx
<PageContainer>
  <PageHeader ... />
  <div>filters</div>
  <DataTable ... />
  <EditModal ... />
</PageContainer>
```

### PageHeader
Always the first child of PageContainer.
```tsx
<PageHeader
  title="Contacts"
  description="Business contacts associated with registered establishments"
  actions={<div>...</div>}   // optional — right-aligned actions or record count
/>
```

### SearchInput
Debounced text input for search filters.
```tsx
<SearchInput
  value={filters.contactName ?? ''}
  onChange={(v) => handleFilterChange({ contactName: v, page: 1 })}
  placeholder="Search by name..."
/>
```
Always reset `page: 1` when filter changes.

### StatusBadge
For EST_STATUS field (Active/Inactive) — automatically colors green/red.
```tsx
<StatusBadge status={getValue<string | null>()} />
```

### ErrorState / NoData
Used internally by DataTable — do not use standalone unless custom layout needed.

## Dialog / Modal Rules
- Use `Dialog` from `@/components/ui/dialog`
- `max-w-lg` for small forms, `max-w-2xl` for large forms
- Always `max-h-[90vh] overflow-y-auto` to handle tall content
- Footer: Cancel (outline) left, Save (default) right
- Disable both buttons while `isLoading`
- Call `onClose()` on successful save

## Form Field Layout
- Use `grid grid-cols-2 gap-4` for two-column forms
- `col-span-2` for full-width fields (email, long text)
- Wrap each field: `<div className="space-y-1"><Label>...</Label><Input .../></div>`

## Dropdowns & Inputs — Theme Rules (ALWAYS follow)

These keep every new dropdown/input on the maroon theme (`#A71D3A`). Match these exactly.

### Dropdowns — ALWAYS the themed `Select`, NEVER native `<select>`
- Use `Select / SelectTrigger / SelectValue / SelectContent / SelectItem` from `@/components/ui/select`.
- A native `<select>` renders the OS-default (blue) option list, which is off-theme — never use it for a styled dropdown.
- The themed `SelectItem` already gives the maroon check + slate hover for the selected/active option; do not re-style those.
```tsx
<Select value={val} onValueChange={setVal}>
  <SelectTrigger className="h-8 w-44 text-xs shadow-none">  {/* size only; keep theme classes */}
    <SelectValue placeholder="…" />
  </SelectTrigger>
  <SelectContent>
    {options.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
  </SelectContent>
</Select>
```

### Inputs — soft maroon focus ring (ALWAYS, every text input/textarea)
- The base `Input` ships a hard `focus:ring-2 focus:ring-[#A71D3A] focus:border-[#A71D3A]` — a solid, dark ring. Never leave this as-is on a new input: every text `Input` and `<textarea>` you add, in a filter bar, a modal, or a plain form (not just search/filter fields), must override to the **soft** ring:
  ```
  focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20
  ```
  (already the convention `SearchInput` and the snapshots feature's description `<textarea>` use — apply it the same way to any plain `Input` you write, e.g. a name field, not only filter/search inputs.)
- Do NOT change the base `Input` / `Select` components to achieve this — they are shared; override per-instance via `className` (tailwind-merge keeps the later class).
- Compact filter controls: `h-8 text-xs shadow-none`. Standard form controls: leave sizing defaults (`h-9 text-sm`) — only the focus-ring color changes.
- Existing inputs written before this rule (e.g. the modals' plain `Input` fields) still carry the old hard ring — fix them only when you're already touching that file for another reason, not as a drive-by change.

## Lucide Icons
Import from `lucide-react`. Common ones used in this project:
- `Building2` — establishments
- `Users` — contacts
- `MapPin` — addresses
- `ClipboardList` — audit log
- `Pencil` — edit button
- `RotateCcw` — reset filters
- `Phone`, `Mail`, `Globe` — contact fields

## Navigation Rule
To add a new page to the sidebar:
1. Add to `NAVIGATION` in `src/constants/navigation.ts` with icon string
2. Add icon to `ICON_MAP` in `src/components/layout/Sidebar.tsx`
Both steps required — icon string in NAVIGATION must exactly match key in ICON_MAP.
