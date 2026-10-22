# SBR Frontend — Statistical Business Register Portal

The web portal of the Statistical Business Register (SBR) for the National Planning Council, Qatar.
Staff use it to browse and maintain the register (establishments, enterprises, groups, contacts,
addresses, legal units), approve changes, run bulk updates, work with data quality, snapshots,
surveys and analyses, and administer users and roles. It is bilingual (English and Arabic, with
right-to-left layout).

This README is a short code-level guide. It contains no secrets. The API it talks to is
`sbr-backend`; see that README for the database and email setup.

## 1. Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Server state | Redux Toolkit with RTK Query (one shared `baseApi`) |
| Styling | Tailwind CSS v4, Radix UI primitives with shadcn-style components |
| Tables | TanStack Table v8 |
| Forms | Mostly plain controlled forms; React Hook Form with Zod is used in one place |
| Charts, Excel | Apache ECharts, ExcelJS |
| i18n | i18next and react-i18next (`en`, `ar`) |

## 2. Run it locally

You need Node.js 22 and a running `sbr-backend` (default `http://localhost:4000`).

```bash
npm install
cp .env.example .env        # set NEXT_PUBLIC_API_URL, see section 3
npm run dev                 # http://localhost:7000/sbr
```

The app is served under the `/sbr` base path, so open **`http://localhost:7000/sbr`**. Sign in with
a portal user from the database (see the backend README).

With Docker (no backend code needed): put the backend's URL in `.env` as `NEXT_PUBLIC_API_URL`,
then `docker compose up`. More in `DOCKER.md`.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 7000. |
| `npm run build` | Production build. Also fails on type errors. |
| `npm start` | Serves the production build. |
| `npm run lint` / `lint:fix` | ESLint over `src/`. |
| `npm run format` / `format:check` | Prettier over `src/`. |
| `npx tsc --noEmit` | Type-check only. |
| `npm run check:malicious` | Malicious-code check on staged files (also run by the git hooks). |

There is no automated test script.

## 3. Environment variables

Read in `src/config/env.ts`. Both are `NEXT_PUBLIC_*`, which Next.js **inlines into the browser
bundle at build time**: changing them on a running container has no effect; rebuild instead.

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | empty | Backend address, without `/api/v1` (the app adds it). Empty on `localhost` means `http://localhost:4000`; empty elsewhere means same-origin `/sbr/api/v1`. |
| `NEXT_PUBLIC_ENV` | `development` | `production` for deployed builds. |

The base path `/sbr` is fixed in `next.config.ts`; it is not an environment setting.

## 4. Project structure

```
src/
├── app/                 Next.js routes (thin wrappers: they only render a feature page)
│   ├── (dashboard)/     signed-in pages; layout.tsx is the auth guard, sidebar and header
│   ├── login/, forgot-password/, reset-password/
│   └── render/analysis/[id]/   page the backend's headless browser draws for emailed analyses
├── features/            one folder per area, each with api/ components/ constants/ pages/ types/
├── components/          ui/ (primitives), common/ (shared pieces), layout/ (sidebar, header), table/
├── services/api.ts      the single RTK Query baseApi
├── store/               Redux store
├── hooks/               usePermission, useDebounce, useAppSelector, …
├── i18n/                i18next setup and language provider
├── types/               shared types, imported from '@/types'
├── constants/           navigation, storage keys
├── utils/               format, query (cleanParams), toast, base path
└── config/env.ts        environment settings
public/locales/          en.json and ar.json translations
```

## 5. How the app works

**Calling the API.** Every request goes through one RTK Query `baseApi` (`src/services/api.ts`);
features add endpoints with `baseApi.injectEndpoints()`. The base URL is `<API URL>/api/v1`, and the
token from `localStorage` (`sbr_token`) is sent as the **`x-auth-token`** header. Filters are wrapped
in `cleanParams()` and any filter change resets `page` to 1. Every mutation invalidates the
`AuditLog` tag plus its own, so lists refresh.

