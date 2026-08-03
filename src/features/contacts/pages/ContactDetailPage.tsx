'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/common/PageContainer';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { EditContactModal } from '../components/EditContactModal';
import { useGetContactByIdQuery, useGetContactHistoryQuery } from '../api/contactsApi';
import { FieldHistoryPopover } from '@/components/common/FieldHistoryPopover';
import { PendingBadge } from '@/components/common/PendingBadge';
import { PendingApprovalBanner } from '@/components/common/PendingApprovalBanner';
import { PendingFieldBadge } from '@/components/common/PendingFieldBadge';
import { formatDate, nullableText } from '@/utils/format';
import { isContactFieldHistoryEnabled } from '../constants';
import { usePermission } from '@/hooks';
import { useLanguage } from '@/i18n';
import { ChevronLeft, ChevronRight, Pencil, Briefcase, Phone, Database, History } from 'lucide-react';

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

function DetailField({ recordId, fieldKey, label, value, mono, canViewHistory, pendingCount }: {
  recordId: number; fieldKey: string; label: string; value: React.ReactNode; mono?: boolean; canViewHistory: boolean; pendingCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Lazily load the record's change history only while this attribute's popover is open
  const { data, isLoading, isError } = useGetContactHistoryQuery(recordId, { skip: !open });

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

export function ContactDetailPage({ contactId }: { contactId: number }) {
  const { t } = useTranslation();
  const { isArabic } = useLanguage();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const { canEdit, canViewDetail, canViewHistory } = usePermission('contacts');
  // Detail can be opened by anyone who can view the detail OR edit (mirrors the backend getById guard)
  const canOpenDetail = canViewDetail || canEdit;
  const { data, isLoading, isError, refetch } = useGetContactByIdQuery(contactId, { skip: !canOpenDetail });

  const lbl = (k: string) => t(`columns.${k}`);

  const BackLink = (
    <button onClick={() => router.push('/contacts')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
      {isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />} {t('contactDetail.allContacts')}
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

  const c = data.data;
  const pendingFields = c.PENDING_FIELDS ?? {};
  const title = c.CONTACT_NAME || c.EMAIL || `Contact #${c.ID}`;

  // A history-enabled (= editable) field always stays on screen, rendering "—" when empty:
  // hiding it would make its history popover unreachable, which is how an empty CONTACT_NAME
  // lost its View History affordance. Locked fields keep the original hide-when-empty rule.
  const showField = (k: string, value: unknown): boolean =>
    isContactFieldHistoryEnabled(k) || !isEmpty(value);

  const contactFields = [
    { k: 'SBR_ID', label: lbl('SBR_ID'), value: String(c.SBR_ID), show: showField('SBR_ID', c.SBR_ID), mono: true },
    { k: 'CONTACT_NAME', label: lbl('CONTACT_NAME'), value: nullableText(c.CONTACT_NAME), show: showField('CONTACT_NAME', c.CONTACT_NAME), mono: false },
    { k: 'SOURCE_CODE', label: lbl('SOURCE_CODE'), value: c.SOURCE_CODE, show: showField('SOURCE_CODE', c.SOURCE_CODE), mono: true },
  ].filter((f) => f.show);

  const channelFields = [
    { k: 'PHONE', label: lbl('PHONE'), value: nullableText(c.PHONE), show: showField('PHONE', c.PHONE), mono: true },
    { k: 'MOBILE', label: lbl('MOBILE'), value: nullableText(c.MOBILE), show: showField('MOBILE', c.MOBILE), mono: true },
    { k: 'EMAIL', label: lbl('EMAIL'), value: nullableText(c.EMAIL), show: showField('EMAIL', c.EMAIL), mono: false },
    { k: 'FAX', label: lbl('FAX'), value: nullableText(c.FAX), show: showField('FAX', c.FAX), mono: true },
    { k: 'PO_BOX', label: lbl('PO_BOX'), value: nullableText(c.PO_BOX), show: showField('PO_BOX', c.PO_BOX), mono: true },
    { k: 'WEBSITE', label: lbl('WEBSITE'), value: nullableText(c.WEBSITE), show: showField('WEBSITE', c.WEBSITE), mono: false },
  ].filter((f) => f.show);

  const metaFields = [
    { k: 'PRIORITY', label: lbl('PRIORITY'), value: c.PRIORITY != null ? String(c.PRIORITY) : nullableText(null), show: showField('PRIORITY', c.PRIORITY), mono: false },
    { k: 'VALID_FROM', label: lbl('VALID_FROM'), value: formatDate(c.VALID_FROM), show: showField('VALID_FROM', c.VALID_FROM), mono: false },
    { k: 'VALID_TO', label: lbl('VALID_TO'), value: formatDate(c.VALID_TO), show: showField('VALID_TO', c.VALID_TO), mono: false },
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
                  {`Record #${c.ID} · SBR #${c.SBR_ID}`}
                </span>
                {c.HAS_PENDING_REQUEST && <PendingBadge />}
              </div>
              <h1 className="mt-2 truncate text-2xl font-bold">{title}</h1>
              {c.ROLE && <p className="text-sm text-white/80">{c.ROLE}</p>}
            </div>
            {canEdit && (
              <Button onClick={() => setEditOpen(true)} className="shrink-0 bg-white text-[#A71D3A] hover:bg-white/90">
                <Pencil className="mr-1.5 h-4 w-4" /> {t('actions.edit')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {c.HAS_PENDING_REQUEST && <PendingApprovalBanner />}

      {canViewHistory && (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <History className="h-3.5 w-3.5 text-[#A71D3A]" /> {t('fieldHistory.clickHint')}
        </p>
      )}

      <HighlightStrip
        items={[
          { icon: <Briefcase className="h-4 w-4" />, label: lbl('ROLE'), value: c.ROLE },
          { icon: <Phone className="h-4 w-4" />, label: lbl('PHONE'), value: c.PHONE || c.MOBILE },
          { icon: <Database className="h-4 w-4" />, label: lbl('SOURCE_CODE'), value: c.SOURCE_CODE },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {contactFields.length > 0 && (
          <DetailCard title={t('contactDetail.sectionContact')}>
            {contactFields.map((f) => (
              <DetailField key={f.k} recordId={contactId} fieldKey={f.k} label={f.label} value={f.value} mono={f.mono} canViewHistory={canViewHistory && isContactFieldHistoryEnabled(f.k)} pendingCount={pendingFields[f.k]} />
            ))}
          </DetailCard>
        )}
        {/* Channels is the tallest card, so on a 2-column grid it alone sets row 1's height and
            Metadata (which wraps to row 2) leaves a dead gap under Contact. Spanning both rows
            lets Metadata sit directly beneath Contact instead. The wrapper carries the span so
            DetailCard's signature stays untouched; DOM order is unchanged, so the single-column
            stacking order below lg is exactly as before. */}
        {channelFields.length > 0 && (
          <div className="lg:row-span-2">
            <DetailCard title={t('contactDetail.sectionChannels')}>
              {channelFields.map((f) => (
                <DetailField key={f.k} recordId={contactId} fieldKey={f.k} label={f.label} value={f.value} mono={f.mono} canViewHistory={canViewHistory && isContactFieldHistoryEnabled(f.k)} pendingCount={pendingFields[f.k]} />
              ))}
            </DetailCard>
          </div>
        )}
        {metaFields.length > 0 && (
          <DetailCard title={t('contactDetail.sectionMetadata')}>
            {metaFields.map((f) => (
              <DetailField key={f.k} recordId={contactId} fieldKey={f.k} label={f.label} value={f.value} mono={f.mono} canViewHistory={canViewHistory && isContactFieldHistoryEnabled(f.k)} pendingCount={pendingFields[f.k]} />
            ))}
          </DetailCard>
        )}
      </div>

      <EditContactModal
        contact={editOpen ? c : null}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          // Contacts are SCD2 — a save creates a new row id; follow it so the page stays current.
          if (updated.ID !== c.ID) router.replace(`/contacts/${updated.ID}`);
          else refetch();
        }}
      />
    </PageContainer>
  );
}
