---
name: ui-design
description: Audit and improve the entire SBR Portal UI for consistency, corporate design quality, and responsiveness — applies design tokens, typography, spacing, color, and component standards across all pages
---

# SBR Portal UI Design System

**Project Nature:** Corporate government data portal — NPC Qatar (National Planning Council).
Design language = authoritative, data-dense, professional, accessible. NOT flashy or consumer-app styled.

---

## Phase 1 — Understand Scope

Ask if not provided:
- Which pages/components to improve? (or "all" for full audit)
- Any specific issue? (e.g. "buttons inconsistent", "mobile layout broken", "colors off")

If "all" — run the full audit below then apply fixes in order.

---

## Phase 2 — Design Token Audit

### Established Design System (DO NOT change these foundations)

```
Primary:   blue-700  (#1d4ed8)   — buttons, links, active states, accents
Sidebar:   slate-900 (#0f172a)   — dark sidebar background
Body bg:   slate-50  (#f8fafc)   — page background
Surface:   white                  — cards, tables, modals
Border:    slate-200 (#e2e8f0)   — all borders
Text:      slate-900 (#0f172a)   — headings
Text muted:slate-500 (#64748b)   — descriptions, secondary
Text dim:  slate-400 (#94a3b8)   — null values, placeholders
Success:   emerald-600           — Active status
Danger:    red-600               — Inactive status / errors
Warning:   amber-500             — warnings
```

### Typography Scale (enforce across all pages)

| Element | Classes |
|---------|---------|
| Page title (H1) | `text-xl font-semibold text-slate-900` |
| Section heading (H2) | `text-base font-semibold text-slate-800` |
| Card title | `text-sm font-semibold text-slate-800` |
| Body text | `text-sm text-slate-700` |
| Helper/description | `text-sm text-slate-500` |
| Small/muted | `text-xs text-slate-400` |
| Table header | `text-xs font-medium text-slate-500 uppercase tracking-wide` |
| Table cell | `text-sm text-slate-700` |
| Code/mono | `font-mono text-xs` |

### Spacing Scale (enforce consistency)

| Context | Value |
|---------|-------|
| Page main padding | `p-6` |
| Card padding | `p-4` or `p-6` |
| Section gap | `gap-4` between sections |
| Form field gap | `space-y-4` |
| Label → input gap | `space-y-1.5` |
| Button group gap | `gap-2` |
| Filter bar padding | `p-4` |

---

## Phase 3 — Full Audit Checklist

Read every file listed. Check each item. Log violations.

### Layout & Structure
- [ ] `DashboardLayout` — sidebar + main area fills full screen without overflow
- [ ] `Header` — `h-14` height, white bg, bottom border, breadcrumb + user menu
- [ ] `main` content area — `p-6` padding, `overflow-y-auto`
- [ ] On small screens (< 768px): sidebar should collapse to icon-only OR hide with overlay
- [ ] Page max-width: tables should use `w-full`, modals `max-w-lg` or `max-w-2xl`

### Typography Consistency
- [ ] All `<h1>` page titles use `text-xl font-semibold text-slate-900`
- [ ] All descriptions use `text-sm text-slate-500`
- [ ] All table headers use `text-xs font-medium text-slate-500 uppercase tracking-wide`
- [ ] No random `text-base`, `text-lg`, `text-2xl` used inconsistently

### Color Consistency
- [ ] All primary action buttons: `variant="default"` (blue-700)
- [ ] All secondary/cancel buttons: `variant="outline"`
- [ ] All destructive actions: `variant="destructive"`
- [ ] No raw Tailwind colors that deviate from the design system (e.g. `bg-indigo-500`, `text-teal-600`)
- [ ] Active nav item: `bg-blue-700 text-white` (already correct)
- [ ] Hover on rows: `hover:bg-slate-50`

