'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Check, X, User, Clock, Database, ArrowRight, Building2, Layers } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageLoader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useGetChangeRequestByIdQuery,
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
  type ChangeRequestField,
} from '../api/changeRequestsApi';
import { usePermission } from '@/hooks';
import { formatDate, formatDateTime } from '@/utils/format';
import { toast } from '@/utils/toast';
import { ROUTES } from '@/constants/routes';

const TABLE_BADGE: Record<string, string> = {
  SBR_ESTABLISHMENTS: 'bg-[#A71D3A]/10 text-[#A71D3A]',
  SBR_ENTERPRISES: 'bg-amber-50 text-amber-700',
  SBR_CONTACTS: 'bg-emerald-50 text-emerald-700',
  SBR_ADDRESSES: 'bg-sky-50 text-sky-700',
};

// Curated fields shown in the "Record context" panel per table, organised into sections.
type CtxField = { key: string; label: string; span?: 2; sourceKey?: string };
type CtxSection = { section: string; fields: CtxField[] };

const CONTEXT_SECTIONS: Record<string, CtxSection[]> = {
  SBR_CONTACTS: [
    {
      section: 'Contact',
      fields: [
        { key: 'SBR_ID', label: 'SBR ID' },
        { key: 'CONTACT_NAME', label: 'Name' },
        { key: 'ROLE', label: 'Role' },
        { key: 'SOURCE_CODE', label: 'Source' },
      ],
    },
    {
      section: 'Channels',
      fields: [
        { key: 'PHONE', label: 'Phone' },
        { key: 'MOBILE', label: 'Mobile' },
        { key: 'FAX', label: 'Fax' },
        { key: 'EMAIL', label: 'Email' },
        { key: 'WEBSITE', label: 'Website' },
      ],
    },
    {
      section: 'Metadata',
      fields: [
        { key: 'PO_BOX', label: 'PO Box' },
        { key: 'PRIORITY', label: 'Priority' },
        { key: 'VALID_FROM', label: 'Valid From' },
        { key: 'VALID_TO', label: 'Valid To' },
      ],
    },
  ],
  SBR_ADDRESSES: [
    {
      section: 'Location',
      fields: [
        { key: 'SBR_ID', label: 'SBR ID' },
        { key: 'MUNICIPALITY_ID', label: 'Municipality' },
        { key: 'ZONE', label: 'Zone' },
        { key: 'STREET', label: 'Street' },
        { key: 'BUILDING_NO', label: 'Building' },
        { key: 'UNIT_NO', label: 'Unit' },
        { key: 'FLOOR_NO', label: 'Floor' },
      ],
    },
    {
      section: 'References',
      fields: [
        { key: 'QARS', label: 'QARS' },
        { key: 'ELECTRICITY_NO', label: 'Electricity No.' },
        { key: 'LATITUDE', label: 'Latitude' },
        { key: 'LONGITUDE', label: 'Longitude' },
        { key: 'SOURCE_CODE', label: 'Source' },
      ],
    },
    {
      section: 'Metadata',
      fields: [
        { key: 'PRIORITY', label: 'Priority' },
        { key: 'VALID_FROM', label: 'Valid From' },
        { key: 'VALID_TO', label: 'Valid To' },
      ],
    },
  ],
  SBR_ESTABLISHMENTS: [
    {
      section: 'Identity',
      fields: [
        { key: 'SBR_ID', label: 'SBR ID' },
        { key: 'SOURCE_CODE', label: 'Source' },
        { key: 'EID', label: 'EID', span: 2, sourceKey: 'EID_SOURCE' },
      ],
    },
    {
      section: 'Names',
      fields: [
        { key: 'NAME_ENU', label: 'Name (EN)', sourceKey: 'NAME_ENU_SOURCE' },
        { key: 'NAME_ARA', label: 'Name (AR)', sourceKey: 'NAME_ARA_SOURCE' },
        { key: 'TRADE_NAME_ENU', label: 'Trade Name (EN)', sourceKey: 'TRADE_NAME_ENU_SOURCE' },
        { key: 'TRADE_NAME_ARA', label: 'Trade Name (AR)', sourceKey: 'TRADE_NAME_ARA_SOURCE' },
        { key: 'NPC_NAME_ENU', label: 'NPC Name (EN)', sourceKey: 'NPC_NAME_ENU_SOURCE' },
        { key: 'NPC_NAME_ARA', label: 'NPC Name (AR)', sourceKey: 'NPC_NAME_ARA_SOURCE' },
      ],
    },
    {
      section: 'Status & Classification',
      fields: [
        { key: 'EST_STATUS', label: 'Status', sourceKey: 'EST_STATUS_SOURCE' },
        { key: 'EST_STATUS_CATEGORY', label: 'Status Category', sourceKey: 'EST_STATUS_CATEGORY_SOURCE' },
        { key: 'LEGAL_TYPE', label: 'Legal Type', sourceKey: 'LEGAL_TYPE_SOURCE' },
        { key: 'SECTOR_ID', label: 'Sector', sourceKey: 'SECTOR_ID_SOURCE' },
        { key: 'ISIC_CODE', label: 'ISIC Code', sourceKey: 'ISIC_CODE_SOURCE' },
        { key: 'EMPLOYMENT_COUNT', label: 'Employees', sourceKey: 'EMPLOYMENT_COUNT_SOURCE' },
        { key: 'MAIN_BRANCH_FLG', label: 'Main / Branch', sourceKey: 'MAIN_BRANCH_FLG_SOURCE' },
        { key: 'HOLDING_COMPANY_FLG', label: 'Holding Co.', sourceKey: 'HOLDING_COMPANY_FLG_SOURCE' },
      ],
    },
    {
      section: 'Registration',
      fields: [
        { key: 'MOCI_ORG_ID', label: 'MOCI Org ID' },
        { key: 'MOCI_CR_NUM', label: 'MOCI CR' },
        { key: 'MOCI_CP_NUM', label: 'MOCI CP' },
        { key: 'QFC_NUMBER', label: 'QFC Number' },
        { key: 'QFZ_SOURCE_ID', label: 'QFZ ID' },
        { key: 'QSTP_REG_NUM', label: 'QSTP Reg' },
        { key: 'FARM_NO', label: 'Farm No' },
      ],
    },
    {
      section: 'Dates',
      fields: [
        { key: 'CR_ISSUE_DATE', label: 'CR Issue' },
        { key: 'CR_EXPIRY_DATE', label: 'CR Expiry' },
        { key: 'CP_ISSUE_DATE', label: 'CP Issue' },
        { key: 'REG_DATE', label: 'Reg Date' },
        { key: 'VALID_FROM', label: 'Valid From' },
        { key: 'VALID_TO', label: 'Valid To' },
        { key: 'CREATED_AT', label: 'Created' },
        { key: 'UPDATED_AT', label: 'Updated' },
      ],
    },
  ],
  SBR_ENTERPRISES: [
    {
      section: 'Overview',
      fields: [
        { key: 'ENTERPRISE_ID', label: 'Enterprise ID' },
        { key: 'NAME_ENU', label: 'Name (EN)' },
        { key: 'NAME_ARA', label: 'Name (AR)' },
        { key: 'TRADE_NAME_ENU', label: 'Trade Name (EN)' },
        { key: 'LEGAL_TYPE', label: 'Legal Type' },
        { key: 'STATUS', label: 'Status' },
        { key: 'SECTOR_ID', label: 'Sector' },
        { key: 'MAIN_LEGAL_UNIT_SBR_ID', label: 'Main Unit SBR ID' },
        { key: 'ESTABLISHMENT_COUNT', label: 'Establishments' },
      ],
    },
    {
      section: 'Metadata',
      fields: [
        { key: 'MAIN_CR', label: 'Main CR' },
        { key: 'ENTERPRISE_GROUP_ID', label: 'Enterprise Group' },
        { key: 'VALID_FROM', label: 'Valid From' },
        { key: 'VALID_TO', label: 'Valid To' },
      ],
    },
  ],
};

