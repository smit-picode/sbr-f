'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateEstablishmentMutation } from '../api/establishmentsApi';
import { toast } from '@/utils/toast';
import { CommentDialog } from '@/components/common/CommentDialog';
import type { SbrEstablishment } from '@/types';
import { useTranslation } from 'react-i18next';
import {
  ESTABLISHMENTS_FIELD_LABELS,
  EST_STATUS_OPTIONS,
  SECTOR_ID_OPTIONS,
  MAIN_BRANCH_FLG_OPTIONS,
  ESTABLISHMENTS_SOURCE_CODE_OPTIONS,
  ESTABLISHMENTS_MAX_LENGTHS,
  isEstablishmentFieldEditable,
} from '../constants';

interface Props {
  frame: SbrEstablishment | null;
  open: boolean;
  onClose: () => void;
}

function ReadOnlyField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">{label}</Label>
      <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed select-none min-h-[38px]">
        {value ?? '—'}
      </div>
    </div>
  );
}

function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-500 mt-0.5">{msg}</p> : null;
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="col-span-2 pt-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-1">
        {title}
      </p>
    </div>
  );
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

type FormState = Omit<Partial<SbrEstablishment>, 'ID' | 'SBR_ID' | 'VALID_FROM' | 'VALID_TO'>;

