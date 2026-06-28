'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Check, X, User, Clock, Database, ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageLoader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useGetChangeRequestByIdQuery,
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
  type ChangeRequestField,
} from '../api/changeRequestsApi';
import { usePermission } from '@/hooks';
import { formatDate } from '@/utils/format';
import { toast } from '@/utils/toast';

const TABLE_BADGE: Record<string, string> = {
  SBR_ESTABLISHMENTS: 'bg-[#A71D3A]/10 text-[#A71D3A]',
  SBR_ENTERPRISES: 'bg-amber-50 text-amber-700',
  SBR_CONTACTS: 'bg-emerald-50 text-emerald-700',
  SBR_ADDRESSES: 'bg-sky-50 text-sky-700',
};

// Curated fields shown in the "Record context" panel per table.
const CONTEXT_FIELDS: Record<string, { key: string; label: string }[]> = {
  SBR_CONTACTS: [
    { key: 'SBR_ID', label: 'SBR ID' }, { key: 'SOURCE_CODE', label: 'Source' },
    { key: 'PHONE', label: 'Phone' }, { key: 'EMAIL', label: 'Email' },
    { key: 'PO_BOX', label: 'PO Box' }, { key: 'PRIORITY', label: 'Priority' }, { key: 'VALID_FROM', label: 'Valid From' },
  ],
  SBR_ADDRESSES: [
    { key: 'SBR_ID', label: 'SBR ID' }, { key: 'SOURCE_CODE', label: 'Source' },
    { key: 'ZONE', label: 'Zone' }, { key: 'STREET', label: 'Street' },
    { key: 'BUILDING_NO', label: 'Building' }, { key: 'QARS', label: 'QARS' }, { key: 'VALID_FROM', label: 'Valid From' },
  ],
  SBR_ESTABLISHMENTS: [
    { key: 'SBR_ID', label: 'SBR ID' }, { key: 'SOURCE_CODE', label: 'Source' },
    { key: 'NAME_ENU', label: 'Name (EN)' }, { key: 'NAME_ARA', label: 'Name (AR)' },
    { key: 'EST_STATUS', label: 'Status' }, { key: 'LEGAL_TYPE', label: 'Legal Type' },
    { key: 'SECTOR_ID', label: 'Sector' }, { key: 'EMPLOYMENT_COUNT', label: 'Employees' },
    { key: 'MOCI_CR_NUM', label: 'MOCI CR' }, { key: 'VALID_FROM', label: 'Valid From' },
  ],
  SBR_ENTERPRISES: [
    { key: 'ENTERPRISE_ID', label: 'Enterprise ID' }, { key: 'NAME_ENU', label: 'Name' },
    { key: 'SECTOR_ID', label: 'Sector' }, { key: 'STATUS', label: 'Status' }, { key: 'VALID_FROM', label: 'Valid From' },
  ],
};

const DATE_KEYS = new Set(['VALID_FROM', 'VALID_TO', 'CREATED_AT', 'UPDATED_AT']);

const fmt = (key: string, v: unknown): string => {
  if (v == null || v === '') return '—';
  if (DATE_KEYS.has(key)) return formatDate(String(v));
  return String(v);
};

