'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateAddressMutation } from '../api/addressesApi';
import { toast } from '@/utils/toast';
import { CommentDialog } from '@/components/common/CommentDialog';
import type { SbrAddress } from '@/types';
import { useTranslation } from 'react-i18next';
import {
  ADDRESS_FIELD_LABELS,
  ADDRESS_SOURCE_CODE_OPTIONS,
  isAddressFieldEditable,
} from '../constants';

interface Props {
  address: SbrAddress | null;
  open: boolean;
  onClose: () => void;
  // Optional: fires with the newly-created (SCD2) record after a successful save.
  // Used by the detail page to follow the new record id; the list page omits it.
  onSaved?: (updated: SbrAddress) => void;
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

export function EditAddressModal({ address, open, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Partial<SbrAddress>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [updateAddress, { isLoading }] = useUpdateAddressMutation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (address) {
      setErrors({});
      setForm({
        MUNICIPALITY_ID: address.MUNICIPALITY_ID ?? '',
        ZONE:            address.ZONE ?? '',
        STREET:          address.STREET ?? '',
        BUILDING_NO:     address.BUILDING_NO ?? '',
        UNIT_NO:         address.UNIT_NO ?? '',
        FLOOR_NO:        address.FLOOR_NO ?? '',
        QARS:            address.QARS ?? '',
        ELECTRICITY_NO:  address.ELECTRICITY_NO ?? '',
        LONGITUDE:       address.LONGITUDE ?? '',
        LATITUDE:        address.LATITUDE ?? '',
        SOURCE_CODE:     address.SOURCE_CODE ?? '',
        PRIORITY:        address.PRIORITY,
      });
    }
  }, [address]);

