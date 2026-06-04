# Common Functions — Reference & Rules

---

## Existing Utilities — Use These, Never Recreate Them

### cleanParams — `utils/query.ts`
Strips empty string, null, undefined from filter objects before API calls.
```typescript
import { cleanParams } from '@/utils/query';
cleanParams({ page: 1, name: '', status: 'Active' })
// → { page: 1, status: 'Active' }
```
ALWAYS wrap filter state with this before passing to RTK Query hooks.

### nullableText — `utils/format.ts`
Use in table cell renderers for nullable string fields.
```typescript
import { nullableText } from '@/utils/format';
nullableText(null)      // "—"
nullableText('')        // "—"
nullableText('Qatar')   // "Qatar"
```

### formatDate — `utils/format.ts`
```typescript
import { formatDate } from '@/utils/format';
formatDate('2024-01-01T00:00:00Z')   // "Jan 01, 2024"
formatDate(null)                      // "—"
```

### formatNumber — `utils/format.ts`
```typescript
import { formatNumber } from '@/utils/format';
formatNumber(1500000)   // "1,500,000"
formatNumber(null)      // "—"
```

### truncate — `utils/format.ts`
```typescript
import { truncate } from '@/utils/format';
truncate('Very long text here', 20)   // "Very long text here..."
```

### toast — `utils/toast.ts`
```typescript
import { toast } from '@/utils/toast';
toast.success('Contact updated successfully!');
toast.error('Failed to load. Please try again.');
toast.info('No changes detected.');
toast.warning('Check your input.');
```
NEVER use `alert()` or `console.log()` for user-facing messages.

### hasChanges — pattern in all Edit modals
Prevents empty audit log entries when user saves without changing anything.
```typescript
const hasChanges = () => {
  if (!originalRecord) return false;
  const normalize = (v: unknown) => (v === null || v === undefined || v === '') ? '' : String(v).trim();
  return Object.entries(form).some(([key, val]) =>
    normalize(val) !== normalize(originalRecord[key as keyof MyType])
  );
};

const handleSubmit = async () => {
  if (!hasChanges()) { toast.info('No changes detected.'); return; }
  // ... call mutation
};
```

### baseApi — `services/api.ts`
Single RTK Query instance. NEVER create a second `createApi()`.
All feature APIs use `baseApi.injectEndpoints()`.
New tag types → add to `tagTypes` in `src/services/api.ts`.

---

## DO / DON'T Examples

**DO — use existing utilities:**
```typescript
const queryParams = cleanParams({ ...filters, contactName: debouncedName });
cell: ({ getValue }) => <span>{nullableText(getValue<string | null>())}</span>
toast.error('Failed to load contacts.');
```

**DON'T — reinvent what already exists:**
```typescript
// ❌ Don't re-implement null handling inline
cell: ({ getValue }) => <span>{getValue() ?? '—'}</span>

// ❌ Don't filter params manually
const q = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''))

// ❌ Don't use alert for user feedback
alert('Saved!')
```

---

## Rules — Before Creating a New Function

**Step 1 — Search first:**
```
src/utils/format.ts   → nullableText, formatDate, formatNumber, truncate
src/utils/query.ts    → cleanParams
src/utils/toast.ts    → toast.success/error/info/warning
src/hooks/            → useDebounce and other hooks
src/services/api.ts   → baseApi
```

**Step 2 — Ask:** Does any existing function solve this, even partially?
- YES → use it. No duplication.
- SIMILAR but not exact → try calling with different params before creating new.
- NO → create a new one (see naming rules below).

**Step 3 — Naming a new function:**
- Name clearly by purpose: `cleanParamsStrict()` not `cleanParams2()`
- Put in the same file as the closest related function
- Export from the same location

---

## Rules — Before Modifying a Shared Function

If you need to change any function in `src/utils/` or `src/hooks/`:

**Step 1 — Find all callers:**
```bash
grep -r "functionName" src/ --include="*.ts" --include="*.tsx"
```

**Step 2 — Decide:**

| Scenario | Action |
|----------|--------|
| Adding optional param with safe default | Safe to modify |
| Bug fix all callers benefit from | Safe — verify each caller after |
| Changes behavior for ANY existing caller | Create a NEW function instead |
| Changes return type or shape | Create a NEW function instead |

**Step 3 — If modifying:** read every caller after the change. Confirm each one still works. Never assume.

**Step 4 — If creating new:** put it in the same file, export from the same location, name it clearly.

---

## Modification Checklist

Before touching any file in `src/utils/` or `src/hooks/`:

- [ ] Ran grep to find all callers
- [ ] Read every caller to understand current usage
- [ ] Confirmed change doesn't alter behavior for existing callers
- [ ] If breaking: created new function with distinct name instead
- [ ] Both old callers and new usage verified correct