**Shared error handling (in `baseApi`).** On 401 the session is cleared and the user is sent to the
sign-in page. On 403 a notice shows and permissions are refreshed. Other errors show a toast through
the shared `toast` utility, never `alert()`.

**Pages.** Each route file only renders a feature page. Lists use the shared `DataTable` with
shimmer skeletons while loading. Edit dialogs check for changes before saving ("No changes
detected" if nothing changed). Edits to register data are requests that an approver applies, not
direct edits.

## 6. Authentication, roles and permissions

1. `/login` calls `POST /auth/login`. The token, active role and the user's roles are stored in
   `localStorage` (`sbr_token`, `sbr_user`, `sbr_roles`).
2. The dashboard layout redirects to `/login` when there is no token, then loads permissions from
   `GET /auth/my-permissions` into Redux and `localStorage`.
3. A user with several roles picks one after signing in; the portal calls `POST /auth/switch-role`
   and gets a token for that role.
4. Permissions are named `section.action` (for example `establishments.view`).
   `usePermission('establishments')` returns `canView`, `canEdit`, `canCreate`, `canSearch`,
   `canViewDetail`, `canViewHistory` and `canApprove`; `useHasPermission('name')` checks one name.
   `SUPER_ADMIN` has everything.
5. The sidebar (`src/constants/navigation.ts`) and screens hide what the user cannot use. **This is
   only presentation: the backend enforces every permission.**
6. A password change ends all earlier sessions; the change-password dialog swaps in the new token so
   the current session continues.

## 7. Languages and styling

Strings go through `t('key', { defaultValue })` and live in `public/locales/en.json` and `ar.json`,
which must stay valid JSON with matching keys. The language is remembered in `localStorage`
(`sbr_language`); Arabic switches the page to right-to-left. Styling is Tailwind CSS v4 with the
project's colour tokens; dropdowns use the themed `Select`, never a native `<select>`.

## 8. Deployment notes

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://<api-host> -t sbr-frontend .
docker run -p 7000:7000 sbr-frontend
```

- The OCI build pipeline (`build_spec.yaml`) builds the `Dockerfile`; the server runs `next start`
  on port **7000** under `/sbr`.
- `NEXT_PUBLIC_API_URL` is a **build argument**: a different API address needs a new image.
- The backend's `PORTAL_URL` must be the address users open, including `/sbr`, so email links work.
- After a deploy check that the sign-in page loads under `/sbr` and a login works.

## 9. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Blank list or network errors in dev | The backend is not running or `NEXT_PUBLIC_API_URL` is wrong. Open `<API>/health`. Restart `npm run dev` after editing `.env`. |
| Wrong API address in a deployed build | `NEXT_PUBLIC_API_URL` is baked in at build time. Rebuild the image. |
| `/` shows nothing or 404 | The app lives under `/sbr`; use `http://localhost:7000/sbr`. |
| "Your session has expired" right after signing in | The token was refused (401): the backend's `JWT_SECRET` changed, the user was disabled, or the password changed. Sign in again. |
| 403 "You do not have permission" | The active role lacks the permission. Switch role or ask an admin. |
| A menu entry is missing | The role lacks that section's `.view` permission. |

## 10. Working in this repo

- **Shared code:** before changing anything in `src/utils`, `src/hooks` or `src/components`, find
  every caller; change it only if no caller breaks, otherwise add a new function.
- **Types** go in `src/types` and are imported from `@/types`. **Constants and enums** go in the
  feature's `constants/` folder and must match the backend's enums.
- **New feature:** add `api/`, `components/`, `constants/`, `pages/`, `types/`, then the route in
  `src/app/(dashboard)/<name>/page.tsx` (a thin wrapper), then the entry in
  `src/constants/navigation.ts` with its icon in the sidebar's icon map.
- **Strings:** add every user-facing string to both `en.json` and `ar.json`.
- Git hooks (`.husky`) run the malicious-code check before commit and push.
- Conventions and recipes for AI-assisted work are in `CLAUDE.md` and `.claude/`.
- Never commit secrets: no tokens, passwords or real `.env` files. Only `.env.example`.
