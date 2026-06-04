# SBR Frontend — Claude Context

## Additional Context Files
@.claude/rules/git-workflow.md
@.claude/rules/code-standards.md
@.claude/rules/constants-enums.md
@.claude/rules/api-pattern.md
@.claude/rules/common-functions.md
@.claude/rules/common-function-rule.md
@.claude/rules/styling.md
@.claude/references/types.md
@.claude/references/routes.md
@.claude/references/design-system.md

Statistical Business Register UI for NPC Qatar.
Built with **Next.js 14 (App Router) + RTK Query + Tailwind CSS + shadcn/ui**.

---

## Security Rules — CRITICAL ⚠️

**NEVER commit sensitive information to git, including in documentation:**

Forbidden everywhere:
- ❌ API keys, tokens, secrets
- ❌ Database credentials (passwords, connection strings)
- ❌ JWT secrets, encryption keys
- ❌ OAuth/OIDC app secrets
- ❌ Email/SMS API credentials
- ❌ Private URLs or internal IPs
- ❌ User data, test accounts, or credentials

**Never in these locations:**
- ❌ `.claude/` folder (project settings)
- ❌ `CLAUDE.md` (this documentation)
- ❌ `docs/` folder (any markdown/documentation)
- ❌ Code comments or git commit messages
- ❌ `.env.example` (show structure, not real values)

**Safe locations for secrets:**
- ✅ `.env` (local only, excluded by `.gitignore`)
- ✅ `.env.local` (local overrides, excluded by `.gitignore`)
- ✅ CI/CD secrets (GitHub Secrets, environment variables)
- ✅ Secure vaults (AWS Secrets Manager, HashiCorp Vault)

