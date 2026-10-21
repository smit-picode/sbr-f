'use client';

import { useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PASSWORD_MIN_LENGTH } from '../constants';
import { PASSWORD_RULE_KEYS, passwordRuleMet, type PasswordRuleKey } from '../utils/password';

interface Props {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  disabled?: boolean;
  idPrefix?: string;
}

const RULE_DEFAULTS: Record<PasswordRuleKey, string> = {
  length: 'At least {{min}} characters',
  letter: 'At least one letter',
  digit: 'At least one digit',
};

// New password and its confirmation, with the rules ticked off as the user types.
export function NewPasswordFields({ password, confirm, onPasswordChange, onConfirmChange, disabled, idPrefix = 'new-password' }: Props) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-value`} className="text-slate-700 font-medium">
          {t('password.newPassword', { defaultValue: 'New password' })}
        </Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-value`}
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            autoComplete="new-password"
            disabled={disabled}
            className="pe-10 focus:border-[#A29374]/40 focus:ring-[#A29374]/20"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            disabled={disabled}
            aria-label={show ? t('password.hide', { defaultValue: 'Hide password' }) : t('password.show', { defaultValue: 'Show password' })}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <ul className="space-y-0.5 pt-1">
          {PASSWORD_RULE_KEYS.map((rule) => {
            const met = passwordRuleMet(rule, password);
            return (
              <li key={rule} className={cn('flex items-center gap-1.5 text-xs', met ? 'text-emerald-600' : 'text-slate-400')}>
                <Check className={cn('h-3.5 w-3.5', !met && 'opacity-40')} />
                {t(`password.rules.${rule}`, { defaultValue: RULE_DEFAULTS[rule], min: PASSWORD_MIN_LENGTH })}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-confirm`} className="text-slate-700 font-medium">
          {t('password.confirmPassword', { defaultValue: 'Confirm the new password' })}
        </Label>
        <Input
          id={`${idPrefix}-confirm`}
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => onConfirmChange(e.target.value)}
          autoComplete="new-password"
          disabled={disabled}
          className="focus:border-[#A29374]/40 focus:ring-[#A29374]/20"
        />
        {mismatch && <p className="text-xs text-red-600">{t('password.mismatch', { defaultValue: 'The two passwords do not match.' })}</p>}
      </div>
    </div>
  );
}
