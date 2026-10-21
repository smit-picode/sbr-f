'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { withBasePath } from '@/utils/basePath';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from '@/hooks/useAppRouter';
import {
  Home,
  Building2,
  Layers,
  GitFork,
  Users,
  MapPin,
  Table,
  ClipboardList,
  Dices,
  GitBranch,
  Shield,
  ShieldCheck,
  KeyRound,
  Inbox,
  CheckCheck,
  Camera,
  Database,
  Gauge,
  PenLine,
  Flag,
  Landmark,
  Orbit,
  ScrollText,
  SlidersVertical,
  Columns2,
  DatabaseZap,
  History,
  ChartColumn,
  Tag,
  Tags,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from '@/constants/navigation';
import { SIDEBAR_COLLAPSED_KEY, SIDEBAR_GROUPS_KEY } from '@/constants/storage';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { logout } from '@/features/auth/authSlice';
import { ChangePasswordDialog } from '@/features/auth/components/ChangePasswordDialog';
import { formatRole } from '@/utils/format';
import { isNavGroupVisible, isNavItemVisible } from '@/utils/navAccess';
import { useGetChangeRequestCountQuery } from '@/features/tasks/api/changeRequestsApi';

import type { NavGroup, NavItem } from '@/types';
const ICON_MAP: Record<string, LucideIcon> = {
  Dices,
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
  PenLine,
  Flag,
  Landmark,
  Orbit,
  ScrollText,
  SlidersVertical,
  Columns2,
  DatabaseZap,
  History,
  ChartColumn,
  Tag,
  Tags,
};

const RAIL_GRADIENT = '#FFFFFF';


interface NavLinkProps {
  item: NavItem;
  count?: number;
  onNavigate?: () => void;
}

// Only ever rendered expanded now
function NavLink({ item, count, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const Icon = ICON_MAP[item.icon];
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const label = i18n.language === 'ar'
    ? t(item.i18nKey, { defaultValue: item.title })
    : (item.sidebarLabel ?? t(item.i18nKey, { defaultValue: item.title }));

  const countLabel = count && count > 0 ? (count > 99 ? '99+' : String(count)) : null;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex w-full items-center gap-2.5 ps-3 pe-2.5 h-8 rounded-full text-[13px] transition-colors',
        isActive ? 'bg-adaam-tint font-semibold text-adaam' : 'font-medium text-gray-600 hover:bg-gray-50'
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="truncate">{label}</span>
      {countLabel && (
        <span className={cn(
          'ms-auto min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold flex items-center justify-center px-1 leading-none',
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
  const [signingOut, setSigningOut] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [flyout, setFlyout] = useState<{ groupId: string; style: React.CSSProperties } | null>(null);

  // Opens the flyout for one collapsed group
  const openFlyout = (groupId: string, el: HTMLElement, itemCount: number) => {
    const r = el.getBoundingClientRect();
    const rail = el.closest('aside');
    const railRect = (rail ?? el).getBoundingClientRect();
    const rtl = getComputedStyle(el).direction === 'rtl';
    const estimatedHeight = 40 + itemCount * 34 + 8;
    const top = Math.max(8, Math.min(Math.round(r.top), window.innerHeight - estimatedHeight - 8));
    setFlyout({
      groupId,
      style: rtl
        ? { top, right: Math.round(window.innerWidth - r.left), paddingInlineStart: Math.round(r.left - railRect.left) + 8 }
        : { top, left: Math.round(r.right), paddingInlineStart: Math.round(railRect.right - r.right) + 8 },
    });
  };

  useEffect(() => {
    try {
      const c = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (c) setCollapsed(JSON.parse(c) === true);
      const g = localStorage.getItem(SIDEBAR_GROUPS_KEY);
      if (g) setOpenGroups(JSON.parse(g));
    } catch {
    }
  }, []);

  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);
  const [localUser, setLocalUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const stored = localStorage.getItem('sbr_user');
      if (stored) {
        try {
          setLocalUser(JSON.parse(stored));
        } catch {
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

  const navAccess = { isSuperAdmin, permissionNames: permissions.map((p) => p.permissionName) };
  const isItemVisible = (item: NavItem) => isNavItemVisible(item, navAccess);
  const isGroupVisible = (group: NavGroup) => isNavGroupVisible(group, navAccess);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: prev[id] === false };
      try {
        localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(next));
      } catch {
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
      }
      return next;
    });
  };

  const [changingPassword, setChangingPassword] = useState(false);

  // Cover the page first: clearing auth re-renders it as a guest until the login page arrives.
  function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    router.replace('/login');
    dispatch(logout());
  }

  const initials = effectiveUser?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <aside
      className={cn(
        'flex flex-col shrink-0 sticky top-4 my-4 ms-4 rounded-3xl shadow-float transition-[width] duration-200 ease-out',
        collapsed ? 'w-[68px]' : 'w-[236px]'
      )}
      style={{
        background: RAIL_GRADIENT,
        height: 'calc(100vh - 32px)',
        fontFamily: i18n.language === 'ar'
          ? "'Lusail', 'Lusail+', var(--font-cairo), 'Calibri', 'Segoe UI', Tahoma, sans-serif"
          : "'Lusail', 'Lusail+', 'Calibri', var(--font-cairo), 'Segoe UI', Roboto, var(--font-jakarta), sans-serif",
      }}
    >
      <button
        type="button"
        onClick={() => router.push('/home')}
        className={cn('flex flex-col shrink-0 items-center gap-2.5 pt-5 pb-4', collapsed ? 'px-2' : 'px-4')}
      >
        {!collapsed && (
          <Image
            src={withBasePath('/assets/npc-logo-primary.png')}
            alt="National Planning Council"
            width={257}
            height={90}
            priority
            className="h-14 w-auto object-contain"
          />
        )}
        <span className={cn('font-extrabold text-ink leading-tight', collapsed ? 'text-[11px]' : 'text-[14.5px]')}>
          {collapsed ? 'SBR' : 'SBR Portal'}
        </span>
      </button>

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
            const GroupIcon = ICON_MAP[group.icon];
            const groupLabel = t(group.i18nKey, { defaultValue: group.title });
            const isFlyoutOpen = flyout?.groupId === group.id;
            return (
              <div
                key={group.id}
                className="py-1.5 border-t first:border-t-0 border-gray-100"
                onMouseEnter={(e) => openFlyout(group.id, e.currentTarget, visibleItems.length)}
                onMouseLeave={() => setFlyout(null)}
              >
                <button
                  type="button"
                  onClick={() => { router.push(visibleItems[0].href); setFlyout(null); }}
                  title={groupLabel}
                  className={cn(
                    'relative flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-colors',
                    groupActive ? 'bg-adaam-tint text-adaam' : 'text-gray-500 hover:bg-gray-50'
                  )}
                >
                  {GroupIcon && <GroupIcon className="h-[19px] w-[19px] shrink-0" />}
                  <span className="sr-only">{groupLabel}</span>
                  {groupPendingCount > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-adaam text-white text-[9px] font-extrabold flex items-center justify-center leading-none">
                      {groupPendingCount > 99 ? '99+' : groupPendingCount}
                    </span>
                  )}
                </button>
                {isFlyoutOpen && flyout && createPortal(
                  <div className="fixed z-50" style={flyout.style}>
                    <div className="w-60 rounded-2xl bg-white p-2 shadow-float">
                      <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold text-gray-400">{groupLabel}</div>
                      <div className="flex flex-col gap-0.5">
                        {visibleItems.map((item, idx) => (
                          <div key={item.href} className="contents">
                            {item.divider && idx > 0 && <div className="mx-1 my-1.5 h-px bg-gray-200" />}
                            <NavLink
                              item={item}
                              count={item.showCount ? pendingCount : undefined}
                              onNavigate={() => setFlyout(null)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            );
          }

          return (
            <div key={group.id} className="mb-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 h-7 mt-1 rounded-full text-[11px] font-semibold transition-colors hover:bg-gray-50',
                  groupActive ? 'text-dune-deep' : 'text-gray-400'
                )}
              >
                <span className="truncate">{t(group.i18nKey, { defaultValue: group.title })}</span>
                {groupPendingCount > 0 && (
                  <span className="min-w-[18px] h-[18px] rounded-full bg-adaam text-white text-[10px] font-extrabold flex items-center justify-center px-1 leading-none">
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
                      <NavLink item={item} count={item.showCount ? pendingCount : undefined} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button
        onClick={toggleCollapsed}
        className={cn(
          'flex items-center gap-2 h-9 shrink-0 mx-3 mb-1 rounded-full text-[12px] font-semibold text-gray-500 transition-colors hover:bg-gray-50',
          collapsed ? 'justify-center' : 'px-3'
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

      <div className={cn('flex items-center gap-2.5 h-[58px] shrink-0 border-t border-gray-100', collapsed ? 'justify-center px-2' : 'px-4')}>
        <div
          className="h-9 w-9 rounded-full bg-dune flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        >
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="leading-tight min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink truncate">
                {effectiveUser?.email ?? 'User'}
              </p>
              <p className="text-[10.5px] truncate text-gray-500">{formatRole(effectiveUser?.role)}</p>
            </div>
            <button
              onClick={() => setChangingPassword(true)}
              title={t('password.change.title', { defaultValue: 'Change password' })}
              aria-label={t('password.change.title', { defaultValue: 'Change password' })}
              className="h-7 w-7 flex items-center justify-center rounded-full text-gray-400 hover:text-adaam hover:bg-adaam-tint transition-colors"
            >
              <KeyRound className="h-[15px] w-[15px]" />
            </button>
            <button
              onClick={handleLogout}
              title={t('actions.signOut')}
              className="h-7 w-7 flex items-center justify-center rounded-full text-gray-400 hover:text-adaam hover:bg-adaam-tint transition-colors"
            >
              <LogOut className="h-[15px] w-[15px] rtl:rotate-180" />
            </button>
          </>
        )}
      </div>
      <ChangePasswordDialog open={changingPassword} onClose={() => setChangingPassword(false)} />
      {signingOut && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center gap-2 bg-white text-sm text-slate-500">
          <LogOut className="h-4 w-4 rtl:rotate-180" />
          {t('actions.signingOut')}
        </div>,
        document.body,
      )}
    </aside>
  );
}
