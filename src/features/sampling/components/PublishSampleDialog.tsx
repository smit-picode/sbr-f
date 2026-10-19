'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/utils/toast';
import { formatNumber } from '@/utils/format';
import type { SamplingDesign, SamplingPublishRequest } from '@/types';
import { useGetSamplePublishAccountsQuery, usePublishSampleMutation } from '../api/samplingApi';
import { SAMPLING_PUBLISH_MAX_DESCRIPTION, SAMPLING_PUBLISH_MAX_NAME } from '../constants';
import { SampleAccountPicker } from './SampleAccountPicker';

const SOFT_RING = 'focus:border-[#A29374]/40 focus:ring-[#A29374]/20';

// Publishes the on screen sample: the server redraws it and keeps it for the chosen accounts.
export function PublishSampleDialog({ open, onClose, request, design, unitCount }: {
  open: boolean;
  onClose: () => void;
  request: SamplingPublishRequest;
  design: SamplingDesign;
  unitCount: number;
}) {
  const { t } = useTranslation();
  const accountsQuery = useGetSamplePublishAccountsQuery(undefined, { skip: !open });
  const [publish, { isLoading }] = usePublishSampleMutation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accountIds, setAccountIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setAccountIds([]);
    setError('');
  }, [open]);

  const handlePublish = async () => {
    if (!name.trim()) {
      setError(t('sampling.publish.nameRequired', { defaultValue: 'A name is required.' }));
      return;
    }
    try {
      await publish({ name: name.trim(), description: description.trim() || undefined, request, design, accountIds }).unwrap();
      toast.success(t('sampling.publish.done', { defaultValue: 'Sample published to {{count}} accounts.', count: accountIds.length }));
      onClose();
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? t('sampling.publish.failed', { defaultValue: 'The sample could not be published.' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isLoading) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('sampling.publish.title', { defaultValue: 'Publish sample' })}</DialogTitle>
          <DialogDescription>
            {t('sampling.publish.subtitle', {
              defaultValue: 'The {{count}} units on screen, with their establishments and contacts, are kept as they are now. The accounts you choose fetch them through the integration API.',
              count: formatNumber(unitCount),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="publish-name">{t('sampling.publish.name', { defaultValue: 'Name' })}</Label>
            <Input id="publish-name" value={name} maxLength={SAMPLING_PUBLISH_MAX_NAME} className={SOFT_RING}
              placeholder={t('sampling.publish.namePlaceholder', { defaultValue: 'e.g. AES 2025 main sample' })}
              onChange={(e) => { setName(e.target.value); setError(''); }} />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="publish-description">{t('sampling.publish.description', { defaultValue: 'Description' })}</Label>
            <Input id="publish-description" value={description} maxLength={SAMPLING_PUBLISH_MAX_DESCRIPTION} className={SOFT_RING}
              placeholder={t('sampling.publish.descriptionPlaceholder', { defaultValue: 'Survey, wave, anything the receiving team should know' })}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('sampling.publish.accounts', { defaultValue: 'Share with' })}</Label>
            {accountsQuery.isLoading
              ? <div className="flex gap-1.5"><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-28 rounded-full" /></div>
              : <SampleAccountPicker accounts={accountsQuery.data?.data ?? []} value={accountIds} onChange={setAccountIds} />}
            <p className="text-xs text-slate-400">
              {t('sampling.publish.accountsHint', { defaultValue: 'You can change who it is shared with later, under Published samples.' })}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button onClick={handlePublish} loading={isLoading} className="text-white"
            style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }}>
            {t('sampling.publish.confirm', { defaultValue: 'Publish' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
