'use client';

import { useState } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { PasswordLinkPurpose, SbrUser } from '@/types';
import { toast } from '@/utils/toast';
import { useSendUserPasswordLinkMutation } from '../api/adminApi';

// Emails a user a link to set their password: an invitation for a new account, a reset for an existing one.
export function PasswordLinkDialog({ user, onClose }: { user: SbrUser | null; onClose: () => void }) {
  const { t } = useTranslation();
  const [sendLink] = useSendUserPasswordLinkMutation();
  const [sending, setSending] = useState<PasswordLinkPurpose | null>(null);

  const send = async (purpose: PasswordLinkPurpose) => {
    if (!user) return;
    setSending(purpose);
    try {
      await sendLink({ id: user.ID, purpose }).unwrap();
      toast.success(t('admin.users.linkSent', { defaultValue: 'A link was emailed to {{email}}.', email: user.EMAIL }));
      onClose();
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      toast.error(msg ?? t('admin.users.linkFailed', { defaultValue: 'The email could not be sent. Please try again.' }));
    } finally {
      setSending(null);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o && !sending) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.users.linkTitle', { defaultValue: 'Email a password link' })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            {t('admin.users.linkBody', {
              defaultValue: '{{name}} ({{email}}) gets an email with a link to choose a new password. You never see the password, and any earlier link stops working.',
              name: user?.NAME,
              email: user?.EMAIL,
            })}
          </p>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li className="flex gap-2">
              <Mail className="h-4 w-4 shrink-0 text-[#A29374]" />
              {t('admin.users.linkInviteHint', { defaultValue: 'Invitation: for someone who has not signed in yet. The link works for 3 days.' })}
            </li>
            <li className="flex gap-2">
              <KeyRound className="h-4 w-4 shrink-0 text-[#A29374]" />
              {t('admin.users.linkResetHint', { defaultValue: 'Password reset: for someone who forgot their password. The link works for 30 minutes.' })}
            </li>
          </ul>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={!!sending}>{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button variant="outline" onClick={() => void send('INVITE')} loading={sending === 'INVITE'} disabled={!!sending}>
            {t('admin.users.sendInvite', { defaultValue: 'Send invitation' })}
          </Button>
          <Button onClick={() => void send('RESET')} loading={sending === 'RESET'} disabled={!!sending}>
            {t('admin.users.sendReset', { defaultValue: 'Send reset link' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
