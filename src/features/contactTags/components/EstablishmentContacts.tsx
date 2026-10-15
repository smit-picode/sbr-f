'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Plus, Smartphone, Star, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { toast } from '@/utils/toast';
import { useHasPermission } from '@/hooks/usePermission';
import { useGetContactTagsQuery, useGetEstablishmentContactsQuery, useUntagContactMutation } from '../api/contactTagsApi';
import { AddTagButton, TagChip, tagErrorMessage } from './TagControls';
import { AddContactModal } from './AddContactModal';
import type { EstablishmentContact, EstablishmentContactTag } from '@/types';

// The establishment's open contacts with their tags; the one with the most tags is listed first and starred.

export function EstablishmentContacts({ sbrId }: { sbrId: number }) {
  const { t } = useTranslation();
  const canTag = useHasPermission('contacts.tag');
  const canCreate = useHasPermission('contacts.create');
  const [addOpen, setAddOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useGetEstablishmentContactsQuery(sbrId);
  const { data: registryData } = useGetContactTagsQuery(undefined, { skip: !canTag });
  const [untagContact, { isLoading: untagging }] = useUntagContactMutation();

  const contacts = data?.data?.contacts ?? [];
  const registry = registryData?.data ?? [];

  // Open tags by contact, and the holder of each one-per tag.
  const { byContact, byCode } = useMemo(() => {
    const tags = data?.data?.tags ?? [];
    const byContact = new Map<number, EstablishmentContactTag[]>();
    const byCode = new Map<string, EstablishmentContactTag>();
    for (const tag of tags) {
      byContact.set(tag.CONTACT_ID, [...(byContact.get(tag.CONTACT_ID) ?? []), tag]);
      if (tag.ONE_PER_ESTABLISHMENT === 'Y') byCode.set(tag.TAG_CODE, tag);
    }
    return { byContact, byCode };
  }, [data]);

  const remove = async (contact: EstablishmentContact, tag: EstablishmentContactTag) => {
    try {
      await untagContact({ sbrId, contactId: contact.CONTACT_ID, tagCode: tag.TAG_CODE }).unwrap();
      toast.success(t('contactTags.untagged'));
    } catch (error) {
      toast.error(tagErrorMessage(error, t('contactTags.untagFailed')));
    }
  };

  return (
    <div className="rounded-lg bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-100 px-4 py-3">
        <Users className="h-4 w-4 text-[#A29374]" />
        <h2 className="text-sm font-semibold text-slate-800">{t('contactTags.sectionTitle')}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{contacts.length}</span>
        {canCreate && (
          <Button size="sm" variant="outline" className="ms-auto gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> {t('contactTags.addContact.button')}
          </Button>
        )}
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
          </div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : contacts.length === 0 ? (
          <p className="text-[12.5px] text-slate-400">{t('contactTags.noContacts')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {contacts.map((c) => {
              const own = byContact.get(c.CONTACT_ID) ?? [];
              return (
                <li key={c.CONTACT_ID} className="flex flex-col gap-1.5 py-2.5 lg:flex-row lg:items-start lg:gap-4">
                  <div className="min-w-0 lg:w-1/3">
                    <div className="flex items-center gap-1.5">
                      {c.IS_PRIMARY && (
                        <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label={t('contactTags.primary')} />
                      )}
                      <span className="truncate text-[13px] font-semibold text-slate-800">{c.CONTACT_NAME || t('contactTags.unnamed')}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400">
                      {c.ROLE && <span>{c.ROLE}</span>}
                      <span className="font-mono">{c.SOURCE_CODE}</span>
                      <span className="font-mono">#{c.CONTACT_ID}</span>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-slate-600 lg:w-1/3">
                    {c.EMAIL && <span className="inline-flex items-center gap-1 truncate"><Mail className="h-3 w-3 text-slate-400" />{c.EMAIL}</span>}
                    {c.PHONE && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" />{c.PHONE}</span>}
                    {c.MOBILE && <span className="inline-flex items-center gap-1"><Smartphone className="h-3 w-3 text-slate-400" />{c.MOBILE}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 lg:w-1/3">
                    {own.map((tag) => (
                      <TagChip key={tag.TAG_CODE} tag={tag} removing={untagging} onRemove={canTag ? () => remove(c, tag) : undefined} />
                    ))}
                    {canTag && registry.length > 0 && (
                      <AddTagButton sbrId={sbrId} contactId={c.CONTACT_ID} registry={registry} held={byCode} own={own} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {canCreate && <AddContactModal sbrId={sbrId} open={addOpen} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
