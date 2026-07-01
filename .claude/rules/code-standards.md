# Code Standards — SBR Frontend

## UI Design Standards (auto-enforced on every change)
- Primary color is ALWAYS `blue-700` — never `indigo`, `violet`, `teal`, or custom hex
- NEVER use Tailwind colors outside the design system palette (slate, blue, emerald, red, amber)
- ALWAYS use `nullableText()` for nullable cell values — never raw `null` or empty string
- ALWAYS use `<StatusBadge>` for Active/Inactive — never custom inline badge
- ALWAYS wrap `<Table>` in `<div className="overflow-x-auto">` for mobile responsiveness
- Filter bars ALWAYS use: `flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg`
- Modal footer ALWAYS: Cancel (`outline`) left, Save (`default`) right, both disabled while loading
- Page titles ALWAYS: `text-xl font-semibold text-slate-900`
- Table headers ALWAYS: `text-xs font-medium text-slate-500 uppercase tracking-wide`
- No fixed pixel widths on layout containers — use `max-w-*` with `w-full`

These rules apply to ALL code written in this repo. Claude must follow these without being asked.

## API Rules
- NEVER create a new `createApi()` — always `baseApi.injectEndpoints()`
- ALWAYS `invalidatesTags: ['AuditLog']` on every mutation — no exceptions
- ALWAYS `overrideExisting: false` in `injectEndpoints()`
- ALWAYS wrap filter state with `cleanParams()` before passing to RTK Query
- NEVER call API directly with `fetch()` or `axios` in components — always RTK Query

## Search Rules
- EVERY new search input MUST use debounce — never call the API on every keystroke
- Use the existing `useDebounce` hook from `src/hooks/` — NEVER reimplement debounce inline
- Standard debounce delay: **400 ms** (consistent across the project)
- Use the existing `<SearchInput>` component from `@/components/common/SearchInput` wherever it fits — it already wires `useDebounce` internally
- If `SearchInput` doesn't fit (e.g. inline table filter), apply `useDebounce` manually and pass the debounced value to `cleanParams()` / the RTK Query hook
- ALWAYS reset `page: 1` when the debounced search value changes

## State Rules
- `editTarget` state always lives in the Page component — NEVER in column files
- `handleFilterChange` always wrapped in `useCallback`
- Filter changes must ALWAYS include `page: 1` reset
- `useState` default for edit target: `null` typed as `MyType | null`

## Edit Modal Rules
- ALWAYS implement `hasChanges()` before calling any mutation
- If no changes: `toast.info('No changes detected.')` and `return` — do NOT call API
- ALWAYS `toast.success()` on successful update
- ALWAYS `toast.error()` in catch block
- ALWAYS disable both buttons while `isLoading`
- Form populated in `useEffect` with original record as dependency

## Column File Rules
- ALWAYS export factory function: `export const get{Name}Columns = (onEdit: ...) => [...]`
- NEVER export plain array constant for columns that need callbacks
- Null values: use `nullableText()` from `@/utils/format` OR `—` inline
- No business logic in column cells — only formatting/display

## Toast Rules
- ALWAYS use `import { toast } from '@/utils/toast'`
- NEVER use `alert()`, `window.alert()`, or any third-party toast library
- Success: `toast.success()`, Error: `toast.error()`, Info: `toast.info()`

## TypeScript Rules
- No `any` type — if unavoidable, add comment explaining why
- Types always imported from `@/types` barrel — never from individual type files
- All props interfaces defined inline or in same file

## File & Naming Rules
- Feature pages: `{Name}ListPage.tsx` in `features/{name}/pages/`
- Column files: `{Name}Columns.tsx` in `features/{name}/components/`
- Edit modals: `Edit{Name}Modal.tsx` in `features/{name}/components/`
- API slices: `{name}Api.ts` in `features/{name}/api/`
- Next.js pages: thin wrappers only — no logic, just render the feature page

## Comment Rules
- Write NO comments unless WHY is non-obvious
- No TODO in committed code
- No commented-out code blocks

## Import Rules
- Use `@/` path alias — never relative `../../` beyond one level
- Group: React/Next first, then external libs, then internal components/utils/types
- Remove all unused imports
