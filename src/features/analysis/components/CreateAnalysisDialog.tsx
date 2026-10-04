'use client';

import { useEffect, useState } from 'react';
import { Copy, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnalysisIcon } from './AnalysisIcon';

export interface CreateAnalysisRequest {
  kind: 'blank' | 'template' | 'duplicate';
  name: string;
  description: string;
  icon?: string;
  blockCount: number;
}

interface Props {
  request: CreateAnalysisRequest | null;
  onCancel: () => void;
  onConfirm: (name: string, description: string) => void;
}

// Confirms every "create" so a repeated click can never spawn duplicate analyses.
export function CreateAnalysisDialog({ request, onCancel, onConfirm }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Reset only when the dialog opens — callers may pass a fresh request object on every render.
  const open = !!request;
  useEffect(() => {
    if (!open || !request) return;
    setName(request.name);
    setDescription(request.description);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = () => {
    if (!name.trim()) return;
    onConfirm(name.trim(), description.trim());
  };

  const title = request?.kind === 'duplicate'
    ? t('analysis.create.duplicateTitle', { defaultValue: 'Duplicate analysis' })
    : request?.kind === 'template'
      ? t('analysis.create.templateTitle', { defaultValue: 'Create from template' })
      : t('analysis.create.blankTitle', { defaultValue: 'New analysis' });

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md w-[calc(100vw-32px)]">
        <DialogHeader className="text-start">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 shrink-0 rounded-xl bg-adaam-tint text-adaam-deep flex items-center justify-center">
              {request?.kind === 'duplicate' ? <Copy className="h-5 w-5" /> : request?.icon ? <AnalysisIcon name={request.icon} className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="pt-1 text-[12.5px]">
                {request?.kind === 'duplicate'
                  ? t('analysis.create.duplicateBody', { defaultValue: 'A private copy with {{count}} blocks, owned by you. Shares are not copied.', count: request.blockCount })
                  : request?.kind === 'template'
                    ? t('analysis.create.templateBody', { defaultValue: 'Starts with {{count}} ready-made blocks you can change freely.', count: request.blockCount })
                    : t('analysis.create.blankBody', { defaultValue: 'Starts from an empty canvas.' })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <div className="space-y-1">
            <Label htmlFor="analysis-create-name">{t('analysis.create.name', { defaultValue: 'Name' })}</Label>
            <Input id="analysis-create-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={200} className="focus:border-[#A29374]/40 focus:ring-[#A29374]/20" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="analysis-create-description">{t('analysis.create.description', { defaultValue: 'Description (optional)' })}</Label>
            <Input id="analysis-create-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} className="focus:border-[#A29374]/40 focus:ring-[#A29374]/20" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>{t('analysis.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button type="submit" disabled={!name.trim()}>
              {request?.kind === 'duplicate' ? t('analysis.create.duplicateConfirm', { defaultValue: 'Duplicate' }) : t('analysis.create.confirm', { defaultValue: 'Create analysis' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
