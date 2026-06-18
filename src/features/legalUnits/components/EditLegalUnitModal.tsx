'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateLegalUnitMutation } from '../api/legalUnitsApi';
import { toast } from '@/utils/toast';
import { CommentDialog } from '@/components/common/CommentDialog';
import type { SbrLegalUnit } from '@/types';
import { useTranslation } from 'react-i18next';
import {
  LEGAL_UNITS_FIELD_LABELS,
  EST_STATUS_OPTIONS,
  SECTOR_ID_OPTIONS,
  MAIN_BRANCH_FLG_OPTIONS,
  LEGAL_UNITS_SOURCE_CODE_OPTIONS,
  LEGAL_UNITS_MAX_LENGTHS,
  isLegalUnitFieldEditable,
} from '../constants';

interface Props {
  frame: SbrLegalUnit | null;
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

type FormState = Omit<Partial<SbrLegalUnit>, 'ID' | 'SBR_ID' | 'VALID_FROM' | 'VALID_TO'>;

export function EditLegalUnitModal({ frame, open, onClose }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [updateLegalUnit, { isLoading }] = useUpdateLegalUnitMutation();
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
  const ed = (field: string): boolean => isLegalUnitFieldEditable(field);

  const set = (field: keyof FormState, value: string | number | null) => {
    if (!ed(field as string)) return; // locked field — ignore edits
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) setErrors((e) => { const n = { ...e }; delete n[field as string]; return n; });
  };


  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

