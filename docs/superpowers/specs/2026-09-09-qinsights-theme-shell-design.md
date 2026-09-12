# SBR Portal — QInsights Theme Shell Redesign

**Date:** 2026-09-09
**Status:** Approved for implementation
**Scope:** UI/visual only — no flow, permission, data, or API changes

## Background

A full design prototype exists at `SBR-design/` (static HTML/JS mockup, no build step, run via `npx serve`). It defines a new visual language ("QInsights") with its own color tokens, typography, radius/shadow scale, and restyled Sidebar, page header, badges, and table chrome. Design tokens live in `SBR-design/app/theme.js`; the shell components live in `SBR-design/app/layout.jsx`.

This spec covers the **shell only**: design tokens, Sidebar, Header→Banner merge, and shared components (Badge/StatusBadge, DataTable chrome, buttons, inputs/select). Per-page detail styling (individual column badges, page-specific layouts) is explicitly **out of scope** — follow-up work once this shell lands and is stable.

## Goals

- Visually match the reference prototype's shell (sidebar, page header, shared components)
- Zero behavior change: every permission check, filter, sort, pagination, mutation, and API call works exactly as before
- `PageHeader`'s public prop API (`title`, `description`, `actions`) is unchanged — every existing page call site needs no edits

## Non-goals

- Per-page/per-feature detail styling (e.g. Establishments' or Enterprises' own column-specific badge colors) — separate follow-up ticket
- Any new pages/features present in the reference prototype but absent from the real app (Surveys, Data Quality detail screens, etc.)
- Backend changes
- Sidebar navigation *data*/permission-gating logic — only its visual presentation changes

## Design

### 1. Design tokens

Add to `src/app/globals.css` via Tailwind v4's `@theme` block (additive — existing hardcoded slate/blue/red/amber classes elsewhere keep working unchanged until touched in a later pass):

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

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-3xl: 36px;

  --shadow-card: 0 0 60px rgba(0,0,0,0.08);
  --shadow-float: 0 4px 24px rgba(0,0,0,0.15);
  --shadow-soft: 0 4px 14px rgba(0,0,0,0.12);
  --shadow-input: 0 4px 24px rgba(0,0,0,0.05);
}
```

This makes `bg-adaam`, `text-adaam-deep`, `rounded-3xl`, `shadow-float`, etc. available as ordinary Tailwind utility classes.

Font: **no change** — `Plus Jakarta Sans` + `Cairo` (via `next/font/google`) already matches the reference; `layout.tsx`/`globals.css` font setup is untouched.

`.claude/rules/styling.md` and `.claude/references/design-system.md` get updated to document the new palette as the primary reference going forward (old maroon `#A71D3A` stays valid short-term wherever not yet migrated, per the phased rollout).

### 2. Sidebar (`src/components/layout/Sidebar.tsx`)

Re-skin only — every existing behavior (permission-gated items, category collapse/expand persisted state, active-route highlighting, badge counts, the rail's own collapse toggle) stays byte-for-byte identical in logic. Visual changes:

- Container: white background, `rounded-3xl`, `shadow-float`, `m-4` (floating card instead of flush full-height panel)
- Active nav item: pill shape — `bg-adaam-tint text-adaam rounded-full font-semibold` (was: current maroon highlight style)
- Inactive nav item: `text-gray-600 hover:bg-gray-50`
- Logo badge (top) and user-initials avatar (bottom): `bg-dune` circle with white ring
- Badge counts (pending/findings/etc.): `bg-adaam text-white` pill — unchanged position/logic, new color
- Collapsed-state icon rail: unchanged mechanism, recolored to match

### 3. Header → Banner merge

Currently: `Header.tsx` (flat white breadcrumb bar with language toggle + notification bell) renders above `PageHeader` (plain title/description/actions block) in `DashboardLayout.tsx`.

New: both merge into one full-width **banner** rendered where `PageHeader` currently renders, replacing the separate `Header.tsx` bar entirely:

- Background: `SBR-design/assets/banner-skyline.jpg` (copied to `sbr-frontend/public/assets/banner-skyline.jpg`) with a dark gradient overlay (`linear-gradient(90deg, rgba(0,0,0,.58), rgba(0,0,0,.30) 55%, rgba(0,0,0,.42))`), `rounded-3xl`, `min-h-[172px]`
- Breadcrumb ("eyebrow"): existing `crumbFor()` logic from `Header.tsx` moves as-is into the banner, rendered as white/75%-opacity text
- Title: existing `PageHeader` `title` prop, rendered large + bold + white
- Description: existing `PageHeader` `description` prop, white/80%
- Actions: existing `PageHeader` `actions` prop, rendered top-right within the banner (same nodes, same handlers — just restyled via a `.banner-actions` CSS override so any button/badge passed in still reads on the dark background)
- Toolbar (language toggle + notification bell): moves from `Header.tsx` into a glass pill absolutely positioned top-right of the banner. **Same** `useLanguage().toggleLanguage()` call, **same** bell + tooltip ("This feature will be implemented in the next phase") — purely relocated, not reimplemented
- User avatar: added next to the toolbar (new, cosmetic — reference shows it in the banner; matches the initials-avatar already used in the Sidebar)

`PageHeader`'s exported prop API is unchanged — `title`, `description`, `actions` — so no page that calls `<PageHeader ... />` needs to change.

`Header.tsx` is deleted; its logic (breadcrumb resolution, language toggle, bell tooltip) moves into the new banner-rendering code inside `PageHeader.tsx`/`DashboardLayout.tsx`.

### 4. Shared components

- **`StatusBadge`** (`src/components/common/StatusBadge.tsx`): dot + tint style — a small colored dot (`bg-pos`/`bg-neg`) plus tint background (`bg-pos-tint text-pos-text` / `bg-neg-tint text-neg-text`), replacing today's solid Badge variant. Same props (`status`), same call sites, same behavior — purely how it renders.
- **`Badge`** (`src/components/ui/badge.tsx`): add tokens for the new tint variants alongside existing variants (additive — `default`/`destructive`/`secondary`/`outline` keep working for any caller not yet migrated)
- **`DataTable`** (`src/components/table/DataTable.tsx`): row hover/border colors move to `line`/`panel` tokens. No prop, pagination, sorting, or filter-callback changes.
- **Buttons** (`src/components/ui/button.tsx` + the maroon-gradient overrides used throughout modals): gradient updates from `linear-gradient(135deg, #A71D3A, #6B1428)` to `linear-gradient(135deg, #8A1538, #6D0D2A)`; radius/shadow move to the new scale
- **Inputs/Select** (`src/components/ui/input.tsx`, `src/components/ui/select.tsx`): focus ring color updates from `#A71D3A` to `adaam`, keeping the existing soft-ring override pattern (`focus:border-adaam/40 focus:ring-adaam/20`) documented in `styling.md`

## Testing

- `npx tsc --noEmit` and `npx eslint src/` clean after every file group
- `npm run build` succeeds
- Manual pass: log in, navigate every top-level nav item, confirm — sidebar collapse/expand still works, active-route highlighting still correct, permission-gated items still hidden/shown correctly, language toggle still switches, notification bell tooltip still shows, every existing page's filters/sort/pagination/edit-modal flows still work unchanged
- Visual comparison against `SBR-design` for Sidebar, banner, badges, buttons

## Rollout

This spec covers the shell only. Per-page detail styling is a separate follow-up once this lands and is confirmed stable — matches the "shell first" scoping decision made during brainstorming.
