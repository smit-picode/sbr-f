'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAVIGATION } from '@/constants/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { logout } from '@/features/auth/authSlice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  function handleLogout() {
    dispatch(logout());
    router.push('/login');
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-6 shrink-0 z-10">
      {/* Logo */}
      <Link href="/frame" className="flex items-center gap-2.5 shrink-0">
        <div className="h-8 w-8 flex items-center justify-center">
          <svg viewBox="0 0 80 80" className="h-8 w-8" fill="none">
            {/* Qatar emblem: crossed swords + dhow + palm */}
            <g fill="#A71D3A">
              {/* Left sword */}
              <rect x="8" y="58" width="3" height="24" rx="1.5" transform="rotate(-40 8 58)" />
              <polygon points="8,58 5,65 11,65" />
              {/* Right sword */}
              <rect x="60" y="58" width="3" height="24" rx="1.5" transform="rotate(40 60 58)" />
              <polygon points="72,58 69,65 75,65" />
              {/* Water waves */}
              <path d="M15 62 Q22 58 29 62 Q36 66 43 62 Q50 58 57 62 Q64 66 65 62" stroke="#A71D3A" strokeWidth="2" fill="none" />
              {/* Dhow hull */}
              <ellipse cx="40" cy="55" rx="18" ry="5" />
              {/* Dhow mast */}
              <rect x="39" y="32" width="2" height="23" />
              {/* Dhow sail */}
              <polygon points="41,33 58,52 41,52" opacity="0.85" />
              {/* Left palm trunk */}
              <rect x="20" y="30" width="3" height="22" rx="1.5" transform="rotate(-5 20 30)" />
              {/* Left palm fronds */}
              <ellipse cx="19" cy="28" rx="7" ry="4" transform="rotate(-20 19 28)" />
              <ellipse cx="22" cy="26" rx="7" ry="3.5" transform="rotate(10 22 26)" />
              {/* Right palm trunk */}
              <rect x="57" y="30" width="3" height="22" rx="1.5" transform="rotate(5 57 30)" />
              {/* Right palm fronds */}
              <ellipse cx="61" cy="28" rx="7" ry="4" transform="rotate(20 61 28)" />
              <ellipse cx="58" cy="26" rx="7" ry="3.5" transform="rotate(-10 58 26)" />
            </g>
          </svg>
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold text-slate-900">SBR</p>
          <p className="text-[10px] text-slate-500 mt-0.5">NPC Qatar</p>
        </div>
      </Link>

      {/* Divider */}
      <div className="h-6 w-px bg-slate-200 shrink-0" />

      {/* Navigation Links */}
      <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
        {NAVIGATION.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
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
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => router.push('/frame')}
          className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          title="Home"
        >
          <Home className="h-4 w-4" />
        </button>

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
                <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                  {user?.role?.toLowerCase() ?? 'guest'}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
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
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
