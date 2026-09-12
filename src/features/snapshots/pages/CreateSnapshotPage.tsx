'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Camera, Building2, Orbit, Users, MapPin } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { createSnapshot } from '../store/snapshotsSlice';
import { LIVE_COUNTS } from '../mockData';
import { toast } from '@/utils/toast';

export function CreateSnapshotPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const frozenBy = useAppSelector((s) => s.auth.user?.email) ?? '—';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Each stat keeps a distinct hue (matching the reference mockup) rather than one uniform
  // tint, so the four core tables read as separate categories at a glance. Colors drawn
  // from the project's documented palette (slate/blue/emerald/red/amber) only.
  const stats = [
    { key: 'establishments', icon: Building2, count: LIVE_COUNTS.establishments, label: t('nav.establishments', { defaultValue: 'Establishments' }), bg: 'bg-red-50', text: 'text-red-600' },
    { key: 'enterprises', icon: Orbit, count: LIVE_COUNTS.enterprises, label: t('nav.enterprises', { defaultValue: 'Enterprises' }), bg: 'bg-amber-50', text: 'text-amber-600' },
    { key: 'contacts', icon: Users, count: LIVE_COUNTS.contacts, label: t('nav.contacts', { defaultValue: 'Contacts' }), bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { key: 'addresses', icon: MapPin, count: LIVE_COUNTS.addresses, label: t('nav.addresses', { defaultValue: 'Addresses' }), bg: 'bg-blue-50', text: 'text-blue-600' },
  ];

  const handleFreezeClick = () => {
    if (!name.trim()) {
      setNameError(t('snapshots.nameRequired'));
      return;
    }
    setNameError('');
    setConfirmOpen(true);
  };

  const handleConfirmFreeze = () => {
    dispatch(createSnapshot({ name: name.trim(), description: description.trim(), frozenBy }));
    toast.success(t('snapshots.createSuccess', { name: name.trim() }));
    setConfirmOpen(false);
    router.push('/snapshots/browse');
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('snapshots.createTitle')}
        description={t('snapshots.createDescription')}
      />

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="snapshot-name">{t('snapshots.nameLabel')}</Label>
          <Input
            id="snapshot-name"
            value={name}
            onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
            placeholder={t('snapshots.namePlaceholder')}
            className={`shadow-none focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20 ${nameError ? 'border-red-400' : ''}`}
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="snapshot-description">{t('snapshots.descriptionLabel')}</Label>
          <textarea
            id="snapshot-description"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#A71D3A]/20 focus:border-[#A71D3A]/40"
            rows={3}
            placeholder={t('snapshots.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('snapshots.captureCaption')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(({ key, icon: Icon, count, label, bg, text }) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${bg} ${text}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900 leading-none">{count}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleFreezeClick}
            style={{ background: 'linear-gradient(135deg, #8A1538, #6D0D2A)', border: 'none' }}
            className="text-white"
          >
            <Camera className="h-4 w-4 mr-1.5" />
            {t('snapshots.freezeButton')}
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('snapshots.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('snapshots.confirmDescription')}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-sm font-medium text-slate-800">{name.trim()}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('snapshots.confirmSummary', {
                establishments: LIVE_COUNTS.establishments,
                enterprises: LIVE_COUNTS.enterprises,
                contacts: LIVE_COUNTS.contacts,
                addresses: LIVE_COUNTS.addresses,
              })}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>{t('actions.cancel')}</Button>
            <Button
              onClick={handleConfirmFreeze}
              style={{ background: 'linear-gradient(135deg, #8A1538, #6D0D2A)', border: 'none' }}
              className="text-white"
            >
              <Camera className="h-4 w-4 mr-1.5" />
              {t('snapshots.confirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