  const handleChange = (field: keyof SbrAddress, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const hasChanges = () => {
    if (!address) return false;
    const normalize = (v: unknown) => (v === null || v === undefined || v === '') ? '' : String(v).trim();
    return Object.entries(form).some(([key, val]) =>
      normalize(val) !== normalize(address[key as keyof SbrAddress])
    );
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

    if (str(form.MUNICIPALITY_ID).length > 20) e.MUNICIPALITY_ID = 'Max 20 characters allowed';
    if (str(form.ZONE).length > 20)            e.ZONE            = 'Max 20 characters allowed';
    if (str(form.STREET).length > 200)         e.STREET          = 'Max 200 characters allowed';
    if (str(form.BUILDING_NO).length > 20)     e.BUILDING_NO     = 'Max 20 characters allowed';
    if (str(form.UNIT_NO).length > 20)         e.UNIT_NO         = 'Max 20 characters allowed';
    if (str(form.FLOOR_NO).length > 20)        e.FLOOR_NO        = 'Max 20 characters allowed';
    if (str(form.QARS).length > 20)            e.QARS            = 'Max 20 characters allowed';
    if (str(form.ELECTRICITY_NO).length > 30)  e.ELECTRICITY_NO  = 'Max 30 characters allowed';
    if (str(form.LONGITUDE).length > 30)       e.LONGITUDE       = 'Max 30 characters allowed';
    if (str(form.LATITUDE).length > 30)        e.LATITUDE        = 'Max 30 characters allowed';

    const priority = form.PRIORITY;
    if (priority !== undefined && priority !== null && Number(priority) < 1) {
      e.PRIORITY = 'Min value is 1';
    }

    // Enum validation for select fields
    if (form.SOURCE_CODE !== null && form.SOURCE_CODE !== undefined && form.SOURCE_CODE !== '' && !ADDRESS_SOURCE_CODE_OPTIONS.includes(String(form.SOURCE_CODE))) {
      e.SOURCE_CODE = `Must be one of [${ADDRESS_SOURCE_CODE_OPTIONS.join(', ')}, or empty]`;
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
    if (!address) return;
    if (!hasChanges()) { toast.info('No changes detected.'); return; }
    if (!validate()) return;
    setShowCommentDialog(true);
  };

  const handleConfirmWithComment = async (comment: string) => {
    if (!address) return;
    // Only send user-editable fields — SOURCE_CODE is not editable and is rejected
    // by the backend, so it must never be included in the payload.
    const editableData = Object.fromEntries(
      Object.entries(form).filter(([key]) => isAddressFieldEditable(key))
    );
    try {
      const res = await updateAddress({ id: address.ID, data: { ...editableData, comment: comment } }).unwrap();
      toast.success('Address updated successfully!');
      setShowCommentDialog(false);
      onClose();
      if (res?.data) onSaved?.(res.data);
    } catch (error) {
      if ((error as { status?: number })?.status === 403) return;
      const msg = (error as { data?: { message?: string } })?.data?.message
        ?? 'Failed to update address. Please try again.';
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
            <DialogTitle>{t('editAddress.title')}</DialogTitle>
          </DialogHeader>

          {/* Error Summary - Outside scroll container to prevent layout shift */}
          {Object.keys(errors).length > 0 && (
            <ErrorSummary errors={errors} onErrorClick={scrollToField} fieldLabels={ADDRESS_FIELD_LABELS} />
          )}

        <div ref={scrollContainerRef} className="grid grid-cols-2 gap-4 py-2 pr-4 max-h-[calc(90vh-180px)] overflow-y-auto">

          <ReadOnlyField label={t('editAddress.fields.sbrId', { lng: 'en' })} value={address?.SBR_ID} />
          <ReadOnlyField label={t('editAddress.fields.recordId', { lng: 'en' })} value={address?.ID} />

          <div className="space-y-1" data-field="MUNICIPALITY_ID">
            <Label>{t('editAddress.fields.municipalityId', { lng: 'en' })}</Label>
            <Input className={inp('MUNICIPALITY_ID')} value={form.MUNICIPALITY_ID ?? ''} onChange={(e) => handleChange('MUNICIPALITY_ID', e.target.value)} />
            <FieldErr msg={err('MUNICIPALITY_ID')} />
          </div>
          <div className="space-y-1" data-field="ZONE">
            <Label>{t('editAddress.fields.zone', { lng: 'en' })}</Label>
            <Input className={inp('ZONE')} value={form.ZONE ?? ''} onChange={(e) => handleChange('ZONE', e.target.value)} />
            <FieldErr msg={err('ZONE')} />
          </div>
          <div className="col-span-2 space-y-1" data-field="STREET">
            <Label>{t('editAddress.fields.street', { lng: 'en' })}</Label>
            <Input className={inp('STREET')} value={form.STREET ?? ''} onChange={(e) => handleChange('STREET', e.target.value)} />
            <FieldErr msg={err('STREET')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editAddress.fields.buildingNo', { lng: 'en' })}</Label>
            <Input className={inp('BUILDING_NO')} value={form.BUILDING_NO ?? ''} onChange={(e) => handleChange('BUILDING_NO', e.target.value)} />
            <FieldErr msg={err('BUILDING_NO')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editAddress.fields.unitNo', { lng: 'en' })}</Label>
            <Input className={inp('UNIT_NO')} value={form.UNIT_NO ?? ''} onChange={(e) => handleChange('UNIT_NO', e.target.value)} />
            <FieldErr msg={err('UNIT_NO')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editAddress.fields.floorNo', { lng: 'en' })}</Label>
            <Input className={inp('FLOOR_NO')} value={form.FLOOR_NO ?? ''} onChange={(e) => handleChange('FLOOR_NO', e.target.value)} />
            <FieldErr msg={err('FLOOR_NO')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editAddress.fields.qars', { lng: 'en' })}</Label>
            <Input className={inp('QARS')} value={form.QARS ?? ''} onChange={(e) => handleChange('QARS', e.target.value)} />
            <FieldErr msg={err('QARS')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editAddress.fields.electricityNo', { lng: 'en' })}</Label>
            <Input className={inp('ELECTRICITY_NO')} value={form.ELECTRICITY_NO ?? ''} onChange={(e) => handleChange('ELECTRICITY_NO', e.target.value)} />
            <FieldErr msg={err('ELECTRICITY_NO')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editAddress.fields.latitude', { lng: 'en' })}</Label>
            <Input className={inp('LATITUDE')} value={form.LATITUDE ?? ''} onChange={(e) => handleChange('LATITUDE', e.target.value)} />
            <FieldErr msg={err('LATITUDE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editAddress.fields.longitude', { lng: 'en' })}</Label>
            <Input className={inp('LONGITUDE')} value={form.LONGITUDE ?? ''} onChange={(e) => handleChange('LONGITUDE', e.target.value)} />
            <FieldErr msg={err('LONGITUDE')} />
          </div>
          <div className="space-y-1" data-field="SOURCE_CODE">
            <Label>{t('editAddress.fields.sourceCode', { lng: 'en' })}</Label>
            <Select
              value={form.SOURCE_CODE ? String(form.SOURCE_CODE) : '__none__'}
              onValueChange={(v) => handleChange('SOURCE_CODE', v === '__none__' ? '' : v)}
              disabled={!isAddressFieldEditable('SOURCE_CODE')}
            >
              <SelectTrigger className={`w-full shadow-none ${err('SOURCE_CODE') ? 'border-red-400' : ''} ${!isAddressFieldEditable('SOURCE_CODE') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>
                {ADDRESS_SOURCE_CODE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldErr msg={err('SOURCE_CODE')} />
          </div>
          <div className="space-y-1" data-field="PRIORITY">
            <Label>{t('editAddress.fields.priority', { lng: 'en' })}</Label>
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-1">{t('editAddress.sections.metadata', { lng: 'en' })}</p>
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 text-xs">{t('editAddress.fields.validFrom', { lng: 'en' })}</label>
            <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed select-none">
              {address?.VALID_FROM ? new Date(address.VALID_FROM).toLocaleDateString('en-GB') : '—'}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 text-xs">{t('editAddress.fields.validTo', { lng: 'en' })}</label>
            <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed select-none">
              {address?.VALID_TO ? new Date(address.VALID_TO).toLocaleDateString('en-GB') : '—'}
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