### Component Consistency
- [ ] All filter bars: `p-4 bg-white border border-slate-200 rounded-lg flex flex-wrap items-center gap-3`
- [ ] All tables: `rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden`
- [ ] All modals: `max-w-lg` (small) or `max-w-2xl` (large) + `max-h-[90vh] overflow-y-auto`
- [ ] All Edit buttons: `<Button size="sm" variant="outline">` with `<Pencil>` icon
- [ ] All search inputs: consistent `SearchInput` component usage
- [ ] Status badges: always use `<StatusBadge>` component — never custom inline badges for Active/Inactive
- [ ] Null values: always `nullableText()` or `—` — never empty string or `null` displayed raw
- [ ] Source code values: always `font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded`

### Responsive Design
- [ ] No fixed widths that break on mobile (e.g. `w-[400px]`)
- [ ] Modal content: `overflow-y-auto` on content, not the whole dialog
- [ ] Filter bars: `flex-wrap` so they wrap on small screens
- [ ] Table: horizontal scroll on mobile — wrap table in `overflow-x-auto`
- [ ] Sidebar: collapses to icon-only on small viewport (already has collapse button)
- [ ] Header user info: `hidden md:block` for email text (already correct)
- [ ] Login page: `max-w-sm w-full` centered — works on all screen sizes

### Accessibility
- [ ] All interactive elements have visible focus ring (`focus-visible:ring-2 focus-visible:ring-blue-500`)
- [ ] All form inputs have `<Label>` with `htmlFor` matching input `id`
- [ ] All icon-only buttons have `aria-label` or `<span className="sr-only">`
- [ ] Color is not the only differentiator (badges have text + color)
- [ ] Loading states have meaningful feedback (skeleton loaders or spinner)

---

## Phase 4 — Apply Improvements

### Step 4a — Install Inter Font (if not already set up)

