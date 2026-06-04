# SBR Design System Reference

Project: Corporate government data portal — NPC Qatar.
Design language: Professional, data-dense, authoritative. Clean and minimal.

---

## Color Palette

| Token | Tailwind | Hex | Usage |
|-------|----------|-----|-------|
| Primary | `blue-700` | #1d4ed8 | CTA buttons, active sidebar, links, accents |
| Primary hover | `blue-800` | #1e40af | Button hover state |
| Body background | `slate-50` | #f8fafc | Page background |
| Surface | `white` | #ffffff | Cards, tables, modals, header |
| Border | `slate-200` | #e2e8f0 | All borders |
| Sidebar bg | `slate-900` | #0f172a | Sidebar background |
| Sidebar border | `slate-800` | #1e293b | Sidebar inner borders |
| Text primary | `slate-900` | #0f172a | Headings, main content |
| Text secondary | `slate-700` | #334155 | Body text |
| Text muted | `slate-500` | #64748b | Descriptions, labels |
| Text dim | `slate-400` | #94a3b8 | Null values, placeholders, disabled |
| Success | `emerald-600` | #059669 | Active status, success toasts |
| Danger | `red-600` | #dc2626 | Error, destructive buttons |
| Warning | `amber-600` | #d97706 | Warnings |
| Info | `blue-600` | #2563eb | Info toasts |

### NEVER use these colors (out of system):
- `indigo-*`, `violet-*`, `purple-*`, `teal-*`, `cyan-*`, `pink-*`, `rose-*`
- Arbitrary hex values inline
- `gray-*` — use `slate-*` instead

---

## Typography

| Level | Element | Classes |
|-------|---------|---------|
| Page title | `<h1>` | `text-xl font-semibold text-slate-900` |
| Section heading | `<h2>` | `text-base font-semibold text-slate-800` |
| Card title | — | `text-sm font-semibold text-slate-800` |
| Body | `<p>` | `text-sm text-slate-700` |
| Description | `<p>` | `text-sm text-slate-500` |
| Small/helper | `<p>` | `text-xs text-slate-400` |
| Table header | `<th>` | `text-xs font-medium text-slate-500 uppercase tracking-wide` |
| Table cell | `<td>` | `text-sm text-slate-700` |
| Monospace/code | any | `font-mono text-xs` |
| Badge text | any | `text-xs font-medium` |

Font: Inter (via `next/font/google`) → system-ui fallback.

---

## Spacing

| Context | Value |
|---------|-------|
| Page content padding | `p-6` |
| Card/panel padding | `p-4` (compact) or `p-6` (spacious) |
| Section gap | `gap-4` |
| Form fields | `space-y-4` |
| Label to input | `space-y-1.5` |
| Filter bar padding | `p-4` |
| Filter bar gap | `gap-3` |
| Button group gap | `gap-2` |
| Inline icon gap | `gap-1.5` |

---

## Components

### Buttons

| Variant | When to use | Classes (via cva) |
|---------|-------------|-------------------|
| `default` | Primary actions: Save, Submit, Continue | `bg-blue-700 text-white hover:bg-blue-800` |
| `outline` | Cancel, secondary, Edit in table | `border border-slate-300 bg-white text-slate-700` |
| `destructive` | Delete, permanent actions | `bg-red-600 text-white hover:bg-red-700` |
| `secondary` | Less prominent secondary | `bg-slate-100 text-slate-700` |
| `ghost` | Icon-only, subtle actions | `text-slate-700 hover:bg-slate-100` |

Sizes: `sm` for table rows, `default` for forms/modals, `icon` for icon-only.

### Cards / Panels
```
bg-white border border-slate-200 rounded-lg shadow-sm
```

### Tables
```
rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden
```
Table header bg: none (white) with bottom border.
Table row hover: `hover:bg-slate-50 transition-colors`
Always wrap table in `overflow-x-auto` for mobile.

### Filter Bars
```
flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg
```

### Modals
- Small: `max-w-lg` | Large: `max-w-2xl`
- Always: `max-h-[90vh] overflow-y-auto`
- Form grid: `grid grid-cols-2 gap-4`
- Full-width fields: `col-span-2`

### Source Code Badges
```
font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded
```

### Null/Empty Values
Always render `—` (em dash) for null. Use `nullableText()` utility.
Never render empty string or the word "null".

---

## Responsive Rules

- Mobile-first: default = mobile, use `md:` / `lg:` for larger
- Sidebar: collapses on mobile (icon-only mode)
- Tables: always wrapped in `overflow-x-auto`
- Filter bars: `flex-wrap` so inputs stack on small screens
- Modals: `w-full max-w-*` — never fixed px width
- Header email text: `hidden md:block`
- No `h-screen` on content areas without `overflow-y-auto`

---

## Icon Usage (Lucide React)

| Context | Icon |
|---------|------|
| Establishments | `Building2` |
| Contacts | `Users` |
| Addresses | `MapPin` |
| Audit Log | `ClipboardList` |
| Edit action | `Pencil` |
| Reset / refresh | `RotateCcw` |
| Search | `Search` |
| Phone | `Phone` |
| Email | `Mail` |
| Website | `Globe` |
| Loading | `Loader2` (with `animate-spin`) |
| Error | `AlertCircle` |
| Empty | `FileSearch` |
| Success toast | `CheckCircle2` |

Icon sizes: `h-4 w-4` standard · `h-3.5 w-3.5` small/inline · `h-5 w-5` prominent

---

## Accessibility Checklist

- Focus ring: `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`
- All inputs have `<Label htmlFor="...">` matching input `id`
- Icon-only buttons have `aria-label` or `<span className="sr-only">`
- Color is never the ONLY differentiator (badges always have text + color)
- Min touch target: 32px (h-8 minimum for interactive elements)
- Sufficient contrast: all text meets WCAG AA (4.5:1 for small text)
