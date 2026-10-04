'use client';

import { useState } from 'react';
import { useRouter } from '@/hooks/useAppRouter';
import { useTranslation } from 'react-i18next';
import { Camera, Building2, Orbit, Users, MapPin, Network, Loader2 } from 'lucide-react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { NoData } from '@/components/common/NoData';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { usePermission } from '@/hooks';
import { toast } from '@/utils/toast';
import { formatNumber } from '@/utils/format';
import type { SnapshotEntity } from '@/types';
import { useCreateSnapshotMutation, useGetSnapshotLiveCountsQuery } from '../api/snapshotsApi';
import { SNAPSHOT_DESCRIPTION_MAX_LENGTH, SNAPSHOT_ENTITIES, SNAPSHOT_NAME_MAX_LENGTH } from '../constants';

const ENTITY_ICON: Record<SnapshotEntity, typeof Building2> = {
  establishments: Building2,
  enterprises: Orbit,
  enterprise_groups: Network,
  contacts: Users,
  addresses: MapPin,
};

function apiMessage(error: unknown): string | undefined {
  const e = error as FetchBaseQueryError | undefined;
  return (e && 'data' in e ? (e.data as { message?: string } | undefined)?.message : undefined) ?? undefined;
}

export function CreateSnapshotPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { canCreate } = usePermission('snapshots');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Skipped without the permission — the shared API layer treats any 403 as a revoked session.
  const { data: countsRes, isLoading: countsLoading } = useGetSnapshotLiveCountsQuery(undefined, { skip: !canCreate });
  const [createSnapshot, { isLoading: creating }] = useCreateSnapshotMutation();
  const counts = countsRes?.data ?? null;

  if (!canCreate) {
    return (
      <PageContainer>
        <PageHeader title={t('snapshots.createTitle')} description={t('snapshots.createDescription')} />
        <div className="rounded-lg bg-white shadow-card overflow-hidden">
          <NoData message={t('snapshots.noCreatePermission', { defaultValue: 'You do not have permission to create snapshots.' })} />
        </div>
      </PageContainer>
    );
  }

  const handleFreezeClick = () => {
    if (!name.trim()) {
      setNameError(t('snapshots.nameRequired'));
      return;
    }
    setNameError('');
    setConfirmOpen(true);
  };

  const handleConfirmFreeze = async () => {
    try {
      await createSnapshot({ name: name.trim(), description: description.trim() || undefined }).unwrap();
      toast.success(t('snapshots.createSuccess', { name: name.trim() }));
      setConfirmOpen(false);
      router.push('/snapshots/browse');
    } catch (error) {
      // 400s aren't toasted by the shared API layer; other statuses already were.
      if ((error as FetchBaseQueryError)?.status === 400) {
        toast.error(apiMessage(error) ?? t('snapshots.createFailed', { defaultValue: 'The snapshot could not be created.' }));
      }
    }
  };

  const countText = (key: (typeof SNAPSHOT_ENTITIES)[number]['countKey']) => (counts ? formatNumber(counts[key]) : '—');

  return (
    <PageContainer>
      <PageHeader
        title={t('snapshots.createTitle')}
        description={t('snapshots.createDescription')}
      />

      <div className="rounded-lg bg-white shadow-card p-6 space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="snapshot-name">{t('snapshots.nameLabel')}</Label>
          <Input
            id="snapshot-name"
            value={name}
            maxLength={SNAPSHOT_NAME_MAX_LENGTH}
            onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
            placeholder={t('snapshots.namePlaceholder')}
            className={`shadow-none focus:border-[#A29374]/40 focus:ring-[#A29374]/20 ${nameError ? 'border-red-400' : ''}`}
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="snapshot-description">{t('snapshots.descriptionLabel')}</Label>
          <textarea
            id="snapshot-description"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#A29374]/20 focus:border-[#A29374]/40"
            rows={3}
            maxLength={SNAPSHOT_DESCRIPTION_MAX_LENGTH}
            placeholder={t('snapshots.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <p className="text-[12px] font-medium text-slate-500">{t('snapshots.captureCaption')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {SNAPSHOT_ENTITIES.map(({ entity, countKey, i18nKey, label, tone }) => {
              const Icon = ENTITY_ICON[entity];
              return (
                <div key={entity} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tone}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    {countsLoading
                      ? <Skeleton className="h-5 w-16" />
                      : <p className="text-lg font-semibold text-slate-900 leading-none tabular-nums">{countText(countKey)}</p>}
                    <p className="text-xs text-slate-500 mt-1 truncate">{t(i18nKey, { defaultValue: label })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleFreezeClick}
            disabled={countsLoading}
            style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }}
            className="text-white"
          >
            <Camera className="h-4 w-4 mr-1.5" />
            {t('snapshots.freezeButton')}
          </Button>
        </div>
      </div>

      {/* Locked while the copy runs: the request only returns once all five tables are frozen. */}
      <Dialog open={confirmOpen} onOpenChange={(o) => { if (!creating) setConfirmOpen(o); }}>
        <DialogContent className="max-w-md" onEscapeKeyDown={(e) => { if (creating) e.preventDefault(); }} onPointerDownOutside={(e) => { if (creating) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>{t('snapshots.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('snapshots.confirmDescription')}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-sm font-medium text-slate-800">{name.trim()}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('snapshots.confirmSummary', {
                establishments: countText('ESTABLISHMENT_COUNT'),
                enterprises: countText('ENTERPRISE_COUNT'),
                enterpriseGroups: countText('ENTERPRISE_GROUP_COUNT'),
                contacts: countText('CONTACT_COUNT'),
                addresses: countText('ADDRESS_COUNT'),
              })}
            </p>
          </div>
          {creating && (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-adaam" />
              {t('snapshots.freezing', { defaultValue: 'Copying all five tables — this can take a few seconds. Please keep this page open.' })}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={creating} onClick={() => setConfirmOpen(false)}>{t('actions.cancel')}</Button>
            <Button
              onClick={handleConfirmFreeze}
              loading={creating}
              style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }}
              className="text-white"
            >
              {!creating && <Camera className="h-4 w-4 mr-1.5" />}
              {creating ? t('snapshots.freezingButton', { defaultValue: 'Freezing…' }) : t('snapshots.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
