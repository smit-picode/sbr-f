# QInsights Theme Shell Implementation Plan

> **For agentic workers:** This plan is executed **inline, in the main session — no subagent delegation** (standing project preference). Work through tasks in order; verify each with the loop below before moving on.

**Goal:** Re-skin the SBR Portal shell (color tokens, Sidebar, Header→Banner merge, Badge/StatusBadge, DataTable chrome, buttons, inputs) to match the `SBR-design/` QInsights reference prototype, with zero change to flow, permissions, data, or API behavior.

**Architecture:** Additive Tailwind v4 `@theme` tokens in `globals.css`, then a component-by-component re-skin following existing patterns (per-instance `className` overrides, no shared-component behavior changes). The flat `Header.tsx` bar is deleted and its breadcrumb/language-toggle/notification-bell logic moves, unchanged, into a new banner rendered by `PageHeader`.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4, React 19, TypeScript, react-i18next. No test runner in this repo — verification is `tsc --noEmit` + `eslint` + `npm run build` + manual browser check (the pattern already used for every prior change in this project).

**Spec:** `docs/superpowers/specs/2026-09-09-qinsights-theme-shell-design.md`

## Global Constraints

- UI/visual changes only — no change to permission checks, RTK Query calls, filter/sort/pagination logic, or any mutation flow
- `PageHeader`'s public prop API (`title`, `description`, `actions`) must not change — no page that calls it needs edits
- Sidebar's permission-gating (`isItemVisible`/`isGroupVisible`), collapse/expand persistence (`localStorage` keys `sbr_sidebar_collapsed`/`sbr_sidebar_groups`), and active-route logic must be byte-for-byte behaviorally identical — only colors/shapes change
- New primary color: `#8A1538` (`adaam`) replacing `#A71D3A` in touched files only — do not do a blind find-replace across the whole repo; only files this plan touches
- Every task ends with: `npx tsc --noEmit` clean, `npx eslint <touched paths>` clean
- No `git commit`/`git push` unless the user explicitly asks per-task (git commit was blocked by the permission classifier earlier this session — confirm with the user before attempting again)

---

### Task 1: Design tokens (colors, radius, shadows)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `.claude/references/design-system.md` (document new tokens as primary reference)

**Interfaces:**
- Produces: Tailwind utility classes `bg-adaam`, `text-adaam`, `bg-adaam-deep`, `bg-adaam-tint`, `text-adaam-tint`, `bg-dune`, `text-dune`, `bg-dune-tint`, `bg-pos`/`text-pos-text`/`bg-pos-tint`, `bg-neg`/`text-neg-text`/`bg-neg-tint`, `bg-warn`/`text-warn-text`/`bg-warn-tint`, `bg-info`/`text-info-text`/`bg-info-tint`, `bg-ink`, `bg-panel`, `border-line`, plus `rounded-3xl` (already exists in Tailwind default scale — confirm), `shadow-card`, `shadow-float`, `shadow-soft`, `shadow-input`. All later tasks consume these class names directly.

- [ ] **Step 1: Add the `@theme` token block**

Open `src/app/globals.css` and insert this block immediately after the existing `@import "tailwindcss";` line (before the current `:root { ... }` block):

```css
@theme {
  --color-adaam: #8A1538;
  --color-adaam-deep: #6D0D2A;
  --color-adaam-tint: #F6E7EC;

  --color-dune: #A29374;
  --color-dune-light: #C0AC86;
  --color-dune-deep: #87795D;
  --color-dune-dark: #776848;
  --color-dune-tint: #F4F0E8;

  --color-pos: #3FB185;
  --color-pos-text: #047857;
  --color-pos-tint: #ECFDF5;

  --color-neg: #DF7878;
  --color-neg-text: #B23B3B;
  --color-neg-tint: #FDECEC;

  --color-warn: #BF9F5F;
  --color-warn-text: #A67C1B;
  --color-warn-tint: #FBF3D6;

  --color-info: #2A6B8A;
  --color-info-text: #1D4ED8;
  --color-info-tint: #EFF6FF;

  --color-ink: #111827;
  --color-ink-2: #1F2937;
  --color-panel: #FAFAFA;
  --color-panel-2: #F5F5F5;
  --color-line: #E5E7EB;
  --color-line-soft: #F3F4F6;

  --shadow-card: 0 0 60px rgba(0,0,0,0.08);
  --shadow-float: 0 4px 24px rgba(0,0,0,0.15);
  --shadow-soft: 0 4px 14px rgba(0,0,0,0.12);
  --shadow-input: 0 4px 24px rgba(0,0,0,0.05);
}
```

