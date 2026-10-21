'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus } from 'lucide-react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { NoData } from '@/components/common/NoData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/utils/toast';
import { useHasPermission } from '@/hooks/usePermission';
import { useGetContactTagsQuery, useSaveContactTagMutation } from '../api/contactTagsApi';
import type { ContactTag, SaveContactTagInput } from '@/types';
import { TAG_TEXT_FIELDS, TAG_TEXT_PATTERN } from '../constants';

// The tag registry: the code is permanent, and retiring a tag hides it but keeps its history.

const CODE_RE = /^[A-Za-z0-9_]{1,30}$/;

const EMPTY: SaveContactTagInput = {
  code: '', nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
  onePerEstablishment: true, isActive: true, displayOrder: null,
};

function TagDialog({ tag, open, onClose }: { tag: ContactTag | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<SaveContactTagInput>(EMPTY);
  const [error, setError] = useState('');
  const [saveTag, { isLoading }] = useSaveContactTagMutation();

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(tag ? {
      code: tag.CODE,
      nameEn: tag.NAME_EN ?? '',
      nameAr: tag.NAME_AR ?? '',
      descriptionEn: tag.DESCRIPTION_EN ?? '',
      descriptionAr: tag.DESCRIPTION_AR ?? '',
      onePerEstablishment: tag.ONE_PER_ESTABLISHMENT === 'Y',
      isActive: tag.IS_ACTIVE === 'Y',
      displayOrder: tag.DISPLAY_ORDER,
    } : EMPTY);
  }, [open, tag]);

  const set = (patch: Partial<SaveContactTagInput>) => setForm((f) => ({ ...f, ...patch }));

  // The first name or description that breaks a text rule, as the message to show.
  const textError = (): string | null => {
    for (const { field, arabic } of TAG_TEXT_FIELDS) {
      const value = (form[field] ?? '').trim();
      if (!value) continue;
      const label = t(`contactTags.registry.${field}`);
      if (TAG_TEXT_PATTERN.DIGITS_ONLY.test(value)) return t('contactTags.registry.digitsOnly', { field: label });
      if (arabic && (TAG_TEXT_PATTERN.LATIN_LETTER.test(value) || !TAG_TEXT_PATTERN.ARABIC_LETTER.test(value))) {
        return t('contactTags.registry.arabicOnly', { field: label });
      }
    }
    return null;
  };

  const submit = async () => {
    if (!CODE_RE.test(form.code)) { setError(t('contactTags.registry.badCode')); return; }
    if (!(form.nameEn ?? '').trim() && !(form.nameAr ?? '').trim()) { setError(t('contactTags.registry.needName')); return; }
    const invalidText = textError();
    if (invalidText) { setError(invalidText); return; }
    try {
      await saveTag({ ...form, code: form.code.toUpperCase() }).unwrap();
      toast.success(t('contactTags.registry.saved'));
      onClose();
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message ?? t('contactTags.registry.saveFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tag ? t('contactTags.registry.editTitle') : t('contactTags.registry.newTitle')}</DialogTitle>
          <DialogDescription>{t('contactTags.registry.dialogHint')}</DialogDescription>
        </DialogHeader>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1">
            <Label>{t('contactTags.registry.code')}</Label>
            <Input
              value={form.code}
              disabled={!!tag}
              maxLength={30}
              className="font-mono uppercase"
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('contactTags.registry.nameEn')}</Label>
            <Input value={form.nameEn ?? ''} maxLength={200} onChange={(e) => set({ nameEn: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t('contactTags.registry.nameAr')}</Label>
            <Input dir="rtl" value={form.nameAr ?? ''} maxLength={200} onChange={(e) => set({ nameAr: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>{t('contactTags.registry.descriptionEn')}</Label>
            <Input value={form.descriptionEn ?? ''} maxLength={1000} onChange={(e) => set({ descriptionEn: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>{t('contactTags.registry.descriptionAr')}</Label>
            <Input dir="rtl" value={form.descriptionAr ?? ''} maxLength={1000} onChange={(e) => set({ descriptionAr: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t('contactTags.registry.displayOrder')}</Label>
            <Input
              type="number"
              value={form.displayOrder ?? ''}
              onChange={(e) => set({ displayOrder: e.target.value === '' ? null : Math.trunc(Number(e.target.value)) })}
            />
          </div>
          <div className="col-span-2 flex items-start gap-2">
            <Checkbox
              id="tag-one-per"
              checked={!!form.onePerEstablishment}
              onCheckedChange={(v) => set({ onePerEstablishment: v === true })}
            />
            <div>
              <Label htmlFor="tag-one-per">{t('contactTags.registry.onePer')}</Label>
              <p className="text-[11px] text-slate-400">{t('contactTags.registry.onePerHint')}</p>
            </div>
          </div>
          <div className="col-span-2 flex items-start gap-2">
            <Checkbox
              id="tag-active"
              checked={!!form.isActive}
              onCheckedChange={(v) => set({ isActive: v === true })}
            />
            <div>
              <Label htmlFor="tag-active">{t('contactTags.registry.active')}</Label>
              <p className="text-[11px] text-slate-400">{t('contactTags.registry.activeHint')}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('actions.cancel')}</Button>
          <Button onClick={submit} loading={isLoading}>{t('actions.saveChanges')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ContactTagsRegistryPage() {
  const { t } = useTranslation();
  const canView = useHasPermission('contacts.view');
  const canManage = useHasPermission('contact_tags.manage');
  const { data, isLoading, isError, refetch } = useGetContactTagsQuery({ includeInactive: true }, { skip: !canView });
  const [editing, setEditing] = useState<ContactTag | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const open = (tag: ContactTag | null) => { setEditing(tag); setDialogOpen(true); };

  if (!canView) {
    return (
      <PageContainer>
        <div className="rounded-lg bg-white p-8 text-center shadow-card">
          <p className="text-sm text-slate-500">{t('admin.panel.accessDeniedDesc')}</p>
        </div>
      </PageContainer>
    );
  }

  const tags = data?.data ?? [];

  return (
    <PageContainer>
      <PageHeader
        title={t('contactTags.registry.title')}
        description={t('contactTags.registry.description')}
        actions={canManage ? (
          <Button className="gap-1.5" onClick={() => open(null)}>
            <Plus className="h-4 w-4" /> {t('contactTags.registry.newButton')}
          </Button>
        ) : undefined}
      />

      <div className="rounded-lg bg-white shadow-card">
        {isLoading ? (
          <PageLoader />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : tags.length === 0 ? (
          <NoData message={t('contactTags.registry.empty')} description={t('contactTags.registry.emptyHint')} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('contactTags.registry.code')}</TableHead>
                <TableHead>{t('contactTags.registry.name')}</TableHead>
                <TableHead>{t('contactTags.registry.rule')}</TableHead>
                <TableHead>{t('contactTags.registry.status')}</TableHead>
                <TableHead className="text-end">{t('contactTags.registry.openTags')}</TableHead>
                {canManage && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.CODE} className={tag.IS_ACTIVE === 'Y' ? '' : 'opacity-60'}>
                  <TableCell className="font-mono text-[12px] font-semibold">{tag.CODE}</TableCell>
                  <TableCell>
                    <div className="text-[13px] text-slate-800">{tag.NAME_EN}</div>
                    {tag.NAME_AR && <div dir="rtl" className="text-[12px] text-slate-500">{tag.NAME_AR}</div>}
                    {tag.DESCRIPTION_EN && <div className="text-[11px] text-slate-400">{tag.DESCRIPTION_EN}</div>}
                  </TableCell>
                  <TableCell className="text-[12px] text-slate-600">
                    {tag.ONE_PER_ESTABLISHMENT === 'Y' ? t('contactTags.registry.onePerShort') : t('contactTags.registry.manyShort')}
                  </TableCell>
                  <TableCell>
                    {tag.IS_ACTIVE === 'Y'
                      ? <Badge variant="success">{t('contactTags.registry.activeShort')}</Badge>
                      : <Badge variant="secondary">{t('contactTags.registry.retiredShort')}</Badge>}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">{tag.OPEN_TAGS.toLocaleString()}</TableCell>
                  {canManage && (
                    <TableCell className="text-end">
                      <Button size="sm" variant="ghost" className="gap-1" onClick={() => open(tag)}>
                        <Pencil className="h-3.5 w-3.5" /> {t('actions.edit', { defaultValue: 'Edit' })}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {canManage && <TagDialog tag={editing} open={dialogOpen} onClose={() => setDialogOpen(false)} />}
    </PageContainer>
  );
}
