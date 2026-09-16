'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Landmark,
  ShieldCheck,
  UserCircle2,
  ChevronRight,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setCredentials, logout } from '../authSlice';
import { useLoginMutation, useSwitchRoleMutation } from '../api/authApi';
import { LOGIN_SELECTED_ROLE_KEY } from '../constants';
import { useAppDispatch } from '@/hooks';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/i18n';
import type { AuthRole } from '@/types';

// Visual rotation for role cards — purely decorative
const ROLE_CARD_ICONS: LucideIcon[] = [ShieldCheck, Building2, Eye, Landmark, UserCircle2];
const ROLE_CARD_TINTS: { bg: string; color: string }[] = [
  { bg: 'bg-violet-50', color: 'text-violet-600' },
  { bg: 'bg-rose-50', color: 'text-[#A29374]' },
  { bg: 'bg-blue-50', color: 'text-blue-700' },
  { bg: 'bg-amber-50', color: 'text-amber-600' },
  { bg: 'bg-emerald-50', color: 'text-emerald-600' },
];

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { isArabic, toggleLanguage } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  // Set after successful credentials when the user holds more than one role
  const [pendingRoles, setPendingRoles] = useState<AuthRole[] | null>(null);
  const [switchingRoleId, setSwitchingRoleId] = useState<number | null>(null);
  const [loginMutation, { isLoading }] = useLoginMutation();
  const [switchRoleMutation] = useSwitchRoleMutation();
  // Synchronous guard against a second submit landing before React re-renders the button as
  // disabled (isLoading only flips after the mutation actually starts) — a fast double-click
  // or double-tap can otherwise fire onSubmit twice in the same tick.
  const isSubmittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoginError(null);
    try {
      const result = await loginMutation(values).unwrap();
      const data = result.data!;
      dispatch(setCredentials(data));
      if ((data.roles?.length ?? 0) > 1) {
        setPendingRoles(data.roles!);
      } else {
        router.push('/establishments');
      }
    } catch (err) {
      const apiMsg = (err as { data?: { message?: string } })?.data?.message;
      setLoginError(apiMsg || t('login.invalidCredentials', { defaultValue: 'Invalid email or password. Please try again.' }));
    } finally {
      isSubmittingRef.current = false;
    }
  }

  async function handleRolePick(role: AuthRole) {
    setSwitchingRoleId(role.ID);
    try {
      const result = await switchRoleMutation({ roleId: role.ID }).unwrap();
      dispatch(setCredentials(result.data!));
      try {
        localStorage.setItem(LOGIN_SELECTED_ROLE_KEY, String(role.ID));
      } catch {
        // Ignore storage failures
      }
      router.push('/establishments');
    } catch {
      setSwitchingRoleId(null);
      setLoginError(t('login.roleSwitchFailed', { defaultValue: 'Could not switch to that role. Please try again.' }));
    }
  }

  function handleBackToLogin() {
    dispatch(logout());
    setPendingRoles(null);
    setSwitchingRoleId(null);
    setLoginError(null);
  }

  return (
    <div className="min-h-screen flex bg-white p-4 gap-4">
      {/* Left Side: skyline photo card (QInsights style) — one unified p-9 container with
          justify-between (matching the reference exactly) so the brand chip and the bottom
          text block share the same left inset instead of drifting apart (p-8 vs px-8/bottom-10). */}
      <div className="hidden md:flex md:w-[46%] relative overflow-hidden rounded-3xl text-white">
        <div
          className="absolute inset-0"
          style={{ background: "#0E1A2B url('/assets/login-skyline.jpg') center / cover no-repeat" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(10,20,40,.15) 0%, rgba(10,20,40,.35) 60%, rgba(10,20,40,.85) 100%)' }}
        />

        <div className="relative flex flex-col justify-between w-full p-9">
          {/* Matches SBR-design's own login page exactly: the white-on-transparent primary
              logo (its own PNG carries "National Planning Council" / "State of Qatar") sitting
              directly on the photo, no card behind it — not the secondary/regular-color mark
              used elsewhere, which needs a light background to read. */}
          <div className="flex flex-col items-start gap-3">
            <Image src="/assets/npc-logo-primary-white.png" alt="National Planning Council" width={257} height={90} className="h-16 w-auto object-contain -ms-2" priority />
            <span className="text-[15px] font-bold ps-0.5">SBR Portal</span>
          </div>

          <div>
            <h2 className="text-[40px] font-extrabold leading-[1.1] max-w-md">{t('login.branding')}</h2>
            <p className="text-[15px] text-white/85 mt-4 max-w-md leading-relaxed">{t('login.brandingSub')} · {t('login.brandingCountry')}</p>
            <p className="text-[12px] text-white/60 mt-6">© {new Date().getFullYear()} {t('login.copyright')}</p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full md:w-[54%] flex items-center justify-center p-6 md:p-12 lg:p-16 bg-white relative">
        {/* Language Toggle — single word for the OTHER language, matching the reference
            (not a bilingual "Arabic  عربي" pairing). */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="absolute top-4 end-4 md:top-6 md:end-8 inline-flex items-center h-9 px-4 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-input"
        >
          {isArabic ? 'English' : 'عربي'}
        </button>

        <div className={pendingRoles ? 'w-full max-w-md' : 'w-full max-w-sm'}>
          {/* Mobile Header */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">SBR Portal</h1>
            <p className="text-sm text-slate-500 mt-1">Statistical Business Register</p>
            <p className="text-xs text-slate-400">NPC Qatar</p>
          </div>

          {/* Step 1 — Credentials */}
          {!pendingRoles && (
            <>
          <div className="mt-20 mb-3">
            <h2 className="text-3xl font-extrabold text-dune-deep">{t('login.title')}</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {loginError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {loginError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                {t('login.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                {t('login.password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  disabled={isLoading}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className={`btn-sign-in group relative w-full h-12 mt-2 rounded-full font-bold text-white tracking-wide overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:translate-y-0 ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
              style={{
                background: 'linear-gradient(135deg, #C0AC86 0%, #A29374 55%, #776848 100%)',
                boxShadow: '0 10px 24px -6px rgba(119,104,72,0.45)',
              }}
            >
              {/* One-shot diagonal shine sweep on hover — purely decorative, disabled state skips it via CSS */}
              <span className="btn-sign-in-shine pointer-events-none absolute inset-0" />
              <span className="relative inline-flex items-center justify-center gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? t('login.signingIn') : t('login.signIn')}
              </span>
            </button>
          </form>
            </>
          )}

          {/* Step 2 — Role selection (only when the user holds multiple roles) */}
          {pendingRoles && (
            <>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#A29374] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                {t('login.backToLogin')}
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900">{t('login.chooseRoleTitle')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('login.chooseRoleSubtitle')}</p>
              </div>

              {loginError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {loginError}
                </div>
              )}

              <div className="space-y-3">
                {pendingRoles.map((role, idx) => {
                  const Icon = ROLE_CARD_ICONS[idx % ROLE_CARD_ICONS.length];
                  const tint = ROLE_CARD_TINTS[idx % ROLE_CARD_TINTS.length];
                  const switching = switchingRoleId === role.ID;
                  return (
                    <button
                      key={role.ID}
                      type="button"
                      disabled={switchingRoleId !== null}
                      onClick={() => handleRolePick(role)}
                      className="w-full flex items-center gap-4 rounded-xl bg-white p-4 text-start shadow-card hover:border-[#A29374]/40 hover:shadow transition-all group disabled:opacity-60"
                    >
                      <span className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${tint.bg}`}>
                        {switching
                          ? <Loader2 className={`h-5 w-5 animate-spin ${tint.color}`} />
                          : <Icon className={`h-5 w-5 ${tint.color}`} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">{role.ROLE_NAME}</span>
                        {role.IS_SCOPED && (
                          <span className="block text-[10px] font-bold tracking-wide text-[#A29374] mt-0.5">
                            {t('admin.users.scopedBadge')}
                          </span>
                        )}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#A29374] transition-colors rtl:rotate-180" />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-slate-400 mt-6">{t('login.roleNote')}</p>
            </>
          )}

          <p className="text-center text-xs text-slate-400 mt-8">
            © {new Date().getFullYear()} {t('login.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
}
