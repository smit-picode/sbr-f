'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDialog({ open, title, message, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md w-[calc(100vw-32px)]">
        <DialogHeader className="text-start">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-1">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>{t('analysis.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button variant="destructive" onClick={onConfirm}>{t('analysis.delete', { defaultValue: 'Delete' })}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
