# SBR Frontend — Claude Context

Statistical Business Register UI for NPC Qatar. **Next.js 14 (App Router) + RTK Query + Tailwind + shadcn/ui.**

> Keep this file lean. It is loaded every turn — so are all the `@import`s below. Put *how-to-work* rules in `.claude/rules/`, design facts in `.claude/references/`, and step-by-step recipes in `.claude/skills/`. Don't duplicate them here; point to them.
 
## Imported rules & references (auto-loaded — read them, don't repeat them here)
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

## Skills (on-demand — invoke instead of inlining the recipe)
- `add-feature` — scaffold a feature: types → api slice → columns → edit modal → page → route → nav
- `ui-design` — apply the maroon design system to new UI
- `code-review`, `typescript-review`, `bug-review` — review passes

---

## The rules that matter most
1. **API:** never `createApi()` — always `baseApi.injectEndpoints({ overrideExisting: false })`. Every mutation `invalidatesTags: ['AuditLog']` (+ its own tag). Never `fetch`/`axios` in components. (`rules/api-pattern.md`)
2. **Filters:** wrap filter state in `cleanParams()` before passing to a query hook; any filter change also resets `page: 1`.
3. **Edit modals:** implement `hasChanges()`; if none → `toast.info('No changes detected.')` and return. `toast.success` on ok, `toast.error` in catch, both buttons disabled while loading.
4. **Display:** `nullableText()` for nullable cells; `<StatusBadge>` for status; `formatDate`/`formatNumber` for those. Never raw `null`/`''`.
5. **Theme:** maroon `#A71D3A` (this build overrides the blue-700 in the design-system doc). Dropdowns use the themed `Select`, never native `<select>`. Soft focus ring on filter inputs: `focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20`. (`rules/styling.md`)
6. **Shared utils/components:** before changing anything in `src/utils`, `src/hooks`, or `src/components`, grep all callers and follow `rules/common-function-rule.md` — modify only if no caller breaks, else add a new function.
7. **Constants:** enums/labels/options live in `src/features/{feature}/constants/` and must match the backend enums. Never inline. (`rules/constants-enums.md`)
8. **i18n:** user-facing strings via `t('key', { defaultValue })`; keep `public/locales/en.json` + `ar.json` valid JSON.

---

## Layout (high level)
```
src/
├── app/
│   ├── (dashboard)/        one folder per route → renders a feature page (thin wrapper)
│   └── login/
├── components/
│   ├── common/             PageContainer, PageHeader, SearchInput, StatusBadge,
│   │                       FieldHistoryPopover, Pending* badges, skeletons, …
│   ├── table/              DataTable, TablePagination
│   └── ui/                 shadcn primitives (button, input, dialog, select, …)
├── features/{name}/        api/ · components/ · constants/ · pages/ · types/
│                           (establishments, enterprises, enterpriseGroups, contacts,
│                            addresses, tasks, approvals, auditLog, admin, home, …)
├── services/api.ts         single baseApi (RTK Query)
├── store/ · providers/ · hooks/ · i18n/
├── types/                  barrel at index.ts — always import from '@/types'
└── utils/                  format, query (cleanParams), toast
```
Adding a feature (types → api → columns → modal → page → route → nav): use the `add-feature` skill.

## Data layer
- Single `baseApi` in `services/api.ts`. To add a tag type, add it to `tagTypes` there (current set includes Establishments, Enterprises, Contacts, Addresses, AuditLog, Admin, ChangeRequests, Auth) — `services/api.ts` is the source of truth, don't restate the list here.
- Base URL `${env.apiUrl}/api/v1`; auth via `x-auth-token` from `localStorage`.
- Permissions via `usePermission(baseKey)` → `{ canView, canEdit, canViewDetail, canViewHistory, canApprove, … }`; SUPER_ADMIN gets all.

## Loading states
Every page shows a **shimmer skeleton** (the `Skeleton` primitive / shared `PageLoader` / `TableLoader`), never a spinner for content. New page ⇒ matching `{Page}Skeleton` in `components/common/`. (`rules/styling.md`)

---

## Security — CRITICAL ⚠️
**Never commit secrets** (API keys, tokens, credentials, real user data) — not in code, `docs/`, `.claude/`, `CLAUDE.md`, commit messages, or `.env.example`. Real values go only in `.env.local` (gitignored). If one leaks: rotate, scrub history, report.

## Local dev
```bash
npm install
# .env.local: NEXT_PUBLIC_API_URL → the running backend, NEXT_PUBLIC_ENV=development
npm run dev   # http://localhost:3000
```
Type-check: `npx tsc --noEmit`.
