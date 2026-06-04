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

const STATIC_USERS = [
  { email: 'admin@npc.qa', password: 'admin123', role: 'ADMIN' },
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
          {/* Qatar National Emblem — dhow, palm trees, crossed swords */}
          <svg viewBox="0 0 160 180" className="w-44 h-44 opacity-95" fill="white">
            {/* Waves / water */}
            <path d="M30 130 Q45 124 60 130 Q75 136 90 130 Q105 124 120 130 Q135 136 130 130" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M35 138 Q50 132 65 138 Q80 144 95 138 Q110 132 125 138" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
            {/* Dhow hull */}
            <ellipse cx="80" cy="122" rx="34" ry="9" />
            {/* Mast */}
            <rect x="77" y="62" width="4" height="60" rx="2" />
            {/* Triangular sail */}
            <polygon points="81,64 115,118 81,118" opacity="0.9" />
            {/* Small flag on mast */}
            <polygon points="81,64 95,70 81,76" />
            {/* Left palm trunk */}
            <path d="M42 70 Q40 90 38 122" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
            {/* Left palm fronds */}
            <path d="M38 72 Q28 58 18 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M39 68 Q32 52 38 46" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M40 70 Q48 56 54 58" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M38 74 Q26 68 22 72" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Right palm trunk */}
            <path d="M118 70 Q120 90 122 122" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
            {/* Right palm fronds */}
            <path d="M122 72 Q132 58 142 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M121 68 Q128 52 122 46" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M120 70 Q112 56 106 58" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M122 74 Q134 68 138 72" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Left crossed sword */}
            <line x1="20" y1="155" x2="90" y2="148" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <polygon points="20,155 15,162 26,158" />
            <rect x="17" y="153" width="8" height="3" rx="1" transform="rotate(-6 17 153)" opacity="0.7"/>
            {/* Right crossed sword */}
            <line x1="140" y1="155" x2="70" y2="148" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <polygon points="140,155 145,162 134,158" />
            <rect x="135" y="153" width="8" height="3" rx="1" transform="rotate(6 135 153)" opacity="0.7"/>
          </svg>

          <div className="text-center">
            <h2 className="text-white text-xl font-bold tracking-wide">
              Statistical Business Register
            </h2>
            <p className="text-white/75 text-sm mt-2 font-medium">National Planning Council</p>
            <p className="text-white/60 text-xs mt-1">State of Qatar</p>
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

          {/* Form Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {loginError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {loginError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email address
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
                Password
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
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            © {new Date().getFullYear()} National Planning Council — Qatar
          </p>
        </div>
      </div>
    </div>
  );
}
