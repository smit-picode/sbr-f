'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Building2,
  Layers,
  GitFork,
  Users,
  MapPin,
  Table,
  ClipboardList,
  GitBranch,
  Shield,
  ShieldCheck,
  KeyRound,
  Inbox,
  CheckCheck,
  Camera,
  Database,
  Gauge,
  Flag,
  Landmark,
  Orbit,
  ScrollText,
  SlidersVertical,
  Columns2,
  DatabaseZap,
  History,
  ChartColumn,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, type NavGroup, type NavItem } from '@/constants/navigation';
import { Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { logout } from '@/features/auth/authSlice';
import { formatRole } from '@/utils/format';
import { useGetChangeRequestCountQuery } from '@/features/tasks/api/changeRequestsApi';

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Building2,
  Layers,
  GitFork,
  Users,
  MapPin,
  Table,
  ClipboardList,
  GitBranch,
  Shield,
  ShieldCheck,
  KeyRound,
  Inbox,
  CheckCheck,
  Camera,
  Database,
  Gauge,
  Flag,
  Landmark,
  Orbit,
  ScrollText,
  SlidersVertical,
  Columns2,
  DatabaseZap,
  History,
  ChartColumn,
};

const RAIL_GRADIENT = '#FFFFFF';

const SIDEBAR_COLLAPSED_KEY = 'sbr_sidebar_collapsed';
const SIDEBAR_GROUPS_KEY = 'sbr_sidebar_groups';

interface NavLinkProps {
  item: NavItem;
  collapsed: boolean;
  count?: number;
}