Inter is the standard corporate data portal font. Add to `src/app/layout.tsx`:

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        ...
      </body>
    </html>
  );
}
```

Add to `globals.css`:
```css
body {
  font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Step 4b — Add Design Tokens to globals.css

Centralize all design tokens:
```css
:root {
  /* Brand */
  --color-primary:        #1d4ed8;  /* blue-700 */
  --color-primary-hover:  #1e40af;  /* blue-800 */

  /* Surface */
  --color-bg:             #f8fafc;  /* slate-50 */
  --color-surface:        #ffffff;
  --color-border:         #e2e8f0;  /* slate-200 */

  /* Text */
  --color-text:           #0f172a;  /* slate-900 */
  --color-text-muted:     #64748b;  /* slate-500 */
  --color-text-dim:       #94a3b8;  /* slate-400 */

  /* Status */
  --color-success:        #059669;  /* emerald-600 */
  --color-danger:         #dc2626;  /* red-600 */
  --color-warning:        #d97706;  /* amber-600 */

  /* Sidebar */
  --sidebar:              #0f172a;
  --sidebar-border:       #1e293b;
  --sidebar-active:       #1d4ed8;
}
```

### Step 4c — Responsive Table Wrapper

Wrap all `<DataTable>` usage with horizontal scroll container.
Update `DataTable.tsx`:
```tsx
return (
  <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="overflow-x-auto">    {/* ADD this wrapper */}
      <Table>
        ...
      </Table>
    </div>
    <TablePagination ... />
  </div>
);
```

### Step 4d — Consistent Filter Bar Pattern

Every filter section must match exactly:
```tsx
<div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
  {/* search inputs and dropdowns */}
</div>
```

### Step 4e — Table Header Styling

Enforce consistent table header across all column definitions:
- Table `<TableHead>` cells: `text-xs font-medium text-slate-500 uppercase tracking-wide`
- Table rows on hover: `hover:bg-slate-50 transition-colors`

Update `src/components/ui/table.tsx` TableHead if not already styled.

### Step 4f — Empty / Loading / Error States

Ensure consistent visual quality:

**NoData:**
```tsx
<div className="flex flex-col items-center justify-center py-16 text-slate-400">
  <FileSearch className="h-10 w-10 mb-3 opacity-40" />
  <p className="text-sm font-medium">No records found</p>
  <p className="text-xs mt-1">Try adjusting your search or filter criteria.</p>
</div>
```

**ErrorState:**
```tsx
<div className="flex flex-col items-center justify-center py-16 text-red-400">
  <AlertCircle className="h-10 w-10 mb-3 opacity-60" />
  <p className="text-sm font-medium text-red-600">Something went wrong</p>
  <p className="text-xs text-slate-400 mt-1">Failed to load data. Please try again.</p>
  {onRetry && <Button size="sm" variant="outline" onClick={onRetry} className="mt-4 gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Retry</Button>}
</div>
```

**Skeleton Loader:** Already uses `TableLoader` — verify it uses `<Skeleton>` from `@/components/ui/skeleton`.

### Step 4g — Button Consistency Rules

| Action | Variant | Size |
|--------|---------|------|
| Primary action (Save, Submit) | `default` | `default` |
| Cancel / Secondary | `outline` | `default` |
| Edit in table row | `outline` | `sm` |
| Reset filters | `outline` | `sm` |
| Danger (Delete) | `destructive` | `default` |
| Icon only | `ghost` | `icon` |

### Step 4h — Modal Footer Pattern

Always:
```tsx
<DialogFooter className="gap-2 sm:gap-0">
  <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
  <Button onClick={handleSubmit} disabled={isLoading}>
    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
  </Button>
</DialogFooter>
```

### Step 4i — Page Record Count Pattern

All pages must show total record count in PageHeader actions, consistently:
```tsx
actions={
  <div className="flex items-center gap-1.5 text-sm text-slate-500">
    <IconComponent className="h-4 w-4" />
    <span className="font-medium text-slate-700">{total.toLocaleString()}</span>
    <span>records</span>
  </div>
}
```

---

## Phase 5 — New Libraries to Install (if feature needs it)

| Need | Library | Install command |
|------|---------|-----------------|
| Date range filter | `react-day-picker` + `date-fns` | `npm install react-day-picker date-fns` |
| Charts / KPIs | `recharts` | `npm install recharts` |
| Smooth animations | `framer-motion` | `npm install framer-motion` |
| Command palette (already installed) | `cmdk` | Already in package.json |
| Number formatting | Already via `Intl.NumberFormat` | No install needed |

**Before installing any library:**
1. Check `package.json` — it may already be installed
2. Check if an existing `@radix-ui` primitive already covers the need
3. Prefer libraries already in the project before adding new ones
4. Install only if the feature genuinely cannot be done with existing tools

---

## Phase 6 — Responsive Breakpoint Guide

| Breakpoint | Target | Key changes |
|-----------|--------|-------------|
| `sm` (640px) | Large phone | Stack filter inputs, hide some table columns |
| `md` (768px) | Tablet | Sidebar collapses to icon mode |
| `lg` (1024px) | Laptop | Full layout |
| `xl` (1280px+) | Desktop | Comfortable table widths |

**Mobile-first rules:**
- Default styles = mobile
- Add `md:` / `lg:` prefixes for larger screens
- Never use fixed px widths for layout containers
- Use `min-w-0` on flex children to prevent overflow

---

## Phase 7 — Report

After completing audit and fixes:

```
FIXED    globals.css — added Inter font + design tokens
FIXED    DataTable.tsx — added overflow-x-auto wrapper for mobile
FIXED    ContactColumns.tsx — table header classes standardized
FIXED    EditContactModal.tsx — footer button pattern corrected
INCONSISTENCY    AddressesListPage.tsx — filter bar gap was gap-2, corrected to gap-3
OK       LoginPage.tsx — typography and spacing correct
OK       Sidebar.tsx — colors and active states correct
OK       Header.tsx — height and structure correct

Libraries installed: [list any new ones]
Libraries not needed: [list ones considered but already covered]
```

List every file changed. List every violation fixed. Do not skip.
