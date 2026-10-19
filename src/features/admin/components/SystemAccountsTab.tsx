'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/table/DataTable';
import { PAGE_SIZE_OPTIONS } from '@/constants';
import { toast } from '@/utils/toast';
import { useGetContactTagsQuery } from '@/features/contactTags/api/contactTagsApi';
import { useCreateSystemAccountMutation, useGetSystemAccountRolesQuery, useGetSystemAccountsQuery } from '../api/systemAccountsApi';
import { SYSTEM_ACCOUNT_DEFAULT_TTL_MINUTES } from '../constants';
import { getSystemAccountColumns } from './SystemAccountsColumns';
import { SystemAccountDialog } from './SystemAccountDialog';
import { SystemAccountFields, emptySystemAccountForm, validateSystemAccountForm } from './SystemAccountFields';

import type { SystemAccountForm } from '@/types';
// Machine accounts for the integration API: list, create, and a dialog per account.
export function SystemAccountsTab({ onRegisterCreate }: { onRegisterCreate: (fn: () => void) => void }) {
  const { t } = useTranslation();
  const { data, isLoading, isFetching, isError, refetch } = useGetSystemAccountsQuery();
  const { data: rolesData } = useGetSystemAccountRolesQuery();
  const { data: tagsData } = useGetContactTagsQuery();
  const [createAccount, { isLoading: isCreating }] = useCreateSystemAccountMutation();

  const accounts = data?.data ?? [];
  const roles = rolesData?.data ?? [];
  const tags = useMemo(() => (tagsData?.data ?? []).filter((tag) => tag.IS_ACTIVE === 'Y'), [tagsData]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<SystemAccountForm>(emptySystemAccountForm(SYSTEM_ACCOUNT_DEFAULT_TTL_MINUTES));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    onRegisterCreate(() => {
      setForm(emptySystemAccountForm(SYSTEM_ACCOUNT_DEFAULT_TTL_MINUTES));
      setErrors({});
      setCreateOpen(true);
    });
  }, [onRegisterCreate]);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(t('admin.systemAccounts.copied', { defaultValue: 'Copied.' })))
      .catch(() => toast.error(t('admin.systemAccounts.copyFailed', { defaultValue: 'Could not copy. Select the text and copy it.' })));
  }, [t]);
  const columns = useMemo(() => getSystemAccountColumns(t, copy), [t, copy]);

  const handleCreate = async () => {
    const e = validateSystemAccountForm(form, t);
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      const res = await createAccount({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        roleId: Number(form.roleId),
        tokenTtlMinutes: Number(form.ttl),
        tags: form.tags,
      }).unwrap();
      toast.success(t('admin.systemAccounts.created', { defaultValue: 'System account created. Issue its first secret.' }));
      setCreateOpen(false);
      if (res.data) setOpenId(res.data.ID);
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? t('admin.systemAccounts.createFailed', { defaultValue: 'Could not create the system account.' }));
    }
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={accounts}
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        isError={isError}
        onRetry={refetch}
        page={1}
        limit={PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1]}
        total={accounts.length}
        onPageChange={() => undefined}
        onLimitChange={() => undefined}
        onRowClick={(row) => setOpenId(row.ID)}
      />

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{t('admin.systemAccounts.addTitle', { defaultValue: 'Add system account' })}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">
            {t('admin.systemAccounts.addHelp', { defaultValue: 'A machine login for another NPC system. Everything it sends becomes a change request for review.' })}
          </p>
          <SystemAccountFields form={form} onChange={(p) => setForm({ ...form, ...p })} roles={roles} tags={tags} errors={errors} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>{t('actions.cancel')}</Button>
            <Button onClick={handleCreate} loading={isCreating} style={{ background: 'linear-gradient(135deg, #A29374, #87795D)', border: 'none' }} className="text-white">
              {t('admin.systemAccounts.create', { defaultValue: 'Create' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SystemAccountDialog accountId={openId} roles={roles} tags={tags} onClose={() => setOpenId(null)} />
    </>
  );
}
