---
name: typescript-review
description: Review and fix TypeScript quality issues — any types, missing types, unsafe casts, and type safety gaps in SBR frontend code
---

# SBR Frontend TypeScript Review

Find and fix TypeScript quality issues in the frontend codebase.

## Step 1 — Scan for Issues

```bash
npx tsc --noEmit 2>&1
```

Grep for anti-patterns:
```bash
grep -rn ": any" src/ --include="*.ts" --include="*.tsx"
grep -rn "as any" src/ --include="*.ts" --include="*.tsx"
grep -rn "// @ts-ignore" src/ --include="*.ts" --include="*.tsx"
```

## Step 2 — Check These Specific Patterns

### RTK Query return types
```typescript
// Must match backend ApiResponse shape exactly
builder.query<ApiResponse<SbrContact[]>, ContactFilters>({...})
// ApiResponse<T> is defined in src/types/api.types.ts — use it
```

### Mutation arg types
```typescript
// Always typed as: { id: number; data: Partial<MyType> }
builder.mutation<ApiResponse<SbrContact>, { id: number; data: Partial<SbrContact> }>({...})
```

### getValue typing in columns
```typescript
// Always provide the type param
getValue<string | null>()   // correct
getValue()                   // wrong — returns unknown
```

### Column factory function typing
```typescript
// onEdit must be typed with the exact model type
export const getContactColumns = (onEdit: (row: SbrContact) => void): ColumnDef<SbrContact>[] => [...]
// SbrContact imported from '@/types' — never from individual type file
```

### useState typing for editTarget
```typescript
// Always typed — never let TypeScript infer null as the initial type
const [editTarget, setEditTarget] = useState<SbrContact | null>(null);
```

### hasChanges typing
```typescript
// The key cast must be typed correctly
Object.entries(form).some(([key, val]) =>
  normalize(val) !== normalize(originalRecord[key as keyof SbrContact])
)
// 'as keyof SbrContact' is acceptable here — it's a known safe cast
```

### ApiResponse data access
```typescript
// data?.data can be undefined — always provide fallback
const records = data?.data ?? [];
const total = data?.total ?? 0;
```

### Event handler types
```typescript
// Be explicit with event types
onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}
// Not just: onChange={(e) => ...}
```

### Component prop interfaces
```typescript
// Always define Props interface inline or in same file
interface Props {
  contact: SbrContact | null;
  open: boolean;
  onClose: () => void;
}
export function EditContactModal({ contact, open, onClose }: Props) { ... }
```

## Step 3 — Check Type Barrel Exports

Verify `src/types/index.ts` exports all types:
```typescript
export * from './api.types';
export * from './frame.types';
export * from './contact.types';
export * from './address.types';
export * from './auditLog.types';
export * from './auth.types';
// any new type files must be added here
```

## Step 4 — Fix Issues

Priority order:
1. `tsc --noEmit` errors
2. Missing type params on `getValue<T>()`
3. Unsafe `any` in business logic
4. Missing fallback on nullable data access

## Step 5 — Report

```
FIXED    src/features/contacts/components/ContactColumns.tsx:18 — added <string | null> to getValue()
FIXED    src/features/frame/pages/FrameListPage.tsx:23 — typed editTarget as SbrFrame | null
INFO     src/features/contacts/components/EditContactModal.tsx:45 — 'as keyof SbrContact' is acceptable
CLEAN    src/types/ — all types properly exported from barrel
```
