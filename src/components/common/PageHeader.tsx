'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NAV_GROUPS } from '@/constants/navigation';
import { useLanguage } from '@/i18n';
import { useAppSelector } from '@/hooks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

// route -> breadcrumb data for the current path — moved from the old Header.tsx unchanged.
function crumbFor(pathname: string): { groupKey: string; groupTitle: string; itemKey: string; itemTitle: string; itemBreadcrumb?: string } {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return { groupKey: group.i18nKey, groupTitle: group.title, itemKey: item.i18nKey, itemTitle: item.title, itemBreadcrumb: item.breadcrumbLabel };
      }
    }
  }
  // /admin root (before redirect resolves) falls back to the Administration group
  if (pathname.startsWith('/admin')) {
    const admin = NAV_GROUPS.find((g) => g.id === 'administration') ?? NAV_GROUPS[0];
    const first = admin.items[0];
    return { groupKey: admin.i18nKey, groupTitle: admin.title, itemKey: first.i18nKey, itemTitle: first.title, itemBreadcrumb: first.breadcrumbLabel };
  }
  const sbr = NAV_GROUPS[0];
  return { groupKey: sbr.i18nKey, groupTitle: sbr.title, itemKey: sbr.items[0].i18nKey, itemTitle: sbr.items[0].title };
}

function initialsOf(user: { email: string } | null): string {
  if (!user) return 'U';
  return user.email.slice(0, 2).toUpperCase();
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { toggleLanguage, isArabic } = useLanguage();
  const user = useAppSelector((s) => s.auth.user);
  const crumb = crumbFor(pathname);

  return (
    <div
      className="relative overflow-hidden rounded-3xl text-white shrink-0 min-h-[172px]"
      style={{ background: "#0E1A2B url('/assets/banner-skyline.jpg') center 42% / cover no-repeat" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.58), rgba(0,0,0,.30) 55%, rgba(0,0,0,.42))' }}
      />

      {/* Toolbar: language toggle + notification bell + avatar — moved from the old Header.tsx,
          same handlers, now an overlay pill instead of a separate flat bar. */}
      <div
        className="absolute top-4 end-4 z-10 flex items-center gap-1.5 rounded-full p-1.5"
        style={{ background: 'rgba(255,255,255,.12)', boxShadow: '0 4px 24px rgba(0,0,0,.22)', backdropFilter: 'blur(8px)' }}
      >
        <button
          onClick={toggleLanguage}
          className="h-9 px-3.5 rounded-full text-[12px] font-semibold text-white hover:bg-white/25 transition-colors"
          title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
          style={!isArabic ? { fontFamily: 'var(--font-cairo), sans-serif' } : undefined}
        >
          {isArabic ? 'English' : 'عربي'}
        </button>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="relative h-9 w-9 rounded-full flex items-center justify-center text-white hover:bg-white/25 transition-colors">
                <Bell className="h-[16px] w-[16px]" />
                <span className="absolute top-2 end-2.5 w-1.5 h-1.5 rounded-full bg-dune-light" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] text-center text-xs">
              This feature will be implemented in the next phase
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div
          className="h-9 w-9 rounded-full bg-dune text-white font-bold text-[12px] flex items-center justify-center"
          style={{ boxShadow: '0 0 0 2px rgba(255,255,255,.55)' }}
          title={user?.email ?? ''}
        >
          {initialsOf(user)}
        </div>
      </div>

      <div className="relative flex flex-col justify-end min-h-[inherit] px-7 pb-6 pt-[72px]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-white/75 flex items-center gap-2 flex-wrap">
              {t(crumb.groupKey, { defaultValue: crumb.groupTitle })}
              {'  ·  '}
              {isArabic ? t(crumb.itemKey, { defaultValue: crumb.itemTitle }) : (crumb.itemBreadcrumb ?? t(crumb.itemKey, { defaultValue: crumb.itemTitle }))}
            </div>
            <h1 className="font-extrabold leading-tight mt-1 text-white text-[26px]">{title}</h1>
            {description && <p className="text-[13px] text-white/80 mt-1 max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="banner-actions shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
