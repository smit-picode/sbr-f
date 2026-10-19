'use client';

import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import type { SamplingContactOptions, SamplingContactTag } from '@/types';

// Which contacts go with the sample: none, all, or tagged ones, with a choice for those without.
export function ContactOptions({ value, tags, onChange }: {
  value: SamplingContactOptions;
  tags: SamplingContactTag[];
  onChange: (patch: Partial<SamplingContactOptions>) => void;
}) {
  const { t, i18n } = useTranslation();
  const tagName = (tag: SamplingContactTag) => (i18n.language === 'ar' ? tag.NAME_AR : tag.NAME_EN) || tag.CODE;
  const toggleTag = (code: string) =>
    onChange({ tags: value.tags.includes(code) ? value.tags.filter((c) => c !== code) : [...value.tags, code] });

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
        <Checkbox checked={value.include} onCheckedChange={(c) => onChange({ include: c === true })} />
        {t('sampling.includeContacts', { defaultValue: 'Include contacts' })}
      </label>
      {value.include && (
        <>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">{t('sampling.contactTags', { defaultValue: 'Only contacts tagged' })}</div>
            {tags.length === 0 ? (
              <p className="text-xs text-slate-400">{t('sampling.noContactTags', { defaultValue: 'No contact tags exist yet: every contact is included.' })}</p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {tags.map((tag) => (
                  <label key={tag.CODE} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                    <Checkbox checked={value.tags.includes(tag.CODE)} onCheckedChange={() => toggleTag(tag.CODE)} />
                    <span>{tagName(tag)}</span>
                    <span className="font-mono text-[10px] text-slate-400">{tag.CODE}</span>
                    {tag.ONE_PER_ESTABLISHMENT === 'Y' && (
                      <span className="rounded bg-[#F4F0E8] px-1 text-[10px] font-semibold text-[#87795D]">{t('sampling.primaryTag', { defaultValue: 'primary' })}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
            {value.tags.length === 0 && tags.length > 0 && (
              <p className="mt-1 text-[11px] text-slate-400">{t('sampling.noTagPicked', { defaultValue: 'No tag picked: every contact is included.' })}</p>
            )}
          </div>
          {value.tags.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-slate-600">{t('sampling.fallbackLabel', { defaultValue: 'An establishment with no contact tagged like this' })}</div>
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                {(['ALL', 'NONE'] as const).map((f) => (
                  <button key={f} type="button" onClick={() => onChange({ fallback: f })}
                    className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${value.fallback === f ? 'bg-[#A29374] text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                    {f === 'ALL'
                      ? t('sampling.fallbackAll', { defaultValue: 'gets all its contacts' })
                      : t('sampling.fallbackNone', { defaultValue: 'gets no contact' })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
