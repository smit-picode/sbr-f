'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateEstablishmentMutation } from '../api/establishmentsApi';
import { toast } from '@/utils/toast';
import { pendingChangeText } from '@/utils/pendingChange';
import { CommentDialog } from '@/components/common/CommentDialog';
import { ErrorSummary } from '@/components/common/ErrorSummary';
import { PendingFieldsHint } from '@/components/common/PendingFieldsHint';
import { PendingFieldInfo } from '@/components/common/PendingFieldInfo';
import type { SbrEstablishment, EstablishmentFormState } from '@/types';
import { useTranslation } from 'react-i18next';
import { useGetEstStatusCategoriesQuery, useGetLegalTypeValuesQuery, useGetSectorTypeValuesQuery, useGetMainBranchValuesQuery } from '@/features/lookups/api/lookupsApi';
import {
  ESTABLISHMENTS_FIELD_LABELS,
  EST_STATUS_OPTIONS,
  EST_STATUS_VALUES,
  EST_STATUS_SELECT_OPTIONS,
  MAIN_BRANCH_FLG_OPTIONS,
  ESTABLISHMENTS_SOURCE_CODE_OPTIONS,
  ESTABLISHMENTS_MAX_LENGTHS,
  isEstablishmentFieldEditable,
} from '../constants';
import { IsicCodeSelect } from '@/components/common/IsicCodeSelect';
import { MainBranchSelect } from '@/components/common/MainBranchSelect';

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
      <p className="text-[11px] font-semibold tracking-[0.1em] text-slate-400 border-b border-slate-100 pb-1">
        {title}
      </p>
    </div>
  );
}


const NAMES_FIELD = 'NAMES';
const NAMES_PAIR = ['NAME_ENU', 'NAME_ARA'];

