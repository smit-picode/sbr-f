'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { toast } from '@/utils/toast';
import { formatDate, formatNumber, nullableText } from '@/utils/format';
import type { PublishedSample } from '@/types';
import {
  useGetPublishedSamplesQuery, useGetSamplePublishAccountsQuery, useSetPublishedSampleAccountsMutation, useWithdrawPublishedSampleMutation,
} from '../api/samplingApi';
import { unitLabel } from '../utils/labels';
import { SampleAccountPicker } from './SampleAccountPicker';

const errorMessage = (e: unknown): string | undefined => (e as { data?: { message?: string } } | undefined)?.data?.message;

function SampleRow({ sample }: { sample: PublishedSample }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'view' | 'share' | 'withdraw'>('view');
  const [accountIds, setAccountIds] = useState<number[]>([]);
  const accountsQuery = useGetSamplePublishAccountsQuery(undefined, { skip: mode !== 'share' });
  const [setAccounts, { isLoading: isSharing }] = useSetPublishedSampleAccountsMutation();
  const [withdraw, { isLoading: isWithdrawing }] = useWithdrawPublishedSampleMutation();
  const withdrawn = !!sample.withdrawnAt;
  const current = sample.accounts.map((a) => a.id);

  const startSharing = () => {
    setAccountIds(current);
    setMode('share');
  };

  const saveSharing = async () => {
    if ([...accountIds].sort().join(',') === [...current].sort().join(',')) {
      toast.info(t('common.noChangesDetected', { defaultValue: 'No changes detected.' }));
      return;
    }
    try {
      await setAccounts({ id: sample.id, accountIds }).unwrap();
      toast.success(t('sampling.published.shared', { defaultValue: 'Sharing updated.' }));
      setMode('view');
    } catch (err) {
      toast.error(errorMessage(err) ?? t('sampling.published.shareFailed', { defaultValue: 'Sharing could not be updated.' }));
    }
  };

  const confirmWithdraw = async () => {
    try {
      await withdraw(sample.id).unwrap();
      toast.success(t('sampling.published.withdrawn', { defaultValue: 'Sample withdrawn. No account can fetch it any more.' }));
      setMode('view');
    } catch (err) {
      toast.error(errorMessage(err) ?? t('sampling.published.withdrawFailed', { defaultValue: 'The sample could not be withdrawn.' }));
    }
  };

  return (
    <li className={`rounded-lg border border-slate-200 p-3 ${withdrawn ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{sample.name}</span>
            {withdrawn && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {t('sampling.published.withdrawnBadge', { defaultValue: 'Withdrawn' })}
              </span>
            )}
          </div>
          {sample.description && <p className="mt-0.5 text-xs text-slate-500">{sample.description}</p>}
          <p className="mt-1 text-xs text-slate-500">
            {t('sampling.published.meta', {
              defaultValue: '{{units}} {{unit}} ({{main}} main, {{reserve}} reserve), {{contacts}} contacts, from {{frame}}, seed {{seed}}',
              units: formatNumber(sample.counts.units), unit: unitLabel(t, sample.unit), main: formatNumber(sample.counts.main),
              reserve: formatNumber(sample.counts.reserve), contacts: formatNumber(sample.counts.contacts),
              frame: sample.frame ? (sample.frame.name ?? `#${sample.frame.snapshotId}`) : t('sampling.liveRegister', { defaultValue: 'Live register' }),
              seed: sample.seed,
            })}
          </p>
          <p className="text-xs text-slate-400">
            {t('sampling.published.by', { defaultValue: 'Published {{date}} by {{who}}', date: formatDate(sample.publishedAt), who: nullableText(sample.publishedBy) })}
          </p>
        </div>
        {!withdrawn && mode === 'view' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={startSharing}>
              <Share2 className="h-3.5 w-3.5" />{t('sampling.published.share', { defaultValue: 'Sharing' })}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-red-600" onClick={() => setMode('withdraw')}>
              <Trash2 className="h-3.5 w-3.5" />{t('sampling.published.withdraw', { defaultValue: 'Withdraw' })}
            </Button>
          </div>
        )}
      </div>

      {mode === 'view' && !withdrawn && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500">{t('sampling.published.sharedWith', { defaultValue: 'Shared with:' })}</span>
          {sample.accounts.length === 0
            ? <span className="text-slate-400">{t('sampling.published.nobody', { defaultValue: 'no account yet' })}</span>
            : sample.accounts.map((a) => <span key={a.id} className="rounded-full bg-[#F4F0E8] px-2 py-0.5 text-[#87795D]">{a.name}</span>)}
        </div>
      )}

      {mode === 'share' && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          {accountsQuery.isLoading
            ? <div className="flex gap-1.5"><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-28 rounded-full" /></div>
            : <SampleAccountPicker accounts={accountsQuery.data?.data ?? []} value={accountIds} onChange={setAccountIds} />}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode('view')} disabled={isSharing}>{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button size="sm" onClick={saveSharing} loading={isSharing} className="text-white"
              style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }}>
              {t('actions.saveChanges', { defaultValue: 'Save changes' })}
            </Button>
          </div>
        </div>
      )}

      {mode === 'withdraw' && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-600">
            {t('sampling.published.withdrawConfirm', { defaultValue: 'Withdraw for good? No account will be able to fetch it, and it cannot be shared again.' })}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode('view')} disabled={isWithdrawing}>{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button variant="destructive" size="sm" onClick={confirmWithdraw} loading={isWithdrawing}>
              {t('sampling.published.withdraw', { defaultValue: 'Withdraw' })}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

// Every sample published to system accounts, newest first, with who can fetch it.
export function PublishedSamplesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const query = useGetPublishedSamplesQuery(undefined, { skip: !open });
  const samples = query.data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('sampling.published.title', { defaultValue: 'Published samples' })}</DialogTitle>
          <DialogDescription>
            {t('sampling.published.subtitle', { defaultValue: 'Samples kept for system accounts to fetch through the integration API.' })}
          </DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : samples.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            {t('sampling.published.empty', { defaultValue: 'Nothing published yet. Draw a sample, then use Publish.' })}
          </p>
        ) : (
          <ul className="space-y-2">{samples.map((s) => <SampleRow key={s.id} sample={s} />)}</ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