(`rounded-3xl` is already a default Tailwind v4 radius utility — no token needed for it.)

- [ ] **Step 2: Verify the tokens compile**

Run: `npx tsc --noEmit` (should stay clean — this is CSS, not TS, but confirms the change didn't break the build pipeline config)
Run: `npm run build` — confirms Tailwind v4 picks up the new `@theme` block with no CSS errors. Expected: build succeeds, no "unknown utility class" warnings for any usage you add in later tasks.

- [ ] **Step 3: Document the new tokens**

Open `.claude/references/design-system.md`. Add a new section right after the existing "Color Palette" table:

```markdown
### QInsights tokens (new, additive — added 2026-09-09)

| Token | Hex | Usage |
|---|---|---|
| `adaam` / `adaam-deep` / `adaam-tint` | `#8A1538` / `#6D0D2A` / `#F6E7EC` | New primary (replaces `#A71D3A` in re-themed components) |
| `dune` / `dune-light` / `dune-deep` / `dune-dark` / `dune-tint` | `#A29374` family | Secondary accent — avatar circles, logo badge |
| `pos` / `pos-text` / `pos-tint` | `#3FB185` / `#047857` / `#ECFDF5` | Active/success |
| `neg` / `neg-text` / `neg-tint` | `#DF7878` / `#B23B3B` / `#FDECEC` | Inactive/error |
| `warn` / `warn-text` / `warn-tint` | `#BF9F5F` / `#A67C1B` / `#FBF3D6` | Warning/pending |
| `info` / `info-text` / `info-tint` | `#2A6B8A` / `#1D4ED8` / `#EFF6FF` | Info |
| `ink` / `ink-2` | `#111827` / `#1F2937` | New-component text |
| `panel` / `panel-2` | `#FAFAFA` / `#F5F5F5` | New-component surfaces |
| `line` | `#E5E7EB` | New-component borders |

Shadows: `shadow-card`, `shadow-float`, `shadow-soft`, `shadow-input` (see `globals.css` for values).

These are used by components re-themed as part of the QInsights shell redesign (Sidebar, banner header, `StatusBadge`, `DataTable` chrome, buttons, inputs). Components not yet migrated keep using the old palette until touched.
```

- [ ] **Step 4: Verify docs are valid markdown and commit is ready**

Read the file back to confirm the table renders correctly (no broken pipe alignment).

- [ ] **Step 5: Commit** (only if the user has confirmed git commit access works — otherwise leave staged and tell the user)

```bash
git add src/app/globals.css ".claude/references/design-system.md"
git commit -m "style: add QInsights color/shadow tokens"
```

---

### Task 2: `StatusBadge` + `Badge` re-theme

**Files:**
- Modify: `src/components/common/StatusBadge.tsx`
- Modify: `src/components/ui/badge.tsx`

**Interfaces:**
- Consumes: tokens from Task 1 (`bg-pos-tint`, `text-pos-text`, `bg-neg-tint`, `text-neg-text`, etc.)
- Produces: `StatusBadge` keeps its exact prop signature `{ status: string | null | undefined; className?: string }` — every existing call site (`<StatusBadge status={...} />` across Establishments, Enterprises, Enterprise Groups, etc.) needs zero changes. `Badge` keeps its exact prop signature `{ variant?: 'default'|'success'|'warning'|'destructive'|'secondary'|'outline'; className?: string } & HTMLAttributes<HTMLDivElement>` — existing variants (`default`, `destructive`, `secondary`, `outline`, `warning`, `success`) are untouched; this task only changes what `success`/`destructive` render as.

- [ ] **Step 1: Confirm current callers won't break**

Run: `grep -rn "variant=\"success\"\|variant='success'\|variant=\"destructive\"\|variant='destructive'" src --include="*.tsx" | wc -l`
Note the count — after Step 2, re-run the same grep and confirm the count is unchanged (proves no call site was touched).

- [ ] **Step 2: Update `Badge`'s `success`/`destructive` variants to the dot+tint look**

Open `src/components/ui/badge.tsx`. Current variants block:

```typescript
        success: 'bg-emerald-100 text-emerald-800',
        destructive: 'bg-red-100 text-red-800',
```

Replace with:

```typescript
        success: 'bg-pos-tint text-pos-text',
        destructive: 'bg-neg-tint text-neg-text',
```

Leave `default`, `secondary`, `outline`, `warning` untouched (out of scope for this pass — they're used by other features not covered by this shell redesign).

- [ ] **Step 3: Add the status dot to `StatusBadge`**

Open `src/components/common/StatusBadge.tsx`. Current file:

```tsx
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;

  const variant =
    status === 'Active'
      ? 'success'
      : status === 'Inactive'
        ? 'destructive'
        : 'secondary';

  return <Badge variant={variant} className={className}>{status}</Badge>;
}
```

Replace with:

```tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return <span className="text-slate-400 text-xs">—</span>;

  const variant =
    status === 'Active'
      ? 'success'
      : status === 'Inactive'
        ? 'destructive'
        : 'secondary';

  const dotColor = status === 'Active' ? 'bg-pos' : status === 'Inactive' ? 'bg-neg' : 'bg-slate-400';

  return (
    <Badge variant={variant} className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor)} />
      {status}
    </Badge>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` — expect clean.
Run: `npx eslint src/components/common/StatusBadge.tsx src/components/ui/badge.tsx` — expect clean.
Run: `npm run build` — expect success.
Manual check: start the dev server, open `/establishments`, confirm the EST_STATUS column shows a small colored dot + tinted pill instead of the old solid badge, for both "Active" and "Inactive" rows.

- [ ] **Step 5: Re-run the grep from Step 1**

Confirm the count of `variant="success"`/`variant="destructive"` call sites is unchanged from Step 1 — proves no caller was edited.

- [ ] **Step 6: Commit**

```bash
git add src/components/common/StatusBadge.tsx src/components/ui/badge.tsx
git commit -m "style: re-theme StatusBadge/Badge to dot+tint QInsights style"
```

---

### Task 3: Buttons + Inputs/Select focus-ring re-theme

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify (find/replace within touched files only — see step 3): every file using the `linear-gradient(135deg, #A71D3A, #6B1428)` inline style override (found via grep below)

**Interfaces:**
- Consumes: `adaam`/`adaam-deep` tokens from Task 1
- Produces: no signature change to `Button`, `Input`, or `Select` — same props, same exports

- [ ] **Step 1: Update the base `Input` focus ring**

Open `src/components/ui/input.tsx`. Current:

```typescript
'flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#A71D3A] focus:border-[#A71D3A] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
```

Replace `focus:ring-[#A71D3A] focus:border-[#A71D3A]` with `focus:ring-adaam focus:border-adaam`.

- [ ] **Step 2: Update `Select`'s focus ring (if present)**

Run: `grep -n "A71D3A" src/components/ui/select.tsx`
For each match, replace the literal `#A71D3A` with the `adaam` token equivalent (e.g. `focus:ring-[#A71D3A]` → `focus:ring-adaam`, or if it's an inline `style={{ borderColor: '#A71D3A' }}`, change the hex to `#8A1538`).

- [ ] **Step 3: Find every maroon-gradient button override**

Run: `grep -rln "linear-gradient(135deg, #A71D3A, #6B1428)" src --include="*.tsx"`

This lists every file with the primary-action button gradient (established convention across Edit modals, Admin tabs, Bulk Change, Enterprise Groups — confirmed earlier in this project). For each file in the result:

Run: `grep -n "linear-gradient(135deg, #A71D3A, #6B1428)" <file>` to see the exact line(s), then replace `#A71D3A, #6B1428` with `#8A1538, #6D0D2A` in each occurrence (keep everything else — `border: 'none'`, the `className="text-white"` etc. — unchanged).

- [ ] **Step 4: Update `button.tsx`'s own `default` variant radius (optional token alignment)**

Open `src/components/ui/button.tsx`. The `default` variant (`bg-[#2B7A9E] text-white hover:bg-[#1f6080]`) is intentionally NOT the primary-action color (that's the gradient override pattern from Step 3) — leave it unchanged. Only confirm `rounded-md` still resolves correctly after Task 1's token changes (it will — `rounded-md` isn't redefined).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` — expect clean.
Run: `npx eslint src/components/ui/input.tsx src/components/ui/select.tsx src/components/ui/button.tsx` — expect clean.
Run: `npm run build` — expect success.
Manual check: open any Edit modal (e.g. Establishments edit) — the Save button gradient should read as the new deeper maroon (`#8A1538`→`#6D0D2A`) rather than the old `#A71D3A`→`#6B1428`. Click into a text input — the focus ring should be the new `adaam` color.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/input.tsx src/components/ui/select.tsx src/components/ui/button.tsx <every file changed in Step 3>
git commit -m "style: update primary color to adaam across buttons and input focus rings"
```

---

### Task 4: Sidebar re-skin

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: `adaam`/`adaam-tint`/`dune` tokens from Task 1
- Produces: no change to `Sidebar`'s export signature (`export function Sidebar()`, no props) — `DashboardLayout.tsx` continues to render `<Sidebar />` exactly as before. All internal logic (`isItemVisible`, `isGroupVisible`, `toggleGroup`, `toggleCollapsed`, `handleLogout`, `localStorage` keys, `useGetChangeRequestCountQuery`) is unchanged — only JSX class names and one CSS custom property (`RAIL_GRADIENT`) change.

- [ ] **Step 1: Snapshot current behavior for manual regression testing**

Before editing, in the running app note: (a) which nav groups are open/closed by default, (b) that collapsing the sidebar persists across a page refresh, (c) that a non-SUPER_ADMIN user only sees permitted items, (d) the pending-count badge shows on "Attribute Change" when there are pending requests. You'll re-check all four after the edit.

- [ ] **Step 2: Replace the rail gradient and outer container styling**

Open `src/components/layout/Sidebar.tsx`. Replace:

```typescript
const RAIL_GRADIENT = 'linear-gradient(180deg, #6B1428 0%, #6B1428 42%, #7E1830 68%, #A71D3A 100%)';
```

with (keep the constant name — nothing else references it, confirmed by `grep -rn "RAIL_GRADIENT" src`):

```typescript
const RAIL_GRADIENT = '#FFFFFF';
```

Find the `<aside>` element (around line 258):

```tsx
      <aside
        className={cn(
          // h-screen + sticky keeps the maroon rail full-height and pinned so no gap shows
          // below it when collapsed content is short and the page scrolls
          'flex flex-col shrink-0 h-screen sticky top-0 transition-[width] duration-200 ease-out',
          collapsed ? 'w-[68px]' : 'w-[236px]'
        )}
        style={{
          background: RAIL_GRADIENT,
```

Replace the `className` string with (adds the floating-card look — rounded corners, shadow, margin, own height instead of full-bleed):

```tsx
      <aside
        className={cn(
          // Floating white rail (QInsights style) instead of a full-bleed maroon panel.
          // sticky + own height (not h-screen) keeps it pinned with margin on all sides.
          'flex flex-col shrink-0 sticky top-4 my-4 ms-4 rounded-3xl shadow-float transition-[width] duration-200 ease-out',
          collapsed ? 'w-[68px]' : 'w-[236px]'
        )}
        style={{
          background: RAIL_GRADIENT,
          height: 'calc(100vh - 32px)',
```

(Keep the existing `fontFamily` line inside the same `style` object — do not remove it.)

- [ ] **Step 3: Re-skin the brand block**

Find:

```tsx
        {/* Brand */}
        <div className={cn('flex items-center gap-2.5 h-[58px] shrink-0', collapsed ? 'justify-center px-2' : 'px-4')}>
          <Image
            src="/sbr-logo-white.png"
            alt="NPC emblem"
            width={34}
            height={34}
            priority
            className="object-contain shrink-0"
          />
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <p className="font-extrabold text-[13.5px] text-white truncate">SBR Portal</p>
              <p className="text-[10px] mt-0.5 truncate text-[#e7b9c4]">{t('login.brandingSub')}</p>
            </div>
          )}
        </div>
```

Replace with:

```tsx
        {/* Brand */}
        <div className={cn('flex items-center gap-2.5 h-[58px] shrink-0', collapsed ? 'justify-center px-2' : 'px-4')}>
          <div className="h-9 w-9 rounded-full bg-dune flex items-center justify-center shrink-0">
            <Image
              src="/sbr-logo-white.png"
              alt="NPC emblem"
              width={20}
              height={20}
              priority
              className="object-contain"
            />
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <p className="font-extrabold text-[13.5px] text-ink truncate">SBR Portal</p>
              <p className="text-[10px] mt-0.5 truncate text-slate-500">{t('login.brandingSub')}</p>
            </div>
          )}
        </div>
```

- [ ] **Step 4: Re-skin group headers and dividers**

Find (inside the `!collapsed` group-header button):

```tsx
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] transition-colors hover:bg-white/5',
                    groupActive ? 'text-white' : 'text-[#dca7b4]'
                  )}
                >
```

Replace with:

```tsx
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] transition-colors hover:bg-gray-50',
                    groupActive ? 'text-dune-deep' : 'text-gray-400'
                  )}
                >