export function EditEstablishmentModal({ frame, open, onClose }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EstablishmentFormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [updateEstablishment, { isLoading }] = useUpdateEstablishmentMutation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: statusCategoryRes, isFetching: isLoadingStatusCategories } =
    useGetEstStatusCategoriesQuery(undefined, { skip: !open });
  const statusCategoryOptions = statusCategoryRes?.data ?? [];

  const { data: legalTypeRes, isFetching: isLoadingLegalTypes } =
    useGetLegalTypeValuesQuery(undefined, { skip: !open });
  const legalTypeOptions = legalTypeRes?.data ?? [];

  const { data: sectorTypeRes, isFetching: isLoadingSectorTypes } =
    useGetSectorTypeValuesQuery(undefined, { skip: !open });
  const sectorTypeOptions = sectorTypeRes?.data ?? [];

  const { data: mainBranchRes, isFetching: isLoadingMainBranches } =
    useGetMainBranchValuesQuery(undefined, { skip: !open });
  const mainBranchOptions = mainBranchRes?.data ?? [];

  useEffect(() => {
    if (frame) {
      setErrors({});
      setForm({
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
  const isPending = (field: string): boolean => !!frame?.PENDING_FIELDS?.[field];
  const ed = (field: string): boolean => isEstablishmentFieldEditable(field) && !isPending(field);

  const set = (field: keyof EstablishmentFormState, value: string | number | null) => {
    if (!ed(field as string)) return;
    setForm((prev) => ({ ...prev, [field]: value }));
    const clearNames = NAMES_PAIR.includes(field as string) && !!errors[NAMES_FIELD];
    if (errors[field as string] || clearNames) {
      setErrors((e) => {
        const n = { ...e };
        delete n[field as string];
        if (clearNames) delete n[NAMES_FIELD];
        return n;
      });
    }
  };


  // Est.
  const setEstStatus = (value: string) => {
    set('EST_STATUS', value);
    if (value === EST_STATUS_VALUES.ACTIVE) set('EST_STATUS_CATEGORY', '');
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

    if (!str(form.NAME_ENU).trim() && !str(form.NAME_ARA).trim()) {
      e[NAMES_FIELD] = 'Enter a name in English or Arabic';
    }

    Object.entries(ESTABLISHMENTS_MAX_LENGTHS).forEach(([field, max]) => {
      if (str(form[field as keyof EstablishmentFormState]).length > max) {
        e[field] = `Max ${max} character${max === 1 ? '' : 's'} allowed`;
      }
    });

    if (form.EMPLOYMENT_COUNT != null && Number(form.EMPLOYMENT_COUNT) < 0) {
      e.EMPLOYMENT_COUNT = 'Must be 0 or greater';
    }
    if (form.MAIN_BRANCH_SBR_ID != null && !Number.isInteger(Number(form.MAIN_BRANCH_SBR_ID))) {
      e.MAIN_BRANCH_SBR_ID = 'Must be an integer';
    }
    if (
      form.MAIN_BRANCH_SBR_ID != null &&
      !isLoadingMainBranches &&
      mainBranchOptions.length > 0 &&
      !mainBranchOptions.some((o) => o.SBR_ID === Number(form.MAIN_BRANCH_SBR_ID))
    ) {
      e.MAIN_BRANCH_SBR_ID = t('editEstablishment.mainBranchSbrIdInvalid', {
        defaultValue: 'This SBR ID is not an active main-branch establishment. Please select one from the list.',
      });
    }

    if (form.EST_STATUS !== null && form.EST_STATUS !== undefined && !EST_STATUS_OPTIONS.includes(String(form.EST_STATUS))) {
      e.EST_STATUS = `Must be one of [${EST_STATUS_OPTIONS.filter(v => v !== null).join(', ')}, or empty]`;
    }
    if (str(form.EST_STATUS) === EST_STATUS_VALUES.INACTIVE && !str(form.EST_STATUS_CATEGORY).trim()) {
      e.EST_STATUS_CATEGORY = t('editEstablishment.estStatusCategoryRequired', {
        defaultValue: 'Est. Status Category is required when Est. Status is Inactive',
      });
    }
    if (!str(form.SECTOR_ID).trim()) {
      e.SECTOR_ID = t('editEstablishment.sectorRequired', { defaultValue: 'Sector is required' });
    } else if (
      !isLoadingSectorTypes && sectorTypeOptions.length > 0
      && !sectorTypeOptions.some((o) => o.CODE === String(form.SECTOR_ID))
    ) {
      e.SECTOR_ID = `Must be one of [${sectorTypeOptions.map((o) => o.CODE).join(', ')}]`;
    }
    if (form.MAIN_BRANCH_FLG !== null && form.MAIN_BRANCH_FLG !== undefined && form.MAIN_BRANCH_FLG !== '' && !MAIN_BRANCH_FLG_OPTIONS.includes(String(form.MAIN_BRANCH_FLG))) {
      e.MAIN_BRANCH_FLG = `Must be one of [${MAIN_BRANCH_FLG_OPTIONS.join(', ')}, or empty]`;
    }

    const editableErrors: Record<string, string> = {};
    for (const [field, msg] of Object.entries(e)) {
      if (ed(field)) editableErrors[field] = msg;
    }

    setErrors(editableErrors);

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

  // An active establishment still linked to an enterprise cannot be made inactive from here.
  const isDeactivatingLinkedEstablishment = () =>
    !!frame && frame.ASSOCIATED_ENTERPRISE_ID != null && ed('EST_STATUS')
    && frame.EST_STATUS === EST_STATUS_VALUES.ACTIVE && form.EST_STATUS === EST_STATUS_VALUES.INACTIVE;

  // Both name inputs resolve to the shared NAMES error so each still gets the invalid border
  const err = (f: string) => errors[f] ?? (NAMES_PAIR.includes(f) ? errors[NAMES_FIELD] : undefined);
  const inp = (f: string) => {
    if (!ed(f)) return 'bg-slate-50 text-slate-400 cursor-not-allowed pointer-events-none';
    return err(f)
      ? 'border-red-400 focus-visible:border-2 focus-visible:border-red-500 focus-visible:ring-0'
      : 'focus-visible:border-2 focus-visible:border-[#A29374]/40 focus-visible:ring-0';
  };

  const handleSubmit = () => {
    if (!frame) return;
    if (!hasChanges()) { toast.info(t('common.noChangesDetected', { defaultValue: 'No changes detected.' })); return; }
    if (isDeactivatingLinkedEstablishment()) {
      const linkedMsg = t('editEstablishment.statusLinkedToEnterprise', {
        defaultValue: 'This establishment is currently linked to an enterprise. Please remove it from the enterprise before changing its status.',
      });
      setErrors((prev) => ({ ...prev, EST_STATUS: linkedMsg }));
      toast.error(linkedMsg);
      return;
    }
    if (!validate()) return;
    setShowCommentDialog(true);
  };

  const handleConfirmWithComment = async (comment: string) => {
    if (!frame) return;
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
      const apiMessage = (error as { data?: { message?: string } })?.data?.message;
      const msg = pendingChangeText(apiMessage, t) ?? apiMessage
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

  const sel = (field: keyof EstablishmentFormState) => String(form[field] ?? '');

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('editEstablishment.title')}</DialogTitle>
          </DialogHeader>

          {Object.keys(errors).length > 0 && (
            <ErrorSummary errors={errors} onErrorClick={scrollToField} fieldLabels={ESTABLISHMENTS_FIELD_LABELS} />
          )}

          <PendingFieldsHint pendingFields={frame?.PENDING_FIELDS} />

          <div ref={scrollContainerRef} className="grid grid-cols-2 gap-4 py-2 pr-4 min-h-0 flex-1 overflow-y-auto">

          <SectionDivider title={t('editEstablishment.sections.identifiers')} />
          <ReadOnlyField label={t('editEstablishment.fields.sbrId')} value={frame?.SBR_ID} />
          <ReadOnlyField label={t('editEstablishment.fields.recordId')} value={frame?.ID} />

          <SectionDivider title={t('editEstablishment.sections.names')} />
          <div className="space-y-1" data-field={NAMES_FIELD}>
            <Label>{t('editEstablishment.fields.nameEnu')}<PendingFieldInfo pending={isPending('NAME_ENU')} /></Label>
            <Input className={inp('NAME_ENU')} value={sel('NAME_ENU')} onChange={(e) => set('NAME_ENU', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.nameAra')}<PendingFieldInfo pending={isPending('NAME_ARA')} /></Label>
            <Input dir="rtl" className={inp('NAME_ARA')} value={sel('NAME_ARA')} onChange={(e) => set('NAME_ARA', e.target.value)} />
          </div>
          {errors[NAMES_FIELD] && (
            <p className="col-span-2 -mt-2 text-xs text-red-500">{errors[NAMES_FIELD]}</p>
          )}
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.nameEnuSource')}<PendingFieldInfo pending={isPending('NAME_ENU_SOURCE')} /></Label>
            <Input className={inp('NAME_ENU_SOURCE')} value={sel('NAME_ENU_SOURCE')} onChange={(e) => set('NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.nameAraSource')}<PendingFieldInfo pending={isPending('NAME_ARA_SOURCE')} /></Label>
            <Input className={inp('NAME_ARA_SOURCE')} value={sel('NAME_ARA_SOURCE')} onChange={(e) => set('NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('NAME_ARA_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.tradeNameEnu')}<PendingFieldInfo pending={isPending('TRADE_NAME_ENU')} /></Label>
            <Input className={inp('TRADE_NAME_ENU')} value={sel('TRADE_NAME_ENU')} onChange={(e) => set('TRADE_NAME_ENU', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.tradeNameAra')}<PendingFieldInfo pending={isPending('TRADE_NAME_ARA')} /></Label>
            <Input dir="rtl" className={inp('TRADE_NAME_ARA')} value={sel('TRADE_NAME_ARA')} onChange={(e) => set('TRADE_NAME_ARA', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.tradeNameEnuSource')}<PendingFieldInfo pending={isPending('TRADE_NAME_ENU_SOURCE')} /></Label>
            <Input className={inp('TRADE_NAME_ENU_SOURCE')} value={sel('TRADE_NAME_ENU_SOURCE')} onChange={(e) => set('TRADE_NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.tradeNameAraSource')}<PendingFieldInfo pending={isPending('TRADE_NAME_ARA_SOURCE')} /></Label>
            <Input className={inp('TRADE_NAME_ARA_SOURCE')} value={sel('TRADE_NAME_ARA_SOURCE')} onChange={(e) => set('TRADE_NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('TRADE_NAME_ARA_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.npcNameEnu')}<PendingFieldInfo pending={isPending('NPC_NAME_ENU')} /></Label>
            <Input className={inp('NPC_NAME_ENU')} value={sel('NPC_NAME_ENU')} onChange={(e) => set('NPC_NAME_ENU', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ENU')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.npcNameAra')}<PendingFieldInfo pending={isPending('NPC_NAME_ARA')} /></Label>
            <Input dir="rtl" className={inp('NPC_NAME_ARA')} value={sel('NPC_NAME_ARA')} onChange={(e) => set('NPC_NAME_ARA', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ARA')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.npcNameEnuSource')}<PendingFieldInfo pending={isPending('NPC_NAME_ENU_SOURCE')} /></Label>
            <Input className={inp('NPC_NAME_ENU_SOURCE')} value={sel('NPC_NAME_ENU_SOURCE')} onChange={(e) => set('NPC_NAME_ENU_SOURCE', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ENU_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.npcNameAraSource')}<PendingFieldInfo pending={isPending('NPC_NAME_ARA_SOURCE')} /></Label>
            <Input className={inp('NPC_NAME_ARA_SOURCE')} value={sel('NPC_NAME_ARA_SOURCE')} onChange={(e) => set('NPC_NAME_ARA_SOURCE', e.target.value)} />
            <FieldErr msg={err('NPC_NAME_ARA_SOURCE')} />
          </div>

          <SectionDivider title={t('editEstablishment.sections.statusClassification')} />
          <div className="space-y-1" data-field="EST_STATUS">
            <Label>{t('editEstablishment.fields.estStatus')}<PendingFieldInfo pending={isPending('EST_STATUS')} /></Label>
            <Select value={sel('EST_STATUS') || '__none__'} onValueChange={(v) => setEstStatus(v === '__none__' ? '' : v)} disabled={isPending('EST_STATUS')}>
              <SelectTrigger className={`w-full shadow-none ${err('EST_STATUS') ? 'border-red-400' : ''} ${isPending('EST_STATUS') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {!sel('EST_STATUS') && <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>}
                {EST_STATUS_SELECT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldErr msg={err('EST_STATUS')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.estStatusSource')}<PendingFieldInfo pending={isPending('EST_STATUS_SOURCE')} /></Label>
            <Input className={inp('EST_STATUS_SOURCE')} value={sel('EST_STATUS_SOURCE')} onChange={(e) => set('EST_STATUS_SOURCE', e.target.value)} />
            <FieldErr msg={err('EST_STATUS_SOURCE')} />
          </div>
          {sel('EST_STATUS') === EST_STATUS_VALUES.INACTIVE && (
            <>
              <div className="space-y-1" data-field="EST_STATUS_CATEGORY">
                <Label>
                  {t('editEstablishment.fields.estStatusCategory')} <span className="text-red-500">*</span><PendingFieldInfo pending={isPending('EST_STATUS_CATEGORY')} />
                </Label>
                <Select
                  value={sel('EST_STATUS_CATEGORY') || '__none__'}
                  onValueChange={(v) => set('EST_STATUS_CATEGORY', v === '__none__' ? '' : v)}
                  disabled={isLoadingStatusCategories || isPending('EST_STATUS_CATEGORY')}
                >
                  <SelectTrigger className={`w-full shadow-none ${err('EST_STATUS_CATEGORY') ? 'border-red-400' : ''} ${isPending('EST_STATUS_CATEGORY') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                    <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {!sel('EST_STATUS_CATEGORY') && <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>}
                    {statusCategoryOptions.map((opt) => (
                      <SelectItem key={opt.CODE} value={opt.CODE}>{opt.DESCRIPTION ?? opt.CODE}</SelectItem>
                    ))}
                    {sel('EST_STATUS_CATEGORY') && !statusCategoryOptions.some((o) => o.CODE === sel('EST_STATUS_CATEGORY')) && (
                      <SelectItem value={sel('EST_STATUS_CATEGORY')}>{sel('EST_STATUS_CATEGORY')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {!isLoadingStatusCategories && statusCategoryOptions.length === 0 && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    {t('editEstablishment.estStatusCategoryUnavailable', {
                      defaultValue: 'Status categories could not be loaded. Please refresh and try again.',
                    })}
                  </p>
                )}
                <FieldErr msg={err('EST_STATUS_CATEGORY')} />
              </div>
              <div className="space-y-1">
                <Label>{t('editEstablishment.fields.estStatusCategorySource')}<PendingFieldInfo pending={isPending('EST_STATUS_CATEGORY_SOURCE')} /></Label>
                <Input className={inp('EST_STATUS_CATEGORY_SOURCE')} value={sel('EST_STATUS_CATEGORY_SOURCE')} onChange={(e) => set('EST_STATUS_CATEGORY_SOURCE', e.target.value)} />
                <FieldErr msg={err('EST_STATUS_CATEGORY_SOURCE')} />
              </div>
            </>
          )}
          <div className="space-y-1" data-field="LEGAL_TYPE">
            <Label>{t('editEstablishment.fields.legalType')}<PendingFieldInfo pending={isPending('LEGAL_TYPE')} /></Label>
            <Select
              value={sel('LEGAL_TYPE') || '__none__'}
              onValueChange={(v) => set('LEGAL_TYPE', v === '__none__' ? '' : v)}
              disabled={!ed('LEGAL_TYPE') || isLoadingLegalTypes}
            >
              <SelectTrigger className={`w-full shadow-none ${err('LEGAL_TYPE') ? 'border-red-400' : ''} ${isPending('LEGAL_TYPE') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {!sel('LEGAL_TYPE') && <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>}
                {legalTypeOptions.map((opt) => (
                  <SelectItem key={opt.CODE} value={opt.CODE}>{opt.DESCRIPTION ?? opt.CODE}</SelectItem>
                ))}
                {sel('LEGAL_TYPE') && !legalTypeOptions.some((o) => o.CODE === sel('LEGAL_TYPE')) && (
                  <SelectItem value={sel('LEGAL_TYPE')}>{sel('LEGAL_TYPE')}</SelectItem>
                )}
              </SelectContent>
            </Select>
            {!isLoadingLegalTypes && legalTypeOptions.length === 0 && (
              <p className="text-xs text-amber-600 mt-0.5">
                {t('editEstablishment.legalTypeUnavailable', {
                  defaultValue: 'Legal types could not be loaded. Please refresh and try again.',
                })}
              </p>
            )}
            <FieldErr msg={err('LEGAL_TYPE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.legalTypeSource')}<PendingFieldInfo pending={isPending('LEGAL_TYPE_SOURCE')} /></Label>
            <Input className={inp('LEGAL_TYPE_SOURCE')} value={sel('LEGAL_TYPE_SOURCE')} onChange={(e) => set('LEGAL_TYPE_SOURCE', e.target.value)} />
            <FieldErr msg={err('LEGAL_TYPE_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="SECTOR_ID">
            <Label>{t('editEstablishment.fields.sector')}<PendingFieldInfo pending={isPending('SECTOR_ID')} /></Label>
            <Select
              value={sel('SECTOR_ID') || '__none__'}
              onValueChange={(v) => set('SECTOR_ID', v === '__none__' ? '' : v)}
              disabled={isLoadingSectorTypes || isPending('SECTOR_ID')}
            >
              <SelectTrigger className={`w-full shadow-none ${err('SECTOR_ID') ? 'border-red-400' : ''} ${isPending('SECTOR_ID') ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={t('editEstablishment.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {!sel('SECTOR_ID') && <SelectItem value="__none__">{t('editEstablishment.selectPlaceholder')}</SelectItem>}
                {sectorTypeOptions.map((opt) => (
                  <SelectItem key={opt.CODE} value={opt.CODE}>{opt.DESCRIPTION ?? opt.CODE}</SelectItem>
                ))}
                {sel('SECTOR_ID') && !sectorTypeOptions.some((o) => o.CODE === sel('SECTOR_ID')) && (
                  <SelectItem value={sel('SECTOR_ID')}>{sel('SECTOR_ID')}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <FieldErr msg={err('SECTOR_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.sectorSource')}<PendingFieldInfo pending={isPending('SECTOR_ID_SOURCE')} /></Label>
            <Input className={inp('SECTOR_ID_SOURCE')} value={sel('SECTOR_ID_SOURCE')} onChange={(e) => set('SECTOR_ID_SOURCE', e.target.value)} />
            <FieldErr msg={err('SECTOR_ID_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="ISIC_CODE">
            <Label>{t('editEstablishment.fields.isicCode')}<PendingFieldInfo pending={isPending('ISIC_CODE')} /></Label>
            <IsicCodeSelect
              value={sel('ISIC_CODE')}
              onChange={(code) => set('ISIC_CODE', code)}
              disabled={!ed('ISIC_CODE')}
              invalid={!!err('ISIC_CODE')}
            />
            <FieldErr msg={err('ISIC_CODE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.isicCodeSource')}<PendingFieldInfo pending={isPending('ISIC_CODE_SOURCE')} /></Label>
            <Input className={inp('ISIC_CODE_SOURCE')} value={sel('ISIC_CODE_SOURCE')} onChange={(e) => set('ISIC_CODE_SOURCE', e.target.value)} />
            <FieldErr msg={err('ISIC_CODE_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="EMPLOYMENT_COUNT">
            <Label>{t('editEstablishment.fields.employmentCount')}<PendingFieldInfo pending={isPending('EMPLOYMENT_COUNT')} /></Label>
            <Input type="number" className={inp('EMPLOYMENT_COUNT')} value={form.EMPLOYMENT_COUNT ?? ''} onChange={(e) => set('EMPLOYMENT_COUNT', e.target.value ? Number(e.target.value) : null)} />
            <FieldErr msg={err('EMPLOYMENT_COUNT')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.employmentCountSource')}<PendingFieldInfo pending={isPending('EMPLOYMENT_COUNT_SOURCE')} /></Label>
            <Input className={inp('EMPLOYMENT_COUNT_SOURCE')} value={sel('EMPLOYMENT_COUNT_SOURCE')} onChange={(e) => set('EMPLOYMENT_COUNT_SOURCE', e.target.value)} />
            <FieldErr msg={err('EMPLOYMENT_COUNT_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_FLG">
            <Label>{t('editEstablishment.fields.mainBranchFlg')}<PendingFieldInfo pending={isPending('MAIN_BRANCH_FLG')} /></Label>
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
            <Label>{t('editEstablishment.fields.mainBranchSbrId')}<PendingFieldInfo pending={isPending('MAIN_BRANCH_SBR_ID')} /></Label>
            <MainBranchSelect
              value={form.MAIN_BRANCH_SBR_ID ?? null}
              onChange={(sbrId) => set('MAIN_BRANCH_SBR_ID', sbrId)}
              disabled={!ed('MAIN_BRANCH_SBR_ID')}
              invalid={!!err('MAIN_BRANCH_SBR_ID')}
            />
            <FieldErr msg={err('MAIN_BRANCH_SBR_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.mainBranchFlgSource')}<PendingFieldInfo pending={isPending('MAIN_BRANCH_FLG_SOURCE')} /></Label>
            <Input className={inp('MAIN_BRANCH_FLG_SOURCE')} value={sel('MAIN_BRANCH_FLG_SOURCE')} onChange={(e) => set('MAIN_BRANCH_FLG_SOURCE', e.target.value)} />
            <FieldErr msg={err('MAIN_BRANCH_FLG_SOURCE')} />
          </div>
          <div className="space-y-1" data-field="MAIN_BRANCH_SBR_ID_SOURCE">
            <Label>{t('editEstablishment.fields.mainBranchSbrIdSource')}<PendingFieldInfo pending={isPending('MAIN_BRANCH_SBR_ID_SOURCE')} /></Label>
            <Input className={inp('MAIN_BRANCH_SBR_ID_SOURCE')} value={sel('MAIN_BRANCH_SBR_ID_SOURCE')} onChange={(e) => set('MAIN_BRANCH_SBR_ID_SOURCE', e.target.value)} />
            <FieldErr msg={err('MAIN_BRANCH_SBR_ID_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.holdingCompanyFlg')}<PendingFieldInfo pending={isPending('HOLDING_COMPANY_FLG')} /></Label>
            <Input className={inp('HOLDING_COMPANY_FLG')} value={sel('HOLDING_COMPANY_FLG')} onChange={(e) => set('HOLDING_COMPANY_FLG', e.target.value)} />
            <FieldErr msg={err('HOLDING_COMPANY_FLG')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.holdingCompanyFlgSource')}<PendingFieldInfo pending={isPending('HOLDING_COMPANY_FLG_SOURCE')} /></Label>
            <Input className={inp('HOLDING_COMPANY_FLG_SOURCE')} value={sel('HOLDING_COMPANY_FLG_SOURCE')} onChange={(e) => set('HOLDING_COMPANY_FLG_SOURCE', e.target.value)} />
            <FieldErr msg={err('HOLDING_COMPANY_FLG_SOURCE')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.sourceCode')}<PendingFieldInfo pending={isPending('SOURCE_CODE')} /></Label>
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

          <SectionDivider title={t('editEstablishment.sections.registrationNumbers')} />
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.mociOrgId')}<PendingFieldInfo pending={isPending('MOCI_ORG_ID')} /></Label>
            <Input className={inp('MOCI_ORG_ID')} value={sel('MOCI_ORG_ID')} onChange={(e) => set('MOCI_ORG_ID', e.target.value)} />
            <FieldErr msg={err('MOCI_ORG_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.mociCrNum')}<PendingFieldInfo pending={isPending('MOCI_CR_NUM')} /></Label>
            <Input className={inp('MOCI_CR_NUM')} value={sel('MOCI_CR_NUM')} onChange={(e) => set('MOCI_CR_NUM', e.target.value)} />
            <FieldErr msg={err('MOCI_CR_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.mociCpNum')}<PendingFieldInfo pending={isPending('MOCI_CP_NUM')} /></Label>
            <Input className={inp('MOCI_CP_NUM')} value={sel('MOCI_CP_NUM')} onChange={(e) => set('MOCI_CP_NUM', e.target.value)} />
            <FieldErr msg={err('MOCI_CP_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qfcNumber')}<PendingFieldInfo pending={isPending('QFC_NUMBER')} /></Label>
            <Input className={inp('QFC_NUMBER')} value={sel('QFC_NUMBER')} onChange={(e) => set('QFC_NUMBER', e.target.value)} />
            <FieldErr msg={err('QFC_NUMBER')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qfzSourceId')}<PendingFieldInfo pending={isPending('QFZ_SOURCE_ID')} /></Label>
            <Input className={inp('QFZ_SOURCE_ID')} value={sel('QFZ_SOURCE_ID')} onChange={(e) => set('QFZ_SOURCE_ID', e.target.value)} />
            <FieldErr msg={err('QFZ_SOURCE_ID')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qstpRegNum')}<PendingFieldInfo pending={isPending('QSTP_REG_NUM')} /></Label>
            <Input className={inp('QSTP_REG_NUM')} value={sel('QSTP_REG_NUM')} onChange={(e) => set('QSTP_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qstpTaxRegNum')}<PendingFieldInfo pending={isPending('QSTP_TAX_REG_NUM')} /></Label>
            <Input className={inp('QSTP_TAX_REG_NUM')} value={sel('QSTP_TAX_REG_NUM')} onChange={(e) => set('QSTP_TAX_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_TAX_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.qstpParentRegNum')}<PendingFieldInfo pending={isPending('QSTP_PARENT_REG_NUM')} /></Label>
            <Input className={inp('QSTP_PARENT_REG_NUM')} value={sel('QSTP_PARENT_REG_NUM')} onChange={(e) => set('QSTP_PARENT_REG_NUM', e.target.value)} />
            <FieldErr msg={err('QSTP_PARENT_REG_NUM')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.farmNo')}<PendingFieldInfo pending={isPending('FARM_NO')} /></Label>
            <Input className={inp('FARM_NO')} value={sel('FARM_NO')} onChange={(e) => set('FARM_NO', e.target.value)} />
            <FieldErr msg={err('FARM_NO')} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.eid')}<PendingFieldInfo pending={isPending('EID')} /></Label>
            <Input className={inp('EID')} value={sel('EID')} onChange={(e) => set('EID', e.target.value)} />
            <FieldErr msg={err('EID')} />
          </div>

          <SectionDivider title={t('editEstablishment.sections.dates')} />
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.crIssueDate')}<PendingFieldInfo pending={isPending('CR_ISSUE_DATE')} /></Label>
            <Input type="date" className={inp('CR_ISSUE_DATE')} value={sel('CR_ISSUE_DATE').split('T')[0]} onChange={(e) => set('CR_ISSUE_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.crExpiryDate')}<PendingFieldInfo pending={isPending('CR_EXPIRY_DATE')} /></Label>
            <Input type="date" className={inp('CR_EXPIRY_DATE')} value={sel('CR_EXPIRY_DATE').split('T')[0]} onChange={(e) => set('CR_EXPIRY_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.crCancelDate')}<PendingFieldInfo pending={isPending('CR_CANCEL_DATE')} /></Label>
            <Input type="date" className={inp('CR_CANCEL_DATE')} value={sel('CR_CANCEL_DATE').split('T')[0]} onChange={(e) => set('CR_CANCEL_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.cpIssueDate')}<PendingFieldInfo pending={isPending('CP_ISSUE_DATE')} /></Label>
            <Input type="date" className={inp('CP_ISSUE_DATE')} value={sel('CP_ISSUE_DATE').split('T')[0]} onChange={(e) => set('CP_ISSUE_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.cpEndDate')}<PendingFieldInfo pending={isPending('CP_END_DATE')} /></Label>
            <Input type="date" className={inp('CP_END_DATE')} value={sel('CP_END_DATE').split('T')[0]} onChange={(e) => set('CP_END_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.cpCancelDate')}<PendingFieldInfo pending={isPending('CP_CANCEL_DATE')} /></Label>
            <Input type="date" className={inp('CP_CANCEL_DATE')} value={sel('CP_CANCEL_DATE').split('T')[0]} onChange={(e) => set('CP_CANCEL_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.regDate')}<PendingFieldInfo pending={isPending('REG_DATE')} /></Label>
            <Input type="date" className={inp('REG_DATE')} value={sel('REG_DATE').split('T')[0]} onChange={(e) => set('REG_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.regExpiryDate')}<PendingFieldInfo pending={isPending('REG_EXPIRY_DATE')} /></Label>
            <Input type="date" className={inp('REG_EXPIRY_DATE')} value={sel('REG_EXPIRY_DATE').split('T')[0]} onChange={(e) => set('REG_EXPIRY_DATE', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('editEstablishment.fields.regCancelDate')}<PendingFieldInfo pending={isPending('REG_CANCEL_DATE')} /></Label>
            <Input type="date" className={inp('REG_CANCEL_DATE')} value={sel('REG_CANCEL_DATE').split('T')[0]} onChange={(e) => set('REG_CANCEL_DATE', e.target.value)} />
          </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('actions.cancel')}</Button>
            <Button onClick={handleSubmit} loading={isLoading} style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }} className="text-white">{t('actions.saveChanges')}</Button>
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
