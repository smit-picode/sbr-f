'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  iconClassName?: string;
  contentClassName?: string;
}

// Shared info "ⓘ" hint: a small Info icon that reveals a tooltip on hover.
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
