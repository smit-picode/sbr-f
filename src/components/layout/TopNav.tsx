'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut, User, ChevronDown, Settings, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAVIGATION } from '@/constants/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { logout } from '@/features/auth/authSlice';
import { useLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/common/Logo';
import { formatRole } from '@/utils/format';

const NAV_KEY_MAP: Record<string, string> = {
  '/frame':     'nav.establishments',
  '/contacts':  'nav.contacts',
  '/addresses': 'nav.addresses',
  '/audit-log': 'nav.auditLog',
  '/admin':     'nav.admin',
};

// Maps nav href to permission name stored in DB
const PERMISSION_MAP: Record<string, string> = {
  '/frame':     'establishments',
  '/contacts':  'contacts',
  '/addresses': 'addresses',
  '/audit-log': 'audit_log',
};

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const permissions = useAppSelector((s) => s.auth.permissions);
  const { toggleLanguage, isArabic } = useLanguage();
  const { t } = useTranslation();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U';
  const isAdminRoute = pathname.startsWith('/admin');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role?.toUpperCase() === 'SUPER_ADMIN';
  // Admin Panel button: visible if user has admin_panel.view OR any admin_panel.* tab permission
  const hasAdminPanelPermission = isSuperAdmin ||
    permissions.some(p => p.permissionName?.startsWith('admin_panel.'));

  // Filter nav links by each item's permKey (e.g. 'establishments.view')
  const visibleNavItems = NAVIGATION.filter((item) =>
    isSuperAdmin ||
    permissions.some((p) => p.permissionName?.toLowerCase() === item.permKey.toLowerCase())
  );

  function handleLogout() {
    dispatch(logout());
    router.push('/login');
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-6 shrink-0 z-10">
      {/* Logo */}
      <Link href="/frame" className="flex items-center gap-2.5 shrink-0">
        <Logo size="sm" showText variant="light" />
      </Link>

      {/* Divider */}
      <div className="h-6 w-px bg-slate-200 shrink-0" />

      {/* Navigation Links — hidden on admin route, filtered by permissions */}
      {!isAdminRoute && (
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const navKey = NAV_KEY_MAP[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'font-bold text-[#A71D3A]'
                    : 'font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {navKey ? t(navKey) : item.title}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Admin route: flex spacer */}
      {isAdminRoute && <div className="flex-1" />}

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          {isArabic ? (
            <><span>إنجليزي</span><span>English</span></>
          ) : (
            <><span>Arabic</span><span>عربي</span></>
          )}
        </button>

        {/* Admin Panel Button - visible to users with admin panel permission */}
        {hasAdminPanelPermission && !isAdminRoute && (
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', color: 'white' }}
            title={t('nav.admin')}
          >
            <Settings className="h-3.5 w-3.5" />
            {t('nav.admin')}
          </button>
        )}

        {/* SBR Panel Button - shown only on admin route, beside language toggle */}
        {isAdminRoute && (
          <button
            onClick={() => router.push('/frame')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', color: 'white' }}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            {t('nav.sbrPanel')}
          </button>
        )}

        {/* Home */}
        <button
          onClick={() => router.push('/frame')}
          className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          title={isArabic ? 'الرئيسية' : 'Home'}
        >
          <Home className="h-4 w-4" />
        </button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md pl-2 pr-1.5 py-1 hover:bg-slate-50 transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] bg-[#A71D3A] text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-none">
                <p className="text-xs font-medium text-slate-700">{user?.email ?? 'User'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formatRole(user?.role)}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t('actions.myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              {t('actions.profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('actions.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