const DATE_KEYS = new Set(['VALID_FROM', 'VALID_TO', 'CREATED_AT', 'UPDATED_AT', 'ECON_ACTIVITY_START_DATE', 'CR_ISSUE_DATE', 'CR_EXPIRY_DATE', 'CP_ISSUE_DATE', 'REG_DATE']);
const STATUS_KEYS = new Set(['STATUS', 'EST_STATUS']);

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
  const contextSections = (CONTEXT_SECTIONS[r.TABLE_NAME] ?? [])
    .map((sec) => ({ ...sec, visible: sec.fields.filter((f) => r.record && r.record[f.key] != null && r.record[f.key] !== '') }))
    .filter((sec) => sec.visible.length > 0);

  // Parent establishment: child records (addresses/contacts) belong to an establishment via SBR_ID.
  const PARENT_TABLES = ['SBR_ADDRESSES', 'SBR_CONTACTS'];
  const parentSbrRaw = PARENT_TABLES.includes(r.TABLE_NAME) ? r.record?.SBR_ID : null;
  const parentSbrNum = parentSbrRaw == null || parentSbrRaw === '' ? NaN : Number(parentSbrRaw);
  const parentSbrId = Number.isFinite(parentSbrNum) ? parentSbrNum : null;

  // Related-records context (backend-resolved): establishments link to their enterprise + child counts;
  // enterprises list their member establishments.
  const relEnterprise = r.TABLE_NAME === 'SBR_ESTABLISHMENTS' ? r.related?.enterprise ?? null : null;
  const showRelatedRecords = r.TABLE_NAME === 'SBR_ESTABLISHMENTS';
  const members = r.TABLE_NAME === 'SBR_ENTERPRISES' ? r.related?.members ?? [] : [];

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
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDateTime(r.CREATED_AT)}</span>
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
                <div
                  key={f.field}
                  className="grid items-center gap-x-4 px-5 py-3 text-sm"
                  style={{ gridTemplateColumns: '11rem 1fr auto 1fr' }}
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{fieldLabel(f.field)}</span>
                  <span className="min-w-0 text-slate-400 line-through">{f.old == null || f.old === '' ? '—' : String(f.old)}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="min-w-0 font-semibold text-emerald-700">{f.new == null || f.new === '' ? '—' : String(f.new)}</span>
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
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('changeRequests.currentRecord', { defaultValue: 'Current Record' })}</p>
            </div>
            {contextSections.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">—</p>
            ) : (
              <>
                {contextSections.map((sec, idx) => (
                  <div key={sec.section} className={idx > 0 ? 'border-t border-slate-200' : ''}>
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{sec.section}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
                      {sec.visible.map((f) => (
                        <div key={f.key} className={`min-w-0${f.span === 2 ? ' col-span-2' : ''}`}>
                          <p className="text-[11px] text-slate-400">{f.label}</p>
                          {STATUS_KEYS.has(f.key) ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <StatusBadge status={r.record?.[f.key] as string | null} />
                              {f.sourceKey && r.record?.[f.sourceKey] != null && (
                                <span className="shrink-0 font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{String(r.record[f.sourceKey])}</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="break-all text-sm font-medium text-slate-800">{fmt(f.key, r.record?.[f.key])}</span>
                              {f.sourceKey && r.record?.[f.sourceKey] != null && (
                                <span className="shrink-0 font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{String(r.record[f.sourceKey])}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {parentSbrId != null && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('changeRequests.parentEstablishment', { defaultValue: 'Parent Establishment' })}</p>
              <button
                type="button"
                onClick={() => router.push(ROUTES.LEGAL_UNIT_DETAIL(parentSbrId))}
                className="flex w-full items-center gap-2.5 rounded-md border border-slate-200 px-3 py-2.5 text-left transition-colors hover:border-[#A71D3A]/40 hover:bg-[#FCF4F6]"
              >
                <Building2 className="h-4 w-4 shrink-0 text-[#A71D3A]" />
                <span className="font-mono text-sm font-medium text-[#A71D3A]">SBR #{parentSbrId}</span>
              </button>
            </div>
          )}

          {/* Establishment request → related records (parent enterprise + child counts) */}
          {showRelatedRecords && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('changeRequests.relatedRecords', { defaultValue: 'Related Records' })}</p>
              {relEnterprise && (
                <button
                  type="button"
                  onClick={() => router.push(`/enterprises/${relEnterprise.ENTERPRISE_ID}`)}
                  className="mb-3 flex w-full items-center gap-2.5 rounded-md border border-slate-200 px-3 py-2.5 text-left transition-colors hover:border-[#A71D3A]/40 hover:bg-[#FCF4F6]"
                >
                  <Layers className="h-4 w-4 shrink-0 text-[#A71D3A]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{relEnterprise.NAME_ENU ?? `#${relEnterprise.ENTERPRISE_ID}`}</span>
                    <span className="block text-xs text-slate-500">
                      {t('changeRequests.partOfEnterprise', { defaultValue: 'Part of enterprise' })} · {relEnterprise.ESTABLISHMENT_COUNT} {t('changeRequests.establishments', { defaultValue: 'Establishments' })}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-200 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-slate-800">{r.related?.contactCount ?? 0}</p>
                  <p className="text-xs text-slate-500">{t('changeRequests.contacts', { defaultValue: 'Contacts' })}</p>
                </div>
                <div className="rounded-md border border-slate-200 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-slate-800">{r.related?.addressCount ?? 0}</p>
                  <p className="text-xs text-slate-500">{t('changeRequests.addresses', { defaultValue: 'Addresses' })}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enterprise request → member establishments */}
          {r.TABLE_NAME === 'SBR_ENTERPRISES' && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('changeRequests.memberEstablishments', { defaultValue: 'Member Establishments' })} ({members.length})
              </p>
              {members.length === 0 ? (
                <p className="text-sm text-slate-400">—</p>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <button
                      key={m.SBR_ID}
                      type="button"
                      onClick={() => router.push(ROUTES.LEGAL_UNIT_DETAIL(m.SBR_ID))}
                      className="flex w-full items-center gap-2.5 rounded-md border border-slate-200 px-3 py-2.5 text-left transition-colors hover:border-[#A71D3A]/40 hover:bg-[#FCF4F6]"
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">{m.NAME_ENU ?? `#${m.SBR_ID}`}</span>
                        <span className="block text-xs text-slate-500">{m.MOCI_CR_NUM ? `CR ${m.MOCI_CR_NUM} · ` : ''}#{m.SBR_ID}</span>
                      </span>
                      {m.MAIN_BRANCH_FLG === 'MAIN' ? (
                        <span className="shrink-0 rounded bg-[#A71D3A] px-1.5 py-0.5 text-[10px] font-bold text-white">{t('changeRequests.main', { defaultValue: 'MAIN' })}</span>
                      ) : m.MAIN_BRANCH_FLG === 'BRANCH' ? (
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{t('changeRequests.branch', { defaultValue: 'BRANCH' })}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
