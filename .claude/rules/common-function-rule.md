# Common Function Rules

## Rule 1 — Search Before Creating

BEFORE writing any new utility function or hook:

1. Search existing utils first:
   ```
   src/utils/format.ts    → nullableText, formatDate, formatNumber, truncate
   src/utils/query.ts     → cleanParams
   src/utils/toast.ts     → toast.success/error/info/warning
   src/hooks/             → useDebounce and other custom hooks
   src/services/api.ts    → baseApi (RTK Query base)
   ```

2. Ask: "Does any existing function solve this, even partially?"

3. If YES → use the existing function. Do not duplicate.

## Rule 2 — Never Silently Modify a Shared Function

If you need to change behavior of any function in `src/utils/` or `src/hooks/`:

**Step 1 — Find all callers:**
```bash
grep -r "functionName" src/ --include="*.ts" --include="*.tsx"
```

**Step 2 — Analyze impact for each caller:**
- Does your change alter what the function returns?
- Does it change how it handles null/undefined?
- Does it change the function signature?

**Step 3 — Decision:**

| Scenario | Action |
|----------|--------|
| Adding optional param with safe default | Safe to modify |
| Bug fix that all callers benefit from | Safe — verify each caller |
| Changes behavior for ANY existing caller | Create NEW function |
| Changes return type | Create NEW function |

**Step 4 — If modifying:**
- Read every caller after modifying
- Confirm behavior is correct for each
- Never assume it's fine

**Step 5 — If creating new:**
- Name clearly: `cleanParamsStrict()` not `cleanParams2()`
- Put in the same file as the related function
- Export from same location

## Rule 3 — Examples from This Codebase

**DO:**
```typescript
// cleanParams already exists
const queryParams = cleanParams({ ...filters, contactName: debouncedName });

// nullableText already handles null display
cell: ({ getValue }) => <span>{nullableText(getValue<string | null>())}</span>

// toast utility already exists — use it
toast.error('Failed to load contacts.');
```

**DON'T:**
```typescript
// Don't re-implement null handling inline
cell: ({ getValue }) => <span>{getValue() ?? '—'}</span>  // use nullableText()

// Don't filter params manually
const q = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''))  // use cleanParams()

// Don't use alert or console for user feedback
alert('Saved!')   // use toast.success()
```

## Rule 4 — `baseApi` Is Shared — Never Replace It

`src/services/api.ts` exports a single `baseApi`. All feature APIs inject into it.
- NEVER create a second `createApi()` call
- NEVER import `fetchBaseQuery` directly in feature files
- If a new tag type is needed, add it to `tagTypes` in `src/services/api.ts`

## Rule 5 — Modification Checklist

Before touching any file in `src/utils/` or `src/hooks/`:

- [ ] Ran grep to find all callers
- [ ] Read every caller to understand current usage
- [ ] Confirmed change doesn't alter behavior for existing callers
- [ ] If breaking: created new function with distinct name
- [ ] Both old callers and new usage work correctly
