'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateEnterpriseGroupMutation } from '../api/enterpriseGroupsApi';
import { useGetEnterprisesListQuery } from '@/features/enterprises/api/enterprisesApi';
import {
  ENTERPRISE_GROUP_STATUS_OPTIONS,
  ENTERPRISE_GROUP_UCI_TYPE_OPTIONS,
  ENTERPRISE_GROUP_UCI_COUNTRY_OPTIONS,
  ENTERPRISE_GROUP_HOLDING_OPTIONS,
  ENTERPRISE_GROUP_FIELD_LABELS,
  formatGroupCode,
} from '../constants';
import { toast } from '@/utils/toast';
import { useDebounce } from '@/hooks';
import { nullableText } from '@/utils/format';
import { CommentDialog } from '@/components/common/CommentDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorSummary } from '@/components/common/ErrorSummary';
import { IsicCodeSelect } from '@/components/common/IsicCodeSelect';
import { Search, Orbit, X, Star } from 'lucide-react';
import type { SbrEnterpriseGroup, EnterpriseGroupMember } from '@/types';

interface EditEnterpriseGroupModalProps {
  group:            SbrEnterpriseGroup;
  currentMembers?:  EnterpriseGroupMember[];
  open:             boolean;
  onClose:          () => void;
}

interface FormState {
  NAME_ENU:              string;
  NAME_ARA:              string;
  UCI_NAME:              string;
  UCI_TYPE:              string;
  UCI_COUNTRY:           string;
  UCI_IDENTIFIER:        string;
  PRINCIPAL_ISIC_2DIGIT: string;
  HOLDING_COMPANY_FLG:   string;
  STATUS:                string;
  GROUP_START_DATE:      string;
}

interface MemberRow {
  ENTERPRISE_ID:      number;
  NAME_ENU:           string | null;
  ESTABLISHMENT_COUNT: number;
  STATUS:             string | null;
}

const STATUS_CHOICES = ENTERPRISE_GROUP_STATUS_OPTIONS.filter((o) => o.value);

// A group cannot start in the future — confirmed with the team lead (NPC-239). Recomputed per
// render rather than module-load time, so the cap stays correct across a session left open
// past midnight.
const todayISO = (): string => new Date().toISOString().slice(0, 10);

