# SBR Frontend — Statistical Business Register Portal

Enterprise frontend for the Statistical Business Register system (NPC Qatar).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Language | TypeScript (strict) |
| State Management | Redux Toolkit + RTK Query |
| HTTP Client | Axios |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI (custom Shadcn-style) |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Icons | Lucide React |

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── layout.tsx          # Auth guard + dashboard layout
│   │   ├── frame/page.tsx      # Establishments list
│   │   ├── contacts/page.tsx   # Contacts list
│   │   └── addresses/page.tsx  # Addresses list
│   ├── login/page.tsx          # Login page
│   ├── layout.tsx              # Root layout (Redux Provider)
│   └── globals.css
│
├── components/
│   ├── ui/                     # Base UI primitives
│   ├── common/                 # Shared app components
│   ├── layout/                 # Dashboard chrome (Sidebar, Header)
│   └── table/                  # DataTable + TablePagination
│
├── features/                   # Feature modules (domain-driven)
│   ├── auth/                   # Login + JWT management
│   ├── frame/                  # Establishments
│   ├── contacts/               # Business contacts
│   └── addresses/              # Physical addresses
│
├── services/
│   ├── api.ts                  # RTK Query base API
│   └── axios.ts                # Axios instance + interceptors
│
├── store/                      # Redux store + root reducer
├── hooks/                      # useAppDispatch, useAppSelector
├── providers/                  # ReduxProvider
├── types/                      # Shared TypeScript interfaces
├── constants/                  # Routes, navigation, enums
├── utils/                      # format.ts, query.ts
├── lib/                        # cn() utility
└── config/                     # env.ts
```

## API Integration

Backend: `http://localhost:3000/api/v1`

Auth: JWT token sent via `x-auth-token` header, stored in `localStorage`.

| Endpoint | Description |
|---|---|
| `POST /auth/login` | Login, returns JWT |
| `GET /frame` | Establishments list (paginated) |
| `GET /contacts` | Contacts list (paginated) |
| `GET /addresses` | Addresses list (paginated) |

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3000

# Run dev server
npm run dev

# Production build
npm run build
```

## Environment Variables

| Variable | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_ENV` | `development` |

## Adding a New Feature Module

1. Create `src/features/<module>/` with: `api/`, `components/`, `constants/`, `pages/`, `types/`
2. Inject RTK Query endpoints via `baseApi.injectEndpoints()`
3. Define columns with `ColumnDef<T>[]`
4. Build list page using `<DataTable>` + `<PageHeader>`
5. Add route at `src/app/(dashboard)/<module>/page.tsx`
6. Register nav entry in `src/constants/navigation.ts`

## Scripts

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # ESLint
npm run lint:fix      # ESLint + auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
```