    // String length validations
    Object.entries(LEGAL_UNITS_MAX_LENGTHS).forEach(([field, max]) => {
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

  const hasChanges = () => {
    if (!frame) return false;
    const normalize = (v: unknown) => (v === null || v === undefined || v === '') ? '' : String(v).trim();
    return Object.entries(form).some(([key, val]) =>
      normalize(val) !== normalize(frame[key as keyof SbrLegalUnit])
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
    if (!hasChanges()) { toast.info('No changes detected.'); return; }
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
      await updateLegalUnit({ id: frame.ID, data: { ...editableData, comment } }).unwrap();
      toast.success('Legal unit updated successfully!');
      setShowCommentDialog(false);
      onClose();
    } catch (error) {
      if ((error as { status?: number })?.status === 403) return;
      const msg = (error as { data?: { message?: string } })?.data?.message
        ?? 'Failed to update legal unit. Please try again.';
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
            <DialogTitle>{t('editLegalUnit.title')}</DialogTitle>
          </DialogHeader>

          {/* Error Summary - Outside scroll container to prevent layout shift */}
          {Object.keys(errors).length > 0 && (
            <ErrorSummary errors={errors} onErrorClick={scrollToField} fieldLabels={LEGAL_UNITS_FIELD_LABELS} />
          )}

          <div ref={scrollContainerRef} className="grid grid-cols-2 gap-4 py-2 pr-4 max-h-[calc(90vh-180px)] overflow-y-auto">

          {/* Identifiers (read-only) */}
          <SectionDivider title={t('editLegalUnit.sections.identifiers', { lng: 'en' })} />
          <ReadOnlyField label={t('editLegalUnit.fields.sbrId', { lng: 'en' })} value={frame?.SBR_ID} />
          <ReadOnlyField label={t('editLegalUnit.fields.recordId', { lng: 'en' })} value={frame?.ID} />

          {/* Names */}
          <SectionDivider title={t('editLegalUnit.sections.names', { lng: 'en' })} />
          <div className="space-y-1" data-field="NAME_ENU">
            <Label>{t('editLegalUnit.fields.nameEnu', { lng: 'en' })}</Label>
            <Input className={inp('NAME_ENU')} value={sel('NAME_ENU')} onChange={(e) => set('NAME_ENU', e.target.value)} />
            <FieldErr msg={err('NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.nameAra', { lng: 'en' })}</Label>
            <Input dir="rtl" className={inp('NAME_ARA')} value={sel('NAME_ARA')} onChange={(e) => set('NAME_ARA', e.target.value)} />
            <FieldErr msg={err('NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.nameEnuSource', { lng: 'en' })}</Label>
            <Input className={inp('NAME_ENU_SOURCE')} value={sel('NAME_ENU_SOURCE')} onChange={(e) => set('NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.nameAraSource', { lng: 'en' })}</Label>
            <Input className={inp('NAME_ARA_SOURCE')} value={sel('NAME_ARA_SOURCE')} onChange={(e) => set('NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('NAME_ARA_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.tradeNameEnu', { lng: 'en' })}</Label>
            <Input className={inp('TRADE_NAME_ENU')} value={sel('TRADE_NAME_ENU')} onChange={(e) => set('TRADE_NAME_ENU', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.tradeNameAra', { lng: 'en' })}</Label>
            <Input dir="rtl" className={inp('TRADE_NAME_ARA')} value={sel('TRADE_NAME_ARA')} onChange={(e) => set('TRADE_NAME_ARA', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.tradeNameEnuSource', { lng: 'en' })}</Label>
            <Input className={inp('TRADE_NAME_ENU_SOURCE')} value={sel('TRADE_NAME_ENU_SOURCE')} onChange={(e) => set('TRADE_NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.tradeNameAraSource', { lng: 'en' })}</Label>
            <Input className={inp('TRADE_NAME_ARA_SOURCE')} value={sel('TRADE_NAME_ARA_SOURCE')} onChange={(e) => set('TRADE_NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ARA_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.npcNameEnu', { lng: 'en' })}</Label>
            <Input className={inp('NPC_NAME_ENU')} value={sel('NPC_NAME_ENU')} onChange={(e) => set('NPC_NAME_ENU', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.npcNameAra', { lng: 'en' })}</Label>
            <Input dir="rtl" className={inp('NPC_NAME_ARA')} value={sel('NPC_NAME_ARA')} onChange={(e) => set('NPC_NAME_ARA', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.npcNameEnuSource', { lng: 'en' })}</Label>
            <Input className={inp('NPC_NAME_ENU_SOURCE')} value={sel('NPC_NAME_ENU_SOURCE')} onChange={(e) => set('NPC_NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.npcNameAraSource', { lng: 'en' })}</Label>
            <Input className={inp('NPC_NAME_ARA_SOURCE')} value={sel('NPC_NAME_ARA_SOURCE')} onChange={(e) => set('NPC_NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ARA_SOURCE')} />
          </div>

          {/* Status & Classification */}
          <SectionDivider title={t('editLegalUnit.sections.statusClassification', { lng: 'en' })} />
          <div className="space-y-1" data-field="EST_STATUS">
            <Label>{t('editLegalUnit.fields.estStatus', { lng: 'en' })}</Label>
            <Select value={sel('EST_STATUS') || '__none__'} onValueChange={(v) => set('EST_STATUS', v === '__none__' ? '' : v)}>
              <SelectTrigger className={`w-full shadow-none ${err('EST_STATUS') ? 'border-red-400' : ''}`}>
                <SelectValue placeholder={t('editLegalUnit.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editLegalUnit.selectPlaceholder')}</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <FieldErr msg={err('EST_STATUS')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.estStatusSource', { lng: 'en' })}</Label>
            <Input className={inp('EST_STATUS_SOURCE')} value={sel('EST_STATUS_SOURCE')} onChange={(e) => set('EST_STATUS_SOURCE', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.estStatusCategory', { lng: 'en' })}</Label>
            <Input className={inp('EST_STATUS_CATEGORY')} value={sel('EST_STATUS_CATEGORY')} onChange={(e) => set('EST_STATUS_CATEGORY', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_CATEGORY')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.estStatusCategorySource', { lng: 'en' })}</Label>
            <Input className={inp('EST_STATUS_CATEGORY_SOURCE')} value={sel('EST_STATUS_CATEGORY_SOURCE')} onChange={(e) => set('EST_STATUS_CATEGORY_SOURCE', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_CATEGORY_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.legalType', { lng: 'en' })}</Label>
            <Input className={inp('LEGAL_TYPE')} value={sel('LEGAL_TYPE')} onChange={(e) => set('LEGAL_TYPE', e.target.value)} />
            <FieldErr msg={err('LEGAL_TYPE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.legalTypeSource', { lng: 'en' })}</Label>
            <Input className={inp('LEGAL_TYPE_SOURCE')} value={sel('LEGAL_TYPE_SOURCE')} onChange={(e) => set('LEGAL_TYPE_SOURCE', e.target.value)} />
            <FieldErr msg={err('LEGAL_TYPE_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="SECTOR_ID">
            <Label>{t('editLegalUnit.fields.sector', { lng: 'en' })}</Label>
            <Select value={sel('SECTOR_ID') || '__none__'} onValueChange={(v) => set('SECTOR_ID', v === '__none__' ? '' : v)}>
              <SelectTrigger className={`w-full shadow-none ${err('SECTOR_ID') ? 'border-red-400' : ''}`}>
                <SelectValue placeholder={t('editLegalUnit.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editLegalUnit.selectPlaceholder')}</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Mixed-Private">Mixed-Private</SelectItem>
                <SelectItem value="Mixed-Government">Mixed-Government</SelectItem>
              </SelectContent>
            </Select>
            <FieldErr msg={err('SECTOR_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.sectorSource', { lng: 'en' })}</Label>
            <Input className={inp('SECTOR_ID_SOURCE')} value={sel('SECTOR_ID_SOURCE')} onChange={(e) => set('SECTOR_ID_SOURCE', e.target.value)} />
            <FieldErr msg={err('SECTOR_ID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.isicCode', { lng: 'en' })}</Label>
            <Input className={inp('ISIC_CODE')} value={sel('ISIC_CODE')} onChange={(e) => set('ISIC_CODE', e.target.value)} />
            <FieldErr msg={err('ISIC_CODE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.isicCodeSource', { lng: 'en' })}</Label>
            <Input className={inp('ISIC_CODE_SOURCE')} value={sel('ISIC_CODE_SOURCE')} onChange={(e) => set('ISIC_CODE_SOURCE', e.target.value)} />
            <FieldErr msg={err('ISIC_CODE_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="EMPLOYMENT_COUNT">
            <Label>{t('editLegalUnit.fields.employmentCount', { lng: 'en' })}</Label>
            <Input type="number" className={inp('EMPLOYMENT_COUNT')} value={form.EMPLOYMENT_COUNT ?? ''} onChange={(e) => set('EMPLOYMENT_COUNT', Number(e.target.value))} />
            <FieldErr msg={err('EMPLOYMENT_COUNT')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.employmentCountSource', { lng: 'en' })}</Label>
            <Input className={inp('EMPLOYMENT_COUNT_SOURCE')} value={sel('EMPLOYMENT_COUNT_SOURCE')} onChange={(e) => set('EMPLOYMENT_COUNT_SOURCE', e.target.value)} />
            <FieldErr msg={err('EMPLOYMENT_COUNT_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_FLG">
            <Label>{t('editLegalUnit.fields.mainBranchFlg', { lng: 'en' })}</Label>
            <Select value={sel('MAIN_BRANCH_FLG') || '__none__'} onValueChange={(v) => set('MAIN_BRANCH_FLG', v === '__none__' ? '' : v)} disabled={!ed('MAIN_BRANCH_FLG')}>
              <SelectTrigger className={`w-full shadow-none ${err('MAIN_BRANCH_FLG') ? 'border-red-400' : ''} ${!ed('MAIN_BRANCH_FLG') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editLegalUnit.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editLegalUnit.selectPlaceholder')}</SelectItem>
                <SelectItem value="MAIN">MAIN</SelectItem>
                <SelectItem value="BRANCH">BRANCH</SelectItem>
              </SelectContent>
            </Select>
            <FieldErr msg={err('MAIN_BRANCH_FLG')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_SBR_ID">
            <Label>{t('editLegalUnit.fields.mainBranchSbrId', { lng: 'en' })}</Label>
            <Input type="number" className={inp('MAIN_BRANCH_SBR_ID')} value={form.MAIN_BRANCH_SBR_ID ?? ''} onChange={(e) => set('MAIN_BRANCH_SBR_ID', e.target.value ? Number(e.target.value) : null)} />
            <FieldErr msg={err('MAIN_BRANCH_SBR_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.mainBranchFlgSource', { lng: 'en' })}</Label>
            <Input className={inp('MAIN_BRANCH_FLG_SOURCE')} value={sel('MAIN_BRANCH_FLG_SOURCE')} onChange={(e) => set('MAIN_BRANCH_FLG_SOURCE', e.target.value)} />
            <FieldErr msg={err('MAIN_BRANCH_FLG_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_SBR_ID_SOURCE">
            <Label>{t('editLegalUnit.fields.mainBranchSbrIdSource', { lng: 'en' })}</Label>
            <Input className={inp('MAIN_BRANCH_SBR_ID_SOURCE')} value={sel('MAIN_BRANCH_SBR_ID_SOURCE')} onChange={(e) => set('MAIN_BRANCH_SBR_ID_SOURCE', e.target.value)} />
            <FieldErr msg={err('MAIN_BRANCH_SBR_ID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.holdingCompanyFlg', { lng: 'en' })}</Label>
            <Input className={inp('HOLDING_COMPANY_FLG')} value={sel('HOLDING_COMPANY_FLG')} onChange={(e) => set('HOLDING_COMPANY_FLG', e.target.value)} />
            <FieldErr msg={err('HOLDING_COMPANY_FLG')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.holdingCompanyFlgSource', { lng: 'en' })}</Label>
            <Input className={inp('HOLDING_COMPANY_FLG_SOURCE')} value={sel('HOLDING_COMPANY_FLG_SOURCE')} onChange={(e) => set('HOLDING_COMPANY_FLG_SOURCE', e.target.value)} />
            <FieldErr msg={err('HOLDING_COMPANY_FLG_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.sourceCode', { lng: 'en' })}</Label>
            <Select value={sel('SOURCE_CODE') || '__none__'} onValueChange={(v) => set('SOURCE_CODE', v === '__none__' ? '' : v)} disabled={!ed('SOURCE_CODE')}>
              <SelectTrigger className={`w-full shadow-none ${err('SOURCE_CODE') ? 'border-red-400' : ''} ${!ed('SOURCE_CODE') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editLegalUnit.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('editLegalUnit.selectPlaceholder')}</SelectItem>
                {LEGAL_UNITS_SOURCE_CODE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldErr msg={err('SOURCE_CODE')} />
          </div>

          {/* Registration Numbers */}
          <SectionDivider title={t('editLegalUnit.sections.registrationNumbers', { lng: 'en' })} />
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.mociOrgId', { lng: 'en' })}</Label>
            <Input className={inp('MOCI_ORG_ID')} value={sel('MOCI_ORG_ID')} onChange={(e) => set('MOCI_ORG_ID', e.target.value)} />
            <FieldErr msg={err('MOCI_ORG_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.mociCrNum', { lng: 'en' })}</Label>
            <Input className={inp('MOCI_CR_NUM')} value={sel('MOCI_CR_NUM')} onChange={(e) => set('MOCI_CR_NUM', e.target.value)} />
            <FieldErr msg={err('MOCI_CR_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.mociCpNum', { lng: 'en' })}</Label>
            <Input className={inp('MOCI_CP_NUM')} value={sel('MOCI_CP_NUM')} onChange={(e) => set('MOCI_CP_NUM', e.target.value)} />
            <FieldErr msg={err('MOCI_CP_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.qfcNumber', { lng: 'en' })}</Label>
            <Input className={inp('QFC_NUMBER')} value={sel('QFC_NUMBER')} onChange={(e) => set('QFC_NUMBER', e.target.value)} />
            <FieldErr msg={err('QFC_NUMBER')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.qfzSourceId', { lng: 'en' })}</Label>
            <Input className={inp('QFZ_SOURCE_ID')} value={sel('QFZ_SOURCE_ID')} onChange={(e) => set('QFZ_SOURCE_ID', e.target.value)} />
            <FieldErr msg={err('QFZ_SOURCE_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.qstpRegNum', { lng: 'en' })}</Label>
            <Input className={inp('QSTP_REG_NUM')} value={sel('QSTP_REG_NUM')} onChange={(e) => set('QSTP_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.qstpTaxRegNum', { lng: 'en' })}</Label>
            <Input className={inp('QSTP_TAX_REG_NUM')} value={sel('QSTP_TAX_REG_NUM')} onChange={(e) => set('QSTP_TAX_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_TAX_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.qstpParentRegNum', { lng: 'en' })}</Label>
            <Input className={inp('QSTP_PARENT_REG_NUM')} value={sel('QSTP_PARENT_REG_NUM')} onChange={(e) => set('QSTP_PARENT_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_PARENT_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.farmNo', { lng: 'en' })}</Label>
            <Input className={inp('FARM_NO')} value={sel('FARM_NO')} onChange={(e) => set('FARM_NO', e.target.value)} />
            <FieldErr msg={err('FARM_NO')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.eid', { lng: 'en' })}</Label>
            <Input className={inp('EID')} value={sel('EID')} onChange={(e) => set('EID', e.target.value)} />
            <FieldErr msg={err('EID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.eidSource', { lng: 'en' })}</Label>
            <Input className={inp('EID_SOURCE')} value={sel('EID_SOURCE')} onChange={(e) => set('EID_SOURCE', e.target.value)} />
            <FieldErr msg={err('EID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.eidOrig', { lng: 'en' })}</Label>
            <Input className={inp('EID_ORIG')} value={sel('EID_ORIG')} onChange={(e) => set('EID_ORIG', e.target.value)} />
            <FieldErr msg={err('EID_ORIG')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.eidOrigSource', { lng: 'en' })}</Label>
            <Input className={inp('EID_ORIG_SOURCE')} value={sel('EID_ORIG_SOURCE')} onChange={(e) => set('EID_ORIG_SOURCE', e.target.value)} />
            <FieldErr msg={err('EID_ORIG_SOURCE')} />
          </div>

          {/* Dates */}
          <SectionDivider title={t('editLegalUnit.sections.dates', { lng: 'en' })} />
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.crIssueDate', { lng: 'en' })}</Label>
            <Input type="date" className={inp('CR_ISSUE_DATE')} value={sel('CR_ISSUE_DATE').split('T')[0]} onChange={(e) => set('CR_ISSUE_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.crExpiryDate', { lng: 'en' })}</Label>
            <Input type="date" className={inp('CR_EXPIRY_DATE')} value={sel('CR_EXPIRY_DATE').split('T')[0]} onChange={(e) => set('CR_EXPIRY_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.crCancelDate', { lng: 'en' })}</Label>
            <Input type="date" className={inp('CR_CANCEL_DATE')} value={sel('CR_CANCEL_DATE').split('T')[0]} onChange={(e) => set('CR_CANCEL_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.cpIssueDate', { lng: 'en' })}</Label>
            <Input type="date" className={inp('CP_ISSUE_DATE')} value={sel('CP_ISSUE_DATE').split('T')[0]} onChange={(e) => set('CP_ISSUE_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.cpEndDate', { lng: 'en' })}</Label>
            <Input type="date" className={inp('CP_END_DATE')} value={sel('CP_END_DATE').split('T')[0]} onChange={(e) => set('CP_END_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.cpCancelDate', { lng: 'en' })}</Label>
            <Input type="date" className={inp('CP_CANCEL_DATE')} value={sel('CP_CANCEL_DATE').split('T')[0]} onChange={(e) => set('CP_CANCEL_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.regDate', { lng: 'en' })}</Label>
            <Input type="date" className={inp('REG_DATE')} value={sel('REG_DATE').split('T')[0]} onChange={(e) => set('REG_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.regExpiryDate', { lng: 'en' })}</Label>
            <Input type="date" className={inp('REG_EXPIRY_DATE')} value={sel('REG_EXPIRY_DATE').split('T')[0]} onChange={(e) => set('REG_EXPIRY_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editLegalUnit.fields.regCancelDate', { lng: 'en' })}</Label>
            <Input type="date" className={inp('REG_CANCEL_DATE')} value={sel('REG_CANCEL_DATE').split('T')[0]} onChange={(e) => set('REG_CANCEL_DATE', e.target.value)} />
          </div>

          {/* Metadata (read-only) */}
          <SectionDivider title={t('editLegalUnit.sections.metadata', { lng: 'en' })} />
          <ReadOnlyField label={t('editLegalUnit.fields.validFrom', { lng: 'en' })} value={frame?.VALID_FROM ? new Date(frame.VALID_FROM).toLocaleDateString('en-GB') : '—'} />
          <ReadOnlyField label={t('editLegalUnit.fields.validTo', { lng: 'en' })} value={frame?.VALID_TO ? new Date(frame.VALID_TO).toLocaleDateString('en-GB') : '—'} />

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