```

Find the pending-count pill right after it:

```tsx
                    <span className="min-w-[16px] h-4 rounded-full bg-white/20 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
```

Replace `bg-white/20 text-white` with `bg-adaam text-white` (keep everything else identical).

Find both divider lines (`className="mx-2 my-1.5 h-px bg-white/15"` in the collapsed branch and `className="mx-1 my-1.5 h-px bg-white/15"` in the expanded branch) and replace `bg-white/15` with `bg-gray-200` in both.

- [ ] **Step 5: Re-skin `NavLink` (active/inactive pill states)**

Open the `NavLink` function near the top of the file. Replace the collapsed-state `Link` className:

```tsx
              'relative flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors',
              isActive ? 'bg-white text-[#A71D3A]' : 'text-[#f0cdd5] hover:bg-white/10'
```

with:

```tsx
              'relative flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-colors',
              isActive ? 'bg-adaam-tint text-adaam' : 'text-gray-500 hover:bg-gray-50'
```

Replace the matching collapsed-state count badge:

```tsx
              <span className="absolute -top-1 -end-1 min-w-[16px] h-4 rounded-full bg-white text-[#A71D3A] text-[9px] font-bold flex items-center justify-center px-0.5 leading-none shadow-sm">
```

with (keep everything else the same, only the two color classes change):

```tsx
              <span className="absolute -top-1 -end-1 min-w-[16px] h-4 rounded-full bg-adaam text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none shadow-sm">
