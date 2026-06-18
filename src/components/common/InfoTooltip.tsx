'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  /** Tooltip body content (string or node). */
  content: ReactNode;
  /** Side the tooltip opens on. Defaults to 'top'. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Extra classes for the trigger icon (e.g. a size override). */
  iconClassName?: string;
  /** Extra classes for the tooltip content box (e.g. a max-width override). */
  contentClassName?: string;
}

/**
 * Shared info "ⓘ" hint: a small Info icon that reveals a tooltip on hover.
 * Wraps the existing Radix tooltip primitive so the look/behaviour stays
 * consistent everywhere it's used.
 */
export function InfoTooltip({ content, side = 'top', iconClassName, contentClassName }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className={cn('h-3.5 w-3.5 text-slate-400 cursor-help shrink-0', iconClassName)} />
        </TooltipTrigger>
        <TooltipContent side={side} className={cn('max-w-[200px] text-center text-xs', contentClassName)}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
