'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateContactMutation } from '../api/contactsApi';
import { toast } from '@/utils/toast';
import { CommentDialog } from '@/components/common/CommentDialog';
import type { SbrContact } from '@/types';
import { useTranslation } from 'react-i18next';
import {
  CONTACT_FIELD_LABELS,
  CONTACT_ROLE_OPTIONS,
  CONTACT_SOURCE_CODE_OPTIONS,
  isContactFieldEditable,
} from '../constants';

interface Props {
  contact: SbrContact | null;
  open: boolean;
  onClose: () => void;
  // Optional: fires with the newly-created (SCD2) record after a successful save.
  // Used by the detail page to follow the new record id; the list page omits it.
  onSaved?: (updated: SbrContact) => void;
}

function ReadOnlyField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="space-y-1">
      <Label className="text-slate-500">{label}</Label>
      <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed select-none">
        {value ?? '—'}
      </div>
    </div>
  );
}

function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-500 mt-0.5">{msg}</p> : null;
}

function ErrorSummary({ errors, onErrorClick, fieldLabels }: { errors: Record<string, string>; onErrorClick: (field: string) => void; fieldLabels: Record<string, string> }) {
  const errorCount = Object.keys(errors).length;

  return (
    <div className="sticky top-0 z-20 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-2 mb-2">
        <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-red-700">!</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900">
            {errorCount} validation {errorCount === 1 ? 'error' : 'errors'} found
          </p>
          <p className="text-xs text-red-700 mt-0.5">Please correct the errors below before saving</p>
        </div>
      </div>
      <ul className="space-y-1.5 ml-7">
        {Object.entries(errors).map(([field, message]) => (
          <li key={field}>
            <button
              type="button"
              onClick={() => onErrorClick(field)}
              className="text-xs text-red-700 hover:text-red-900 hover:underline text-left font-medium transition-colors"
            >
              • {fieldLabels[field] || field}: {message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EditContactModal({ contact, open, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Partial<SbrContact>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [updateContact, { isLoading }] = useUpdateContactMutation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contact) {
      setErrors({});
      setForm({
        CONTACT_NAME: contact.CONTACT_NAME ?? '',
        PHONE:        contact.PHONE ?? '',
        MOBILE:       contact.MOBILE ?? '',
        EMAIL:        contact.EMAIL ?? '',
        FAX:          contact.FAX ?? '',
        PO_BOX:       contact.PO_BOX ?? '',
        WEBSITE:      contact.WEBSITE ?? '',
        ROLE:         contact.ROLE ?? '',
        SOURCE_CODE:  contact.SOURCE_CODE ?? '',
        PRIORITY:     contact.PRIORITY,
      });
    }
  }, [contact]);

  const handleChange = (field: keyof SbrContact, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const hasChanges = () => {
    if (!contact) return false;
    const normalize = (v: unknown) => (v === null || v === undefined || v === '') ? '' : String(v).trim();
    return Object.entries(form).some(([key, val]) =>
      normalize(val) !== normalize(contact[key as keyof SbrContact])
    );
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

    const name = str(form.CONTACT_NAME).trim();
    if (name && name.length < 2) e.CONTACT_NAME = 'Min 2 characters required';
    if (name.length > 200) e.CONTACT_NAME = 'Max 200 characters allowed';

    const email = str(form.EMAIL).trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.EMAIL = 'Invalid email format';
    if (email.length > 200) e.EMAIL = 'Max 200 characters allowed';

    if (str(form.PHONE).length > 50) e.PHONE = 'Max 50 characters allowed';
    if (str(form.MOBILE).length > 50) e.MOBILE = 'Max 50 characters allowed';
    if (str(form.FAX).length > 50) e.FAX = 'Max 50 characters allowed';
    if (str(form.PO_BOX).length > 20) e.PO_BOX = 'Max 20 characters allowed';
    if (str(form.WEBSITE).length > 500) e.WEBSITE = 'Max 500 characters allowed';

    const priority = form.PRIORITY;
    if (priority !== undefined && priority !== null && Number(priority) < 1) {
      e.PRIORITY = 'Min value is 1';
    }

    // Enum validations for select fields
    if (form.ROLE !== null && form.ROLE !== undefined && form.ROLE !== '' && !CONTACT_ROLE_OPTIONS.includes(String(form.ROLE))) {
      e.ROLE = `Must be one of [${CONTACT_ROLE_OPTIONS.join(', ')}, or empty]`;
    }
    if (form.SOURCE_CODE !== null && form.SOURCE_CODE !== undefined && form.SOURCE_CODE !== '' && !CONTACT_SOURCE_CODE_OPTIONS.includes(String(form.SOURCE_CODE))) {
      e.SOURCE_CODE = `Must be one of [${CONTACT_SOURCE_CODE_OPTIONS.join(', ')}, or empty]`;
    }

    setErrors(e);

    // Auto-scroll to first error field
    if (Object.keys(e).length > 0) {
      const firstErrorField = Object.keys(e)[0];
      setTimeout(() => {
        const element = scrollContainerRef.current?.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          (element as HTMLInputElement | HTMLSelectElement)?.focus();
        }
      }, 0);
    }

    return Object.keys(e).length === 0;
  };

  const scrollToField = (fieldName: string) => {
    const element = scrollContainerRef.current?.querySelector(`[data-field="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleSubmit = () => {
    if (!contact) return;
    if (!hasChanges()) { toast.info('No changes detected.'); return; }
    if (!validate()) return;
    setShowCommentDialog(true);
  };

  const handleConfirmWithComment = async (comment: string) => {
    if (!contact) return;
    // Only send user-editable fields — ROLE / SOURCE_CODE are not editable and are
    // rejected by the backend, so they must never be included in the payload.
    const editableData = Object.fromEntries(
      Object.entries(form).filter(([key]) => isContactFieldEditable(key))
    );
    try {
      const res = await updateContact({ id: contact.ID, data: { ...editableData, comment } }).unwrap();
      toast.success('Contact updated successfully!');
      setShowCommentDialog(false);
      onClose();
      if (res?.data) onSaved?.(res.data);
    } catch (error) {
      if ((error as { status?: number })?.status === 403) return;
      const msg = (error as { data?: { message?: string } })?.data?.message
        ?? 'Failed to update contact. Please try again.';
      const parts = msg.split(/[.;]/).map((s) => s.trim()).filter(Boolean);
      const newErrs: Record<string, string> = {};
      parts.forEach((part) => {
        const matched = Object.keys(form).find((f) => part.toUpperCase().includes(f.toUpperCase()));
        if (matched) newErrs[matched] = part;
      });
      if (Object.keys(newErrs).length > 0) setErrors((prev) => ({ ...prev, ...newErrs }));
      toast.error(msg);
    }
  };

  const err = (f: string) => errors[f];
  const inp = (f: string) => err(f)
    ? 'border-red-400 focus-visible:border-2 focus-visible:border-red-500 focus-visible:ring-0'
    : 'focus-visible:border-2 focus-visible:border-[#A71D3A]/40 focus-visible:ring-0';

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editContact.title')}</DialogTitle>
          </DialogHeader>

          {/* Error Summary - Outside scroll container to prevent layout shift */}
          {Object.keys(errors).length > 0 && (
            <ErrorSummary errors={errors} onErrorClick={scrollToField} fieldLabels={CONTACT_FIELD_LABELS} />
          )}

        <div ref={scrollContainerRef} className="grid grid-cols-2 gap-4 py-2 pr-4 max-h-[calc(90vh-180px)] overflow-y-auto">

          <ReadOnlyField label={t('editContact.fields.sbrId', { lng: 'en' })} value={contact?.SBR_ID} />
          <ReadOnlyField label={t('editContact.fields.recordId', { lng: 'en' })} value={contact?.ID} />

          <div className="col-span-2 space-y-1" data-field="CONTACT_NAME">
            <Label>{t('editContact.fields.contactName', { lng: 'en' })}</Label>
            <Input className={inp('CONTACT_NAME')} value={form.CONTACT_NAME ?? ''} onChange={(e) => handleChange('CONTACT_NAME', e.target.value)} />
            <FieldErr msg={err('CONTACT_NAME')} />
          </div>
          <div className="space-y-1" data-field="PHONE">
            <Label>{t('editContact.fields.phone', { lng: 'en' })}</Label>
            <Input className={inp('PHONE')} value={form.PHONE ?? ''} onChange={(e) => handleChange('PHONE', e.target.value)} />
            <FieldErr msg={err('PHONE')} />
          </div>
          <div className="space-y-1" data-field="MOBILE">
            <Label>{t('editContact.fields.mobile', { lng: 'en' })}</Label>
            <Input className={inp('MOBILE')} value={form.MOBILE ?? ''} onChange={(e) => handleChange('MOBILE', e.target.value)} />
            <FieldErr msg={err('MOBILE')} />
          </div>
          <div className="col-span-2 space-y-1" data-field="EMAIL">
            <Label>{t('editContact.fields.email', { lng: 'en' })}</Label>
            <Input type="email" className={inp('EMAIL')} value={form.EMAIL ?? ''} onChange={(e) => handleChange('EMAIL', e.target.value)} />
            <FieldErr msg={err('EMAIL')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editContact.fields.fax', { lng: 'en' })}</Label>
            <Input className={inp('FAX')} value={form.FAX ?? ''} onChange={(e) => handleChange('FAX', e.target.value)} />
            <FieldErr msg={err('FAX')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editContact.fields.poBox', { lng: 'en' })}</Label>
            <Input className={inp('PO_BOX')} value={form.PO_BOX ?? ''} onChange={(e) => handleChange('PO_BOX', e.target.value)} />
            <FieldErr msg={err('PO_BOX')} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>{t('editContact.fields.website', { lng: 'en' })}</Label>
            <Input className={inp('WEBSITE')} value={form.WEBSITE ?? ''} onChange={(e) => handleChange('WEBSITE', e.target.value)} />
            <FieldErr msg={err('WEBSITE')} />
          </div>
          <div className="space-y-1" data-field="ROLE">
            <Label>{t('editContact.fields.role', { lng: 'en' })}</Label>
            <Select
              value={form.ROLE ? String(form.ROLE) : '__none__'}
              onValueChange={(v) => handleChange('ROLE', v === '__none__' ? '' : v)}
              disabled={!isContactFieldEditable('ROLE')}
            >
              <SelectTrigger className={`w-full shadow-none ${err('ROLE') ? 'border-red-400' : ''} ${!isContactFieldEditable('ROLE') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>
                {CONTACT_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldErr msg={err('ROLE')} />
          </div>
          <div className="space-y-1" data-field="SOURCE_CODE">
            <Label>{t('editContact.fields.sourceCode', { lng: 'en' })}</Label>
            <Select
              value={form.SOURCE_CODE ? String(form.SOURCE_CODE) : '__none__'}
              onValueChange={(v) => handleChange('SOURCE_CODE', v === '__none__' ? '' : v)}
              disabled={!isContactFieldEditable('SOURCE_CODE')}
            >
              <SelectTrigger className={`w-full shadow-none ${err('SOURCE_CODE') ? 'border-red-400' : ''} ${!isContactFieldEditable('SOURCE_CODE') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>
                {CONTACT_SOURCE_CODE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldErr msg={err('SOURCE_CODE')} />
          </div>
          <div className="space-y-1" data-field="PRIORITY">
            <Label>{t('editContact.fields.priority', { lng: 'en' })}</Label>
            <Input
              type="number"
              className={inp('PRIORITY')}
              value={form.PRIORITY ?? ''}
              onChange={(e) => {
                setForm((p) => ({ ...p, PRIORITY: Number(e.target.value) }));
                if (errors.PRIORITY) setErrors((er) => { const n = { ...er }; delete n.PRIORITY; return n; });
              }}
            />
            <FieldErr msg={err('PRIORITY')} />
          </div>

          <div className="col-span-2 pt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-1">{t('editContact.sections.metadata', { lng: 'en' })}</p>
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 text-xs">{t('editContact.fields.validFrom', { lng: 'en' })}</label>
            <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed select-none">
              {contact?.VALID_FROM ? new Date(contact.VALID_FROM).toLocaleDateString('en-GB') : '—'}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 text-xs">{t('editContact.fields.validTo', { lng: 'en' })}</label>
            <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed select-none">
              {contact?.VALID_TO ? new Date(contact.VALID_TO).toLocaleDateString('en-GB') : '—'}
            </div>
          </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('actions.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={isLoading} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">{t('actions.saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CommentDialog
        open={showCommentDialog}
        isLoading={isLoading}
        onConfirm={handleConfirmWithComment}
        onCancel={() => setShowCommentDialog(false)}
      />
    </>
  );
}