export function EditEstablishmentModal({ frame, open, onClose }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [updateEstablishment, { isLoading }] = useUpdateEstablishmentMutation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (frame) {
      setErrors({});
      setForm({
        // Names
        NAME_ENU:                   frame.NAME_ENU ?? '',
        NAME_ARA:                   frame.NAME_ARA ?? '',
        NAME_ENU_SOURCE:            frame.NAME_ENU_SOURCE ?? '',
        NAME_ARA_SOURCE:            frame.NAME_ARA_SOURCE ?? '',
        TRADE_NAME_ENU:             frame.TRADE_NAME_ENU ?? '',
        TRADE_NAME_ARA:             frame.TRADE_NAME_ARA ?? '',
        TRADE_NAME_ENU_SOURCE:      frame.TRADE_NAME_ENU_SOURCE ?? '',
        TRADE_NAME_ARA_SOURCE:      frame.TRADE_NAME_ARA_SOURCE ?? '',
        NPC_NAME_ENU:               frame.NPC_NAME_ENU ?? '',
        NPC_NAME_ARA:               frame.NPC_NAME_ARA ?? '',
        NPC_NAME_ENU_SOURCE:        frame.NPC_NAME_ENU_SOURCE ?? '',
        NPC_NAME_ARA_SOURCE:        frame.NPC_NAME_ARA_SOURCE ?? '',
        // Status & Classification
        EST_STATUS:                 frame.EST_STATUS ?? null,
        EST_STATUS_SOURCE:          frame.EST_STATUS_SOURCE ?? '',
        EST_STATUS_CATEGORY:        frame.EST_STATUS_CATEGORY ?? '',
        EST_STATUS_CATEGORY_SOURCE: frame.EST_STATUS_CATEGORY_SOURCE ?? '',
        LEGAL_TYPE:                 frame.LEGAL_TYPE ?? '',
        LEGAL_TYPE_SOURCE:          frame.LEGAL_TYPE_SOURCE ?? '',
        SECTOR_ID:                  frame.SECTOR_ID ?? '',
        SECTOR_ID_SOURCE:           frame.SECTOR_ID_SOURCE ?? '',
        ISIC_CODE:                  frame.ISIC_CODE ?? '',
        ISIC_CODE_SOURCE:           frame.ISIC_CODE_SOURCE ?? '',
        EMPLOYMENT_COUNT:           frame.EMPLOYMENT_COUNT ?? undefined,
        EMPLOYMENT_COUNT_SOURCE:    frame.EMPLOYMENT_COUNT_SOURCE ?? '',
        MAIN_BRANCH_FLG:            frame.MAIN_BRANCH_FLG ?? '',
        MAIN_BRANCH_FLG_SOURCE:     frame.MAIN_BRANCH_FLG_SOURCE ?? '',
        MAIN_BRANCH_SBR_ID:         frame.MAIN_BRANCH_SBR_ID ?? undefined,
        MAIN_BRANCH_SBR_ID_SOURCE:  frame.MAIN_BRANCH_SBR_ID_SOURCE ?? '',
        HOLDING_COMPANY_FLG:        frame.HOLDING_COMPANY_FLG ?? '',
        HOLDING_COMPANY_FLG_SOURCE: frame.HOLDING_COMPANY_FLG_SOURCE ?? '',
        SOURCE_CODE:                frame.SOURCE_CODE ?? '',
        // Registration numbers
        MOCI_ORG_ID:                frame.MOCI_ORG_ID ?? '',
        MOCI_CR_NUM:                frame.MOCI_CR_NUM ?? '',
        MOCI_CP_NUM:                frame.MOCI_CP_NUM ?? '',
        QFC_NUMBER:                 frame.QFC_NUMBER ?? '',
        QFZ_SOURCE_ID:              frame.QFZ_SOURCE_ID ?? '',
        QSTP_REG_NUM:               frame.QSTP_REG_NUM ?? '',
        QSTP_TAX_REG_NUM:           frame.QSTP_TAX_REG_NUM ?? '',
        QSTP_PARENT_REG_NUM:        frame.QSTP_PARENT_REG_NUM ?? '',
        FARM_NO:                    frame.FARM_NO ?? '',
        EID:                        frame.EID ?? '',
        EID_SOURCE:                 frame.EID_SOURCE ?? '',
        EID_ORIG:                   frame.EID_ORIG ?? '',
        EID_ORIG_SOURCE:            frame.EID_ORIG_SOURCE ?? '',
        // Dates
        CR_ISSUE_DATE:              frame.CR_ISSUE_DATE ?? '',
        CR_EXPIRY_DATE:             frame.CR_EXPIRY_DATE ?? '',
        CR_CANCEL_DATE:             frame.CR_CANCEL_DATE ?? '',
        CP_ISSUE_DATE:              frame.CP_ISSUE_DATE ?? '',
        CP_END_DATE:                frame.CP_END_DATE ?? '',
        CP_CANCEL_DATE:             frame.CP_CANCEL_DATE ?? '',
        REG_DATE:                   frame.REG_DATE ?? '',
        REG_EXPIRY_DATE:            frame.REG_EXPIRY_DATE ?? '',
        REG_CANCEL_DATE:            frame.REG_CANCEL_DATE ?? '',
      });
    }
  }, [frame]);

  // Whether a field is user-editable (per the "Is Editable" spec)
  const ed = (field: string): boolean => isEstablishmentFieldEditable(field);

  const set = (field: keyof FormState, value: string | number | null) => {
    if (!ed(field as string)) return; // locked field — ignore edits
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) setErrors((e) => { const n = { ...e }; delete n[field as string]; return n; });
  };


  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

    // String length validations
    Object.entries(ESTABLISHMENTS_MAX_LENGTHS).forEach(([field, max]) => {
      if (str(form[field as keyof FormState]).length > max) {
        e[field] = `Max ${max} character${max === 1 ? '' : 's'} allowed`;
      }
    });

    // Numeric validations
    if (form.EMPLOYMENT_COUNT != null && Number(form.EMPLOYMENT_COUNT) < 0) {
      e.EMPLOYMENT_COUNT = 'Must be 0 or greater';
    }
    if (form.MAIN_BRANCH_SBR_ID != null && !Number.isInteger(Number(form.MAIN_BRANCH_SBR_ID))) {
      e.MAIN_BRANCH_SBR_ID = 'Must be an integer';
    }

    // Enum validations for select fields
    if (form.EST_STATUS !== null && form.EST_STATUS !== undefined && !EST_STATUS_OPTIONS.includes(String(form.EST_STATUS))) {
      e.EST_STATUS = `Must be one of [${EST_STATUS_OPTIONS.filter(v => v !== null).join(', ')}, or empty]`;
    }
    if (form.SECTOR_ID !== null && form.SECTOR_ID !== undefined && !SECTOR_ID_OPTIONS.includes(String(form.SECTOR_ID))) {
      e.SECTOR_ID = `Must be one of [${SECTOR_ID_OPTIONS.join(', ')}, or empty]`;
    }
    if (form.MAIN_BRANCH_FLG !== null && form.MAIN_BRANCH_FLG !== undefined && form.MAIN_BRANCH_FLG !== '' && !MAIN_BRANCH_FLG_OPTIONS.includes(String(form.MAIN_BRANCH_FLG))) {
      e.MAIN_BRANCH_FLG = `Must be one of [${MAIN_BRANCH_FLG_OPTIONS.join(', ')}, or empty]`;
    }

    // Locked / read-only fields are never sent to the backend, so their values must not raise
    // blocking validation errors.
    const editableErrors: Record<string, string> = {};
    for (const [field, msg] of Object.entries(e)) {
      if (ed(field)) editableErrors[field] = msg;
    }

    setErrors(editableErrors);

    // Auto-scroll to first error field
    if (Object.keys(editableErrors).length > 0) {
      const firstErrorField = Object.keys(editableErrors)[0];
      setTimeout(() => {
        const element = scrollContainerRef.current?.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          (element as HTMLInputElement | HTMLSelectElement)?.focus();
        }
      }, 0);
    }

    return Object.keys(editableErrors).length === 0;
  };

  const scrollToField = (fieldName: string) => {
    const element = scrollContainerRef.current?.querySelector(`[data-field="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const hasChanges = () => {
    if (!frame) return false;
    const normalize = (v: unknown) => (v === null || v === undefined || v === '') ? '' : String(v).trim();
    return Object.entries(form).some(([key, val]) =>
      normalize(val) !== normalize(frame[key as keyof SbrEstablishment])
    );
  };

  const err = (f: string) => errors[f];
  const inp = (f: string) => {
    if (!ed(f)) return 'bg-slate-50 text-slate-400 cursor-not-allowed pointer-events-none';
    return err(f)
      ? 'border-red-400 focus-visible:border-2 focus-visible:border-red-500 focus-visible:ring-0'
      : 'focus-visible:border-2 focus-visible:border-[#A71D3A]/40 focus-visible:ring-0';
  };

  const handleSubmit = () => {
    if (!frame) return;
    if (!hasChanges()) { toast.info(t('common.noChangesDetected', { defaultValue: 'No changes detected.' })); return; }
    if (!validate()) return;
    setShowCommentDialog(true);
  };

  const handleConfirmWithComment = async (comment: string) => {
    if (!frame) return;
    // Only send user-editable fields — locked fields are rejected by the backend.
    const editableData = Object.fromEntries(
      Object.entries(form).filter(([key]) => ed(key))
    );
    try {
      await updateEstablishment({ id: frame.ID, data: { ...editableData, comment } }).unwrap();
      toast.success(t('common.changeRequestSubmitted', { defaultValue: 'Change request submitted for approval.' }));
      setShowCommentDialog(false);
      onClose();
    } catch (error) {
      if ((error as { status?: number })?.status === 403) return;
      const msg = (error as { data?: { message?: string } })?.data?.message
        ?? t('editEstablishment.updateError', { defaultValue: 'Failed to update establishment. Please try again.' });
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

  const sel = (field: keyof FormState) => String(form[field] ?? '');

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editEstablishment.title')}</DialogTitle>
          </DialogHeader>

          {/* Error Summary - Outside scroll container to prevent layout shift */}
          {Object.keys(errors).length > 0 && (
            <ErrorSummary errors={errors} onErrorClick={scrollToField} fieldLabels={ESTABLISHMENTS_FIELD_LABELS} />
          )}

          <div ref={scrollContainerRef} className="grid grid-cols-2 gap-4 py-2 pr-4 max-h-[calc(90vh-180px)] overflow-y-auto">

          {/* Identifiers (read-only) */}
          <SectionDivider title={t('editEstablishment.sections.identifiers')} />
          <ReadOnlyField label={t('editEstablishment.fields.sbrId')} value={frame?.SBR_ID} />
          <ReadOnlyField label={t('editEstablishment.fields.recordId')} value={frame?.ID} />

          {/* Names */}
          <SectionDivider title={t('editEstablishment.sections.names')} />
          <div className="space-y-1" data-field="NAME_ENU">
            <Label>{t('editEstablishment.fields.nameEnu')}</Label>
            <Input className={inp('NAME_ENU')} value={sel('NAME_ENU')} onChange={(e) => set('NAME_ENU', e.target.value)} />
            <FieldErr msg={err('NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.nameAra')}</Label>
            <Input dir="rtl" className={inp('NAME_ARA')} value={sel('NAME_ARA')} onChange={(e) => set('NAME_ARA', e.target.value)} />
            <FieldErr msg={err('NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.nameEnuSource')}</Label>
            <Input className={inp('NAME_ENU_SOURCE')} value={sel('NAME_ENU_SOURCE')} onChange={(e) => set('NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.nameAraSource')}</Label>
            <Input className={inp('NAME_ARA_SOURCE')} value={sel('NAME_ARA_SOURCE')} onChange={(e) => set('NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('NAME_ARA_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.tradeNameEnu')}</Label>
            <Input className={inp('TRADE_NAME_ENU')} value={sel('TRADE_NAME_ENU')} onChange={(e) => set('TRADE_NAME_ENU', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.tradeNameAra')}</Label>
            <Input dir="rtl" className={inp('TRADE_NAME_ARA')} value={sel('TRADE_NAME_ARA')} onChange={(e) => set('TRADE_NAME_ARA', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.tradeNameEnuSource')}</Label>
            <Input className={inp('TRADE_NAME_ENU_SOURCE')} value={sel('TRADE_NAME_ENU_SOURCE')} onChange={(e) => set('TRADE_NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.tradeNameAraSource')}</Label>
            <Input className={inp('TRADE_NAME_ARA_SOURCE')} value={sel('TRADE_NAME_ARA_SOURCE')} onChange={(e) => set('TRADE_NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ARA_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.npcNameEnu')}</Label>
            <Input className={inp('NPC_NAME_ENU')} value={sel('NPC_NAME_ENU')} onChange={(e) => set('NPC_NAME_ENU', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.npcNameAra')}</Label>
            <Input dir="rtl" className={inp('NPC_NAME_ARA')} value={sel('NPC_NAME_ARA')} onChange={(e) => set('NPC_NAME_ARA', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.npcNameEnuSource')}</Label>
            <Input className={inp('NPC_NAME_ENU_SOURCE')} value={sel('NPC_NAME_ENU_SOURCE')} onChange={(e) => set('NPC_NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.npcNameAraSource')}</Label>
            <Input className={inp('NPC_NAME_ARA_SOURCE')} value={sel('NPC_NAME_ARA_SOURCE')} onChange={(e) => set('NPC_NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ARA_SOURCE')} />
          </div>

          {/* Status & Classification */}
          <SectionDivider title={t('editEstablishment.sections.statusClassification')} />
          <div className="space-y-1" data-field="EST_STATUS">
            <Label>{t('editEstablishment.fields.estStatus')}</Label>
            <Select value={sel('EST_STATUS') || '__none__'} onValueChange={(v) => set('EST_STATUS', v === '__none__' ? '' : v)}>
              <SelectTrigger className={`w-full shadow-none ${err('EST_STATUS') ? 'border-red-400' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <FieldErr msg={err('EST_STATUS')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.estStatusSource')}</Label>
            <Input className={inp('EST_STATUS_SOURCE')} value={sel('EST_STATUS_SOURCE')} onChange={(e) => set('EST_STATUS_SOURCE', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.estStatusCategory')}</Label>
            <Input className={inp('EST_STATUS_CATEGORY')} value={sel('EST_STATUS_CATEGORY')} onChange={(e) => set('EST_STATUS_CATEGORY', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_CATEGORY')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.estStatusCategorySource')}</Label>
            <Input className={inp('EST_STATUS_CATEGORY_SOURCE')} value={sel('EST_STATUS_CATEGORY_SOURCE')} onChange={(e) => set('EST_STATUS_CATEGORY_SOURCE', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_CATEGORY_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.legalType')}</Label>
            <Input className={inp('LEGAL_TYPE')} value={sel('LEGAL_TYPE')} onChange={(e) => set('LEGAL_TYPE', e.target.value)} />
            <FieldErr msg={err('LEGAL_TYPE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.legalTypeSource')}</Label>
            <Input className={inp('LEGAL_TYPE_SOURCE')} value={sel('LEGAL_TYPE_SOURCE')} onChange={(e) => set('LEGAL_TYPE_SOURCE', e.target.value)} />
            <FieldErr msg={err('LEGAL_TYPE_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="SECTOR_ID">
            <Label>{t('editEstablishment.fields.sector')}</Label>
            <Select value={sel('SECTOR_ID') || '__none__'} onValueChange={(v) => set('SECTOR_ID', v === '__none__' ? '' : v)}>
              <SelectTrigger className={`w-full shadow-none ${err('SECTOR_ID') ? 'border-red-400' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Mixed-Private">Mixed-Private</SelectItem>
                <SelectItem value="Mixed-Government">Mixed-Government</SelectItem>
              </SelectContent>
            </Select>
            <FieldErr msg={err('SECTOR_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.sectorSource')}</Label>
            <Input className={inp('SECTOR_ID_SOURCE')} value={sel('SECTOR_ID_SOURCE')} onChange={(e) => set('SECTOR_ID_SOURCE', e.target.value)} />
            <FieldErr msg={err('SECTOR_ID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.isicCode')}</Label>
            <Input className={inp('ISIC_CODE')} value={sel('ISIC_CODE')} onChange={(e) => set('ISIC_CODE', e.target.value)} />
            <FieldErr msg={err('ISIC_CODE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.isicCodeSource')}</Label>
            <Input className={inp('ISIC_CODE_SOURCE')} value={sel('ISIC_CODE_SOURCE')} onChange={(e) => set('ISIC_CODE_SOURCE', e.target.value)} />
            <FieldErr msg={err('ISIC_CODE_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="EMPLOYMENT_COUNT">
            <Label>{t('editEstablishment.fields.employmentCount')}</Label>
            <Input type="number" className={inp('EMPLOYMENT_COUNT')} value={form.EMPLOYMENT_COUNT ?? ''} onChange={(e) => set('EMPLOYMENT_COUNT', e.target.value ? Number(e.target.value) : null)} />
            <FieldErr msg={err('EMPLOYMENT_COUNT')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.employmentCountSource')}</Label>
            <Input className={inp('EMPLOYMENT_COUNT_SOURCE')} value={sel('EMPLOYMENT_COUNT_SOURCE')} onChange={(e) => set('EMPLOYMENT_COUNT_SOURCE', e.target.value)} />
            <FieldErr msg={err('EMPLOYMENT_COUNT_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_FLG">
            <Label>{t('editEstablishment.fields.mainBranchFlg')}</Label>
            <Select value={sel('MAIN_BRANCH_FLG') || '__none__'} onValueChange={(v) => set('MAIN_BRANCH_FLG', v === '__none__' ? '' : v)} disabled={!ed('MAIN_BRANCH_FLG')}>
              <SelectTrigger className={`w-full shadow-none ${err('MAIN_BRANCH_FLG') ? 'border-red-400' : ''} ${!ed('MAIN_BRANCH_FLG') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>
                <SelectItem value="MAIN">MAIN</SelectItem>
                <SelectItem value="BRANCH">BRANCH</SelectItem>
              </SelectContent>
            </Select>
            <FieldErr msg={err('MAIN_BRANCH_FLG')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_SBR_ID">
            <Label>{t('editEstablishment.fields.mainBranchSbrId')}</Label>
            <Input type="number" className={inp('MAIN_BRANCH_SBR_ID')} value={form.MAIN_BRANCH_SBR_ID ?? ''} onChange={(e) => set('MAIN_BRANCH_SBR_ID', e.target.value ? Number(e.target.value) : null)} />
            <FieldErr msg={err('MAIN_BRANCH_SBR_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.mainBranchFlgSource')}</Label>
            <Input className={inp('MAIN_BRANCH_FLG_SOURCE')} value={sel('MAIN_BRANCH_FLG_SOURCE')} onChange={(e) => set('MAIN_BRANCH_FLG_SOURCE', e.target.value)} />
            <FieldErr msg={err('MAIN_BRANCH_FLG_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_SBR_ID_SOURCE">
            <Label>{t('editEstablishment.fields.mainBranchSbrIdSource')}</Label>
            <Input className={inp('MAIN_BRANCH_SBR_ID_SOURCE')} value={sel('MAIN_BRANCH_SBR_ID_SOURCE')} onChange={(e) => set('MAIN_BRANCH_SBR_ID_SOURCE', e.target.value)} />
            <FieldErr msg={err('MAIN_BRANCH_SBR_ID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.holdingCompanyFlg')}</Label>
            <Input className={inp('HOLDING_COMPANY_FLG')} value={sel('HOLDING_COMPANY_FLG')} onChange={(e) => set('HOLDING_COMPANY_FLG', e.target.value)} />
            <FieldErr msg={err('HOLDING_COMPANY_FLG')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.holdingCompanyFlgSource')}</Label>
            <Input className={inp('HOLDING_COMPANY_FLG_SOURCE')} value={sel('HOLDING_COMPANY_FLG_SOURCE')} onChange={(e) => set('HOLDING_COMPANY_FLG_SOURCE', e.target.value)} />
            <FieldErr msg={err('HOLDING_COMPANY_FLG_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.sourceCode')}</Label>
            <Select value={sel('SOURCE_CODE') || '__none__'} onValueChange={(v) => set('SOURCE_CODE', v === '__none__' ? '' : v)} disabled={!ed('SOURCE_CODE')}>
              <SelectTrigger className={`w-full shadow-none ${err('SOURCE_CODE') ? 'border-red-400' : ''} ${!ed('SOURCE_CODE') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>
                {ESTABLISHMENTS_SOURCE_CODE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldErr msg={err('SOURCE_CODE')} />
          </div>

          {/* Registration Numbers */}
          <SectionDivider title={t('editEstablishment.sections.registrationNumbers')} />
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.mociOrgId')}</Label>
            <Input className={inp('MOCI_ORG_ID')} value={sel('MOCI_ORG_ID')} onChange={(e) => set('MOCI_ORG_ID', e.target.value)} />
            <FieldErr msg={err('MOCI_ORG_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.mociCrNum')}</Label>
            <Input className={inp('MOCI_CR_NUM')} value={sel('MOCI_CR_NUM')} onChange={(e) => set('MOCI_CR_NUM', e.target.value)} />
            <FieldErr msg={err('MOCI_CR_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.mociCpNum')}</Label>
            <Input className={inp('MOCI_CP_NUM')} value={sel('MOCI_CP_NUM')} onChange={(e) => set('MOCI_CP_NUM', e.target.value)} />
            <FieldErr msg={err('MOCI_CP_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qfcNumber')}</Label>
            <Input className={inp('QFC_NUMBER')} value={sel('QFC_NUMBER')} onChange={(e) => set('QFC_NUMBER', e.target.value)} />
            <FieldErr msg={err('QFC_NUMBER')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qfzSourceId')}</Label>
            <Input className={inp('QFZ_SOURCE_ID')} value={sel('QFZ_SOURCE_ID')} onChange={(e) => set('QFZ_SOURCE_ID', e.target.value)} />
            <FieldErr msg={err('QFZ_SOURCE_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qstpRegNum')}</Label>
            <Input className={inp('QSTP_REG_NUM')} value={sel('QSTP_REG_NUM')} onChange={(e) => set('QSTP_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qstpTaxRegNum')}</Label>
            <Input className={inp('QSTP_TAX_REG_NUM')} value={sel('QSTP_TAX_REG_NUM')} onChange={(e) => set('QSTP_TAX_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_TAX_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qstpParentRegNum')}</Label>
            <Input className={inp('QSTP_PARENT_REG_NUM')} value={sel('QSTP_PARENT_REG_NUM')} onChange={(e) => set('QSTP_PARENT_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_PARENT_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.farmNo')}</Label>
            <Input className={inp('FARM_NO')} value={sel('FARM_NO')} onChange={(e) => set('FARM_NO', e.target.value)} />
            <FieldErr msg={err('FARM_NO')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.eid')}</Label>
            <Input className={inp('EID')} value={sel('EID')} onChange={(e) => set('EID', e.target.value)} />
            <FieldErr msg={err('EID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.eidSource')}</Label>
            <Input className={inp('EID_SOURCE')} value={sel('EID_SOURCE')} onChange={(e) => set('EID_SOURCE', e.target.value)} />
            <FieldErr msg={err('EID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.eidOrig')}</Label>
            <Input className={inp('EID_ORIG')} value={sel('EID_ORIG')} onChange={(e) => set('EID_ORIG', e.target.value)} />
            <FieldErr msg={err('EID_ORIG')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.eidOrigSource')}</Label>
            <Input className={inp('EID_ORIG_SOURCE')} value={sel('EID_ORIG_SOURCE')} onChange={(e) => set('EID_ORIG_SOURCE', e.target.value)} />
            <FieldErr msg={err('EID_ORIG_SOURCE')} />
          </div>

          {/* Dates */}
          <SectionDivider title={t('editEstablishment.sections.dates')} />
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.crIssueDate')}</Label>
            <Input type="date" className={inp('CR_ISSUE_DATE')} value={sel('CR_ISSUE_DATE').split('T')[0]} onChange={(e) => set('CR_ISSUE_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.crExpiryDate')}</Label>
            <Input type="date" className={inp('CR_EXPIRY_DATE')} value={sel('CR_EXPIRY_DATE').split('T')[0]} onChange={(e) => set('CR_EXPIRY_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.crCancelDate')}</Label>
            <Input type="date" className={inp('CR_CANCEL_DATE')} value={sel('CR_CANCEL_DATE').split('T')[0]} onChange={(e) => set('CR_CANCEL_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.cpIssueDate')}</Label>
            <Input type="date" className={inp('CP_ISSUE_DATE')} value={sel('CP_ISSUE_DATE').split('T')[0]} onChange={(e) => set('CP_ISSUE_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.cpEndDate')}</Label>
            <Input type="date" className={inp('CP_END_DATE')} value={sel('CP_END_DATE').split('T')[0]} onChange={(e) => set('CP_END_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.cpCancelDate')}</Label>
            <Input type="date" className={inp('CP_CANCEL_DATE')} value={sel('CP_CANCEL_DATE').split('T')[0]} onChange={(e) => set('CP_CANCEL_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.regDate')}</Label>
            <Input type="date" className={inp('REG_DATE')} value={sel('REG_DATE').split('T')[0]} onChange={(e) => set('REG_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.regExpiryDate')}</Label>
            <Input type="date" className={inp('REG_EXPIRY_DATE')} value={sel('REG_EXPIRY_DATE').split('T')[0]} onChange={(e) => set('REG_EXPIRY_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.regCancelDate')}</Label>
            <Input type="date" className={inp('REG_CANCEL_DATE')} value={sel('REG_CANCEL_DATE').split('T')[0]} onChange={(e) => set('REG_CANCEL_DATE', e.target.value)} />
          </div>

          {/* Metadata (read-only) */}
          <SectionDivider title={t('editEstablishment.sections.metadata')} />
          <ReadOnlyField label={t('editEstablishment.fields.validFrom')} value={frame?.VALID_FROM ? new Date(frame.VALID_FROM).toLocaleDateString('en-GB') : '—'} />
          <ReadOnlyField label={t('editEstablishment.fields.validTo')} value={frame?.VALID_TO ? new Date(frame.VALID_TO).toLocaleDateString('en-GB') : '—'} />

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