export function EditEnterpriseGroupModal({ group, currentMembers = [], open, onClose }: EditEnterpriseGroupModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>({
    NAME_ENU: '', NAME_ARA: '', UCI_NAME: '', UCI_TYPE: '',
    UCI_COUNTRY: '', UCI_IDENTIFIER: '', PRINCIPAL_ISIC_2DIGIT: '',
    HOLDING_COMPANY_FLG: '', STATUS: '', GROUP_START_DATE: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [memberSearch, setMemberSearch] = useState('');
  const [addedMembers, setAddedMembers] = useState<MemberRow[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
  const [headId, setHeadId] = useState<number | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [updateGroup, { isLoading }] = useUpdateEnterpriseGroupMutation();

  const debouncedMemberSearch = useDebounce(memberSearch, 400);

  const initialHeadId = useMemo(
    () => currentMembers.find((m) => m.IS_GROUP_HEAD)?.ENTERPRISE_ID ?? group.GROUP_HEAD_ENTERPRISE_ID ?? null,
    [currentMembers, group]
  );

  const currentRows: MemberRow[] = useMemo(() => {
    const kept = currentMembers
      .filter((m) => !removedIds.has(m.ENTERPRISE_ID))
      .map((m) => ({ ENTERPRISE_ID: m.ENTERPRISE_ID, NAME_ENU: m.NAME_ENU, ESTABLISHMENT_COUNT: m.ESTABLISHMENT_COUNT ?? 0, STATUS: m.STATUS }));
    return [...kept, ...addedMembers];
  }, [currentMembers, removedIds, addedMembers]);

  const memberIds = useMemo(() => new Set(currentRows.map((r) => r.ENTERPRISE_ID)), [currentRows]);

  const { data: searchData, isFetching: isSearching } = useGetEnterprisesListQuery(
    { search: debouncedMemberSearch, limit: 6, page: 1, ungrouped: true },
    { skip: !open || !debouncedMemberSearch }
  );

  // The `ungrouped: true` search only returns enterprises with no group at all — an enterprise
  // removed from THIS group a moment ago is still grouped in the database until Save Changes is
  // clicked, so the API correctly (from its point of view) excludes it too, and it becomes
  // unsearchable until the edit is saved (NPC-215). Since the modal already has this group's full
  // original membership via `currentMembers`, prepend any removed member whose name matches the
  // query — no extra request, and no backend change needed.
  const removedMemberSearchMatches: MemberRow[] = useMemo(() => {
    const q = debouncedMemberSearch.trim().toUpperCase();
    if (!q) return [];
    return currentMembers
      .filter((m) => removedIds.has(m.ENTERPRISE_ID) && (m.NAME_ENU ?? '').toUpperCase().includes(q))
      .map((m) => ({ ENTERPRISE_ID: m.ENTERPRISE_ID, NAME_ENU: m.NAME_ENU, ESTABLISHMENT_COUNT: m.ESTABLISHMENT_COUNT ?? 0, STATUS: m.STATUS }));
  }, [currentMembers, removedIds, debouncedMemberSearch]);

  const searchResults = [
    ...removedMemberSearchMatches,
    ...(searchData?.data ?? []).filter((e) => !removedMemberSearchMatches.some((r) => r.ENTERPRISE_ID === e.ENTERPRISE_ID)),
  ].filter((e) => !memberIds.has(e.ENTERPRISE_ID));

  useEffect(() => {
    if (open && group) {
      setForm({
        NAME_ENU:              group.NAME_ENU ?? '',
        NAME_ARA:              group.NAME_ARA ?? '',
        UCI_NAME:              group.UCI_NAME ?? '',
        UCI_TYPE:              group.UCI_TYPE ?? '',
        UCI_COUNTRY:           group.UCI_COUNTRY ?? '',
        UCI_IDENTIFIER:        group.UCI_IDENTIFIER ?? '',
        PRINCIPAL_ISIC_2DIGIT: group.PRINCIPAL_ISIC_2DIGIT ?? '',
        HOLDING_COMPANY_FLG:   group.HOLDING_COMPANY_FLG ?? '',
        STATUS:                group.STATUS ?? '',
        GROUP_START_DATE:      group.GROUP_START_DATE ? group.GROUP_START_DATE.slice(0, 10) : '',
      });
      setErrors({});
      setMemberSearch('');
      setAddedMembers([]);
      setRemovedIds(new Set());
      setHeadId(initialHeadId);
      setShowCommentDialog(false);
    }
  }, [open, group, initialHeadId]);

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // NAMES is one rule across the EN/AR pair, so typing in either clears it.
    const key = (field === 'NAME_ENU' || field === 'NAME_ARA') ? 'NAMES' : field;
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const addMember = (enterprise: { ENTERPRISE_ID: number; NAME_ENU: string | null; STATUS: string | null }) => {
    // Re-adding an enterprise removed earlier in this same (unsaved) session is a pure undo:
    // clear the removal instead of ALSO queuing it as a fresh add, or the submit payload would
    // send the same ID in both addMemberEnterpriseIds and removeMemberEnterpriseIds. Clearing
    // removedIds also restores the original currentMembers row (with its real ESTABLISHMENT_COUNT)
    // instead of re-adding it as a new member defaulted to 0.
    if (removedIds.has(enterprise.ENTERPRISE_ID)) {
      setRemovedIds((prev) => { const next = new Set(prev); next.delete(enterprise.ENTERPRISE_ID); return next; });
      setMemberSearch('');
      return;
    }
    setAddedMembers((prev) => [...prev, { ENTERPRISE_ID: enterprise.ENTERPRISE_ID, NAME_ENU: enterprise.NAME_ENU, ESTABLISHMENT_COUNT: 0, STATUS: enterprise.STATUS }]);
    setMemberSearch('');
  };

  const removeMember = (enterpriseId: number) => {
    if (addedMembers.some((a) => a.ENTERPRISE_ID === enterpriseId)) {
      setAddedMembers((prev) => prev.filter((a) => a.ENTERPRISE_ID !== enterpriseId));
    } else {
      setRemovedIds((prev) => new Set(prev).add(enterpriseId));
    }
    setHeadId((prev) => (prev === enterpriseId ? null : prev));
  };

  // Shared by hasChanges() and the submit payload builder below, so both agree on what
  // "changed" means field-by-field — never send a field to the backend that this same
  // normalization says is unchanged (see changedFields()).
  const normalize = (v: string | null | undefined) => (v == null ? '' : String(v).trim());
  const originalGroupStartDate = group.GROUP_START_DATE ? group.GROUP_START_DATE.slice(0, 10) : '';

  const hasChanges = (): boolean => {
    return (
      normalize(form.NAME_ENU) !== normalize(group.NAME_ENU) ||
      normalize(form.NAME_ARA) !== normalize(group.NAME_ARA) ||
      normalize(form.UCI_NAME) !== normalize(group.UCI_NAME) ||
      normalize(form.UCI_TYPE) !== normalize(group.UCI_TYPE) ||
      normalize(form.UCI_COUNTRY) !== normalize(group.UCI_COUNTRY) ||
      normalize(form.UCI_IDENTIFIER) !== normalize(group.UCI_IDENTIFIER) ||
      normalize(form.PRINCIPAL_ISIC_2DIGIT) !== normalize(group.PRINCIPAL_ISIC_2DIGIT) ||
      normalize(form.HOLDING_COMPANY_FLG) !== normalize(group.HOLDING_COMPANY_FLG) ||
      normalize(form.STATUS) !== normalize(group.STATUS) ||
      normalize(form.GROUP_START_DATE) !== normalize(originalGroupStartDate) ||
      addedMembers.length > 0 ||
      removedIds.size > 0 ||
      headId !== initialHeadId
    );
  };

  // Only the fields the user actually touched — never the full form. SBR_ENTERPRISE_GROUPS_API.
  // SUBMIT_UPDATE diffs whatever keys are PRESENT in the payload against the current stored row
  // and reports any string mismatch as a change; sending every field unconditionally (the
  // previous behaviour) made an untouched field appear as "changed" the moment its resubmitted
  // value didn't byte-for-byte match the stored value — the fixed bug (NPC-213): Holding Co. was
  // the only edit, but Group Start still showed up in the change request because the date value
  // round-tripped through the API and back with a different string representation than what is
  // stored. Now the field is simply never sent when unchanged, so no round-trip mismatch — of any
  // field, not just dates — can ever surface as a false change again.
  const changedFields = (): Partial<Record<keyof FormState, string | null>> => {
    const out: Partial<Record<keyof FormState, string | null>> = {};
    if (normalize(form.NAME_ENU) !== normalize(group.NAME_ENU)) out.NAME_ENU = form.NAME_ENU.trim() || null;
    if (normalize(form.NAME_ARA) !== normalize(group.NAME_ARA)) out.NAME_ARA = form.NAME_ARA.trim() || null;
    if (normalize(form.UCI_NAME) !== normalize(group.UCI_NAME)) out.UCI_NAME = form.UCI_NAME.trim() || null;
    if (normalize(form.UCI_TYPE) !== normalize(group.UCI_TYPE)) out.UCI_TYPE = form.UCI_TYPE || null;
    if (normalize(form.UCI_COUNTRY) !== normalize(group.UCI_COUNTRY)) out.UCI_COUNTRY = form.UCI_COUNTRY.trim() || null;
    if (normalize(form.UCI_IDENTIFIER) !== normalize(group.UCI_IDENTIFIER)) out.UCI_IDENTIFIER = form.UCI_IDENTIFIER.trim() || null;
    if (normalize(form.PRINCIPAL_ISIC_2DIGIT) !== normalize(group.PRINCIPAL_ISIC_2DIGIT)) out.PRINCIPAL_ISIC_2DIGIT = form.PRINCIPAL_ISIC_2DIGIT.trim() || null;
    if (normalize(form.HOLDING_COMPANY_FLG) !== normalize(group.HOLDING_COMPANY_FLG)) out.HOLDING_COMPANY_FLG = form.HOLDING_COMPANY_FLG || null;
    if (normalize(form.STATUS) !== normalize(group.STATUS)) out.STATUS = form.STATUS || null;
    if (normalize(form.GROUP_START_DATE) !== normalize(originalGroupStartDate)) out.GROUP_START_DATE = form.GROUP_START_DATE || null;
    return out;
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.NAME_ENU.trim() && !form.NAME_ARA.trim()) {
      e.NAMES = t('editEnterpriseGroup.nameRequired', { defaultValue: 'Enter a group name in English or Arabic.' });
    }
    if (!form.UCI_NAME.trim()) {
      e.UCI_NAME = t('editEnterpriseGroup.uciNameRequired', { defaultValue: 'UCI name is required.' });
    }
    if (form.GROUP_START_DATE && form.GROUP_START_DATE > todayISO()) {
      e.GROUP_START_DATE = t('editEnterpriseGroup.startDateFuture', { defaultValue: 'Group start date cannot be in the future.' });
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (!hasChanges()) {
      toast.info(t('common.noChangesDetected', { defaultValue: 'No changes detected.' }));
      return;
    }
    if (currentRows.length === 0) {
      toast.error(t('editEnterpriseGroup.addAtLeastOne', { defaultValue: 'Add at least one enterprise.' }));
      return;
    }
    if (headId == null || !currentRows.some((m) => m.ENTERPRISE_ID === headId)) {
      toast.error(t('editEnterpriseGroup.headRequired', { defaultValue: 'Mark one member enterprise as the group head.' }));
      return;
    }
    setShowCommentDialog(true);
  };

  const handleConfirmWithComment = async (comment: string) => {
    try {
      await updateGroup({
        id: group.ID,
        data: {
          ...changedFields(),
          // Same principle for the head: only send it when it actually changed. When omitted,
          // SUBMIT_UPDATE falls back to the current stored head for its "head must remain a
          // member" validation, so a membership-only edit is still validated correctly.
          ...(headId !== initialHeadId ? { GROUP_HEAD_ENTERPRISE_ID: headId } : {}),
          addMemberEnterpriseIds:     addedMembers.map((m) => m.ENTERPRISE_ID),
          removeMemberEnterpriseIds:  Array.from(removedIds),
          comment,
        },
      }).unwrap();
      toast.success(t('editEnterpriseGroup.updateSuccess', { defaultValue: 'Enterprise group update submitted for approval.' }));
      setShowCommentDialog(false);
      onClose();
    } catch {
      toast.error(t('editEnterpriseGroup.updateError', { defaultValue: 'Failed to submit enterprise group update. Please try again.' }));
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-slate-100 shrink-0">
          <DialogTitle>
            {t('editEnterpriseGroup.title', { defaultValue: 'Edit Enterprise Group' })} — {formatGroupCode(group.ENTERPRISE_GROUP_ID)}
          </DialogTitle>
        </DialogHeader>

        {Object.keys(errors).length > 0 && (
          <div className="px-6 pt-3 shrink-0">
            <ErrorSummary errors={errors} fieldLabels={ENTERPRISE_GROUP_FIELD_LABELS} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.nameEn', { defaultValue: 'Group name (EN)' })}</Label>
              <Input
                value={form.NAME_ENU}
                onChange={(e) => set('NAME_ENU', e.target.value)}
                maxLength={500}
                className={`shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40 ${errors.NAMES ? 'border-red-400' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.nameAr', { defaultValue: 'Group name (AR)' })}</Label>
              <Input
                value={form.NAME_ARA}
                onChange={(e) => set('NAME_ARA', e.target.value)}
                maxLength={500}
                dir="rtl"
                className={`shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40 ${errors.NAMES ? 'border-red-400' : ''}`}
              />
            </div>
            {errors.NAMES && <p className="col-span-2 text-xs text-red-500 -mt-2">{errors.NAMES}</p>}
          </div>

          {/* UCI fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.uciName', { defaultValue: 'UCI name' })}</Label>
              <Input
                value={form.UCI_NAME}
                onChange={(e) => set('UCI_NAME', e.target.value)}
                maxLength={200}
                className={`shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40 ${errors.UCI_NAME ? 'border-red-400' : ''}`}
              />
              {errors.UCI_NAME && <p className="text-xs text-red-500 mt-0.5">{errors.UCI_NAME}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.uciType', { defaultValue: 'UCI type' })}</Label>
              <Select value={form.UCI_TYPE} onValueChange={(v) => set('UCI_TYPE', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder={t('editEnterpriseGroup.selectType', { defaultValue: 'Select type' })} /></SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_GROUP_UCI_TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.uciCountry', { defaultValue: 'UCI country' })}</Label>
              <Select value={form.UCI_COUNTRY} onValueChange={(v) => set('UCI_COUNTRY', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder={t('editEnterpriseGroup.selectCountry', { defaultValue: 'Select country' })} /></SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_GROUP_UCI_COUNTRY_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.uciId', { defaultValue: 'UCI ID' })}</Label>
              <Input value={form.UCI_IDENTIFIER} onChange={(e) => set('UCI_IDENTIFIER', e.target.value)} maxLength={100} className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40" />
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.isicCode', { defaultValue: 'ISIC code (2-digit)' })}</Label>
              <IsicCodeSelect
                value={form.PRINCIPAL_ISIC_2DIGIT}
                onChange={(code) => set('PRINCIPAL_ISIC_2DIGIT', code)}
                digitMode="lvl2"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.holdingCompany', { defaultValue: 'Holding company' })}</Label>
              <Select value={form.HOLDING_COMPANY_FLG} onValueChange={(v) => set('HOLDING_COMPANY_FLG', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder={t('editEnterpriseGroup.yesNoPlaceholder', { defaultValue: 'Yes / No' })} /></SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_GROUP_HOLDING_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.status', { defaultValue: 'Status' })}</Label>
              <Select value={form.STATUS} onValueChange={(v) => set('STATUS', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder={t('editEnterpriseGroup.selectStatus', { defaultValue: 'Select status' })} /></SelectTrigger>
                <SelectContent>
                  {STATUS_CHOICES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.groupStartDate', { defaultValue: 'Group start date' })}</Label>
              <Input
                type="date"
                value={form.GROUP_START_DATE}
                max={todayISO()}
                onChange={(e) => set('GROUP_START_DATE', e.target.value)}
                className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40"
              />
            </div>
          </div>

          {/* Member Enterprises */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">{t('editEnterpriseGroup.memberEnterprises', { defaultValue: 'Member Enterprises' })}</span>
              <span className="text-xs font-medium text-slate-500">{currentRows.length}</span>
            </div>

            {currentRows.length > 0 && (
              <>
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Star className="h-3.5 w-3.5 text-[#A71D3A]" />
                {t('editEnterpriseGroup.markHeadHint', { defaultValue: 'Click the star to mark the group head.' })}
              </p>
              <div className="space-y-1.5">
                {currentRows.map((m) => {
                  const isHead = headId === m.ENTERPRISE_ID;
                  return (
                  <div
                    key={m.ENTERPRISE_ID}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                      isHead ? 'border-[#A71D3A]/40 bg-[#A71D3A]/5' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setHeadId(m.ENTERPRISE_ID)}
                      title={t('editEnterpriseGroup.markAsHead', { defaultValue: 'Mark as group head' })}
                      aria-label={t('editEnterpriseGroup.markAsHead', { defaultValue: 'Mark as group head' })}
                      className="shrink-0"
                    >
                      <Star className={`h-4 w-4 transition-colors ${isHead ? 'fill-[#A71D3A] text-[#A71D3A]' : 'text-slate-300 hover:text-[#A71D3A]'}`} />
                    </button>
                    <Orbit className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {nullableText(m.NAME_ENU)}
                        {isHead && (
                          <span className="ml-2 align-middle text-[10px] font-bold bg-[#A71D3A] text-white rounded-md px-1">
                            {t('editEnterpriseGroup.headBadge', { defaultValue: 'HEAD' })}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ENT-{m.ENTERPRISE_ID} · {m.ESTABLISHMENT_COUNT} establishment{m.ESTABLISHMENT_COUNT !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <StatusBadge status={m.STATUS} className="shrink-0 text-[10px]" />
                    <button type="button" onClick={() => removeMember(m.ENTERPRISE_ID)} className="text-slate-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  );
                })}
              </div>
              </>
            )}

            {currentRows.length === 0 && (
              <p className="text-xs text-slate-400">{t('editEnterpriseGroup.addAtLeastOne', { defaultValue: 'Add at least one enterprise.' })}</p>
            )}

            {/* Search box */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                {t('editEnterpriseGroup.addMember', { defaultValue: 'Add a member enterprise' })}
              </p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder={t('editEnterpriseGroup.searchPlaceholder', { defaultValue: 'Search enterprises by name or ENT ID...' })}
                  className="pl-8 shadow-none bg-white focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40"
                />
              </div>
              {debouncedMemberSearch && (
                <div className="rounded-md border border-slate-200 bg-white max-h-44 overflow-y-auto">
                  {isSearching ? (
                    <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>
                  ) : searchResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-400">No matching enterprises.</p>
                  ) : (
                    <ul>
                      {searchResults.map((e) => (
                        <li key={e.ENTERPRISE_ID}>
                          <button
                            type="button"
                            onClick={() => addMember(e)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                          >
                            <Orbit className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm text-slate-800">{nullableText(e.NAME_ENU)}</span>
                              <span className="block text-xs text-slate-400">ENT-{e.ENTERPRISE_ID}</span>
                            </span>
                            <StatusBadge status={e.STATUS} className="shrink-0 text-[10px]" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
            className="text-white"
          >
            {t('actions.saveChanges', { defaultValue: 'Save Changes' })}
          </Button>
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
