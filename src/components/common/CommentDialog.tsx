'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  isLoading: boolean;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
  // Optional advisory note shown above the comment field (e.g. "still linked to a group") —
  // informational only, never blocks onConfirm. Omit for the default behavior (no note).
  warning?: string;
}

export function CommentDialog({ open, isLoading, onConfirm, onCancel, warning }: Props) {
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
          {warning && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700">{warning}</p>
            </div>
          )}
          <div className="space-y-1">
            <Label>
              {t('comment.label')} <span className="text-red-500">*</span>
            </Label>
            <textarea
              className={`w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#A71D3A]/40 focus:border-[#A71D3A]/40 ${
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
          <Button onClick={handleConfirm} disabled={isLoading || submitting || !comment.trim()} style={{ background: 'linear-gradient(135deg, #A71D3A, #6B1428)', border: 'none' }} className="text-white">
            {isLoading || submitting ? t('actions.saving') : t('actions.confirmSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
