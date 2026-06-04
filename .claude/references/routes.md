# Pages & Routes Reference

## App Router Structure
All dashboard pages live under `src/app/(dashboard)/` — they automatically get
the Sidebar + Header layout from `src/app/(dashboard)/layout.tsx`.

## Current Pages

| URL | Next.js file | Feature component | API used |
|-----|-------------|-------------------|----------|
| `/frame` | `(dashboard)/frame/page.tsx` | `FrameListPage` | `useGetFrameListQuery` |
| `/contacts` | `(dashboard)/contacts/page.tsx` | `ContactsListPage` | `useGetContactsListQuery` |
| `/addresses` | `(dashboard)/addresses/page.tsx` | `AddressesListPage` | `useGetAddressesListQuery` |
| `/audit-log` | `(dashboard)/audit-log/page.tsx` | `AuditLogPage` | `useGetAuditLogListQuery` |
| `/login` | `login/page.tsx` | `LoginPage` | `useLoginMutation` |

## Adding a New Page — Checklist
1. Create `src/app/(dashboard)/{route}/page.tsx` — thin wrapper only
2. Create `src/features/{feature}/pages/{Feature}ListPage.tsx` — all logic here
3. Add to `NAVIGATION` in `src/constants/navigation.ts`
4. Add icon to `ICON_MAP` in `src/components/layout/Sidebar.tsx`

## Page File Template (thin wrapper — no logic)
```typescript
import { MyFeatureListPage } from '@/features/myFeature/pages/MyFeatureListPage';
export const metadata = { title: 'My Feature — SBR Portal' };
export default function Page() { return <MyFeatureListPage />; }
```

## Navigation Config
Defined in `src/constants/navigation.ts`:
```typescript
export const NAVIGATION: NavItem[] = [
  { title: 'Establishments', href: '/frame',     icon: 'Building2' },
  { title: 'Contacts',       href: '/contacts',  icon: 'Users' },
  { title: 'Addresses',      href: '/addresses', icon: 'MapPin' },
  { title: 'Audit Log',      href: '/audit-log', icon: 'ClipboardList' },
];
```

`icon` string must exactly match a key in `ICON_MAP` in `Sidebar.tsx`.
