'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateEnterpriseGroupMutation } from '../api/enterpriseGroupsApi';
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
import { Search, Building2, X } from 'lucide-react';
import type { SbrEnterprise } from '@/types';

interface CreateEnterpriseGroupModalProps {
  open:    boolean;
  onClose: () => void;
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

const EMPTY_FORM: FormState = {
  NAME_ENU:            '',
  NAME_ARA:            '',
  UCI_NAME:            '',
  UCI_TYPE:            '',
  UCI_COUNTRY:         '',
  UCI_ID:              '',
  ISIC_CODE:           '',
  ISIC_DESCRIPTION:    '',
  HOLDING_COMPANY_FLG: '',
  STATUS:              'Active',
};

const STATUS_CHOICES = ENTERPRISE_GROUP_STATUS_OPTIONS.filter((o) => o.value);

export function CreateEnterpriseGroupModal({ open, onClose }: CreateEnterpriseGroupModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<SbrEnterprise[]>([]);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [createGroup, { isLoading }] = useCreateEnterpriseGroupMutation();

  const debouncedMemberSearch = useDebounce(memberSearch, 400);
  const memberIds = useMemo(() => new Set(members.map((m) => m.ENTERPRISE_ID)), [members]);

  const { data: searchData, isFetching: isSearching } = useGetEnterprisesListQuery(
    { search: debouncedMemberSearch, limit: 6, page: 1, ungrouped: true },
    { skip: !open || !debouncedMemberSearch }
  );

  const searchResults = (searchData?.data ?? []).filter((e) => !memberIds.has(e.ENTERPRISE_ID));

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setMemberSearch('');
      setMembers([]);
      setShowCommentDialog(false);
    }
  }, [open]);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addMember = (enterprise: SbrEnterprise) => {
    setMembers((prev) => [...prev, enterprise]);
    setMemberSearch('');
  };

  const removeMember = (enterpriseId: number) =>
    setMembers((prev) => prev.filter((m) => m.ENTERPRISE_ID !== enterpriseId));

  const handleSubmit = () => {
    if (!form.NAME_ENU.trim() && !form.NAME_ARA.trim()) {
      toast.error('At least one group name (EN or AR) is required.');
      return;
    }
    if (members.length === 0) {
      toast.error('Add at least one member enterprise.');
      return;
    }
    setShowCommentDialog(true);
  };

  const handleConfirmWithComment = async (comment: string) => {
    try {
      await createGroup({
        NAME_ENU:            form.NAME_ENU.trim() || null,
        NAME_ARA:            form.NAME_ARA.trim() || null,
        UCI_NAME:            form.UCI_NAME.trim() || null,
        UCI_TYPE:            form.UCI_TYPE || null,
        UCI_COUNTRY:         form.UCI_COUNTRY.trim() || null,
        UCI_ID:              form.UCI_ID.trim() || null,
        ISIC_CODE:           form.ISIC_CODE.trim() || null,
        ISIC_DESCRIPTION:    form.ISIC_DESCRIPTION.trim() || null,
        HOLDING_COMPANY_FLG: form.HOLDING_COMPANY_FLG || null,
        STATUS:              form.STATUS || null,
        memberEnterpriseIds: members.map((m) => m.ENTERPRISE_ID),
        comment,
      }).unwrap();
      toast.success('Enterprise group creation submitted for approval.');
      setShowCommentDialog(false);
      onClose();
    } catch {
      toast.error('Failed to submit enterprise group. Please try again.');
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createEnterpriseGroup.title', { defaultValue: 'Create Enterprise Group' })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.nameEn', { defaultValue: 'Group name (EN)' })}</Label>
              <Input
                value={form.NAME_ENU}
                onChange={(e) => set('NAME_ENU', e.target.value)}
                maxLength={500}
                placeholder={t('createEnterpriseGroup.englishNamePlaceholder', { defaultValue: 'English name' })}
                className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.nameAr', { defaultValue: 'Group name (AR)' })}</Label>
              <Input
                value={form.NAME_ARA}
                onChange={(e) => set('NAME_ARA', e.target.value)}
                maxLength={500}
                dir="rtl"
                placeholder="الاسم بالعربية"
                className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40"
              />
            </div>
          </div>

          {/* UCI fields — no section header, just a subtle separator */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.uciName', { defaultValue: 'UCI name' })}</Label>
              <Input
                value={form.UCI_NAME}
                onChange={(e) => set('UCI_NAME', e.target.value)}
                maxLength={200}
                className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.uciType', { defaultValue: 'UCI type' })}</Label>
              <Select value={form.UCI_TYPE} onValueChange={(v) => set('UCI_TYPE', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder={t('editEnterpriseGroup.selectType', { defaultValue: 'Select type' })} /></SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_GROUP_UCI_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
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
              <Input
                value={form.UCI_ID}
                onChange={(e) => set('UCI_ID', e.target.value)}
                maxLength={100}
                className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40"
              />
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.isicCode', { defaultValue: 'ISIC code (2-digit)' })}</Label>
              <Input
                value={form.ISIC_CODE}
                onChange={(e) => set('ISIC_CODE', e.target.value)}
                maxLength={10}
                className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.isicDescription', { defaultValue: 'ISIC description' })}</Label>
              <Input
                value={form.ISIC_DESCRIPTION}
                onChange={(e) => set('ISIC_DESCRIPTION', e.target.value)}
                maxLength={200}
                className="shadow-none focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.holdingCompany', { defaultValue: 'Holding company' })}</Label>
              <Select value={form.HOLDING_COMPANY_FLG} onValueChange={(v) => set('HOLDING_COMPANY_FLG', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder={t('editEnterpriseGroup.yesNoPlaceholder', { defaultValue: 'Yes / No' })} /></SelectTrigger>
                <SelectContent>
                  {ENTERPRISE_GROUP_HOLDING_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('editEnterpriseGroup.status', { defaultValue: 'Status' })}</Label>
              <Select value={form.STATUS} onValueChange={(v) => set('STATUS', v)}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder={t('editEnterpriseGroup.selectStatus', { defaultValue: 'Select status' })} /></SelectTrigger>
                <SelectContent>
                  {STATUS_CHOICES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Member Enterprises */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">{t('editEnterpriseGroup.memberEnterprises', { defaultValue: 'Member Enterprises' })}</span>
              <span className="text-xs font-medium text-slate-500">{members.length}</span>
            </div>

            {members.length === 0 && (
              <p className="text-xs text-slate-400">{t('editEnterpriseGroup.addAtLeastOne', { defaultValue: 'Add at least one enterprise.' })}</p>
            )}

            {members.length > 0 && (
              <div className="space-y-1.5">
                {members.map((m, idx) => (
                  <div key={m.ENTERPRISE_ID} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-slate-500 mr-2">ENT-{m.ENTERPRISE_ID}</span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold bg-[#A71D3A] text-white rounded px-1 mr-1">HEAD</span>
                      )}
                      <span className="text-sm text-slate-800">{nullableText(m.NAME_ENU)}</span>
                    </div>
                    <button type="button" onClick={() => removeMember(m.ENTERPRISE_ID)} className="text-slate-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search box */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-xs text-slate-500 font-medium">{t('editEnterpriseGroup.addMember', { defaultValue: 'Add a member enterprise' })}</p>
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
                            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }}
            className="text-white"
          >
            {t('createEnterpriseGroup.createButton', { defaultValue: 'Create Group' })}
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
