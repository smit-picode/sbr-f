'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch } from '@/hooks';
import { toast } from '@/utils/toast';
import { useChangePasswordMutation } from '../api/authApi';
import { replaceToken } from '../authSlice';
import { passwordAcceptable } from '../utils/password';
import { NewPasswordFields } from './NewPasswordFields';

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const close = () => {
    setCurrent('');
    setPassword('');
    setConfirm('');
    onClose();
  };

  const save = async () => {
    if (!current) { toast.error(t('password.change.currentRequired', { defaultValue: 'Enter your current password.' })); return; }
    if (!passwordAcceptable(password)) { toast.error(t('password.notAcceptable', { defaultValue: 'The password does not meet the rules below.' })); return; }
    if (password !== confirm) { toast.error(t('password.mismatch', { defaultValue: 'The two passwords do not match.' })); return; }
    if (password === current) { toast.info(t('password.change.same', { defaultValue: 'The new password is the same as the current one.' })); return; }
    try {
      const res = await changePassword({ currentPassword: current, newPassword: password }).unwrap();
      if (res.data?.token) dispatch(replaceToken(res.data.token));
      toast.success(t('password.change.done', { defaultValue: 'Your password was changed. Other sessions have been signed out.' }));
      close();
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      toast.error(msg ?? t('password.change.failed', { defaultValue: 'The password could not be changed. Please try again.' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isLoading) close(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('password.change.title', { defaultValue: 'Change password' })}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); void save(); }}
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-slate-700 font-medium">
              {t('password.change.current', { defaultValue: 'Current password' })}
            </Label>
            <Input
              id="current-password"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
              className="focus:border-[#A29374]/40 focus:ring-[#A29374]/20"
            />
          </div>
          <NewPasswordFields
            password={password}
            confirm={confirm}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirm}
            disabled={isLoading}
            idPrefix="change-password"
          />
          <p className="text-xs text-slate-500">
            {t('password.change.hint', { defaultValue: 'You stay signed in here; every other session is signed out, and you get a confirmation email.' })}
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={isLoading}>{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button type="submit" loading={isLoading} disabled={isLoading}>{t('password.change.submit', { defaultValue: 'Change password' })}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
