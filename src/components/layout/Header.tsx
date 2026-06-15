'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NAV_GROUPS } from '@/constants/navigation';
import { useLanguage } from '@/i18n';

// route -> breadcrumb data for the current path
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

export function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { toggleLanguage, isArabic } = useLanguage();
  const crumb = crumbFor(pathname);

  return (
    <header className="h-[58px] bg-white border-b border-slate-200 flex items-center px-5 gap-4 shrink-0 z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12.5px] min-w-0">
        <span className="text-slate-400 truncate">{t(crumb.groupKey, { defaultValue: crumb.groupTitle })}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-semibold truncate">{crumb.itemBreadcrumb ?? t(crumb.itemKey, { defaultValue: crumb.itemTitle })}</span>
      </div>

      {/* Right Actions */}
      <div className="ms-auto flex items-center gap-2.5">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          {isArabic ? 'English' : 'عربي'}
        </button>
        <button
          className="relative h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          title="Notifications"
        >
          <Bell className="h-[17px] w-[17px]" />
          <span className="absolute top-1.5 end-2 w-1.5 h-1.5 rounded-full bg-[#A71D3A]" />
        </button>
      </div>
    </header>
  );
}