const fieldLabel = (f: string) => f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function ChangeRequestDetailPage({ id }: { id: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { canApprove } = usePermission('approvals');
  const [note, setNote] = useState('');
  const { data, isLoading, isError, refetch } = useGetChangeRequestByIdQuery(id, { skip: !canApprove });
  const [approve, { isLoading: approving }] = useApproveChangeRequestMutation();
  const [reject, { isLoading: rejecting }] = useRejectChangeRequestMutation();

  if (!canApprove) {
    return <PageContainer><ErrorState message={t('common.noAccess', { defaultValue: 'You do not have access to this section.' })} /></PageContainer>;
  }
  if (isLoading) return <PageContainer><PageLoader /></PageContainer>;
  if (isError || !data?.data) return <PageContainer><ErrorState onRetry={refetch} /></PageContainer>;

  const r = data.data;
  const pending = r.STATUS === 'PENDING';
  const changeCount = r.fields.length + r.addEstablishmentSbrIds.length + r.removeEstablishmentSbrIds.length;
  const contextFields = (CONTEXT_FIELDS[r.TABLE_NAME] ?? []).filter((f) => r.record && r.record[f.key] != null && r.record[f.key] !== '');

  const doAction = async (kind: 'approve' | 'reject') => {
    if (!note.trim()) {
      toast.error(t('changeRequests.reasonRequired', { defaultValue: 'Please enter a reason.' }));
      return;
    }
    try {
      if (kind === 'approve') await approve({ id: r.ID, reason: note.trim() }).unwrap();
      else await reject({ id: r.ID, reason: note.trim() }).unwrap();
      toast.success(kind === 'approve' ? t('changeRequests.approved', { defaultValue: 'Request approved.' }) : t('changeRequests.rejected', { defaultValue: 'Request rejected.' }));
      router.push('/tasks/attribute-change-requests');
    } catch (err) {
      // e.g. ALREADY_ACTIONED (400): another approver decided this first — surface the real
      // reason and refetch so the now-decided state hides the action panel instead of re-trying.
      const apiErr = err as { status?: number; data?: { message?: string } };
      if (apiErr?.status === 400 && apiErr.data?.message) {
        toast.error(apiErr.data.message);
        refetch();
      } else {
        toast.error(t('changeRequests.actionFailed', { defaultValue: 'Action failed. Please try again.' }));
      }
    }
  };

  const statusCls = r.STATUS === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : r.STATUS === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';

  return (
    <PageContainer>
      <button onClick={() => router.push('/tasks/attribute-change-requests')} className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-[#A71D3A]">
        <ChevronLeft className="h-4 w-4" /> {t('changeRequests.back', { defaultValue: 'Back to requests' })}
      </button>

      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-medium text-slate-500">{r.REQUEST_CODE}</span>
          <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${TABLE_BADGE[r.TABLE_NAME] ?? 'bg-slate-100 text-slate-600'}`}>{r.TABLE_NAME}</span>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${statusCls}`}>
            <Clock className="h-3 w-3" /> {r.STATUS.charAt(0) + r.STATUS.slice(1).toLowerCase()}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{r.ENTITY ?? '—'}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {t('changeRequests.submittedBy', { defaultValue: 'Submitted by' })} <span className="font-medium text-[#A71D3A]">{r.REQUESTED_BY ?? '—'}</span></span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDate(r.CREATED_AT)}</span>
          <span className="flex items-center gap-1"><Database className="h-3.5 w-3.5" /> {t('changeRequests.row', { defaultValue: 'Row' })} #{r.ROW_ID ?? '—'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: changes + reason + actions */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('changeRequests.requestedChanges', { defaultValue: 'Requested Changes' })}</div>
            <div className="divide-y divide-slate-50">
              {r.fields.map((f: ChangeRequestField) => (
                <div key={f.field} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-44 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">{fieldLabel(f.field)}</span>
                  <span className="text-slate-400 line-through">{f.old == null || f.old === '' ? '—' : String(f.old)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-emerald-700">{f.new == null || f.new === '' ? '—' : String(f.new)}</span>
                </div>
              ))}
              {r.addEstablishmentSbrIds.map((sid) => (
                <div key={`add-${sid}`} className="flex items-center gap-2 px-5 py-3 text-sm">
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">+ {t('changeRequests.establishmentAdded', { defaultValue: 'Establishment Added' })}</span>
                  <span className="font-mono text-xs text-red-600">#{sid}</span>
                </div>
              ))}
              {r.removeEstablishmentSbrIds.map((sid) => (
                <div key={`rem-${sid}`} className="flex items-center gap-2 px-5 py-3 text-sm">
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">− {t('changeRequests.establishmentRemoved', { defaultValue: 'Establishment Removed' })}</span>
                  <span className="font-mono text-xs text-red-600">#{sid}</span>
                </div>
              ))}
            </div>
          </div>

          {r.CHANGE_REASON && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('changeRequests.reasonForChange', { defaultValue: 'Reason for Change' })}</div>
              <p className="px-5 py-3 text-sm text-slate-700">{r.CHANGE_REASON}</p>
            </div>
          )}

          {pending && (
            <div className="rounded-lg border border-[#A71D3A]/15 bg-[#FCF4F6] p-4">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('changeRequests.approvalNote', { defaultValue: 'Reason for approval / rejection (required)…' })}
                className="mb-3 bg-white focus:border-[#A71D3A]/40 focus:ring-[#A71D3A]/20"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-600">{changeCount} {changeCount === 1 ? t('changeRequests.fieldOne', { defaultValue: 'field changed' }) : t('changeRequests.fieldMany', { defaultValue: 'fields changed' })}</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => doAction('reject')} disabled={approving || rejecting || !note.trim()} className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50">
                    <X className="h-4 w-4" /> {t('changeRequests.reject', { defaultValue: 'Reject' })}
                  </Button>
                  <Button onClick={() => doAction('approve')} disabled={approving || rejecting || !note.trim()} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                    <Check className="h-4 w-4" /> {t('changeRequests.approve', { defaultValue: 'Approve' })}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!pending && r.APPROVAL_REASON && (
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('changeRequests.approvalReason', { defaultValue: 'Approval Reason' })}</div>
              <p className="px-5 py-3 text-sm text-slate-700">{r.APPROVAL_REASON}</p>
            </div>
          )}
        </div>

        {/* Right: record context */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('changeRequests.recordContext', { defaultValue: 'Record Context' })}</p>
          {contextFields.length === 0 ? (
            <p className="text-sm text-slate-400">—</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {contextFields.map((f) => (
                <div key={f.key} className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">{f.label}</p>
                  <p className="truncate text-sm font-medium text-slate-800">{fmt(f.key, r.record?.[f.key])}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
