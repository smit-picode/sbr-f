'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/utils/toast';
import { useHasPermission } from '@/hooks/usePermission';
import { useLanguage } from '@/i18n';
import { useGetContactTagsQuery, useGetEstablishmentContactsQuery, useTagContactMutation } from '../api/contactTagsApi';
import { tagErrorMessage, tagLabel } from './TagControls';
import { useCreateContactMutation } from '@/features/contacts/api/contactsApi';
import type { CreateContactInput } from '@/types';

// NPC-330: a contact typed in on an establishment's page. It is created immediately (no approval)
// as a MANUAL contact, and the register gives it a permanent CONTACT_ID the caller can tag at once.

type Field = Exclude<keyof CreateContactInput, 'sbrId' | 'comment'>;

const FIELDS: { key: Field; i18n: string; max: number; wide?: boolean; type?: string }[] = [
  { key: 'CONTACT_NAME', i18n: 'contactName', max: 200, wide: true },
  { key: 'ROLE',         i18n: 'role',        max: 100, wide: true },
  { key: 'EMAIL',        i18n: 'email',       max: 200, wide: true, type: 'email' },
  { key: 'PHONE',        i18n: 'phone',       max: 50 },
  { key: 'MOBILE',       i18n: 'mobile',      max: 50 },
  { key: 'FAX',          i18n: 'fax',         max: 50 },
  { key: 'PO_BOX',       i18n: 'poBox',       max: 20 },
  { key: 'WEBSITE',      i18n: 'website',     max: 500, wide: true },
];

// The register needs a way to reach the contact; a name or a role alone is not a contact.
const REACHABLE: Field[] = ['PHONE', 'MOBILE', 'EMAIL', 'FAX', 'WEBSITE'];

interface Props {
  sbrId: number;
  open: boolean;
  onClose: () => void;
  onCreated?: (contactId: number) => void;
}

export function AddContactModal({ sbrId, open, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Partial<Record<Field, string>>>({});
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createContact, { isLoading: creating }] = useCreateContactMutation();
  const { isArabic } = useLanguage();
  const canTag = useHasPermission('contacts.tag');
  const [tagCodes, setTagCodes] = useState<string[]>([]);
  const [tagContact, { isLoading: tagging }] = useTagContactMutation();
  const { data: registryData } = useGetContactTagsQuery(undefined, { skip: !canTag || !open });
  const { data: estData } = useGetEstablishmentContactsQuery(sbrId, { skip: !canTag || !open });
  const registry = registryData?.data ?? [];
  const isLoading = creating || tagging;
  // Who holds each one-per tag now, so picking it can say the tag will move.
  const holders = useMemo(() => {
    const m = new Map<string, number>();
    for (const tag of estData?.data?.tags ?? []) if (tag.ONE_PER_ESTABLISHMENT === 'Y') m.set(tag.TAG_CODE, tag.CONTACT_ID);
    return m;
  }, [estData]);

  useEffect(() => {
    if (open) { setForm({}); setComment(''); setErrors({}); setTagCodes([]); }
  }, [open]);

  const validate = () => {
    const e: Record<string, string> = {};
    for (const f of FIELDS) {
      const v = (form[f.key] ?? '').trim();
      if (v.length > f.max) e[f.key] = t('contactTags.addContact.tooLong', { max: f.max });
    }
    const email = (form.EMAIL ?? '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.EMAIL = t('contactTags.addContact.badEmail');
    if (!REACHABLE.some((k) => (form[k] ?? '').trim() !== '')) e._form = t('contactTags.addContact.needReachable');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    const body: CreateContactInput = { sbrId };
    for (const f of FIELDS) {
      const v = (form[f.key] ?? '').trim();
      if (v) body[f.key] = v;
    }
    if (comment.trim()) body.comment = comment.trim();
    try {
      const res = await createContact(body).unwrap();
      const contactId = res.data?.CONTACT_ID;
      // The contact exists from here on; tags go on one by one, also without approval.
      let tagFailures = 0;
      if (contactId && tagCodes.length) {
        for (const tagCode of tagCodes) {
          try {
            await tagContact({ sbrId, contactId, tagCode }).unwrap();
          } catch (error) {
            tagFailures += 1;
            toast.error(tagErrorMessage(error, t('contactTags.tagFailed')));
          }
        }
      }
      if (tagFailures) toast.info(t('contactTags.addContact.createdTagsFailed', { defaultValue: 'The contact was created, but some tags could not be added. Add them from the contact list.' }));
      else toast.success(t('contactTags.addContact.created'));
      onClose();
      if (contactId) onCreated?.(contactId);
    } catch (error) {
      if ((error as { status?: number })?.status === 403) return;
      toast.error((error as { data?: { message?: string } })?.data?.message ?? t('contactTags.addContact.failed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('contactTags.addContact.title')}</DialogTitle>
          <DialogDescription>{t('contactTags.addContact.description')}</DialogDescription>
        </DialogHeader>

        {errors._form && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{errors._form}</p>}

        <div className="grid grid-cols-2 gap-4 py-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={`space-y-1 ${f.wide ? 'col-span-2' : ''}`}>
              <Label>{t(`editContact.fields.${f.i18n}`)}</Label>
              <Input
                type={f.type ?? 'text'}
                value={form[f.key] ?? ''}
                className={errors[f.key] ? 'border-red-400' : ''}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
              {errors[f.key] && <p className="text-xs text-red-500">{errors[f.key]}</p>}
            </div>
          ))}
          {canTag && registry.length > 0 && (
            <div className="col-span-2 space-y-1.5">
              <Label>{t('contactTags.panelTitle', { defaultValue: 'Tags' })}</Label>
              <div className="flex flex-wrap gap-1.5">
                {registry.map((tag) => {
                  const on = tagCodes.includes(tag.CODE);
                  return (
                    <button
                      key={tag.CODE}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setTagCodes((p) => (on ? p.filter((c) => c !== tag.CODE) : [...p, tag.CODE]))}
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors ${on ? 'border-[#A29374] bg-[#F4F0E8] text-[#87795D]' : 'border-slate-200 text-slate-500 hover:border-[#A29374]/60'}`}
                    >
                      {tagLabel(tag, isArabic)}
                    </button>
                  );
                })}
              </div>
              {tagCodes.filter((c) => holders.has(c)).map((c) => (
                <p key={c} className="text-[11px] text-amber-600">{t('contactTags.willMove', { id: holders.get(c) })} ({c})</p>
              ))}
            </div>
          )}
          <div className="col-span-2 space-y-1">
            <Label>{t('contactTags.addContact.comment')}</Label>
            <Input value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('actions.cancel')}</Button>
          <Button onClick={submit} loading={isLoading}>{t('contactTags.addContact.submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
