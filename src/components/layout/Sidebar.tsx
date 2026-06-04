'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  MapPin,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAVIGATION, type NavItem } from '@/constants/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Users,
  MapPin,
  ClipboardList,
};

interface NavLinkProps {
  item: NavItem;
  collapsed: boolean;
}

function NavLink({ item, collapsed }: NavLinkProps) {
  const pathname = usePathname();
  const Icon = ICON_MAP[item.icon];
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
        isActive
          ? 'bg-blue-700 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
          )}
        />
      )}
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 shrink-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center h-14 px-4 border-b border-slate-800 shrink-0',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">SBR</p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">NPC Qatar</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Main Menu
            </p>
          )}
          {NAVIGATION.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="shrink-0 p-2 border-t border-slate-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 px-3 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
