'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateFrameMutation } from '../api/frameApi';
import { toast } from '@/utils/toast';
import { CommentDialog } from '@/components/common/CommentDialog';
import type { SbrFrame } from '@/types';
import { useTranslation } from 'react-i18next';
import {
  FRAME_FIELD_LABELS,
  EST_STATUS_OPTIONS,
  SECTOR_ID_OPTIONS,
  MAIN_BRANCH_FLG_OPTIONS,
  FRAME_SOURCE_CODE_OPTIONS,
  FRAME_MAX_LENGTHS,
} from '../constants';

interface Props {
  frame: SbrFrame | null;
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

type FormState = Omit<Partial<SbrFrame>, 'ID' | 'SBR_ID' | 'VALID_FROM' | 'VALID_TO'>;

export function EditFrameModal({ frame, open, onClose }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [updateFrame, { isLoading }] = useUpdateFrameMutation();
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

  const set = (field: keyof FormState, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) setErrors((e) => { const n = { ...e }; delete n[field as string]; return n; });
  };


  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

    // String length validations
    Object.entries(FRAME_MAX_LENGTHS).forEach(([field, max]) => {
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
      normalize(val) !== normalize(frame[key as keyof SbrFrame])
    );
  };

  const err = (f: string) => errors[f];
  const inp = (f: string) => err(f)
    ? 'border-red-400 focus-visible:border-2 focus-visible:border-red-500 focus-visible:ring-0'
    : 'focus-visible:border-2 focus-visible:border-blue-600 focus-visible:ring-0';

  const handleSubmit = () => {
    if (!frame) return;
    if (!hasChanges()) { toast.info('No changes detected.'); return; }
    if (!validate()) return;
    setShowCommentDialog(true);
  };

