---
name: code-review
description: Review changed frontend code for correctness, SBR standards, missing patterns, and bugs before committing
---

# SBR Frontend Code Review

Review all recently changed files against SBR frontend standards. Find actual violations — don't describe what code does.

## Step 1 — Identify Changed Files
```bash
git diff --name-only HEAD
```

## Step 2 — Check Each File Against These Rules

### API Slice Checklist (features/*/api/*.ts)
- [ ] Uses `baseApi.injectEndpoints()` — never creates a new `createApi()`
- [ ] All queries have `providesTags`
- [ ] All mutations have `invalidatesTags` — and ALWAYS include `'AuditLog'`
- [ ] `overrideExisting: false` is set
- [ ] Hooks exported at the bottom of the same file

### Page Component Checklist (features/*/pages/*.tsx)
- [ ] Has `'use client'` directive at top
- [ ] Uses `cleanParams(filters)` before passing to RTK Query hook
- [ ] `useEffect` with `isError` shows `toast.error()` — not `alert()`
- [ ] `editTarget` state lives in page — not in column file
- [ ] `handleFilterChange` uses `useCallback`
- [ ] Resets `page: 1` when any filter changes
- [ ] `<DataTable>` receives all required props: columns, data, isLoading, isError, onRetry, page, limit, total, onPageChange, onLimitChange
- [ ] `<EditModal>` rendered at bottom of page, outside `<DataTable>`

### Column File Checklist (features/*/components/*Columns.tsx)
- [ ] Exports a factory function `getXxxColumns(onEdit)` — NOT a plain array constant
- [ ] Null values displayed with `nullableText()` or `—` fallback
- [ ] ID/code fields use: `font-mono text-xs font-medium text-blue-700`
- [ ] Regular text fields use: `text-sm text-slate-700`
- [ ] Source codes use: `font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded`
- [ ] Edit button uses `<Button size="sm" variant="outline">`

### Edit Modal Checklist (features/*/components/Edit*Modal.tsx)
- [ ] Has `hasChanges()` check — returns `toast.info('No changes detected.')` if no diff
- [ ] Calls `toast.success()` on successful update
- [ ] Calls `toast.error()` in catch block
- [ ] Both buttons disabled while `isLoading`
- [ ] `useEffect` with `[originalRecord]` dependency to populate form

### Type Checklist (types/*.types.ts + types/index.ts)
- [ ] New types exported from `src/types/index.ts` barrel
- [ ] Components import from `@/types` — never from individual type files

### Navigation Checklist (when adding new page)
- [ ] Added to `NAVIGATION` in `src/constants/navigation.ts`
- [ ] Icon string added to `ICON_MAP` in `src/components/layout/Sidebar.tsx`
- [ ] Next.js page file created under `src/app/(dashboard)/`
- [ ] Page file is a thin wrapper — no logic in it

## Step 3 — Report Format
```
FILE: src/features/contacts/api/contactsApi.ts
  IMPORTANT: updateContact mutation missing 'AuditLog' in invalidatesTags
  MINOR: unused import 'SbrContact' at line 2
  OK: providesTags correct, overrideExisting: false present
```

## Step 4 — Fix All Issues
Apply CRITICAL and IMPORTANT fixes directly.