function NavLink({ item, collapsed, count }: NavLinkProps) {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const Icon = ICON_MAP[item.icon];
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  // In Arabic, always use the translation key so sidebarLabel (English-only short form) doesn't leak through
  const label = i18n.language === 'ar'
    ? t(item.i18nKey, { defaultValue: item.title })
    : (item.sidebarLabel ?? t(item.i18nKey, { defaultValue: item.title }));

  const countLabel = count && count > 0 ? (count > 99 ? '99+' : String(count)) : null;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              'relative flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-colors',
              isActive ? 'bg-adaam-tint text-adaam' : 'text-gray-500 hover:bg-gray-50'
            )}
          >
            {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
            <span className="sr-only">{label}</span>
            {countLabel && (
              <span className="absolute -top-1 -end-1 min-w-[16px] h-4 rounded-full bg-adaam text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none shadow-sm">
                {countLabel}
              </span>
            )}
          </Link>
        </TooltipTrigger>
        {/* Portalled to <body>: the collapsed rail's <nav> is `overflow-y-auto overflow-x-hidden`,
            so an inline side="right" tooltip was clipped at the sidebar edge. sideOffset clears
            the 68px rail (trigger ends at 54px) so the label never sits on top of it. */}
        <TooltipPortal>
          <TooltipContent side="right" sideOffset={16} collisionPadding={8} className="shadow-lg">
            {label}{countLabel ? ` (${countLabel})` : ''}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex w-full items-center gap-2.5 ps-3 pe-2.5 py-1.5 rounded-full text-[13px] transition-colors',
        isActive ? 'bg-adaam-tint font-semibold text-adaam' : 'font-medium text-gray-600 hover:bg-gray-50'
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="truncate">{label}</span>
      {countLabel && (
        <span className={cn(
          'ms-auto min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 leading-none',
          isActive ? 'bg-adaam text-white' : 'bg-adaam/80 text-white'
        )}>
          {countLabel}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Restore persisted UI state after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const c = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (c) setCollapsed(JSON.parse(c) === true);
      const g = localStorage.getItem(SIDEBAR_GROUPS_KEY);
      if (g) setOpenGroups(JSON.parse(g));
    } catch {
      // Corrupt localStorage — keep defaults
    }
  }, []);

  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);
  const [localUser, setLocalUser] = useState<{ email: string; role: string } | null>(null);

  // Fallback: read from localStorage if Redux isn't hydrated yet (hydration race condition fix)
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const stored = localStorage.getItem('sbr_user');
      if (stored) {
        try {
          setLocalUser(JSON.parse(stored));
        } catch {
          // Invalid JSON
        }
      }
    }
  }, [user]);

  const effectiveUser = user || localUser;
  const isSuperAdmin = !!(effectiveUser?.role && (
    effectiveUser.role === 'SUPER_ADMIN' ||
    effectiveUser.role === 'Super Admin' ||
    effectiveUser.role?.toUpperCase() === 'SUPER_ADMIN'
  ));

  const canSeeChangeRequestCount = isSuperAdmin || permissions.some((p) => {
    const name = p.permissionName?.toLowerCase();
    return name === 'approvals.approve' || name === 'approvals.view';
  });
  const { data: changeRequestCountData } = useGetChangeRequestCountQuery(undefined, { skip: !canSeeChangeRequestCount });
  const pendingCount = changeRequestCountData?.data?.count ?? 0;

  const hasPermission = (key: string) =>
    permissions.some((p) => p.permissionName?.toLowerCase() === key.toLowerCase());
  const hasAnyAdminPermission = permissions.some((p) => p.permissionName?.startsWith('admin_panel.'));

  const isItemVisible = (item: NavItem) => {
    if (isSuperAdmin || item.permKey === '') return true;
    const keys = Array.isArray(item.permKey) ? item.permKey : [item.permKey];
    return keys.some(hasPermission);
  };

  const isGroupVisible = (group: NavGroup) => {
    if (group.id === 'administration') {
      return isSuperAdmin || hasAnyAdminPermission;
    }
    return group.items.some(isItemVisible);
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: prev[id] === false };
      try {
        localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures
      }
      return next;
    });
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures
      }
      return next;
    });
  };

  function handleLogout() {
    dispatch(logout());
    router.push('/login');
  }

  const initials = effectiveUser?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <TooltipProvider delayDuration={0}>
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
          // Arabic mode: Noto Sans Arabic primary so nav text matches client; English: Jakarta primary
          fontFamily: i18n.language === 'ar'
            ? 'var(--font-cairo), var(--font-jakarta), sans-serif'
            : 'var(--font-jakarta), var(--font-cairo), sans-serif',
        }}
      >
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

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2', collapsed ? 'px-2' : 'px-3')}>
          {NAV_GROUPS.filter(isGroupVisible).map((group) => {
            const visibleItems = group.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;
            const isOpen = openGroups[group.id] !== false;
            const groupActive = visibleItems.some(
              (item) => pathname === item.href || pathname.startsWith(item.href + '/')
            );

            const groupPendingCount = visibleItems.some((i) => i.showCount) ? pendingCount : 0;

            if (collapsed) {
              return (
                <div key={group.id} className="py-1.5 border-t first:border-t-0 border-gray-100">
                  <div className="flex flex-col gap-1">
                    {visibleItems.map((item, idx) => (
                      <div key={item.href} className="contents">
                        {item.divider && idx > 0 && <div className="mx-2 my-1.5 h-px bg-gray-200" />}
                        <NavLink item={item} collapsed count={item.showCount ? pendingCount : undefined} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-[0.12em] transition-colors hover:bg-gray-50',
                    groupActive ? 'text-dune-deep' : 'text-gray-400'
                  )}
                >
                  <span className="truncate">{t(group.i18nKey, { defaultValue: group.title })}</span>
                  {groupPendingCount > 0 && (
                    <span className="min-w-[16px] h-4 rounded-full bg-adaam text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                      {groupPendingCount > 99 ? '99+' : groupPendingCount}
                    </span>
                  )}
                  <ChevronDown
                    className={cn('h-[13px] w-[13px] ms-auto transition-transform', !isOpen && '-rotate-90')}
                  />
                </button>
                {isOpen && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {visibleItems.map((item, idx) => (
                      <div key={item.href} className="contents">
                        {item.divider && idx > 0 && <div className="mx-1 my-1.5 h-px bg-gray-200" />}
                        <NavLink item={item} collapsed={false} count={item.showCount ? pendingCount : undefined} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center gap-2 h-10 shrink-0 text-[12px] font-semibold text-gray-500 transition-colors hover:bg-gray-50',
            collapsed ? 'justify-center' : 'px-4'
          )}
          title={collapsed ? t('sidebar.expand', { defaultValue: 'Expand' }) : t('sidebar.collapse', { defaultValue: 'Collapse' })}
        >
          {collapsed ? (
            <ChevronsRight className="h-[18px] w-[18px] rtl:rotate-180" />
          ) : (
            <>
              <ChevronsLeft className="h-[18px] w-[18px] rtl:rotate-180" />
              <span>{t('sidebar.collapse', { defaultValue: 'Collapse' })}</span>
            </>
          )}
        </button>

        {/* User */}
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
                <LogOut className="h-[15px] w-[15px] rtl:rotate-180" />
              </button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
