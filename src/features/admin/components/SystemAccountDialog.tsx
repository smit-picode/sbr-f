'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Copy, KeyRound, RotateCw } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, formatDateTime } from '@/utils/format';
import { toast } from '@/utils/toast';
import type { ContactTag, IssuedSecret, SystemAccount, SystemAccountCredential, SystemAccountInput, SystemAccountRole, SystemAccountForm } from '@/types';
import {
  useGetSystemAccountQuery, useIssueSystemAccountSecretMutation, useRevokeSystemAccountSecretMutation, useUpdateSystemAccountMutation,
} from '../api/systemAccountsApi';
import { SYSTEM_ACCOUNT_MAX_LIVE_SECRETS, SYSTEM_ACCOUNT_SECRET_DEFAULT_MONTHS, SYSTEM_ACCOUNT_STATUS_VALUES } from '../constants';
import { SystemAccountFields, validateSystemAccountForm } from './SystemAccountFields';

const ACCENT = { background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' };

const toForm = (a: SystemAccount): SystemAccountForm => ({
  name: a.NAME, description: a.DESCRIPTION ?? '', roleId: a.ROLE_ID ? String(a.ROLE_ID) : '', ttl: String(a.TOKEN_TTL_MINUTES), tags: [...a.TAGS].sort(),
});

const defaultExpiry = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + SYSTEM_ACCOUNT_SECRET_DEFAULT_MONTHS);
  return d.toISOString().slice(0, 10);
};

const credentialState = (c: SystemAccountCredential): 'live' | 'revoked' | 'expired' =>
  c.IS_LIVE ? 'live' : c.REVOKED_AT ? 'revoked' : 'expired';

