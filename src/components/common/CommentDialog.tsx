'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  isLoading: boolean;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

export function CommentDialog({ open, isLoading, onConfirm, onCancel }: Props) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (open) { setComment(''); setError(''); setSubmitting(false); }
  }, [open]);

  // Reset submitting when the API call finishes (success or error).
  // On success the dialog closes anyway; on error this re-enables the button.
  useEffect(() => {
    if (!isLoading) setSubmitting(false);
  }, [isLoading]);

  const handleConfirm = () => {
    if (!comment.trim()) { setError(t('comment.required')); return; }
    // Guard against double-submit: isLoading from RTK Query updates on the next
    // render cycle, leaving a window where a second click can fire a duplicate request.
    if (submitting) return;
    setSubmitting(true);
    onConfirm(comment.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('comment.title')}</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-2">
          <p className="text-sm text-slate-500">{t('comment.description')}</p>
          <div className="space-y-1">
            <Label>
              {t('comment.label')} <span className="text-red-500">*</span>
            </Label>
            <textarea
              className={`w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2B7A9E] focus:ring-offset-1 ${
                error ? 'border-red-400' : 'border-slate-200'
              }`}
              rows={4}
              placeholder={t('comment.placeholder')}
              value={comment}
              onChange={(e) => { setComment(e.target.value); if (error) setError(''); }}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || submitting || !comment.trim()}>
            {isLoading || submitting ? t('actions.saving') : t('actions.confirmSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