```

Replace the expanded-state `Link` className:

```tsx
      'flex w-full items-center gap-2.5 ps-3 pe-2 py-2 rounded-lg text-[13px] transition-colors',
      isActive ? 'bg-white font-bold text-[#A71D3A] shadow-sm' : 'font-medium text-[#f0cdd5] hover:bg-white/10'
```

with:

```tsx
      'flex w-full items-center gap-2.5 ps-3 pe-2.5 py-1.5 rounded-full text-[13px] transition-colors',
      isActive ? 'bg-adaam-tint font-semibold text-adaam' : 'font-medium text-gray-600 hover:bg-gray-50'
```

Replace the expanded-state count badge:

```tsx
        <span className={cn(
          'ms-auto min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 leading-none',
          isActive ? 'bg-[#A71D3A] text-white' : 'bg-white/25 text-white'
        )}>
```

with:

```tsx
        <span className={cn(
          'ms-auto min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 leading-none',
          isActive ? 'bg-adaam text-white' : 'bg-adaam/80 text-white'
        )}>
```

- [ ] **Step 6: Re-skin the collapse-toggle button and user footer**

Find:

```tsx
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center gap-2 h-10 shrink-0 text-[12px] font-semibold text-[#f0cdd5] transition-colors hover:bg-white/10',
```

Replace `text-[#f0cdd5] transition-colors hover:bg-white/10` with `text-gray-500 transition-colors hover:bg-gray-50`.

Find the user footer block:

```tsx
        <div className={cn('flex items-center gap-2.5 h-[58px] shrink-0 border-t border-white/10', collapsed ? 'justify-center px-2' : 'px-4')}>
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: 'rgba(255,255,255,.18)' }}
          >
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="leading-tight min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-white truncate">
                  {effectiveUser?.email ?? 'User'}
                </p>
                <p className="text-[10px] truncate text-[#e7b9c4]">{formatRole(effectiveUser?.role)}</p>
              </div>
              <button
                onClick={handleLogout}
                title={t('actions.signOut')}
                className="h-7 w-7 flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
```

Replace with:

```tsx
        <div className={cn('flex items-center gap-2.5 h-[58px] shrink-0 border-t border-gray-100', collapsed ? 'justify-center px-2' : 'px-4')}>
          <div
            className="h-8 w-8 rounded-full bg-dune flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          >
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="leading-tight min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink truncate">
                  {effectiveUser?.email ?? 'User'}
                </p>
                <p className="text-[10px] truncate text-gray-500">{formatRole(effectiveUser?.role)}</p>
              </div>
              <button
                onClick={handleLogout}
                title={t('actions.signOut')}
                className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-adaam hover:bg-adaam-tint transition-colors"
              >
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit` — expect clean.
Run: `npx eslint src/components/layout/Sidebar.tsx` — expect clean.
Run: `npm run build` — expect success.
Manual check (re-verify all 4 items from Step 1):
1. Sidebar now renders as a white floating rounded card with a maroon-tinted active item
2. Collapsing persists across refresh (unchanged mechanism)
3. A non-SUPER_ADMIN test user still only sees permitted nav items
4. Pending-count badge still shows correctly, now in `adaam` color instead of white-on-maroon

- [ ] **Step 8: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "style: re-skin Sidebar to QInsights floating white rail"
```

---

### Task 5: Copy banner asset + add banner CSS

**Files:**
- Create: `public/assets/banner-skyline.jpg` (copied from `SBR-design/assets/banner-skyline.jpg`)
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `/assets/banner-skyline.jpg` servable as a static Next.js public asset; a `.banner-actions` CSS class (used by Task 6) that makes any button/badge passed as `PageHeader`'s `actions` prop remain legible on the dark banner background

- [ ] **Step 1: Copy the asset**

```bash
mkdir -p "D:/Artefact/OCI/sbr-frontend/public/assets"
cp "D:/Artefact/OCI/SBR-design/assets/banner-skyline.jpg" "D:/Artefact/OCI/sbr-frontend/public/assets/banner-skyline.jpg"
```

- [ ] **Step 2: Verify the file copied and check its size**

Run: `ls -la "D:/Artefact/OCI/sbr-frontend/public/assets/banner-skyline.jpg"`
Expected: file exists, non-zero size. If the source file is very large (>1MB), flag it to the user before proceeding — Next.js serves `public/` assets unoptimized as static files, so a multi-MB banner loads on every page.

- [ ] **Step 3: Add `.banner-actions` overrides to `globals.css`**

Append to the end of `src/app/globals.css` (this is the same override pattern the reference prototype's own `SBR Portal.html` uses, adapted from `.btn-outline`/`.btn-ghost` class names there to this app's actual `Button` component's `variant="outline"`/`variant="ghost"` output classes):

```css
/* Controls passed into PageHeader's `actions` prop, when rendered inside the banner,
   need to read against a dark photo background instead of the app's usual white surface. */
.banner-actions button[class*="border-slate-300"] {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(6px);
}
.banner-actions button[class*="border-slate-300"]:hover {
  background: rgba(255, 255, 255, 0.26);
}
.banner-actions .text-slate-500,
.banner-actions .text-slate-600,
.banner-actions .text-slate-700 {
  color: rgba(255, 255, 255, 0.85);
}
```

- [ ] **Step 4: Verify**

Run: `npm run build` — expect success, confirms the static asset is picked up and CSS is valid.

- [ ] **Step 5: Commit**

```bash
git add public/assets/banner-skyline.jpg src/app/globals.css
git commit -m "style: add banner asset and banner-actions CSS overrides"
```

---

### Task 6: PageHeader → Banner (replaces Header.tsx)

**Files:**
- Modify: `src/components/common/PageHeader.tsx`
- Modify: `src/components/layout/DashboardLayout.tsx`
- Delete: `src/components/layout/Header.tsx`

**Interfaces:**
- Consumes: `crumbFor()` breadcrumb-resolution logic and `NAV_GROUPS` from `@/constants/navigation` (moved from `Header.tsx`, logic unchanged), `useLanguage()` from `@/i18n` (same hook, same `toggleLanguage`/`isArabic`), banner asset + `.banner-actions` CSS from Task 5, `adaam`/`dune` tokens from Task 1
- Produces: `PageHeader` keeps its exact existing prop signature: `{ title: string; description?: string; actions?: React.ReactNode }` — **every single page in the app that calls `<PageHeader title=... description=... actions=... />` needs zero changes.**

- [ ] **Step 1: Read every current `PageHeader` call site to confirm the prop contract**

Run: `grep -rln "PageHeader" src/features --include="*.tsx"`
Run: `grep -B1 -A5 "<PageHeader" src/features/establishments/pages/*.tsx`
Confirm all call sites only ever pass `title`, `description`, `actions` — no other prop. (This is required so Step 2's new implementation doesn't silently drop a prop some page relies on.)

- [ ] **Step 2: Rewrite `PageHeader.tsx` as the banner**

Replace the entire contents of `src/components/common/PageHeader.tsx` with:

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NAV_GROUPS } from '@/constants/navigation';
import { useLanguage } from '@/i18n';
import { useAppSelector } from '@/hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

// route -> breadcrumb data for the current path — moved from the old Header.tsx unchanged.
function crumbFor(pathname: string): { groupKey: string; groupTitle: string; itemKey: string; itemTitle: string; itemBreadcrumb?: string } {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return { groupKey: group.i18nKey, groupTitle: group.title, itemKey: item.i18nKey, itemTitle: item.title, itemBreadcrumb: item.breadcrumbLabel };
      }
    }
  }
  if (pathname.startsWith('/admin')) {
    const admin = NAV_GROUPS.find((g) => g.id === 'administration') ?? NAV_GROUPS[0];
    const first = admin.items[0];
    return { groupKey: admin.i18nKey, groupTitle: admin.title, itemKey: first.i18nKey, itemTitle: first.title, itemBreadcrumb: first.breadcrumbLabel };
  }
  const sbr = NAV_GROUPS[0];
  return { groupKey: sbr.i18nKey, groupTitle: sbr.title, itemKey: sbr.items[0].i18nKey, itemTitle: sbr.items[0].title };
}

function initialsOf(user: { email: string } | null): string {
  if (!user) return 'U';
  return user.email.slice(0, 2).toUpperCase();
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { toggleLanguage, isArabic } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const crumb = crumbFor(pathname);

  return (
    <div
      className="relative overflow-hidden rounded-3xl text-white shrink-0 min-h-[172px]"
      style={{ background: "#0E1A2B url('/assets/banner-skyline.jpg') center 42% / cover no-repeat" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.58), rgba(0,0,0,.30) 55%, rgba(0,0,0,.42))' }}
      />

      {/* Toolbar: language toggle + notification bell + avatar — moved from the old Header.tsx,
          same handlers, now an overlay pill instead of a separate flat bar. */}
      <div
        className="absolute top-4 end-4 z-10 flex items-center gap-1.5 rounded-full p-1.5"
        style={{ background: 'rgba(255,255,255,.12)', boxShadow: '0 4px 24px rgba(0,0,0,.22)', backdropFilter: 'blur(8px)' }}
      >
        <button
          onClick={toggleLanguage}
          className="h-9 px-3.5 rounded-full text-[12px] font-semibold text-white hover:bg-white/25 transition-colors"
          title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
          style={!isArabic ? { fontFamily: 'var(--font-cairo), sans-serif' } : undefined}
        >
          {isArabic ? 'English' : 'عربي'}
        </button>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="relative h-9 w-9 rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-colors">
                <Bell className="h-[16px] w-[16px]" />
                <span className="absolute top-2 end-2.5 w-1.5 h-1.5 rounded-full bg-dune-light" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] text-center text-xs">
              This feature will be implemented in the next phase
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div
          className="h-9 w-9 rounded-full bg-dune text-white font-bold text-[12px] flex items-center justify-center"
          style={{ boxShadow: '0 0 0 2px rgba(255,255,255,.55)' }}
          title={user?.email ?? ''}
        >
          {initialsOf(user)}
        </div>
      </div>

      <div className="relative flex flex-col justify-end min-h-[inherit] px-7 pb-6 pt-[72px]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white/75 flex items-center gap-2 flex-wrap">
              {t(crumb.groupKey, { defaultValue: crumb.groupTitle })}
              {'  ·  '}
              {isArabic ? t(crumb.itemKey, { defaultValue: crumb.itemTitle }) : (crumb.itemBreadcrumb ?? t(crumb.itemKey, { defaultValue: crumb.itemTitle }))}
            </div>
            <h1 className="font-extrabold leading-tight mt-1 text-white text-[26px]">{title}</h1>
            {description && <p className="text-[13px] text-white/80 mt-1 max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="banner-actions shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Remove `Header` from `DashboardLayout.tsx`**

Open `src/components/layout/DashboardLayout.tsx`. Replace:

```tsx
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F8FA' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="max-w-[1640px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

with:

```tsx
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FFFFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="max-w-[1640px] mx-auto flex flex-col gap-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

(The `gap-4` wrapper replaces the vertical spacing `Header` used to provide via its own height + border — each page's `<PageContainer>` already wraps its own content in `flex flex-col gap-4`, so this is a safe outer equivalent; verify visually in Step 5 that spacing between the new banner and page content looks right, adjust the gap value if needed.)

- [ ] **Step 4: Delete `Header.tsx`**

```bash
rm "D:/Artefact/OCI/sbr-frontend/src/components/layout/Header.tsx"
```

Run: `grep -rn "from '@/components/layout/Header'" src` and `grep -rn "components/layout/Header" src` — confirm zero remaining references (there should be none once Step 3 is done).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` — expect clean (this will catch any remaining `Header` import you missed).
Run: `npx eslint src/components/common/PageHeader.tsx src/components/layout/DashboardLayout.tsx` — expect clean.
Run: `npm run build` — expect success across every route (confirms every page's `<PageHeader>` call still compiles with the same 3 props).
Manual check: start dev server, visit at least 4 different pages (e.g. `/establishments`, `/enterprises`, `/admin/users`, `/audit-log`) and confirm:
1. Each shows the new photo banner with correct breadcrumb + title + description
2. Any page passing `actions` (e.g. a record-count badge) still shows it, legible against the dark banner
3. Language toggle button still switches the UI language
4. Notification bell still shows its tooltip
5. No visual double-header (old flat bar) remains anywhere

- [ ] **Step 6: Commit**

```bash
git add src/components/common/PageHeader.tsx src/components/layout/DashboardLayout.tsx
git rm src/components/layout/Header.tsx
git commit -m "style: merge Header into PageHeader as a QInsights photo banner"
```

---

### Task 7: DataTable chrome re-theme

**Files:**
- Modify: `src/components/table/DataTable.tsx`

**Interfaces:**
- Consumes: `line`/`panel` tokens from Task 1
- Produces: no prop or behavior change — same `DataTableProps<TData, TValue>` signature, same pagination/sort/filter callbacks

- [ ] **Step 1: Find the table row/border classes**

Run: `grep -n "slate-200\|slate-50\|hover:bg" src/components/table/DataTable.tsx`

- [ ] **Step 2: Update border and hover colors**

For each match from Step 1 that styles the table container border or row hover (not sort icons or unrelated slate usages — read each line's context before changing), replace:
- `border-slate-200` → `border-line`
- `hover:bg-slate-50` → `hover:bg-panel`

Do this only inside `DataTable.tsx` — not in any consuming page's own wrapper `<div className="rounded-lg border border-slate-200 ...">`, which is out of scope for this shell pass (per-page follow-up).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` — expect clean.
Run: `npx eslint src/components/table/DataTable.tsx` — expect clean.
Run: `npm run build` — expect success.
Manual check: open any list page, confirm rows still sort/paginate/filter correctly (functionally identical) and the hover/border colors read as the new lighter tone.

- [ ] **Step 4: Commit**

```bash
git add src/components/table/DataTable.tsx
git commit -m "style: update DataTable chrome to QInsights line/panel tokens"
```

---

### Task 8: Full-app verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck + lint + build**

```bash
npx tsc --noEmit
npx eslint src/
npm run build
```
All three must succeed with no new errors/warnings introduced by this plan.

- [ ] **Step 2: Manual regression walkthrough**

Start the dev server. As a SUPER_ADMIN user, click through every top-level Sidebar nav item once. For each page confirm:
- Page loads without console errors
- Filters, search, sort, and pagination still work
- Any Edit modal still opens, validates, and saves
- Permission-gated nav items are correctly shown/hidden (re-test with a non-admin test account if one exists)

- [ ] **Step 3: RTL check**

Toggle to Arabic via the banner's language button. Confirm: Sidebar still renders correctly (RTL-mirrored), banner text and toolbar still readable, no layout breakage.

- [ ] **Step 4: Final commit (if not already committed per-task)**

Confirm `git status` shows a clean tree (everything committed) or report to the user exactly what remains uncommitted and why (e.g. commit was blocked by the permission classifier earlier).