// One system account: settings and secrets (issue, rotate, revoke); a new secret is shown once.
export function SystemAccountDialog({ accountId, roles, tags, onClose }: {
  accountId: number | null;
  roles: SystemAccountRole[];
  tags: ContactTag[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useGetSystemAccountQuery(accountId ?? 0, { skip: accountId === null });
  const [updateAccount, { isLoading: isSaving }] = useUpdateSystemAccountMutation();
  const [issueSecret, { isLoading: isIssuing }] = useIssueSystemAccountSecretMutation();
  const [revokeSecret, { isLoading: isRevoking }] = useRevokeSystemAccountSecretMutation();

  const account = data?.data?.account ?? null;
  const credentials = data?.data?.credentials ?? [];
  const live = credentials.filter((c) => c.IS_LIVE).length;

  const [form, setForm] = useState<SystemAccountForm | null>(null);
  const [active, setActive] = useState<string>(SYSTEM_ACCOUNT_STATUS_VALUES.active);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expiry, setExpiry] = useState<string>(defaultExpiry());
  const [issued, setIssued] = useState<IssuedSecret | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<number | null>(null);

  useEffect(() => {
    if (!account) return;
    setForm(toForm(account));
    setActive(account.IS_ACTIVE ? SYSTEM_ACCOUNT_STATUS_VALUES.active : SYSTEM_ACCOUNT_STATUS_VALUES.inactive);
  }, [account]);

  useEffect(() => {
    if (accountId !== null) return;
    setIssued(null); setErrors({}); setConfirmRevoke(null); setExpiry(defaultExpiry());
  }, [accountId]);

  const changes = useMemo((): SystemAccountInput => {
    if (!account || !form) return {};
    const original = toForm(account);
    const out: SystemAccountInput = {};
    if (form.name.trim() !== original.name) out.name = form.name.trim();
    if (form.description.trim() !== original.description) out.description = form.description.trim();
    if (form.roleId !== original.roleId) out.roleId = Number(form.roleId);
    if (form.ttl !== original.ttl) out.tokenTtlMinutes = Number(form.ttl);
    if ([...form.tags].sort().join() !== original.tags.join()) out.tags = form.tags;
    if ((active === SYSTEM_ACCOUNT_STATUS_VALUES.active) !== account.IS_ACTIVE) out.isActive = active === SYSTEM_ACCOUNT_STATUS_VALUES.active;
    return out;
  }, [account, form, active]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(t('admin.systemAccounts.copied', { defaultValue: 'Copied.' })))
      .catch(() => toast.error(t('admin.systemAccounts.copyFailed', { defaultValue: 'Could not copy. Select the text and copy it.' })));
  };

  const handleSave = async () => {
    if (!account || !form) return;
    if (Object.keys(changes).length === 0) { toast.info('No changes detected.'); return; }
    const e = validateSystemAccountForm(form, t);
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await updateAccount({ id: account.ID, data: changes }).unwrap();
      toast.success(t('admin.systemAccounts.saved', { defaultValue: 'System account saved.' }));
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? t('admin.systemAccounts.saveFailed', { defaultValue: 'Could not save the system account.' }));
    }
  };

  const handleIssue = async () => {
    if (!account) return;
    try {
      const res = await issueSecret({ id: account.ID, expiresAt: expiry ? new Date(`${expiry}T23:59:59`).toISOString() : null }).unwrap();
      if (res.data) setIssued(res.data);
      toast.success(t('admin.systemAccounts.secretIssued', { defaultValue: 'Secret issued. Copy it now.' }));
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? t('admin.systemAccounts.issueFailed', { defaultValue: 'Could not issue a secret.' }));
    }
  };

  const handleRevoke = async (credentialId: number) => {
    if (!account) return;
    if (confirmRevoke !== credentialId) { setConfirmRevoke(credentialId); return; }
    try {
      await revokeSecret({ id: account.ID, credentialId }).unwrap();
      setConfirmRevoke(null);
      if (issued?.credentialId === credentialId) setIssued(null);
      toast.success(t('admin.systemAccounts.secretRevoked', { defaultValue: 'Secret revoked. It can no longer log in.' }));
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? t('admin.systemAccounts.revokeFailed', { defaultValue: 'Could not revoke the secret.' }));
    }
  };

  const busy = isSaving || isIssuing || isRevoking;

  return (
    <Dialog open={accountId !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        {isLoading || !account || !form ? (
          <div className="space-y-4">
            <DialogTitle className="sr-only">{t('admin.systemAccounts.loading', { defaultValue: 'Loading system account' })}</DialogTitle>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="col-span-2 h-9" /><Skeleton className="col-span-2 h-9" /><Skeleton className="h-9" /><Skeleton className="h-9" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-start">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F0E8] text-[#A29374]">
                  <KeyRound className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold text-slate-900">{account.NAME}</span>
                  <button type="button" onClick={() => copy(account.CLIENT_ID)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-normal text-slate-500 hover:text-[#87795D]">
                    {account.CLIENT_ID}<Copy className="h-3 w-3" />
                  </button>
                </span>
                <span className="ms-auto"><StatusBadge status={account.IS_ACTIVE ? 'Active' : 'Inactive'} /></span>
              </DialogTitle>
            </DialogHeader>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">{t('admin.systemAccounts.settings', { defaultValue: 'Settings' })}</h3>
              <SystemAccountFields form={form} onChange={(p) => setForm({ ...form, ...p })} roles={roles} tags={tags} errors={errors} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t('admin.systemAccounts.status', { defaultValue: 'Status' })}</Label>
                  <Select value={active} onValueChange={setActive}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SYSTEM_ACCOUNT_STATUS_VALUES.active}>{t('admin.systemAccounts.active', { defaultValue: 'Active' })}</SelectItem>
                      <SelectItem value={SYSTEM_ACCOUNT_STATUS_VALUES.inactive}>{t('admin.systemAccounts.inactive', { defaultValue: 'Inactive: refused at its next request' })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} loading={isSaving} disabled={busy} style={ACCENT} className="text-white">
                  {t('admin.systemAccounts.saveSettings', { defaultValue: 'Save settings' })}
                </Button>
              </div>
            </section>

            <section className="space-y-3 border-t border-slate-200 pt-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{t('admin.systemAccounts.secrets', { defaultValue: 'Secrets' })}</h3>
                <p className="text-xs text-slate-500">
                  {t('admin.systemAccounts.secretsHelp', {
                    defaultValue: 'The system logs in with its client ID and a secret. Up to {{max}} secrets can be live at once, so a new one can be rolled out before the old one is revoked.',
                    max: SYSTEM_ACCOUNT_MAX_LIVE_SECRETS,
                  })}
                </p>
              </div>

              {issued && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t('admin.systemAccounts.secretOnce', { defaultValue: 'Copy this secret now and store it in the system\'s vault. It will not be shown again.' })}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded bg-white px-2 py-1.5 font-mono text-xs text-slate-800">{issued.secret}</code>
                    <Button size="sm" variant="outline" onClick={() => copy(issued.secret)}>
                      <Copy className="me-1.5 h-3.5 w-3.5" />{t('admin.systemAccounts.copy', { defaultValue: 'Copy' })}
                    </Button>
                  </div>
                </div>
              )}

              {credentials.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {t('admin.systemAccounts.noSecrets', { defaultValue: 'No secret yet: the system cannot log in until you issue one.' })}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-start">
                        {['secret', 'issued', 'expires', 'lastUsed', 'state', ''].map((k) => (
                          <th key={k} className="px-3 py-2 text-start text-xs font-medium uppercase tracking-wide text-slate-500">
                            {k && t(`admin.systemAccounts.secretCol.${k}`, { defaultValue: { secret: 'Secret', issued: 'Issued', expires: 'Expires', lastUsed: 'Last login', state: 'State' }[k] })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {credentials.map((c) => {
                        const state = credentialState(c);
                        return (
                          <tr key={c.ID} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-3 py-2 font-mono text-xs text-slate-600">••••{c.SECRET_HINT ?? ''}</td>
                            <td className="px-3 py-2 text-xs text-slate-600">{formatDate(c.CREATED_AT)}</td>
                            <td className="px-3 py-2 text-xs text-slate-600">{formatDate(c.EXPIRES_AT)}</td>
                            <td className="px-3 py-2 text-xs text-slate-600">{c.LAST_USED_AT ? formatDateTime(c.LAST_USED_AT) : t('admin.systemAccounts.never', { defaultValue: 'Never' })}</td>
                            <td className="px-3 py-2 text-xs">
                              <span className={state === 'live' ? 'text-emerald-700' : 'text-slate-400'}>
                                {t(`admin.systemAccounts.state.${state}`, { defaultValue: { live: 'Live', revoked: 'Revoked', expired: 'Expired' }[state] })}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-end">
                              {state === 'live' && (
                                <Button size="sm" variant="outline" onClick={() => handleRevoke(c.ID)} disabled={busy}
                                  className={confirmRevoke === c.ID ? 'border-red-300 text-red-700 hover:bg-red-50' : ''}>
                                  {confirmRevoke === c.ID
                                    ? t('admin.systemAccounts.confirmRevoke', { defaultValue: 'Confirm revoke' })
                                    : t('admin.systemAccounts.revoke', { defaultValue: 'Revoke' })}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="sa-expiry">{t('admin.systemAccounts.expiry', { defaultValue: 'New secret expires on' })}</Label>
                  <Input id="sa-expiry" type="date" value={expiry} min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setExpiry(e.target.value)} className="h-9 w-44 focus:border-[#A29374]/40 focus:ring-[#A29374]/20" />
                </div>
                <Button onClick={handleIssue} loading={isIssuing} disabled={busy || live >= SYSTEM_ACCOUNT_MAX_LIVE_SECRETS} style={ACCENT} className="text-white">
                  {live > 0 ? <RotateCw className="me-1.5 h-4 w-4" /> : <KeyRound className="me-1.5 h-4 w-4" />}
                  {live > 0
                    ? t('admin.systemAccounts.rotate', { defaultValue: 'Issue a second secret (rotate)' })
                    : t('admin.systemAccounts.issue', { defaultValue: 'Issue secret' })}
                </Button>
                {live >= SYSTEM_ACCOUNT_MAX_LIVE_SECRETS && (
                  <p className="text-xs text-slate-500">{t('admin.systemAccounts.maxLive', { defaultValue: 'Revoke a secret before issuing another.' })}</p>
                )}
              </div>
            </section>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={busy}>{t('admin.users.close', { defaultValue: 'Close' })}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
