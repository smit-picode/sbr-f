'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPasswordMutation } from '../api/authApi';
import { LOGIN_HREF } from '../constants';
import { AuthPageShell, AuthSubmitButton } from '../components/AuthPageShell';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t('password.forgot.invalidEmail', { defaultValue: 'Enter a valid email address.' }));
      return;
    }
    setError(null);
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      setSent(true);
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      setError(msg ?? t('common.somethingWentWrong', { defaultValue: 'Something went wrong. Please try again.' }));
    }
  }

  return (
    <AuthPageShell>
      <Link href={LOGIN_HREF} className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#A29374] transition-colors">
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        {t('login.backToLogin')}
      </Link>
      <h2 className="text-3xl font-extrabold text-dune-deep">{t('password.forgot.title', { defaultValue: 'Forgot your password?' })}</h2>

      {sent ? (
        <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex gap-3">
          <MailCheck className="h-5 w-5 shrink-0" />
          <p>
            {t('password.forgot.sent', {
              defaultValue: 'If an active account uses {{email}}, we have emailed it a link to choose a new password. The link works for 30 minutes.',
              email: email.trim(),
            })}
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-5" noValidate>
          <p className="text-sm text-slate-500">
            {t('password.forgot.subtitle', { defaultValue: 'Enter the email of your account and we will send you a link to choose a new password.' })}
          </p>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email" className="text-slate-700 font-medium">{t('login.email')}</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="focus:border-[#A29374]/40 focus:ring-[#A29374]/20"
            />
          </div>
          <AuthSubmitButton loading={isLoading}>{t('password.forgot.submit', { defaultValue: 'Send the link' })}</AuthSubmitButton>
        </form>
      )}
    </AuthPageShell>
  );
}