**If you accidentally commit a secret:**
1. Rotate the credential immediately
2. Remove from git history: `git filter-repo` or `git filter-branch`
3. Never push the exposed history
4. Report to security team

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| State / Data fetching | Redux Toolkit + RTK Query |
| UI Components | shadcn/ui (Radix primitives) |
| Styling | Tailwind CSS |
| Tables | TanStack Table v8 |
| Icons | Lucide React |

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout — ReduxProvider + Toaster wired here
│   ├── page.tsx                      # Redirects to /frame
│   ├── login/page.tsx
│   └── (dashboard)/                  # All protected pages live here
│       ├── layout.tsx                # DashboardLayout (Sidebar + Header)
│       ├── frame/page.tsx            # Establishments list
│       ├── contacts/page.tsx         # Contacts list
│       ├── addresses/page.tsx        # Addresses list
│       └── audit-log/page.tsx        # Audit log
├── components/
│   ├── common/                       # Reusable building blocks
│   │   ├── PageContainer.tsx         # Wraps every page — consistent padding/spacing
│   │   ├── PageHeader.tsx            # Title + description + optional actions slot
│   │   ├── SearchInput.tsx           # Debounced search input
│   │   ├── StatusBadge.tsx           # Active/Inactive coloured badge
│   │   ├── ErrorState.tsx            # Error UI with retry button
│   │   ├── NoData.tsx                # Empty state UI
│   │   ├── Loader.tsx                # Loading spinner
│   │   └── Toaster.tsx               # Toast notification renderer
│   ├── layout/
│   │   ├── Sidebar.tsx               # Nav links from NAVIGATION constant
│   │   ├── Header.tsx
│   │   └── DashboardLayout.tsx
│   ├── table/
│   │   ├── DataTable.tsx             # Main table component — accepts columns + data
│   │   └── TablePagination.tsx
│   └── ui/                           # shadcn/ui primitives (button, input, dialog, etc.)
├── constants/
│   ├── navigation.ts                 # NAVIGATION array — drives sidebar links
│   └── routes.ts
├── features/                         # Feature-based modules — one folder per domain
│   ├── addresses/
│   │   ├── api/addressesApi.ts       # RTK Query endpoints
│   │   ├── components/
│   │   │   ├── AddressColumns.tsx    # TanStack column definitions
│   │   │   └── EditAddressModal.tsx  # Edit dialog
│   │   ├── constants/index.ts        # ADDRESS_DEFAULT_FILTERS
│   │   ├── pages/AddressesListPage.tsx
│   │   └── types/index.ts
│   ├── auditLog/
│   │   ├── api/auditLogApi.ts
│   │   ├── components/AuditLogColumns.tsx
│   │   └── pages/AuditLogPage.tsx
│   ├── auth/
│   │   ├── api/authApi.ts
│   │   ├── authSlice.ts              # Redux slice for auth state
│   │   └── pages/LoginPage.tsx
│   ├── contacts/
│   │   ├── api/contactsApi.ts
│   │   ├── components/
│   │   │   ├── ContactColumns.tsx
│   │   │   └── EditContactModal.tsx
│   │   ├── constants/index.ts        # CONTACT_DEFAULT_FILTERS, CONTACT_ROLE_OPTIONS
│   │   └── pages/ContactsListPage.tsx
│   └── frame/
│       ├── api/frameApi.ts
│       ├── components/
│       │   ├── FrameColumns.tsx
│       │   ├── FrameFilters.tsx      # Dropdowns for estStatus, sectorId, sourceCode
│       │   └── EditFrameModal.tsx
│       ├── constants/index.ts        # FRAME_DEFAULT_FILTERS
│       └── pages/FrameListPage.tsx
├── hooks/                            # Custom React hooks (useDebounce, etc.)
├── providers/
│   └── ReduxProvider.tsx             # Wraps app with Redux store
├── services/
│   ├── api.ts                        # baseApi — RTK Query createApi instance
│   └── axios.ts                      # Axios instance (alternative, same baseURL)
├── store/                            # Redux store configuration
├── types/
│   ├── index.ts                      # Re-exports all types
│   ├── api.types.ts                  # ApiResponse<T>, PaginationParams
│   ├── frame.types.ts                # SbrFrame, FrameFilters
│   ├── contact.types.ts              # SbrContact, ContactFilters
│   ├── address.types.ts              # SbrAddress, AddressFilters
│   ├── auditLog.types.ts             # AuditLog, AuditLogFilters
│   └── auth.types.ts
└── utils/
    ├── format.ts                     # nullableText, formatDate, formatNumber, truncate
    ├── query.ts                      # cleanParams — strips empty values before API call
    └── toast.ts                      # toast.success/error/info/warning
```

---

## API Layer — RTK Query Pattern

All API calls use RTK Query via a single `baseApi` instance.

### `baseApi` (services/api.ts)

- Base URL: `${env.apiUrl}/api/v1`
- Auth: reads `sbr_token` from localStorage, sends as `x-auth-token` header
- Tag types: `['Frame', 'Contacts', 'Addresses', 'Auth', 'AuditLog']`

### Adding endpoints — always use `injectEndpoints`

```typescript
// features/newThing/api/newThingApi.ts
import { baseApi } from '@/services/api';
import type { ApiResponse, NewThing, NewThingFilters } from '@/types';

