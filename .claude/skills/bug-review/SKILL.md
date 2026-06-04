---
name: bug-review
description: Systematically find runtime bugs, logic errors, and UI issues in SBR frontend code
---

# SBR Frontend Bug Review

Find root causes before proposing fixes. Trace the full data path: API → RTK Query → Component → UI.

## Phase 1 — Understand the Symptom
Ask if not provided:
- What page/feature is broken?
- What exactly is wrong? (no data, wrong data, error state, UI glitch?)
- Does it happen always or only on certain actions?
- What does the browser Network tab show?

## Phase 2 — Trace the Data Flow

```
Backend API → RTK Query hook → cleanParams → Component state → DataTable → Column cell → UI
```

### Common SBR-Specific Bug Locations

**`cleanParams` missing — empty params sent to API**
```typescript
// Bug: sends empty strings causing validation errors
useGetContactsListQuery(filters)

// Fix: always wrap
useGetContactsListQuery(cleanParams(filters))
```

**`page` not reset on filter change**
```typescript
// Bug: user on page 3, changes filter, stays on page 3 with 0 results
handleFilterChange({ contactName: v })

// Fix: always reset page
handleFilterChange({ contactName: v, page: 1 })
```

**`AuditLog` not in `invalidatesTags` — audit page doesn't refresh**
```typescript
// Bug: edit succeeds but audit log page still shows old data
invalidatesTags: ['Contacts']

// Fix: always include AuditLog
invalidatesTags: ['Contacts', 'AuditLog']
```

**`hasChanges()` missing in modal — empty audit entries created**
```typescript
// Bug: user clicks Save without changing anything — API called, empty audit entry created
const handleSubmit = async () => {
  await updateContact({ id, data: form }).unwrap()   // always fires
}

// Fix: guard with hasChanges()
const handleSubmit = async () => {
  if (!hasChanges()) { toast.info('No changes detected.'); return; }
  await updateContact({ id, data: form }).unwrap()
}
```

**`editTarget` state in column file — modal doesn't open**
```typescript
// Bug: onEdit callback has no way to set state in parent
export const contactColumns: ColumnDef<SbrContact>[] = [...]   // plain array, no callback

// Fix: factory function pattern
export const getContactColumns = (onEdit: (row: SbrContact) => void): ColumnDef<SbrContact>[] => [...]
// editTarget state lives in ContactsListPage, not in column file
```

**Column using plain array instead of factory — edit button broken**
```typescript
// Bug: clicking Edit does nothing — onEdit is undefined
export const contactColumns = [{ id: 'actions', cell: () => <Button onClick={() => onEdit(row)}>  // onEdit undefined
```

**Form not pre-populated on modal open**
```typescript
// Bug: modal opens with empty fields
useEffect(() => {
  setForm({})   // always resets
}, [contact])

// Fix: populate from contact
useEffect(() => {
  if (contact) setForm({ CONTACT_NAME: contact.CONTACT_NAME ?? '', ... })
}, [contact])
```

**Toast not showing — wrong import**
```typescript
// Bug: importing from wrong package
import { toast } from 'react-toastify'   // not installed

// Fix: use SBR's own toast util
import { toast } from '@/utils/toast'
```

## Phase 3 — Confirm Root Cause
State: "The bug is in [file:line] because [specific reason]"

## Phase 4 — Apply Fix
Fix the root cause. Check if the same pattern exists in other feature files.
