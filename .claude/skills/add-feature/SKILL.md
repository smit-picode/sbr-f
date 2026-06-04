---
name: add-feature
description: Scaffold a complete new frontend feature (types, API, columns, modal, page, route, navigation) following SBR patterns
---

# Add New Frontend Feature

Scaffold a complete feature following the exact SBR 7-step pattern. Ask for feature name and fields if not in the prompt.

## Before Starting — Collect Requirements
1. What is the feature name? (e.g. `enterprises`)
2. What fields does the data have?
3. Does it need an Edit modal?
4. What filters/search should it support?
5. What is the backend API endpoint? (e.g. `/api/v1/enterprises`)

## Step 1 — Types (`src/types/{name}.types.ts`)

```typescript
export interface MyType {
  ID: number;
  // ... all fields matching backend model
  VALID_FROM: string | null;
  VALID_TO: string | null;
}

export interface MyFilters {
  page?: number;
  limit?: number;
  // ... filter fields
}
```

Then add to `src/types/index.ts`:
```typescript
export * from './{name}.types';
```

## Step 2 — API Slice (`src/features/{name}/api/{name}Api.ts`)

```typescript
import { baseApi } from '@/services/api';
import type { ApiResponse, MyType, MyFilters } from '@/types';

export const myApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyList: builder.query<ApiResponse<MyType[]>, MyFilters>({
      query: (params) => ({ url: '/{endpoint}', params }),
      providesTags: ['MyTag'],
    }),
    updateMy: builder.mutation<ApiResponse<MyType>, { id: number; data: Partial<MyType> }>({
      query: ({ id, data }) => ({ url: `/{endpoint}/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['MyTag', 'AuditLog'],   // ALWAYS include AuditLog
    }),
  }),
  overrideExisting: false,
});

export const { useGetMyListQuery, useUpdateMyMutation } = myApi;
```

Also add `'MyTag'` to `tagTypes` in `src/services/api.ts`.

## Step 3 — Column Definitions (`src/features/{name}/components/{Name}Columns.tsx`)

Always use factory function (NOT plain array):
```typescript
export const get{Name}Columns = (onEdit: (row: MyType) => void): ColumnDef<MyType>[] => [
  // ID column — blue monospace
  // text columns — nullableText()
  // enum columns — Badge
  // actions column with Edit button
];
```

Cell styling rules — see `.claude/rules/styling.md`.

## Step 4 — Edit Modal (`src/features/{name}/components/Edit{Name}Modal.tsx`)

MUST include:
- `useEffect([originalRecord])` to populate form
- `hasChanges()` guard before calling mutation
- `toast.success()` on save, `toast.error()` in catch
- Both buttons disabled while `isLoading`

## Step 5 — Page Component (`src/features/{name}/pages/{Name}ListPage.tsx`)

```typescript
'use client';
// imports...

const DEFAULT_FILTERS: MyFilters = { page: 1, limit: 20 };

export function {Name}ListPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [editTarget, setEditTarget] = useState<MyType | null>(null);  // state here, not in columns

  const { data, isLoading, isError, refetch } = useGetMyListQuery(cleanParams(filters));

  useEffect(() => {
    if (isError) toast.error('Failed to load data.');
  }, [isError]);

  const handleFilterChange = useCallback((partial: Partial<MyFilters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  }, []);

  const columns = get{Name}Columns(row => setEditTarget(row));

  return (
    <PageContainer>
      <PageHeader title="..." description="..." />
      {/* filters */}
      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading}
        isError={isError} onRetry={refetch} page={filters.page ?? 1}
        limit={filters.limit ?? 20} total={data?.total ?? 0}
        onPageChange={p => handleFilterChange({ page: p })}
        onLimitChange={l => handleFilterChange({ limit: l, page: 1 })} />
      <Edit{Name}Modal item={editTarget} open={!!editTarget} onClose={() => setEditTarget(null)} />
    </PageContainer>
  );
}
```

## Step 6 — Next.js Page (`src/app/(dashboard)/{route}/page.tsx`)

```typescript
import { {Name}ListPage } from '@/features/{name}/pages/{Name}ListPage';
export const metadata = { title: '{Name} — SBR Portal' };
export default function Page() { return <{Name}ListPage />; }
```

## Step 7 — Navigation
1. Add to `src/constants/navigation.ts`:
```typescript
{ title: '{Name}', href: '/{route}', icon: '{IconName}' }
```
2. Import icon and add to `ICON_MAP` in `src/components/layout/Sidebar.tsx`

## Final Checklist
- [ ] Type exported from `src/types/index.ts`
- [ ] Tag added to `baseApi` tagTypes in `src/services/api.ts`
- [ ] Column file exports factory function `get{Name}Columns(onEdit)`
- [ ] `editTarget` state in Page, not in column file
- [ ] `hasChanges()` in Edit modal
- [ ] `invalidatesTags: ['AuditLog']` in mutation
- [ ] `cleanParams()` wrapping query params
- [ ] Navigation and Sidebar both updated
