'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  variant?: 'dark' | 'light';
  src?: string;
}

export function Logo({ size = 'md', className, showText = false, variant = 'dark', src = '/sbr-logo.png' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-64 h-64',
  };

  const textSizeClasses = {
    sm: { title: 'text-xs', subtitle: 'text-[8px]' },
    md: { title: 'text-sm', subtitle: 'text-[10px]' },
  };

  const textColorClasses = {
    dark: {
      title: 'text-white',
      subtitle: 'text-slate-400',
    },
    light: {
      title: 'text-slate-900',
      subtitle: 'text-slate-500',
    },
  };

  const colors = textColorClasses[variant];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src={src}
        alt="SBR Logo"
        width={size === 'sm' ? 28 : size === 'md' ? 40 : 256}
        height={size === 'sm' ? 28 : size === 'md' ? 40 : 256}
        priority
        className={cn('object-contain', sizeClasses[size])}
      />
      {showText && size !== 'lg' && (
        <div className="flex flex-col justify-center">
          <p className={cn('font-bold leading-none', textSizeClasses[size].title, colors.title)}>
            SBR
          </p>
          <p className={cn('leading-none mt-0.5', textSizeClasses[size].subtitle, colors.subtitle)}>
            NPC Qatar
          </p>
        </div>
      )}
    </div>
  );
}
