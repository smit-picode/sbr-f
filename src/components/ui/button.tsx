import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-[color,background-color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adaam/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 active:scale-[0.97] cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-adaam text-white hover:bg-adaam-deep',
        destructive: 'bg-neg text-white hover:bg-neg-text',
        outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
        secondary: 'bg-dune text-white hover:bg-dune-deep',
        ghost: 'text-slate-700 hover:bg-slate-100',
        link: 'text-blue-700 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 text-[13px]',
        sm: 'h-8 px-3.5 text-xs',
        lg: 'h-10 px-6 text-sm',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  // Busy state for async actions: spinner, disabled, aria-busy. Ignored with asChild.
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    if (asChild) {
      const Comp = Slot as unknown as 'button';
      return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled} {...props}>{children}</Comp>;
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }), loading && 'disabled:opacity-80')}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
