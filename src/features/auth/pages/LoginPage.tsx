'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setCredentials } from '../authSlice';
import { useAppDispatch } from '@/hooks';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/i18n';
import { Logo } from '@/components/common/Logo';

const STATIC_USERS = [
  { email: 'admin@sbr.com', password: 'admin123', role: 'ADMIN' },
  { email: 'analyst@npc.qa', password: 'analyst123', role: 'ANALYST' },
  { email: 'viewer@npc.qa', password: 'viewer123', role: 'VIEWER' },
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
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  function onSubmit(values: LoginForm) {
    setLoginError(null);
    setIsLoading(true);

    // Simulate async for UX
    setTimeout(() => {
      const user = STATIC_USERS.find(
        (u) => u.email === values.email && u.password === values.password
      );

      if (!user) {
        setLoginError('Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      dispatch(setCredentials({ token: `static-token-${user.role}`, role: user.role, email: user.email }));
      router.push('/frame');
    }, 500);
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Gradient Background with Logo */}
      <div className="hidden md:flex md:w-1/2 lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #A71D3A 0%, #6B1428 30%, #1a3a52 100%)',
          }}
        />

        {/* Logo / Branding */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8">
          <Logo size="lg" src="/sbr-logo-white.png" />

          <div className="text-center">
            <h2 className="text-white text-xl font-bold tracking-wide">{t('login.branding')}</h2>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile Header */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">SBR Portal</h1>
            <p className="text-sm text-slate-500 mt-1">Statistical Business Register</p>
            <p className="text-xs text-slate-400">NPC Qatar</p>
          </div>

          {/* Language Toggle on login page */}
          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {isArabic ? <><span>إنجليزي</span> English</> : <><span>Arabic</span> عربي</>}
            </button>
          </div>

          {/* Form Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">{t('login.title')}</h2>
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
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              className="w-full h-11 rounded-full font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: isLoading
                  ? '#A71D3A'
                  : 'linear-gradient(90deg, #A71D3A 0%, #1a3a52 100%)',
              }}
            >
              {isLoading && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            © {new Date().getFullYear()} {t('login.copyright')}
          </p>
        </div>
      </div>
    </div>
  );
}
