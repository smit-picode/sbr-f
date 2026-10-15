'use client';

import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Info icon beside a field label in an edit dialog; the tooltip says why the field is greyed out.
export function PendingFieldInfo({ pending }: { pending: boolean }) {
  const { t } = useTranslation();
  if (!pending) return null;
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="ms-1.5 inline-flex cursor-help align-middle">
            <Info className="h-3.5 w-3.5 text-amber-600" />
          </span>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="top" className="z-[100] max-w-[240px] text-center text-xs">
            {t('common.pendingFieldTooltip', { defaultValue: "This field has a change waiting for approval. It can't be edited until that change is approved or rejected." })}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
}
