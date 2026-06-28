'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { EditAddressModal } from '../components/EditAddressModal';
import { useGetAddressByIdQuery, useGetAddressHistoryQuery } from '../api/addressesApi';
import { FieldHistoryPopover } from '@/components/common/FieldHistoryPopover';
import { PendingBadge } from '@/components/common/PendingBadge';
import { PendingApprovalBanner } from '@/components/common/PendingApprovalBanner';
import { PendingFieldBadge } from '@/components/common/PendingFieldBadge';
import { formatDate } from '@/utils/format';
import { usePermission } from '@/hooks';
import { useLanguage } from '@/i18n';
import { ChevronLeft, ChevronRight, Pencil, MapPin, Database, History } from 'lucide-react';

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

function DetailField({ recordId, fieldKey, label, value, mono, canViewHistory, pendingCount }: {
  recordId: number; fieldKey: string; label: string; value: React.ReactNode; mono?: boolean; canViewHistory: boolean; pendingCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Lazily load the record's change history only while this attribute's popover is open
  const { data, isLoading, isError } = useGetAddressHistoryQuery(recordId, { skip: !open });

  // Close the anchored popover on outside click (the clock button itself toggles)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative min-w-0" ref={wrapRef}>
      <button
        type="button"
        onClick={canViewHistory ? () => setOpen((o) => !o) : undefined}
        disabled={!canViewHistory}
        className="group w-full min-w-0 text-start disabled:cursor-default"
      >
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <PendingFieldBadge count={pendingCount} />
          {canViewHistory && <History className="ms-auto h-3 w-3 shrink-0 text-slate-200 transition-colors group-hover:text-[#A71D3A]" />}
        </div>
        <div className={`mt-0.5 truncate text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</div>
      </button>
      {open && (
        <FieldHistoryPopover
          versions={data?.data ?? []}
          fieldKey={fieldKey}
          fieldLabel={label}
          isLoading={isLoading}
          isError={isError}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

type StripItem = { icon: React.ReactNode; label: string; value: string | null };

function HighlightStrip({ items }: { items: StripItem[] }) {
  const visible = items.filter((i) => !isEmpty(i.value));
  if (!visible.length) return null;
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
      {visible.map((it, i) => (
        <div key={i} className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">{it.icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{it.label}</p>
            <p className="truncate text-sm font-bold text-slate-800">{String(it.value)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AddressDetailPage({ addressId }: { addressId: number }) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const { canEdit, canViewDetail, canViewHistory } = usePermission('addresses');
  // Detail can be opened by anyone who can view the detail OR edit (mirrors the backend getById guard)
  const canOpenDetail = canViewDetail || canEdit;
  const { data, isLoading, isError, refetch } = useGetAddressByIdQuery(addressId, { skip: !canOpenDetail });

  const BackLink = (
    <button onClick={() => router.push('/addresses')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
      {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />} {t('addressDetail.allAddresses')}
    </button>
  );

  if (!canOpenDetail) {
    return (
      <PageContainer>
        <div className="mb-3">{BackLink}</div>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">{t('admin.panel.accessDeniedDesc')}</p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (isError || !data?.data) {
    return (
      <PageContainer>
        <div className="mb-3">{BackLink}</div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <ErrorState onRetry={refetch} />
        </div>
      </PageContainer>
    );
  }

  const a = data.data;
  const pendingFields = a.PENDING_FIELDS ?? {};
  const title = [a.MUNICIPALITY_ID, a.STREET].filter(Boolean).join(' — ') || `Address #${a.ID}`;

  const locationFields = [
    { k: 'SBR_ID', label: 'SBR ID', value: String(a.SBR_ID), show: !isEmpty(a.SBR_ID), mono: true },
    { k: 'MUNICIPALITY_ID', label: 'Municipality', value: a.MUNICIPALITY_ID, show: !isEmpty(a.MUNICIPALITY_ID), mono: false },
    { k: 'ZONE', label: 'Zone', value: a.ZONE, show: !isEmpty(a.ZONE), mono: false },
    { k: 'STREET', label: 'Street', value: a.STREET, show: !isEmpty(a.STREET), mono: false },
    { k: 'BUILDING_NO', label: 'Building', value: a.BUILDING_NO, show: !isEmpty(a.BUILDING_NO), mono: false },
    { k: 'UNIT_NO', label: 'Unit', value: a.UNIT_NO, show: !isEmpty(a.UNIT_NO), mono: false },
    { k: 'FLOOR_NO', label: 'Floor', value: a.FLOOR_NO, show: !isEmpty(a.FLOOR_NO), mono: false },
  ].filter((f) => f.show);

  const referenceFields = [
    { k: 'QARS', label: 'QARS', value: a.QARS, show: !isEmpty(a.QARS), mono: true },
    { k: 'ELECTRICITY_NO', label: 'Electricity No', value: a.ELECTRICITY_NO, show: !isEmpty(a.ELECTRICITY_NO), mono: true },
    { k: 'LATITUDE', label: 'Latitude', value: a.LATITUDE, show: !isEmpty(a.LATITUDE), mono: true },
    { k: 'LONGITUDE', label: 'Longitude', value: a.LONGITUDE, show: !isEmpty(a.LONGITUDE), mono: true },
    { k: 'SOURCE_CODE', label: 'Source', value: a.SOURCE_CODE, show: !isEmpty(a.SOURCE_CODE), mono: true },
  ].filter((f) => f.show);

  const metaFields = [
    { k: 'PRIORITY', label: 'Priority', value: a.PRIORITY != null ? String(a.PRIORITY) : null, show: a.PRIORITY != null, mono: false },
    { k: 'VALID_FROM', label: 'Valid From', value: formatDate(a.VALID_FROM), show: !isEmpty(a.VALID_FROM), mono: false },
    { k: 'VALID_TO', label: 'Valid To', value: formatDate(a.VALID_TO), show: !isEmpty(a.VALID_TO), mono: false },
  ].filter((f) => f.show);

  return (
    <PageContainer>
      {BackLink}

      {/* Header band */}
      <div className="overflow-hidden rounded-lg shadow-sm">
        <div className="bg-gradient-to-br from-[#7c1228] to-[#A71D3A] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded bg-white/15 px-2 py-0.5 font-mono text-xs">
                  {`Record #${a.ID} · SBR #${a.SBR_ID}`}
                </span>
                {a.HAS_PENDING_REQUEST && <PendingBadge />}
              </div>
              <h1 className="mt-2 truncate text-2xl font-bold">{title}</h1>
              {a.ZONE && <p className="text-sm text-white/80">{`Zone ${a.ZONE}`}</p>}
            </div>
            {canEdit && (
              <Button onClick={() => setEditOpen(true)} className="shrink-0 bg-white text-[#A71D3A] hover:bg-white/90">
                <Pencil className="mr-1.5 h-4 w-4" /> {t('actions.edit')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {a.HAS_PENDING_REQUEST && <PendingApprovalBanner />}

      {canViewHistory && (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <History className="h-3.5 w-3.5 text-[#A71D3A]" /> {t('fieldHistory.clickHint')}
        </p>
      )}

      <HighlightStrip
        items={[
          { icon: <MapPin className="h-4 w-4" />, label: 'Zone', value: a.ZONE },
          { icon: <MapPin className="h-4 w-4" />, label: 'Street', value: a.STREET },
          { icon: <Database className="h-4 w-4" />, label: 'Source', value: a.SOURCE_CODE },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {locationFields.length > 0 && (
          <DetailCard title={t('addressDetail.sectionLocation')}>
            {locationFields.map((f) => (
              <DetailField key={f.k} recordId={addressId} fieldKey={f.k} label={f.label} value={f.value} mono={f.mono} canViewHistory={canViewHistory} pendingCount={pendingFields[f.k]} />
            ))}
          </DetailCard>
        )}
        {referenceFields.length > 0 && (
          <DetailCard title={t('addressDetail.sectionReferences')}>
            {referenceFields.map((f) => (
              <DetailField key={f.k} recordId={addressId} fieldKey={f.k} label={f.label} value={f.value} mono={f.mono} canViewHistory={canViewHistory} pendingCount={pendingFields[f.k]} />
            ))}
          </DetailCard>
        )}
        {metaFields.length > 0 && (
          <DetailCard title={t('addressDetail.sectionMetadata')}>
            {metaFields.map((f) => (
              <DetailField key={f.k} recordId={addressId} fieldKey={f.k} label={f.label} value={f.value} mono={f.mono} canViewHistory={canViewHistory} pendingCount={pendingFields[f.k]} />
            ))}
          </DetailCard>
        )}
      </div>

      <EditAddressModal
        address={editOpen ? a : null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          // Addresses are SCD2 — a save creates a new row id; follow it so the page stays current.
          if (updated.ID !== a.ID) router.replace(`/addresses/${updated.ID}`);
          else refetch();
        }}
      />
    </PageContainer>
  );
}
