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
