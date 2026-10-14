'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/utils/toast';
import { useHasPermission } from '@/hooks/usePermission';
import { useLanguage } from '@/i18n';
import {
  useGetContactTagsQuery, useGetEstablishmentContactsQuery, useTagContactMutation, useUntagContactMutation,
} from '../api/contactTagsApi';
import type { ContactTag, EstablishmentContactTag } from '@/types';

export const tagErrorMessage = (error: unknown, fallback: string) =>
  (error as { data?: { message?: string } })?.data?.message ?? fallback;

export function tagLabel(tag: { TAG_CODE?: string; CODE?: string; TAG_NAME_EN?: string | null; TAG_NAME_AR?: string | null; NAME_EN?: string | null; NAME_AR?: string | null }, isArabic: boolean) {
  const en = tag.TAG_NAME_EN ?? tag.NAME_EN;
  const ar = tag.TAG_NAME_AR ?? tag.NAME_AR;
  return (isArabic ? ar || en : en || ar) || tag.TAG_CODE || tag.CODE || '';
}

export function AddTagButton({ sbrId, contactId, registry, held, own }: {
  sbrId: number;
  contactId: number;
  registry: ContactTag[];
  // The holder of each one-per tag on this establishment (a one-per tag has a single holder).
  held: Map<string, EstablishmentContactTag>;
  own: EstablishmentContactTag[];
}) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  const [open, setOpen] = useState(false);
  const [tagContact, { isLoading }] = useTagContactMutation();
  const ownCodes = new Set(own.map((tag) => tag.TAG_CODE));
  const choices = registry.filter((tag) => !ownCodes.has(tag.CODE));

  const apply = async (tag: ContactTag) => {
    try {
      const res = await tagContact({ sbrId, contactId, tagCode: tag.CODE }).unwrap();
      const result = res.data?.RESULT;
      toast.success(result === 'MOVED' ? t('contactTags.moved', { tag: tagLabel(tag, isArabic) }) : t('contactTags.tagged'));
      setOpen(false);
    } catch (error) {
      toast.error(tagErrorMessage(error, t('contactTags.tagFailed')));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={choices.length === 0}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:border-[#A29374] hover:text-[#87795D] disabled:opacity-40"
        >
          <Plus className="h-3 w-3" /> {t('contactTags.addTag')}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-1">
        <ul className="max-h-72 overflow-y-auto">
          {choices.map((tag) => {
            const holder = tag.ONE_PER_ESTABLISHMENT === 'Y' ? held.get(tag.CODE) : undefined;
            return (
              <li key={tag.CODE}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => apply(tag)}
                  className="w-full rounded px-2 py-1.5 text-start text-[12.5px] hover:bg-slate-50 disabled:opacity-50"
                >
                  <div className="font-medium text-slate-800">{tagLabel(tag, isArabic)}</div>
                  <div className="font-mono text-[10.5px] text-slate-400">{tag.CODE}</div>
                  {holder && holder.CONTACT_ID !== contactId && (
                    <div className="text-[10.5px] text-amber-600">{t('contactTags.willMove', { id: holder.CONTACT_ID })}</div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function TagChip({ tag, onRemove, removing }: { tag: EstablishmentContactTag; onRemove?: () => void; removing?: boolean }) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  return (
    <span title={tag.REASON ?? undefined} className="inline-flex items-center gap-1 rounded-full bg-[#F4F0E8] px-2 py-0.5 text-[11px] font-semibold text-[#87795D]">
      <Tag className="h-3 w-3" />
      {tagLabel(tag, isArabic)}
      {onRemove && (
        <button type="button" disabled={removing} onClick={onRemove} className="ms-0.5 rounded-full hover:text-red-600 disabled:opacity-40" aria-label={t('contactTags.removeTag')}>
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// One contact's open tags, editable in place when the user may tag; changes apply immediately (no approval).
export function ContactTagEditor({ sbrId, contactId }: { sbrId: number; contactId: number }) {
  const { t } = useTranslation();
  const canTag = useHasPermission('contacts.tag');
  const { data, isLoading } = useGetEstablishmentContactsQuery(sbrId);
  const { data: registryData } = useGetContactTagsQuery(undefined, { skip: !canTag });
  const [untagContact, { isLoading: untagging }] = useUntagContactMutation();
  const registry = registryData?.data ?? [];

  const { own, held } = useMemo(() => {
    const tags = data?.data?.tags ?? [];
    const held = new Map<string, EstablishmentContactTag>();
    for (const tag of tags) if (tag.ONE_PER_ESTABLISHMENT === 'Y') held.set(tag.TAG_CODE, tag);
    return { own: tags.filter((tag) => tag.CONTACT_ID === contactId), held };
  }, [data, contactId]);

  const remove = async (tag: EstablishmentContactTag) => {
    try {
      await untagContact({ sbrId, contactId, tagCode: tag.TAG_CODE }).unwrap();
      toast.success(t('contactTags.untagged'));
    } catch (error) {
      toast.error(tagErrorMessage(error, t('contactTags.untagFailed')));
    }
  };

  if (isLoading) return <Skeleton className="h-6 w-48 rounded-full" />;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {own.map((tag) => (
        <TagChip key={tag.TAG_CODE} tag={tag} removing={untagging} onRemove={canTag ? () => remove(tag) : undefined} />
      ))}
      {own.length === 0 && <span className="text-[12px] text-slate-400">{t('contactTags.noTags', { defaultValue: 'No tags' })}</span>}
      {canTag && registry.length > 0 && <AddTagButton sbrId={sbrId} contactId={contactId} registry={registry} held={held} own={own} />}
    </div>
  );
}
