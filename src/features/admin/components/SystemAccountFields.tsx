'use client';

import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRole } from '@/utils/format';
import type { ContactTag, SystemAccountRole, SystemAccountForm } from '@/types';
import { SYSTEM_ACCOUNT_MAX_TTL_MINUTES, SYSTEM_ACCOUNT_MIN_TTL_MINUTES } from '../constants';

const SOFT_RING = 'focus:border-[#A29374]/40 focus:ring-[#A29374]/20';

// The editable settings of a system account, shared by the create dialog and the account dialog.
export function SystemAccountFields({ form, onChange, roles, tags, errors }: {
  form: SystemAccountForm;
  onChange: (patch: Partial<SystemAccountForm>) => void;
  roles: SystemAccountRole[];
  tags: ContactTag[];
  errors: Record<string, string>;
}) {
  const { t, i18n } = useTranslation();
  const toggleTag = (code: string) =>
    onChange({ tags: form.tags.includes(code) ? form.tags.filter((c) => c !== code) : [...form.tags, code] });

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 space-y-1">
        <Label htmlFor="sa-name">{t('admin.systemAccounts.name', { defaultValue: 'Name' })}</Label>
        <Input id="sa-name" value={form.name} maxLength={200} onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t('admin.systemAccounts.namePlaceholder', { defaultValue: 'e.g. ARM AES' })} className={SOFT_RING} />
        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
      </div>
      <div className="col-span-2 space-y-1">
        <Label htmlFor="sa-description">{t('admin.systemAccounts.description', { defaultValue: 'Description' })}</Label>
        <Input id="sa-description" value={form.description} maxLength={500} onChange={(e) => onChange({ description: e.target.value })}
          placeholder={t('admin.systemAccounts.descriptionPlaceholder', { defaultValue: 'What this system sends and who owns it' })} className={SOFT_RING} />
      </div>
      <div className="space-y-1">
        <Label>{t('admin.systemAccounts.role', { defaultValue: 'Role' })}</Label>
        <Select value={form.roleId} onValueChange={(v) => onChange({ roleId: v })}>
          <SelectTrigger><SelectValue placeholder={t('admin.systemAccounts.rolePlaceholder', { defaultValue: 'Choose a role' })} /></SelectTrigger>
          <SelectContent>
            {roles.map((r) => <SelectItem key={r.ID} value={String(r.ID)}>{formatRole(r.ROLE_NAME)}</SelectItem>)}
          </SelectContent>
        </Select>
        {roles.length === 0 && (
          <p className="text-xs text-slate-500">
            {t('admin.systemAccounts.noRoles', { defaultValue: 'No role grants integration permissions only. Create one under Roles first.' })}
          </p>
        )}
        {errors.roleId && <p className="text-xs text-red-600">{errors.roleId}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="sa-ttl">{t('admin.systemAccounts.tokenLifetime', { defaultValue: 'Token lifetime (minutes)' })}</Label>
        <Input id="sa-ttl" type="number" min={SYSTEM_ACCOUNT_MIN_TTL_MINUTES} max={SYSTEM_ACCOUNT_MAX_TTL_MINUTES} value={form.ttl}
          onChange={(e) => onChange({ ttl: e.target.value })} className={SOFT_RING} />
        {errors.ttl && <p className="text-xs text-red-600">{errors.ttl}</p>}
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label>{t('admin.systemAccounts.allowedTags', { defaultValue: 'Contact tags it may set or remove' })}</Label>
        {tags.length === 0 ? (
          <p className="text-xs text-slate-500">{t('admin.systemAccounts.noTags', { defaultValue: 'No active contact tags.' })}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const on = form.tags.includes(tag.CODE);
              const label = (i18n.language === 'ar' ? tag.NAME_AR : tag.NAME_EN) || tag.CODE;
              return (
                <button
                  key={tag.CODE}
                  type="button"
                  onClick={() => toggleTag(tag.CODE)}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${on
                    ? 'border-[#A29374] bg-[#F4F0E8] text-[#87795D]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  {on && <Check className="h-3 w-3" />}
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const emptySystemAccountForm = (ttl: number): SystemAccountForm => ({ name: '', description: '', roleId: '', ttl: String(ttl), tags: [] });

// Field errors for the form, or an empty object when it can be saved.
export function validateSystemAccountForm(form: SystemAccountForm, t: TFunction): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.name.trim()) e.name = t('admin.systemAccounts.nameRequired', { defaultValue: 'A name is required.' });
  if (!form.roleId) e.roleId = t('admin.systemAccounts.roleRequired', { defaultValue: 'Choose a role.' });
  const ttl = Number(form.ttl);
  if (!Number.isInteger(ttl) || ttl < SYSTEM_ACCOUNT_MIN_TTL_MINUTES || ttl > SYSTEM_ACCOUNT_MAX_TTL_MINUTES) {
    e.ttl = t('admin.systemAccounts.ttlRange', {
      defaultValue: 'Between {{min}} and {{max}} minutes.', min: SYSTEM_ACCOUNT_MIN_TTL_MINUTES, max: SYSTEM_ACCOUNT_MAX_TTL_MINUTES,
    });
  }
  return e;
}
