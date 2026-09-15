import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-adaam text-white',
        success: 'bg-pos-tint text-pos-text',
        warning: 'bg-warn-tint text-warn-text',
        destructive: 'bg-neg-tint text-neg-text',
        info: 'bg-info-tint text-info-text',
        secondary: 'bg-slate-100 text-slate-600',
        outline: 'border border-slate-300 text-slate-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