  const handleConfirmWithComment = async (comment: string) => {
    if (!frame) return;
    try {
      await updateFrame({ id: frame.ID, data: { ...form, comment } }).unwrap();
      toast.success('Establishment updated successfully!');
      setShowCommentDialog(false);
      onClose();
    } catch (error) {
      const msg = (error as { data?: { message?: string } })?.data?.message
        ?? 'Failed to update establishment. Please try again.';
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
            <DialogTitle>{t('editFrame.title')}</DialogTitle>
          </DialogHeader>

          {/* Error Summary - Outside scroll container to prevent layout shift */}
          {Object.keys(errors).length > 0 && (
            <ErrorSummary errors={errors} onErrorClick={scrollToField} fieldLabels={FRAME_FIELD_LABELS} />
          )}

          <div ref={scrollContainerRef} className="grid grid-cols-2 gap-4 py-2 pr-4 max-h-[calc(90vh-180px)] overflow-y-auto">

          {/* Identifiers (read-only) */}
          <SectionDivider title={t('editFrame.sections.identifiers')} />
          <ReadOnlyField label={t('editFrame.fields.sbrId')} value={frame?.SBR_ID} />
          <ReadOnlyField label={t('editFrame.fields.recordId')} value={frame?.ID} />

          {/* Names */}
          <SectionDivider title={t('editFrame.sections.names')} />
          <div className="space-y-1" data-field="NAME_ENU">
            <Label>{t('editFrame.fields.nameEnu')}</Label>
            <Input className={inp('NAME_ENU')} value={sel('NAME_ENU')} onChange={(e) => set('NAME_ENU', e.target.value)} />
            <FieldErr msg={err('NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.nameAra')}</Label>
            <Input dir="rtl" className={inp('NAME_ARA')} value={sel('NAME_ARA')} onChange={(e) => set('NAME_ARA', e.target.value)} />
            <FieldErr msg={err('NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.nameEnuSource')}</Label>
            <Input className={inp('NAME_ENU_SOURCE')} value={sel('NAME_ENU_SOURCE')} onChange={(e) => set('NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.nameAraSource')}</Label>
            <Input className={inp('NAME_ARA_SOURCE')} value={sel('NAME_ARA_SOURCE')} onChange={(e) => set('NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('NAME_ARA_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.tradeNameEnu')}</Label>
            <Input className={inp('TRADE_NAME_ENU')} value={sel('TRADE_NAME_ENU')} onChange={(e) => set('TRADE_NAME_ENU', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.tradeNameAra')}</Label>
            <Input dir="rtl" className={inp('TRADE_NAME_ARA')} value={sel('TRADE_NAME_ARA')} onChange={(e) => set('TRADE_NAME_ARA', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.tradeNameEnuSource')}</Label>
            <Input className={inp('TRADE_NAME_ENU_SOURCE')} value={sel('TRADE_NAME_ENU_SOURCE')} onChange={(e) => set('TRADE_NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.tradeNameAraSource')}</Label>
            <Input className={inp('TRADE_NAME_ARA_SOURCE')} value={sel('TRADE_NAME_ARA_SOURCE')} onChange={(e) => set('TRADE_NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ARA_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.npcNameEnu')}</Label>
            <Input className={inp('NPC_NAME_ENU')} value={sel('NPC_NAME_ENU')} onChange={(e) => set('NPC_NAME_ENU', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.npcNameAra')}</Label>
            <Input dir="rtl" className={inp('NPC_NAME_ARA')} value={sel('NPC_NAME_ARA')} onChange={(e) => set('NPC_NAME_ARA', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.npcNameEnuSource')}</Label>
            <Input className={inp('NPC_NAME_ENU_SOURCE')} value={sel('NPC_NAME_ENU_SOURCE')} onChange={(e) => set('NPC_NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.npcNameAraSource')}</Label>
            <Input className={inp('NPC_NAME_ARA_SOURCE')} value={sel('NPC_NAME_ARA_SOURCE')} onChange={(e) => set('NPC_NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ARA_SOURCE')} />
          </div>

          {/* Status & Classification */}
          <SectionDivider title={t('editFrame.sections.statusClassification')} />
          <div className="space-y-1" data-field="EST_STATUS">
            <Label>{t('editFrame.fields.estStatus')}</Label>
            <select className={`w-full border rounded-md px-3 py-2 text-sm ${err('EST_STATUS') ? 'border-red-400' : 'border-slate-200'}`} value={sel('EST_STATUS')} onChange={(e) => set('EST_STATUS', e.target.value)}>
              <option value="">{t('editFrame.selectPlaceholder')}</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <FieldErr msg={err('EST_STATUS')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.estStatusSource')}</Label>
            <Input className={inp('EST_STATUS_SOURCE')} value={sel('EST_STATUS_SOURCE')} onChange={(e) => set('EST_STATUS_SOURCE', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.estStatusCategory')}</Label>
            <Input className={inp('EST_STATUS_CATEGORY')} value={sel('EST_STATUS_CATEGORY')} onChange={(e) => set('EST_STATUS_CATEGORY', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_CATEGORY')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.estStatusCategorySource')}</Label>
            <Input className={inp('EST_STATUS_CATEGORY_SOURCE')} value={sel('EST_STATUS_CATEGORY_SOURCE')} onChange={(e) => set('EST_STATUS_CATEGORY_SOURCE', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_CATEGORY_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.legalType')}</Label>
            <Input className={inp('LEGAL_TYPE')} value={sel('LEGAL_TYPE')} onChange={(e) => set('LEGAL_TYPE', e.target.value)} />
            <FieldErr msg={err('LEGAL_TYPE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.legalTypeSource')}</Label>
            <Input className={inp('LEGAL_TYPE_SOURCE')} value={sel('LEGAL_TYPE_SOURCE')} onChange={(e) => set('LEGAL_TYPE_SOURCE', e.target.value)} />
            <FieldErr msg={err('LEGAL_TYPE_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="SECTOR_ID">
            <Label>{t('editFrame.fields.sector')}</Label>
            <select className={`w-full border rounded-md px-3 py-2 text-sm ${err('SECTOR_ID') ? 'border-red-400' : 'border-slate-200'}`} value={sel('SECTOR_ID')} onChange={(e) => set('SECTOR_ID', e.target.value)}>
              <option value="">{t('editFrame.selectPlaceholder')}</option>
              <option value="Private">Private</option>
              <option value="Mixed-Private">Mixed-Private</option>
              <option value="Mixed-Government">Mixed-Government</option>
            </select>
            <FieldErr msg={err('SECTOR_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.sectorSource')}</Label>
            <Input className={inp('SECTOR_ID_SOURCE')} value={sel('SECTOR_ID_SOURCE')} onChange={(e) => set('SECTOR_ID_SOURCE', e.target.value)} />
            <FieldErr msg={err('SECTOR_ID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.isicCode')}</Label>
            <Input className={inp('ISIC_CODE')} value={sel('ISIC_CODE')} onChange={(e) => set('ISIC_CODE', e.target.value)} />
            <FieldErr msg={err('ISIC_CODE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.isicCodeSource')}</Label>
            <Input className={inp('ISIC_CODE_SOURCE')} value={sel('ISIC_CODE_SOURCE')} onChange={(e) => set('ISIC_CODE_SOURCE', e.target.value)} />
            <FieldErr msg={err('ISIC_CODE_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="EMPLOYMENT_COUNT">
            <Label>{t('editFrame.fields.employmentCount')}</Label>
            <Input type="number" className={inp('EMPLOYMENT_COUNT')} value={form.EMPLOYMENT_COUNT ?? ''} onChange={(e) => set('EMPLOYMENT_COUNT', Number(e.target.value))} />
            <FieldErr msg={err('EMPLOYMENT_COUNT')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.employmentCountSource')}</Label>
            <Input className={inp('EMPLOYMENT_COUNT_SOURCE')} value={sel('EMPLOYMENT_COUNT_SOURCE')} onChange={(e) => set('EMPLOYMENT_COUNT_SOURCE', e.target.value)} />
            <FieldErr msg={err('EMPLOYMENT_COUNT_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_FLG">
            <Label>{t('editFrame.fields.mainBranchFlg')}</Label>
            <select className={`w-full border rounded-md px-3 py-2 text-sm ${err('MAIN_BRANCH_FLG') ? 'border-red-400' : 'border-slate-200'}`} value={sel('MAIN_BRANCH_FLG')} onChange={(e) => set('MAIN_BRANCH_FLG', e.target.value)}>
              <option value="">{t('editFrame.selectPlaceholder')}</option>
              <option value="MAIN">MAIN</option>
              <option value="BRANCH">BRANCH</option>
            </select>
            <FieldErr msg={err('MAIN_BRANCH_FLG')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_SBR_ID">
            <Label>{t('editFrame.fields.mainBranchSbrId')}</Label>
            <Input type="number" className={inp('MAIN_BRANCH_SBR_ID')} value={form.MAIN_BRANCH_SBR_ID ?? ''} onChange={(e) => set('MAIN_BRANCH_SBR_ID', e.target.value ? Number(e.target.value) : null)} />
            <FieldErr msg={err('MAIN_BRANCH_SBR_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.mainBranchFlgSource')}</Label>
            <Input className={inp('MAIN_BRANCH_FLG_SOURCE')} value={sel('MAIN_BRANCH_FLG_SOURCE')} onChange={(e) => set('MAIN_BRANCH_FLG_SOURCE', e.target.value)} />
            <FieldErr msg={err('MAIN_BRANCH_FLG_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_SBR_ID_SOURCE">
            <Label>{t('editFrame.fields.mainBranchSbrIdSource')}</Label>
            <Input className={inp('MAIN_BRANCH_SBR_ID_SOURCE')} value={sel('MAIN_BRANCH_SBR_ID_SOURCE')} onChange={(e) => set('MAIN_BRANCH_SBR_ID_SOURCE', e.target.value)} />
            <FieldErr msg={err('MAIN_BRANCH_SBR_ID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.holdingCompanyFlg')}</Label>
            <Input className={inp('HOLDING_COMPANY_FLG')} value={sel('HOLDING_COMPANY_FLG')} onChange={(e) => set('HOLDING_COMPANY_FLG', e.target.value)} />
            <FieldErr msg={err('HOLDING_COMPANY_FLG')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.holdingCompanyFlgSource')}</Label>
            <Input className={inp('HOLDING_COMPANY_FLG_SOURCE')} value={sel('HOLDING_COMPANY_FLG_SOURCE')} onChange={(e) => set('HOLDING_COMPANY_FLG_SOURCE', e.target.value)} />
            <FieldErr msg={err('HOLDING_COMPANY_FLG_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.sourceCode')}</Label>
            <select className={`w-full border rounded-md px-3 py-2 text-sm ${err('SOURCE_CODE') ? 'border-red-400' : 'border-slate-200'}`} value={sel('SOURCE_CODE')} onChange={(e) => set('SOURCE_CODE', e.target.value)}>
              <option value="">{t('editFrame.selectPlaceholder')}</option>
              {FRAME_SOURCE_CODE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <FieldErr msg={err('SOURCE_CODE')} />
          </div>

          {/* Registration Numbers */}
          <SectionDivider title={t('editFrame.sections.registrationNumbers')} />
          <div className="space-y-1">
            <Label>{t('editFrame.fields.mociOrgId')}</Label>
            <Input className={inp('MOCI_ORG_ID')} value={sel('MOCI_ORG_ID')} onChange={(e) => set('MOCI_ORG_ID', e.target.value)} />
            <FieldErr msg={err('MOCI_ORG_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.mociCrNum')}</Label>
            <Input className={inp('MOCI_CR_NUM')} value={sel('MOCI_CR_NUM')} onChange={(e) => set('MOCI_CR_NUM', e.target.value)} />
            <FieldErr msg={err('MOCI_CR_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.mociCpNum')}</Label>
            <Input className={inp('MOCI_CP_NUM')} value={sel('MOCI_CP_NUM')} onChange={(e) => set('MOCI_CP_NUM', e.target.value)} />
            <FieldErr msg={err('MOCI_CP_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.qfcNumber')}</Label>
            <Input className={inp('QFC_NUMBER')} value={sel('QFC_NUMBER')} onChange={(e) => set('QFC_NUMBER', e.target.value)} />
            <FieldErr msg={err('QFC_NUMBER')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.qfzSourceId')}</Label>
            <Input className={inp('QFZ_SOURCE_ID')} value={sel('QFZ_SOURCE_ID')} onChange={(e) => set('QFZ_SOURCE_ID', e.target.value)} />
            <FieldErr msg={err('QFZ_SOURCE_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.qstpRegNum')}</Label>
            <Input className={inp('QSTP_REG_NUM')} value={sel('QSTP_REG_NUM')} onChange={(e) => set('QSTP_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.qstpTaxRegNum')}</Label>
            <Input className={inp('QSTP_TAX_REG_NUM')} value={sel('QSTP_TAX_REG_NUM')} onChange={(e) => set('QSTP_TAX_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_TAX_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.qstpParentRegNum')}</Label>
            <Input className={inp('QSTP_PARENT_REG_NUM')} value={sel('QSTP_PARENT_REG_NUM')} onChange={(e) => set('QSTP_PARENT_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_PARENT_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.farmNo')}</Label>
            <Input className={inp('FARM_NO')} value={sel('FARM_NO')} onChange={(e) => set('FARM_NO', e.target.value)} />
            <FieldErr msg={err('FARM_NO')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.eid')}</Label>
            <Input className={inp('EID')} value={sel('EID')} onChange={(e) => set('EID', e.target.value)} />
            <FieldErr msg={err('EID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.eidSource')}</Label>
            <Input className={inp('EID_SOURCE')} value={sel('EID_SOURCE')} onChange={(e) => set('EID_SOURCE', e.target.value)} />
            <FieldErr msg={err('EID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.eidOrig')}</Label>
            <Input className={inp('EID_ORIG')} value={sel('EID_ORIG')} onChange={(e) => set('EID_ORIG', e.target.value)} />
            <FieldErr msg={err('EID_ORIG')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.eidOrigSource')}</Label>
            <Input className={inp('EID_ORIG_SOURCE')} value={sel('EID_ORIG_SOURCE')} onChange={(e) => set('EID_ORIG_SOURCE', e.target.value)} />
            <FieldErr msg={err('EID_ORIG_SOURCE')} />
          </div>

          {/* Dates */}
          <SectionDivider title={t('editFrame.sections.dates')} />
          <div className="space-y-1">
            <Label>{t('editFrame.fields.crIssueDate')}</Label>
            <Input type="date" value={sel('CR_ISSUE_DATE').split('T')[0]} onChange={(e) => set('CR_ISSUE_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.crExpiryDate')}</Label>
            <Input type="date" value={sel('CR_EXPIRY_DATE').split('T')[0]} onChange={(e) => set('CR_EXPIRY_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.crCancelDate')}</Label>
            <Input type="date" value={sel('CR_CANCEL_DATE').split('T')[0]} onChange={(e) => set('CR_CANCEL_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.cpIssueDate')}</Label>
            <Input type="date" value={sel('CP_ISSUE_DATE').split('T')[0]} onChange={(e) => set('CP_ISSUE_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.cpEndDate')}</Label>
            <Input type="date" value={sel('CP_END_DATE').split('T')[0]} onChange={(e) => set('CP_END_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.cpCancelDate')}</Label>
            <Input type="date" value={sel('CP_CANCEL_DATE').split('T')[0]} onChange={(e) => set('CP_CANCEL_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.regDate')}</Label>
            <Input type="date" value={sel('REG_DATE').split('T')[0]} onChange={(e) => set('REG_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.regExpiryDate')}</Label>
            <Input type="date" value={sel('REG_EXPIRY_DATE').split('T')[0]} onChange={(e) => set('REG_EXPIRY_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editFrame.fields.regCancelDate')}</Label>
            <Input type="date" value={sel('REG_CANCEL_DATE').split('T')[0]} onChange={(e) => set('REG_CANCEL_DATE', e.target.value)} />
          </div>

          {/* Metadata (read-only) */}
          <SectionDivider title={t('editFrame.sections.metadata')} />
          <ReadOnlyField label={t('editFrame.fields.validFrom')} value={frame?.VALID_FROM ? new Date(frame.VALID_FROM).toLocaleDateString('en-GB') : '—'} />
          <ReadOnlyField label={t('editFrame.fields.validTo')} value={frame?.VALID_TO ? new Date(frame.VALID_TO).toLocaleDateString('en-GB') : '—'} />
          <ReadOnlyField label={t('editFrame.fields.createdAt')} value={frame?.CREATED_AT ? new Date(frame.CREATED_AT).toLocaleString('en-GB') : '—'} />
          <ReadOnlyField label={t('editFrame.fields.updatedAt')} value={frame?.UPDATED_AT ? new Date(frame.UPDATED_AT).toLocaleString('en-GB') : '—'} />

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('actions.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={isLoading}>{t('actions.saveChanges')}</Button>
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
