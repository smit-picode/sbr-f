'use client';

import { useTranslation } from 'react-i18next';
import { History, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, nullableText } from '@/utils/format';
import { useLanguage } from '@/i18n';
import { useGetContactTagHistoryQuery } from '../api/contactTagsApi';
import { ContactTagEditor, tagLabel } from './TagControls';

// A contact's tags on its own page. Tags are applied without approval, unlike the contact's fields.
export function ContactTagsPanel({ sbrId, contactId, canViewHistory }: { sbrId: number; contactId: number; canViewHistory: boolean }) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  const { data, isLoading } = useGetContactTagHistoryQuery(sbrId, { skip: !canViewHistory });
  const history = (data?.data ?? []).filter((row) => row.CONTACT_ID === contactId);

  return (
    <div className="rounded-lg bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Tag className="h-4 w-4 text-[#A29374]" />
        <h2 className="text-sm font-semibold text-slate-800">{t('contactTags.panelTitle', { defaultValue: 'Tags' })}</h2>
        <span className="text-[11.5px] text-slate-400">{t('contactTags.noApprovalNote', { defaultValue: 'Tag changes apply immediately, without approval.' })}</span>
      </div>
      <div className="space-y-4 p-4">
        <ContactTagEditor sbrId={sbrId} contactId={contactId} />

        {canViewHistory && (
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <History className="h-3.5 w-3.5" /> {t('contactTags.historyTitle', { defaultValue: 'Tag history' })}
            </h3>
            {isLoading ? (
              <Skeleton className="h-16 w-full rounded-md" />
            ) : history.length === 0 ? (
              <p className="text-[12px] text-slate-400">{t('contactTags.noHistory', { defaultValue: 'This contact has never been tagged.' })}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                      <th className="py-1.5 pe-3 text-start font-medium">{t('contactTags.history.tag', { defaultValue: 'Tag' })}</th>
                      <th className="py-1.5 pe-3 text-start font-medium">{t('contactTags.history.from', { defaultValue: 'From' })}</th>
                      <th className="py-1.5 pe-3 text-start font-medium">{t('contactTags.history.to', { defaultValue: 'To' })}</th>
                      <th className="py-1.5 pe-3 text-start font-medium">{t('contactTags.history.by', { defaultValue: 'By' })}</th>
                      <th className="py-1.5 text-start font-medium">{t('contactTags.history.reason', { defaultValue: 'Reason / note' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.TAG_ROW_ID} className="border-b border-slate-50 last:border-0">
                        <td className="py-1.5 pe-3 font-medium text-slate-700">{tagLabel(row, isArabic)}</td>
                        <td className="py-1.5 pe-3 text-slate-600">{formatDate(row.VALID_FROM)}</td>
                        <td className="py-1.5 pe-3 text-slate-600">
                          {row.VALID_TO ? formatDate(row.VALID_TO) : <span className="font-semibold text-emerald-600">{t('contactTags.history.current', { defaultValue: 'Current' })}</span>}
                        </td>
                        <td className="py-1.5 pe-3 text-slate-600">{nullableText(row.TAGGED_BY_EMAIL || row.TAG_SOURCE_CODE)}</td>
                        <td className="py-1.5 text-slate-500">{nullableText([row.REASON, row.SCD2_NOTE].filter(Boolean).join(' · '))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
