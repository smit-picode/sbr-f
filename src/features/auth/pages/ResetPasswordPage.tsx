'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useCheckPasswordLinkQuery, useRedeemPasswordLinkMutation } from '../api/authApi';
import { FORGOT_PASSWORD_HREF, LOGIN_HREF } from '../constants';
import { AuthPageShell, AuthSubmitButton } from '../components/AuthPageShell';
import { NewPasswordFields } from '../components/NewPasswordFields';
import { passwordAcceptable } from '../utils/password';

// Where an emailed link lands, for an invitation as well as a reset.
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const token = useSearchParams().get('token') ?? '';
  const { data, isLoading, isError } = useCheckPasswordLinkQuery(token, { skip: !token, refetchOnFocus: false });
  const [redeem, { isLoading: saving }] = useRedeemPasswordLinkMutation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const link = data?.data;
  const invite = link?.purpose === 'INVITE';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!passwordAcceptable(password)) {
      setError(t('password.notAcceptable', { defaultValue: 'The password does not meet the rules below.' }));
      return;
    }
    if (password !== confirm) {
      setError(t('password.mismatch', { defaultValue: 'The two passwords do not match.' }));
      return;
    }
    setError(null);
    try {
      await redeem({ token, password }).unwrap();
      setDone(true);
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      setError(msg ?? t('common.somethingWentWrong', { defaultValue: 'Something went wrong. Please try again.' }));
    }
  }

  const invalid = !token || isError || (!isLoading && !link);

  return (
    <AuthPageShell>
      <Link href={LOGIN_HREF} className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#A29374] transition-colors">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        {t('login.backToLogin')}
      </Link>

      {isLoading && token ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      ) : invalid ? (
        <>
          <h2 className="text-3xl font-extrabold text-dune-deep">{t('password.reset.invalidTitle', { defaultValue: 'This link no longer works' })}</h2>
          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>{t('password.reset.invalidBody', { defaultValue: 'The link is invalid, already used or expired. Ask for a new one; an invitation can be sent again by your administrator.' })}</p>
          </div>
          <Link href={FORGOT_PASSWORD_HREF} className="mt-6 inline-block text-sm font-semibold text-[#A29374] hover:underline">
            {t('password.reset.requestNew', { defaultValue: 'Request a new link' })}
          </Link>
        </>
      ) : done ? (
        <>
          <h2 className="text-3xl font-extrabold text-dune-deep">{t('password.reset.doneTitle', { defaultValue: 'Your password is set' })}</h2>
          <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>{t('password.reset.doneBody', { defaultValue: 'You can now sign in as {{email}} with your new password.', email: link?.email })}</p>
          </div>
          <Link href={LOGIN_HREF} className="mt-6 inline-block text-sm font-semibold text-[#A29374] hover:underline">
            {t('login.signIn')}
          </Link>
        </>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div>
            <h2 className="text-3xl font-extrabold text-dune-deep">
              {invite
                ? t('password.reset.inviteTitle', { defaultValue: 'Welcome to the SBR Portal' })
                : t('password.reset.title', { defaultValue: 'Choose a new password' })}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {invite
                ? t('password.reset.inviteSubtitle', { defaultValue: 'Choose the password for {{email}}.', email: link?.email })
                : t('password.reset.subtitle', { defaultValue: 'Set a new password for {{email}}.', email: link?.email })}
            </p>
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <NewPasswordFields password={password} confirm={confirm} onPasswordChange={setPassword} onConfirmChange={setConfirm} disabled={saving} />
          <AuthSubmitButton loading={saving}>
            {invite ? t('password.reset.inviteSubmit', { defaultValue: 'Set my password' }) : t('password.reset.submit', { defaultValue: 'Save the new password' })}
          </AuthSubmitButton>
        </form>
      )}
    </AuthPageShell>
  );
}
