'use client';

import { useEffect, useState } from 'react';
import { Bell, LogOut, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { logout } from '@/features/auth/authSlice';
import { NAVIGATION } from '@/constants/navigation';

function getBreadcrumbs(pathname: string) {
  const nav = NAVIGATION.find(
    (item) => item.href !== '/' && pathname.startsWith(item.href)
  );
  if (!nav) return [{ label: 'Dashboard', href: '/' }];
  return [{ label: 'Home', href: '/' }, { label: nav.title, href: nav.href }];
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [localUser, setLocalUser] = useState<{ email: string; role: string } | null>(null);

  const breadcrumbs = getBreadcrumbs(pathname);
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  // Fallback: read from localStorage if Redux isn't hydrated yet (hydration race condition fix)
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const stored = localStorage.getItem('sbr_user');
      if (stored) {
        try {
          setLocalUser(JSON.parse(stored));
        } catch {
          // invalid JSON
        }
      }
    }
  }, [user]);

  // Check if user is super admin (handle various role formats)
  const effectiveUser = user || localUser;
  const isSuperAdmin = effectiveUser?.role && (
    effectiveUser.role === 'SUPER_ADMIN' ||
    effectiveUser.role === 'Super Admin' ||
    effectiveUser.role?.toUpperCase() === 'SUPER_ADMIN'
  );


  function handleLogout() {
    dispatch(logout());
    router.push('/login');
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300">/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-slate-800">{crumb.label}</span>
            ) : (
              <span className="text-slate-500 hover:text-slate-700 cursor-pointer" onClick={() => router.push(crumb.href)}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100 transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              {user?.email && (
                <div className="hidden md:block text-left">
                  <p className="text-xs font-medium text-slate-700 leading-none">{user.email}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{user.role?.toLowerCase()}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
