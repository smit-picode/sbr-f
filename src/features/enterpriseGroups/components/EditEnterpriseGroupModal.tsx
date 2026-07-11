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
} from '../constants';
import { toast } from '@/utils/toast';
import { useDebounce } from '@/hooks';
import { nullableText } from '@/utils/format';
import { CommentDialog } from '@/components/common/CommentDialog';
import { Search, Orbit, X } from 'lucide-react';
import type { SbrEnterpriseGroup, EnterpriseGroupMember } from '@/types';

interface EditEnterpriseGroupModalProps {
  group:            SbrEnterpriseGroup;
  currentMembers?:  EnterpriseGroupMember[];
  open:             boolean;
  onClose:          () => void;
}

interface FormState {
  NAME_ENU:            string;
  NAME_ARA:            string;
  UCI_NAME:            string;
  UCI_TYPE:            string;
  UCI_COUNTRY:         string;
  UCI_ID:              string;
  ISIC_CODE:           string;
  ISIC_DESCRIPTION:    string;
  HOLDING_COMPANY_FLG: string;
  STATUS:              string;
}

interface MemberRow {
  ENTERPRISE_ID:      number;
  NAME_ENU:           string | null;
  ESTABLISHMENT_COUNT: number;
}

const STATUS_CHOICES = ENTERPRISE_GROUP_STATUS_OPTIONS.filter((o) => o.value);