export const newThingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNewThingList: builder.query<ApiResponse<NewThing[]>, NewThingFilters>({
      query: (params) => ({ url: '/new-thing', params }),
      providesTags: ['NewThing'],                   // add tag to baseApi tagTypes too
    }),
    updateNewThing: builder.mutation<ApiResponse<NewThing>, { id: number; data: Partial<NewThing> }>({
      query: ({ id, data }) => ({ url: `/new-thing/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['NewThing', 'AuditLog'],    // always invalidate AuditLog on mutation
    }),
  }),
  overrideExisting: false,
});

export const { useGetNewThingListQuery, useUpdateNewThingMutation } = newThingApi;
```

**Rule:** Always `invalidatesTags: ['AuditLog']` on any mutation so the Audit Log page auto-refreshes.

---

## Common Utilities — Use These Always

### `cleanParams` (utils/query.ts)

Strips empty strings, null, undefined before sending to API.
**Always wrap query params with this** before passing to RTK Query.

```typescript
import { cleanParams } from '@/utils/query';
const queryParams = cleanParams({ page: 1, name: '', status: 'Active' });
// result: { page: 1, status: 'Active' }  — empty string removed
```

### `nullableText` (utils/format.ts)

Use in table cell renderers when a value can be null.

```typescript
import { nullableText } from '@/utils/format';
nullableText(null)      // "—"
nullableText('')        // "—"
nullableText('Qatar')   // "Qatar"
```

### `formatDate` / `formatNumber` (utils/format.ts)

```typescript
formatDate('2024-01-01T00:00:00Z')  // "Jan 01, 2024"
formatNumber(1500000)               // "1,500,000"
```

### `toast` (utils/toast.ts)

```typescript
import { toast } from '@/utils/toast';
toast.success('Saved!');
toast.error('Something went wrong.');
toast.info('No changes detected.');
toast.warning('Check your input.');
```

**Never** use `alert()` or `console.log()` for user feedback.

---

## Patterns — How to Add a New Feature

Every existing feature (frame, contacts, addresses, auditLog) follows this exact pattern.

### Step 1 — Types (`src/types/newThing.types.ts`)

```typescript
export interface NewThing {
  ID: number;
  NAME: string;
  VALID_FROM: string;
  VALID_TO: string | null;
}

export interface NewThingFilters {
  page?: number;
  limit?: number;
  name?: string;
}
```

Then add to `src/types/index.ts`:
```typescript
export * from './newThing.types';
```

### Step 2 — API slice (`src/features/newThing/api/newThingApi.ts`)

See RTK Query pattern above.

### Step 3 — Column definitions (`src/features/newThing/components/NewThingColumns.tsx`)

```typescript
import type { ColumnDef } from '@tanstack/react-table';
import type { NewThing } from '@/types';
import { nullableText } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

// Always use a factory function when columns need callbacks (e.g. onEdit)
export const getNewThingColumns = (onEdit: (row: NewThing) => void): ColumnDef<NewThing>[] => [
  {
    accessorKey: 'ID',
    header: 'ID',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs font-medium text-blue-700">{String(getValue())}</span>
    ),
  },
  {
    accessorKey: 'NAME',
    header: 'Name',
    cell: ({ getValue }) => <span className="text-sm text-slate-700">{nullableText(getValue<string | null>())}</span>,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>
        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
      </Button>
    ),
  },
];
```

### Step 4 — Edit Modal (`src/features/newThing/components/EditNewThingModal.tsx`)

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateNewThingMutation } from '../api/newThingApi';
import { toast } from '@/utils/toast';
import type { NewThing } from '@/types';

export function EditNewThingModal({ item, open, onClose }: { item: NewThing | null; open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<Partial<NewThing>>({});
  const [updateNewThing, { isLoading }] = useUpdateNewThingMutation();

  useEffect(() => {
    if (item) setForm({ NAME: item.NAME ?? '' });
  }, [item]);

  // ALWAYS check for changes before calling API — prevents empty audit log entries
  const hasChanges = () => {
    if (!item) return false;
    const normalize = (v: unknown) => (v === null || v === undefined || v === '') ? '' : String(v).trim();
    return Object.entries(form).some(([k, v]) => normalize(v) !== normalize(item[k as keyof NewThing]));
  };

  const handleSubmit = async () => {
    if (!item) return;
    if (!hasChanges()) { toast.info('No changes detected.'); return; }
    try {
      await updateNewThing({ id: item.ID, data: form }).unwrap();
      toast.success('Updated successfully!');
      onClose();
    } catch {
      toast.error('Failed to update. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.NAME ?? ''} onChange={(e) => setForm(p => ({ ...p, NAME: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 5 — Page component (`src/features/newThing/pages/NewThingListPage.tsx`)

```typescript
'use client';
import { useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/table/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { getNewThingColumns } from '../components/NewThingColumns';
import { EditNewThingModal } from '../components/EditNewThingModal';
import { useGetNewThingListQuery } from '../api/newThingApi';
import type { NewThing, NewThingFilters } from '@/types';
import { cleanParams } from '@/utils/query';
import { toast } from '@/utils/toast';

const DEFAULT_FILTERS: NewThingFilters = { page: 1, limit: 20 };

export function NewThingListPage() {
  const [filters, setFilters] = useState<NewThingFilters>(DEFAULT_FILTERS);
  const [editTarget, setEditTarget] = useState<NewThing | null>(null);

  const { data, isLoading, isError, refetch } = useGetNewThingListQuery(cleanParams(filters));

  useEffect(() => {
    if (isError) toast.error('Failed to load data. Please try again.');
  }, [isError]);

  const handleFilterChange = useCallback((partial: Partial<NewThingFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const columns = getNewThingColumns((row) => setEditTarget(row));
  const records = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer>
      <PageHeader title="New Things" description="..." />
      <DataTable
        columns={columns} data={records} isLoading={isLoading} isError={isError}
        onRetry={refetch} page={filters.page ?? 1} limit={filters.limit ?? 20} total={total}
        onPageChange={(p) => handleFilterChange({ page: p })}
        onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
      />
      <EditNewThingModal item={editTarget} open={!!editTarget} onClose={() => setEditTarget(null)} />
    </PageContainer>
  );
}
```

### Step 6 — Next.js page (`src/app/(dashboard)/new-thing/page.tsx`)

```typescript
import { NewThingListPage } from '@/features/newThing/pages/NewThingListPage';
export const metadata = { title: 'New Thing — SBR Portal' };
export default function Page() { return <NewThingListPage />; }
```

### Step 7 — Add to navigation (`src/constants/navigation.ts`)

```typescript
{ title: 'New Thing', href: '/new-thing', icon: 'SomeIcon' }
// Then add SomeIcon to ICON_MAP in src/components/layout/Sidebar.tsx
```

---

## DataTable Component

`<DataTable>` accepts these props — always pass all of them:

```typescript
<DataTable
  columns={columns}       // ColumnDef[] from the feature's column file
  data={records}          // array of records
  isLoading={isLoading}
  isError={isError}
  onRetry={refetch}       // called when user clicks retry on error state
  page={filters.page ?? 1}
  limit={filters.limit ?? 20}
  total={total}
  onPageChange={(p) => handleFilterChange({ page: p })}
  onLimitChange={(l) => handleFilterChange({ limit: l, page: 1 })}
/>
```

---

## Column Cell Styling Standards

| Data type | Pattern |
|---|---|
| ID / code | `font-mono text-xs font-medium text-blue-700` |
| Regular text | `text-sm text-slate-700` |
| Nullable text | Use `nullableText()` from utils/format — renders `—` for null |
| Status badge | `<StatusBadge status={val} />` from components/common |
| Source code | `font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded` |
| Role/category | `<Badge variant="secondary">{val}</Badge>` |

---

## Key Rules

1. **Never call `res.json()` directly** — always use `apiResponse.*`
2. **Never hardcode API response strings** — always use `message.*`
3. **Always call `cleanParams()`** before passing filter state to RTK Query
4. **Always check `hasChanges()`** in Edit modals before calling the update mutation
5. **Always `invalidatesTags: ['AuditLog']`** in mutation endpoints
6. **Column files export a factory function** `getXxxColumns(onEdit)` — not a plain array — when edit is needed
7. **`editTarget` state lives in the Page component** — not in the column file
8. **New pages go inside `src/app/(dashboard)/`** to get the sidebar layout automatically
9. **Icons in Sidebar** — add to both `NAVIGATION` array AND `ICON_MAP` in Sidebar.tsx
10. **Types are always imported from `@/types`** (the barrel index) — never from individual type files

---

## Local Dev Setup

```bash
npm install
# Ensure sbr-backend is running on port 4000
# .env.local:
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ENV=development

npm run dev   # runs on localhost:3000
```
