import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adaam/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
