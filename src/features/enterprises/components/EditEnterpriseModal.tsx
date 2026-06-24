'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUpdateEnterpriseMutation } from '../api/enterprisesApi';
import { useGetEstablishmentsListQuery } from '@/features/establishments/api/establishmentsApi';
import { SECTOR_OPTIONS, EST_STATUS_OPTIONS } from '@/constants';
import { useDebounce } from '@/hooks';
import { toast } from '@/utils/toast';
import { nullableText } from '@/utils/format';
import { CommentDialog } from '@/components/common/CommentDialog';
import { Building2, X, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SbrEnterprise, EnterpriseEstablishment, SbrEstablishment } from '@/types';

interface EditEnterpriseModalProps {
  enterprise: SbrEnterprise;
  establishments: EnterpriseEstablishment[];
  open: boolean;
  onClose: () => void;
}

interface EstabRow {
  SBR_ID: number;
  NAME_ENU: string | null;
  MOCI_CR_NUM: string | null;
}

const SECTOR_CHOICES = SECTOR_OPTIONS.filter((o) => o.value);
const STATUS_CHOICES = EST_STATUS_OPTIONS.filter((o) => o.value);

export function EditEnterpriseModal({ enterprise, establishments, open, onClose }: EditEnterpriseModalProps) {
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [status, setStatus] = useState('');
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [added, setAdded] = useState<EstabRow[]>([]);
  const [search, setSearch] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  const [updateEnterprise, { isLoading }] = useUpdateEnterpriseMutation();
  const { t } = useTranslation();
  const mainSbrId = enterprise.MAIN_LEGAL_UNIT_SBR_ID;

  // Reset form whenever the modal (re)opens
  useEffect(() => {
    if (open) {
      setName(enterprise.NAME_ENU ?? '');
      setSector(enterprise.SECTOR_ID ?? '');
      setStatus(enterprise.STATUS ?? '');
      setRemoved(new Set());
      setAdded([]);
      setSearch('');
    }
  }, [open, enterprise]);

  const debouncedSearch = useDebounce(search, 400);
  const { data: searchData, isFetching: isSearching } = useGetEstablishmentsListQuery(
    { search: debouncedSearch, limit: 6, page: 1 },
    { skip: !open || !debouncedSearch }
  );

  // Current membership = original (minus removed) + added
  const currentRows: EstabRow[] = useMemo(() => {
    const kept = establishments
      .filter((e) => !removed.has(e.SBR_ID))
      .map((e) => ({ SBR_ID: e.SBR_ID, NAME_ENU: e.NAME_ENU, MOCI_CR_NUM: e.MOCI_CR_NUM }));
    return [...kept, ...added];
  }, [establishments, removed, added]);

  const memberIds = useMemo(() => new Set(currentRows.map((r) => r.SBR_ID)), [currentRows]);

  const searchResults: SbrEstablishment[] = (searchData?.data ?? []).filter((u) => !memberIds.has(u.SBR_ID));

  const hasChanges =
    name.trim() !== (enterprise.NAME_ENU ?? '').trim() ||
    sector !== (enterprise.SECTOR_ID ?? '') ||
    status !== (enterprise.STATUS ?? '') ||
    added.length > 0 ||
    removed.size > 0;

  const removeRow = (sbrId: number) => {
    // If it was a freshly added one, just drop it from `added`; otherwise mark removed
    if (added.some((a) => a.SBR_ID === sbrId)) {
      setAdded((prev) => prev.filter((a) => a.SBR_ID !== sbrId));
    } else {
      setRemoved((prev) => new Set(prev).add(sbrId));
    }
  };

  const addRow = (u: SbrEstablishment) => {
    setAdded((prev) => [...prev, { SBR_ID: u.SBR_ID, NAME_ENU: u.NAME_ENU, MOCI_CR_NUM: u.MOCI_CR_NUM }]);
    setSearch('');
  };

  const handleSubmit = () => {
    if (!hasChanges) {
      toast.info('No changes detected.');
      return;
    }
    setShowCommentDialog(true);
  };

  const handleConfirmWithComment = async (comment: string) => {
    try {
      await updateEnterprise({
        enterpriseId: enterprise.ENTERPRISE_ID,
        data: {
          NAME_ENU: name,
          SECTOR_ID: sector,
          STATUS: status,
          addEstablishmentSbrIds: added.map((a) => a.SBR_ID),
          removeEstablishmentSbrIds: Array.from(removed),
          comment,
        },
      }).unwrap();
      toast.success('Enterprise updated successfully!');
      setShowCommentDialog(false);
      onClose();
    } catch {
      toast.error('Failed to update enterprise. Please try again.');
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('enterpriseEdit.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Read-only identity row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('enterpriseEdit.enterpriseId')}</Label>
              <Input value={`ENT-${enterprise.ENTERPRISE_ID}`} disabled className="bg-slate-50 text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('enterpriseEdit.mainMociCr')}</Label>
              <Input value={enterprise.MAIN_CR ?? '—'} disabled className="bg-slate-50 text-slate-500" />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">{t('enterpriseEdit.enterpriseName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={500} className="focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40" />
          </div>

          {/* Sector + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('enterpriseEdit.sector')}</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder={t('enterpriseEdit.selectSector')} /></SelectTrigger>
                <SelectContent>
                  {SECTOR_CHOICES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">{t('enterpriseEdit.status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="shadow-none"><SelectValue placeholder={t('enterpriseEdit.selectStatus')} /></SelectTrigger>
                <SelectContent>
                  {STATUS_CHOICES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Establishments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('enterpriseEdit.establishments')}</Label>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{currentRows.length} {t('table.units')}</span>
            </div>

            <div className="space-y-2">
              {currentRows.map((r) => {
                const isMain = r.SBR_ID === mainSbrId;
                return (
                  <div key={r.SBR_ID} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                    <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{nullableText(r.NAME_ENU)}</p>
                      <p className="text-xs text-slate-400">CR {r.MOCI_CR_NUM ?? '—'} · #{r.SBR_ID}</p>
                    </div>
                    {isMain ? (
                      <Badge className="rounded-md bg-[#A71D3A] text-white text-[10px] font-bold">{t('enterpriseEdit.main')}</Badge>
                    ) : (
                      <>
                        <Badge variant="secondary" className="rounded-md text-[10px]">{t('enterpriseEdit.branch')}</Badge>
                        <button type="button" onClick={() => removeRow(r.SBR_ID)} className="text-slate-400 hover:text-red-600" title={t('enterpriseEdit.remove')}>
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add establishment */}
            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 space-y-2">
              <Label className="text-xs text-slate-500">{t('enterpriseEdit.addEstablishment')}</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('enterpriseEdit.searchPlaceholder')}
                  className="pl-8 bg-white focus:ring-1 focus:ring-[#A71D3A]/30 focus:border-[#A71D3A]/40"
                />
              </div>
              {debouncedSearch && (
                <div className="rounded-md border border-slate-200 bg-white">
                  {isSearching ? (
                    <p className="px-3 py-2 text-xs text-slate-400">{t('enterpriseEdit.searching')}</p>
                  ) : searchResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-400">{t('enterpriseEdit.noMatching')}</p>
                  ) : (
                    <ul className="max-h-44 overflow-y-auto">
                      {searchResults.map((u) => (
                        <li key={u.SBR_ID}>
                          <button
                            type="button"
                            onClick={() => addRow(u)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                          >
                            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-slate-800">{nullableText(u.NAME_ENU)}</span>
                              <span className="block text-xs text-slate-400">CR {u.MOCI_CR_NUM ?? '—'} · #{u.SBR_ID}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-400">{t('enterpriseEdit.searchHelper')}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('actions.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isLoading} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">{isLoading ? t('actions.saving') : t('actions.saveChanges')}</Button>
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