export function EditEnterpriseGroupModal({ group, currentMembers = [], open, onClose }: EditEnterpriseGroupModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>({
    NAME_ENU: '', NAME_ARA: '', UCI_NAME: '', UCI_TYPE: '',
    UCI_COUNTRY: '', UCI_ID: '', ISIC_CODE: '', ISIC_DESCRIPTION: '',
    HOLDING_COMPANY_FLG: '', STATUS: '',
  });
  const [memberSearch, setMemberSearch] = useState('');
  const [addedMembers, setAddedMembers] = useState<MemberRow[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [updateGroup, { isLoading }] = useUpdateEnterpriseGroupMutation();

  const debouncedMemberSearch = useDebounce(memberSearch, 400);

  const currentRows: MemberRow[] = useMemo(() => {
    const kept = currentMembers
      .filter((m) => !removedIds.has(m.ENTERPRISE_ID))
      .map((m) => ({ ENTERPRISE_ID: m.ENTERPRISE_ID, NAME_ENU: m.NAME_ENU, ESTABLISHMENT_COUNT: m.ESTABLISHMENT_COUNT ?? 0 }));
    return [...kept, ...addedMembers];
  }, [currentMembers, removedIds, addedMembers]);

  const memberIds = useMemo(() => new Set(currentRows.map((r) => r.ENTERPRISE_ID)), [currentRows]);

  const { data: searchData, isFetching: isSearching } = useGetEnterprisesListQuery(
    { search: debouncedMemberSearch, limit: 6, page: 1, ungrouped: true },
    { skip: !open || !debouncedMemberSearch }
  );

  const searchResults = (searchData?.data ?? []).filter((e) => !memberIds.has(e.ENTERPRISE_ID));

  useEffect(() => {
    if (open && group) {
      setForm({
        NAME_ENU:            group.NAME_ENU ?? '',
        NAME_ARA:            group.NAME_ARA ?? '',
        UCI_NAME:            group.UCI_NAME ?? '',
        UCI_TYPE:            group.UCI_TYPE ?? '',
        UCI_COUNTRY:         group.UCI_COUNTRY ?? '',
        UCI_ID:              group.UCI_ID ?? '',
        ISIC_CODE:           group.ISIC_CODE ?? '',
        ISIC_DESCRIPTION:    group.ISIC_DESCRIPTION ?? '',
        HOLDING_COMPANY_FLG: group.HOLDING_COMPANY_FLG ?? '',
        STATUS:              group.STATUS ?? '',
      });
      setMemberSearch('');
      setAddedMembers([]);
      setRemovedIds(new Set());
      setShowCommentDialog(false);
    }
  }, [open, group]);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addMember = (enterprise: { ENTERPRISE_ID: number; NAME_ENU: string | null }) => {
    setAddedMembers((prev) => [...prev, { ENTERPRISE_ID: enterprise.ENTERPRISE_ID, NAME_ENU: enterprise.NAME_ENU, ESTABLISHMENT_COUNT: 0 }]);
    setMemberSearch('');
  };

  const removeMember = (enterpriseId: number) => {
    if (addedMembers.some((a) => a.ENTERPRISE_ID === enterpriseId)) {
      setAddedMembers((prev) => prev.filter((a) => a.ENTERPRISE_ID !== enterpriseId));
    } else {
      setRemovedIds((prev) => new Set(prev).add(enterpriseId));
    }
  };

  const hasChanges = (): boolean => {
    const n = (v: string | null | undefined) => (v == null ? '' : String(v).trim());
    return (
      n(form.NAME_ENU) !== n(group.NAME_ENU) ||
      n(form.NAME_ARA) !== n(group.NAME_ARA) ||
      n(form.UCI_NAME) !== n(group.UCI_NAME) ||
      n(form.UCI_TYPE) !== n(group.UCI_TYPE) ||
      n(form.UCI_COUNTRY) !== n(group.UCI_COUNTRY) ||
      n(form.UCI_ID) !== n(group.UCI_ID) ||
      n(form.ISIC_CODE) !== n(group.ISIC_CODE) ||
      n(form.ISIC_DESCRIPTION) !== n(group.ISIC_DESCRIPTION) ||
      n(form.HOLDING_COMPANY_FLG) !== n(group.HOLDING_COMPANY_FLG) ||
      n(form.STATUS) !== n(group.STATUS) ||
      addedMembers.length > 0 ||
      removedIds.size > 0
    );
  };

  const handleSubmit = () => {
    if (!hasChanges()) {
      toast.info('No changes detected.');
      return;
    }
    setShowCommentDialog(true);
  };

  const handleConfirmWithComment = async (comment: string) => {
    try {
      await updateGroup({
        id: group.ID,
        data: {
          NAME_ENU:                   form.NAME_ENU.trim() || null,
          NAME_ARA:                   form.NAME_ARA.trim() || null,
          UCI_NAME:                   form.UCI_NAME.trim() || null,
          UCI_TYPE:                   form.UCI_TYPE || null,
          UCI_COUNTRY:                form.UCI_COUNTRY.trim() || null,
          UCI_ID:                     form.UCI_ID.trim() || null,
          ISIC_CODE:                  form.ISIC_CODE.trim() || null,
          ISIC_DESCRIPTION:           form.ISIC_DESCRIPTION.trim() || null,
          HOLDING_COMPANY_FLG:        form.HOLDING_COMPANY_FLG || null,
          STATUS:                     form.STATUS || null,
          addMemberEnterpriseIds:     addedMembers.map((m) => m.ENTERPRISE_ID),
          removeMemberEnterpriseIds:  Array.from(removedIds),
          comment,
        },
      }).unwrap();
      toast.success('Enterprise group update submitted for approval.');
      setShowCommentDialog(false);
      onClose();
    } catch {
      toast.error('Failed to submit enterprise group update. Please try again.');
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <DialogTitle>
            {t('editEnterpriseGroup.title', { defaultValue: 'Edit Enterprise Group' })} — {group.GROUP_ID}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Group name (EN)</Label>
              <Input value={form.NAME_ENU} onChange={(e) => set('NAME_ENU', e.target.value)} maxLength={500} className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Group name (AR)</Label>
              <Input value={form.NAME_ARA} onChange={(e) => set('NAME_ARA', e.target.value)} maxLength={500} dir="rtl" className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40" />
            </div>
          </div>

          {/* UCI fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-slate-500">UCI name</Label>
              <Input value={form.UCI_NAME} onChange={(e) => set('UCI_NAME', e.target.value)} maxLength={200} className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">UCI type</Label>
              <Select value={form.UCI_TYPE} onValueChange={(v) => set('UCI_TYPE', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_GROUP_UCI_TYPE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">UCI country</Label>
              <Select value={form.UCI_COUNTRY} onValueChange={(v) => set('UCI_COUNTRY', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_GROUP_UCI_COUNTRY_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-slate-500">UCI ID</Label>
              <Input value={form.UCI_ID} onChange={(e) => set('UCI_ID', e.target.value)} maxLength={100} className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40" />
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">ISIC code (2-digit)</Label>
              <Input value={form.ISIC_CODE} onChange={(e) => set('ISIC_CODE', e.target.value)} maxLength={10} className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">ISIC description</Label>
              <Input value={form.ISIC_DESCRIPTION} onChange={(e) => set('ISIC_DESCRIPTION', e.target.value)} maxLength={200} className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Holding company</Label>
              <Select value={form.HOLDING_COMPANY_FLG} onValueChange={(v) => set('HOLDING_COMPANY_FLG', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder="Yes / No" /></SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_GROUP_HOLDING_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Status</Label>
              <Select value={form.STATUS} onValueChange={(v) => set('STATUS', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_CHOICES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Member Enterprises */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Member Enterprises</span>
              <span className="text-xs font-medium text-slate-500">{currentRows.length}</span>
            </div>

            {currentRows.length > 0 && (
              <div className="space-y-1.5">
                {currentRows.map((m) => (
                  <div key={m.ENTERPRISE_ID} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5">
                    <Orbit className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{nullableText(m.NAME_ENU)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ENT-{m.ENTERPRISE_ID} · {m.ESTABLISHMENT_COUNT} establishment{m.ESTABLISHMENT_COUNT !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeMember(m.ENTERPRISE_ID)} className="text-slate-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {currentRows.length === 0 && (
              <p className="text-xs text-slate-400">No member enterprises.</p>
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
