# Constants & Enums Organization Rules

## Rule 1 — All Constants Go in Feature-Specific Constant Files

NEVER define constants inline in component files. **All** constants, enums, and option arrays must be stored in a feature's `constants/index.ts` file.

### What Goes in Constants Files

```
src/features/{feature}/constants/index.ts
```

Must include:

- **Field labels** for error messages and form display
  ```typescript
  export const FEATURE_FIELD_LABELS: Record<string, string> = {
    FIELD_NAME: 'Human Readable Name',
    ...
  };
  ```

- **Enum values** from backend
  ```typescript
  export const STATUS_OPTIONS: string[] = ['Active', 'Inactive'];
  export const ROLE_OPTIONS: string[] = ['Owner', 'Manager'];
  export const SOURCE_CODE_OPTIONS: (string | null)[] = ['MOCI', 'QFC', null];
  ```

- **Validation rules** (max lengths, min values, etc.)
  ```typescript
  export const FEATURE_MAX_LENGTHS: Record<string, number> = {
    NAME: 500,
    DESCRIPTION: 200,
    ...
  };
  ```

- **Filter dropdown options** (only for filters)
  ```typescript
  export const FEATURE_FILTER_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'Active' },
    ...
  ];
  ```

- **Default filter values**
  ```typescript
  export const FEATURE_DEFAULT_FILTERS = {
    page: 1,
    limit: 20,
    search: '',
    status: '',
  } as const;
  ```

### Import Pattern

**DO:**
```typescript
import {
  FEATURE_FIELD_LABELS,
  STATUS_OPTIONS,
  FEATURE_MAX_LENGTHS,
} from '../constants';
```

**DON'T:**
```typescript
// ❌ Define inline in component
const FIELD_LABELS = { ... };
const STATUS_OPTIONS = [...];
const MAX_LENGTHS = { ... };
```

## Rule 2 — Type Enum Arrays Explicitly

All enum/option arrays must have explicit TypeScript types:

```typescript
// ✅ Correct
export const STATUS_OPTIONS: string[] = ['Active', 'Inactive'];
export const PRIORITY_OPTIONS: (string | null)[] = ['High', 'Low', null];
export const NUMBERS: number[] = [1, 2, 3];

// ❌ Wrong — TypeScript can't infer correctly
const STATUS_OPTIONS = ['Active', 'Inactive'];
const PRIORITY_OPTIONS = ['High', 'Low', null];
```

## Rule 3 — ErrorSummary Components Must Accept Field Labels

When using an `ErrorSummary` component, always pass field labels as a prop:

```typescript
function ErrorSummary({ 
  errors, 
  onErrorClick, 
  fieldLabels 
}: { 
  errors: Record<string, string>; 
  onErrorClick: (field: string) => void;
  fieldLabels: Record<string, string>;
}) {
  // Use fieldLabels[field] to display human-readable names
}

// Usage in modal:
<ErrorSummary 
  errors={errors} 
  onErrorClick={scrollToField} 
  fieldLabels={FEATURE_FIELD_LABELS} 
/>
```

## Rule 4 — Render Options Dynamically from Constants

For select dropdowns, render options from constant arrays, **never hardcode**:

```typescript
// ✅ Correct — dynamic from constants
<select value={form.status} onChange={(e) => set('status', e.target.value)}>
  <option value="">— Select —</option>
  {STATUS_OPTIONS.map((option) => (
    <option key={option} value={option}>{option}</option>
  ))}
</select>

// ❌ Wrong — hardcoded options
<select value={form.status} onChange={(e) => set('status', e.target.value)}>
  <option value="">— Select —</option>
  <option value="Active">Active</option>
  <option value="Inactive">Inactive</option>
</select>
```

## Rule 5 — Validation Must Reference Constants

Validation logic must use constants from the constants file, never hardcoded:

```typescript
// ✅ Correct
const validate = (): boolean => {
  const e: Record<string, string> = {};
  
  Object.entries(FEATURE_MAX_LENGTHS).forEach(([field, max]) => {
    if (String(form[field as keyof FormState]).length > max) {
      e[field] = `Max ${max} characters allowed`;
    }
  });

  if (form.status && !STATUS_OPTIONS.includes(form.status)) {
    e.status = `Must be one of [${STATUS_OPTIONS.join(', ')}]`;
  }
  
  return Object.keys(e).length === 0;
};

// ❌ Wrong — hardcoded values
const validate = (): boolean => {
  if (String(form.name).length > 500) {
    e.name = 'Max 500 characters allowed';
  }
  if (!['Active', 'Inactive'].includes(form.status)) {
    e.status = 'Must be Active or Inactive';
  }
};
```

## Rule 6 — Backend Enum Values Must Match Frontend Constants

Enums in frontend constants MUST exactly match backend validator enums. Always reference the backend enum definition.

**Backend example** (`src/utils/enums.ts`):
```typescript
export const STATUS_OPTIONS = ['Active', 'Inactive'];
export const ROLE_OPTIONS = ['Owner', 'Manager'];
```

**Frontend matching** (`src/features/entity/constants/index.ts`):
```typescript
// ✅ Must match backend exactly
export const STATUS_OPTIONS: string[] = ['Active', 'Inactive'];
export const ROLE_OPTIONS: string[] = ['Owner', 'Manager'];
```

## Rule 7 — Checklist Before Writing a Component

Before creating an edit modal or form component:

- [ ] Created `src/features/{feature}/constants/index.ts` if not exists
- [ ] Moved all enum values to constants file
- [ ] Moved all field labels to `FEATURE_FIELD_LABELS`
- [ ] Moved all validation limits to `FEATURE_MAX_LENGTHS`
- [ ] Imported all constants at top of component
- [ ] Removed all inline constant definitions from component
- [ ] ErrorSummary accepts `fieldLabels` prop
- [ ] Select dropdowns render from constants using `.map()`
- [ ] Validation uses constants, not hardcoded values

## Rule 8 — Naming Conventions

| Item | Pattern |
|------|---------|
| Field labels | `{FEATURE}_FIELD_LABELS` |
| Enum options | `{OPTION_NAME}_OPTIONS` |
| Max lengths | `{FEATURE}_MAX_LENGTHS` |
| Default filters | `{FEATURE}_DEFAULT_FILTERS` |
| Filter options | `{FEATURE}_FILTER_OPTIONS` |

Examples:
```typescript
export const FRAME_FIELD_LABELS = {...};
export const EST_STATUS_OPTIONS = [...];
export const CONTACT_MAX_LENGTHS = {...};
export const ADDRESS_DEFAULT_FILTERS = {...};
```

## Rule 9 — Backend Constants Must Be Centralized

All backend enums and constants go in `src/utils/enums.ts` and `src/utils/common.ts`:

```typescript
// src/utils/enums.ts — all enums here
export const STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const ROLE = {
  ADMIN: 'Admin',
  VIEWER: 'Viewer',
};

// Usage in validators
import { STATUS, ROLE } from '../../utils/enums';

if (!Object.values(STATUS).includes(req.body.status)) {
  // error
}
```

**DON'T:**
```typescript
// ❌ Never define enums in individual controller/validator files
const STATUS_OPTIONS = ['Active', 'Inactive'];
```

## Rule 10 — Update Documentation When Adding New Constants

When adding new enum values, update:

1. **Backend** (`src/utils/enums.ts`)
2. **Frontend** (`src/features/{feature}/constants/index.ts`)
3. **Backend CLAUDE.md** reference section
4. **Frontend CLAUDE.md** reference section
5. **API Validator** (backend) to validate against updated enum

